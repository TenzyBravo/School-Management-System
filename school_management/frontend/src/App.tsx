import React from 'react'
import SchoolsList from './components/SchoolsList'
import Login from './components/Login'
import SchoolDashboard from './components/SchoolDashboard'
// import StudentsPage from './components/StudentsPage' // Now used in dashboard
import { AuthProvider, useAuth } from './context/AuthContext'
import { useState } from 'react'

function AppInner() {
  const { isAuthenticated, logout } = useAuth()
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null)

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, Arial, sans-serif' }}>
      <h1>School Management - Dev UI</h1>
      {!isAuthenticated ? (
        <Login />
      ) : selectedSchool ? (
        <div>
          <SchoolDashboard schoolId={selectedSchool} onBack={() => setSelectedSchool(null)} />
        </div>
      ) : (
        <div>
          <button onClick={logout}>Logout</button>
          <SchoolsList onSelectSchool={(id: string) => setSelectedSchool(id)} />
        </div>
      )}
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
