import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

type Term = {
  id: string
  name: string
  start_date: string
  end_date: string
  is_current: boolean
}

type AcademicYear = {
  id: string
  name: string
  start_date: string
  end_date: string
  is_current: boolean
  terms: Term[]
}

export default function AcademicYearsManager() {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_current: false
  })

  useEffect(() => {
    loadYears()
  }, [])

  async function loadYears() {
    try {
      const res = await apiFetch('/api/v1/academic-years/')
      const data = await res.json()
      setYears(data.results || data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await apiFetch('/api/v1/academic-years/', {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({ name: '', start_date: '', end_date: '', is_current: false })
        loadYears()
      }
    } catch (err) {
      console.error(err)
      alert('Failed to create academic year')
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
          Academic Years
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
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
          {showForm ? 'Cancel' : '+ New Academic Year'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: '#F9FAFB',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Name (e.g., 2024-2025)
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
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '28px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_current}
                  onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                />
                <span style={{ fontSize: '14px', color: '#374151' }}>Set as current year</span>
              </label>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
          <button
            type="submit"
            style={{
              marginTop: '16px',
              background: '#059669',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Create Academic Year
          </button>
        </form>
      )}

      {/* Years List */}
      {years.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
          No academic years found. Create one to get started.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {years.map((year) => (
            <div
              key={year.id}
              style={{
                padding: '20px',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                background: year.is_current ? '#EEF2FF' : 'white'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>
                    {year.name}
                    {year.is_current && (
                      <span style={{
                        marginLeft: '12px',
                        fontSize: '12px',
                        background: '#4F46E5',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px'
                      }}>
                        Current
                      </span>
                    )}
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6B7280' }}>
                    {new Date(year.start_date).toLocaleDateString()} - {new Date(year.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Terms */}
              {year.terms && year.terms.length > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '12px', textTransform: 'uppercase' }}>
                    Terms
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {year.terms.map((term) => (
                      <div
                        key={term.id}
                        style={{
                          padding: '12px',
                          background: term.is_current ? '#FEF3C7' : '#F9FAFB',
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB'
                        }}
                      >
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937' }}>
                          {term.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                          {new Date(term.start_date).toLocaleDateString()} - {new Date(term.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
