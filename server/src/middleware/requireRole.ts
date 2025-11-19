import {Request, Response, NextFunction} from 'express'
import {AdminRole} from '../lib/admins'

// role hierarchy for comparisons
const ROLE_ORDER: Record<AdminRole, number> = {
  OWNER: 6,
  ORG_ADMIN: 5,
  BRAND_ADMIN: 4,
  STORE_MANAGER: 3,
  EDITOR: 2,
  VIEWER: 1,
}

export function requireRole(minRole: AdminRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).admin
    if (!admin) return res.status(401).json({error: 'UNAUTHORIZED'})
    const userRole = admin.role as AdminRole
    if (!userRole || ROLE_ORDER[userRole] < ROLE_ORDER[minRole]) {
      return res.status(403).json({error: 'FORBIDDEN'})
    }
    return next()
  }
}

// Helper: require that the admin has access to the given brand (slug) or is high-privilege
export function requireBrandAccess(getBrandSlug?: (req: Request) => string | undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).admin
    if (!admin) return res.status(401).json({error: 'UNAUTHORIZED'})
    const userRole = admin.role as AdminRole
    if (userRole === 'OWNER' || userRole === 'ORG_ADMIN') return next()
    const required = getBrandSlug
      ? getBrandSlug(req)
      : (req.params as any).brand || (req.query as any).brand
    if (!required) return res.status(403).json({error: 'FORBIDDEN'})
    if (admin.brandSlug && admin.brandSlug === required) return next()
    return res.status(403).json({error: 'FORBIDDEN'})
  }
}

export function requireStoreAccess(getStoreSlug?: (req: Request) => string | undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).admin
    if (!admin) return res.status(401).json({error: 'UNAUTHORIZED'})
    const userRole = admin.role as AdminRole
    if (userRole === 'OWNER' || userRole === 'ORG_ADMIN' || userRole === 'BRAND_ADMIN')
      return next()
    const required = getStoreSlug
      ? getStoreSlug(req)
      : (req.params as any).store || (req.query as any).store
    if (!required) return res.status(403).json({error: 'FORBIDDEN'})
    if (admin.storeSlug && admin.storeSlug === required) return next()
    return res.status(403).json({error: 'FORBIDDEN'})
  }
}
