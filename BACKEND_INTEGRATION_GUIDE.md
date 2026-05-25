# 🔗 Guia de Integração - Admin Dashboard com Backend

Este guia descreve como integrar o Admin Dashboard Frontend com o Backend NestJS.

## 📋 Sumário de Endpoints Necessários

O Frontend espera os seguintes endpoints no Backend. Implemente-os para uma integração completa.

---

## 🏠 Dashboard Endpoints

### GET `/api/admin/metrics`
**Descrição:** Retorna as métricas principais do dashboard

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeUsers": 120,
    "averageCrisisRisk": 0.42,
    "mostCommonTrigger": "Estresse",
    "adherenceRate": 0.78,
    "avgSymptomPatterns": [
      {
        "symptom": "Dor muscular",
        "frequency": 85,
        "avgIntensity": 6.5
      }
    ],
    "dailyRecordsCount": 450,
    "predictionHistoryCount": 200
  }
}
```

### GET `/api/admin/crisis-alerts?page=1&limit=10`
**Descrição:** Retorna alertas de crise com paginação

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "userId": 5,
        "userName": "João Silva",
        "riskLevel": "high",
        "trigger": "Estresse no trabalho",
        "timestamp": "2026-05-25T14:30:00Z"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 10,
    "hasMore": true
  }
}
```

---

## 👥 Users Endpoints

### GET `/api/admin/users?page=1&limit=10&search=`
**Descrição:** Retorna lista de usuários com busca e paginação

**Query Parameters:**
- `page` (number) - Número da página
- `limit` (number) - Limite de registros por página
- `search` (string) - Termo de busca

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "name": "Maria Santos",
        "email": "maria@email.com",
        "role": "USER",
        "createdAt": "2026-01-15T08:00:00Z",
        "lastLogin": "2026-05-25T10:30:00Z",
        "status": "active"
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 10,
    "hasMore": true
  }
}
```

### GET `/api/admin/users/:id`
**Descrição:** Retorna detalhes de um usuário específico

**Response:** Mesmo formato do item anterior

### PATCH `/api/admin/users/:id`
**Descrição:** Atualiza a função (role) de um usuário

**Body:**
```json
{
  "role": "ADMIN"
}
```

**Response:** Dados atualizados do usuário

### DELETE `/api/admin/users/:id`
**Descrição:** Desativa um usuário

**Response:**
```json
{
  "success": true,
  "message": "Usuário desativado com sucesso"
}
```

---

## 📊 Analytics Endpoints

### GET `/api/admin/analytics?startDate=2026-05-01&endDate=2026-05-31`
**Descrição:** Retorna dados analíticos para o período

**Query Parameters:**
- `startDate` (string) - Data inicial (YYYY-MM-DD)
- `endDate` (string) - Data final (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "triggers": [
      {
        "name": "Estresse",
        "count": 125,
        "percentage": 35.5,
        "trend": 12
      }
    ],
    "symptoms": [
      {
        "symptom": "Dor muscular",
        "frequency": 85,
        "avgIntensity": 6.5,
        "trend": 5
      }
    ],
    "dailyRecords": [
      {
        "date": "2026-05-25",
        "total": 45,
        "avgAdherence": 0.78
      }
    ],
    "predictions": [
      {
        "id": 1,
        "userId": 5,
        "riskScore": 0.75,
        "predictedTriggers": ["Estresse", "Atividade Física"],
        "timestamp": "2026-05-25T14:30:00Z",
        "accuracy": 0.85
      }
    ]
  }
}
```

### GET `/api/admin/analytics/triggers?period=month`
**Descrição:** Retorna análise de gatilhos para o período

**Query Parameters:**
- `period` - "day" | "week" | "month"

### GET `/api/admin/analytics/symptoms`
**Descrição:** Retorna análise de sintomas e correlações

### GET `/api/admin/analytics/patterns`
**Descrição:** Retorna padrões recorrentes identificados

### GET `/api/admin/analytics/predictions?page=1&limit=10`
**Descrição:** Retorna histórico de predições

---

## 📄 Reports Endpoints

### POST `/api/admin/reports`
**Descrição:** Gera um novo relatório

**Body:**
```json
{
  "type": "users",
  "format": "json"
}
```

