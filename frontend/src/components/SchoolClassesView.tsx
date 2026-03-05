import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

// ─── API shape ───────────────────────────────────────────────────────────────

interface StreamInfo {
  id: string
  name: string
  class_name: string          // e.g. "Grade 1 A"
  class_teacher: { id: string; name: string } | null
  student_count: number
}

interface GradeInfo {
  id: string
  name: string
  level: number
  category: string
  category_display: string
  total_students: number
  streams: StreamInfo[]
}

const CAT_META: Record<string, { label: string; color: string; bg: string }> = {
  LOWER_PRIMARY: { label: 'Lower Primary', color: '#059669', bg: '#ECFDF5' },
  UPPER_PRIMARY: { label: 'Upper Primary', color: '#D97706', bg: '#FFFBEB' },
  SECONDARY:     { label: 'Secondary',     color: '#4F46E5', bg: '#EEF2FF' },
  OTHER:         { label: 'Other',         color: '#6B7280', bg: '#F9FAFB' },
}
const CAT_ORDER = ['LOWER_PRIMARY', 'UPPER_PRIMARY', 'SECONDARY', 'OTHER']

// ─── Student shape (for drill-down) ─────────────────────────────────────────

interface Student {
  id: string
  first_name: string
  last_name: string
  child_id: string
  gender: 'M' | 'F'
  current_stream: string | null
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  onNavigate: (section: string) => void
  onBack?: () => void
}

// ─── Colour palette ──────────────────────────────────────────────────────────

const GRADE_COLORS = [
  '#4F46E5', '#7C3AED', '#0891B2', '#059669',
  '#D97706', '#DC2626', '#DB2777', '#2563EB',
  '#0D9488', '#9333EA', '#EA580C', '#16A34A',
]

