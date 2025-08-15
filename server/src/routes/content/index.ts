import { Router } from "express";
export const contentRouter = Router();
// existing endpoints: /legal, /faqs, /articles, /filters
// add `?preview=true` passthrough for studio live preview
contentRouter.use((req, _res, next) => {
  (req as any).preview = req.query.preview === "true";
  next();
});

import { legalRouter } from "./legal";
import { faqsRouter } from "./faqs";
contentRouter.use("/legal", legalRouter);
contentRouter.use("/faqs", faqsRouter);