**Tipos:** "users" | "crisis" | "analytics"  
**Formatos:** "json" | "pdf"

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "report-2026-05-25-001",
    "name": "Relatório de Usuários - Maio 2026",
    "type": "users",
    "generatedAt": "2026-05-25T15:00:00Z",
    "format": "json",
    "url": "/downloads/report-2026-05-25-001.json"
  }
}
```

### GET `/api/admin/reports?page=1&limit=10`
**Descrição:** Retorna lista de relatórios gerados

### GET `/api/admin/reports/:id/download`
**Descrição:** Retorna o arquivo do relatório para download

---

## ⚙️ Settings Endpoints

### GET `/api/admin/settings/ai`
**Descrição:** Retorna configurações de IA

**Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "riskThreshold": 0.7,
    "predictionAccuracy": 85.5,
    "updateFrequency": "daily"
  }
}
```

### PUT `/api/admin/settings/ai`
**Descrição:** Atualiza configurações de IA

**Body:**
```json
{
  "enabled": true,
  "riskThreshold": 0.75,
  "updateFrequency": "weekly"
}
```

### GET `/api/admin/settings/notifications`
**Descrição:** Retorna configurações de notificações

**Response:**
```json
{
  "success": true,
  "data": {
    "crisisAlerts": true,
    "adherenceReminders": true,
    "systemNotifications": true,
    "emailNotifications": true,
    "smsNotifications": false
  }
}
```

### PUT `/api/admin/settings/notifications`
**Descrição:** Atualiza configurações de notificações

### GET `/api/admin/settings/risk`
**Descrição:** Retorna limites de risco

**Response:**
```json
{
  "success": true,
  "data": {
    "criticalThreshold": 0.9,
    "highThreshold": 0.7,
    "mediumThreshold": 0.5,
    "checkFrequency": 6
  }
}
```

### PUT `/api/admin/settings/risk`
**Descrição:** Atualiza limites de risco

---

## 🔒 Autenticação

Todos os endpoints requerem autenticação JWT. O Frontend enviará o token no header:

```
Authorization: Bearer <token>
```

**Guardar o token no localStorage:**
```typescript
localStorage.setItem('token', 'seu-token-jwt')
```

---

## 📝 Estrutura de Response Padrão

Todos os endpoints devem retornar a seguinte estrutura:

```json
{
  "success": boolean,
  "message": "string",
  "data": object,
  "statusCode": number
}
```

---

## 🧪 Testando a Integração

### 1. Mock Data (Desenvolvimento)
Os componentes possuem dados mock embutidos. Para desenvolver:

```typescript
// Os componentes usam mock data automaticamente se a API falhar
// Dados mock estão em: mockTriggersData, mockSymptomsData, etc.
```

### 2. Substituir Mock pela API
Quando o backend estiver pronto, edite os serviços:

```typescript
// Em src/services/admin.ts
export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  return authenticatedFetch<AdminDashboardMetrics>('/admin/metrics')
  // Remove dados mock de dashboard-page.tsx
}
```

### 3. Teste com Postman/Insomnia
```bash
# Exemplo de requisição
curl -H "Authorization: Bearer {token}" \
  http://localhost:3000/api/admin/metrics
```

---

## 🚀 Checklist de Implementação

### Backend (NestJS)

- [ ] Criar módulo `admin.module.ts`
- [ ] Criar controller `admin.controller.ts`
- [ ] Criar serviço `admin.service.ts`
- [ ] Implementar endpoints de métricas
- [ ] Implementar endpoints de usuários
- [ ] Implementar endpoints de análiticos
- [ ] Implementar endpoints de relatórios
- [ ] Implementar endpoints de configurações
- [ ] Adicionar guards de autenticação
- [ ] Adicionar middleware de role
- [ ] Testes unitários
- [ ] Testes de integração

### Frontend (Pronto)

- [x] Componentes criados
- [x] Páginas criadas
- [x] Tipos TypeScript definidos
- [x] Serviços de API estruturados
- [x] Hooks customizados
- [x] Rotas configuradas
- [x] Temas e styling

---

## 🐛 Troubleshooting

### "API Error: 404 Not Found"
- Verifique se o endpoint existe no backend
- Verifique a URL da API no `.env`

### "API Error: 401 Unauthorized"
- Token expirou
- Token inválido
- Usuário não é admin

### Dados não carregam
- Verifique Console > Network
- Verifique CORS no backend
- Verifique token no localStorage

---

## 📚 Referências

- Frontend: `src/services/admin.ts`
- Tipos: `src/types/admin.ts`
- Componentes: `src/components/admin/`
- Documentação completa: `src/pages/admin/README.md`

---

**Última atualização:** 25 de maio de 2026
