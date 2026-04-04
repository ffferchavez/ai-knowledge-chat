export const metadata = {
  title: "Chat — Helion Intelligence",
};

export default function ChatPage() {
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
      <section className="mt-0 w-full border-t border-black">
        <div className="border-b border-black py-8 sm:py-10">
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim">
            Coming next
          </p>
          <p className="mt-2 text-lg font-medium tracking-[-0.02em] text-ui-text sm:mt-3 sm:text-xl md:text-2xl">
            Session list, message thread, and citations panel.
          </p>
        </div>
      </section>
    </div>
  );
}
