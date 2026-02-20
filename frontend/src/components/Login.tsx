import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showWakeMessage, setShowWakeMessage] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setShowWakeMessage(false)

    // Show "waking up" message after 3 seconds
    const wakeTimer = setTimeout(() => {
      setShowWakeMessage(true)
    }, 3000)

    login(email, password)
      .then((ok) => {
        clearTimeout(wakeTimer)
        if (!ok) setError('Invalid credentials. Please try again.')
      })
      .catch(() => {
        clearTimeout(wakeTimer)
        setError('Connection error. Please check your internet and try again.')
      })
      .finally(() => {
        setLoading(false)
        setShowWakeMessage(false)
      })
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Inter, Arial, sans-serif'
    }}>
      <form onSubmit={submit} style={{
        maxWidth: 420,
        width: '100%',
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '28px', color: '#1F2937', textAlign: 'center' }}>
          School Management System
        </h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Email
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
            disabled={loading}
          />
        </div>

        {error && (
          <div style={{
            color: '#DC2626',
            background: '#FEE2E2',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {showWakeMessage && (
          <div style={{
            color: '#059669',
            background: '#D1FAE5',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            ⏳ Backend is waking up (this may take 30-50 seconds on free tier)...
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? '#9CA3AF' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
