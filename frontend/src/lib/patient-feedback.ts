import { ApiError } from '@/lib/api-client'

type PatientAction = 'save-record' | 'publish-post' | 'save-exercise'

type PatientFeedback = {
  title: string
  description: string
}

const ACTION_COPY: Record<
  PatientAction,
  {
    genericTitle: string
    serverTitle: string
    validationDescription: string
  }
> = {
  'save-record': {
    genericTitle: 'Nao foi possivel salvar seu registro',
    serverTitle: 'Estamos com dificuldade para salvar seu registro',
    validationDescription:
      'Alguns campos precisam ser preenchidos antes de continuar.',
  },
  'publish-post': {
    genericTitle: 'Nao foi possivel publicar seu post',
    serverTitle: 'Estamos com dificuldade para publicar seu post',
    validationDescription: 'Revise sua mensagem e tente novamente.',
  },
  'save-exercise': {
    genericTitle: 'Nao foi possivel salvar seu exercicio',
    serverTitle: 'Estamos com dificuldade para salvar seu exercicio',
    validationDescription: 'Revise as informacoes e tente novamente.',
  },
}

function normalizeMessage(message: string | undefined): string {
  return (message ?? '').toLowerCase()
}

function isConnectivityError(error: ApiError | Error): boolean {
  const message = normalizeMessage(error.message)

  return (
    ('statusCode' in error && !error.statusCode) ||
    message.includes('nao foi possivel conectar') ||
    message.includes('vite_api_url') ||
    message.includes('frontend_url') ||
    message.includes('network') ||
    message.includes('offline')
  )
}

function isTimeoutError(error: ApiError | Error): boolean {
  const message = normalizeMessage(error.message)

  return (
    ('statusCode' in error && error.statusCode === 408) ||
    message.includes('timeout') ||
    message.includes('demorou')
  )
}

export function resolvePatientActionError(
  error: unknown,
  action: PatientAction,
): PatientFeedback {
  const copy = ACTION_COPY[action]

  if (error instanceof ApiError) {
    if (isTimeoutError(error)) {
      return {
        title: 'A operacao demorou mais que o esperado',
        description: 'Tente novamente em alguns instantes.',
      }
    }

    if (isConnectivityError(error)) {
      return {
        title: 'Nao foi possivel conectar ao FibroSync',
        description: 'Verifique sua conexao e tente novamente.',
      }
    }

    if (error.statusCode && error.statusCode >= 500) {
      return {
        title: copy.serverTitle,
        description: 'Tente novamente em alguns instantes.',
      }
    }

    if (error.statusCode === 400 || error.statusCode === 422) {
      return {
        title: 'Verifique as informacoes',
        description: copy.validationDescription,
      }
    }

    if (error.statusCode === 401 || error.statusCode === 403) {
      return {
        title: 'Sua sessao precisa ser atualizada',
        description: 'Entre novamente e tente continuar.',
      }
    }
  }

  if (error instanceof Error && isTimeoutError(error)) {
    return {
      title: 'A operacao demorou mais que o esperado',
      description: 'Tente novamente em alguns instantes.',
    }
  }

  if (error instanceof Error && isConnectivityError(error)) {
    return {
      title: 'Nao foi possivel conectar ao FibroSync',
      description: 'Verifique sua conexao e tente novamente.',
    }
  }

  return {
    title: copy.genericTitle,
    description: 'Tente novamente em alguns instantes.',
  }
}
