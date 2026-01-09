export function getAccess(): string | null {
  return localStorage.getItem('access')
}

export function getRefresh(): string | null {
  return localStorage.getItem('refresh')
}

export function setTokens(access: string, refresh?: string) {
  localStorage.setItem('access', access)
  if (refresh) localStorage.setItem('refresh', refresh)
}

export function setAccess(access: string) {
  localStorage.setItem('access', access)
}

export function clearTokens() {
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
}

export function isAuthenticated(): boolean {
  return !!getAccess()
}
