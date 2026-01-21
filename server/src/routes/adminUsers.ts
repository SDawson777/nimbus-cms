import { Router, Request, Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import getPrisma from "../lib/prisma";
import { requireRole } from "../middleware/requireRole";
import { sendInvitationEmail } from "../lib/email";

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════
// ENTERPRISE: Zod validation schemas for input sanitization & type safety
// ═══════════════════════════════════════════════════════════════════════════
const AdminRoleEnum = z.enum([
  "VIEWER",
  "EDITOR", 
  "STORE_MANAGER",
  "BRAND_ADMIN",
  "ORG_ADMIN",
  "OWNER",
]);

const InviteAdminSchema = z.object({
  email: z.string()
    .email("Invalid email format")
    .max(255, "Email too long")
    .transform(val => val.toLowerCase().trim()),
  role: AdminRoleEnum,
  organizationSlug: z.string().max(100).optional(),
  brandSlug: z.string().max(100).optional(),
  storeSlug: z.string().max(100).optional(),
});

const UpdateAdminSchema = z.object({
  role: AdminRoleEnum.optional(),
  organizationSlug: z.string().max(100).optional().nullable(),
  brandSlug: z.string().max(100).optional().nullable(),
  storeSlug: z.string().max(100).optional().nullable(),
});

/**
 * Validate request body against a Zod schema
 * Returns parsed data or sends 400 error
 */
function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

// Require elevated role for all admin-user operations
router.use(requireRole("ORG_ADMIN"));

// List admins (returns safe view from database)
router.get("/", async (req: any, res: Response) => {
  try {
    const prisma = getPrisma();
    const currentAdmin = req.admin;

    const where: any = { deletedAt: null };
    
    // ORG_ADMIN can only see admins in their org
    if (currentAdmin.role === "ORG_ADMIN" && currentAdmin.organizationSlug) {
      where.organizationSlug = currentAdmin.organizationSlug;
    }

    const admins = await prisma.adminUser.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        organizationSlug: true,
        brandSlug: true,
        storeSlug: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
      },
    });

    res.json({ admins });
  } catch (err) {
    req.log?.error?.("admin.admin-users.list_failed", err);
    res.status(500).json({ error: "FAILED" });
  }
});

// Invite/create admin (database-backed with invitation tokens)
router.post("/invite", expressJsonHandler, async (req: any, res: Response) => {
  try {
    const prisma = getPrisma();
    const currentAdmin = req.admin;

    // Validate input with Zod
    const validation = validateBody(InviteAdminSchema, req.body);
    if (!validation.success) {
      const errorMessages = validation.errors.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      return res.status(400).json({ 
        error: "VALIDATION_ERROR",
        details: errorMessages,
      });
    }

    const { email, role, organizationSlug, brandSlug, storeSlug } = validation.data;

    // ORG_ADMIN can only invite to their own org
    const targetOrg = currentAdmin.role === "OWNER" 
      ? organizationSlug 
      : currentAdmin.organizationSlug;

    // Role hierarchy check - can't invite higher roles
    const roleHierarchy = ["VIEWER", "EDITOR", "STORE_MANAGER", "BRAND_ADMIN", "ORG_ADMIN", "OWNER"];
    const currentRoleLevel = roleHierarchy.indexOf(currentAdmin.role);
    const targetRoleLevel = roleHierarchy.indexOf(role);
    if (targetRoleLevel > currentRoleLevel) {
      return res.status(403).json({ error: "CANNOT_INVITE_HIGHER_ROLE" });
    }

    // Check if admin already exists
    const existing = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (existing && !existing.deletedAt) {
      return res.status(409).json({ error: "ADMIN_EXISTS" });
    }

    // Generate secure invitation token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.adminInvitation.create({
      data: {
        id: crypto.randomUUID(),
        email,
        token,
        role,
        organizationSlug: targetOrg,
        brandSlug,
        storeSlug,
        invitedBy: currentAdmin.email,
        expiresAt,
      },
    });

    // Send invitation email
    try {
      await sendInvitationEmail(email, token, currentAdmin.email);
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Continue anyway - invitation is created, email can be resent
    }

    req.log?.info?.("admin.admin-users.invited", {
      invitedEmail: email,
      invitedBy: currentAdmin.email,
      role,
    });

    const response: any = {
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    };

    // Include URL in dev/demo for testing
    if (process.env.NODE_ENV !== 'production' || process.env.APP_ENV === 'demo') {
      response.invitationUrl = `${process.env.ADMIN_URL || "http://localhost:5173"}/accept-invitation?token=${token}`;
    }

    res.status(201).json(response);
  } catch (err) {
    req.log?.error?.("admin.admin-users.invite_failed", err);
    res.status(500).json({ error: "FAILED" });
  }
});

