import { Router } from "express";
import { z } from "zod";
import { fetchCMS } from "../../lib/cms";
import { isSanityConfigured } from "../../lib/sanityConfig";
import { demoArticles } from "../../lib/demoContent";

export const articlesRouter = Router();

// list articles
articlesRouter.get("/", async (req, res) => {
  const { page, limit, tag, org, brand, store } = z
    .object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(50).default(20),
      tag: z.string().optional(),
      org: z.string().optional(),
      brand: z.string().optional(),
      store: z.string().optional(),
    })
    .parse(req.query);
  const preview = (req as any).preview ?? false;
  const channel = String((req.query as any).channel || "").trim();
  const from = (page - 1) * limit;
  const filter = tag ? "&& $tag in tags" : "";

  const provideDemo = () => {
    const filtered = demoArticles.filter((a) => {
      const tagMatch = tag ? (a.tags || []).includes(tag) : true;
      const channelMatch = channel
        ? !a.channels || a.channels.length === 0 || a.channels.includes(channel)
        : true;
      return tagMatch && channelMatch;
    });
    const items = filtered.slice(from, from + limit);
    const total = filtered.length;
    res.set("Cache-Control", "public, max-age=60");
    return res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  };

  // Tenant filters: optional brand/store/org scoping (accept slugs)
  let tenantFilter = "";
  if (brand) {
    // filter documents that reference a brand with the provided slug
    tenantFilter +=
      ' && references(*[_type=="brand" && slug.current==$brand]._id)';
  }
  if (store) {
    // filter documents that reference a store with the provided slug
    tenantFilter +=
      ' && references(*[_type=="store" && slug.current==$store]._id)';
  }
  if (org) {
    tenantFilter +=
      ' && references(*[_type=="organization" && slug.current==$org]._id)';
  }

  const base = `*[_type=="greenhouseArticle" && status=="published" ${filter} ${tenantFilter}]`;
  // Channel semantics: when a channel is provided, include docs that either do not define channels,
  // or have an empty channels array, or explicitly include the requested channel.
  const channelExpr = channel
    ? " && ( !defined(channels) || count(channels) == 0 || $channel in channels )"
    : "";
  // Scheduling semantics: if schedule.isScheduled is true, require publish/unpublish window checks.
  const scheduleExpr =
    " && ( !defined(schedule) || !schedule.isScheduled || (( !defined(schedule.publishAt) || schedule.publishAt <= now() ) && ( !defined(schedule.unpublishAt) || schedule.unpublishAt > now() )) )";
  if (!isSanityConfigured()) return provideDemo();

  try {
    const total = await fetchCMS<number>(
      `count(${base}${channelExpr}${scheduleExpr})`,
      { tag, brand, store, org, channel },
      { preview },
    );
    const items = await fetchCMS(
      `${base}${channelExpr}${scheduleExpr} | order(publishedAt desc)[${from}...${from + limit}]{
    "id":_id, title, "slug":slug.current, excerpt, body,
    "cover":{"src":coverImage.asset->url,"alt":coverImage.alt},
    tags, author, publishedAt, featured
  }`,
      { tag, brand, store, org, channel },
      { preview },
    );
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=300");
    res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    req.log?.warn?.("content.articles.demo_fallback", err);
    return provideDemo();
  }
});

// single article
articlesRouter.get("/:slug", async (req, res) => {
  const preview = (req as any).preview ?? false;
  const channel = String((req.query as any).channel || "").trim();
  const channelExpr = channel
    ? " && ( !defined(channels) || count(channels) == 0 || $channel in channels )"
    : "";
  const scheduleExpr =
    " && ( !defined(schedule) || !schedule.isScheduled || (( !defined(schedule.publishAt) || schedule.publishAt <= now() ) && ( !defined(schedule.unpublishAt) || schedule.unpublishAt > now() )) )";
  const query = `*[_type=="greenhouseArticle" && slug.current==$s${channelExpr}${scheduleExpr}][0]{
    "id":_id, title, "slug":slug.current, excerpt, body,
    "cover":{"src":coverImage.asset->url,"alt":coverImage.alt},
    tags, author, publishedAt, featured,
    variants[]->{variantKey, title, excerpt, body}
  }`;
  if (!isSanityConfigured()) {
    const match = demoArticles.find((a) => a.slug === req.params.slug);
    if (!match) return res.status(404).json({ error: "NOT_FOUND" });
    return res.json(match);
  }
  const item = await fetchCMS(
    query,
    { s: req.params.slug, channel },
    { preview },
  );
  if (!item) return res.status(404).json({ error: "NOT_FOUND" });
  // Support ?variant=KEY to return variant overrides when present
  const variantKey = String(req.query.variant || "").trim();
  let out: any = item;
  if (variantKey) {
    try {
      const itm: any = item;
      const v = (itm.variants || []).find(
        (vv: any) => String(vv.variantKey) === variantKey,
      );
      if (v) {
        out = {
          ...itm,
          title: v.title || itm.title,
          excerpt: v.excerpt || itm.excerpt,
          body: v.body || itm.body,
        };
      }
    } catch {
      // ignore and return original
    }
  }
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=300");
  res.json(out);
});
