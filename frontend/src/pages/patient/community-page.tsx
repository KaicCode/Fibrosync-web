import { useDeferredValue, useMemo, useState } from 'react'
import { LoaderCircle, Plus, Search, Users } from 'lucide-react'
import { CommunityPostCard } from '@/components/community-post-card'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCommunity } from '@/hooks/useCommunity'
import { usePageTitle } from '@/hooks/use-page-title'
import { useUser } from '@/hooks/useUser'
import { ApiError } from '@/lib/api-client'
import { resolveUserAvatar, resolveUserDisplayName } from '@/lib/user-profile'
import type { CommunityPostType } from '@/services/community.service'
import { useAppStore } from '@/store/app-store'

const feedFilterMap: Record<string, CommunityPostType | undefined> = {
  Feed: undefined,
  Pergunta: 'QUESTION',
  Insight: 'INSIGHT',
}

const composerOptions: Array<{ value: CommunityPostType; label: string; description: string }> = [
  {
    value: 'FEED',
    label: 'Feed',
    description: 'Compartilhe algo vivido hoje para apoiar outras pessoas.',
  },
  {
    value: 'QUESTION',
    label: 'Pergunta',
    description: 'Peça ajuda, rotina ou sugestão para a comunidade.',
  },
  {
    value: 'INSIGHT',
    label: 'Insight',
    description: 'Registre um aprendizado ou padrão que você percebeu.',
  },
]

