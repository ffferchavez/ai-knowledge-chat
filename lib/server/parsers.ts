import mammoth from "mammoth";
import path from "path";
import { pathToFileURL } from "url";
import { PDFParse } from "pdf-parse";

import type { AllowedDocumentMime } from "@/lib/documents-policy";

function normalizeExtractedText(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\u0000/g, "").trim();
}

const pdfWorkerFileUrl = pathToFileURL(
  path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"),
).href;

async function parsePdf(buffer: Uint8Array): Promise<string> {
  // In Next.js dev server bundles, pdf.js worker chunks can be missing.
  // Force workerSrc to a file URL on disk to avoid bundler aliases.
  PDFParse.setWorker(pdfWorkerFileUrl);
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = typeof result?.text === "string" ? result.text : "";
    return normalizeExtractedText(text);
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return normalizeExtractedText(result.value ?? "");
}

function parseTxt(buffer: Buffer): string {
  return normalizeExtractedText(buffer.toString("utf8"));
}

export async function parseDocumentByMime(
  mimeType: AllowedDocumentMime,
  buffer: Buffer,
): Promise<string> {
  if (mimeType === "text/plain") {
    return parseTxt(buffer);
  }
  if (mimeType === "application/pdf") {
    return parsePdf(new Uint8Array(buffer));
  }
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return parseDocx(buffer);
  }
  throw new Error(`Unsupported document mime type: ${mimeType}`);
}
