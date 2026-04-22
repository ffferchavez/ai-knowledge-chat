import Link from "next/link";
import { redirect } from "next/navigation";

import { SavedSessionActions } from "@/components/chat/saved-session-actions";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceSnapshot } from "@/lib/workspace";

export const metadata = {
  title: "Saved — Helion Intelligence",
};

export default async function SavedPage() {
  const workspace = await getWorkspaceSnapshot();
  if (!workspace) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: sessions } = await supabase
    .schema("intelligence")
    .from("chat_sessions")
    .select("id, title, updated_at")
    .eq("knowledge_base_id", workspace.knowledgeBase.id)
    .eq("user_id", workspace.profile.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  return (
    <div className="flex w-full min-w-0 flex-col">
      <header className="w-full border-b border-black pb-8 sm:pb-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-ui-muted-dim">
          Saved
        </p>
        <h1 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-ui-text sm:mt-4 sm:text-3xl md:text-4xl">
          Saved chat sessions
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ui-muted sm:mt-6 sm:text-base">
          Review previous answers and reuse grounded outputs.
        </p>
      </header>
      <section className="mt-0 w-full border-t border-black py-8 sm:py-10">
        {!sessions || sessions.length === 0 ? (
          <p className="text-sm text-ui-muted">No saved sessions yet.</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <article
                key={session.id}
                className="rounded-none border border-black/20 bg-white px-4 py-4"
              >
                <Link
                  href={`/chat/${session.id}`}
                  className="text-base font-medium text-ui-text underline-offset-4 hover:underline"
                >
                  {session.title || "Untitled session"}
                </Link>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-ui-muted-dim">
                  Updated{" "}
                  {new Date(session.updated_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                <SavedSessionActions
                  sessionId={session.id}
                  initialTitle={session.title || "Untitled session"}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
