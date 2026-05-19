import type { AuthSession } from '@/store/app-store'

export type RegisterPayload = {
  name: string
  email: string
  password: string
  birthDate?: string
  gender?: string
  height?: number
  weight?: number
  country?: string
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
  statusCode: number
}

const API_URL = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3000/api'

export async function registerUser(payload: RegisterPayload): Promise<AuthSession> {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const body = (await response.json().catch(() => null)) as ApiEnvelope<AuthSession> | null

    if (!response.ok || !body?.success) {
      throw new Error(body?.message || 'Nao foi possivel criar sua conta agora.')
    }

    return body.data
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }

    throw new Error('Nao foi possivel conectar ao backend. Verifique se a API esta rodando.', {
      cause: error,
    })
  }
}
