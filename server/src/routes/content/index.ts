import { Router } from "express";
export const contentRouter = Router();
// existing endpoints: /legal, /faq, /articles, /filters
// add `?preview=true` passthrough for studio live preview
contentRouter.use((req, _res, next) => {
  (req as any).preview = req.query.preview === "true";
  next();
});

import { legalRouter } from "./legal";
contentRouter.use("/legal", legalRouter);
