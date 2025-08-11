// GET /api/v1/content/deals
import { Router } from "express";
export const dealsRouter = Router();
dealsRouter.get("/", async (_req, res) => {
  // TODO: wire to Sanity query; falls back to static JSON
  res.json({ deals: [] });
});
