type Bucket = {
  count: number;
  resetAt: number;
};

const memoryBuckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
};

async function checkMemoryRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const now = Date.now();
  const existing = memoryBuckets.get(input.key);

  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(input.key, { count: 1, resetAt: now + input.windowMs });
    return { allowed: true, remaining: input.limit - 1 };
  }

  if (existing.count >= input.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(1, existing.resetAt - now),
    };
  }

  existing.count += 1;
  memoryBuckets.set(input.key, existing);
  return { allowed: true, remaining: input.limit - existing.count };
}

async function checkUpstashRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult | null> {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!baseUrl || !token) return null;

  const safeKey = encodeURIComponent(`rl:${input.key}`);
  const incrRes = await fetch(`${baseUrl}/incr/${safeKey}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!incrRes.ok) return null;
  const incrBody = (await incrRes.json().catch(() => ({}))) as {
    result?: number;
  };
  const count = Number(incrBody.result ?? 0);
  if (!Number.isFinite(count) || count <= 0) return null;

  if (count === 1) {
    const ttlSec = Math.max(1, Math.ceil(input.windowMs / 1000));
    await fetch(`${baseUrl}/expire/${safeKey}/${ttlSec}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => undefined);
  }

  if (count > input.limit) {
    return { allowed: false, remaining: 0, retryAfterMs: input.windowMs };
  }
  return { allowed: true, remaining: input.limit - count };
}

export async function checkRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const redisResult = await checkUpstashRateLimit(input);
  if (redisResult) return redisResult;
  return checkMemoryRateLimit(input);
}

export function applyRateLimitHeaders(
  response: Response,
  rate: RateLimitResult,
  input: { limit: number },
) {
  response.headers.set("X-RateLimit-Limit", String(input.limit));
  response.headers.set("X-RateLimit-Remaining", String(Math.max(0, rate.remaining)));
  if (!rate.allowed && rate.retryAfterMs) {
    response.headers.set(
      "Retry-After",
      String(Math.max(1, Math.ceil(rate.retryAfterMs / 1000))),
    );
  }
  return response;
}
