import { NextResponse } from "next/server";

export function requireDevAdmin(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Dev admin routes disabled in production." },
      { status: 403 },
    );
  }
  const secret = process.env.DEV_ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "DEV_ADMIN_SECRET is not configured." },
      { status: 403 },
    );
  }
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  const headerToken = request.headers.get("x-dev-admin-secret");
  const token = bearer ?? headerToken;
  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
