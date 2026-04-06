export type TextChunk = {
  index: number;
  content: string;
  tokenEstimate: number;
};

const DEFAULT_MAX_CHARS = 1400;
const DEFAULT_OVERLAP_CHARS = 220;

function normalizeText(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\u0000/g, "").trim();
}

function roughTokenEstimate(value: string) {
  // Fast approximation; enough for chunk diagnostics in MVP.
  return Math.max(1, Math.ceil(value.length / 4));
}

export function splitIntoChunks(
  text: string,
  maxChars = DEFAULT_MAX_CHARS,
  overlapChars = DEFAULT_OVERLAP_CHARS,
): TextChunk[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const chunks: TextChunk[] = [];
  let cursor = 0;

  while (cursor < normalized.length) {
    const proposedEnd = Math.min(cursor + maxChars, normalized.length);
    let end = proposedEnd;

    if (proposedEnd < normalized.length) {
      const paragraphBreak = normalized.lastIndexOf("\n\n", proposedEnd);
      const sentenceBreak = normalized.lastIndexOf(". ", proposedEnd);
      const softBreak = normalized.lastIndexOf(" ", proposedEnd);

      const bestBreak = [paragraphBreak, sentenceBreak, softBreak].find(
        (point) => point > cursor + Math.floor(maxChars * 0.55),
      );

      if (bestBreak && bestBreak > cursor) {
        end = bestBreak + 1;
      }
    }

    const content = normalized.slice(cursor, end).trim();
    if (content) {
      chunks.push({
        index: chunks.length,
        content,
        tokenEstimate: roughTokenEstimate(content),
      });
    }

    if (end >= normalized.length) break;
    cursor = Math.max(end - overlapChars, cursor + 1);
  }

  return chunks;
}
