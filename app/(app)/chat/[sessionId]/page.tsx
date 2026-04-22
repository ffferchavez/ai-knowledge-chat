import { notFound, redirect } from "next/navigation";

import { ChatClient } from "@/components/chat/chat-client";
import { ChatPageShell } from "@/components/chat/chat-page-shell";
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
    .schema("public")
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
    .schema("public")
    .from("chat_messages")
    .select("id, session_id, role, content, citations, created_at, attachments")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return (
    <ChatPageShell>
      <ChatClient
        key={`chat-session-${sessionId}`}
        initialSessions={sessions ?? []}
        initialMessages={(messages ?? []) as Parameters<typeof ChatClient>[0]["initialMessages"]}
        initialSessionId={sessionId}
      />
    </ChatPageShell>
  );
}
