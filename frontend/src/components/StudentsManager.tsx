import React, { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'
import BulkUploadModal from './BulkUploadModal'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
  id: string
  first_name: string
  last_name: string
  child_id: string
  admission_number: string | null
  date_of_birth: string
  gender: string | null
  enrollment_date: string
  current_class: string | null
  current_class_name: string | null
  current_stream: string | null
  current_stream_name: string | null
  is_active: boolean
}

interface Grade {
  id: string
  name: string
  level: number
  streams: { id: string; name: string }[]
}

interface FormState {
  first_name: string
  last_name: string
  middle_name: string
  child_id: string
  admission_number: string
  date_of_birth: string
  gender: string
  enrollment_date: string
  current_class: string
  current_stream: string
  guardian_name: string
  guardian_phone: string
  guardian_email: string
  address: string
}

const EMPTY_FORM: FormState = {
  first_name: '',
  last_name: '',
  middle_name: '',
  child_id: '',
  admission_number: '',
  date_of_birth: '',
  gender: 'M',
  enrollment_date: new Date().toISOString().slice(0, 10),
  current_class: '',
  current_stream: '',
  guardian_name: '',
  guardian_phone: '',
  guardian_email: '',
  address: '',
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #D1D5DB',
  borderRadius: '8px',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '500',
  color: '#374151',
  marginBottom: '4px',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function parseApiError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.clone().text()
    if (!body.trim() || body.trim().startsWith('<')) return `${fallback} (HTTP ${res.status})`
    const err = JSON.parse(body)
    if (Array.isArray(err)) return String(err[0] ?? fallback)
    return (
      err.detail ||
      err.non_field_errors?.[0] ||
      err.child_id?.[0] ||
      err.first_name?.[0] ||
      String(Object.values(err).flat()[0] ?? fallback)
    )
  } catch {
    return `${fallback} (HTTP ${res.status})`
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentsManager() {
  const [students, setStudents] = useState<Student[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('')

  useEffect(() => {
    loadStudents()
    loadGrades()
  }, [])

  async function loadStudents() {
    setLoading(true)
    try {
      const res = await apiFetch('/api/v1/students/')
      const data = await res.json()
      setStudents(data.results ?? data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  async function loadGrades() {
    try {
      const res = await apiFetch('/api/v1/grades/')
      const data = await res.json()
      setGrades(data.results ?? data)
    } catch {
      // silent
    }
  }

  const availableStreams = grades.find(g => g.id === form.current_class)?.streams ?? []

  function setField(key: keyof FormState, value: string) {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'current_class') next.current_stream = ''
      return next
    })
  }

  async function openEdit(student: Student) {
    // Fetch full student record (includes profile)
    setError(null)
    try {
      const res = await apiFetch(`/api/v1/students/${student.id}/`)
      const data = await res.json()
      setForm({
        first_name: data.first_name ?? '',
        last_name: data.last_name ?? '',
        middle_name: data.middle_name ?? '',
        child_id: data.child_id ?? '',
        admission_number: data.admission_number ?? '',
        date_of_birth: data.date_of_birth ?? '',
        gender: data.gender ?? 'M',
        enrollment_date: data.enrollment_date ?? new Date().toISOString().slice(0, 10),
        current_class: data.current_class ?? '',
        current_stream: data.current_stream ?? '',
        guardian_name: data.profile?.guardian_name ?? '',
        guardian_phone: data.profile?.guardian_phone ?? '',
        guardian_email: data.profile?.guardian_email ?? '',
        address: data.profile?.address ?? '',
      })
      setEditingId(student.id)
      setShowForm(true)
    } catch {
      setError('Failed to load student details.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload: Record<string, unknown> = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      middle_name: form.middle_name.trim() || null,
      child_id: form.child_id.trim(),
      admission_number: form.admission_number.trim() || null,
      date_of_birth: form.date_of_birth,
      gender: form.gender,
      enrollment_date: form.enrollment_date,
      current_class: form.current_class || null,
      current_stream: form.current_stream || null,
    }

    if (form.guardian_name.trim() && form.guardian_phone.trim()) {
      payload['profile'] = {
        guardian_name: form.guardian_name.trim(),
        guardian_phone: form.guardian_phone.trim(),
        guardian_email: form.guardian_email.trim() || null,
        address: form.address.trim(),
        special_needs: false,
      }
    }

    const isEdit = Boolean(editingId)
    const url = isEdit ? `/api/v1/students/${editingId}/` : '/api/v1/students/'
    const method = isEdit ? 'PATCH' : 'POST'

    try {
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const msg = await parseApiError(res, isEdit ? 'Failed to update student' : 'Failed to add student')
        throw new Error(msg)
      }
      setForm(EMPTY_FORM)
      setEditingId(null)
      setShowForm(false)
      await loadStudents()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(student: Student) {
    try {
      await apiFetch(`/api/v1/students/${student.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !student.is_active }),
      })
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, is_active: !s.is_active } : s))
    } catch {
      // silent
    }
  }

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    const nameMatch = !q || `${s.first_name} ${s.last_name} ${s.child_id}`.toLowerCase().includes(q)
    const classMatch = !filterClass || s.current_class === filterClass
    return nameMatch && classMatch
  })

  const th: React.CSSProperties = {
    padding: '10px 14px', textAlign: 'left', fontSize: '13px',
    fontWeight: '600', color: '#374151', background: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
  }
  const td: React.CSSProperties = {
    padding: '10px 14px', fontSize: '14px', color: '#1F2937',
    borderBottom: '1px solid #F3F4F6',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1F2937', margin: 0 }}>
            Students ({students.length})
          </h3>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '2px 0 0' }}>Manage student enrolment</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setShowBulkUpload(true)}
            style={{ background: '#059669', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
          >
            Bulk Upload
          </button>
          <button
            onClick={() => { setShowForm(true); setError(null) }}
            style={{ background: '#4F46E5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
          >
            + Add Student
          </button>
          <button
            onClick={async () => {
              const ids = Object.keys(selected).filter(k => selected[k])
              if (ids.length === 0) return alert('No students selected for deletion.')
              if (!confirm(`Delete ${ids.length} selected student(s)? This is irreversible.`)) return
              try {
                for (const id of ids) {
                  const res = await apiFetch(`/api/v1/students/${id}/`, { method: 'DELETE' })
                  if (!res.ok) {
                    const text = await res.text()
                    throw new Error(text || `Failed to delete ${id}`)
                  }
                }
                // Refresh list
                setSelected({})
                await loadStudents()
                alert('Selected students deleted.')
              } catch (err: any) {
                alert('Error deleting students: ' + (err.message || err))
              }
            }}
            style={{ background: '#DC2626', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
          >
            Delete Selected
          </button>
        </div>
      </div>

      {/* ── Add Student Modal ── */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '40px 16px', overflowY: 'auto',
        }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '620px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1F2937' }}>{editingId ? 'Edit Student' : 'New Student'}</h3>
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#6B7280', lineHeight: 1 }}>×</button>
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Personal info */}
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Personal Information</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '4px' }}>
                <Field label="First Name *">
                  <input style={inputStyle} value={form.first_name} onChange={e => setField('first_name', e.target.value)} required />
                </Field>
                <Field label="Last Name *">
                  <input style={inputStyle} value={form.last_name} onChange={e => setField('last_name', e.target.value)} required />
                </Field>
                <Field label="Middle Name">
                  <input style={inputStyle} value={form.middle_name} onChange={e => setField('middle_name', e.target.value)} />
                </Field>
                <Field label="Child ID *">
                  <input style={inputStyle} value={form.child_id} onChange={e => setField('child_id', e.target.value)} required placeholder="e.g. CHL001" />
                </Field>
                <Field label="Date of Birth *">
                  <input type="date" style={inputStyle} value={form.date_of_birth} onChange={e => setField('date_of_birth', e.target.value)} required />
                </Field>
                <Field label="Gender *">
                  <select style={inputStyle} value={form.gender} onChange={e => setField('gender', e.target.value)} required>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </Field>
                <Field label="Enrolment Date *">
                  <input type="date" style={inputStyle} value={form.enrollment_date} onChange={e => setField('enrollment_date', e.target.value)} required />
                </Field>
                <Field label="Admission No.">
                  <input style={inputStyle} value={form.admission_number} onChange={e => setField('admission_number', e.target.value)} placeholder="Optional" />
                </Field>
              </div>

              {/* Class assignment */}
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '16px 0 10px' }}>Class Assignment</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '4px' }}>
                <Field label="Grade / Class">
                  <select style={inputStyle} value={form.current_class} onChange={e => setField('current_class', e.target.value)}>
                    <option value="">— Not assigned —</option>
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Stream">
                  <select
                    style={inputStyle}
                    value={form.current_stream}
                    onChange={e => setField('current_stream', e.target.value)}
                    disabled={!form.current_class || availableStreams.length === 0}
                  >
                    <option value="">— No stream —</option>
                    {availableStreams.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Guardian info */}
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '16px 0 10px' }}>Guardian / Parent <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <Field label="Guardian Name">
                  <input style={inputStyle} value={form.guardian_name} onChange={e => setField('guardian_name', e.target.value)} placeholder="Full name" />
                </Field>
                <Field label="Guardian Phone">
                  <input style={inputStyle} value={form.guardian_phone} onChange={e => setField('guardian_phone', e.target.value)} placeholder="+260..." />
                </Field>
                <Field label="Guardian Email">
                  <input type="email" style={inputStyle} value={form.guardian_email} onChange={e => setField('guardian_email', e.target.value)} placeholder="Optional" />
                </Field>
                <Field label="Address">
                  <input style={inputStyle} value={form.address} onChange={e => setField('address', e.target.value)} placeholder="Optional" />
                </Field>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }}
                  style={{ padding: '10px 20px', background: 'white', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '10px 24px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <input
          placeholder="Search by name or Child ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, maxWidth: '280px' }}
        />
        <select
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
          style={{ ...inputStyle, maxWidth: '180px' }}
        >
          <option value="">All Classes</option>
          {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* Student table */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Loading…</div>
      ) : (
        <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                  <th style={th}><input type="checkbox" onChange={e => {
                    const checked = e.target.checked
                    const newSel: Record<string, boolean> = {}
                    filtered.forEach(s => { newSel[s.id] = checked })
                    setSelected(newSel)
                  }} checked={filtered.length > 0 && filtered.every(s => selected[s.id])} /></th>
                  <th style={th}>Child ID</th>
                <th style={th}>Name</th>
                <th style={th}>Gender</th>
                <th style={th}>Date of Birth</th>
                <th style={th}>Class / Stream</th>
                <th style={th}>Status</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(student => (
                <tr key={student.id} style={{ opacity: student.is_active ? 1 : 0.5 }}>
                  <td style={{ ...td, width: '38px', textAlign: 'center' }}>
                    <input type="checkbox" checked={!!selected[student.id]} onChange={e => setSelected(prev => ({ ...prev, [student.id]: e.target.checked }))} />
                  </td>
                  <td style={{ ...td, color: '#6B7280', fontFamily: 'monospace', fontSize: '13px' }}>{student.child_id}</td>
                  <td style={{ ...td, fontWeight: '500' }}>{student.first_name} {student.last_name}</td>
                  <td style={td}>{student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : '—'}</td>
                  <td style={{ ...td, color: '#6B7280' }}>{student.date_of_birth || '—'}</td>
                  <td style={td}>
                    {student.current_class_name
                      ? (student.current_stream_name
                        ? `${student.current_class_name} ${student.current_stream_name}`
                        : student.current_class_name)
                      : <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Unassigned</span>
                    }
                  </td>
                  <td style={td}>
                    <button
                      onClick={() => toggleActive(student)}
                      style={{
                        padding: '3px 10px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        fontSize: '12px', fontWeight: '500',
                        background: student.is_active ? '#D1FAE5' : '#F3F4F6',
                        color: student.is_active ? '#065F46' : '#6B7280',
                      }}
                    >
                      {student.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => openEdit(student)}
                      style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', background: 'white', color: '#374151', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280', background: '#F9FAFB' }}>
              {students.length === 0
                ? 'No students yet. Click "+ Add Student" to enrol your first student.'
                : 'No students match your search.'}
            </div>
          )}
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadModal
          type="students"
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => { loadStudents() }}
        />
      )}
    </div>
  )
}
