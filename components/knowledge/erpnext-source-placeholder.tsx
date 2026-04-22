export function ErpNextSourcePlaceholder() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <p className="text-xs leading-relaxed text-ui-muted">
        In a full rollout, this is where you&apos;d connect calendars, ticketing,
        or your internal wiki so answers stay in sync with live systems.
      </p>
      <div className="mt-auto flex shrink-0 flex-col gap-3 pt-2">
        <button
          type="button"
          disabled
          className="w-full cursor-not-allowed border border-dashed border-ui-line bg-ui-surface px-4 py-2.5 text-center text-xs font-medium uppercase tracking-[0.2em] text-ui-muted-dim"
          aria-disabled="true"
        >
          Coming soon
        </button>
        <p className="text-center text-[10px] text-ui-muted-dim">
          Not part of this demo—files, text, and web pages are ready to use today.
        </p>
      </div>
    </div>
  );
}
