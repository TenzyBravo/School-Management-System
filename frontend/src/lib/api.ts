import { getAccess, getRefresh, setAccess, clearTokens } from './auth'

async function refreshToken(): Promise<boolean> {
  const refresh = getRefresh()
  if (!refresh) return false

  try {
    const res = await fetch('/api/v1/auth/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh })
    })
    if (!res.ok) return false
    const data = await res.json()
    if (data.access) {
      setAccess(data.access)
      return true
    }
    return false
  } catch (e) {
    return false
  }
}

export async function apiFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  let access = getAccess()

  const makeHeaders = (h?: HeadersInit) => {
    const headers = new Headers(h || {})
    headers.set('Content-Type', 'application/json')
    if (access) headers.set('Authorization', `Bearer ${access}`)
    return headers
  }

  let response = await fetch(input, { ...init, headers: makeHeaders(init.headers) })

  if (response.status === 401) {
    // try refresh once
    const ok = await refreshToken()
    if (!ok) {
      clearTokens()
      // force reload to show login
      window.location.href = '/'
      throw new Error('unauthenticated')
    }
    access = getAccess()
    response = await fetch(input, { ...init, headers: makeHeaders(init.headers) })
  }

  return response
}
