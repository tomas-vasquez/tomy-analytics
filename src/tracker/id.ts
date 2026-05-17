function generateId(): string {
  if (crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export function getVisitorId(): string {
  const match = document.cookie.match(/(^| )_analytics_id=([^;]+)/)
  if (match) return decodeURIComponent(match[2])

  const id = generateId()
  const expires = new Date(Date.now() + 365 * 864e5).toUTCString()
  document.cookie = `_analytics_id=${encodeURIComponent(id)};expires=${expires};path=/;SameSite=Lax;Secure`
  return id
}

export function getSessionId(): string {
  let sid = sessionStorage.getItem('_analytics_session')
  if (!sid) {
    sid = generateId()
    sessionStorage.setItem('_analytics_session', sid)
  }
  return sid
}
