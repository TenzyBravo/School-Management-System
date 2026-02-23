import React, { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'

interface Assessment {
  id: string
  name: string
  assessment_type: string
  subject: string
  subject_name: string
  grade: string
  grade_name: string
  term: string
  term_name: string
  max_marks: number
  weight: number
  date_conducted: string
  description: string
  marks_count: number
}

interface Subject {
  id: string
  name: string
}

interface Grade {
  id: string
  name: string
}

interface Term {
  id: string
  name: string
}

export default function AssessmentsManager() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    assessment_type: 'TEST',
    subject: '',
    grade: '',
    term: '',
    max_marks: 100,
    weight: 1.0,
    date_conducted: new Date().toISOString().split('T')[0],
    description: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [assessmentsRes, subjectsRes, gradesRes, termsRes] = await Promise.all([
        apiFetch('/api/v1/assessments/'),
        apiFetch('/api/v1/subjects/'),
        apiFetch('/api/v1/grades/'),
        apiFetch('/api/v1/terms/')
      ])

      const [assessmentsData, subjectsData, gradesData, termsData] = await Promise.all([
        assessmentsRes.json(),
        subjectsRes.json(),
        gradesRes.json(),
        termsRes.json()
      ])

      setAssessments(assessmentsData.results || assessmentsData)
      setSubjects(subjectsData.results || subjectsData)
      setGrades(gradesData.results || gradesData)
      setTerms(termsData.results || termsData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingAssessment
        ? `/api/v1/assessments/${editingAssessment.id}/`
        : '/api/v1/assessments/'

      const res = await apiFetch(url, {
        method: editingAssessment ? 'PUT' : 'POST',
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        await loadData()
        setShowForm(false)
        setEditingAssessment(null)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to save assessment:', error)
      alert('Failed to save assessment')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      assessment_type: 'TEST',
      subject: '',
      grade: '',
      term: '',
      max_marks: 100,
      weight: 1.0,
      date_conducted: new Date().toISOString().split('T')[0],
      description: ''
    })
  }

  function handleEdit(assessment: Assessment) {
    setEditingAssessment(assessment)
    setFormData({
      name: assessment.name,
      assessment_type: assessment.assessment_type,
      subject: assessment.subject,
      grade: assessment.grade,
      term: assessment.term,
      max_marks: assessment.max_marks,
      weight: assessment.weight,
      date_conducted: assessment.date_conducted,
      description: assessment.description
    })
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this assessment?')) return

    try {
      const res = await apiFetch(`/api/v1/assessments/${id}/`, {
        method: 'DELETE'
      })

      if (res.ok) {
        await loadData()
      }
    } catch (error) {
      console.error('Failed to delete assessment:', error)
      alert('Failed to delete assessment')
    }
  }

  if (loading && assessments.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Loading...</div>
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
          Assessments ({assessments.length})
        </h3>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingAssessment(null)
            resetForm()
          }}
          style={{
            background: '#4F46E5',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {showForm ? 'Cancel' : '+ New Assessment'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: '#F9FAFB',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', marginTop: 0, marginBottom: '16px' }}>
            {editingAssessment ? 'Edit Assessment' : 'New Assessment'}
          </h4>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Assessment Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Assessment Type *
                </label>
                <select
                  value={formData.assessment_type}
                  onChange={(e) => setFormData({ ...formData, assessment_type: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="TEST">Test</option>
                  <option value="QUIZ">Quiz</option>
                  <option value="EXAM">Exam</option>
                  <option value="ASSIGNMENT">Assignment</option>
                  <option value="PROJECT">Project</option>
                  <option value="PRACTICAL">Practical</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Subject *
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Grade *
                </label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select Grade</option>
                  {grades.map(grade => (
                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Term *
                </label>
                <select
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select Term</option>
                  {terms.map(term => (
                    <option key={term.id} value={term.id}>{term.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Date Conducted *
                </label>
                <input
                  type="date"
                  value={formData.date_conducted}
                  onChange={(e) => setFormData({ ...formData, date_conducted: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Max Marks *
                </label>
                <input
                  type="number"
                  value={formData.max_marks}
                  onChange={(e) => setFormData({ ...formData, max_marks: parseFloat(e.target.value) })}
                  required
                  min="1"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Weight
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                  min="0.1"
                  step="0.1"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: '#4F46E5',
                  color: 'white',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {loading ? 'Saving...' : (editingAssessment ? 'Update Assessment' : 'Create Assessment')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingAssessment(null)
                  resetForm()
                }}
                style={{
                  background: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  padding: '10px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assessments List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {assessments.map(assessment => (
          <div
            key={assessment.id}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
                    {assessment.name}
                  </h4>
                  <span style={{
                    background: '#EEF2FF',
                    color: '#4F46E5',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {assessment.assessment_type}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>Subject: </span>
                    <span style={{ fontSize: '14px', color: '#1F2937', fontWeight: '500' }}>{assessment.subject_name}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>Grade: </span>
                    <span style={{ fontSize: '14px', color: '#1F2937', fontWeight: '500' }}>{assessment.grade_name}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>Term: </span>
                    <span style={{ fontSize: '14px', color: '#1F2937', fontWeight: '500' }}>{assessment.term_name}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>Date: </span>
                    <span style={{ fontSize: '14px', color: '#1F2937', fontWeight: '500' }}>{assessment.date_conducted}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>Max Marks: </span>
                    <span style={{ fontSize: '14px', color: '#1F2937', fontWeight: '500' }}>{assessment.max_marks}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>Marks Entered: </span>
                    <span style={{ fontSize: '14px', color: '#1F2937', fontWeight: '500' }}>{assessment.marks_count}</span>
                  </div>
                </div>

                {assessment.description && (
                  <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '12px', marginBottom: 0 }}>
                    {assessment.description}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleEdit(assessment)}
                  style={{
                    background: '#F3F4F6',
                    color: '#374151',
                    border: '1px solid #D1D5DB',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(assessment.id)}
                  style={{
                    background: '#FEE2E2',
                    color: '#DC2626',
                    border: '1px solid #FCA5A5',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {assessments.length === 0 && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6B7280',
            background: '#F9FAFB',
            borderRadius: '8px',
            border: '1px dashed #D1D5DB'
          }}>
            No assessments created yet. Click "+ New Assessment" to get started.
          </div>
        )}
      </div>
    </div>
  )
}
