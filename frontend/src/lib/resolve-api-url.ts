function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

const DEFAULT_API_URL = 'http://localhost:3100/api/v1'
const DEFAULT_API_PATH = '/api/v1'

function isLocalHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0'
  )
}

function ensureApiPath(value: string): string {
  const normalizedUrl = normalizeBaseUrl(value)

  try {
    const parsedUrl = new URL(normalizedUrl)

    if (parsedUrl.pathname === '' || parsedUrl.pathname === '/') {
      return `${normalizedUrl}${DEFAULT_API_PATH}`
    }
  } catch {
    return normalizedUrl
  }

  return normalizedUrl
}

export function resolveApiUrl(): string {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim()

  if (configuredUrl) {
    return ensureApiPath(configuredUrl)
  }

  if (typeof window !== 'undefined') {
    if (isLocalHost(window.location.hostname)) {
      return DEFAULT_API_URL
    }

    return `${normalizeBaseUrl(window.location.origin)}${DEFAULT_API_PATH}`
  }

  return DEFAULT_API_URL
}
