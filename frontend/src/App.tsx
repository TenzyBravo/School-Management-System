import React from 'react'
import SchoolsList from './components/SchoolsList'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import StudentsPage from './components/StudentsPage'
import StudentsManager from './components/StudentsManager'
import UsersManager from './components/UsersManager'
import AcademicsManager from './components/AcademicsManager'
import AttendanceModule from './components/AttendanceModule'
import MarksModule from './components/MarksModule'
import ProfilePage from './components/ProfilePage'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useState, useEffect } from 'react'
import { apiFetch } from './lib/api'

interface UserProfile {
  first_name: string
  last_name: string
  profile_picture_url: string | null
}

function AppInner() {
  const { isAuthenticated, logout } = useAuth()
  const [currentSection, setCurrentSection] = useState<string>('home')
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      apiFetch('/api/v1/profile/').then(r => r.ok ? r.json() : null).then(data => {
        if (data) setUserProfile(data)
      }).catch(() => {})
    }
  }, [isAuthenticated, currentSection === 'profile' ? 'refresh' : 'keep'])

  if (!isAuthenticated) {
    return <Login />
  }

  if (currentSection === 'home') {
    return <Dashboard onNavigate={setCurrentSection} />
  }

  const initials = userProfile
    ? `${userProfile.first_name.charAt(0)}${userProfile.last_name.charAt(0)}`.toUpperCase()
    : '?'

  const sectionTitles: Record<string, string> = {
    schools: 'Schools',
    studentsmanager: 'Students Management',
    faculty: 'Faculty & Staff',
    students: 'Attendance',
    academics: 'Academics',
    reports: 'Marks & Reports',
    profile: 'My Profile',
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
              {sectionTitles[currentSection] || currentSection}
            </h1>
          </div>

          {/* Right side: Profile avatar + Logout */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentSection('profile')}
              title="My Profile"
              style={{
                background: currentSection === 'profile' ? '#EEF2FF' : 'white',
                border: currentSection === 'profile' ? '2px solid #4F46E5' : '1px solid #E5E7EB',
                borderRadius: '50%',
                width: '42px',
                height: '42px',
                cursor: 'pointer',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                flexShrink: 0,
              }}
            >
              {userProfile?.profile_picture_url ? (
                <img
                  src={userProfile.profile_picture_url}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#4F46E5' }}>{initials}</span>
              )}
            </button>
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
        </div>

        {/* Content */}
        <div style={{
          background: currentSection === 'profile' ? 'transparent' : 'white',
          borderRadius: '12px',
          padding: currentSection === 'profile' ? '0' : '32px',
          boxShadow: currentSection === 'profile' ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.1)'
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
          {currentSection === 'studentsmanager' && <StudentsManager />}
          {currentSection === 'faculty' && <UsersManager />}
          {currentSection === 'students' && <AttendanceModule />}
          {currentSection === 'academics' && <AcademicsManager />}
          {currentSection === 'reports' && <MarksModule />}
          {currentSection === 'profile' && (
            <ProfilePage onSaved={() => {
              apiFetch('/api/v1/profile/').then(r => r.ok ? r.json() : null).then(data => {
                if (data) setUserProfile(data)
              }).catch(() => {})
            }} />
          )}
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
