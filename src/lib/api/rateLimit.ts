import { NextResponse } from "next/server";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

const buckets = new Map<string, number[]>();

export function enforceRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions
): NextResponse | null {
  const now = Date.now();
  const windowStart = now - windowMs;
  const recent = (buckets.get(key) || []).filter((timestamp) => timestamp > windowStart);

  if (recent.length >= limit) {
    const retryAfterMs = Math.max(1000, recent[0] + windowMs - now);
    return NextResponse.json(
      {
        ok: false,
        error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
      },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(retryAfterMs / 1000).toString()
        }
      }
    );
  }

  recent.push(now);
  buckets.set(key, recent);
  return null;
}
