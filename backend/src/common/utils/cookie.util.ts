import type { CookieOptions, Request } from 'express';

/**
 * F-14: the refresh token now lives exclusively in an httpOnly cookie —
 * never in the JSON response body, never readable by frontend JavaScript.
 */
export const REFRESH_TOKEN_COOKIE_NAME = 'fibrosync_refresh_token';

/**
 * F-14 CSRF mitigation: /auth/refresh must not be triggerable by a plain
 * cross-site HTML form (the classic CSRF vector). A plain form submission
 * can never attach a custom header, and a cross-origin `fetch`/XHR that
 * tries to add one triggers a CORS preflight — which our strict origin
 * allow-list (see main.ts) rejects for any origin that is not explicitly
 * trusted. Requiring this header is an effective, low-complexity CSRF
 * defense that is kept as defense-in-depth even now that production
 * frontend (fibrosync.com) and backend (api.fibrosync.com) are **same-site**
 * (same registrable domain, fibrosync.com) — see the SameSite note below.
 * They are still different *origins* (different hostnames), so CORS is
 * still fully in effect and still required for the browser to let the
 * frontend's JS read the API's responses at all.
 */
export const TRUSTED_CLIENT_HEADER_NAME = 'x-fibrosync-client';
export const TRUSTED_CLIENT_HEADER_VALUE = 'web';

/**
 * SameSite=Lax is correct for BOTH environments now:
 *  - Production: frontend (fibrosync.com) and backend (api.fibrosync.com)
 *    are subdomains of the same registrable domain, i.e. same-site. A
 *    same-site request (any method, including the POST this cookie is
 *    used for) still gets the cookie attached under Lax — only genuinely
 *    cross-site requests (a different registrable domain, e.g. an
 *    attacker's page) are denied the cookie on non-navigation requests.
 *    This also sidesteps browsers' increasing restrictions on cookies set
 *    by a "third party" relative to the top-level page (Safari ITP,
 *    Chrome's phase-out) — those target cross-*site* cookies, and this one
 *    no longer is one. Secure stays true: production is HTTPS-only.
 *  - Development: unchanged from before — http://localhost over plain
 *    HTTP, where a `Secure` cookie would never be sent back by the
 *    browser, so Secure=false; SameSite=Lax already applied here.
 *
 * Domain is deliberately never set on this cookie (see buildRefreshTokenCookieOptions
 * below) — omitting it makes the cookie **host-only**, scoped strictly to
 * the exact host that issued it (api.fibrosync.com). We do not need or
 * want the refresh token available to any other subdomain of
 * fibrosync.com.
 */
const REFRESH_COOKIE_SAME_SITE: NonNullable<CookieOptions['sameSite']> = 'lax';

export interface RefreshCookieContext {
  isProduction: boolean;
  path: string;
}

export function buildRefreshTokenCookieOptions(
  context: RefreshCookieContext,
  maxAgeMs: number,
): CookieOptions {
  return {
    httpOnly: true,
    secure: context.isProduction,
    sameSite: REFRESH_COOKIE_SAME_SITE,
    // No `domain` key: host-only cookie, issued by and scoped to exactly
    // the host that set it. Never set this to `.fibrosync.com` or
    // `fibrosync.com` — that would make the refresh token readable by
    // every subdomain, which is not needed here.
    path: context.path,
    maxAge: maxAgeMs,
  };
}

export function buildClearRefreshTokenCookieOptions(
  context: RefreshCookieContext,
): CookieOptions {
  return {
    httpOnly: true,
    secure: context.isProduction,
    sameSite: REFRESH_COOKIE_SAME_SITE,
    path: context.path,
  };
}

/**
 * Reads the refresh token from the httpOnly cookie. Falls back to the
 * `Authorization: Bearer <token>` header for API clients that cannot use
 * cookies (e.g. manual testing via Swagger "Try it out") — that header
 * cannot be forged by a passive cross-site request, so accepting it never
 * weakens the CSRF posture above.
 */
export function extractRefreshTokenFromRequest(
  request: Request,
): string | null {
  const cookieValue = (
    request.cookies as Record<string, string | undefined> | undefined
  )?.[REFRESH_TOKEN_COOKIE_NAME];

  if (cookieValue) {
    return cookieValue;
  }

  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader) {
    return null;
  }

  const [type, token] = authorizationHeader.split(' ');

  return type === 'Bearer' && token ? token : null;
}

export function hasTrustedClientHeader(request: Request): boolean {
  const value = request.headers[TRUSTED_CLIENT_HEADER_NAME];
  return value === TRUSTED_CLIENT_HEADER_VALUE;
}
