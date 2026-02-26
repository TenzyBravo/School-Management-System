import React, { useState, useEffect, useRef } from 'react'
import { apiFetch } from '../lib/api'

interface School {
  id: string
  name: string
  code: string
  is_active: boolean
}

interface Props {
  onSwitch?: (school: School | null) => void
}

export default function SchoolSwitcher({ onSwitch }: Props) {
  const [schools, setSchools] = useState<School[]>([])
  const [activeSchool, setActiveSchool] = useState<School | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    apiFetch('/api/v1/schools/')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const list: School[] = Array.isArray(data) ? data : (data.results ?? [])
          const active = list.filter(s => s.is_active)
          setSchools(active)

          const storedId = localStorage.getItem('activeSchoolId')
          if (storedId) {
            const found = active.find(s => s.id === storedId)
            if (found) setActiveSchool(found)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function select(school: School | null) {
    if (school) {
      localStorage.setItem('activeSchoolId', school.id)
    } else {
      localStorage.removeItem('activeSchoolId')
    }
    onSwitch?.(school)
    // Reload so all in-flight components refetch with the new school context
    window.location.reload()
  }

  if (loading) return null

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Switch active school"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: activeSchool ? '#EEF2FF' : '#F3F4F6',
          color: activeSchool ? '#4F46E5' : '#6B7280',
          border: `1px solid ${activeSchool ? '#C7D2FE' : '#E5E7EB'}`,
          padding: '8px 14px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '600',
          maxWidth: '200px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        <span style={{ fontSize: '14px' }}>🏫</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {activeSchool ? activeSchool.name : 'Select School'}
        </span>
        <span style={{ fontSize: '10px', flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: '220px',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 2000,
        }}>
          <div style={{ padding: '8px 0' }}>
            <div
              onClick={() => select(null)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '13px',
                color: !activeSchool ? '#4F46E5' : '#374151',
                fontWeight: !activeSchool ? '600' : '400',
                background: !activeSchool ? '#EEF2FF' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={e => { if (activeSchool) (e.currentTarget as HTMLElement).style.background = '#F9FAFB' }}
              onMouseLeave={e => { if (activeSchool) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span>🌐</span> All Schools (my default)
            </div>

            {schools.length > 0 && (
              <div style={{ height: '1px', background: '#E5E7EB', margin: '4px 0' }} />
            )}

            {schools.map(school => (
              <div
                key={school.id}
                onClick={() => select(school)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: activeSchool?.id === school.id ? '#4F46E5' : '#374151',
                  fontWeight: activeSchool?.id === school.id ? '600' : '400',
                  background: activeSchool?.id === school.id ? '#EEF2FF' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={e => { if (activeSchool?.id !== school.id) (e.currentTarget as HTMLElement).style.background = '#F9FAFB' }}
                onMouseLeave={e => { if (activeSchool?.id !== school.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <span>🏫</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {school.name}
                </span>
                {activeSchool?.id === school.id && <span style={{ marginLeft: 'auto', flexShrink: 0 }}>✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
