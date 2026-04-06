import { NextResponse } from "next/server";

import { getChatModel, getOpenAIClient } from "@/lib/server/openai";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { retrieveRelevantChunks } from "@/lib/server/retrieval";
import { logUsageEvent } from "@/lib/server/usage-events";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceSnapshot } from "@/lib/workspace";

type ChatRequest = {
  question?: string;
  sessionId?: string;
};

function buildContext(chunks: Awaited<ReturnType<typeof retrieveRelevantChunks>>) {
  return chunks
    .map(
      (chunk, index) =>
        `[${index + 1}] ${chunk.filename}\n${chunk.content.slice(0, 1800)}`,
    )
    .join("\n\n---\n\n");
}

function sourceAnchors(
  chunks: Awaited<ReturnType<typeof retrieveRelevantChunks>>,
  limit = 4,
) {
  return chunks.slice(0, limit).map((chunk, index) => ({
    id: index + 1,
    chunk_id: chunk.id,
    document_id: chunk.documentId,
    filename: chunk.filename,
    excerpt: chunk.content.slice(0, 220),
    score: Number(chunk.score.toFixed(4)),
  }));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await getWorkspaceSnapshot();
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 403 });
  }

  const rate = await checkRateLimit({
    key: `chat:${user.id}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a moment." },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as ChatRequest;
  const question = String(body.question ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }

  let sessionId = body.sessionId;
  if (sessionId) {
    const { data: existing } = await supabase
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
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        organization_id: workspace.organization.id,
        knowledge_base_id: workspace.knowledgeBase.id,
        title: question.slice(0, 72),
      })
      .select("id")
      .maybeSingle<{ id: string }>();
    if (createError || !created?.id) {
      return NextResponse.json(
        { error: createError?.message ?? "Could not create chat session." },
        { status: 500 },
      );
    }
    sessionId = created.id;
  }

  const { error: insertUserError } = await supabase.from("chat_messages").insert({
    session_id: sessionId,
    role: "user",
    content: question,
  });
  if (insertUserError) {
    return NextResponse.json({ error: insertUserError.message }, { status: 500 });
  }
  await logUsageEvent(supabase, {
    organizationId: workspace.organization.id,
    userId: workspace.profile.id,
    eventType: "chat_request",
    metadata: { session_id: sessionId, question_length: question.length },
  });

  const chunks = await retrieveRelevantChunks(supabase, {
    question,
    organizationId: workspace.organization.id,
    knowledgeBaseId: workspace.knowledgeBase.id,
    limit: 6,
  });

  if (chunks.length === 0) {
    const noContextAnswer =
      "I could not find enough relevant context in your indexed sources to answer confidently. Add or reindex sources that mention this topic, then ask again.";
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "assistant",
      content: noContextAnswer,
      citations: [],
    });
    await supabase
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sessionId);
    await logUsageEvent(supabase, {
      organizationId: workspace.organization.id,
      userId: workspace.profile.id,
      eventType: "chat_no_context",
      metadata: { session_id: sessionId },
    });
    return NextResponse.json({
      sessionId,
      answer: noContextAnswer,
      citations: [],
    });
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

  let answer = "I could not generate an answer right now.";
  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: getChatModel(),
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Question:\n${question}\n\nContext:\n${contextText || "No context found."}`,
        },
      ],
    });
    answer = completion.choices[0]?.message?.content?.trim() || answer;

    const anchorPattern = /\[\d+\]/;
    if (!anchorPattern.test(answer) && citations.length > 0) {
      const anchors = citations.map((c) => `[${c.id}]`).join(" ");
      answer = `${answer}\n\nSources: ${anchors}`;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OpenAI chat failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { error: insertAssistantError } = await supabase
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      role: "assistant",
      content: answer,
      citations,
    });
  if (insertAssistantError) {
    return NextResponse.json(
      { error: insertAssistantError.message },
      { status: 500 },
    );
  }

  await supabase
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);
  await logUsageEvent(supabase, {
    organizationId: workspace.organization.id,
    userId: workspace.profile.id,
    eventType: "chat_completed",
    metadata: { session_id: sessionId, citations: citations.length },
  });

  return NextResponse.json({
    sessionId,
    answer,
    citations,
  });
}
