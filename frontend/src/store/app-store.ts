import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AppRole = 'patient' | 'medical' | 'admin'

export type AuthUser = {
  id: number
  email: string
  name: string
  birthDate?: string | null
  gender?: string | null
  height?: string | null
  weight?: string | null
  country: string
  role: 'USER' | 'ADMIN'
  createdAt?: string
}

export type AuthSession = {
  token: string
  user: AuthUser
}

export type PainDraft = {
  intensity: number
  painType: string
  note: string
  selectedPoints: string[]
}

type AppStore = {
  role: AppRole
  communityFilter: string
  painDraft: PainDraft
  authSession: AuthSession | null
  setRole: (role: AppRole) => void
  setCommunityFilter: (value: string) => void
  updatePainDraft: (patch: Partial<PainDraft>) => void
  resetPainDraft: () => void
  setAuthSession: (session: AuthSession | null) => void
  clearAuthSession: () => void
}

const initialPainDraft: PainDraft = {
  intensity: 0,
  painType: '',
  note: '',
  selectedPoints: [],
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      role: 'patient',
      communityFilter: 'Feed',
      painDraft: initialPainDraft,
      authSession: null,
      setRole: (role) => set({ role }),
      setCommunityFilter: (communityFilter) => set({ communityFilter }),
      updatePainDraft: (patch) =>
        set((state) => ({
          painDraft: {
            ...state.painDraft,
            ...patch,
          },
        })),
      resetPainDraft: () => set({ painDraft: initialPainDraft }),
      setAuthSession: (authSession) =>
        set({
          authSession,
          role: authSession?.user.role === 'ADMIN' ? 'admin' : 'patient',
        }),
      clearAuthSession: () => set({ authSession: null, role: 'patient' }),
    }),
    {
      name: 'fibrosync-web-state',
      partialize: (state) => ({
        role: state.role,
        communityFilter: state.communityFilter,
        painDraft: state.painDraft,
        authSession: state.authSession,
      }),
    },
  ),
)
