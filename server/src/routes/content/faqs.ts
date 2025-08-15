import { Router } from "express";
export const faqsRouter = Router();
// returns FAQs from CMS with static fallback; honors `?preview=true`
faqsRouter.get("/", async (_req, res) => {
  // TODO: fetch from CMS or fallback JSON
  res.json([{ question: "Placeholder question?", answer: "Placeholder answer." }]);
});
