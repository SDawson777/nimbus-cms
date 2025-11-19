import {Request, Response, NextFunction} from 'express'
import jwt from 'jsonwebtoken'

const COOKIE_NAME = 'admin_token'

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies && req.cookies[COOKIE_NAME]
  if (!token) return res.status(401).json({error: 'UNAUTHORIZED'})
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret'
    const payload = jwt.verify(token, secret)
    ;(req as any).admin = payload
    return next()
  } catch (err) {
    return res.status(401).json({error: 'UNAUTHORIZED'})
  }
}
