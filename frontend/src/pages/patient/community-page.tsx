import { useDeferredValue, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { CommunityPostCard } from '@/components/community-post-card'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePageTitle } from '@/hooks/use-page-title'
import { communityPosts } from '@/services/mock-data'
import { useAppStore } from '@/store/app-store'

export function CommunityPage() {
  usePageTitle('Comunidade')

  const communityFilter = useAppStore((state) => state.communityFilter)
  const setCommunityFilter = useAppStore((state) => state.setCommunityFilter)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const filteredPosts = useMemo(() => {
    const normalized = deferredSearch.toLowerCase()

    return communityPosts.filter((post) => {
      const matchesText =
        post.author.toLowerCase().includes(normalized) ||
        post.text.toLowerCase().includes(normalized)
      const matchesTab = communityFilter === 'Feed' || post.badge === communityFilter
      return matchesText && matchesTab
    })
  }, [communityFilter, deferredSearch])

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Rede de apoio"
        title="Compartilhe pequenas vitórias e desafios reais"
        description="Uma comunidade limpa, calorosa e focada em troca útil entre pessoas que entendem a jornada."
        actions={
          <Button>
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
            {filteredPosts.map((post) => (
              <CommunityPostCard key={`${post.author}-${post.time}`} {...post} />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card-surface p-5">
            <p className="section-label">Encontros da semana</p>
            <div className="mt-4 space-y-3">
              {[
                'Roda de conversa sobre sono reparador',
                'Grupo de caminhada leve e consistência',
                'Sessão ao vivo com fisioterapeuta parceira',
              ].map((item) => (
                <div key={item} className="rounded-[1.2rem] bg-brand-50/55 px-4 py-3.5 text-sm text-foreground">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="card-surface p-5">
            <p className="section-label">Tópicos em alta</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {['Sono', 'Alívio muscular', 'Ansiedade', 'Rotina gentil', 'Alimentação'].map(
                (tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/80 bg-white/84 px-3.5 py-2 text-sm font-medium text-brand-700 shadow-soft"
                  >
                    #{tag}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
