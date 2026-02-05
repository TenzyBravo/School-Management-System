import React, { useState } from 'react'

import { setTokens } from '../lib/auth'

import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    login(email, password)
      .then((ok) => {
        if (!ok) setError('Invalid credentials')
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 420 }}>
      <div>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div style={{ marginTop: 8 }}>
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      <div style={{ marginTop: 12 }}>
        <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </div>
    </form>
  )
}
