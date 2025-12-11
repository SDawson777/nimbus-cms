import { Router } from "express";
import { z } from "zod";
import { published, drafts, isPreview } from "../lib/sanity";
export const content = Router();

content.get("/legal", async (req, res) => {
  const p = z
    .object({
      type: z.enum(["terms", "privacy", "accessibility"]),
      preview: z.string().optional(),
      secret: z.string().optional(),
    })
    .parse(req.query);
  const c = isPreview(new URLSearchParams(req.query as any))
    ? drafts
    : published;
  const q = `*[_type=="legalDoc" && type==$t] | order(updatedAt desc)[0]{title,version,updatedAt,body}`;
  res.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=300");
  res.json(await c.fetch(q, { t: p.type }));
});

content.get("/faqs", async (req, res) => {
  const c = isPreview(new URLSearchParams(req.query as any))
    ? drafts
    : published;
  const q = `*[_type=="faqGroup"] | order(weight asc){title,slug, "items":items(){"q":question,"a":answer}}`;
  res.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=300");
  res.json(await c.fetch(q, {}));
});

content.get("/articles", async (req, res) => {
  const p = z
    .object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(50).default(20),
      tag: z.string().optional(),
      preview: z.string().optional(),
      secret: z.string().optional(),
    })
    .parse(req.query);
  const c = isPreview(new URLSearchParams(req.query as any))
    ? drafts
    : published;
  const from = (p.page - 1) * p.limit;
  const f = p.tag ? `&& $tag in tags` : "";
  const base = `*[_type=="greenhouseArticle" && status=="published" ${f}]`;
  const params: any = p.tag ? { tag: p.tag } : {};
  const total = await c.fetch(`count(${base})`, params);
  const items = await c.fetch(
    `${base} | order(publishedAt desc)[${from}...${from + p.limit}]{
    "id":_id, title, "slug":slug.current, excerpt, body,
    "cover":{"src":coverImage.asset->url,"alt":coverImage.alt},
    tags, author, publishedAt, featured
  }`,
    params,
  );
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=300");
  res.json({
    items,
    page: p.page,
    limit: p.limit,
    total,
    totalPages: Math.ceil(total / p.limit),
  });
});

content.get("/articles/:slug", async (req, res) => {
  const c = isPreview(new URLSearchParams(req.query as any))
    ? drafts
    : published;
  const item = await c.fetch(
    `*[_type=="greenhouseArticle" && slug.current==$s][0]{
    "id":_id, title, "slug":slug.current, excerpt, body,
    "cover":{"src":coverImage.asset->url,"alt":coverImage.alt},
    tags, author, publishedAt, featured
  }`,
    { s: req.params.slug },
  );
  if (!item) return res.status(404).json({ error: "NOT_FOUND" });
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=300");
  res.json(item);
});

content.get("/filters", async (_req, res) => {
  const c = published;
  const cats = await c.fetch(
    `*[_type=="shopCategory" && active==true] | order(weight asc){name,"slug":slug.current,iconRef,weight}`,
  );
  const filters = await c.fetch(`*[_type=="shopFilter"] | order(name asc){
    name, "slug":slug.current, type, "options":options[active==true] | order(weight asc){label,value}
  }`);
  res.set("Cache-Control", "public, max-age=43200, stale-while-revalidate=300");
  res.json({ categories: cats, filters });
});

content.get("/deals", async (req, res) => {
  const p = z
    .object({
      storeId: z.string().optional(),
      limit: z.coerce.number().min(1).max(50).default(20),
    })
    .parse(req.query);
  const c = published;
  const f = p.storeId ? `&& $sid in stores[]` : "";
  const items = await c.fetch(
    `*[_type=="deal" && active==true && now() >= startAt && now() <= endAt ${f}] | order(priority desc)[0...$lim]{
    title,"slug":slug.current,badge,ctaText,ctaLink, "image":{"src":image.asset->url,"alt":image.alt}, priority,startAt,endAt,stores
  }`,
    { sid: p.storeId, lim: p.limit },
  );
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=300");
  res.json(items);
});

content.get("/copy", async (req, res) => {
  const p = z
    .object({
      context: z.enum([
        "onboarding",
        "emptyStates",
        "awards",
        "accessibility",
        "dataTransparency",
      ]),
    })
    .parse(req.query);
  const c = published;
  const items = await c.fetch(
    `*[_type=="appCopy" && context==$ctx]{key,text}[0...100]`,
    {
      ctx: p.context,
    },
  );
  res.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=300");
  res.json(items);
});
