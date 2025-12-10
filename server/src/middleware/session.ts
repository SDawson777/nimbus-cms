import {Request, Response, NextFunction} from 'express'

// Legacy no-op: session is managed via express-session in index.ts
export function setAdminSession(_res: Response, _payload: any) {
  return
}

export function requireAdmin(req: Request & {session?: any}, res: Response, next: NextFunction) {
  if (!req.session || !req.session.admin || !req.session.admin.loggedIn) {
    return res.status(401).json({error: 'Not authenticated'})
  }
  next()
}
