import type { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function resolveFolderForKnowledgeBase(
  supabase: ServerSupabaseClient,
  knowledgeBaseId: string,
  organizationId: string,
  folderId: string | null | undefined,
): Promise<string | null> {
  if (
    folderId == null ||
    folderId === "" ||
    folderId === "null" ||
    folderId === "undefined"
  ) {
    return null;
  }

  const { data, error } = await supabase
    .from("source_folders")
    .select("id")
    .eq("id", folderId)
    .eq("knowledge_base_id", knowledgeBaseId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data?.id) {
    throw new Error("Invalid or inaccessible folder.");
  }

  return data.id;
}

export type SourceFolderRow = {
  id: string;
  knowledge_base_id: string;
  parent_folder_id: string | null;
  name: string;
};

export function folderPathLabel(
  folders: SourceFolderRow[],
  folderId: string | null | undefined,
): string | null {
  if (!folderId) return null;
  const byId = new Map<string, SourceFolderRow>();
  for (const row of folders) byId.set(row.id, row);
  const parts: string[] = [];
  let cur: string | undefined = folderId;
  const guard = new Set<string>();

  while (cur && byId.has(cur) && !guard.has(cur)) {
    guard.add(cur);
    const node: SourceFolderRow = byId.get(cur)!;
    parts.unshift(node.name.trim());
    cur = node.parent_folder_id ?? undefined;
  }

  return parts.length ? parts.join(" / ") : null;
}

export function folderDepth(
  folders: SourceFolderRow[],
  folderId: string,
): number {
  const byId = new Map<string, SourceFolderRow>();
  for (const row of folders) byId.set(row.id, row);
  let d = 0;
  let cur: string | undefined = folderId;
  const guard = new Set<string>();

  while (cur && byId.has(cur) && !guard.has(cur)) {
    guard.add(cur);
    d += 1;
    cur = byId.get(cur)!.parent_folder_id ?? undefined;
  }

  return d;
}
