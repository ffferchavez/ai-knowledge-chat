import { siteConfig } from "@/lib/config";
import { PAGE_INSET } from "@/lib/ui/shell";

export function SiteFooter() {
  return (
    <footer className="glass-panel mt-auto w-full border-t border-ui-line/70 py-8 text-center sm:py-10">
      <div className={PAGE_INSET}>
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim">
          {siteConfig.footer.kicker} ·{" "}
          <span className="text-ui-muted">{siteConfig.footer.detail}</span>
        </p>
      </div>
    </footer>
  );
}