export default function SchoolClassesView({ onNavigate, onBack }: Props) {
  const [grades, setGrades] = useState<GradeInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Drill-down state
  const [selectedStream, setSelectedStream] = useState<StreamInfo | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<GradeInfo | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)

  // Collapsed grades on the overview
  const [collapsedGrades, setCollapsedGrades] = useState<Set<string>>(new Set())

  useEffect(() => { fetchClassList() }, [])

  async function fetchClassList() {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/v1/grades/class-list/')
      if (!res.ok) throw new Error()
      const data: GradeInfo[] = await res.json()
      setGrades(data)
    } catch {
      setError('Failed to load classes.')
    } finally {
      setLoading(false)
    }
  }

  async function openClass(grade: GradeInfo, stream: StreamInfo) {
    setSelectedGrade(grade)
    setSelectedStream(stream)
    setStudentsLoading(true)
    try {
      const res = await apiFetch(`/api/v1/grades/${grade.id}/students/?stream=${stream.id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setStudents(data.results ?? data)
    } catch {
      setStudents([])
    } finally {
      setStudentsLoading(false)
    }
  }

  function closeClass() {
    setSelectedStream(null)
    setSelectedGrade(null)
    setStudents([])
  }

  function toggleGrade(id: string) {
    setCollapsedGrades(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
        Loading classes...
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ color: '#DC2626', marginBottom: '16px' }}>{error}</div>
        <button onClick={fetchClassList} style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid #E5E7EB', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    )
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  if (!grades.length) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', marginBottom: '8px' }}>No grades set up yet</div>
        <div style={{ fontSize: '14px', marginBottom: '24px' }}>Go to Academics → Grades &amp; Streams to create your grade structure.</div>
        <button
          onClick={() => onNavigate('academics')}
          style={{ padding: '10px 24px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
        >
          Set up Academics
        </button>
      </div>
    )
  }

  // ── Student drill-down ─────────────────────────────────────────────────────

  if (selectedStream && selectedGrade) {
    return (
      <ClassStudentsView
        grade={selectedGrade}
        stream={selectedStream}
        students={students}
        loading={studentsLoading}
        onBack={closeClass}
        onNavigate={onNavigate}
      />
    )
  }

  // ── Main overview ──────────────────────────────────────────────────────────

  const totalStudents = grades.reduce((sum, g) => sum + g.total_students, 0)
  const totalClasses  = grades.reduce((sum, g) => sum + g.streams.length, 0)

  return (
    <div>
      {/* Back to schools button (only when drilling in from Schools section) */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: '#F3F4F6', border: '1px solid #E5E7EB',
            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
            marginBottom: '20px', fontSize: '14px',
          }}
        >
          ← Back to schools
        </button>
      )}

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {[
          { label: 'Grades',   value: grades.length,  icon: '📦' },
          { label: 'Classes',  value: totalClasses,   icon: '🏫' },
          { label: 'Students', value: totalStudents,  icon: '👨‍🎓' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
            padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px',
            flex: '1', minWidth: '120px',
          }}>
            <span style={{ fontSize: '28px' }}>{stat.icon}</span>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937', lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grade sections — grouped by category */}
      {CAT_ORDER.map(cat => {
        const catGrades = grades.filter(g => (g.category || 'OTHER') === cat)
        if (!catGrades.length) return null
        const meta = CAT_META[cat]

        return (
          <div key={cat} style={{ marginBottom: '28px' }}>
            {/* Category heading */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ height: '4px', width: '28px', background: meta.color, borderRadius: '2px' }} />
              <span style={{ fontSize: '13px', fontWeight: '700', color: meta.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {meta.label}
              </span>
              <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                {catGrades.length} grade{catGrades.length !== 1 ? 's' : ''} · {catGrades.reduce((s, g) => s + g.total_students, 0)} students
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {catGrades.map(grade => {
                const isCollapsed = collapsedGrades.has(grade.id)
                return (
                  <div key={grade.id} style={{
                    background: 'white', border: '1px solid #E5E7EB',
                    borderRadius: '14px', overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    {/* Grade header */}
                    <div
                      onClick={() => toggleGrade(grade.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        padding: '16px 20px', cursor: 'pointer',
                        borderLeft: `5px solid ${meta.color}`,
                        background: isCollapsed ? 'white' : meta.bg,
                      }}
                    >
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: meta.color, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px', fontWeight: '700', flexShrink: 0,
                      }}>
                        {grade.level}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '16px', color: '#1F2937' }}>{grade.name}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                          {grade.streams.length} class{grade.streams.length !== 1 ? 'es' : ''} · {grade.total_students} student{grade.total_students !== 1 ? 's' : ''}
                        </div>
                      </div>

                      {grade.streams.length > 0 && (
                        <div style={{
                          background: `${meta.color}18`, color: meta.color, padding: '4px 12px',
                          borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                        }}>
                          {grade.streams.length} {grade.streams.length === 1 ? 'class' : 'classes'}
                        </div>
                      )}

                      <span style={{ color: '#9CA3AF', fontSize: '18px', transform: isCollapsed ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s' }}>▾</span>
                    </div>

                    {/* Streams grid */}
                    {!isCollapsed && (
                      <div style={{ padding: '16px 20px', borderTop: '1px solid #F3F4F6' }}>
                        {grade.streams.length === 0 ? (
                          <div style={{ color: '#9CA3AF', fontSize: '13px', fontStyle: 'italic', padding: '8px 0' }}>
                            No classes yet — go to Academics to add streams.
                          </div>
                        ) : (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: '12px',
                          }}>
                            {grade.streams.map(stream => (
                              <StreamCard
                                key={stream.id}
                                grade={grade}
                                stream={stream}
                                color={meta.color}
                                onOpen={() => openClass(grade, stream)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Stream card ──────────────────────────────────────────────────────────────

function StreamCard({ grade, stream, color, onOpen }: {
  grade: GradeInfo
  stream: StreamInfo
  color: string
  onOpen: () => void
}) {
  return (
    <div
      onClick={onOpen}
      style={{
        border: '1px solid #E5E7EB', borderRadius: '12px',
        padding: '16px', cursor: 'pointer', background: 'white',
        transition: 'all 0.15s', position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = color
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 12px ${color}22`
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#E5E7EB'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
      }}
    >
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: color }} />

      {/* Class name */}
      <div style={{ fontWeight: '700', fontSize: '18px', color: '#1F2937', marginTop: '4px', marginBottom: '10px' }}>
        {stream.class_name}
      </div>

      {/* Teacher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px' }}>👩‍🏫</span>
        <span style={{ fontSize: '12px', color: stream.class_teacher ? '#374151' : '#9CA3AF' }}>
          {stream.class_teacher ? stream.class_teacher.name : 'No class teacher'}
        </span>
      </div>

      {/* Student count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '14px' }}>👨‍🎓</span>
        <span style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>
          {stream.student_count} student{stream.student_count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* View arrow */}
      <div style={{
        position: 'absolute', bottom: '12px', right: '14px',
        color: '#9CA3AF', fontSize: '16px',
      }}>→</div>
    </div>
  )
}

