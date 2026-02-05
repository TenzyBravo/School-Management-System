import React, { createContext, useContext, useEffect, useState } from 'react'
import { setTokens, clearTokens, getAccess } from '../lib/auth'
import { scheduleRefreshFromAccess } from '../lib/api'

type AuthContextType = {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getAccess())

  useEffect(() => {
    const onTokensChanged = () => {
      setIsAuthenticated(!!getAccess())
      scheduleRefreshFromAccess()
    }
    window.addEventListener('tokensChanged', onTokensChanged)
    return () => window.removeEventListener('tokensChanged', onTokensChanged)
  }, [])

  async function login(email: string, password: string) {
    try {
      const res = await fetch('/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) return false
      const data = await res.json()
      if (data.access) {
        setTokens(data.access, data.refresh)
        setIsAuthenticated(true)
        scheduleRefreshFromAccess()
        return true
      }
      return false
    } catch (e) {
      return false
    }
  }

  function logout() {
    clearTokens()
    setIsAuthenticated(false)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
