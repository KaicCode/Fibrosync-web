import axios from 'axios'
import { resolveApiUrl } from '@/lib/resolve-api-url'
import type { UserProfile } from '@/services/user.service'

const API_URL = resolveApiUrl()
const REFRESH_REQUEST_TIMEOUT_MS = 30000

// F-14: CSRF safeguard required by the backend's TrustedClientGuard for
// this cookie-authenticated endpoint. See backend/src/common/utils/
// cookie.util.ts for the full reasoning — this header cannot be attached
// by a passive cross-site request, and a script-driven cross-origin
// attempt to add it would be blocked at the CORS preflight stage by the
// backend's strict origin allow-list.
const TRUSTED_CLIENT_HEADER_NAME = 'X-FibroSync-Client'
const TRUSTED_CLIENT_HEADER_VALUE = 'web'

export interface RefreshedSession {
  accessToken: string
  tokenType: string
  accessTokenTtl: string
  user: UserProfile
}

/**
 * Rotates the session using the httpOnly refresh-token cookie. Used both
 * by the axios response interceptors (on a 401) and by the app-boot
 * session bootstrap (to silently restore a session after a page reload,
 * since the access token itself is memory-only and does not survive one).
 *
 * Deliberately bypasses the shared axios instances (apiClient / api) to
 * avoid any risk of recursively triggering their own interceptors.
 */
export async function performTokenRefresh(): Promise<RefreshedSession> {
  const response = await axios.post<{
    success: boolean
    data: RefreshedSession
  }>(`${API_URL}/auth/refresh`, undefined, {
    // Cross-origin request (api.fibrosync.com vs. fibrosync.com in
    // production — same site, different origin): the refresh-token cookie
    // is only sent when this is explicitly enabled, and the backend must
    // echo back a matching Access-Control-Allow-Credentials + a specific
    // (non-wildcard) origin.
    withCredentials: true,
    headers: {
      [TRUSTED_CLIENT_HEADER_NAME]: TRUSTED_CLIENT_HEADER_VALUE,
    },
    timeout: REFRESH_REQUEST_TIMEOUT_MS,
  })

  return response.data.data
}
