import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

type Grade = {
  id: string
  name: string
  streams: { id: string; name: string; class_name: string }[]
}

type StudentStat = {
  student_id: string
  student_name: string
  identifier: string
  total: number
  present: number
  absent: number
  late: number
  excused: number
  rate: number
  atRisk: boolean
}

export default function AttendanceDashboard() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [selectedGradeId, setSelectedGradeId] = useState('')
  const [selectedStreamId, setSelectedStreamId] = useState('')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })
  const [stats, setStats] = useState<StudentStat[]>([])
  const [loading, setLoading] = useState(false)

  // Load grades on mount
  useEffect(() => {
    apiFetch('/api/v1/grades/class-list/')
      .then(r => r.json())
      .then(data => setGrades(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load grades:', err))
  }, [])

  const selectedGrade = grades.find(g => g.id === selectedGradeId)
  const streams = selectedGrade?.streams ?? []

  useEffect(() => {
    loadStats()
  }, [selectedGradeId, selectedStreamId, dateRange])

  async function loadStats() {
    setLoading(true)
    try {
      // Fetch students
      let studentUrl = '/api/v1/students/'
      if (selectedGradeId) {
        studentUrl = selectedStreamId
          ? `/api/v1/grades/${selectedGradeId}/students/?stream=${selectedStreamId}`
          : `/api/v1/grades/${selectedGradeId}/students/`
      }
      const studentsRes = await apiFetch(studentUrl)
      const studentsData = await studentsRes.json()
      const studentList: any[] = studentsData.results ?? studentsData

      // Fetch attendance records
      let attUrl = `/api/v1/attendance/?date_after=${dateRange.start}&date_before=${dateRange.end}`
      if (selectedGradeId) attUrl += `&grade=${selectedGradeId}`
      if (selectedStreamId) attUrl += `&stream=${selectedStreamId}`
      const attRes = await apiFetch(attUrl)
      const attData = await attRes.json()
      const attList: any[] = attData.results ?? attData

      // Group attendance by student
      const attByStudent: Record<string, any[]> = {}
      attList.forEach((r: any) => {
        if (!attByStudent[r.student]) attByStudent[r.student] = []
        attByStudent[r.student].push(r)
      })

      const computed: StudentStat[] = studentList.map((s: any) => {
        const records = attByStudent[s.id] ?? []
        const present = records.filter((r: any) => r.status === 'P').length
        const absent = records.filter((r: any) => r.status === 'A').length
        const late = records.filter((r: any) => r.status === 'L').length
        const excused = records.filter((r: any) => r.status === 'E').length
        const total = records.length
        const rate = total > 0 ? Math.round(((present + late) / total) * 1000) / 10 : 0
        const atRisk = rate < 85 || absent > 5
        return {
          student_id: s.id,
          student_name: `${s.first_name} ${s.last_name}`,
          identifier: s.child_id || s.admission_number || '',
          total, present, absent, late, excused, rate, atRisk,
        }
      })

      computed.sort((a, b) => {
        if (a.atRisk && !b.atRisk) return -1
        if (!a.atRisk && b.atRisk) return 1
        return a.rate - b.rate
      })

      setStats(computed)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const atRiskCount = stats.filter(s => s.atRisk).length
  const avgRate = stats.length > 0
    ? Math.round((stats.reduce((sum, s) => sum + s.rate, 0) / stats.length) * 10) / 10
    : 0

  return (
    <div>
      {/* Filters */}
      <div style={{
        background: '#F9FAFB', padding: '20px', borderRadius: '12px',
        marginBottom: '24px', border: '1px solid #E5E7EB',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px',
        alignItems: 'end',
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            Grade
          </label>
          <select
            value={selectedGradeId}
            onChange={e => { setSelectedGradeId(e.target.value); setSelectedStreamId('') }}
            style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px' }}
          >
            <option value="">All Grades</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            Stream
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
            <option value="">All Streams</option>
            {streams.map(s => <option key={s.id} value={s.id}>{s.class_name}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            From
          </label>
          <input
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
            style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            To
          </label>
          <input
            type="date"
            value={dateRange.end}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
            style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={loadStats}
            style={{
              width: '100%', padding: '10px 20px',
              background: '#4F46E5', color: 'white',
              border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontSize: '14px', fontWeight: '500',
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Loading statistics...</div>}

      {!loading && (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <div style={{ padding: '20px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px' }}>
              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>Students</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#1F2937' }}>{stats.length}</div>
            </div>
            <div style={{ padding: '20px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px' }}>
              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>Avg Attendance</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#059669' }}>{avgRate}%</div>
            </div>
            <div style={{
              padding: '20px',
              background: atRiskCount > 0 ? '#FEF2F2' : 'white',
              border: `1px solid ${atRiskCount > 0 ? '#FCA5A5' : '#E5E7EB'}`,
              borderRadius: '12px',
            }}>
              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>⚠️ At-Risk</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#DC2626' }}>{atRiskCount}</div>
              <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>{'<'}85% or {'>'} 5 absences</div>
            </div>
          </div>

          {/* At-risk alerts */}
          {atRiskCount > 0 && (
            <div style={{
              background: '#FEF2F2', border: '2px solid #FCA5A5',
              borderRadius: '12px', padding: '20px', marginBottom: '24px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#DC2626', margin: '0 0 12px' }}>
                ⚠️ Chronic Absence Alerts
              </h3>
              <div style={{ display: 'grid', gap: '8px' }}>
                {stats.filter(s => s.atRisk).slice(0, 10).map(s => (
                  <div key={s.student_id} style={{
                    padding: '12px 16px', background: 'white', borderRadius: '8px',
                    border: '1px solid #FCA5A5', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937' }}>{s.student_name}</div>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                        {s.identifier} • {s.absent} absences in {s.total} days
                      </div>
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: s.rate < 75 ? '#DC2626' : '#F59E0B' }}>
                      {s.rate}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full list */}
          <h3 style={{ fontSize: '17px', fontWeight: '600', color: '#1F2937', marginBottom: '14px' }}>
            Attendance Report
            {selectedGrade && ` — ${selectedGrade.name}`}
            {selectedStreamId && streams.find(s => s.id === selectedStreamId) && ` ${streams.find(s => s.id === selectedStreamId)!.name}`}
          </h3>
          {stats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280', border: '1px dashed #D1D5DB', borderRadius: '12px' }}>
              No data for the selected period
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {stats.map(s => (
                <div key={s.student_id} style={{
                  padding: '14px 16px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  background: s.atRisk ? '#FEF2F2' : 'white',
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 80px',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937' }}>
                      {s.student_name}
                      {s.atRisk && (
                        <span style={{ marginLeft: '8px', fontSize: '11px', background: '#FEE2E2', color: '#DC2626', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' }}>
                          At Risk
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>{s.identifier}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                    <span title="Present" style={{ color: '#059669' }}>✓ {s.present}</span>
                    <span title="Absent" style={{ color: '#DC2626' }}>✗ {s.absent}</span>
                    <span title="Late" style={{ color: '#D97706' }}>⏰ {s.late}</span>
                    <span title="Excused" style={{ color: '#7C3AED' }}>E {s.excused}</span>
                  </div>
                  <div style={{
                    fontSize: '20px', fontWeight: '700', textAlign: 'right',
                    color: s.rate >= 95 ? '#059669' : s.rate >= 85 ? '#F59E0B' : '#DC2626',
                  }}>
                    {s.rate}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
