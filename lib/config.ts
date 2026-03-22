export const siteConfig = {
  name: "AI Knowledge Chat",
  tagline: "Grounded answers from your business documents — with citations.",
  org: {
    city: "Helion City",
    serviceLine: "Helion Intelligence",
  },
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
