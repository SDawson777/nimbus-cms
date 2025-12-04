import { Router } from "express";
import { z } from "zod";
import { fetchCMS } from "../../lib/cms";
import { isSanityConfigured } from "../../lib/sanityConfig";
import { demoFaqGroups } from "../../lib/demoContent";

export const faqsRouter = Router();

const slugPattern = /^[a-z0-9-]+$/i;
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

const querySchema = z.object({
  org: optionalSlugField,
  brand: optionalSlugField,
  store: optionalSlugField,
  channel: optionalSlugField,
});

async function fetchAndFlattenFaqs(req: any, res: any) {
  const preview = req.preview ?? false;
  const parsed = querySchema.safeParse(req.query || {});
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "INVALID_FAQ_FILTERS", details: parsed.error.issues });
  }
  const { org, brand, store, channel } = parsed.data;

  const fallbackGroups = demoFaqGroups.map((g) => ({
    ...g,
    items: (g.items || []).filter((i) =>
      channel
        ? !i.channels || i.channels.length === 0 || i.channels.includes(channel)
        : true,
    ),
  }));

  // tenant filters
  let tenantFilter = "";
  if (brand)
    tenantFilter +=
      ' && references(*[_type=="brand" && slug.current==$brand]._id)';
  if (store)
    tenantFilter +=
      ' && references(*[_type=="store" && slug.current==$store]._id)';
  if (org)
    tenantFilter +=
      ' && references(*[_type=="organization" && slug.current==$org]._id)';
  // Channel semantics for FAQs: filter items() (referenced faq items) to include those that either
  // do not define channels, have empty channels, or include the requested channel.
  const itemChannelFilter = channel
    ? `[ ( !defined(channels) || count(channels) == 0 || $channel in channels ) ]`
    : "";
  const query = `*[_type=="faqGroup" ${tenantFilter}] | order(weight asc){title,slug, "items":items()${itemChannelFilter}{"q":question,"a":answer}}`;
  // fetch groups from CMS
  const params: Record<string, string | undefined> = { brand, store, org };
  if (channel) params.channel = channel;
  if (!isSanityConfigured()) {
    const responseGroups = String(req.baseUrl || "").startsWith("/api/v1")
      ? fallbackGroups
      : undefined;
    if (responseGroups) {
      res.set("Cache-Control", "public, max-age=60");
      return res.json(responseGroups);
    }
  }

  const groups = (await fetchCMS(query, params, { preview })) as any[];

  // If this request is under the legacy mount (/api/v1/content), return the original groups shape
  if (String(req.baseUrl || "").startsWith("/api/v1")) {
    res.set(
      "Cache-Control",
      "public, max-age=86400, stale-while-revalidate=300",
    );
    return res.json(groups);
  }

  // Otherwise (mobile path), flatten into [{id,question,answer}]
  const source = groups && groups.length ? groups : fallbackGroups;
  const flattened: Array<{ id: string; question: string; answer: string }> = [];
  (source || []).forEach((g: any, gi: number) => {
    const baseId =
      (typeof g.slug === "string" && g.slug) || g.title || `group-${gi}`;
    (g.items || []).forEach((it: any, ii: number) => {
      flattened.push({
        id: `${baseId}-${ii}`,
        question: it.q || it.question || "",
        answer: it.a || it.answer || "",
      });
    });
  });
  res.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=300");
  res.json(flattened);
}

// primary endpoints and aliases for mobile
faqsRouter.get("/", (req, res) => fetchAndFlattenFaqs(req as any, res));
faqsRouter.get("/fa_q", (req, res) => fetchAndFlattenFaqs(req as any, res));
faqsRouter.get("/faq", (req, res) => fetchAndFlattenFaqs(req as any, res));
