import { SUPABASE_SYNC_TABLE, supabase } from '@/lib/supabase'

type SyncPayload = {
  entityId: string
  entityType: string
  payload: Record<string, unknown>
  userEmail?: string | null
  userId?: string | null
}

let hasWarnedMissingConfig = false

function buildSyncKey(entityType: string, entityId: string): string {
  return `${entityType}:${entityId}`
}

function warnMissingConfigOnce() {
  if (hasWarnedMissingConfig) {
    return
  }

  hasWarnedMissingConfig = true
  console.warn(
    '[FibroSync] Supabase nao configurado. A sincronizacao externa foi ignorada.',
  )
}

export const supabaseSyncService = {
  async upsertRecord({
    entityId,
    entityType,
    payload,
    userEmail,
    userId,
  }: SyncPayload): Promise<boolean> {
    if (!supabase) {
      warnMissingConfigOnce()
      return false
    }

    const { error } = await supabase.from(SUPABASE_SYNC_TABLE).upsert(
      {
        sync_key: buildSyncKey(entityType, entityId),
        entity_type: entityType,
        entity_id: entityId,
        user_id: userId ?? null,
        user_email: userEmail ?? null,
        payload,
        deleted_at: null,
        source: 'fibrosync-web',
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'sync_key',
      },
    )

    if (error) {
      console.warn(
        `[FibroSync] Falha ao sincronizar ${entityType} com o Supabase.`,
        error.message,
      )
      return false
    }

    return true
  },

  async markAsDeleted(
    entityType: string,
    entityId: string,
    user?: {
      id?: string | null
      email?: string | null
    } | null,
  ): Promise<boolean> {
    if (!supabase) {
      warnMissingConfigOnce()
      return false
    }

    const deletedAt = new Date().toISOString()
    const { error } = await supabase.from(SUPABASE_SYNC_TABLE).upsert(
      {
        sync_key: buildSyncKey(entityType, entityId),
        entity_type: entityType,
        entity_id: entityId,
        user_id: user?.id ?? null,
        user_email: user?.email ?? null,
        payload: {},
        deleted_at: deletedAt,
        source: 'fibrosync-web',
        updated_at: deletedAt,
      },
      {
        onConflict: 'sync_key',
      },
    )

    if (error) {
      console.warn(
        `[FibroSync] Falha ao marcar ${entityType} como removido no Supabase.`,
        error.message,
      )
      return false
    }

    return true
  },
}
