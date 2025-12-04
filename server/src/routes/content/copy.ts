import { Router } from "express";
import { z } from "zod";
import { fetchCMS } from "../../lib/cms";
import { isSanityConfigured } from "../../lib/sanityConfig";
import { demoCopy } from "../../lib/demoContent";

export const copyRouter = Router();

const contextOptions = [
  "onboarding",
  "emptyStates",
  "awards",
  "accessibility",
  "dataTransparency",
] as const;

const querySchema = z.object({
  context: z.enum(contextOptions),
});

copyRouter.get("/", async (req, res) => {
  const parsed = querySchema.safeParse(req.query || {});
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "INVALID_COPY_CONTEXT", details: parsed.error.issues });
  }
  const { context } = parsed.data;
  if (!isSanityConfigured()) {
    res.set("Cache-Control", "public, max-age=60");
    return res.json(demoCopy[context] || []);
  }
  const items = await fetchCMS(
    '*[_type=="appCopy" && context==$ctx]{key,text}[0...100]',
    {
      ctx: context,
    },
  );
  res.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=300");
  res.json(items);
});
