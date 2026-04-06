export type FetchedWebPage = {
  url: string;
  title: string;
  text: string;
};

function stripHtml(html: string) {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const noTags = withoutScripts.replace(/<[^>]+>/g, " ");
  return noTags.replace(/\s+/g, " ").trim();
}

function extractTitle(html: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!titleMatch) return "Untitled page";
  return titleMatch[1].replace(/\s+/g, " ").trim() || "Untitled page";
}

export async function fetchWebPage(url: string): Promise<FetchedWebPage> {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "HelionKnowledgeBot/1.0 (+https://helion.city)",
      accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) {
    throw new Error(`Fetch failed with status ${response.status}`);
  }
  const html = await response.text();
  const text = stripHtml(html);
  if (!text) {
    throw new Error("Fetched page had no extractable text.");
  }
  return {
    url: response.url || url,
    title: extractTitle(html),
    text,
  };
}
