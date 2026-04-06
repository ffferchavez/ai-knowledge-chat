import { notFound, redirect } from "next/navigation";

import { ChatClient } from "@/components/chat/chat-client";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceSnapshot } from "@/lib/workspace";

type ChatSessionPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function ChatSessionPage({ params }: ChatSessionPageProps) {
  const { sessionId } = await params;
  const workspace = await getWorkspaceSnapshot();
  if (!workspace) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("id, title, updated_at")
    .eq("knowledge_base_id", workspace.knowledgeBase.id)
    .eq("user_id", workspace.profile.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  const hasSession = (sessions ?? []).some((s) => s.id === sessionId);
  if (!hasSession) {
    notFound();
  }

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, session_id, role, content, citations, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return (
    <div className="flex w-full min-w-0 flex-col">
      <header className="w-full border-b border-black pb-8 sm:pb-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-ui-muted-dim">
          Chat
        </p>
        <h1 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-ui-text sm:mt-4 sm:text-3xl md:text-4xl">
          Grounded business Q&amp;A
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ui-muted sm:mt-6 sm:text-base">
          Ask questions in natural language and get answers with source
          citations.
        </p>
      </header>
      <ChatClient
        key={`chat-session-${sessionId}`}
        initialSessions={sessions ?? []}
        initialMessages={(messages ?? []) as Parameters<typeof ChatClient>[0]["initialMessages"]}
        initialSessionId={sessionId}
      />
    </div>
  );
}
