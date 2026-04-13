'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { useTranslation } from '@/shared/i18n'
import { Plus, Edit, UserCheck, UserX } from 'lucide-react'
import { UserModal } from './UserModal'

type UserRole = 'admin' | 'engineer' | 'approver' | 'viewer'

interface User {
  id: string
  email: string
  username: string | null
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const { t } = useTranslation()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/users', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
    setIsLoading(false)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingUser(null)
  }

  const handleSave = async () => {
    await fetchUsers()
    handleModalClose()
  }

  const toggleUserStatus = async (user: User) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          is_active: !user.is_active,
        }),
      })
      if (res.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'engineer':
        return 'bg-blue-100 text-blue-800'
      case 'approver':
        return 'bg-green-100 text-green-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <p className="text-gray-600">
            {t('admin.users.description')}
          </p>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 me-2" />
            {t('admin.users.addUser')}
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t('admin.users.noUsers')}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.users.user')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.users.role')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.status')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.users.created')}
                  </th>
                  <th className="px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {t(`admin.users.roles.${user.role}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.is_active ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title={t('common.edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user)}
                          className={`p-1 ${
                            user.is_active
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={user.is_active ? t('common.inactive') : t('common.active')}
                        >
                          {user.is_active ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <UserModal
          user={editingUser}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}
    </>
  )
}