// Update admin (database-backed)
router.put("/:id", expressJsonHandler, async (req: any, res: Response) => {
  try {
    const prisma = getPrisma();
    const currentAdmin = req.admin;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "MISSING_ID" });
    }

    // Validate input with Zod
    const validation = validateBody(UpdateAdminSchema, req.body);
    if (!validation.success) {
      const errorMessages = validation.errors.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      return res.status(400).json({ 
        error: "VALIDATION_ERROR",
        details: errorMessages,
      });
    }

    const { role, organizationSlug, brandSlug, storeSlug } = validation.data;

    // Prevent self-modification
    if (id === currentAdmin.id) {
      return res.status(403).json({ error: "CANNOT_MODIFY_SELF" });
    }

    // Only OWNER can update roles
    if (role && currentAdmin.role !== "OWNER") {
      return res.status(403).json({ error: "INSUFFICIENT_PERMISSIONS" });
    }

    const admin = await prisma.adminUser.update({
      where: { id },
      data: {
        role,
        organizationSlug,
        brandSlug,
        storeSlug,
        updatedBy: currentAdmin.email,
      },
      select: {
        id: true,
        email: true,
        role: true,
        organizationSlug: true,
        brandSlug: true,
        storeSlug: true,
        updatedAt: true,
      },
    });

    req.log?.info?.("admin.admin-users.updated", {
      adminId: id,
      updatedBy: currentAdmin.email,
      newRole: role,
    });

    res.json({ admin });
  } catch (err: any) {
    req.log?.error?.("admin.admin-users.update_failed", err);
    if (err?.code === 'P2025') {
      return res.status(404).json({ error: "NOT_FOUND" });
    }
    res.status(500).json({ error: "FAILED" });
  }
});

// Delete admin (soft delete)
router.delete("/:id", async (req: any, res: Response) => {
  try {
    const prisma = getPrisma();
    const currentAdmin = req.admin;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "MISSING_ID" });
    }

    // Prevent self-deletion
    if (id === currentAdmin.id) {
      return res.status(403).json({ error: "CANNOT_DELETE_SELF" });
    }

    // Only OWNER can delete
    if (currentAdmin.role !== "OWNER") {
      return res.status(403).json({ error: "INSUFFICIENT_PERMISSIONS" });
    }

    await prisma.adminUser.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: currentAdmin.email,
      },
    });

    req.log?.info?.("admin.admin-users.revoked", {
      adminId: id,
      revokedBy: currentAdmin.email,
    });

    res.json({ ok: true });
  } catch (err: any) {
    req.log?.error?.("admin.admin-users.revoke_failed", err);
    if (err?.code === 'P2025') {
      return res.status(404).json({ error: "NOT_FOUND" });
    }
    res.status(500).json({ error: "FAILED" });
  }
});

export default router;

// Minimal JSON body parser for this router to avoid cyclic imports
function expressJsonHandler(req: Request, _res: Response, next: any) {
  // If body already parsed by app, continue
  if ((req as any).body) return next();
  let data = "";
  req.on("data", (chunk) => (data += chunk));
  req.on("end", () => {
    try {
      (req as any).body = data ? JSON.parse(data) : {};
    } catch (e) {
      (req as any).body = {};
    }
    next();
  });
}
