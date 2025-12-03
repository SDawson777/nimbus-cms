import {safeJson} from './safeJson'
import {getCsrfToken} from './csrf'

// Normalize API base so preview envs that include trailing API segments don't double-prefix routes.
// If a full path like https://host/api/v1/nimbus is provided, we collapse to the origin to avoid
// generating /api/v1/nimbus/api/... URLs that break CORS and auth handshakes.
const RAW_API_BASE = (import.meta.env.VITE_NIMBUS_API_URL || '').trim()

function normalizeApiBase(raw) {
  if (!raw) return ''
  try {
    const url = new URL(raw)
    const pathname = url.pathname.replace(/\/$/, '')
    // If the path already starts with /api, prefer the origin to avoid double prefixes; otherwise keep path.
    const safePath = pathname.startsWith('/api') ? '' : pathname
    return `${url.origin}${safePath}`
  } catch (err) {
    // Fallback: strip common API suffixes when the URL constructor fails (unlikely)
    return raw.replace(/\/$/, '').replace(/\/api(?:\/v\d+)?(?:\/nimbus)?$/i, '')
  }
}

const API_BASE = normalizeApiBase(RAW_API_BASE)
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
