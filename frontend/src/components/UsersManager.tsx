import React, { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'
import BulkUploadModal from './BulkUploadModal'

interface User {
  id: string
  first_name: string
  last_name: string
  employee_number: string
  email: string
  username: string
  role: string
  phone: string
}

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showBulkUpload, setShowBulkUpload] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      const res = await apiFetch('/api/v1/users/')
      const data = await res.json()
      setUsers(data.results || data)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case 'HEADTEACHER':
      case 'DIRECTOR':
        return { bg: '#DCFCE7', text: '#15803D' }
      case 'DEPUTY_HEAD':
      case 'HEAD_OF_OPS':
        return { bg: '#DBEAFE', text: '#1E40AF' }
      case 'ACADEMIC_MANAGER':
        return { bg: '#E0E7FF', text: '#4F46E5' }
      case 'SOCIAL_OFFICER':
        return { bg: '#FCE7F3', text: '#9F1239' }
      default:
        return { bg: '#F3F4F6', text: '#374151' }
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Loading...</div>
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1F2937', margin: 0, marginBottom: '4px' }}>
            Faculty & Staff ({users.length})
          </h3>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            Manage teachers and administrative staff
          </p>
        </div>
        <button
          onClick={() => setShowBulkUpload(true)}
          style={{
            background: '#10B981',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          📤 Bulk Upload
        </button>
      </div>

      {/* Users List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {users.map(user => {
          const colors = getRoleBadgeColor(user.role)
          return (
            <div
              key={user.id}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
                      {user.first_name} {user.last_name}
                    </h4>
                    <span style={{
                      background: colors.bg,
                      color: colors.text,
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>Employee ID: </span>
                      <span style={{ fontSize: '14px', color: '#1F2937', fontWeight: '500' }}>{user.employee_number}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>Username: </span>
                      <span style={{ fontSize: '14px', color: '#1F2937', fontWeight: '500' }}>{user.username}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>Email: </span>
                      <span style={{ fontSize: '14px', color: '#1F2937', fontWeight: '500' }}>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div>
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>Phone: </span>
                        <span style={{ fontSize: '14px', color: '#1F2937', fontWeight: '500' }}>{user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {users.length === 0 && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6B7280',
            background: '#F9FAFB',
            borderRadius: '8px',
            border: '1px dashed #D1D5DB'
          }}>
            No staff members yet. Click "Bulk Upload" to import user data.
          </div>
        )}
      </div>

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadModal
          type="users"
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => {
            loadUsers()
          }}
        />
      )}
    </div>
  )
}
