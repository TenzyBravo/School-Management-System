import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

type AttendanceStats = {
  total_days: number
  present_days: number
  absent_days: number
  late_days: number
  excused_days: number
  attendance_rate: number
}

type StudentAttendance = {
  student_id: string
  student_name: string
  admission_number: string
  stats: AttendanceStats
  is_at_risk: boolean
}

export default function AttendanceDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StudentAttendance[]>([])
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadAttendanceStats()
  }, [dateRange])

  async function loadAttendanceStats() {
    setLoading(true)
    try {
      // Load all students
      const studentsRes = await apiFetch('/api/v1/students/')
      const studentsData = await studentsRes.json()
      const students = studentsData.results || studentsData

      // Load attendance records for date range
      const attendanceRes = await apiFetch(`/api/v1/attendance/?date_after=${dateRange.start}&date_before=${dateRange.end}`)
      const attendanceData = await attendanceRes.json()
      const attendanceRecords = attendanceData.results || attendanceData

      // Calculate stats for each student
      const studentStats: StudentAttendance[] = students.map((student: any) => {
        const studentRecords = attendanceRecords.filter((r: any) => r.student === student.id)

        const present = studentRecords.filter((r: any) => r.status === 'P').length
        const absent = studentRecords.filter((r: any) => r.status === 'A').length
        const late = studentRecords.filter((r: any) => r.status === 'L').length
        const excused = studentRecords.filter((r: any) => r.status === 'E').length
        const total = studentRecords.length

        const attendanceRate = total > 0 ? ((present + late) / total) * 100 : 0
        const isAtRisk = attendanceRate < 85 || absent > 5 // Chronic absence threshold

        return {
          student_id: student.id,
          student_name: `${student.first_name} ${student.last_name}`,
          admission_number: student.admission_number,
          stats: {
            total_days: total,
            present_days: present,
            absent_days: absent,
            late_days: late,
            excused_days: excused,
            attendance_rate: Math.round(attendanceRate * 10) / 10
          },
          is_at_risk: isAtRisk
        }
      })

      // Sort: at-risk students first, then by attendance rate
      studentStats.sort((a, b) => {
        if (a.is_at_risk && !b.is_at_risk) return -1
        if (!a.is_at_risk && b.is_at_risk) return 1
        return b.stats.attendance_rate - a.stats.attendance_rate
      })

      setStats(studentStats)
    } catch (err) {
      console.error('Failed to load attendance stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const atRiskCount = stats.filter(s => s.is_at_risk).length
  const avgAttendance = stats.length > 0
    ? Math.round((stats.reduce((sum, s) => sum + s.stats.attendance_rate, 0) / stats.length) * 10) / 10
    : 0

  if (loading) return <div>Loading statistics...</div>

  return (
    <div>
      {/* Date Range Selector */}
      <div style={{
        background: '#F9FAFB',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '24px',
        border: '1px solid #E5E7EB'
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              From Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              style={{
                padding: '10px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              To Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
              style={{
                padding: '10px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
          <button
            onClick={loadAttendanceStats}
            style={{
              padding: '10px 20px',
              background: '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Update Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{
          padding: '20px',
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Total Students</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1F2937' }}>{stats.length}</div>
        </div>

        <div style={{
          padding: '20px',
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Average Attendance</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#059669' }}>{avgAttendance}%</div>
        </div>

        <div style={{
          padding: '20px',
          background: atRiskCount > 0 ? '#FEF2F2' : 'white',
          border: `1px solid ${atRiskCount > 0 ? '#FCA5A5' : '#E5E7EB'}`,
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>⚠️ At-Risk Students</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#DC2626' }}>{atRiskCount}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
            {'<'}85% attendance or {'>'}5 absences
          </div>
        </div>
      </div>

      {/* At-Risk Alerts */}
      {atRiskCount > 0 && (
        <div style={{
          background: '#FEF2F2',
          border: '2px solid #FCA5A5',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#DC2626', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span>
            <span>Chronic Absence Alerts</span>
          </h3>
          <p style={{ fontSize: '14px', color: '#991B1B', marginBottom: '16px' }}>
            The following students require immediate attention due to poor attendance:
          </p>
          <div style={{ display: 'grid', gap: '12px' }}>
            {stats.filter(s => s.is_at_risk).slice(0, 10).map((student) => (
              <div
                key={student.student_id}
                style={{
                  padding: '16px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #FCA5A5',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
                    {student.student_name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '2px' }}>
                    {student.admission_number} • {student.stats.absent_days} absences in {student.stats.total_days} days
                  </div>
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: student.stats.attendance_rate < 75 ? '#DC2626' : '#F59E0B'
                }}>
                  {student.stats.attendance_rate}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Student List */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', marginBottom: '16px' }}>
          All Students Attendance Report
        </h3>
        <div style={{ display: 'grid', gap: '8px' }}>
          {stats.map((student) => (
            <div
              key={student.student_id}
              style={{
                padding: '16px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                background: student.is_at_risk ? '#FEF2F2' : 'white',
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 100px',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
                  {student.student_name}
                  {student.is_at_risk && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '12px',
                      background: '#FEE2E2',
                      color: '#DC2626',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: '500'
                    }}>
                      At Risk
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '2px' }}>
                  {student.admission_number}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', fontSize: '14px' }}>
                <span title="Present">✓ {student.stats.present_days}</span>
                <span title="Absent" style={{ color: '#DC2626' }}>✗ {student.stats.absent_days}</span>
                <span title="Late" style={{ color: '#F59E0B' }}>⏰ {student.stats.late_days}</span>
                <span title="Excused" style={{ color: '#7C3AED' }}>E {student.stats.excused_days}</span>
              </div>

              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                color: student.stats.attendance_rate >= 95 ? '#059669' :
                       student.stats.attendance_rate >= 85 ? '#F59E0B' : '#DC2626',
                textAlign: 'right'
              }}>
                {student.stats.attendance_rate}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
