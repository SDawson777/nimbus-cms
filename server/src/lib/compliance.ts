import { fetchCMS } from "./cms";

type LegalDoc = {
  _id: string;
  type: string;
  stateCode?: string | null;
  version?: string | number;
  effectiveFrom?: string;
};

type Store = {
  _id: string;
  slug: string;
  stateCode?: string | null;
  title?: string;
};

export async function computeCompliance(
  requiredTypes: string[] = ["terms", "privacy", "accessibility", "ageGate"],
  opts?: { org?: string; brand?: string },
) {
  // tenant filters when scoping requested
  let storeFilter = "";
  const params: any = {};
  if (opts?.brand) {
    storeFilter +=
      ' && references(*[_type=="brand" && slug.current==$brand]._id)';
    params.brand = opts.brand;
  }
  if (opts?.org) {
    storeFilter +=
      ' && references(*[_type=="organization" && slug.current==$org]._id)';
    params.org = opts.org;
  }

  // fetch stores (optionally scoped)
  const stores = (await fetchCMS(
    `*[_type=="store" ${storeFilter}]{_id,slug,stateCode,title}`,
    params,
  )) as Store[];

  // fetch current legal docs (effective now)
  const legalQuery = `*[_type=="legalDoc" && effectiveFrom <= now() && (!defined(effectiveTo) || effectiveTo > now())]{_id,type,stateCode,version,effectiveFrom}`;
  const legalDocs = (await fetchCMS(legalQuery, {})) as LegalDoc[];

  // build lookup by type -> stateCode|'GLOBAL' -> best doc (highest version or latest effectiveFrom)
  const lookup: Record<string, Record<string, LegalDoc>> = {};
  for (const d of legalDocs || []) {
    const type = d.type || "unknown";
    const state = d.stateCode || "GLOBAL";
    lookup[type] = lookup[type] || {};
    const existing = lookup[type][state];
    if (!existing) {
      lookup[type][state] = d;
      continue;
    }
    // choose by numeric version if possible, else effectiveFrom date
    const vA = Number(existing.version as any);
    const vB = Number(d.version as any);
    if (!Number.isNaN(vA) && !Number.isNaN(vB)) {
      if (vB > vA) lookup[type][state] = d;
    } else {
      const aTime = existing.effectiveFrom
        ? Date.parse(existing.effectiveFrom)
        : 0;
      const bTime = d.effectiveFrom ? Date.parse(d.effectiveFrom) : 0;
      if (bTime > aTime) lookup[type][state] = d;
    }
  }

  const results = [] as any[];
  for (const s of stores || []) {
    const missing: string[] = [];
    const currentLegal: Array<{
      type: string;
      version?: string | number;
      effectiveFrom?: string;
    }> = [];
    for (const t of requiredTypes) {
      // prefer state-specific
      const stateKey = s.stateCode || "GLOBAL";
      const stateDoc = lookup[t] && lookup[t][stateKey];
      const globalDoc = lookup[t] && lookup[t]["GLOBAL"];
      const chosen = stateDoc || globalDoc || null;
      if (chosen) {
        currentLegal.push({
          type: t,
          version: chosen.version,
          effectiveFrom: chosen.effectiveFrom,
        });
      } else {
        missing.push(t);
      }
    }
    const found = requiredTypes.length - missing.length;
    const score = Math.round((found / requiredTypes.length) * 100);
    results.push({
      storeSlug: s.slug,
      stateCode: s.stateCode || undefined,
      complianceScore: score,
      missingTypes: missing,
      currentLegalDocs: currentLegal,
    });
  }

  return results;
}

export default { computeCompliance };
