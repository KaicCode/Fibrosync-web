import { useState } from 'react'
import { X, Edit2 } from 'lucide-react'
import { UsersTable } from '@/components/admin/tables/users-table'
import { AdminContentSection } from '@/components/admin/cards/content-section'
import { PageHeader } from '@/components/page-header'
import { usePageTitle } from '@/hooks/use-page-title'
import { useAdminUsers, useAnalytics } from '@/hooks/use-admin'
import type { AdminUser } from '@/types/admin'

export function AdminUsersPage() {
  usePageTitle('Gerenciar Usuários')

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [isEditingRole, setIsEditingRole] = useState(false)

  const { data, isLoading } = useAdminUsers(page, 10, search)

  const handleUpdateRole = async (userId: number, newRole: 'USER' | 'ADMIN') => {
    try {
      // Call API to update role
      console.log(`Updating user ${userId} role to ${newRole}`)
      setIsEditingRole(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Failed to update user role:', error)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gerenciamento"
        title="Usuários do sistema"
        description="Visualize e gerencie todos os usuários registrados"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tabela de usuários */}
        <div className="lg:col-span-2">
          <AdminContentSection
            title="Lista de Usuários"
            description={`Total: ${data?.total ?? 0} usuários`}
            isLoading={isLoading}
          >
            <UsersTable
              users={data?.data ?? []}
              isLoading={isLoading}
              onSelectUser={setSelectedUser}
            />

            {/* Paginação */}
            {data && data.total > 10 && (
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-input hover:bg-muted disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {Math.ceil(data.total / 10)}
                </span>
                <button
                  onClick={() =>
                    setPage(Math.min(Math.ceil(data.total / 10), page + 1))
                  }
                  disabled={!data.hasMore}
                  className="px-4 py-2 rounded-lg border border-input hover:bg-muted disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            )}
          </AdminContentSection>
        </div>

        {/* Painel de detalhes */}
        <div>
          {selectedUser ? (
            <div className="card-surface p-6 space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-foreground">Detalhes</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-semibold text-foreground">{selectedUser.name}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold text-foreground break-all">{selectedUser.email}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className={`font-semibold ${selectedUser.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedUser.status === 'active' ? 'Ativo' : 'Inativo'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Função</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {selectedUser.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
                    </span>
                    <button
                      onClick={() => setIsEditingRole(true)}
                      className="text-primary hover:text-primary/80"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {selectedUser.createdAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cadastro</p>
                    <p className="font-semibold text-foreground">
                      {new Date(selectedUser.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}

                {selectedUser.lastLogin && (
                  <div>
                    <p className="text-sm text-muted-foreground">Último acesso</p>
                    <p className="font-semibold text-foreground">
                      {new Date(selectedUser.lastLogin).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}

                {/* Edit role form */}
                {isEditingRole && (
                  <div className="border-t pt-4 space-y-2">
                    <p className="text-sm font-semibold text-foreground">Alterar função</p>
                    <select
                      defaultValue={selectedUser.role}
                      onChange={(e) =>
                        handleUpdateRole(
                          selectedUser.id,
                          e.target.value as 'USER' | 'ADMIN',
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground"
                    >
                      <option value="USER">Usuário</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card-surface p-6 text-center text-muted-foreground">
              Selecione um usuário para ver detalhes
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
