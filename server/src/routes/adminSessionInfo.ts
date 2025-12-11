import { Router } from "express";
import { requireAdmin } from "../middleware/adminAuth";

const router = Router();

// Returns non-sensitive information about the current admin session
router.get(
  "/api/v1/nimbus/admin/session-info",
  requireAdmin,
  (req: any, res) => {
    const admin = (req as any).admin || null;
    const isAuth = !!admin;
    res.status(200).json({
      authenticated: isAuth,
      admin: admin
        ? {
            id: admin.id,
            email: admin.email,
            role: admin.role,
            organizationSlug: admin.organizationSlug ?? null,
            brandSlug: admin.brandSlug ?? null,
            storeSlug: admin.storeSlug ?? null,
          }
        : null,
      environment: process.env.NODE_ENV || "development",
    });
  },
);

export default router;
