import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

type Student = {
  id: string
  first_name: string
  last_name: string
  admission_number: string
}

type AttendanceRecord = {
  id: string
  student: string
  date: string
  status: 'P' | 'A' | 'L' | 'E'
  remarks?: string
  marked_by?: string
}

type AttendanceMap = Record<string, AttendanceRecord>

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

const STATUS_LABELS = {
  P: 'Present',
  A: 'Absent',
  L: 'Late',
  E: 'Excused'
}

export default function AttendancePage({ schoolId }: { schoolId: string }) {
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<AttendanceMap>({})
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [view, setView] = useState<'mark' | 'history'>('mark')

  useEffect(() => {
    loadData()
  }, [schoolId, selectedDate])

  async function loadData() {
    setLoading(true)
    try {
      // Fetch students
      const studentsRes = await apiFetch(`/api/v1/students/?school=${schoolId}`)
      const studentsData = await studentsRes.json()
      setStudents(studentsData.results || studentsData || [])

      // Fetch attendance for selected date
      const attendanceRes = await apiFetch(`/api/v1/attendance/?date=${selectedDate}`)
      const attendanceData = await attendanceRes.json()
      const items = attendanceData.results || attendanceData || []

      const map: AttendanceMap = {}
      items.forEach((record: AttendanceRecord) => {
        map[record.student] = record
      })
      setAttendance(map)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function markAttendance(studentId: string, status: 'P' | 'A' | 'L' | 'E') {
    setSaving((s) => ({ ...s, [studentId]: true }))
    try {
      const existingRecord = attendance[studentId]

      let res: Response
      if (existingRecord) {
        // Update existing attendance
        res = await apiFetch(`/api/v1/attendance/${existingRecord.id}/`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        })
      } else {
        // Create new attendance
        res = await apiFetch('/api/v1/attendance/', {
          method: 'POST',
          body: JSON.stringify({
            student: studentId,
            date: selectedDate,
            status
          })
        })
      }

      if (!res.ok) {
        const err = await res.text()
        console.error('Failed to save attendance:', err)
        alert('Failed to save attendance')
        return
      }

      const data = await res.json()
      setAttendance((prev) => ({ ...prev, [studentId]: data }))
    } catch (error) {
      console.error('Error marking attendance:', error)
      alert('Network error')
    } finally {
      setSaving((s) => ({ ...s, [studentId]: false }))
    }
  }

  async function markAllPresent() {
    if (!confirm('Mark all students as Present?')) return

    for (const student of students) {
      if (!attendance[student.id] || attendance[student.id].status !== 'P') {
        await markAttendance(student.id, 'P')
      }
    }
  }

  function getAttendanceStats() {
    const total = students.length
    const marked = Object.keys(attendance).length
    const present = Object.values(attendance).filter(a => a.status === 'P').length
    const absent = Object.values(attendance).filter(a => a.status === 'A').length
    const late = Object.values(attendance).filter(a => a.status === 'L').length
    const excused = Object.values(attendance).filter(a => a.status === 'E').length

    return { total, marked, present, absent, late, excused }
  }

  if (loading) {
    return <div>Loading attendance data...</div>
  }

  const stats = getAttendanceStats()

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2>Attendance Management</h2>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center' }}>
          <div>
            <label style={{ marginRight: 8 }}>Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '4px 8px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setView('mark')}
              style={{
                fontWeight: view === 'mark' ? 'bold' : 'normal',
                background: view === 'mark' ? '#007bff' : '#e0e0e0',
                color: view === 'mark' ? 'white' : 'black',
                padding: '6px 12px',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Mark Attendance
            </button>
            <button
              onClick={() => setView('history')}
              style={{
                fontWeight: view === 'history' ? 'bold' : 'normal',
                background: view === 'history' ? '#007bff' : '#e0e0e0',
                color: view === 'history' ? 'white' : 'black',
                padding: '6px 12px',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              View History
            </button>
          </div>

          {view === 'mark' && (
            <button
              onClick={markAllPresent}
              style={{
                background: '#28a745',
                color: 'white',
                padding: '6px 12px',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Mark All Present
            </button>
          )}
        </div>

        <div style={{
          display: 'flex',
          gap: 16,
          padding: 16,
          background: '#f5f5f5',
          borderRadius: 8,
          marginBottom: 16
        }}>
          <div><strong>Total:</strong> {stats.total}</div>
          <div><strong>Marked:</strong> {stats.marked}/{stats.total}</div>
          <div style={{ color: '#28a745' }}><strong>Present:</strong> {stats.present}</div>
          <div style={{ color: '#dc3545' }}><strong>Absent:</strong> {stats.absent}</div>
          <div style={{ color: '#ffc107' }}><strong>Late:</strong> {stats.late}</div>
          <div style={{ color: '#6c757d' }}><strong>Excused:</strong> {stats.excused}</div>
        </div>
      </div>

      {view === 'mark' ? (
        <div>
          {students.length === 0 ? (
            <p>No students found for this school.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>Admission No.</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Student Name</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const record = attendance[student.id]
                  const isSaving = saving[student.id]

                  return (
                    <tr key={student.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: 12 }}>{student.admission_number}</td>
                      <td style={{ padding: 12 }}>
                        {student.first_name} {student.last_name}
                      </td>
                      <td style={{ padding: 12 }}>
                        {record ? (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            background:
                              record.status === 'P' ? '#d4edda' :
                              record.status === 'A' ? '#f8d7da' :
                              record.status === 'L' ? '#fff3cd' :
                              '#e2e3e5',
                            color:
                              record.status === 'P' ? '#155724' :
                              record.status === 'A' ? '#721c24' :
                              record.status === 'L' ? '#856404' :
                              '#383d41'
                          }}>
                            {STATUS_LABELS[record.status]}
                          </span>
                        ) : (
                          <span style={{ color: '#6c757d' }}>Not marked</span>
                        )}
                      </td>
                      <td style={{ padding: 12 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            disabled={isSaving}
                            onClick={() => markAttendance(student.id, 'P')}
                            style={{
                              padding: '4px 12px',
                              background: record?.status === 'P' ? '#28a745' : '#e0e0e0',
                              color: record?.status === 'P' ? 'white' : 'black',
                              border: 'none',
                              borderRadius: 4,
                              cursor: isSaving ? 'not-allowed' : 'pointer'
                            }}
                          >
                            P
                          </button>
                          <button
                            disabled={isSaving}
                            onClick={() => markAttendance(student.id, 'A')}
                            style={{
                              padding: '4px 12px',
                              background: record?.status === 'A' ? '#dc3545' : '#e0e0e0',
                              color: record?.status === 'A' ? 'white' : 'black',
                              border: 'none',
                              borderRadius: 4,
                              cursor: isSaving ? 'not-allowed' : 'pointer'
                            }}
                          >
                            A
                          </button>
                          <button
                            disabled={isSaving}
                            onClick={() => markAttendance(student.id, 'L')}
                            style={{
                              padding: '4px 12px',
                              background: record?.status === 'L' ? '#ffc107' : '#e0e0e0',
                              color: record?.status === 'L' ? 'white' : 'black',
                              border: 'none',
                              borderRadius: 4,
                              cursor: isSaving ? 'not-allowed' : 'pointer'
                            }}
                          >
                            L
                          </button>
                          <button
                            disabled={isSaving}
                            onClick={() => markAttendance(student.id, 'E')}
                            style={{
                              padding: '4px 12px',
                              background: record?.status === 'E' ? '#6c757d' : '#e0e0e0',
                              color: record?.status === 'E' ? 'white' : 'black',
                              border: 'none',
                              borderRadius: 4,
                              cursor: isSaving ? 'not-allowed' : 'pointer'
                            }}
                          >
                            E
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div>
          <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
            History view coming soon - will show attendance trends and patterns
          </p>
        </div>
      )}
    </div>
  )
}
