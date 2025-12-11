import { Request, Response, NextFunction } from "express";
import { AdminRole } from "../lib/admins";
import { Role } from "../types/roles";
import { logger } from "../lib/logger";

// role hierarchy for comparisons
const ROLE_ORDER: Record<AdminRole, number> = {
  OWNER: 6,
  ORG_ADMIN: 5,
  BRAND_ADMIN: 4,
  STORE_MANAGER: 3,
  EDITOR: 2,
  VIEWER: 1,
};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        tenantId?: string;
      };
    }
  }
}

export function requireRole(minRole: AdminRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).admin;
    if (!admin) return res.status(401).json({ error: "UNAUTHORIZED" });
    const userRole = admin.role as AdminRole;
    if (!userRole || ROLE_ORDER[userRole] < ROLE_ORDER[minRole]) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }
    return next();
  };
}

// New RBAC middleware for JWT-based role checks
export function requireRoleV2(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.warn("requireRoleV2: No user found in request");
      res
        .status(401)
        .json({ code: "UNAUTHORIZED", message: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn("requireRoleV2: User lacks required role", {
        userId: req.user.id,
        userRole: req.user.role,
        allowedRoles,
      });
      res.status(403).json({
        code: "FORBIDDEN",
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
      });
      return;
    }

    next();
  };
}

export function canAccessBrand(admin: any, brandSlug?: string | null) {
  if (!admin || !brandSlug) return false;
  const userRole = admin.role as AdminRole;
  if (!userRole) return false;
  if (userRole === "OWNER" || userRole === "ORG_ADMIN") return true;
  if (admin.brandSlug && admin.brandSlug === brandSlug) return true;
  if (userRole === "BRAND_ADMIN" && !admin.brandSlug) return true;
  return false;
}

export function canAccessStore(
  admin: any,
  storeSlug?: string | null,
  storeBrandSlug?: string | null,
) {
  if (!admin || !storeSlug) return false;
  const userRole = admin.role as AdminRole;
  if (!userRole) return false;
  if (userRole === "OWNER" || userRole === "ORG_ADMIN") return true;
  if (userRole === "BRAND_ADMIN") {
    if (
      !admin.brandSlug ||
      !storeBrandSlug ||
      admin.brandSlug === storeBrandSlug
    )
      return true;
    return false;
  }
  if (storeBrandSlug && admin.brandSlug && admin.brandSlug === storeBrandSlug) {
    if (userRole === "EDITOR") return true;
  }
  if (admin.storeSlug && admin.storeSlug === storeSlug) return true;
  return false;
}

// Helper: require that the admin has access to the given brand (slug) or is high-privilege
export function requireBrandAccess(
  getBrandSlug?: (req: Request) => string | undefined,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).admin;
    if (!admin) return res.status(401).json({ error: "UNAUTHORIZED" });
    const userRole = admin.role as AdminRole;
    if (userRole === "OWNER" || userRole === "ORG_ADMIN") return next();
    const required = getBrandSlug
      ? getBrandSlug(req)
      : (req.params as any).brand || (req.query as any).brand;
    if (!required) return res.status(403).json({ error: "FORBIDDEN" });
    if (canAccessBrand(admin, required)) return next();
    return res.status(403).json({ error: "FORBIDDEN" });
  };
}

export function requireStoreAccess(
  getStoreSlug?: (req: Request) => string | undefined,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).admin;
    if (!admin) return res.status(401).json({ error: "UNAUTHORIZED" });
    const userRole = admin.role as AdminRole;
    if (
      userRole === "OWNER" ||
      userRole === "ORG_ADMIN" ||
      userRole === "BRAND_ADMIN"
    )
      return next();
    const required = getStoreSlug
      ? getStoreSlug(req)
      : (req.params as any).store || (req.query as any).store;
    if (!required) return res.status(403).json({ error: "FORBIDDEN" });
    if (canAccessStore(admin, required)) return next();
    return res.status(403).json({ error: "FORBIDDEN" });
  };
}
