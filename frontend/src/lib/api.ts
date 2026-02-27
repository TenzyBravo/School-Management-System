import { getAccess, getRefresh, setAccess, clearTokens } from './auth'

// API base URL - hardcoded for now since env var isn't working
const API_BASE_URL = 'https://school-management-api-tkhv.onrender.com'

let refreshPromise: Promise<boolean> | null = null
let refreshTimeout: number | null = null

function parseJwt(token: string | null) {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = JSON.parse(decodeURIComponent(escape(window.atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))))
    return payload
  } catch (e) {
    return null
  }
}

async function doRefresh(): Promise<boolean> {
  const refresh = getRefresh()
  if (!refresh) return false

  // Check if refresh token is expired before trying
  const payload = parseJwt(refresh)
  if (payload && payload.exp) {
    const expiryMs = payload.exp * 1000
    if (Date.now() >= expiryMs) {
      console.log('Refresh token has expired')
      return false
    }
  }

  try {
    // Increase timeout for sleeping backend on Render (can take 30-50 seconds to wake)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      // If 401, the refresh token is invalid/expired
      if (res.status === 401) {
        console.log('Refresh token rejected by server')
      }
      return false
    }
    const data = await res.json()
    if (data.access) {
      setAccess(data.access)
      // schedule next refresh based on new token
      scheduleRefreshFromAccess()
      return true
    }
    return false
  } catch (e) {
    console.error('Token refresh failed:', e)
    return false
  }
}

async function refreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  refreshPromise = doRefresh()
  try {
    const ok = await refreshPromise
    return ok
  } finally {
    refreshPromise = null
  }
}

function clearScheduledRefresh() {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
    refreshTimeout = null
  }
}

export function scheduleRefreshFromAccess() {
  clearScheduledRefresh()
  const access = getAccess()
  const payload = parseJwt(access)
  if (!payload || !payload.exp) return
  const expiryMs = payload.exp * 1000
  // refresh 60 seconds before expiry
  const refreshAt = expiryMs - 60_000
  const delay = refreshAt - Date.now()
  if (delay <= 0) {
    // token already near expiry - refresh now
    refreshToken().catch(() => {})
    return
  }
  refreshTimeout = window.setTimeout(() => {
    refreshToken().catch(() => {})
  }, delay)
}

// listen for token changes to (re)schedule proactive refresh
window.addEventListener('tokensChanged', () => scheduleRefreshFromAccess())
// schedule on load if token exists
scheduleRefreshFromAccess()

export async function apiFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  let access = getAccess()

  const makeHeaders = (h?: HeadersInit) => {
    const headers = new Headers(h || {})
    // Don't set Content-Type for FormData — browser must set it with the multipart boundary
    if (!(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }
    if (access) headers.set('Authorization', `Bearer ${access}`)
    const activeSchoolId = localStorage.getItem('activeSchoolId')
    if (activeSchoolId) headers.set('X-Active-School', activeSchoolId)
    return headers
  }

  // Prepend API_BASE_URL if input is a string starting with '/'
  const url = typeof input === 'string' && input.startsWith('/') ? `${API_BASE_URL}${input}` : input
  let response = await fetch(url, { ...init, headers: makeHeaders(init.headers) })

  if (response.status === 401) {
    // try refresh once (queued)
    const ok = await refreshToken()
    if (!ok) {
      clearTokens()
      // force reload to show login
      window.location.href = '/'
      throw new Error('unauthenticated')
    }
    access = getAccess()
    response = await fetch(url, { ...init, headers: makeHeaders(init.headers) })
  }

  return response
}
