import { NextResponse } from "next/server";

import { getChatModel, getOpenAIClient } from "@/lib/server/openai";
import { applyRateLimitHeaders, checkRateLimit } from "@/lib/server/rate-limit";
import { retrieveRelevantChunks } from "@/lib/server/retrieval";
import { logUsageEvent } from "@/lib/server/usage-events";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceSnapshot } from "@/lib/workspace";

type ChatRequest = {
  question?: string;
  sessionId?: string;
  rewindFromMessageId?: string;
  images?: Array<{ mime: string; data: string }>;
};

const MAX_CHAT_IMAGES = 6;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
type ImagePart = { mime: string; data: string };

function normalizeImages(body: ChatRequest): ImagePart[] {
  const raw = body.images;
  if (raw == null || (Array.isArray(raw) && raw.length === 0)) return [];
  if (!Array.isArray(raw)) throw new Error("INVALID_IMAGES");
  if (raw.length > MAX_CHAT_IMAGES) throw new Error("TOO_MANY_IMAGES");
  const out: ImagePart[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const mime = String((item as { mime?: string }).mime ?? "").trim();
    const data = String((item as { data?: string }).data ?? "").trim();
    if (!mime.startsWith("image/") || !data) throw new Error("INVALID_IMAGE_ENTRY");
    const approxBytes = (data.length * 3) / 4;
    if (approxBytes > MAX_IMAGE_BYTES) throw new Error("IMAGE_TOO_LARGE");
    out.push({ mime, data });
  }
  return out;
}

function buildContext(chunks: Awaited<ReturnType<typeof retrieveRelevantChunks>>) {
  return chunks
    .map((chunk, index) => `[${index + 1}] ${chunk.filename}\n${chunk.content.slice(0, 1800)}`)
    .join("\n\n---\n\n");
}

function sourceAnchors(chunks: Awaited<ReturnType<typeof retrieveRelevantChunks>>, limit = 4) {
  return chunks.slice(0, limit).map((chunk, index) => ({
    id: index + 1,
    chunk_id: chunk.id,
    document_id: chunk.documentId,
    filename: chunk.filename,
    excerpt: chunk.content.slice(0, 220),
    score: Number(chunk.score.toFixed(4)),
  }));
}

