import cors from 'cors'

export const nimbusCors = cors({
  origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
    const allowed = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) || []
    if (!origin || allowed.includes(origin)) return cb(null, true)
    return cb(new Error('CORS blocked for origin: ' + origin))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
})
