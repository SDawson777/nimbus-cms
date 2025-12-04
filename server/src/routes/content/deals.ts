// GET /api/v1/content/deals
import { Router } from "express";
import { z } from "zod";
import { fetchCMS } from "../../lib/cms";
import { isSanityConfigured } from "../../lib/sanityConfig";
import { demoDeals } from "../../lib/demoContent";

export const dealsRouter = Router();

const slugPattern = /^[a-z0-9-]+$/i;
const idPattern = /^[a-zA-Z0-9_.-]+$/;

const preprocessQueryValue = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    const [first] = value;
    return typeof first === "string" ? first.trim() : undefined;
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return undefined;
};

const optionalSlugField = z
  .preprocess(
    preprocessQueryValue,
    z.string().min(1).max(64).regex(slugPattern),
  )
  .transform((val) => val?.toLowerCase())
  .optional();

const optionalIdField = z
  .preprocess(preprocessQueryValue, z.string().min(1).max(64).regex(idPattern))
  .optional();

const querySchema = z.object({
  storeId: optionalIdField,
  limit: z.coerce.number().min(1).max(50).default(20),
  brand: optionalSlugField,
  store: optionalSlugField,
  org: optionalSlugField,
  channel: optionalSlugField,
});

dealsRouter.get("/", async (req, res) => {
  const parsed = querySchema.safeParse(req.query || {});
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "INVALID_DEAL_FILTERS", details: parsed.error.issues });
  }
  const { storeId, limit, brand, store, org, channel } = parsed.data;

  // build tenant filter: prefer explicit storeId (legacy), otherwise accept slug-based filters
  let filter = "";
  const params: any = { lim: limit };
  if (storeId) {
    filter = "&& $sid in stores[]";
    params.sid = storeId;
  } else {
    if (store) {
      filter += ' && references(*[_type=="store" && slug.current==$store]._id)';
      params.store = store;
    }
    if (brand) {
      filter += ' && references(*[_type=="brand" && slug.current==$brand]._id)';
      params.brand = brand;
    }
    if (org) {
      filter +=
        ' && references(*[_type=="organization" && slug.current==$org]._id)';
      params.org = org;
    }
  }

  const channelExpr = channel
    ? " && ( !defined(channels) || count(channels) == 0 || $channel in channels )"
    : "";
  const scheduleExpr =
    " && ( !defined(schedule) || !schedule.isScheduled || (( !defined(schedule.publishAt) || schedule.publishAt <= now() ) && ( !defined(schedule.unpublishAt) || schedule.unpublishAt > now() )) )";

  const query = `*[_type=="deal" && active==true && now() >= startAt && now() <= endAt ${filter}${channelExpr}${scheduleExpr}] | order(priority desc)[0...$lim]{
    title,"slug":slug.current,badge,ctaText,ctaLink,
    "image":{"src":image.asset->url,"alt":image.alt},
    priority,startAt,endAt,stores
  }`;
  const queryParams = channel ? { ...params, channel } : params;
  if (!isSanityConfigured()) {
    const filtered = demoDeals.filter((d) => {
      if (!channel) return true;
      return (
        !d.channels || d.channels.length === 0 || d.channels.includes(channel)
      );
    });
    res.set("Cache-Control", "public, max-age=60");
    return res.json(filtered.slice(0, limit));
  }

  const items = await fetchCMS(query, queryParams);
  const results = Array.isArray(items) ? items : [];
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=300");
  res.json(results);
});
