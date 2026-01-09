import React from 'react'
import SchoolsList from './components/SchoolsList'
import Login from './components/Login'
import StudentsPage from './components/StudentsPage'
import { useState } from 'react'

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('access'))
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null)

  function handleLogin(access: string, refresh: string) {
    localStorage.setItem('access', access)
    localStorage.setItem('refresh', refresh)
    setToken(access)
  }

  function handleLogout() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    setToken(null)
    setSelectedSchool(null)
  }

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, Arial, sans-serif' }}>
      <h1>School Management - Dev UI</h1>
      {!token ? (
        <Login onLogin={handleLogin} />
      ) : selectedSchool ? (
        <div>
          <button onClick={() => setSelectedSchool(null)}>← Back to schools</button>
          <button style={{ marginLeft: 8 }} onClick={handleLogout}>Logout</button>
          <StudentsPage schoolId={selectedSchool} />
        </div>
      ) : (
        <div>
          <button onClick={handleLogout}>Logout</button>
          <SchoolsList onSelectSchool={(id:string)=>setSelectedSchool(id)} />
        </div>
      )}
    </div>
  )
}
