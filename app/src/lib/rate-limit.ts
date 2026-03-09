const store = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitInput {
  key: string;
  limit: number;
  windowMs: number;
}

export function checkRateLimit(input: RateLimitInput) {
  const now = Date.now();
  const current = store.get(input.key);

  if (!current || current.resetAt <= now) {
    store.set(input.key, { count: 1, resetAt: now + input.windowMs });
    return { allowed: true, remaining: input.limit - 1, resetAt: now + input.windowMs };
  }

  if (current.count >= input.limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  store.set(input.key, current);
  return { allowed: true, remaining: Math.max(0, input.limit - current.count), resetAt: current.resetAt };
}

export function getClientKey(request: Request, scope: string) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return `${scope}:${ip}`;
}
