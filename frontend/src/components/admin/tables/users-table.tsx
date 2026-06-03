import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AdminUser } from '@/types/admin'

type UsersTableProps = {
  users: AdminUser[]
  isLoading?: boolean
  onSelectUser?: (user: AdminUser) => void
}

type SortConfig = {
  key: keyof AdminUser
  direction: 'asc' | 'desc'
}

type SortIconProps = {
  column: keyof AdminUser
  sortConfig: SortConfig
}

function SortIcon({ column, sortConfig }: SortIconProps) {
  if (sortConfig.key !== column) {
    return <div className="w-4 h-4" />
  }

  return sortConfig.direction === 'asc' ? (
    <ChevronUp className="w-4 h-4" />
  ) : (
    <ChevronDown className="w-4 h-4" />
  )
}

export function UsersTable({ users, isLoading, onSelectUser }: UsersTableProps) {
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'desc',
  })

  const filteredAndSorted = useMemo(() => {
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()),
    )

    filtered.sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [users, search, sortConfig])

  const handleSort = (key: keyof AdminUser) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th
                className="px-4 py-3 text-left font-semibold text-foreground cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Nome
                  <SortIcon column="name" sortConfig={sortConfig} />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left font-semibold text-foreground cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center gap-2">
                  Email
                  <SortIcon column="email" sortConfig={sortConfig} />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left font-semibold text-foreground cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center gap-2">
                  Função
                  <SortIcon column="role" sortConfig={sortConfig} />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left font-semibold text-foreground cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">
                  Status
                  <SortIcon column="status" sortConfig={sortConfig} />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left font-semibold text-foreground cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-2">
                  Cadastro
                  <SortIcon column="createdAt" sortConfig={sortConfig} />
                </div>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((user) => (
              <tr
                key={user.id}
                className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onSelectUser?.(user)}
              >
                <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {user.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {user.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3">
                  <button
                    className="text-primary hover:text-primary/80 text-sm font-medium"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectUser?.(user)
                    }}
                  >
                    Ver detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSorted.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum usuário encontrado.
          </div>
        )}
      </div>
    </div>
  )
}
