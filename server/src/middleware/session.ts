import jwt from 'jsonwebtoken'
import {Request, Response, NextFunction} from 'express'

export function setAdminSession(res: Response, payload: any) {
  const token = jwt.sign(payload, process.env.SESSION_SECRET!, {
    expiresIn: '7d',
  })

  res.cookie('admin_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  })
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const cookie = req.cookies?.admin_session
  if (!cookie) return res.status(401).json({error: 'Not authenticated'})

  try {
    const decoded = jwt.verify(cookie, process.env.SESSION_SECRET!)
    ;(req as any).admin = decoded
    next()
  } catch (err) {
    return res.status(401).json({error: 'Invalid session'})
  }
}
