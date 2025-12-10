import {Request, Response, NextFunction} from 'express'
import jwt from 'jsonwebtoken'

const COOKIE_NAME = 'admin_token'

export function requireAdmin(req: Request & {session?: any}, res: Response, next: NextFunction) {
  const token = req.cookies && req.cookies[COOKIE_NAME]
    if (!req.session || !req.session.admin || !req.session.admin.loggedIn) {
      return res.status(401).json({error: 'Admin authentication required'})
    }
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET not configured')
    next()
  } catch (err) {
      return res.status(401).json({error: 'UNAUTHORIZED'})
  }
}
