import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

type Grade = {
  id: string
  name: string
  level: number
  streams: Stream[]
}

type Stream = {
  id: string
  name: string
  class_name: string
}

type Student = {
  id: string
  first_name: string
  last_name: string
  child_id: string
  admission_number: string
}

type AttendanceRecord = {
  student_id: string
  status: 'P' | 'A' | 'L' | 'E' | null
}

const statusButtons = [
  { value: 'P', label: 'Present', color: '#059669', bg: '#D1FAE5' },
  { value: 'A', label: 'Absent', color: '#DC2626', bg: '#FEE2E2' },
  { value: 'L', label: 'Late', color: '#D97706', bg: '#FEF3C7' },
  { value: 'E', label: 'Excused', color: '#7C3AED', bg: '#EDE9FE' },
] as const

export default function AttendanceMarking() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [selectedGradeId, setSelectedGradeId] = useState('')
  const [selectedStreamId, setSelectedStreamId] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  // Load grades with streams on mount
  useEffect(() => {
    apiFetch('/api/v1/grades/class-list/')
      .then(r => r.json())
      .then(data => setGrades(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load grades:', err))
  }, [])

  const selectedGrade = grades.find(g => g.id === selectedGradeId)
  const streams = selectedGrade?.streams ?? []

  // Load students + existing attendance when grade/stream/date changes
  useEffect(() => {
    if (!selectedGradeId) {
      setStudents([])
      setAttendance({})
      return
    }
    loadStudentsAndAttendance()
  }, [selectedGradeId, selectedStreamId, selectedDate])

  async function loadStudentsAndAttendance() {
    setLoading(true)
    setSavedOk(false)
    try {
      // Fetch students for the selected grade (and optionally stream)
      const studentUrl = selectedStreamId
        ? `/api/v1/grades/${selectedGradeId}/students/?stream=${selectedStreamId}`
        : `/api/v1/grades/${selectedGradeId}/students/`
      const studentsRes = await apiFetch(studentUrl)
      const studentList: Student[] = await studentsRes.json()
      setStudents(studentList)

      // Fetch existing attendance records for this date + grade (+ stream)
      let attUrl = `/api/v1/attendance/?date=${selectedDate}&grade=${selectedGradeId}`
      if (selectedStreamId) attUrl += `&stream=${selectedStreamId}`
      const attRes = await apiFetch(attUrl)
      const attData = await attRes.json()
      const attList: any[] = attData.results ?? attData

      // Build map
      const map: Record<string, AttendanceRecord> = {}
      attList.forEach((rec: any) => {
        map[rec.student] = { student_id: rec.student, status: rec.status }
      })
      studentList.forEach((s: Student) => {
        if (!map[s.id]) map[s.id] = { student_id: s.id, status: null }
      })
      setAttendance(map)
    } catch (err) {
      console.error('Failed to load attendance data:', err)
    } finally {
      setLoading(false)
    }
  }

  function mark(studentId: string, s: 'P' | 'A' | 'L' | 'E') {
    setAttendance(prev => ({ ...prev, [studentId]: { ...prev[studentId], status: s } }))
    setSavedOk(false)
  }

  function markAll(s: 'P' | 'A' | 'L' | 'E') {
    setAttendance(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(id => { next[id] = { ...next[id], status: s } })
      return next
    })
    setSavedOk(false)
  }

  async function saveAttendance() {
    const records = Object.values(attendance)
      .filter(r => r.status !== null)
      .map(r => ({ student: r.student_id, date: selectedDate, status: r.status! }))

    if (records.length === 0) {
      alert('No attendance marked yet.')
      return
    }

    setSaving(true)
    try {
      const res = await apiFetch('/api/v1/attendance/bulk_create/', {
        method: 'POST',
        body: JSON.stringify({ records }),
      })
      const data = await res.json()
      if (res.ok) {
        setSavedOk(true)
      } else {
        alert(`Save failed: ${data.error || JSON.stringify(data)}`)
      }
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save attendance.')
    } finally {
      setSaving(false)
    }
  }

  const stats = {
    total: students.length,
    present: Object.values(attendance).filter(r => r.status === 'P').length,
    absent: Object.values(attendance).filter(r => r.status === 'A').length,
    late: Object.values(attendance).filter(r => r.status === 'L').length,
    excused: Object.values(attendance).filter(r => r.status === 'E').length,
    unmarked: Object.values(attendance).filter(r => r.status === null).length,
  }

  return (
    <div>
      {/* Class + Date selector */}
      <div style={{
        background: '#F9FAFB', padding: '20px', borderRadius: '12px',
        marginBottom: '24px', border: '1px solid #E5E7EB',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px',
      }}>
        {/* Grade */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            Grade / Class
          </label>
          <select
            value={selectedGradeId}
            onChange={e => { setSelectedGradeId(e.target.value); setSelectedStreamId('') }}
            style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px' }}
          >
            <option value="">— Select a grade —</option>
            {grades.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* Stream */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            Stream (optional)
          </label>
          <select
            value={selectedStreamId}
            onChange={e => setSelectedStreamId(e.target.value)}
            disabled={streams.length === 0}
            style={{
              width: '100%', padding: '10px', border: '1px solid #D1D5DB',
              borderRadius: '8px', fontSize: '14px',
              background: streams.length === 0 ? '#F3F4F6' : 'white',
            }}
          >
            <option value="">— All streams —</option>
            {streams.map(s => (
              <option key={s.id} value={s.id}>{s.class_name}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* No grade selected */}
      {!selectedGradeId && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
          <p style={{ fontSize: '16px', fontWeight: '500' }}>Select a grade above to start marking attendance</p>
        </div>
      )}

      {/* Loading */}
      {selectedGradeId && loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Loading students...</div>
      )}

      {/* Attendance grid */}
      {selectedGradeId && !loading && (
        <>
          {/* Stats + actions bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '16px', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
              <span style={{ color: '#1F2937', fontWeight: '600' }}>Total: {stats.total}</span>
              <span style={{ color: '#059669' }}>P: {stats.present}</span>
              <span style={{ color: '#DC2626' }}>A: {stats.absent}</span>
              <span style={{ color: '#D97706' }}>L: {stats.late}</span>
              <span style={{ color: '#7C3AED' }}>E: {stats.excused}</span>
              {stats.unmarked > 0 && <span style={{ color: '#F59E0B' }}>Unmarked: {stats.unmarked}</span>}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => markAll('P')}
                style={{ padding: '8px 16px', background: '#D1FAE5', color: '#059669', border: '1px solid #6EE7B7', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
              >
                Mark All Present
              </button>
              <button
                onClick={saveAttendance}
                disabled={saving || stats.total === 0}
                style={{
                  padding: '8px 20px',
                  background: savedOk ? '#059669' : saving ? '#9CA3AF' : '#4F46E5',
                  color: 'white', border: 'none', borderRadius: '8px',
                  cursor: saving || stats.total === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px', fontWeight: '600',
                }}
              >
                {saving ? 'Saving...' : savedOk ? '✓ Saved' : 'Save Attendance'}
              </button>
            </div>
          </div>

          {students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280', border: '1px dashed #D1D5DB', borderRadius: '12px' }}>
              No students found in this class
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {students.map((student, idx) => {
                const record = attendance[student.id]
                return (
                  <div
                    key={student.id}
                    style={{
                      padding: '14px 16px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      background: record?.status ? '#FAFAFA' : 'white',
                      display: 'grid',
                      gridTemplateColumns: '32px 1fr auto',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div style={{ fontSize: '14px', color: '#9CA3AF', fontWeight: '500', textAlign: 'center' }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937' }}>
                        {student.first_name} {student.last_name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                        {student.child_id || student.admission_number}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {statusButtons.map(btn => (
                        <button
                          key={btn.value}
                          onClick={() => mark(student.id, btn.value)}
                          style={{
                            padding: '8px 14px',
                            border: `2px solid ${record?.status === btn.value ? btn.color : '#E5E7EB'}`,
                            borderRadius: '8px',
                            background: record?.status === btn.value ? btn.bg : 'white',
                            color: record?.status === btn.value ? btn.color : '#6B7280',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            minWidth: '64px',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            if (record?.status !== btn.value) {
                              e.currentTarget.style.borderColor = btn.color
                              e.currentTarget.style.color = btn.color
                            }
                          }}
                          onMouseLeave={e => {
                            if (record?.status !== btn.value) {
                              e.currentTarget.style.borderColor = '#E5E7EB'
                              e.currentTarget.style.color = '#6B7280'
                            }
                          }}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