export function CommunityPage() {
  usePageTitle('Comunidade')

  const communityFilter = useAppStore((state) => state.communityFilter)
  const setCommunityFilter = useAppStore((state) => state.setCommunityFilter)
  const authSessionUser = useAppStore((state) => state.authSession?.user ?? null)
  const { user } = useUser()
  const [search, setSearch] = useState('')
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [postType, setPostType] = useState<CommunityPostType>('FEED')
  const [draft, setDraft] = useState('')
  const deferredSearch = useDeferredValue(search)
  const currentUser = user ?? authSessionUser
  const { posts, isLoading, createPost, isCreating } = useCommunity({
    type: feedFilterMap[communityFilter] ?? undefined,
    search: deferredSearch.trim() || undefined,
    limit: 50,
  })

  const communityStats = useMemo(() => {
    const authors = new Set(posts.map((post) => post.author.id))
    const questions = posts.filter((post) => post.type === 'QUESTION').length
    const insights = posts.filter((post) => post.type === 'INSIGHT').length

    return {
      authors: authors.size,
      questions,
      insights,
    }
  }, [posts])

  const highlightedTags = useMemo(() => {
    const counts = new Map<string, number>()

    posts.forEach((post) => {
      post.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      })
    })

    return Array.from(counts.entries())
      .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
      .slice(0, 8)
  }, [posts])

  const authorName = resolveUserDisplayName(currentUser)
  const authorAvatar = resolveUserAvatar(currentUser)

  async function handleCreatePost() {
    const content = draft.trim()

    if (content.length < 3) {
      window.alert('Escreva pelo menos 3 caracteres para publicar um post.')
      return
    }

    try {
      await createPost({
        type: postType,
        content,
      })
      setDraft('')
      setPostType('FEED')
      setIsComposerOpen(false)
      window.alert('Post publicado com sucesso.')
    } catch (error) {
      if (error instanceof ApiError) {
        window.alert(`Erro ao publicar: ${error.message}`)
        return
      }

      window.alert('Nao foi possível publicar o post agora.')
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Rede de apoio"
        title="Compartilhe sua experiência e veja o que outras pessoas estão vivendo"
        description="Cada perfil autenticado pode publicar no feed e acompanhar os posts criados pelos demais usuários da plataforma."
        actions={
          <Button onClick={() => setIsComposerOpen(true)}>
            <Plus className="h-4 w-4" />
            Criar post
          </Button>
        }
      />

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
        <div className="space-y-5">
          <div className="card-surface p-4 md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <Tabs value={communityFilter} onValueChange={setCommunityFilter}>
                <TabsList>
                  <TabsTrigger value="Feed">Feed</TabsTrigger>
                  <TabsTrigger value="Pergunta">Perguntas</TabsTrigger>
                  <TabsTrigger value="Insight">Insights</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-10"
                  placeholder="Buscar conversas..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="card-surface flex min-h-[18rem] items-center justify-center p-6">
                <LoaderCircle className="h-7 w-7 animate-spin text-brand-500" />
              </div>
            ) : posts.length > 0 ? (
              posts.map((post) => <CommunityPostCard key={post.id} post={post} />)
            ) : (
              <div className="card-surface p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <Users className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">Nenhum post encontrado</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Ajuste a busca ou publique a primeira mensagem para movimentar a comunidade.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card-surface p-5">
            <p className="section-label">Panorama da comunidade</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-[1.2rem] bg-brand-50/55 px-4 py-3.5">
                <p className="text-2xl font-semibold tracking-[-0.05em] text-foreground">{posts.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">Posts visíveis no filtro atual</p>
              </div>
              <div className="rounded-[1.2rem] bg-white/84 px-4 py-3.5 shadow-soft">
                <p className="text-2xl font-semibold tracking-[-0.05em] text-foreground">{communityStats.authors}</p>
                <p className="mt-1 text-sm text-muted-foreground">Perfis ativos nesta seleção</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] bg-white/84 px-4 py-3.5 shadow-soft">
                  <p className="text-xl font-semibold tracking-[-0.04em] text-foreground">{communityStats.questions}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Perguntas abertas</p>
                </div>
                <div className="rounded-[1.2rem] bg-white/84 px-4 py-3.5 shadow-soft">
                  <p className="text-xl font-semibold tracking-[-0.04em] text-foreground">{communityStats.insights}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Insights compartilhados</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-surface p-5">
            <p className="section-label">Tópicos em alta</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {highlightedTags.length > 0 ? (
                highlightedTags.map(([tag, count]) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/80 bg-white/84 px-3.5 py-2 text-sm font-medium text-brand-700 shadow-soft"
                  >
                    #{tag} · {count}
                  </span>
                ))
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  Use hashtags como <span className="font-medium text-foreground">#sono</span> ou{' '}
                  <span className="font-medium text-foreground">#rigidez</span> nos posts para criar tópicos reais.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isComposerOpen} onOpenChange={setIsComposerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo post da comunidade</DialogTitle>
            <DialogDescription>
              Seu texto será salvo no banco e ficará visível para os outros perfis autenticados.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-5">
            <div className="rounded-[1.35rem] border border-white/80 bg-white/90 p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="h-11 w-11 rounded-2xl border border-white/80 bg-white object-cover shadow-soft"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">{authorName}</p>
                  <p className="text-xs text-muted-foreground">Publicando na comunidade FibroSync</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Tipo do post</p>
              <div className="grid gap-2 md:grid-cols-3">
                {composerOptions.map((option) => {
                  const isActive = postType === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPostType(option.value)}
                      className={`rounded-[1.2rem] border px-4 py-3 text-left transition ${
                        isActive
                          ? 'border-brand-300 bg-brand-50 text-brand-900 shadow-soft'
                          : 'border-white/80 bg-white/84 text-foreground hover:bg-white'
                      }`}
                    >
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{option.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Mensagem</p>
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Escreva o que você quer compartilhar. Se quiser, use hashtags como #sono ou #fadiga."
                className="min-h-[180px]"
                maxLength={1200}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Minimo de 3 caracteres.</span>
                <span>{draft.trim().length}/1200</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setIsComposerOpen(false)} disabled={isCreating}>
                Cancelar
              </Button>
              <Button onClick={handleCreatePost} disabled={isCreating || draft.trim().length < 3}>
                {isCreating ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Publicar post
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
