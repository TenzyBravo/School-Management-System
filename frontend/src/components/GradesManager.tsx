import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

/** Parse DRF error responses robustly (handles arrays, objects, HTML bodies). */
async function parseApiError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.clone().text()
    if (!body.trim() || body.trim().startsWith('<')) return `${fallback} (HTTP ${res.status})`
    const err = JSON.parse(body)
    if (Array.isArray(err)) return String(err[0] ?? fallback)
    return (
      err.detail ||
      err.non_field_errors?.[0] ||
      err.name?.[0] ||
      err.message ||
      Object.values(err).flat()[0] ||
      fallback
    )
  } catch {
    return `${fallback} (HTTP ${res.status})`
  }
}

interface Stream {
  id: string
  name: string
  grade: string
}

interface Grade {
  id: string
  name: string
  level: number
  streams: Stream[]
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #D1D5DB',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const btnPrimary: React.CSSProperties = {
  padding: '8px 18px',
  background: '#4F46E5',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
}

const btnDanger: React.CSSProperties = {
  padding: '5px 12px',
  background: 'white',
  color: '#DC2626',
  border: '1px solid #FECACA',
  borderRadius: '6px',
  fontSize: '12px',
  cursor: 'pointer',
}

// Preset grade templates for quick setup
const GRADE_PRESETS = [
  { name: 'Grade 1',  level: 1 },
  { name: 'Grade 2',  level: 2 },
  { name: 'Grade 3',  level: 3 },
  { name: 'Grade 4',  level: 4 },
  { name: 'Grade 5',  level: 5 },
  { name: 'Grade 6',  level: 6 },
  { name: 'Grade 7',  level: 7 },
  { name: 'Grade 8',  level: 8 },
  { name: 'Grade 9',  level: 9 },
  { name: 'Grade 10', level: 10 },
  { name: 'Grade 11', level: 11 },
  { name: 'Grade 12', level: 12 },
]

