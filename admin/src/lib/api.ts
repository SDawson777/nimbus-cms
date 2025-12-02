export const NIMBUS_API_URL = import.meta.env.VITE_NIMBUS_API_URL as string | undefined

export const api = {
  async get(path: string) {
    const base = NIMBUS_API_URL || ''
    const res = await fetch(base + path, {credentials: 'include'})
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
    return res.json()
  },
  async tenantGet(tenantId: string | undefined, path: string) {
    const q = tenantId
      ? `${path}${path.includes('?') ? '&' : '?'}tenant=${encodeURIComponent(tenantId)}`
      : path
    return this.get(q)
  },
}