// ─── Class students drill-down ────────────────────────────────────────────────

function ClassStudentsView({ grade, stream, students, loading, onBack, onNavigate }: {
  grade: GradeInfo
  stream: StreamInfo
  students: Student[]
  loading: boolean
  onBack: () => void
  onNavigate: (s: string) => void
}) {
  const initials = (s: Student) =>
    `${s.first_name.charAt(0)}${s.last_name.charAt(0)}`.toUpperCase()

  const males   = students.filter(s => s.gender === 'M').length
  const females = students.filter(s => s.gender === 'F').length

  return (
    <div>
      {/* Back + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={onBack}
          style={{
            background: '#F3F4F6', border: '1px solid #E5E7EB',
            padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
          }}
        >
          ← Back
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1F2937' }}>
            {stream.class_name}
          </h2>
          <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
            {grade.name} · {stream.class_teacher ? `Class Teacher: ${stream.class_teacher.name}` : 'No class teacher assigned'}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Students', value: students.length, color: '#4F46E5' },
          { label: 'Male', value: males, color: '#2563EB' },
          { label: 'Female', value: females, color: '#DB2777' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'white', border: '1px solid #E5E7EB', borderRadius: '10px',
            padding: '12px 20px', textAlign: 'center', flex: 1, minWidth: '80px',
          }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button
          onClick={() => onNavigate('students')}
          style={{
            padding: '9px 18px', background: '#4F46E5', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
          }}
        >
          📋 Mark Attendance
        </button>
        <button
          onClick={() => onNavigate('reports')}
          style={{
            padding: '9px 18px', background: 'white', color: '#374151',
            border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
          }}
        >
          📝 View Marks
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Loading students...</div>
      ) : students.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px', color: '#6B7280',
          background: '#F9FAFB', borderRadius: '12px', border: '1px dashed #E5E7EB',
        }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>👨‍🎓</div>
          <div style={{ fontWeight: '600', color: '#1F2937', marginBottom: '6px' }}>No students enrolled</div>
          <div style={{ fontSize: '13px' }}>Enroll students from Students Management and assign them to this class.</div>
        </div>
      ) : (
        /* Student table */
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Student</th>
                <th style={thStyle}>Child ID</th>
                <th style={thStyle}>Gender</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => (
                <tr
                  key={student.id}
                  style={{ borderBottom: '1px solid #F3F4F6' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#F9FAFB'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                >
                  <td style={tdStyle}>{idx + 1}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: student.gender === 'F' ? '#FDF2F8' : '#EFF6FF',
                        color: student.gender === 'F' ? '#9D174D' : '#1D4ED8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: '700', flexShrink: 0,
                      }}>
                        {initials(student)}
                      </div>
                      <span style={{ fontWeight: '500', color: '#1F2937' }}>
                        {student.last_name}, {student.first_name}
                      </span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: '#6B7280', fontFamily: 'monospace', fontSize: '12px' }}>
                    {student.child_id}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                      background: student.gender === 'F' ? '#FDF2F8' : '#EFF6FF',
                      color: student.gender === 'F' ? '#9D174D' : '#1D4ED8',
                    }}>
                      {student.gender === 'F' ? 'Female' : 'Male'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '10px 16px', textAlign: 'left',
  fontSize: '11px', fontWeight: '600', color: '#6B7280',
  textTransform: 'uppercase', letterSpacing: '0.5px',
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px', fontSize: '13px', color: '#374151', verticalAlign: 'middle',
}
