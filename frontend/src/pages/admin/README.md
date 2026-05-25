# Admin Dashboard Module - FibroSync

Módulo administrativo web completo para o sistema FibroSync, implementado com React + Vite + TypeScript.

## 📋 Visão Geral

O módulo Admin Dashboard fornece uma interface completa para gerenciar e monitorar o sistema FibroSync, incluindo:

- 📊 Dashboard com métricas principais
- 👥 Gerenciamento de usuários
- 📄 Geração e exportação de relatórios
- 📈 Análiticos avançados com gráficos interativos
- ⚙️ Configurações do sistema (IA, notificações, limites de risco)

## 📁 Estrutura de Arquivos

```
src/
├── components/admin/
│   ├── charts/
│   │   ├── triggers-chart.tsx          # Gráfico de gatilhos
│   │   ├── symptoms-chart.tsx          # Padrões de sintomas
│   │   ├── adherence-chart.tsx         # Taxa de adesão
│   │   ├── symptom-correlation-chart.tsx # Correlação de sintomas
│   │   └── prediction-history-chart.tsx  # Histórico de predições
│   ├── tables/
│   │   ├── users-table.tsx             # Tabela de usuários
│   │   ├── crisis-alerts-table.tsx     # Tabela de alertas de crise
│   │   └── reports-table.tsx           # Tabela de relatórios
│   ├── cards/
│   │   ├── metric-card.tsx             # Card de métrica
│   │   ├── alert-card.tsx              # Card de alerta
│   │   ├── date-range-filter.tsx       # Filtro de período
│   │   ├── content-section.tsx         # Seção de conteúdo
│   │   └── index.ts                    # Exportações
├── pages/admin/
│   ├── dashboard-page.tsx              # /admin/dashboard
│   ├── users-page.tsx                  # /admin/users
│   ├── reports-page.tsx                # /admin/reports
│   ├── analytics-page.tsx              # /admin/analytics
│   └── settings-page.tsx               # /admin/settings
├── services/
│   └── admin.ts                        # API calls do admin
├── types/
│   └── admin.ts                        # Tipos TypeScript
├── hooks/
│   └── use-admin.ts                    # Custom hooks
└── lib/
    └── navigation.ts                   # Configuração de rotas
```

## 🚀 Páginas e Funcionalidades

### 1. Dashboard (`/admin/dashboard`)

**Componentes:**
- Cards de métricas (Total de usuários, Usuários ativos, Risco médio, Taxa de adesão)
- Gráfico de gatilhos mais comuns
- Alertas de crise recentes
- Informações adicionais (Gatilho mais frequente, Registros diários, Histórico de predições)

**Filtros:**
- Período de data customizável

### 2. Usuários (`/admin/users`)

**Funcionalidades:**
- Tabela paginada com todos os usuários
- Busca em tempo real
- Sorting por coluna
- Painel de detalhes do usuário
- Alteração de role (User/Admin)
- Indicadores de status (Ativo/Inativo)

### 3. Relatórios (`/admin/reports`)

**Funcionalidades:**
- Gerar relatórios de 3 tipos:
  - Relatório de Usuários
  - Relatório de Crises
  - Relatório Analítico
- Exportar em 2 formatos:
  - JSON
  - PDF
- Histórico de relatórios gerados
- Download direto

### 4. Análiticos (`/admin/analytics`)

**Gráficos:**
- Gatilhos mais comuns (Bar Chart)
- Padrões de sintomas (Line Chart duplo)
- Correlação de sintomas (Scatter Plot)
- Histórico de predições (Line Chart com acurácia)

**Filtros:**
- Período de data customizável

### 5. Configurações (`/admin/settings`)

**Seções:**

#### IA
- Ativar/desativar motor de IA
- Ajustar limiar de risco
- Configurar frequência de atualização

#### Notificações
- Alertas de crise
- Lembretes de adesão
- Notificações do sistema
- Canais (Email, SMS)

#### Limites de Risco
- Limiar crítico (ajustável)
- Limiar alto (ajustável)
- Limiar médio (ajustável)
- Frequência de verificação

## 🔧 Componentes Reutilizáveis

### Charts
- `<TriggersBarChart />` - Gráfico de barras para gatilhos
- `<SymptomsPatternsChart />` - Gráfico de linhas duplo para sintomas
- `<AdherenceChart />` - Gráfico de rosca para adesão
- `<SymptomCorrelationChart />` - Scatter plot para correlações
- `<PredictionHistoryChart />` - Gráfico de linhas para histórico

### Tables
- `<UsersTable />` - Tabela de usuários com busca e sort
- `<CrisisAlertsTable />` - Tabela de alertas de crise
- `<ReportsTable />` - Tabela de relatórios com download

### Cards
- `<AdminMetricCard />` - Card de métrica com ícone e tendência
- `<AdminAlertCard />` - Card de alerta (info/warning/error/success)
- `<DateRangeFilter />` - Filtro de período com data picker
- `<AdminContentSection />` - Seção de conteúdo com loading

## 🔌 Integração com API

### Serviços Disponíveis

