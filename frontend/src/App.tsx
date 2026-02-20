import React from 'react'
import SchoolsList from './components/SchoolsList'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import StudentsPage from './components/StudentsPage'
import AcademicsManager from './components/AcademicsManager'
import AttendanceModule from './components/AttendanceModule'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useState } from 'react'

function AppInner() {
  const { isAuthenticated, logout } = useAuth()
  const [currentSection, setCurrentSection] = useState<string>('home')
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null)

  if (!isAuthenticated) {
    return <Login />
  }

  if (currentSection === 'home') {
    return <Dashboard onNavigate={setCurrentSection} />
  }

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, Arial, sans-serif', minHeight: '100vh', background: '#F9FAFB' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          padding: '20px 0',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentSection('home')}
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
              ← Home
            </button>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#1F2937' }}>
              {currentSection === 'schools' && 'Schools'}
              {currentSection === 'students' && 'Students'}
              {currentSection === 'academics' && 'Academics'}
              {currentSection === 'reports' && 'Reports'}
            </h1>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'white',
              color: '#6B7280',
              border: '1px solid #E5E7EB',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Logout
          </button>
        </div>

        {/* Content */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          {currentSection === 'schools' && (
            selectedSchool ? (
              <div>
                <button onClick={() => setSelectedSchool(null)} style={{
                  background: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '20px'
                }}>
                  ← Back to schools
                </button>
                <StudentsPage schoolId={selectedSchool} />
              </div>
            ) : (
              <SchoolsList onSelectSchool={(id: string) => setSelectedSchool(id)} />
            )
          )}
          {currentSection === 'students' && <AttendanceModule />}
          {currentSection === 'academics' && <AcademicsManager />}
          {currentSection === 'reports' && <div>Reports section coming soon...</div>}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
