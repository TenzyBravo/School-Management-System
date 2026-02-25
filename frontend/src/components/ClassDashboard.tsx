import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

interface Assignment {
  id: string
  grade: string
  grade_name: string
  grade_level: number
  stream: string | null
  stream_name: string | null
  subject: string
  subject_name: string
  subject_code: string
  is_class_teacher: boolean
  student_count: number
}

interface MyClassesResponse {
  academic_year: string | null
  assignments: Assignment[]
}

interface ClassCard {
  grade: string
  grade_name: string
  grade_level: number
  stream: string | null
  stream_name: string | null
  student_count: number
  subjects: { id: string; name: string; code: string; assignmentId: string }[]
  is_class_teacher: boolean
}

interface Props {
  onNavigate: (section: string) => void
  onOpenClass: (card: ClassCard) => void
}

const SUBJECT_COLORS = [
  '#4F46E5', '#7C3AED', '#0891B2', '#059669',
  '#D97706', '#DC2626', '#DB2777', '#2563EB',
]

export default function ClassDashboard({ onNavigate, onOpenClass }: Props) {
  const [data, setData] = useState<MyClassesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/api/v1/assignments/my-classes/')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setData)
      .catch(() => setError('Failed to load your classes.'))
      .finally(() => setLoading(false))
  }, [])

  // Group assignments into class cards (by grade+stream)
  const classCards: ClassCard[] = React.useMemo(() => {
    if (!data?.assignments.length) return []
    const map = new Map<string, ClassCard>()
    for (const a of data.assignments) {
      const key = `${a.grade}:${a.stream ?? ''}`
      if (!map.has(key)) {
        map.set(key, {
          grade: a.grade,
          grade_name: a.grade_name,
          grade_level: a.grade_level,
          stream: a.stream,
          stream_name: a.stream_name,
          student_count: a.student_count,
          subjects: [],
          is_class_teacher: a.is_class_teacher,
        })
      }
      const card = map.get(key)!
      card.subjects.push({ id: a.subject, name: a.subject_name, code: a.subject_code, assignmentId: a.id })
      if (a.is_class_teacher) card.is_class_teacher = true
    }
    return Array.from(map.values()).sort((a, b) => a.grade_level - b.grade_level)
  }, [data])

  const className = (card: ClassCard) =>
    card.stream_name ? `${card.grade_name} ${card.stream_name}` : card.grade_name

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#6B7280' }}>
        <div style={{ fontSize: '18px', marginBottom: '8px' }}>Loading your classes...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div style={{ color: '#DC2626', marginBottom: '16px' }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid #E5E7EB', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    )
  }

  if (!classCards.length) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#6B7280' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', marginBottom: '8px' }}>
          No classes assigned yet
        </div>
        <div style={{ fontSize: '14px', marginBottom: '24px' }}>
          Your class assignments for {data?.academic_year || 'the current year'} will appear here once set up.
        </div>
        <button
          onClick={() => onNavigate('academics')}
          style={{ padding: '10px 24px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
        >
          Go to Academics Setup
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Year badge */}
      {data?.academic_year && (
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#EEF2FF', color: '#4F46E5',
            padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600'
          }}>
            📅 {data.academic_year}
          </div>
          <span style={{ color: '#6B7280', fontSize: '14px' }}>
            {classCards.length} class{classCards.length !== 1 ? 'es' : ''} assigned
          </span>
        </div>
      )}

      {/* Class cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
      }}>
        {classCards.map((card, idx) => (
          <div
            key={`${card.grade}:${card.stream}`}
            onClick={() => onOpenClass(card)}
            style={{
              background: 'white',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              border: '1px solid #E5E7EB',
              cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
              ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
              ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'
            }}
          >
            {/* Coloured top bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '5px',
              background: SUBJECT_COLORS[idx % SUBJECT_COLORS.length],
              borderRadius: '14px 14px 0 0',
            }} />

            {/* Class badge */}
            {card.is_class_teacher && (
              <div style={{
                position: 'absolute', top: '16px', right: '16px',
                background: '#FEF3C7', color: '#D97706',
                padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600'
              }}>
                Class Teacher
              </div>
            )}

            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937', marginBottom: '4px', marginTop: '8px' }}>
              {className(card)}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6B7280', fontSize: '13px', marginBottom: '16px' }}>
              <span>👨‍🎓</span>
              <span>{card.student_count} student{card.student_count !== 1 ? 's' : ''}</span>
            </div>

            {/* Subject pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
              {card.subjects.map((s, si) => (
                <span key={s.id} style={{
                  background: `${SUBJECT_COLORS[(idx + si) % SUBJECT_COLORS.length]}18`,
                  color: SUBJECT_COLORS[(idx + si) % SUBJECT_COLORS.length],
                  padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500'
                }}>
                  {s.name}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{
                flex: 1, textAlign: 'center', padding: '8px',
                background: '#F3F4F6', borderRadius: '8px',
                fontSize: '12px', fontWeight: '500', color: '#374151',
              }}>
                📋 Attendance
              </div>
              <div style={{
                flex: 1, textAlign: 'center', padding: '8px',
                background: '#F3F4F6', borderRadius: '8px',
                fontSize: '12px', fontWeight: '500', color: '#374151',
              }}>
                📝 Marks
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
