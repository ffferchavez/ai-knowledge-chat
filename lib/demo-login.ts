/**
 * When both env vars are set, the login page shows a one-click demo autofill.
 * Use only for non-production demo/staging (credentials ship to the browser).
 */
export function getDemoLoginCredentials():
  | { email: string; password: string }
  | null {
  const email = process.env.NEXT_PUBLIC_DEMO_LOGIN_EMAIL?.trim() ?? "";
  const password = process.env.NEXT_PUBLIC_DEMO_LOGIN_PASSWORD ?? "";
  if (!email || !password) return null;
  return { email, password };
}
