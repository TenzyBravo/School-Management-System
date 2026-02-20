import React, { createContext, useContext, useEffect, useState } from 'react'
import { setTokens, clearTokens, getAccess, getRefresh } from '../lib/auth'
import { scheduleRefreshFromAccess } from '../lib/api'

const API_BASE_URL = 'https://school-management-api-tkhv.onrender.com'

type AuthContextType = {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function parseJwt(token: string | null) {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = JSON.parse(atob(parts[1]))
    return payload
  } catch (e) {
    return null
  }
}

function isTokenValid(token: string | null): boolean {
  const payload = parseJwt(token)
  if (!payload || !payload.exp) return false
  const expiryMs = payload.exp * 1000
  // Consider valid if not expired (with 5 second buffer)
  return Date.now() < (expiryMs - 5000)
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // On initial load, check if we have valid tokens
    const access = getAccess()
    const refresh = getRefresh()
    // If access token is valid, we're good
    if (isTokenValid(access)) return true
    // If access is expired but refresh is valid, we might be able to refresh
    if (isTokenValid(refresh)) return true
    // Both tokens are invalid/expired, clear them
    if (access || refresh) {
      clearTokens()
    }
    return false
  })

  useEffect(() => {
    const onTokensChanged = () => {
      const access = getAccess()
      setIsAuthenticated(!!access)
      scheduleRefreshFromAccess()
    }
    window.addEventListener('tokensChanged', onTokensChanged)
    return () => window.removeEventListener('tokensChanged', onTokensChanged)
  }, [])

  async function login(email: string, password: string) {
    try {
      // Increase timeout for sleeping backend on Render (can take 30-50 seconds to wake)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

      const res = await fetch(`${API_BASE_URL}/api/v1/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (!res.ok) {
        console.error('Login failed:', res.status, res.statusText)
        return false
      }
      const data = await res.json()
      if (data.access) {
        setTokens(data.access, data.refresh)
        setIsAuthenticated(true)
        scheduleRefreshFromAccess()
        return true
      }
      return false
    } catch (e) {
      console.error('Login error:', e)
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
