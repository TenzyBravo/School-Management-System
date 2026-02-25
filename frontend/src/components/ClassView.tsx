import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

interface Student {
  id: string
  child_id: string
  first_name: string
  last_name: string
  gender: string
  is_active: boolean
}

interface Subject {
  id: string
  name: string
  code: string
  assignmentId: string
}

interface ClassCard {
  grade: string
  grade_name: string
  grade_level: number
  stream: string | null
  stream_name: string | null
  student_count: number
  subjects: Subject[]
  is_class_teacher: boolean
}

interface Props {
  classCard: ClassCard
  onBack: () => void
  onNavigate: (section: string) => void
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  P: { label: 'Present', color: '#16A34A', bg: '#DCFCE7' },
  A: { label: 'Absent',  color: '#DC2626', bg: '#FEE2E2' },
  L: { label: 'Late',    color: '#D97706', bg: '#FEF3C7' },
  E: { label: 'Excused', color: '#6B7280', bg: '#F3F4F6' },
}

export default function ClassView({ classCard, onBack, onNavigate }: Props) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [todayAttendance, setTodayAttendance] = useState<Record<string, string>>({})
  const [savingAttendance, setSavingAttendance] = useState(false)
  const [attendanceSaved, setAttendanceSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance'>('overview')

  const className = classCard.stream_name
    ? `${classCard.grade_name} ${classCard.stream_name}`
    : classCard.grade_name

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiFetch(`/api/v1/grades/${classCard.grade}/students/`).then(r => r.ok ? r.json() : []),
      apiFetch(`/api/v1/attendance/?date=${today}`).then(r => r.ok ? r.json() : { results: [] }),
    ]).then(([studentData, attendanceData]) => {
      const studentList: Student[] = Array.isArray(studentData) ? studentData : studentData.results || []
      setStudents(studentList)

      // Map today's existing attendance
      const records = attendanceData.results || attendanceData
      const map: Record<string, string> = {}
      if (Array.isArray(records)) {
        for (const r of records) {
          map[r.student] = r.status
        }
      }
      // Default unrecorded students to 'P'
      for (const s of studentList) {
        if (!map[s.id]) map[s.id] = 'P'
      }
      setTodayAttendance(map)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [classCard.grade])

  async function saveAttendance() {
    setSavingAttendance(true)
    try {
      const records = students.map(s => ({
        student: s.id,
        date: today,
        status: todayAttendance[s.id] || 'P',
      }))
      const res = await apiFetch('/api/v1/attendance/bulk_create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      })
      if (!res.ok) throw new Error('Failed')
      setAttendanceSaved(true)
      setTimeout(() => setAttendanceSaved(false), 3000)
    } catch {
      alert('Failed to save attendance. Please try again.')
    } finally {
      setSavingAttendance(false)
    }
  }

  const attendanceSummary = React.useMemo(() => {
    const counts = { P: 0, A: 0, L: 0, E: 0 }
    for (const s of students) {
      const st = todayAttendance[s.id] || 'P'
      counts[st as keyof typeof counts]++
    }
    return counts
  }, [students, todayAttendance])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
        Loading class details...
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '28px' }}>
        <button
          onClick={onBack}
          style={{ padding: '8px 16px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', flexShrink: 0 }}
        >
          ← Back
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '700', color: '#1F2937' }}>{className}</h2>
          <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
            <span style={{ color: '#6B7280', fontSize: '14px' }}>👨‍🎓 {students.length} students</span>
            {classCard.is_class_teacher && (
              <span style={{ background: '#FEF3C7', color: '#D97706', padding: '2px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '600' }}>
                Class Teacher
              </span>
            )}
            <span style={{ color: '#6B7280', fontSize: '14px' }}>📅 Today: {today}</span>
          </div>
        </div>
      </div>

      {/* Subjects bar */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {classCard.subjects.map(s => (
          <span key={s.id} style={{
            background: '#EEF2FF', color: '#4F46E5',
            padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '500'
          }}>
            {s.name}
          </span>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#F3F4F6', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {(['overview', 'attendance'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontSize: '14px', fontWeight: '500',
              background: activeTab === tab ? 'white' : 'transparent',
              color: activeTab === tab ? '#4F46E5' : '#6B7280',
              boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {tab === 'overview' ? '👥 Students' : '📋 Attendance'}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          {students.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>
              No students enrolled in {className} yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', width: '40px' }}>#</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Student</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Child ID</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Gender</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Today</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => {
                  const status = todayAttendance[s.id]
                  const sc = status ? STATUS_CONFIG[status] : null
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '12px 16px', color: '#9CA3AF', fontSize: '13px' }}>{i + 1}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: s.gender === 'M' ? '#DBEAFE' : '#FCE7F3',
                            color: s.gender === 'M' ? '#1D4ED8' : '#BE185D',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: '700', flexShrink: 0
                          }}>
                            {s.first_name.charAt(0)}{s.last_name.charAt(0)}
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>
                            {s.first_name} {s.last_name}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6B7280', fontFamily: 'monospace' }}>{s.child_id}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6B7280' }}>{s.gender === 'M' ? 'Male' : 'Female'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {sc ? (
                          <span style={{ background: sc.bg, color: sc.color, padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: '500' }}>
                            {sc.label}
                          </span>
                        ) : <span style={{ color: '#9CA3AF', fontSize: '12px' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── ATTENDANCE TAB ── */}
      {activeTab === 'attendance' && (
        <div>
          {/* Summary row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG[string]][]).map(([key, cfg]) => (
              <div key={key} style={{
                flex: 1, minWidth: '100px', background: 'white', borderRadius: '10px', padding: '14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)', textAlign: 'center',
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: cfg.color }}>{attendanceSummary[key as keyof typeof attendanceSummary]}</div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{cfg.label}</div>
              </div>
            ))}
          </div>

          {/* Attendance grid */}
          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
            {students.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>No students enrolled.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Student</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6B7280', width: '280px' }}>Status — {today}</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: s.gender === 'M' ? '#DBEAFE' : '#FCE7F3',
                            color: s.gender === 'M' ? '#1D4ED8' : '#BE185D',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: '700',
                          }}>
                            {s.first_name.charAt(0)}{s.last_name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>
                              {s.first_name} {s.last_name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>{s.child_id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG[string]][]).map(([key, cfg]) => (
                            <button
                              key={key}
                              onClick={() => setTodayAttendance(prev => ({ ...prev, [s.id]: key }))}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '8px',
                                border: todayAttendance[s.id] === key ? `2px solid ${cfg.color}` : '1px solid #E5E7EB',
                                background: todayAttendance[s.id] === key ? cfg.bg : 'white',
                                color: todayAttendance[s.id] === key ? cfg.color : '#6B7280',
                                fontSize: '12px',
                                fontWeight: todayAttendance[s.id] === key ? '700' : '400',
                                cursor: 'pointer',
                                transition: 'all 0.1s',
                              }}
                            >
                              {cfg.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {students.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={saveAttendance}
                disabled={savingAttendance}
                style={{
                  padding: '12px 32px', background: savingAttendance ? '#9CA3AF' : '#4F46E5',
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontSize: '14px', fontWeight: '600', cursor: savingAttendance ? 'not-allowed' : 'pointer',
                }}
              >
                {savingAttendance ? 'Saving...' : 'Save Attendance'}
              </button>
              {attendanceSaved && (
                <span style={{ color: '#16A34A', fontSize: '14px', fontWeight: '500' }}>
                  ✓ Attendance saved!
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
