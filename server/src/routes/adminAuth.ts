import {Router} from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import {loadAdmins, findAdmin, getEnvAdmin, AdminUser} from '../lib/admins'
import {requireAdmin} from '../middleware/adminAuth'

const router = Router()
const COOKIE_NAME = 'admin_token'

router.use(cookieParser())

// Basic rate limiter for admin login to mitigate brute-force in-memory.
// For production, replace with Redis-backed store (connect-redis) and per-IP/user throttling.
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 8, // limit each IP to 8 login requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
})

// POST /admin/login
// body: {brand?: string, dispensary?: string, email, password}
router.post('/login', loginLimiter, async (req: any, res) => {
  const {brand, dispensary, email, password} = req.body || {}
  const jwtSecret = process.env.JWT_SECRET || 'dev-secret'

  if (!email || !password) return res.status(400).json({error: 'MISSING_CREDENTIALS'})

  const cfg = loadAdmins()
  // prefer file-backed config
  if (cfg) {
    const found = findAdmin(brand, dispensary, email)
    if (!found || !found.admin) return res.status(401).json({error: 'INVALID_CREDENTIALS'})
    const admin = found.admin as AdminUser
    let valid = false
    if (admin.passwordHash) {
      valid = await bcrypt.compare(password, admin.passwordHash)
    } else {
      valid = false
    }
    if (!valid) return res.status(401).json({error: 'INVALID_CREDENTIALS'})
    const safePayload = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      organizationSlug: admin.organizationSlug,
      brandSlug: admin.brandSlug,
      storeSlug: admin.storeSlug,
    }
    const token = jwt.sign(safePayload, jwtSecret, {expiresIn: '4h'})
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 4 * 60 * 60 * 1000,
      path: '/',
    })
    return res.json({ok: true})
  }

  // fallback to env-based single-admin mode
  const envAdmin = getEnvAdmin()
  if (!envAdmin) return res.status(500).json({error: 'ADMIN_NOT_CONFIGURED'})
  if (email !== envAdmin.email) return res.status(401).json({error: 'INVALID_CREDENTIALS'})
  let valid = false
  if (envAdmin.passwordHash) {
    valid = await bcrypt.compare(password, envAdmin.passwordHash)
  } else if (process.env.ADMIN_PASSWORD) {
    valid = password === process.env.ADMIN_PASSWORD
  }
  if (!valid) return res.status(401).json({error: 'INVALID_CREDENTIALS'})
  const safePayload = {
    id: envAdmin.id,
    email: envAdmin.email,
    role: envAdmin.role,
    organizationSlug: envAdmin.organizationSlug,
    brandSlug: envAdmin.brandSlug,
    storeSlug: envAdmin.storeSlug,
  }
  const token = jwt.sign(safePayload, jwtSecret, {expiresIn: '4h'})
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 4 * 60 * 60 * 1000,
    path: '/',
  })
  res.json({ok: true})
})

// Return the current admin (from signed cookie)
router.get('/me', requireAdmin, (req: any, res) => {
  const admin = (req as any).admin || null
  // ensure passwordHash is never leaked
  if (admin && admin.passwordHash) delete admin.passwordHash
  res.json({admin})
})

// GET /admin/logout
router.get('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME)
  // Prefer a redirect when called from a browser link; keep JSON for XHR callers
  if (_req.headers.accept && _req.headers.accept.indexOf('text/html') !== -1) {
    return res.redirect('/admin')
  }
  res.json({ok: true})
})

export default router
