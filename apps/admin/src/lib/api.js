const API_BASE = import.meta.env.VITE_NIMBUS_API_URL || ''

export function apiGet(path, {tenantId, credentials = 'include'} = {}) {
  const withTenant = tenantId
    ? `${path}${path.includes('?') ? '&' : '?'}tenant=${encodeURIComponent(tenantId)}`
    : path
  const url = `${API_BASE}${withTenant}`
  return fetch(url, {credentials})
}

export async function apiJson(path, options = {}) {
  const res = await apiGet(path, options)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Request failed (${res.status})`)
  }
  return res.json()
}

export function apiPost(path, body, {tenantId, credentials = 'include'} = {}) {
  const withTenant = tenantId
    ? `${path}${path.includes('?') ? '&' : '?'}tenant=${encodeURIComponent(tenantId)}`
    : path
  const url = `${API_BASE}${withTenant}`
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials,
  })
}
