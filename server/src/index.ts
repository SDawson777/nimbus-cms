import express from 'express'
import cors from 'cors'
import path from 'path'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import {logger} from './lib/logger'
import adminAuthRouter from './routes/adminAuth'
import {requireAdmin} from './middleware/adminAuth'
import {requireCsrfToken, ensureCsrfCookie} from './middleware/requireCsrfToken'
import {requestLogger} from './middleware/requestLogger'

import {contentRouter} from './routes/content'
import {personalizationRouter} from './routes/personalization'
import {statusRouter} from './routes/status'
import {adminRouter} from './routes/admin'
import analyticsRouter from './routes/analytics'
import {startComplianceScheduler} from './jobs/complianceSnapshotJob'

const requiredSecrets = ['JWT_SECRET', 'PREVIEW_SECRET'] as const
const missingSecrets = requiredSecrets.filter((key) => !process.env[key])
if (missingSecrets.length) {
  throw new Error(
    `Missing required environment variable${missingSecrets.length > 1 ? 's' : ''}: ${missingSecrets.join(
      ', ',
    )}`,
  )
}

const isProduction = process.env.NODE_ENV === 'production'
const jwtSecret = process.env.JWT_SECRET || ''
const weakJwtValues = new Set([
  'change_me_in_prod',
  'changeme',
  'secret',
  'placeholder',
  'your_jwt_secret',
])
if (isProduction) {
  const normalized = jwtSecret.toLowerCase()
  if (jwtSecret.length < 24 || weakJwtValues.has(normalized)) {
    throw new Error('JWT_SECRET must be at least 24 characters and not a placeholder in production')
  }
} else if (jwtSecret.length < 16 || weakJwtValues.has(jwtSecret.toLowerCase())) {
  logger.warn('JWT_SECRET is weak; set a longer secret before deploying to production')
}

const app = express()
// Security middlewares
app.use(helmet())
// Ensure JSON + URL-encoded parsers and capture raw bodies for HMAC validation
const jsonBodyLimit = process.env.JSON_BODY_LIMIT || '4mb'
app.use(
  express.json({
    limit: jsonBodyLimit,
    verify: (req: any, _res, buf) => {
      if (buf && buf.length) {
        req.rawBody = Buffer.from(buf)
      }
    },
  }),
)
app.use(express.urlencoded({extended: true}))
app.use(requestLogger)

// Configure CORS: if CORS_ORIGINS env is set (comma-separated), restrict origins.
// Credentials (cookies) are only allowed when the origin is a specific allowlisted origin.
const defaultDevOrigins = [
  'http://localhost:3000',
  'http://localhost:3333',
  'http://localhost:4010',
  'http://localhost:5173',
]
if (!process.env.CORS_ORIGINS && isProduction) {
  throw new Error('CORS_ORIGINS must be configured in production (comma-separated list of origins)')
}
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : defaultDevOrigins

const isWildcard = allowedOrigins.length === 1 && allowedOrigins[0] === '*'

app.use(
  cors({
    origin: isWildcard
      ? true
      : (origin: any, callback: any) => {
          // Allow requests with no origin (server-to-server, curl)
          if (!origin) return callback(null, true)
          if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true)
          logger.warn('CORS origin denied', {origin})
          return callback(new Error('CORS origin denied'))
        },
    // Only set credentials when not using a wildcard origin
    credentials: !isWildcard,
    optionsSuccessStatus: 200,
  }),
)

// Parse cookies (used by admin auth)
app.use(cookieParser())
// Serve a small static landing page for human visitors / buyers
const staticDir = path.join(__dirname, '..', 'static')
app.use(express.static(staticDir))
app.get('/', (_req, res) => res.sendFile(path.join(staticDir, 'index.html')))

// Admin auth routes (login/logout)
app.use('/admin', adminAuthRouter)
// Serve admin static pages (login and dashboard)
app.get('/admin', (_req, res) => res.sendFile(path.join(staticDir, 'admin', 'login.html')))
app.get('/admin/dashboard', requireAdmin, (_req, res) =>
  res.sendFile(path.join(staticDir, 'admin', 'dashboard.html')),
)
app.get('/admin/settings', requireAdmin, (_req, res) =>
  res.sendFile(path.join(staticDir, 'admin', 'settings.html')),
)

// content routes (existing + new)
// Mount content routes for legacy API consumers
app.use('/api/v1/content', contentRouter)
// Mount content routes for mobile and external consumers (mobile contract)
app.use('/content', contentRouter)

// personalization public endpoints
app.use('/personalization', personalizationRouter)

// Analytics endpoint (collect events)
app.use('/analytics', analyticsRouter)

// status routes (legacy and a simple /status alias)
app.use('/api/v1/status', statusRouter)
app.use('/status', statusRouter)
// admin routes (products used by mobile) - protect all API admin routes with requireAdmin
app.use('/api/admin', requireAdmin, ensureCsrfCookie, requireCsrfToken, adminRouter)

// Start compliance snapshot scheduler only when explicitly enabled (avoid running during tests)
if (process.env.ENABLE_COMPLIANCE_SCHEDULER === 'true') {
  try {
    const instanceId = process.env.INSTANCE_ID || process.env.HOSTNAME || 'local'
    logger.info('Starting compliance scheduler (ensure only one instance has ENABLE_COMPLIANCE_SCHEDULER=true)', {
      instanceId,
    })
    startComplianceScheduler()
  } catch (e) {
    logger.error('failed to start compliance scheduler', e)
  }
}

export default app
