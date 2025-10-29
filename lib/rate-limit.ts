type Bucket = {
  count: number
  expiresAt: number
}

const WINDOW_MS = 60_000
const LIMIT = 10

const buckets = new Map<string, Bucket>()

export function checkRateLimit(key: string, limit = LIMIT, windowMs = WINDOW_MS) {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.expiresAt < now) {
    buckets.set(key, { count: 1, expiresAt: now + windowMs })
    return true
  }

  if (bucket.count >= limit) {
    return false
  }

  bucket.count += 1
  return true
}
