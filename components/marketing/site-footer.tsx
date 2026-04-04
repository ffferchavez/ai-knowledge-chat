import { siteConfig } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="mt-auto helion-rule">
      <div className="helion-shell py-7 text-center">
        <p className="text-[0.58rem] uppercase tracking-[0.28em] text-[#8a8a90]">
          {siteConfig.org.city} · AI Knowledge Layer
        </p>
      </div>
    </footer>
  );
}
