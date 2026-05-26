import { type ChangeEvent, type ReactNode, useMemo, useState } from 'react'
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Eye,
  Globe,
  Heart,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Ruler,
  Scale,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthInlineLogo } from '@/components/auth-inline-logo'
import { AppleIcon, GoogleIcon } from '@/components/provider-icons'
import { SelfCareIllustration } from '@/components/self-care-illustration'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePageTitle } from '@/hooks/use-page-title'
import { useAuth } from '@/hooks/useAuth'

const benefits = [
  {
    icon: BarChart3,
    title: 'Acompanhe sua dor',
    description: 'Registre e visualize seus padrões de dor ao longo do tempo.',
  },
  {
    icon: Heart,
    title: 'Relatórios personalizados',
    description: 'Gere relatórios e compartilhe com seu médico facilmente.',
  },
  {
    icon: Users,
    title: 'Comunidade acolhedora',
    description: 'Conecte-se com outras pessoas que entendem você.',
  },
  {
    icon: ShieldCheck,
    title: 'Seus dados protegidos',
    description: 'Seguimos os mais altos padrões de segurança e privacidade.',
  },
]

const passwordRules = ['8 caracteres', '1 letra maiúscula', '1 número', '1 caractere especial']

const countryCodeByLabel: Record<string, string> = {
  Argentina: 'AR',
  Brasil: 'BR',
  Chile: 'CL',
  Portugal: 'PT',
}

type SignupFormValues = {
  name: string
  birthDate: string
  email: string
  password: string
  confirmPassword: string
  gender: string
  height: string
  weight: string
  country: string
  acceptedTerms: boolean
}

const initialFormValues: SignupFormValues = {
  name: '',
  birthDate: '',
  email: '',
  password: '',
  confirmPassword: '',
  gender: '',
  height: '',
  weight: '',
  country: 'Brasil',
  acceptedTerms: true,
}

function SignupField({
  label,
  icon: Icon,
  placeholder,
  value,
  onChange,
  type = 'text',
  rightIcon,
}: {
  label: string
  icon: typeof UserRound
  placeholder: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  type?: string
  rightIcon?: ReactNode
}) {
  return (
    <label className="space-y-2.5">
      <span className="text-sm font-medium text-slate-900">{label}</span>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <Input
          type={type}
          value={value}
          onChange={onChange}
          className="h-12 rounded-[0.95rem] border-slate-200 bg-white/95 pl-12 pr-12 text-sm text-slate-700 placeholder:text-slate-400 md:text-base"
          placeholder={placeholder}
        />
        {rightIcon ? (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">{rightIcon}</div>
        ) : null}
      </div>
    </label>
  )
}

function parseBrazilianDate(date: string) {
  const trimmed = date.trim()

  if (!trimmed) {
    return undefined
  }

  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)

  if (!match) {
    return null
  }

  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

