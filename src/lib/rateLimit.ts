type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimitByIp(ip: string, limit = 10, windowMs = 60_000): { allowed: boolean; remaining: number; resetAt: number }{
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }
  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }
  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

