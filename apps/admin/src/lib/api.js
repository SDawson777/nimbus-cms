import {safeJson} from './safeJson'
import {getCsrfToken} from './csrf'

// Normalize API base so preview envs that include trailing API segments don't double-prefix routes.
const RAW_API_BASE = (import.meta.env.VITE_NIMBUS_API_URL || '').replace(/\/$/, '')
const API_BASE = RAW_API_BASE.replace(/\/api(?:\/v1)?\/nimbus$/i, '')
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function buildUrl(path = '') {
  if (!path) return API_BASE || '/'
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${normalized}`
}

export async function apiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const headers = new Headers(options.headers || {})

  if (!SAFE_METHODS.has(method)) {
    const csrf = getCsrfToken()
    if (csrf && !headers.has('X-CSRF-Token')) headers.set('X-CSRF-Token', csrf)
    if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }
  }

  if (!headers.has('Accept')) headers.set('Accept', 'application/json')

  const response = await fetch(buildUrl(path), {
    ...options,
    method,
    headers,
    credentials: options.credentials || 'include',
  })

  return response
}

export async function apiJson(path, options = {}, fallback = null) {
  const res = await apiFetch(path, options)
  const data = await safeJson(res, fallback)
  return {ok: res.ok, status: res.status, data, response: res}
}

export function apiBaseUrl() {
  return API_BASE || ''
}
