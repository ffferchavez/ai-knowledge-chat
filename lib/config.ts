export const siteConfig = {
  name: "AI Knowledge Chat",
  tagline: "Upload your content and ask questions — answers point back to your sources.",
  footer: {
    kicker: "Demo",
    detail: "Add files or a web page, then chat with your library.",
  },
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
