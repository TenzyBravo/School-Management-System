import React, { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'

interface Assessment {
  id: string
  name: string
  subject_name: string
  grade_name: string
  max_marks: number
}

interface Student {
  id: string
  first_name: string
  last_name: string
  admission_number: string
}

interface Mark {
  student_id: string
  marks_obtained: number
  remarks: string
}

export default function MarksEntry() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedAssessment, setSelectedAssessment] = useState<string>('')
  const [marks, setMarks] = useState<Record<string, Mark>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAssessments()
  }, [])

  useEffect(() => {
    if (selectedAssessment) {
      loadStudentsAndMarks()
    }
  }, [selectedAssessment])

  async function loadAssessments() {
    try {
      const res = await apiFetch('/api/v1/assessments/')
      const data = await res.json()
      setAssessments(data.results || data)
    } catch (error) {
      console.error('Failed to load assessments:', error)
    }
  }

  async function loadStudentsAndMarks() {
    setLoading(true)
    try {
      const assessment = assessments.find(a => a.id === selectedAssessment)
      if (!assessment) return

      // Load students for this grade
      const studentsRes = await apiFetch(`/api/v1/students/`)
      const studentsData = await studentsRes.json()
      setStudents(studentsData.results || studentsData)

      // Load existing marks
      const marksRes = await apiFetch(`/api/v1/marks/?assessment=${selectedAssessment}`)
      const marksData = await marksRes.json()
      const existingMarks = marksData.results || marksData

      // Initialize marks state
      const marksState: Record<string, Mark> = {}
      existingMarks.forEach((mark: any) => {
        marksState[mark.student] = {
          student_id: mark.student,
          marks_obtained: mark.marks_obtained,
          remarks: mark.remarks || ''
        }
      })
      setMarks(marksState)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  function updateMark(studentId: string, field: 'marks_obtained' | 'remarks', value: any) {
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        student_id: studentId,
        [field]: value,
        remarks: prev[studentId]?.remarks || ''
      }
    }))
  }

  async function handleSave() {
    if (!selectedAssessment) return

    setSaving(true)
    try {
      const marksArray = Object.values(marks).filter(m => m.marks_obtained !== undefined)

      const res = await apiFetch('/api/v1/marks/bulk_create/', {
        method: 'POST',
        body: JSON.stringify({
          assessment: selectedAssessment,
          marks: marksArray
        })
      })

      if (res.ok) {
        alert('Marks saved successfully!')
        await loadStudentsAndMarks()
      }
    } catch (error) {
      console.error('Failed to save marks:', error)
      alert('Failed to save marks')
    } finally {
      setSaving(false)
    }
  }

  const assessment = assessments.find(a => a.id === selectedAssessment)

  return (
    <div>
      {/* Assessment Selector */}
      <div style={{ marginBottom: '24px', maxWidth: '400px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Select Assessment
        </label>
        <select
          value={selectedAssessment}
          onChange={(e) => setSelectedAssessment(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        >
          <option value="">Choose an assessment...</option>
          {assessments.map(assessment => (
            <option key={assessment.id} value={assessment.id}>
              {assessment.name} - {assessment.subject_name} ({assessment.grade_name})
            </option>
          ))}
        </select>
      </div>

      {/* Assessment Info */}
      {assessment && (
        <div style={{
          background: '#EEF2FF',
          border: '1px solid #C7D2FE',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#4F46E5', margin: '0 0 8px 0' }}>
            {assessment.name}
          </h4>
          <div style={{ fontSize: '14px', color: '#6366F1' }}>
            Subject: {assessment.subject_name} | Grade: {assessment.grade_name} | Max Marks: {assessment.max_marks}
          </div>
        </div>
      )}

      {/* Marks Entry Table */}
      {selectedAssessment && !loading && (
        <div>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
              Enter Marks for {students.length} Students
            </h4>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: '#10B981',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {saving ? 'Saving...' : '💾 Save All Marks'}
            </button>
          </div>

          <div style={{
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>
                    Admission #
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>
                    Student Name
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB', width: '150px' }}>
                    Marks (out of {assessment?.max_marks})
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6B7280' }}>
                      {student.admission_number}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#1F2937', fontWeight: '500' }}>
                      {student.first_name} {student.last_name}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="number"
                        value={marks[student.id]?.marks_obtained ?? ''}
                        onChange={(e) => updateMark(student.id, 'marks_obtained', parseFloat(e.target.value) || 0)}
                        min="0"
                        max={assessment?.max_marks}
                        step="0.5"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="text"
                        value={marks[student.id]?.remarks ?? ''}
                        onChange={(e) => updateMark(student.id, 'remarks', e.target.value)}
                        placeholder="Optional remarks..."
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
          Loading students...
        </div>
      )}

      {!selectedAssessment && !loading && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#6B7280',
          background: '#F9FAFB',
          borderRadius: '8px',
          border: '1px dashed #D1D5DB'
        }}>
          Please select an assessment to enter marks
        </div>
      )}
    </div>
  )
}
