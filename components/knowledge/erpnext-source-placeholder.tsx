/**
 * Placeholder for a future Helion Ops -> Intelligence connector.
 */
export function ErpNextSourcePlaceholder() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <p className="text-xs leading-relaxed text-ui-muted">
        Connect Helion Ops to pull structured company data (items, customers,
        projects) into the same retrieval layer as files and websites.
      </p>
      <div className="mt-auto flex shrink-0 flex-col gap-3 pt-2">
        <button
          type="button"
          disabled
          className="w-full cursor-not-allowed border border-dashed border-black/20 bg-neutral-50/80 px-4 py-2.5 text-center text-xs font-medium uppercase tracking-[0.2em] text-neutral-400"
          aria-disabled="true"
        >
          CONNECT OPS
        </button>
        <p className="text-center text-[10px] text-ui-muted-dim">
          API keys, site URL, and sync rules coming in a later release.
        </p>
      </div>
    </div>
  );
}
