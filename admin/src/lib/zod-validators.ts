import { z } from "zod";

export const TenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export const ArticleSchema = z.object({
  _id: z.string(),
  title: z.string(),
  status: z.string().optional(),
  publishedAt: z.string().optional(),
});
