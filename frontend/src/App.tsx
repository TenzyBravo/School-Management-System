import React, { useState, useEffect } from 'react'
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
import ClassDashboard from './components/ClassDashboard'
import ClassView from './components/ClassView'
import SchoolClassesView from './components/SchoolClassesView'
import { AuthProvider, useAuth } from './context/AuthContext'
import { apiFetch } from './lib/api'

interface UserProfile {
  first_name: string
  last_name: string
  profile_picture_url: string | null
}

interface ClassCard {
  grade: string
  grade_name: string
  grade_level: number
  stream: string | null
  stream_name: string | null
  student_count: number
  subjects: { id: string; name: string; code: string; assignmentId: string }[]
  is_class_teacher: boolean
}

// Roles that see the class-centric home screen
const CLASS_ROLES = ['TEACHER', 'HEADTEACHER', 'DEPUTY_HEAD', 'SOCIAL_OFFICER']
// Roles that see the full admin management dashboard
const ADMIN_ROLES = ['SUPER_ADMIN', 'ACADEMIC_MANAGER', 'HEAD_OF_OPS', 'DIRECTOR']

function AppInner() {
  const { isAuthenticated, userRole, logout } = useAuth()
  const [currentSection, setCurrentSection] = useState<string>('home')
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [activeClass, setActiveClass] = useState<ClassCard | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      apiFetch('/api/v1/profile/')
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setUserProfile(data) })
        .catch(() => {})
    }
  }, [isAuthenticated])

  // Refresh avatar after profile save
  function refreshProfile() {
    apiFetch('/api/v1/profile/')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUserProfile(data) })
      .catch(() => {})
  }

  if (!isAuthenticated) return <Login />

  const isClassUser = !userRole || CLASS_ROLES.includes(userRole)
  const isAdminUser = userRole && ADMIN_ROLES.includes(userRole)

  // ── HOME SCREEN ──
  if (currentSection === 'home') {
    if (isAdminUser) {
      return <Dashboard onNavigate={setCurrentSection} />
    }
    // Class-based home for teachers / school admin staff
    return (
      <PageShell
        title={activeClass
          ? (activeClass.stream_name ? `${activeClass.grade_name} ${activeClass.stream_name}` : activeClass.grade_name)
          : 'My Classes'
        }
        userProfile={userProfile}
        onNavigate={setCurrentSection}
        onProfileClick={() => setCurrentSection('profile')}
        onLogout={logout}
        showHome={false}
      >
        {activeClass ? (
          <ClassView
            classCard={activeClass}
            onBack={() => setActiveClass(null)}
            onNavigate={setCurrentSection}
          />
        ) : (
          <ClassDashboard
            onNavigate={setCurrentSection}
            onOpenClass={setActiveClass}
          />
        )}
      </PageShell>
    )
  }

  // ── INNER SECTIONS ──
  const sectionTitles: Record<string, string> = {
    schools: 'Schools',
    studentsmanager: 'Students Management',
    faculty: 'Faculty & Staff',
    students: 'Attendance',
    academics: 'Academics',
    classes: 'School Classes',
    reports: 'Marks & Reports',
    profile: 'My Profile',
  }

  return (
    <PageShell
      title={sectionTitles[currentSection] || currentSection}
      userProfile={userProfile}
      onNavigate={setCurrentSection}
      onProfileClick={() => setCurrentSection('profile')}
      onLogout={logout}
      showHome
      onHome={() => { setCurrentSection('home'); setActiveClass(null) }}
      noCard={currentSection === 'profile'}
    >
      {currentSection === 'schools' && (
        selectedSchool ? (
          <div>
            <button onClick={() => setSelectedSchool(null)} style={{
              background: '#F3F4F6', border: '1px solid #E5E7EB',
              padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', marginBottom: '20px'
            }}>← Back to schools</button>
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
      {currentSection === 'classes' && <SchoolClassesView onNavigate={setCurrentSection} />}
      {currentSection === 'reports' && <MarksModule />}
      {currentSection === 'profile' && <ProfilePage onSaved={refreshProfile} />}
    </PageShell>
  )
}

// ── Shared page shell (header + content wrapper) ────────────────────────────
interface PageShellProps {
  title: string
  userProfile: UserProfile | null
  onNavigate: (s: string) => void
  onProfileClick: () => void
  onLogout: () => void
  showHome?: boolean
  onHome?: () => void
  noCard?: boolean
  children: React.ReactNode
}

function PageShell({ title, userProfile, onProfileClick, onLogout, showHome, onHome, noCard, children }: PageShellProps) {
  const initials = userProfile
    ? `${userProfile.first_name.charAt(0)}${userProfile.last_name.charAt(0)}`.toUpperCase()
    : '?'

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, Arial, sans-serif', minHeight: '100vh', background: '#F9FAFB' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '32px', padding: '20px 0', borderBottom: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {showHome && (
              <button
                onClick={onHome}
                style={{ background: '#4F46E5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
              >
                ← Home
              </button>
            )}
            <h1 style={{ margin: 0, fontSize: '24px', color: '#1F2937' }}>{title}</h1>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={onProfileClick}
              title="My Profile"
              style={{
                background: 'white', border: '1px solid #E5E7EB', borderRadius: '50%',
                width: '42px', height: '42px', cursor: 'pointer', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0, flexShrink: 0,
              }}
            >
              {userProfile?.profile_picture_url ? (
                <img src={userProfile.profile_picture_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#4F46E5' }}>{initials}</span>
              )}
            </button>
            <button
              onClick={onLogout}
              style={{ background: 'white', color: '#6B7280', border: '1px solid #E5E7EB', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Content */}
        {noCard ? (
          children
        ) : (
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {children}
          </div>
        )}
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
