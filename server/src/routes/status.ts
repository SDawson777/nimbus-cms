import { Router } from "express";
export const statusRouter = Router();
statusRouter.get("/", (_req, res) => {
  res.json({
    phases: {
      p1_mvp_core: true,
      p2_intelligence_scaffold: true,
      p3_ecosystem_cms: true,
      p4_vanguard_prefs: true
    }
  });
});