function imagePartsForOpenAI(images: ImagePart[]) {
  return images.map((img) => ({
    type: "image_url" as const,
    image_url: { url: `data:${img.mime};base64,${img.data}` },
  }));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceSnapshot();
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 403 });
  }

  const limitConfig = { limit: 20 };
  const rate = await checkRateLimit({
    key: `chat:${user.id}`,
    limit: limitConfig.limit,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Rate limit exceeded. Please wait a moment." }, { status: 429 }),
      rate,
      limitConfig,
    );
  }

  const body = (await request.json().catch(() => ({}))) as ChatRequest;
  const question = String(body.question ?? "").trim();

  let images: ImagePart[];
  try {
    images = normalizeImages(body);
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    const msg =
      code === "TOO_MANY_IMAGES"
        ? `You can attach at most ${MAX_CHAT_IMAGES} images.`
        : code === "IMAGE_TOO_LARGE"
          ? "One of the images is too large."
          : "Invalid image payload.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (!question && images.length === 0) {
    return NextResponse.json({ error: "Enter a message or attach an image." }, { status: 400 });
  }

  const rewindFromMessageId =
    typeof body.rewindFromMessageId === "string" && body.rewindFromMessageId.length > 0
      ? body.rewindFromMessageId
      : undefined;

  const displayLine = question || "(Image)";
  let sessionId = body.sessionId;
  if (sessionId) {
    const { data: existing } = await supabase
      .schema("intelligence")
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .eq("knowledge_base_id", workspace.knowledgeBase.id)
      .maybeSingle();
    if (!existing) sessionId = undefined;
  }

  if (!sessionId) {
    const { data: created, error: createError } = await supabase
      .schema("intelligence")
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        organization_id: workspace.organization.id,
        knowledge_base_id: workspace.knowledgeBase.id,
        title: displayLine.slice(0, 72),
      })
      .select("id")
      .maybeSingle<{ id: string }>();
    if (createError || !created?.id) {
      return NextResponse.json({ error: createError?.message ?? "Could not create chat session." }, { status: 500 });
    }
    sessionId = created.id;
  }

  if (rewindFromMessageId && sessionId) {
    const { data: pivot, error: pivotError } = await supabase
      .schema("intelligence")
      .from("chat_messages")
      .select("id, role, session_id")
      .eq("id", rewindFromMessageId)
      .eq("session_id", sessionId)
      .maybeSingle();
    if (pivotError || !pivot) {
      return NextResponse.json({ error: "Could not find message to edit." }, { status: 400 });
    }
    if (pivot.role !== "user") {
      return NextResponse.json({ error: "Only user messages can be edited this way." }, { status: 400 });
    }

    const { data: ordered, error: listError } = await supabase
      .schema("intelligence")
      .from("chat_messages")
      .select("id")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
    if (listError || !ordered?.length) {
      return NextResponse.json({ error: "Could not load messages for this session." }, { status: 500 });
    }
    const start = ordered.findIndex((row) => row.id === rewindFromMessageId);
    if (start === -1) {
      return NextResponse.json({ error: "Message is not part of this session." }, { status: 400 });
    }
    const idsToRemove = ordered.slice(start).map((row) => row.id);
    const { error: deleteError } = await supabase
      .schema("intelligence")
      .from("chat_messages")
      .delete()
      .in("id", idsToRemove);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const { error: insertUserError } = await supabase
    .schema("intelligence")
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      role: "user",
      content: displayLine,
      attachments: images.length ? images : null,
    });
  if (insertUserError) return NextResponse.json({ error: insertUserError.message }, { status: 500 });

  await logUsageEvent(supabase, {
    organizationId: workspace.organization.id,
    userId: workspace.profile.id,
    eventType: "chat_request",
    metadata: { session_id: sessionId, question_length: question.length, image_count: images.length },
  });

  const chunks = question
    ? await retrieveRelevantChunks(supabase, {
        question,
        organizationId: workspace.organization.id,
        knowledgeBaseId: workspace.knowledgeBase.id,
        limit: 6,
      })
    : [];

  if (chunks.length === 0 && images.length === 0) {
    const noContextAnswer =
      "I could not find enough relevant context in your indexed sources to answer confidently. Add or reindex sources that mention this topic, then ask again.";
    await supabase.schema("intelligence").from("chat_messages").insert({
      session_id: sessionId,
      role: "assistant",
      content: noContextAnswer,
      citations: [],
    });
    await supabase.schema("intelligence").from("chat_sessions").update({ updated_at: new Date().toISOString() }).eq("id", sessionId);
    await logUsageEvent(supabase, {
      organizationId: workspace.organization.id,
      userId: workspace.profile.id,
      eventType: "chat_no_context",
      metadata: { session_id: sessionId },
    });
    return applyRateLimitHeaders(NextResponse.json({ sessionId, answer: noContextAnswer, citations: [] }), rate, limitConfig);
  }

  const openai = getOpenAIClient();
  const model = getChatModel();

  if (chunks.length === 0 && images.length > 0) {
    const systemPrompt = [
      "You are a helpful assistant for business users.",
      "Describe images clearly and practically.",
      "If the image is unclear or unrelated, say so briefly.",
    ].join(" ");
    const userText = question
      ? `${question}\n\n(No matching indexed documents were found; answer using the image(s).)`
      : "Describe the attached image(s) and note anything relevant for a business user.";
    let answer = "I could not generate an answer right now.";
    try {
      const completion = await openai.chat.completions.create({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [{ type: "text", text: userText }, ...imagePartsForOpenAI(images)] },
        ],
      });
      answer = completion.choices[0]?.message?.content?.trim() || answer;
    } catch (error) {
      const message = error instanceof Error ? error.message : "OpenAI chat failed.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
    const { error: insertAssistantError } = await supabase.schema("intelligence").from("chat_messages").insert({
      session_id: sessionId,
      role: "assistant",
      content: answer,
      citations: [],
    });
    if (insertAssistantError) return NextResponse.json({ error: insertAssistantError.message }, { status: 500 });
    await supabase.schema("intelligence").from("chat_sessions").update({ updated_at: new Date().toISOString() }).eq("id", sessionId);
    await logUsageEvent(supabase, {
      organizationId: workspace.organization.id,
      userId: workspace.profile.id,
      eventType: "chat_completed",
      metadata: { session_id: sessionId, citations: 0 },
    });
    return applyRateLimitHeaders(NextResponse.json({ sessionId, answer, citations: [] }), rate, limitConfig);
  }

  const citations = sourceAnchors(chunks, 4);
  const contextText = buildContext(chunks);
  const systemPrompt = [
    "You are a business knowledge assistant.",
    "Answer using ONLY the provided context when possible.",
    "If context is insufficient, clearly say so and suggest what source to add.",
    "Keep answers concise and practical.",
    "Cite claims inline using bracket anchors like [1], [2] mapped to provided sources.",
  ].join(" ");

  const baseUserText = `Question:\n${question || "(See attached image(s).)"}\n\nContext:\n${contextText || "No context found."}`;
  let answer = "I could not generate an answer right now.";
  try {
    const userContent =
      images.length === 0
        ? baseUserText
        : [{ type: "text" as const, text: baseUserText }, ...imagePartsForOpenAI(images)];
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });
    answer = completion.choices[0]?.message?.content?.trim() || answer;
    if (!/\[\d+\]/.test(answer) && citations.length > 0) {
      const anchors = citations.map((c) => `[${c.id}]`).join(" ");
      answer = `${answer}\n\nSources: ${anchors}`;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenAI chat failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { error: insertAssistantError } = await supabase.schema("intelligence").from("chat_messages").insert({
    session_id: sessionId,
    role: "assistant",
    content: answer,
    citations,
  });
  if (insertAssistantError) return NextResponse.json({ error: insertAssistantError.message }, { status: 500 });

  await supabase.schema("intelligence").from("chat_sessions").update({ updated_at: new Date().toISOString() }).eq("id", sessionId);
  await logUsageEvent(supabase, {
    organizationId: workspace.organization.id,
    userId: workspace.profile.id,
    eventType: "chat_completed",
    metadata: { session_id: sessionId, citations: citations.length },
  });

  return applyRateLimitHeaders(NextResponse.json({ sessionId, answer, citations }), rate, limitConfig);
}
