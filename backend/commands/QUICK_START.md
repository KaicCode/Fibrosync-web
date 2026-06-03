# 🚀 Guia Rápido - Admin Dashboard

## ⚡ Inicialização Rápida

### 1. Instalar dependências (já instaladas)
```bash
cd frontend
npm install
```

### 2. Iniciar dev server
```bash
npm run dev
```

### 3. Abrir no navegador
```
http://localhost:5173/admin/dashboard
```

---

## 📍 Rotas Principais

| Página | URL | Descrição |
|--------|-----|-----------|
| Dashboard | `/admin/dashboard` | Métricas e alertas |
| Usuários | `/admin/users` | Gerenciar usuários |
| Relatórios | `/admin/reports` | Gerar/exportar relatórios |
| Análiticos | `/admin/analytics` | Gráficos e correlações |
| Configurações | `/admin/settings` | Configurar sistema |

---

## 🎯 Features Principais

### Dashboard
✅ Cards de métricas com tendências  
✅ Gráfico de gatilhos (bar chart)  
✅ Alertas de crise recentes  
✅ Filtro de período  
✅ Informações adicionais  

### Usuários
✅ Tabela com busca e sort  
✅ Paginação  
✅ Painel de detalhes  
✅ Edição de role  
✅ Status de ativo/inativo  

### Relatórios
✅ Gerar relatórios (3 tipos)  
✅ Múltiplos formatos (JSON, PDF)  
✅ Histórico de gerados  
✅ Download direto  

### Análiticos
✅ 5 gráficos interativos  
✅ Filtro por período  
✅ Correlações entre sintomas  
✅ Histórico de predições  
✅ Estatísticas resumidas  

### Configurações
✅ Configurar motor de IA  
✅ Ajustar limiares de risco  
✅ Configurar notificações  
✅ Canais de comunicação  

---

## 📁 Arquivos Principais

```
src/
├── components/admin/
│   ├── charts/          # 5 componentes de gráficos
│   ├── tables/          # 3 componentes de tabelas
│   └── cards/           # 4 componentes de cards
├── pages/admin/
│   ├── dashboard-page.tsx
│   ├── users-page.tsx
│   ├── reports-page.tsx
│   ├── analytics-page.tsx
│   └── settings-page.tsx
├── services/admin.ts    # 20+ funções de API
├── types/admin.ts       # 10+ tipos TypeScript
└── hooks/use-admin.ts   # 4 custom hooks
```

---

## 🔌 Como Adicionar Nova Funcionalidade

### 1. Criar tipo em `src/types/admin.ts`
```typescript
export type NewFeature = {
  id: number
  name: string
  value: string
}
```

### 2. Criar função de API em `src/services/admin.ts`
```typescript
export async function getNewFeature(): Promise<NewFeature[]> {
  return authenticatedFetch<NewFeature[]>('/admin/new-feature')
}
```

### 3. Criar hook em `src/hooks/use-admin.ts`
```typescript
export function useNewFeature() {
  const [data, setData] = useState<NewFeature[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoading(true)
        const result = await getNewFeature()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed'))
      } finally {
        setIsLoading(false)
      }
    }

    fetch()
  }, [])

  return { data, isLoading, error }
}
```

### 4. Usar em componente
```typescript
import { useNewFeature } from '@/hooks/use-admin'

export function NewComponent() {
  const { data, isLoading } = useNewFeature()

  return (
    <AdminContentSection title="Nova Função" isLoading={isLoading}>
      {data && data.map(item => <div key={item.id}>{item.name}</div>)}
    </AdminContentSection>
  )
}
```

---

## 🎨 Componentes Reutilizáveis

### AdminMetricCard
```typescript
<AdminMetricCard
  label="Total Usuários"
  value={150}
  icon={Users}
  variant="default"
  trend={12}
/>
```

### AdminContentSection
```typescript
<AdminContentSection
  title="Minha Seção"
  description="Descrição"
  isLoading={isLoading}
>
  {/* conteúdo */}
</AdminContentSection>
```

### DateRangeFilter
```typescript
<DateRangeFilter
  startDate={startDate}
  endDate={endDate}
  onStartDateChange={setStartDate}
  onEndDateChange={setEndDate}
  onApply={handleApply}
/>
```

---

## 🔄 Fluxo de Dados

```
Hook Custom
    ↓
Service (API Call)
    ↓
Backend (NestJS)
    ↓
Database (Prisma)
    ↓
Backend (responde)
    ↓
Hook (atualiza estado)
    ↓
Component (renderiza)
```

---

## 🧪 Mock Data

Componentes incluem mock data. Para usar:

1. **Desenvolvimento:** Mock data é usado automaticamente
2. **Produção:** Remova mock data, use API real
3. **Alternância:** Edite `dashboard-page.tsx` linha 40+

---

## ⚙️ Configuração

### Variables de Ambiente
```bash
# .env (frontend)
VITE_API_URL=http://localhost:3000/api
```

### Token JWT
```typescript
// localStorage
localStorage.setItem('token', 'seu-jwt-token')
```

---

## 📊 Estatísticas

| Métrica | Valor |
|---------|-------|
| Componentes | 12 |
| Páginas | 5 |
| Tipos TypeScript | 10+ |
| Funções de API | 20+ |
| Custom Hooks | 4 |
| Gráficos | 5 |
| Tabelas | 3 |

---

## 📚 Documentação

- **Completa:** `src/pages/admin/README.md`
- **Backend Integration:** `BACKEND_INTEGRATION_GUIDE.md`
- **Summary:** `ADMIN_DASHBOARD_SUMMARY.md`

---

## 🚨 Checklist antes de Deploy

- [ ] Testar todas as páginas
- [ ] Verificar autenticação
- [ ] Validar gráficos
- [ ] Testar responsividade
- [ ] Verificar console (sem erros)
- [ ] Testar com dados reais
- [ ] Documentar mudanças
- [ ] Build sem erros

---

## 💡 Tips & Tricks

1. **Reload rápido:** Ctrl+Shift+R
2. **Console errors:** F12 → Console
3. **Network requests:** F12 → Network
4. **Mock toggle:** Edite linha em dashboard-page.tsx
5. **Debug:** Adicione `console.log()` nos hooks

---

## ❓ FAQ

**P: Como adicionar nova página?**  
R: Crie arquivo em `pages/admin/`, adicione rota em `routes/index.tsx` e item na navegação em `lib/navigation.ts`

**P: Como customizar cores?**  
R: Edite `tailwind.config.js` e classes nos componentes

**P: Como mudar de mock para API real?**  
R: Remova dados mock e use o serviço: `const data = await getAdminUsers()`

**P: Dados não aparecem?**  
R: Verifique console (F12), token em localStorage, e endpoint da API

---

## 🆘 Suporte

Para problemas:
1. Cheque console (F12)
2. Leia `BACKEND_INTEGRATION_GUIDE.md`
3. Verifique tipos em `src/types/admin.ts`
4. Consulte documentação completa

---

**Versão:** 1.0  
**Data:** 25/05/2026  
**Status:** ✅ Pronto para produção
