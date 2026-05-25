#!/bin/bash

# Script para validar o build do Admin Dashboard Module

echo "🔍 Validando Admin Dashboard Module..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar arquivo
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✅${NC} Arquivo encontrado: $1"
    return 0
  else
    echo -e "${RED}❌${NC} Arquivo NÃO encontrado: $1"
    return 1
  fi
}

# Função para verificar diretório
check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✅${NC} Diretório encontrado: $1"
    return 0
  else
    echo -e "${RED}❌${NC} Diretório NÃO encontrado: $1"
    return 1
  fi
}

echo "📁 Verificando estrutura de diretórios..."
check_dir "frontend/src/components/admin/charts"
check_dir "frontend/src/components/admin/tables"
check_dir "frontend/src/components/admin/cards"
check_dir "frontend/src/pages/admin"
check_dir "frontend/src/hooks"
check_dir "frontend/src/types"
check_dir "frontend/src/services"

echo ""
echo "📄 Verificando arquivos de tipos..."
check_file "frontend/src/types/admin.ts"

echo ""
echo "🔌 Verificando serviços..."
check_file "frontend/src/services/admin.ts"

echo ""
echo "🎣 Verificando hooks..."
check_file "frontend/src/hooks/use-admin.ts"

echo ""
echo "📊 Verificando componentes de charts..."
check_file "frontend/src/components/admin/charts/triggers-chart.tsx"
check_file "frontend/src/components/admin/charts/symptoms-chart.tsx"
check_file "frontend/src/components/admin/charts/adherence-chart.tsx"
check_file "frontend/src/components/admin/charts/symptom-correlation-chart.tsx"
check_file "frontend/src/components/admin/charts/prediction-history-chart.tsx"

echo ""
echo "📋 Verificando componentes de tabelas..."
check_file "frontend/src/components/admin/tables/users-table.tsx"
check_file "frontend/src/components/admin/tables/crisis-alerts-table.tsx"
check_file "frontend/src/components/admin/tables/reports-table.tsx"

echo ""
echo "🎨 Verificando componentes de cards..."
check_file "frontend/src/components/admin/cards/metric-card.tsx"
check_file "frontend/src/components/admin/cards/alert-card.tsx"
check_file "frontend/src/components/admin/cards/date-range-filter.tsx"
check_file "frontend/src/components/admin/cards/content-section.tsx"

echo ""
echo "📄 Verificando páginas..."
check_file "frontend/src/pages/admin/dashboard-page.tsx"
check_file "frontend/src/pages/admin/users-page.tsx"
check_file "frontend/src/pages/admin/reports-page.tsx"
check_file "frontend/src/pages/admin/analytics-page.tsx"
check_file "frontend/src/pages/admin/settings-page.tsx"

echo ""
echo "📚 Verificando documentação..."
check_file "frontend/src/pages/admin/README.md"
check_file "ADMIN_DASHBOARD_SUMMARY.md"

echo ""
echo -e "${GREEN}✨ Validação concluída!${NC}"
echo ""
echo "🚀 Próximos passos:"
echo "1. cd frontend"
echo "2. npm run dev"
echo "3. Abra http://localhost:5173/admin/dashboard"
echo ""
