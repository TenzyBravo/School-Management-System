import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

type Student = {
  id: string
  first_name: string
  last_name: string
  admission_number: string
  current_class?: { id: string; name: string }
}

type AttendanceRecord = {
  student_id: string
  status: 'P' | 'A' | 'L' | 'E' | null
  remarks?: string
}

export default function AttendanceMarking() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({})
  const [saving, setSaving] = useState(false)
  const [savedToday, setSavedToday] = useState(false)

  useEffect(() => {
    loadStudentsAndAttendance()
  }, [selectedDate])

  async function loadStudentsAndAttendance() {
    setLoading(true)
    try {
      // Load students
      const studentsRes = await apiFetch('/api/v1/students/')
      const studentsData = await studentsRes.json()
      const studentsList = studentsData.results || studentsData
      setStudents(studentsList)

      // Load existing attendance for selected date
      const attendanceRes = await apiFetch(`/api/v1/attendance/?date=${selectedDate}`)
      const attendanceData = await attendanceRes.json()
      const attendanceList = attendanceData.results || attendanceData

      // Map attendance by student ID
      const attendanceMap: Record<string, AttendanceRecord> = {}
      attendanceList.forEach((record: any) => {
        attendanceMap[record.student] = {
          student_id: record.student,
          status: record.status,
          remarks: record.remarks
        }
      })

      // Initialize attendance map for all students
      studentsList.forEach((student: Student) => {
        if (!attendanceMap[student.id]) {
          attendanceMap[student.id] = {
            student_id: student.id,
            status: null
          }
        }
      })

      setAttendance(attendanceMap)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  function markAttendance(studentId: string, status: 'P' | 'A' | 'L' | 'E') {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }))
    setSavedToday(false)
  }

  async function saveAttendance() {
    setSaving(true)
    try {
      const promises = Object.values(attendance)
        .filter(record => record.status !== null)
        .map(record =>
          apiFetch('/api/v1/attendance/', {
            method: 'POST',
            body: JSON.stringify({
              student: record.student_id,
              date: selectedDate,
              status: record.status,
              remarks: record.remarks || ''
            })
          })
        )

      await Promise.all(promises)
      setSavedToday(true)
      alert('Attendance saved successfully!')
    } catch (err) {
      console.error('Failed to save attendance:', err)
      alert('Failed to save attendance. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const statusButtons = [
    { value: 'P', label: 'Present', color: '#059669', bg: '#D1FAE5' },
    { value: 'A', label: 'Absent', color: '#DC2626', bg: '#FEE2E2' },
    { value: 'L', label: 'Late', color: '#D97706', bg: '#FEF3C7' },
    { value: 'E', label: 'Excused', color: '#7C3AED', bg: '#EDE9FE' }
  ] as const

  const stats = {
    total: students.length,
    present: Object.values(attendance).filter(r => r.status === 'P').length,
    absent: Object.values(attendance).filter(r => r.status === 'A').length,
    late: Object.values(attendance).filter(r => r.status === 'L').length,
    excused: Object.values(attendance).filter(r => r.status === 'E').length,
    unmarked: Object.values(attendance).filter(r => r.status === null).length
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {/* Header with Date Selector */}
      <div style={{
        background: '#F9FAFB',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '24px',
        border: '1px solid #E5E7EB'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              style={{
                padding: '10px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            />
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Total</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937' }}>{stats.total}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Present</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>{stats.present}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Absent</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#DC2626' }}>{stats.absent}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Unmarked</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#F59E0B' }}>{stats.unmarked}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Grid */}
      {students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
          No students found
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
              Marking attendance for {students.length} students
            </p>
            <button
              onClick={saveAttendance}
              disabled={saving || stats.unmarked === stats.total}
              style={{
                background: saving ? '#9CA3AF' : '#059669',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: saving || stats.unmarked === stats.total ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {saving ? 'Saving...' : savedToday ? '✓ Saved' : 'Save Attendance'}
            </button>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {students.map((student) => {
              const record = attendance[student.id]
              return (
                <div
                  key={student.id}
                  style={{
                    padding: '16px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    background: record?.status ? '#FAFAFA' : 'white',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
                      {student.first_name} {student.last_name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '2px' }}>
                      Admission: {student.admission_number}
                      {student.current_class && ` • ${student.current_class.name}`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {statusButtons.map((btn) => (
                      <button
                        key={btn.value}
                        onClick={() => markAttendance(student.id, btn.value)}
                        style={{
                          padding: '10px 16px',
                          border: `2px solid ${record?.status === btn.value ? btn.color : '#E5E7EB'}`,
                          borderRadius: '8px',
                          background: record?.status === btn.value ? btn.bg : 'white',
                          color: record?.status === btn.value ? btn.color : '#6B7280',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          minWidth: '70px'
                        }}
                        onMouseEnter={(e) => {
                          if (record?.status !== btn.value) {
                            e.currentTarget.style.borderColor = btn.color
                            e.currentTarget.style.color = btn.color
                          }
                        }}
                        onMouseLeave={(e) => {
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
        </>
      )}
    </div>
  )
}
