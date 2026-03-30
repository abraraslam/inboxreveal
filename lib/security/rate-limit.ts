type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  success: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

const RATE_LIMIT_STORE_SYMBOL = Symbol.for("inboxreveal.rateLimitStore");

type GlobalWithRateLimitStore = typeof globalThis & {
  [RATE_LIMIT_STORE_SYMBOL]?: Map<string, RateLimitEntry>;
};

function getStore() {
  const globalObject = globalThis as GlobalWithRateLimitStore;

  if (!globalObject[RATE_LIMIT_STORE_SYMBOL]) {
    globalObject[RATE_LIMIT_STORE_SYMBOL] = new Map<string, RateLimitEntry>();
  }

  return globalObject[RATE_LIMIT_STORE_SYMBOL];
}

function cleanupExpiredEntries(now: number, store: Map<string, RateLimitEntry>) {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function buildRateLimitKey(
  request: Request,
  userIdentifier: string | undefined,
  scope: string
) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
  const identity = (userIdentifier || "anonymous").toLowerCase();

  return `${scope}:${identity}:${ip}`;
}

export function applyRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const store = getStore();

  if (store.size > 5000) {
    cleanupExpiredEntries(now, store);
  }

  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      success: true,
      remaining: limit - 1,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000)
      ),
    };
  }

  existing.count += 1;
  store.set(key, existing);

  return {
    success: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}