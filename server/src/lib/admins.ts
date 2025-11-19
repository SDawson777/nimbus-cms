import fs from 'fs'
import path from 'path'

// Admin role and user model used for simple RBAC. This is file-backed now but
// can be swapped for a DB or Sanity-backed source in the future.
export type AdminRole =
  | 'OWNER'
  | 'ORG_ADMIN'
  | 'BRAND_ADMIN'
  | 'STORE_MANAGER'
  | 'EDITOR'
  | 'VIEWER'

export interface AdminUser {
  id: string
  email: string
  passwordHash?: string
  role: AdminRole
  organizationSlug?: string
  brandSlug?: string
  storeSlug?: string
}

export type AdminsConfig = {admins: AdminUser[]}

let cached: AdminsConfig | null = null

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'admins.json')

export function loadAdmins(): AdminsConfig | null {
  if (cached) return cached
  if (!fs.existsSync(CONFIG_PATH)) return null
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8')
    const parsed = JSON.parse(raw) as AdminsConfig
    cached = parsed
    return parsed
  } catch (err) {
    console.error('Failed to read admins config', err)
    return null
  }
}

// Find an admin by optional scope (brand/store/org) and email. Returns the matching
// admin or null. If email is provided we prefer that exact match.
export function findAdmin(brandSlug?: string, storeSlug?: string, email?: string) {
  const cfg = loadAdmins()
  if (!cfg) return null
  // try exact email match first
  if (email) {
    const byEmail = cfg.admins.find((a) => a.email.toLowerCase() === email.toLowerCase())
    if (byEmail) return {admin: byEmail}
  }
  // then try scoped matches
  if (brandSlug || storeSlug) {
    const byScope = cfg.admins.find((a) => {
      if (storeSlug && a.storeSlug && a.storeSlug === storeSlug) return true
      if (brandSlug && a.brandSlug && a.brandSlug === brandSlug) return true
      return false
    })
    if (byScope) return {admin: byScope}
  }
  // fallback to the first admin
  return {admin: cfg.admins[0]}
}

// If no file-based config exists, allow an environment-backed single admin for
// simple deployments. ADMIN_ROLE defaults to OWNER.
export function getEnvAdmin(): AdminUser | null {
  const email = process.env.ADMIN_EMAIL
  const hash = process.env.ADMIN_PASSWORD_HASH
  const rawPassword = process.env.ADMIN_PASSWORD
  if (!email || (!hash && !rawPassword)) return null
  const role = (process.env.ADMIN_ROLE as AdminRole) || 'OWNER'
  return {
    id: 'env-admin',
    email,
    passwordHash: hash,
    role,
  }
}
