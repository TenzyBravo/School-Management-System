import React, { useState } from 'react'

export default function Login({ onLogin }: { onLogin: (access: string, refresh: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    fetch('/api/v1/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.access) {
          onLogin(data.access, data.refresh)
        } else {
          setError('Invalid credentials')
        }
      })
      .catch((err) => setError('Network error'))
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
