import { BellRing, Settings, Target, Trophy } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PageHeader } from '@/components/page-header'
import { Progress } from '@/components/ui/progress'
import { StatCard } from '@/components/stat-card'
import { usePageTitle } from '@/hooks/use-page-title'
import { profileProgress, profileSettings, profileStats } from '@/services/mock-data'

export function ProfilePage() {
  usePageTitle('Perfil')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Perfil e progresso"
        title="Acompanhe seu avanço com delicadeza e consistência"
        description="Visualize marcos, metas pessoais e preferências do seu cuidado em uma área organizada e acolhedora."
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="card-surface p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <Avatar className="h-24 w-24 rounded-[2rem]">
              <AvatarImage src="https://i.pravatar.cc/120?img=44" alt="Juliana Santos" />
              <AvatarFallback className="rounded-[2rem] text-xl">JS</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">Juliana Santos</h2>
              <p className="text-sm text-muted-foreground">Membro desde Jan 2024</p>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                Construindo uma rotina de autocuidado mais previsível com foco em energia, sono e redução de gatilhos diários.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {profileStats.map((item) => (
              <div key={item.label} className="rounded-[1.5rem] bg-brand-50/55 p-5">
                <p className="section-label">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <StatCard label="Meta principal" value="Reduzir rigidez matinal" hint="Próximos 21 dias" icon={Target} />
          <StatCard label="Conquista recente" value="12 dias" hint="Sequência de registros" icon={Trophy} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="card-surface p-6">
          <p className="section-label">Meu progresso</p>
          <div className="mt-5 space-y-5">
            {profileProgress.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-muted-foreground">{item.value}%</p>
                </div>
                <Progress value={item.value} />
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface p-6">
          <p className="section-label">Configurações rápidas</p>
          <div className="mt-5 space-y-3">
            {profileSettings.map((setting, index) => (
              <div
                key={setting}
                className="flex items-center justify-between rounded-[1.4rem] border border-white/80 bg-white/84 px-4 py-4 shadow-soft"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                    {index % 2 === 0 ? <BellRing className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                  </div>
                  <p className="text-sm font-medium text-foreground">{setting}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
