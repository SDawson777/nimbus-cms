import { Router } from "express";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const payload: any = req.body;

    console.log("[Sanity Webhook]", {
      id: payload?._id,
      type: payload?._type,
      op: payload?.operation,
    });

    // TODO: invalidate caches or trigger revalidation as needed

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook Error:", err);
    // Always 200 to avoid Sanity retry storms for non-critical tasks
    res.status(200).json({ ok: true });
  }
});

export default router;
