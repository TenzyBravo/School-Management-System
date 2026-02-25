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
      String(Object.values(err).flat()[0] ?? fallback)
    )
  } catch {
    return `${fallback} (HTTP ${res.status})`
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stream {
  id: string
  name: string
  grade: string
}

interface Grade {
  id: string
  name: string
  level: number
  category: string
  category_display: string
  streams: Stream[]
}

type Category = 'LOWER_PRIMARY' | 'UPPER_PRIMARY' | 'SECONDARY' | 'OTHER'

// ─── Preset catalogue ─────────────────────────────────────────────────────────

interface Preset { name: string; level: number; category: Category }

const PRESET_SECTIONS: { label: string; color: string; bg: string; category: Category; presets: Preset[] }[] = [
  {
    label: 'Lower Primary',
    color: '#059669',
    bg: '#ECFDF5',
    category: 'LOWER_PRIMARY',
    presets: [
      { name: 'Grade 1', level: 1, category: 'LOWER_PRIMARY' },
      { name: 'Grade 2', level: 2, category: 'LOWER_PRIMARY' },
      { name: 'Grade 3', level: 3, category: 'LOWER_PRIMARY' },
      { name: 'Grade 4', level: 4, category: 'LOWER_PRIMARY' },
    ],
  },
  {
    label: 'Upper Primary',
    color: '#D97706',
    bg: '#FFFBEB',
    category: 'UPPER_PRIMARY',
    presets: [
      { name: 'Grade 5', level: 5, category: 'UPPER_PRIMARY' },
      { name: 'Grade 6', level: 6, category: 'UPPER_PRIMARY' },
      { name: 'Grade 7', level: 7, category: 'UPPER_PRIMARY' },
    ],
  },
  {
    label: 'Secondary',
    color: '#4F46E5',
    bg: '#EEF2FF',
    category: 'SECONDARY',
    presets: [
      { name: 'Form 1', level: 8,  category: 'SECONDARY' },
      { name: 'Form 2', level: 9,  category: 'SECONDARY' },
      { name: 'Form 3', level: 10, category: 'SECONDARY' },
      { name: 'Form 4', level: 11, category: 'SECONDARY' },
    ],
  },
]

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  LOWER_PRIMARY: { label: 'Lower Primary', color: '#059669', bg: '#ECFDF5' },
  UPPER_PRIMARY: { label: 'Upper Primary', color: '#D97706', bg: '#FFFBEB' },
  SECONDARY:     { label: 'Secondary',     color: '#4F46E5', bg: '#EEF2FF' },
  OTHER:         { label: 'Other',         color: '#6B7280', bg: '#F3F4F6' },
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function GradesManager() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noSchool, setNoSchool] = useState(false)

  // Add grade form
  const [gradeName,     setGradeName]     = useState('')
  const [gradeLevel,    setGradeLevel]    = useState('')
  const [gradeCategory, setGradeCategory] = useState<Category>('OTHER')
  const [addingGrade,   setAddingGrade]   = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)

  // Stream management per grade
  const [expandedGrade, setExpandedGrade] = useState<string | null>(null)
  const [newStreamName, setNewStreamName] = useState('')
  const [addingStream,  setAddingStream]  = useState(false)
  const [deletingId,    setDeletingId]    = useState<string | null>(null)

  useEffect(() => {
    fetchGrades()
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

  async function createGrade(name: string, level: number, category: Category = 'OTHER') {
    setAddingGrade(true)
    setError(null)
    try {
      const res = await apiFetch('/api/v1/grades/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, level, category }),
      })
      if (!res.ok) {
        const msg = await parseApiError(res, 'Failed to create grade')
        throw new Error(msg)
      }
      setGradeName('')
      setGradeLevel('')
      setGradeCategory('OTHER')
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

  // Filter presets to only show grades not yet created
  const existingNames = new Set(grades.map(g => g.name))

  // Group existing grades by category for display
  const gradesByCategory = grades.reduce<Record<string, Grade[]>>((acc, g) => {
    const cat = g.category || 'OTHER'
    ;(acc[cat] = acc[cat] || []).push(g)
    return acc
  }, {})

  // Ordered category display
  const displayOrder: Category[] = ['LOWER_PRIMARY', 'UPPER_PRIMARY', 'SECONDARY', 'OTHER']

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Loading grades...</div>
  )

  return (
    <div>
      {/* ── Header ── */}
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
          {showCustomForm ? '✕ Cancel' : '+ Custom Grade'}
        </button>
      </div>

      {/* ── No-school warning ── */}
      {noSchool && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#92400E', fontSize: '13px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
          <div>
            <strong>Your account has no school assigned.</strong>{' '}
            Grades are school-specific. Ask your administrator to link your account to a school in the Django admin.
          </div>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#DC2626', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: '16px', padding: '0 4px' }}>×</button>
        </div>
      )}

      {/* ── Quick-add presets (grouped by category) ── */}
      {!showCustomForm && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            Quick Add
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {PRESET_SECTIONS.map(section => {
              const available = section.presets.filter(p => !existingNames.has(p.name))
              if (!available.length) return null
              return (
                <div key={section.category} style={{ background: section.bg, border: `1px solid ${section.color}30`, borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: section.color, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {section.label}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {available.map(p => (
                      <button
                        key={p.name}
                        onClick={() => createGrade(p.name, p.level, p.category)}
                        disabled={addingGrade}
                        style={{
                          padding: '5px 14px',
                          background: 'white',
                          border: `1px solid ${section.color}50`,
                          borderRadius: '20px',
                          fontSize: '13px',
                          color: section.color,
                          cursor: addingGrade ? 'not-allowed' : 'pointer',
                          fontWeight: '500',
                        }}
                      >
                        + {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Custom grade form ── */}
      {showCustomForm && (
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ fontWeight: '600', fontSize: '14px', color: '#1F2937', marginBottom: '14px' }}>Custom Grade</div>
          <form
            onSubmit={e => { e.preventDefault(); createGrade(gradeName, parseInt(gradeLevel), gradeCategory) }}
            style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}
          >
            <div style={{ flex: 2, minWidth: '160px' }}>
              <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Grade Name</label>
              <input style={inputStyle} placeholder="e.g. Grade 1, Form 3, Year 7" value={gradeName} onChange={e => setGradeName(e.target.value)} required />
            </div>
            <div style={{ width: '80px' }}>
              <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Level</label>
              <input style={inputStyle} type="number" min="1" placeholder="1" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} required />
            </div>
            <div style={{ minWidth: '160px' }}>
              <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Category</label>
              <select
                value={gradeCategory}
                onChange={e => setGradeCategory(e.target.value as Category)}
                style={{ ...inputStyle, background: 'white' }}
              >
                <option value="LOWER_PRIMARY">Lower Primary</option>
                <option value="UPPER_PRIMARY">Upper Primary</option>
                <option value="SECONDARY">Secondary</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <button type="submit" disabled={addingGrade} style={{ ...btnPrimary, opacity: addingGrade ? 0.6 : 1 }}>
              {addingGrade ? 'Adding...' : 'Add Grade'}
            </button>
          </form>
        </div>
      )}

      {/* ── Grades list (grouped by category) ── */}
      {grades.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280', background: '#F9FAFB', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎓</div>
          <div style={{ fontWeight: '600', color: '#1F2937', marginBottom: '6px' }}>No grades yet</div>
          <div style={{ fontSize: '13px' }}>Use Quick Add above to add Lower Primary, Upper Primary, or Secondary grades.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {displayOrder.map(cat => {
            const catGrades = gradesByCategory[cat]
            if (!catGrades?.length) return null
            const meta = CATEGORY_META[cat]
            return (
              <div key={cat}>
                {/* Category heading */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ height: '3px', width: '24px', background: meta.color, borderRadius: '2px' }} />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: meta.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {meta.label}
                  </span>
                  <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
                  <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                    {catGrades.length} grade{catGrades.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {catGrades.map(grade => {
                    const isExpanded = expandedGrade === grade.id
                    const isDeleting = deletingId === grade.id

                    return (
                      <div
                        key={grade.id}
                        style={{
                          background: 'white',
                          border: `1px solid ${isExpanded ? meta.color + '80' : '#E5E7EB'}`,
                          borderRadius: '12px',
                          overflow: 'hidden',
                          boxShadow: isExpanded ? `0 2px 8px ${meta.color}20` : '0 1px 3px rgba(0,0,0,0.06)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {/* Grade header row */}
                        <div
                          style={{
                            display: 'flex', alignItems: 'center', padding: '14px 18px',
                            cursor: 'pointer', gap: '12px',
                            background: isExpanded ? `${meta.bg}` : 'white',
                            borderLeft: `4px solid ${meta.color}`,
                          }}
                          onClick={() => setExpandedGrade(isExpanded ? null : grade.id)}
                        >
                          {/* Level badge */}
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '8px',
                            background: meta.color, color: 'white',
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
                            <div style={{ background: `${meta.color}18`, color: meta.color, padding: '2px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>
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
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
