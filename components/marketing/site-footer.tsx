import { siteConfig } from "@/lib/config";
import { PAGE_INSET } from "@/lib/ui/shell";

export function SiteFooter() {
  return (
    <footer className="mt-auto w-full border-t border-neutral-200/80 bg-white py-8 text-center sm:py-10">
      <div className={PAGE_INSET}>
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-400">
          {siteConfig.org.city} ·{" "}
          <span className="text-neutral-600">{siteConfig.org.serviceLine}</span>
        </p>
      </div>
    </footer>
  );
}
