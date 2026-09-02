/**
 * Reads a claim out of a JWT payload without verifying the signature —
 * verification is the backend's job on every request. This is only used
 * for UI convenience: the token's subject is the numeric userId
 * (JwtTokenProvider.generateAccessToken), and there is no
 * "get current user" endpoint to fetch it from otherwise.
 */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

export function getUserIdFromToken(token: string): number | null {
  const payload = decodeJwtPayload<{ sub?: string }>(token)
  const sub = payload?.sub
  if (!sub) return null
  const userId = Number(sub)
  return Number.isFinite(userId) ? userId : null
}
