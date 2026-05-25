import { useState } from 'react'
import { Save, AlertCircle } from 'lucide-react'
import { AdminContentSection } from '@/components/admin/cards/content-section'
import { PageHeader } from '@/components/page-header'
import { usePageTitle } from '@/hooks/use-page-title'
import type { AISettings, NotificationSettings, RiskLimits } from '@/types/admin'

// Mock data
const defaultAISettings: AISettings = {
  enabled: true,
  riskThreshold: 0.7,
  predictionAccuracy: 85.5,
  updateFrequency: 'daily',
}

const defaultNotificationSettings: NotificationSettings = {
  crisisAlerts: true,
  adherenceReminders: true,
  systemNotifications: true,
  emailNotifications: true,
  smsNotifications: false,
}

const defaultRiskLimits: RiskLimits = {
  criticalThreshold: 0.9,
  highThreshold: 0.7,
  mediumThreshold: 0.5,
  checkFrequency: 6,
}

export function AdminSettingsPage() {
  usePageTitle('Configurações')

  const [aiSettings, setAISettings] = useState<AISettings>(defaultAISettings)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
    defaultNotificationSettings,
  )
  const [riskLimits, setRiskLimits] = useState<RiskLimits>(defaultRiskLimits)
  const [saved, setSaved] = useState(false)

  const handleSaveSettings = async () => {
    try {
      // Save settings to API
      console.log('Saving settings...', { aiSettings, notificationSettings, riskLimits })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuração"
        title="Configurações do sistema"
        description="Configure IA, notificações e limites de risco"
      />

      {/* Alertas de sucesso */}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>Configurações salvas com sucesso!</p>
        </div>
      )}

      {/* Configurações de IA */}
      <AdminContentSection title="Configurações de IA" description="Configure o comportamento do motor de predição">
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 mb-2">
              <input
                type="checkbox"
                checked={aiSettings.enabled}
                onChange={(e) =>
                  setAISettings({ ...aiSettings, enabled: e.target.checked })
                }
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm font-semibold text-foreground">
                Ativar motor de IA
              </span>
            </label>
            <p className="text-sm text-muted-foreground ml-7">
              Ativa predições automáticas de crises baseadas em padrões de comportamento
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Limiar de Risco: {(aiSettings.riskThreshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={aiSettings.riskThreshold}
              onChange={(e) =>
                setAISettings({
                  ...aiSettings,
                  riskThreshold: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Valor mínimo de probabilidade para gerar alertas
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Frequência de Atualização
            </label>
            <select
              value={aiSettings.updateFrequency}
              onChange={(e) =>
                setAISettings({
                  ...aiSettings,
                  updateFrequency: e.target.value as 'daily' | 'weekly' | 'monthly',
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground"
            >
              <option value="daily">Diário</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Acurácia Média: <span className="font-semibold">{aiSettings.predictionAccuracy.toFixed(1)}%</span>
            </p>
          </div>
        </div>
      </AdminContentSection>

      {/* Configurações de Notificações */}
      <AdminContentSection
        title="Configurações de Notificações"
        description="Configure como os usuários são notificados"
      >
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={notificationSettings.crisisAlerts}
              onChange={(e) =>
                setNotificationSettings({
                  ...notificationSettings,
                  crisisAlerts: e.target.checked,
                })
              }
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-sm font-semibold text-foreground">
              Alertas de Crise
            </span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={notificationSettings.adherenceReminders}
              onChange={(e) =>
                setNotificationSettings({
                  ...notificationSettings,
                  adherenceReminders: e.target.checked,
                })
              }
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-sm font-semibold text-foreground">
              Lembretes de Adesão
            </span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={notificationSettings.systemNotifications}
              onChange={(e) =>
                setNotificationSettings({
                  ...notificationSettings,
                  systemNotifications: e.target.checked,
                })
              }
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-sm font-semibold text-foreground">
              Notificações do Sistema
            </span>
          </label>

          <div className="pt-2 border-t border-border space-y-4">
            <p className="text-sm font-semibold text-foreground">Canais</p>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={notificationSettings.emailNotifications}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    emailNotifications: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm text-foreground">Email</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={notificationSettings.smsNotifications}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    smsNotifications: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm text-foreground">SMS</span>
            </label>
          </div>
        </div>
      </AdminContentSection>

      {/* Limites de Risco */}
      <AdminContentSection
        title="Limites de Risco"
        description="Configure limiares de detecção de crise"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Limiar Crítico: {(riskLimits.criticalThreshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={riskLimits.criticalThreshold}
              onChange={(e) =>
                setRiskLimits({
                  ...riskLimits,
                  criticalThreshold: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Nível em que a crise é considerada crítica
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Limiar Alto: {(riskLimits.highThreshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={riskLimits.highThreshold}
              onChange={(e) =>
                setRiskLimits({
                  ...riskLimits,
                  highThreshold: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Limiar Médio: {(riskLimits.mediumThreshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={riskLimits.mediumThreshold}
              onChange={(e) =>
                setRiskLimits({
                  ...riskLimits,
                  mediumThreshold: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Frequência de Verificação: {riskLimits.checkFrequency} horas
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={riskLimits.checkFrequency}
              onChange={(e) =>
                setRiskLimits({
                  ...riskLimits,
                  checkFrequency: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Intervalo para executar verificações automáticas
            </p>
          </div>
        </div>
      </AdminContentSection>

      {/* Botão de salvar */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
        >
          <Save className="w-5 h-5" />
          Salvar Configurações
        </button>
      </div>
    </div>
  )
}
