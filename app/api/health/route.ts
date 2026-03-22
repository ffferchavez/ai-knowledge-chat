import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "ai-knowledge-chat",
    timestamp: new Date().toISOString(),
  });
}
