import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react'
import { Bot, Play, SendHorizonal, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePageTitle } from '@/hooks/use-page-title'
import { aiConversation, aiSuggestions } from '@/services/mock-data'

type ChatMessage = {
  role: 'assistant' | 'user'
  text: string
  time: string
}

const automaticReply =
  'Vamos observar dois fatores hoje: fadiga acumulada e postura prolongada. Tente a técnica de respiração guiada e registre se a intensidade cai após 15 minutos.'

export function AssistantPage() {
  usePageTitle('Assistente IA')

  const [messages, setMessages] = useState<ChatMessage[]>(aiConversation)
  const [draft, setDraft] = useState('')
  const messagesRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = useEffectEvent(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: 'smooth',
    })
  })

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = (text: string) => {
    const trimmed = text.trim()

    if (!trimmed) {
      return
    }

    startTransition(() => {
      setMessages((current) => [
        ...current,
        { role: 'user', text: trimmed, time: 'Agora' },
        { role: 'assistant', text: automaticReply, time: 'Agora' },
      ])
    })
    setDraft('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assistente FibroSync"
        title="Converse com a IA sobre seu corpo e sua rotina"
        description="Receba respostas objetivas, sugestões práticas e apoio contextualizado aos seus registros."
      />

      <div className="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
        <div className="card-surface flex min-h-[38rem] flex-col p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="section-label">Chat inteligente</p>
              <h2 className="mt-1 text-2xl font-semibold">IA Assistente</h2>
            </div>
          </div>

          <div ref={messagesRef} className="scrollbar-none flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.map((message, index) => (
              <div
                key={`${message.time}-${index}`}
                className={`max-w-[85%] rounded-[1.6rem] px-4 py-3 text-sm leading-6 shadow-soft ${
                  message.role === 'assistant'
                    ? 'bg-brand-50 text-foreground'
                    : 'ml-auto bg-brand-gradient text-white'
                }`}
              >
                <p>{message.text}</p>
                <p
                  className={`mt-2 text-xs ${
                    message.role === 'assistant' ? 'text-muted-foreground' : 'text-white/75'
                  }`}
                >
                  {message.time}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Digite sua mensagem..."
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  sendMessage(draft)
                }
              }}
            />
            <Button size="icon" onClick={() => sendMessage(draft)}>
              <SendHorizonal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-surface p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="section-label">Sugestões inteligentes</p>
                <h2 className="mt-1 text-2xl font-semibold">Ações rápidas</h2>
              </div>
            </div>
            <div className="space-y-4">
              {aiSuggestions.map((suggestion) => (
                <button
                  key={suggestion.title}
                  type="button"
                  onClick={() => sendMessage(`Quero ajuda com ${suggestion.title.toLowerCase()}.`)}
                  className="flex w-full items-center justify-between rounded-[1.5rem] border border-white/80 bg-white/85 px-4 py-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-50/70"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{suggestion.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{suggestion.subtitle}</p>
                  </div>
                  <p className="text-sm font-medium text-brand-600">{suggestion.detail}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="card-surface p-6">
            <p className="section-label">Técnica recomendada</p>
            <div className="mt-4 rounded-[1.6rem] bg-brand-gradient p-[1px] shadow-glow">
              <div className="rounded-[1.55rem] bg-white/94 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-foreground">Respiração profunda</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Faça 5 ciclos de inspiração nasal em 4 tempos e expiração em 6 tempos para reduzir a tensão no fim do dia.
                    </p>
                  </div>
                  <Button size="icon">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