function parseMetricValue(value: string) {
  const normalized = value.trim().replace(',', '.').replace(/[^\d.]/g, '')

  if (!normalized) {
    return undefined
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function SignupPage() {
  usePageTitle('Criar conta')

  const navigate = useNavigate()
  const { signup, isSigningUp } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formValues, setFormValues] = useState<SignupFormValues>(initialFormValues)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordChecks = useMemo(
    () => [
      formValues.password.length >= 8,
      /[A-ZÀ-Ú]/.test(formValues.password),
      /\d/.test(formValues.password),
      /[^A-Za-zÀ-ú0-9]/.test(formValues.password),
    ],
    [formValues.password],
  )

  const handleInputChange =
    (field: keyof SignupFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const target = event.target
      const value =
        target instanceof HTMLInputElement && target.type === 'checkbox'
          ? target.checked
          : target.value

      setFormValues((current) => ({
        ...current,
        [field]: value,
      }))

      if (errorMessage) {
        setErrorMessage('')
      }
    }

  const handleSubmit = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    if (!formValues.name.trim()) {
      setErrorMessage('Informe seu nome completo.')
      return
    }

    if (!formValues.email.trim()) {
      setErrorMessage('Informe seu e-mail.')
      return
    }

    if (!formValues.password.trim()) {
      setErrorMessage('Crie uma senha para continuar.')
      return
    }

    if (!passwordChecks.every(Boolean)) {
      setErrorMessage('Sua senha ainda nao atende aos requisitos minimos.')
      return
    }

    if (formValues.password !== formValues.confirmPassword) {
      setErrorMessage('A confirmacao de senha nao confere.')
      return
    }

    if (!formValues.acceptedTerms) {
      setErrorMessage('Voce precisa aceitar os Termos de Uso e a Politica de Privacidade.')
      return
    }

    const parsedBirthDate = parseBrazilianDate(formValues.birthDate)

    if (parsedBirthDate === null) {
      setErrorMessage('Use a data no formato dd/mm/aaaa.')
      return
    }

    const parsedHeight = parseMetricValue(formValues.height)
    if (parsedHeight === null) {
      setErrorMessage('Altura invalida. Use algo como 1,70.')
      return
    }

    const normalizedHeightCm =
      parsedHeight === undefined ? undefined : parsedHeight <= 3 ? parsedHeight * 100 : parsedHeight

    const parsedWeight = parseMetricValue(formValues.weight)
    if (parsedWeight === null) {
      setErrorMessage('Peso invalido. Use algo como 65.')
      return
    }

    setIsSubmitting(true)

    try {
      await signup({
        fullName: formValues.name.trim(),
        email: formValues.email.trim(),
        password: formValues.password,
        birthDate: parsedBirthDate ?? undefined,
        gender: formValues.gender || undefined,
        heightCm: normalizedHeightCm ?? undefined,
        weightKg: parsedWeight ?? undefined,
        countryCode: countryCodeByLabel[formValues.country] ?? 'BR',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })

      // Session is stored by the useAuth hook's onSuccess callback
      setSuccessMessage('Conta criada com sucesso. Redirecionando...')
      navigate('/app')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel concluir o cadastro agora.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative min-h-[calc(100vh-2.5rem)] overflow-hidden py-2 md:py-4">
      <div className="absolute left-[-12rem] top-8 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(203,194,255,0.58),rgba(203,194,255,0.18),transparent_72%)]" />
      <div className="absolute bottom-[-9rem] right-[-9rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(227,219,255,0.56),rgba(227,219,255,0.14),transparent_74%)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-6 2xl:grid-cols-[0.82fr_1.18fr] 2xl:items-stretch">
        <aside className="hidden 2xl:flex 2xl:min-h-[calc(100vh-4.5rem)] 2xl:flex-col 2xl:justify-between rounded-[2rem] border border-white/65 bg-white/28 p-6 backdrop-blur-sm">
          <div>
            <AuthInlineLogo />

            <div className="mt-10 max-w-[24rem] space-y-4">
              <h2 className="text-[2.2rem] font-semibold leading-[1.08] tracking-[-0.07em] text-slate-950">
                Sua jornada de cuidado
                <br />
                <span className="bg-[linear-gradient(135deg,#7B4DFF_0%,#4E6DFF_65%,#2799FF_100%)] bg-clip-text text-transparent">
                  começa aqui
                </span>
              </h2>
              <p className="max-w-[22rem] text-base leading-7 text-slate-700">
                Crie sua conta e tenha uma experiência completa para monitorar sua dor, entender seu corpo e viver melhor.
              </p>
            </div>

            <div className="mt-8 space-y-6">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-white/88 shadow-[0_18px_38px_rgba(124,96,197,0.1)]">
                    <benefit.icon className="h-5 w-5 text-brand-500" />
                  </div>
                  <div className="max-w-[18rem]">
                    <p className="text-base font-semibold tracking-[-0.03em] text-slate-950">
                      {benefit.title}
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <SelfCareIllustration className="mx-auto w-full max-w-[24rem]" />
          </div>
        </aside>

        <div className="rounded-[1.75rem] border border-white/80 bg-white/92 px-4 py-6 shadow-[0_30px_88px_rgba(136,115,194,0.12)] backdrop-blur-xl md:px-6 md:py-8 xl:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="2xl:hidden">
              <AuthInlineLogo className="mb-6" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-[-0.07em] text-slate-950 md:text-3xl">
                Criar conta
              </h1>
              <p className="text-sm leading-6 text-slate-500 md:text-base">
                Preencha os dados abaixo para se cadastrar.
              </p>
            </div>

            <div className="mt-8 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <SignupField
                  label="Nome completo"
                  icon={UserRound}
                  placeholder="Seu nome completo"
                  value={formValues.name}
                  onChange={handleInputChange('name')}
                />
                <SignupField
                  label="Data de nascimento"
                  icon={CalendarDays}
                  placeholder="dd/mm/aaaa"
                  value={formValues.birthDate}
                  onChange={handleInputChange('birthDate')}
                />
              </div>

              <SignupField
                label="E-mail"
                icon={Mail}
                placeholder="seu@email.com"
                value={formValues.email}
                onChange={handleInputChange('email')}
              />

              <div className="space-y-2.5">
                <span className="text-sm font-medium text-slate-900">Senha</span>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formValues.password}
                    onChange={handleInputChange('password')}
                    className="h-12 rounded-[0.95rem] border-slate-200 bg-white/95 pl-12 pr-12 text-sm text-slate-700 placeholder:text-slate-400 md:text-base"
                    placeholder="Crie uma senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-brand-500"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-2">
                  {passwordRules.map((rule, index) => (
                    <div
                      key={rule}
                    className={`h-1.5 rounded-full ${passwordChecks[index] ? 'bg-emerald-400' : 'bg-slate-200'}`}
                  />
                ))}
              </div>
              <div className="pt-1">
                  <p className="text-sm text-slate-500">A senha deve conter pelo menos:</p>
                  <div className="mt-3 space-y-2">
                    {passwordRules.map((rule, index) => (
                      <div key={rule} className="flex items-center gap-3 text-sm text-slate-900">
                        <span
                          className={`h-4 w-4 rounded-full border ${passwordChecks[index] ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300'}`}
                        />
                        {rule}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <span className="text-sm font-medium text-slate-900">Confirmar senha</span>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formValues.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    className="h-12 rounded-[0.95rem] border-slate-200 bg-white/95 pl-12 pr-12 text-sm text-slate-700 placeholder:text-slate-400 md:text-base"
                    placeholder="Confirme sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-brand-500"
                    aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <label className="space-y-2.5">
                <span className="text-sm font-medium text-slate-900">Gênero <span className="font-normal text-slate-500">(opcional)</span></span>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <select
                    value={formValues.gender}
                    onChange={handleInputChange('gender')}
                    className="h-12 w-full appearance-none rounded-[0.95rem] border border-slate-200 bg-white/95 pl-12 pr-12 text-sm text-slate-500 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100/60 md:text-base"
                  >
                    <option value="">Selecione</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Não binário">Não binário</option>
                    <option value="Prefiro não informar">Prefiro não informar</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                </div>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <SignupField
                  label="Altura (opcional)"
                  icon={Ruler}
                  placeholder="Ex.: 1,70 m"
                  value={formValues.height}
                  onChange={handleInputChange('height')}
                />
                <SignupField
                  label="Peso (opcional)"
                  icon={Scale}
                  placeholder="Ex.: 65 kg"
                  value={formValues.weight}
                  onChange={handleInputChange('weight')}
                />
              </div>

              <label className="space-y-2.5">
                <span className="text-sm font-medium text-slate-900">País</span>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <select
                    value={formValues.country}
                    onChange={handleInputChange('country')}
                    className="h-12 w-full appearance-none rounded-[0.95rem] border border-slate-200 bg-white/95 pl-12 pr-12 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100/60 md:text-base"
                  >
                    <option>Brasil</option>
                    <option>Portugal</option>
                    <option>Argentina</option>
                    <option>Chile</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                </div>
              </label>

              <label className="flex items-start gap-3 pt-1 text-sm leading-6 text-slate-500">
                <input
                  type="checkbox"
                  checked={formValues.acceptedTerms}
                  onChange={handleInputChange('acceptedTerms')}
                  className="mt-1 h-[18px] w-[18px] rounded border-slate-300 accent-[#7B4DFF]"
                />
                <span>
                  Eu concordo com os{' '}
                  <a href="#" className="font-medium text-brand-500 hover:text-brand-600">
                    Termos de Uso
                  </a>{' '}
                  e com a{' '}
                  <a href="#" className="font-medium text-brand-500 hover:text-brand-600">
                    Política de Privacidade.
                  </a>
                </span>
              </label>

              {errorMessage ? (
                <div className="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {successMessage}
                </div>
              ) : null}

              <Button
                className="h-12 w-full rounded-[0.95rem] text-base font-semibold"
                onClick={handleSubmit}
                disabled={isSigningUp || isSubmitting}
              >
                {isSigningUp || isSubmitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
                {isSigningUp || isSubmitting ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </div>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-sm text-slate-500">ou cadastre-se com</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Button
                variant="secondary"
                className="h-12 rounded-[0.95rem] border-slate-200 bg-white text-sm font-semibold text-slate-900 shadow-none hover:bg-white"
              >
                <GoogleIcon />
                Google
              </Button>
              <Button
                variant="secondary"
                className="h-12 rounded-[0.95rem] border-slate-200 bg-white text-sm font-semibold text-slate-900 shadow-none hover:bg-white"
              >
                <AppleIcon />
                Apple
              </Button>
            </div>

            <p className="mt-6 text-center text-sm text-slate-500 md:text-base">
              Já tem uma conta?{' '}
              <Link to="/login" className="font-medium text-brand-500 hover:text-brand-600">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
