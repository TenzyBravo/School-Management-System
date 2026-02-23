import React, { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'
import BulkUploadModal from './BulkUploadModal'

interface Student {
  id: string
  first_name: string
  last_name: string
  admission_number: string
  date_of_birth: string | null
  gender: string | null
  email: string | null
  phone: string | null
}

export default function StudentsManager() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showBulkUpload, setShowBulkUpload] = useState(false)

  useEffect(() => {
    loadStudents()
  }, [])

  async function loadStudents() {
    try {
      const res = await apiFetch('/api/v1/students/')
      const data = await res.json()
      setStudents(data.results || data)
    } catch (error) {
      console.error('Failed to load students:', error)
    } finally {
      setLoading(false)
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
            Students ({students.length})
          </h3>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            Manage your student records
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

      {/* Students List */}
      <div style={{
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              <th style={{
                padding: '12px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '1px solid #E5E7EB'
              }}>
                Admission #
              </th>
              <th style={{
                padding: '12px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '1px solid #E5E7EB'
              }}>
                Name
              </th>
              <th style={{
                padding: '12px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '1px solid #E5E7EB'
              }}>
                Gender
              </th>
              <th style={{
                padding: '12px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '1px solid #E5E7EB'
              }}>
                Date of Birth
              </th>
              <th style={{
                padding: '12px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '1px solid #E5E7EB'
              }}>
                Contact
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '12px', fontSize: '14px', color: '#6B7280' }}>
                  {student.admission_number}
                </td>
                <td style={{ padding: '12px', fontSize: '14px', color: '#1F2937', fontWeight: '500' }}>
                  {student.first_name} {student.last_name}
                </td>
                <td style={{ padding: '12px', fontSize: '14px', color: '#6B7280' }}>
                  {student.gender || '-'}
                </td>
                <td style={{ padding: '12px', fontSize: '14px', color: '#6B7280' }}>
                  {student.date_of_birth || '-'}
                </td>
                <td style={{ padding: '12px', fontSize: '14px', color: '#6B7280' }}>
                  {student.email || student.phone || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {students.length === 0 && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6B7280',
            background: '#F9FAFB',
            borderTop: '1px solid #E5E7EB'
          }}>
            No students yet. Click "Bulk Upload" to import student data.
          </div>
        )}
      </div>

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadModal
          type="students"
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => {
            loadStudents()
          }}
        />
      )}
    </div>
  )
}
