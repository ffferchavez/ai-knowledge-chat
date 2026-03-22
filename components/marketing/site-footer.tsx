import { siteConfig } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#030712]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {siteConfig.org.city}.{" "}
          <span className="text-zinc-600">{siteConfig.org.serviceLine}.</span>
        </p>
        <p className="text-xs text-zinc-600">
          AI Knowledge Chat — document Q&amp;A with citations. Internal MVP.
        </p>
      </div>
    </footer>
  );
}
