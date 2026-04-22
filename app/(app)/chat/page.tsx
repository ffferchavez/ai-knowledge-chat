import { redirect } from "next/navigation";

import { ChatClient } from "@/components/chat/chat-client";
import { siteConfig } from "@/lib/config";
import { ChatPageShell } from "@/components/chat/chat-page-shell";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceSnapshot } from "@/lib/workspace";

export const metadata = {
  title: `Chat — ${siteConfig.name}`,
};

export default async function ChatPage() {
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

  return (
    <ChatPageShell>
      <ChatClient
        key="chat-new"
        initialSessions={sessions ?? []}
        initialMessages={[]}
        initialSessionId={null}
      />
    </ChatPageShell>
  );
}