export default function GradesManager() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noSchool, setNoSchool] = useState(false)

  // Add grade form
  const [gradeName, setGradeName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [addingGrade, setAddingGrade] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)

  // Stream management per grade
  const [expandedGrade, setExpandedGrade] = useState<string | null>(null)
  const [newStreamName, setNewStreamName] = useState('')
  const [addingStream, setAddingStream] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchGrades()
    // Check if the logged-in user has a school assigned
    apiFetch('/api/v1/profile/')
      .then(r => r.ok ? r.json() : null)
      .then(profile => { if (profile && !profile.school) setNoSchool(true) })
      .catch(() => {})
  }, [])

  async function fetchGrades() {
    setLoading(true)
    try {
      const res = await apiFetch('/api/v1/grades/')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setGrades(data.results ?? data)
    } catch {
      setError('Failed to load grades.')
    } finally {
      setLoading(false)
    }
  }

  async function createGrade(name: string, level: number) {
    setAddingGrade(true)
    setError(null)
    try {
      const res = await apiFetch('/api/v1/grades/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, level }),
      })
      if (!res.ok) {
        const msg = await parseApiError(res, 'Failed to create grade')
        throw new Error(msg)
      }
      setGradeName('')
      setGradeLevel('')
      setShowCustomForm(false)
      await fetchGrades()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAddingGrade(false)
    }
  }

  async function deleteGrade(id: string) {
    if (!confirm('Delete this grade and all its streams?')) return
    setDeletingId(id)
    try {
      await apiFetch(`/api/v1/grades/${id}/`, { method: 'DELETE' })
      setGrades(prev => prev.filter(g => g.id !== id))
      if (expandedGrade === id) setExpandedGrade(null)
    } catch {
      setError('Failed to delete grade.')
    } finally {
      setDeletingId(null)
    }
  }

  async function addStream(gradeId: string) {
    const name = newStreamName.trim()
    if (!name) return
    setAddingStream(true)
    try {
      const res = await apiFetch('/api/v1/streams/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, grade: gradeId }),
      })
      if (!res.ok) {
        const msg = await parseApiError(res, 'Failed to add stream')
        throw new Error(msg)
      }
      setNewStreamName('')
      await fetchGrades()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAddingStream(false)
    }
  }

  async function deleteStream(streamId: string) {
    setDeletingId(streamId)
    try {
      await apiFetch(`/api/v1/streams/${streamId}/`, { method: 'DELETE' })
      setGrades(prev => prev.map(g => ({
        ...g,
        streams: g.streams.filter(s => s.id !== streamId),
      })))
    } catch {
      setError('Failed to delete stream.')
    } finally {
      setDeletingId(null)
    }
  }

  // Presets not yet created
  const existingNames = new Set(grades.map(g => g.name))
  const availablePresets = GRADE_PRESETS.filter(p => !existingNames.has(p.name))

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Loading grades...</div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1F2937' }}>Grades & Streams</h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
            {grades.length} grade{grades.length !== 1 ? 's' : ''} · click a grade to manage its streams
          </p>
        </div>
        <button
          onClick={() => setShowCustomForm(v => !v)}
          style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {showCustomForm ? '✕ Cancel' : '+ Add Grade'}
        </button>
      </div>

      {noSchool && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#92400E', fontSize: '13px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
          <div>
            <strong>Your account has no school assigned.</strong>{' '}
            Grades are school-specific and cannot be created until your user account is linked to a school.
            Ask your system administrator to assign a school to your account in the Django admin panel.
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#DC2626', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* ── Quick-add presets ── */}
      {availablePresets.length > 0 && !showCustomForm && (
        <div style={{ background: '#F8FAFF', border: '1px dashed #C7D2FE', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#4F46E5', marginBottom: '10px' }}>
            Quick Add
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {availablePresets.map(p => (
              <button
                key={p.name}
                onClick={() => createGrade(p.name, p.level)}
                disabled={addingGrade}
                style={{
                  padding: '6px 14px',
                  background: 'white',
                  border: '1px solid #C7D2FE',
                  borderRadius: '20px',
                  fontSize: '13px',
                  color: '#4F46E5',
                  cursor: addingGrade ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                }}
              >
                + {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Custom grade form ── */}
      {showCustomForm && (
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ fontWeight: '600', fontSize: '14px', color: '#1F2937', marginBottom: '14px' }}>Custom Grade</div>
          <form
            onSubmit={e => { e.preventDefault(); createGrade(gradeName, parseInt(gradeLevel)) }}
            style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}
          >
            <div style={{ flex: 2, minWidth: '160px' }}>
              <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Grade Name</label>
              <input style={inputStyle} placeholder="e.g. Grade 1, Form 3, Year 7" value={gradeName} onChange={e => setGradeName(e.target.value)} required />
            </div>
            <div style={{ width: '90px' }}>
              <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Level</label>
              <input style={inputStyle} type="number" min="1" placeholder="1" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} required />
            </div>
            <button type="submit" disabled={addingGrade} style={{ ...btnPrimary, opacity: addingGrade ? 0.6 : 1 }}>
              {addingGrade ? 'Adding...' : 'Add Grade'}
            </button>
          </form>
        </div>
      )}

      {/* ── Grades list ── */}
      {grades.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280', background: '#F9FAFB', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎓</div>
          <div style={{ fontWeight: '600', color: '#1F2937', marginBottom: '6px' }}>No grades yet</div>
          <div style={{ fontSize: '13px' }}>Use "Quick Add" above to add Grade 1, Grade 2, etc.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {grades.map(grade => {
            const isExpanded = expandedGrade === grade.id
            const isDeleting = deletingId === grade.id

            return (
              <div
                key={grade.id}
                style={{
                  background: 'white',
                  border: `1px solid ${isExpanded ? '#C7D2FE' : '#E5E7EB'}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: isExpanded ? '0 2px 8px rgba(79,70,229,0.1)' : '0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'all 0.15s',
                }}
              >
                {/* Grade header row */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', padding: '14px 18px',
                    cursor: 'pointer', gap: '12px',
                    background: isExpanded ? '#F5F3FF' : 'white',
                  }}
                  onClick={() => setExpandedGrade(isExpanded ? null : grade.id)}
                >
                  {/* Level badge */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: '#4F46E5', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: '700', flexShrink: 0,
                  }}>
                    {grade.level}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '15px', color: '#1F2937' }}>{grade.name}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                      {grade.streams.length === 0
                        ? 'No streams — click to add'
                        : grade.streams.map(s => s.name).join(' · ')}
                    </div>
                  </div>

                  {/* Stream count pill */}
                  {grade.streams.length > 0 && (
                    <div style={{ background: '#EEF2FF', color: '#4F46E5', padding: '2px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>
                      {grade.streams.length} stream{grade.streams.length !== 1 ? 's' : ''}
                    </div>
                  )}

                  {/* Chevron */}
                  <span style={{ color: '#9CA3AF', fontSize: '16px', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>▾</span>

                  {/* Delete grade */}
                  <button
                    onClick={e => { e.stopPropagation(); deleteGrade(grade.id) }}
                    disabled={isDeleting}
                    style={{ ...btnDanger, flexShrink: 0 }}
                    title="Delete grade"
                  >
                    {isDeleting ? '...' : 'Delete'}
                  </button>
                </div>

                {/* Expanded: streams section */}
                {isExpanded && (
                  <div style={{ padding: '16px 18px', borderTop: '1px solid #E5E7EB', background: '#FAFBFF' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                      Streams / Classes in {grade.name}
                    </div>

                    {/* Current streams */}
                    {grade.streams.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                        {grade.streams.map(stream => (
                          <div
                            key={stream.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '6px',
                              background: 'white', border: '1px solid #E5E7EB',
                              borderRadius: '8px', padding: '5px 10px', fontSize: '13px',
                            }}
                          >
                            <span style={{ fontWeight: '500', color: '#1F2937' }}>{grade.name} {stream.name}</span>
                            <button
                              onClick={() => deleteStream(stream.id)}
                              disabled={deletingId === stream.id}
                              style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '14px', padding: '0 2px', lineHeight: 1 }}
                              title="Remove stream"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '14px', fontStyle: 'italic' }}>
                        No streams yet — add A, B, Red, Blue, etc.
                      </div>
                    )}

                    {/* Add stream form */}
                    <form
                      onSubmit={e => { e.preventDefault(); addStream(grade.id) }}
                      style={{ display: 'flex', gap: '8px', alignItems: 'center', maxWidth: '320px' }}
                    >
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder="Stream name (e.g. A, B, Red, Blue)"
                        value={newStreamName}
                        onChange={e => setNewStreamName(e.target.value)}
                        required
                      />
                      <button type="submit" disabled={addingStream} style={{ ...btnPrimary, flexShrink: 0, opacity: addingStream ? 0.6 : 1 }}>
                        {addingStream ? '...' : 'Add'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
