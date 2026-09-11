// Minimal in-memory sliding-window limiter for the auth routes — this is a
// single-process VPS deployment, so no shared store (Redis etc.) is needed.
export function rateLimit({ windowMs, max }) {
  const hits = new Map()

  return (req, res, next) => {
    const key = req.ip
    const now = Date.now()
    const windowStart = now - windowMs

    const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart)
    if (timestamps.length >= max) {
      return res.status(429).json({ error: 'Too many attempts, try again shortly' })
    }
    timestamps.push(now)
    hits.set(key, timestamps)
    next()
  }
}
