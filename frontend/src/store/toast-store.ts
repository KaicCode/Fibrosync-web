import { create } from 'zustand'

export type ToastTone = 'success' | 'error' | 'info'

export type ToastOptions = {
  title: string
  description?: string
  tone?: ToastTone
  duration?: number
}

export type ToastItem = ToastOptions & {
  id: string
  tone: ToastTone
  duration: number
}

type ToastStore = {
  toasts: ToastItem[]
  showToast: (options: ToastOptions) => string
  dismissToast: (id: string) => void
  clearToasts: () => void
}

const TOAST_LIMIT = 4
const DEFAULT_TOAST_DURATION_MS = 4200
const toastTimers = new Map<string, number>()

function generateToastId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function clearToastTimer(id: string) {
  const timer = toastTimers.get(id)

  if (timer) {
    window.clearTimeout(timer)
    toastTimers.delete(id)
  }
}

export const useToastStore = create<ToastStore>()((set, get) => ({
  toasts: [],
  showToast: ({ tone = 'info', duration = DEFAULT_TOAST_DURATION_MS, ...options }) => {
    const id = generateToastId()
    const nextToast: ToastItem = {
      id,
      tone,
      duration,
      ...options,
    }

    set((state) => ({
      toasts: [...state.toasts, nextToast].slice(-TOAST_LIMIT),
    }))

    if (typeof window !== 'undefined' && duration > 0) {
      const timer = window.setTimeout(() => {
        get().dismissToast(id)
      }, duration)

      toastTimers.set(id, timer)
    }

    return id
  },
  dismissToast: (id) => {
    if (typeof window !== 'undefined') {
      clearToastTimer(id)
    }

    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }))
  },
  clearToasts: () => {
    if (typeof window !== 'undefined') {
      toastTimers.forEach((timer) => window.clearTimeout(timer))
      toastTimers.clear()
    }

    set({ toasts: [] })
  },
}))

export const toast = {
  success: (title: string, description?: string, duration?: number) =>
    useToastStore.getState().showToast({
      title,
      description,
      duration,
      tone: 'success',
    }),
  error: (title: string, description?: string, duration?: number) =>
    useToastStore.getState().showToast({
      title,
      description,
      duration,
      tone: 'error',
    }),
  info: (title: string, description?: string, duration?: number) =>
    useToastStore.getState().showToast({
      title,
      description,
      duration,
      tone: 'info',
    }),
  dismiss: (id: string) => useToastStore.getState().dismissToast(id),
}
