import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

type School = {
  id: string
  name: string
  code: string
}

type SchoolsListProps = {
  onSelectSchool?: (id: string, name: string) => void
}

export default function SchoolsList({ onSelectSchool }: SchoolsListProps) {
  const [schools, setSchools] = useState<School[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/v1/schools/')
      .then((r) => r.json())
      .then((data) => setSchools(data.results || data))
      .catch((err) => {
        console.error(err)
        setSchools([])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading schools...</div>
  if (!schools || schools.length === 0) return <div>No schools found.</div>

  return (
    <div>
      <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#1F2937' }}>Schools</h2>
      <div style={{ display: 'grid', gap: '16px' }}>
        {schools.map((s) => (
          <div
            key={s.id}
            onClick={() => onSelectSchool && onSelectSchool(s.id, s.name)}
            style={{
              padding: '20px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              cursor: onSelectSchool ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              background: 'white'
            }}
            onMouseEnter={(e) => {
              if (onSelectSchool) {
                e.currentTarget.style.borderColor = '#4F46E5'
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(79, 70, 229, 0.1)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>
                  {s.name}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6B7280' }}>
                  Code: {s.code}
                </p>
              </div>
              {onSelectSchool && (
                <span style={{ fontSize: '20px', color: '#4F46E5' }}>→</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
