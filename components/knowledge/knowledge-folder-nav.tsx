import Link from "next/link";

import type { SourceFolderRow } from "@/lib/server/knowledge-folders";
import { folderDepth } from "@/lib/server/knowledge-folders";

type Active = "all" | "unfiled" | string;

function navLinkClass(active: boolean) {
  return [
    "block px-2 py-1.5 text-[13px] transition-colors",
    active
      ? "bg-neutral-100 font-medium text-ui-text"
      : "text-ui-muted hover:bg-neutral-50 hover:text-ui-text",
  ].join(" ");
}

export function KnowledgeFolderNav({
  folders,
  active,
}: {
  folders: SourceFolderRow[];
  active: Active;
}) {
  const sorted = [...folders].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <nav className="border border-black/20 bg-white p-4" aria-label="Folder filter">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">
        Browse by folder
      </p>
      <div className="mt-3 flex max-h-[min(22rem,55vh)] flex-col gap-0.5 overflow-y-auto [scrollbar-gutter:stable]">
        <Link href="/knowledge" className={navLinkClass(active === "all")}>
          All sources
        </Link>
        <Link
          href="/knowledge?folder=unfiled"
          className={navLinkClass(active === "unfiled")}
        >
          Unfiled
        </Link>
        {sorted.map((f) => {
          const depth = folderDepth(folders, f.id);
          return (
            <Link
              key={f.id}
              href={`/knowledge?folder=${f.id}`}
              className={navLinkClass(active === f.id)}
              style={{ paddingLeft: `${8 + depth * 12}px` }}
              title={f.name}
            >
              <span className="line-clamp-2">{f.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
