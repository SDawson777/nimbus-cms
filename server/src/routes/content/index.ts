import { Router } from "express";
import { logger } from "../../lib/logger";

export const contentRouter = Router();
// add `?preview=true` or `X-Preview: true` passthrough for studio live preview
// single source of truth for preview mode used by all content routes
contentRouter.use((req, _res, next) => {
  // Preview requires both the preview flag and a matching PREVIEW_SECRET
  // Accept VITE_PREVIEW_SECRET (legacy/dev) as a fallback for local/dev setups
  const previewSecretEnv = process.env.PREVIEW_SECRET || process.env.VITE_PREVIEW_SECRET;
  const previewSecretConfigured =
    typeof previewSecretEnv === "string" && previewSecretEnv.length > 0;
  if (!previewSecretConfigured) {
    (req as any).preview = false;
    return next();
  }

  const previewQuery = req.query && req.query.preview === "true";
  const previewHeader =
    String(req.header("X-Preview") || "").toLowerCase() === "true";
  const previewRequested = !!(previewQuery || previewHeader);

  const querySecret = req.query && String((req.query as any).secret || "");
  const headerSecret = String(req.header("X-Preview-Secret") || "");
  const querySecretValid = previewQuery && querySecret === previewSecretEnv;
  const headerSecretValid = previewHeader && headerSecret === previewSecretEnv;
  const previewGranted =
    previewRequested && (querySecretValid || headerSecretValid);

  if (previewRequested && !previewGranted) {
    logger.warn("Preview request denied (secret mismatch)", {
      path: req.path,
      origin: req.headers.origin,
    });
  }

  (req as any).preview = previewGranted;
  next();
});

import { legalRouter } from "./legal";
import { faqsRouter } from "./faqs";
import { articlesRouter } from "./articles";
import { filtersRouter } from "./filters";
import { copyRouter } from "./copy";
import { dealsRouter } from "./deals";
import themeRouter from "./theme";

contentRouter.use("/legal", legalRouter);
contentRouter.use("/faqs", faqsRouter);
// Mobile-canonical FAQ aliases
contentRouter.use("/fa_q", faqsRouter);
contentRouter.use("/faq", faqsRouter);
contentRouter.use("/articles", articlesRouter);
contentRouter.use("/filters", filtersRouter);
contentRouter.use("/copy", copyRouter);
contentRouter.use("/deals", dealsRouter);
contentRouter.use("/theme", themeRouter);
