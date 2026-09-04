import { useEffect, useState } from 'react'

/**
 * Tracks the browser's network-interface connectivity (`navigator.onLine` +
 * the `online`/`offline` window events). This reflects whether the device
 * has a network connection at all, not whether a particular API call
 * succeeded — per-request failures are already handled where each request
 * is made.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
