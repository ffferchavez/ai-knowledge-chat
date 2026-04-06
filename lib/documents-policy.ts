/** Matches `knowledge-files` bucket in `001_initial.sql`. */
export const KNOWLEDGE_BUCKET = "knowledge-files";

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type AllowedDocumentMime = (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number];

export const MAX_DOCUMENT_BYTES = 52428800; // 50 MiB, per bucket config

export function isAllowedDocumentMime(
  mime: string | null | undefined,
): mime is AllowedDocumentMime {
  if (!mime) return false;
  return (ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(mime);
}

/** Browsers often leave `File.type` empty; map from extension when needed. */
export function mimeFromFilename(name: string): AllowedDocumentMime | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return null;
}

/** Strip path segments and nulls; keep a usable display name. */
export function sanitizeDisplayFilename(name: string): string {
  const base = name.replace(/^.*[/\\]/, "").replace(/\0/g, "").trim();
  if (!base || base === "." || base === "..") {
    return "Untitled";
  }
  return base.slice(0, 255);
}

/** Safe single path segment for object storage (no slashes). */
export function storageObjectBasename(displayName: string): string {
  const raw = sanitizeDisplayFilename(displayName);
  const cleaned = raw.replace(/[/\\]/g, "_").replace(/[^\w.\-()+@ ]/g, "_");
  const trimmed = cleaned.replace(/\s+/g, " ").trim().slice(0, 180);
  return trimmed.length > 0 ? trimmed : "file";
}
