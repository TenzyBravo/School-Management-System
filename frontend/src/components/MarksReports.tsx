import React, { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'

interface Student {
  id: string
  first_name: string
  last_name: string
  admission_number: string
}

interface Performance {
  student_id: string
  student_name: string
  subject_id: string
  subject_name: string
  average_marks: number
  average_percentage: number
  total_assessments: number
  grade_letter: string
}

export default function MarksReports() {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [performance, setPerformance] = useState<Performance[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStudents()
  }, [])

  useEffect(() => {
    if (selectedStudent) {
      loadPerformance()
    }
  }, [selectedStudent])

  async function loadStudents() {
    try {
      const res = await apiFetch('/api/v1/students/')
      const data = await res.json()
      setStudents(data.results || data)
    } catch (error) {
      console.error('Failed to load students:', error)
    }
  }

  async function loadPerformance() {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/v1/marks/student_performance/?student_id=${selectedStudent}`)
      const data = await res.json()
      setPerformance(data)
    } catch (error) {
      console.error('Failed to load performance:', error)
    } finally {
      setLoading(false)
    }
  }

  function getGradeColor(grade: string) {
    switch (grade) {
      case 'A': return { bg: '#DCFCE7', text: '#15803D' }
      case 'B': return { bg: '#DBEAFE', text: '#1E40AF' }
      case 'C': return { bg: '#FEF3C7', text: '#92400E' }
      case 'D': return { bg: '#FED7AA', text: '#9A3412' }
      case 'E': return { bg: '#FEE2E2', text: '#991B1B' }
      case 'F': return { bg: '#FEE2E2', text: '#7F1D1D' }
      default: return { bg: '#F3F4F6', text: '#6B7280' }
    }
  }

  const overallAverage = performance.length > 0
    ? performance.reduce((sum, p) => sum + p.average_percentage, 0) / performance.length
    : 0

  const overallGrade = overallAverage >= 80 ? 'A'
    : overallAverage >= 70 ? 'B'
    : overallAverage >= 60 ? 'C'
    : overallAverage >= 50 ? 'D'
    : overallAverage >= 40 ? 'E'
    : 'F'

  return (
    <div>
      {/* Student Selector */}
      <div style={{ marginBottom: '24px', maxWidth: '400px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Select Student
        </label>
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        >
          <option value="">Choose a student...</option>
          {students.map(student => (
            <option key={student.id} value={student.id}>
              {student.admission_number} - {student.first_name} {student.last_name}
            </option>
          ))}
        </select>
      </div>

      {/* Overall Summary */}
      {selectedStudent && performance.length > 0 && !loading && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginTop: 0, marginBottom: '16px' }}>
            Overall Performance
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>Average Percentage</div>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>{overallAverage.toFixed(1)}%</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>Overall Grade</div>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>{overallGrade}</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>Total Subjects</div>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>{performance.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', opacity: 0.9', marginBottom: '4px' }}>Total Assessments</div>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>
                {performance.reduce((sum, p) => sum + p.total_assessments, 0)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subject-wise Performance */}
      {selectedStudent && performance.length > 0 && !loading && (
        <div>
          <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', marginBottom: '16px' }}>
            Subject-wise Performance
          </h4>

          <div style={{ display: 'grid', gap: '16px' }}>
            {performance.map((perf) => {
              const colors = getGradeColor(perf.grade_letter)
              return (
                <div
                  key={perf.subject_id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '20px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h5 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
                      {perf.subject_name}
                    </h5>
                    <span style={{
                      background: colors.bg,
                      color: colors.text,
                      padding: '6px 16px',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '700'
                    }}>
                      {perf.grade_letter}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Average Marks</div>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>
                        {perf.average_marks.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Average Percentage</div>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>
                        {perf.average_percentage.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Assessments</div>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>
                        {perf.total_assessments}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginTop: '16px' }}>
                    <div style={{
                      background: '#F3F4F6',
                      height: '8px',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        background: perf.average_percentage >= 70 ? '#10B981' : perf.average_percentage >= 50 ? '#F59E0B' : '#EF4444',
                        height: '100%',
                        width: `${Math.min(perf.average_percentage, 100)}%`,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
          Loading performance data...
        </div>
      )}

      {selectedStudent && performance.length === 0 && !loading && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#6B7280',
          background: '#F9FAFB',
          borderRadius: '8px',
          border: '1px dashed #D1D5DB'
        }}>
          No marks found for this student yet.
        </div>
      )}

      {!selectedStudent && !loading && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#6B7280',
          background: '#F9FAFB',
          borderRadius: '8px',
          border: '1px dashed #D1D5DB'
        }}>
          Please select a student to view their performance report
        </div>
      )}
    </div>
  )
}
