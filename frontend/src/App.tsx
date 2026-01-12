import React from 'react'
import SchoolsList from './components/SchoolsList'
import Login from './components/Login'
import StudentsPage from './components/StudentsPage'
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
          <button onClick={() => setSelectedSchool(null)}>← Back to schools</button>
          <button style={{ marginLeft: 8 }} onClick={logout}>Logout</button>
          <StudentsPage schoolId={selectedSchool} />
        </div>
      ) : (
        <div>
          <button onClick={logout}>Logout</button>
          <SchoolsList onSelectSchool={(id:string)=>setSelectedSchool(id)} />
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
