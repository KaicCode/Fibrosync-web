// F-14: the access token now lives ONLY in memory — never in localStorage
// or sessionStorage. This is intentionally lost on a full page reload; the
// session bootstrap (see session-bootstrap.tsx) re-derives a fresh access
// token from the httpOnly refresh-token cookie on app start. The refresh
// token itself never reaches JavaScript at all.
let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}
