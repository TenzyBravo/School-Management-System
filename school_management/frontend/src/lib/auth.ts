export function getAccess(): string | null {
  return localStorage.getItem('access')
}

export function getRefresh(): string | null {
  return localStorage.getItem('refresh')
}

export function setTokens(access: string, refresh?: string) {
  localStorage.setItem('access', access)
  if (refresh) localStorage.setItem('refresh', refresh)
  // notify listeners (api wrapper) to schedule proactive refresh
  try {
    window.dispatchEvent(new CustomEvent('tokensChanged'))
  } catch (e) {
    // noop
  }
}

export function setAccess(access: string) {
  localStorage.setItem('access', access)
  try {
    window.dispatchEvent(new CustomEvent('tokensChanged'))
  } catch (e) {}
}

export function clearTokens() {
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
  try {
    window.dispatchEvent(new CustomEvent('tokensChanged'))
  } catch (e) {}
}

export function isAuthenticated(): boolean {
  return !!getAccess()
}
