function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

function isLocalHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0'
  )
}

export function resolveApiUrl(): string {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim()

  if (configuredUrl) {
    return normalizeBaseUrl(configuredUrl)
  }

  if (typeof window !== 'undefined') {
    if (isLocalHost(window.location.hostname)) {
      return 'http://localhost:3100/api/v1'
    }

    return `${normalizeBaseUrl(window.location.origin)}/api/v1`
  }

  return 'http://localhost:3100/api/v1'
}
