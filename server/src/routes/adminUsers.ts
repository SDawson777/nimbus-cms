import { Router, Request, Response } from "express";
import { getAdminStore } from "../services/adminStore";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// Require elevated role for all admin-user operations
router.use(requireRole("ORG_ADMIN"));

// List admins (returns safe view)
router.get("/", async (_req: Request, res: Response) => {
  const store = getAdminStore();
  const admins = await store.list();
  res.json({ admins });
});

// Invite/create admin (simple: append to file)
router.post("/invite", expressJsonHandler, async (req: Request, res: Response) => {
  const { email, role = "EDITOR", organizationSlug, brandSlug, storeSlug } = req.body || {};
  if (!email) return res.status(400).json({ error: "MISSING_EMAIL" });
  try {
    const store = getAdminStore();
    const admin = await store.invite({ email, role, organizationSlug, brandSlug, storeSlug } as any);
    return res.status(201).json({ admin });
  } catch (e: any) {
    if (e?.code === 'ALREADY_EXISTS') return res.status(409).json({ error: 'ALREADY_EXISTS' });
    return res.status(500).json({ error: 'STORE_FAILED' });
  }
});

// Update admin
router.put("/:id", expressJsonHandler, async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body || {};
  try {
    const store = getAdminStore();
    const updated = await store.update(id, updates);
    return res.json({ admin: updated });
  } catch (e: any) {
    if (e?.code === 'NOT_FOUND') return res.status(404).json({ error: 'NOT_FOUND' });
    return res.status(500).json({ error: 'STORE_FAILED' });
  }
});

// Delete admin
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const store = getAdminStore();
    await store.remove(id);
    return res.json({ ok: true });
  } catch (e: any) {
    if (e?.code === 'NOT_FOUND') return res.status(404).json({ error: 'NOT_FOUND' });
    return res.status(500).json({ error: 'STORE_FAILED' });
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
