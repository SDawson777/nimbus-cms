import { Router } from "express";
export const legalRouter = Router();
// returns Terms/Privacy from CMS with static fallback; honors `?preview=true`
legalRouter.get("/", async (_req, res) => {
  // TODO: fetch from CMS or fallback JSON
  res.json({ terms: "", privacy: "" });
});