```typescript
// Dashboard
getAdminDashboardMetrics()
getCrisisAlerts(page, limit)

// Usuários
getAdminUsers(page, limit, search)
getUserDetails(userId)
updateUserRole(userId, role)
deactivateUser(userId)

// Análiticos
getAnalytics(startDate, endDate)
getTriggerAnalytics(period)
getSymptomCorrelation()
getRecurringPatterns()
getPredictionHistory(page, limit)

// Relatórios
generateReport(type, format)
getReports(page, limit)
downloadReport(reportId)

// Configurações
getAISettings()
updateAISettings(settings)
getNotificationSettings()
updateNotificationSettings(settings)
getRiskLimits()
updateRiskLimits(limits)
```

## 🎣 Custom Hooks

### `useAdminDashboardMetrics()`
Carrega métricas do dashboard.

```typescript
const { metrics, isLoading, error } = useAdminDashboardMetrics()
```

### `useCrisisAlerts(page, limit)`
Carrega alertas de crise com paginação.

```typescript
const { data, isLoading, error } = useCrisisAlerts(1, 10)
```

### `useAdminUsers(page, limit, search)`
Carrega usuários com busca e paginação.

```typescript
const { data, isLoading, error } = useAdminUsers(1, 10, 'john')
```

### `useAnalytics(startDate, endDate)`
Carrega dados analíticos para o período.

```typescript
const { data, isLoading, error } = useAnalytics('2026-05-01', '2026-05-31')
```

## 📊 Tipos de Dados

```typescript
// Métricas principais
AdminDashboardMetrics {
  totalUsers: number
  activeUsers: number
  averageCrisisRisk: number
  mostCommonTrigger: string
  adherenceRate: number
  avgSymptomPatterns: SymptomPattern[]
  dailyRecordsCount: number
  predictionHistoryCount: number
}

// Usuário
AdminUser {
  id: number
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  lastLogin?: string
  status: 'active' | 'inactive'
}

// Alerta de crise
CrisisAlert {
  id: number
  userId: number
  userName: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  trigger: string
  timestamp: string
}

// Relatório
AdminReport {
  id: string
  name: string
  type: 'users' | 'crisis' | 'analytics'
  generatedAt: string
  format: 'json' | 'pdf'
  url?: string
}
```

## 🔐 Proteção e Autenticação

- ✅ Autenticação JWT obrigatória
- ✅ Proteção por role (apenas admins)
- ✅ Token armazenado no localStorage
- ✅ Renovação automática de token (via middleware)

## 🎨 Temas e Styling

- Utiliza TailwindCSS com tokens customizados
- Componentes ShadCN UI
- Design responsivo (mobile, tablet, desktop)
- Tema claro/escuro pronto

## 📱 Responsividade

- ✅ Mobile (320px+)
- ✅ Tablet (768px+)
- ✅ Desktop (1024px+)
- ✅ Large screens (1280px+)

## 🚀 Como Usar

### 1. Iniciar o desenvolvimento
```bash
cd frontend
npm run dev
```

### 2. Acessar o Admin Dashboard
```
http://localhost:5173/admin
```

### 3. Navegar pelas páginas
- Dashboard: `/admin/dashboard`
- Usuários: `/admin/users`
- Relatórios: `/admin/reports`
- Análiticos: `/admin/analytics`
- Configurações: `/admin/settings`

## 🔄 Fluxo de Dados

1. **Componente** renderiza e chama hook
2. **Hook** chama serviço de API
3. **Serviço** envia requisição autenticada
4. **Backend** processa e retorna dados
5. **Hook** atualiza estado
6. **Componente** renderiza com novos dados

## 📝 Exemplo de Uso

```typescript
import { useAdminDashboardMetrics } from '@/hooks/use-admin'
import { AdminMetricCard } from '@/components/admin'
import { Users } from 'lucide-react'

export function MyComponent() {
  const { metrics, isLoading } = useAdminDashboardMetrics()

  return (
    <AdminMetricCard
      label="Total de Usuários"
      value={metrics?.totalUsers ?? 0}
      icon={Users}
      variant="default"
      trend={12}
    />
  )
}
```

## 🐛 Troubleshooting

**Página em branco?**
- Verifique se está autenticado como admin
- Verifique token no localStorage
- Verifique console do navegador para erros

**Dados não carregam?**
- Verifique se a API está rodando
- Verifique endpoint da API em `.env`
- Verifique token de autenticação

**Gráficos não aparecem?**
- Instale `recharts`: `npm install recharts`
- Verifique dados mock nos componentes

## 🔄 Próximos Passos

- [ ] Integrar com API real do backend
- [ ] Implementar paginação completa
- [ ] Adicionar export PDF real
- [ ] Implementar real-time updates com WebSocket
- [ ] Adicionar filtros avançados
- [ ] Implementar busca full-text
- [ ] Adicionar gráficos mais complexos
- [ ] Implementar dashboard customizável

## 📚 Dependências

- `react` - Biblioteca UI
- `react-router-dom` - Roteamento
- `recharts` - Gráficos
- `lucide-react` - Ícones
- `tailwindcss` - Styling
- `zustand` - State management
- `typescript` - Type safety

## 📄 Licença

FibroSync © 2026. Todos os direitos reservados.
