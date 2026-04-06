type Bucket = {
  count: number;
  resetAt: number;
};

const memoryBuckets = new Map<string, Bucket>();

async function checkMemoryRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const existing = memoryBuckets.get(input.key);

  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(input.key, { count: 1, resetAt: now + input.windowMs });
    return { allowed: true, remaining: input.limit - 1 };
  }

  if (existing.count >= input.limit) {
    return { allowed: false, remaining: 0, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  memoryBuckets.set(input.key, existing);
  return { allowed: true, remaining: input.limit - existing.count };
}

async function checkUpstashRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}) {
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
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: input.limit - count };
}

export async function checkRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const redisResult = await checkUpstashRateLimit(input);
  if (redisResult) return redisResult;
  return checkMemoryRateLimit(input);
}
