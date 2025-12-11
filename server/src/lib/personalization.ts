import { fetchCMS } from "./cms";
import { logger } from "./logger";

type UserContext = Record<string, any>;

type Condition = { key: string; operator: string; value: any };
type Action = {
  targetType: string;
  targetSlugOrKey: string;
  priorityBoost: number;
  channel?: string;
};
type Rule = {
  _id?: string;
  name?: string;
  description?: string;
  enabled?: boolean;
  conditions?: Condition[];
  actions?: Action[];
};

function matchCondition(cond: Condition, ctx: UserContext): boolean {
  const left = ctx[cond.key];
  const op = cond.operator || "equals";
  const val = cond.value;
  if (op === "equals") return String(left) === String(val);
  if (op === "in") {
    // val may be comma-separated or array-like
    const set = Array.isArray(val)
      ? val
      : String(val)
          .split(",")
          .map((s) => s.trim());
    return set.indexOf(String(left)) !== -1;
  }
  if (op === "lessThan") return Number(left) < Number(val);
  if (op === "greaterThanOrEqual") return Number(left) >= Number(val);
  return false;
}

export async function loadRules(): Promise<Rule[]> {
  const q = `*[_type == "personalizationRule" && enabled == true]{_id, name, description, enabled, conditions[], actions[]}`;
  try {
    const rows = (await fetchCMS<Rule[]>(q, {})) || [];
    return rows;
  } catch (e) {
    logger.error("personalization.rules_load_failed", e);
    return [];
  }
}

export async function evaluatePersonalization(
  userContext: UserContext,
  contentCandidates: any[],
): Promise<any[]> {
  // Load rules
  const rules = await loadRules();

  // Ensure each candidate has a score and reasons
  const candidates = contentCandidates.map((c) => ({
    ...c,
    score: typeof c.score === "number" ? c.score : 0,
    reasons: [],
  }));

  for (const rule of rules) {
    const conditions = rule.conditions || [];
    const allMatch = conditions.every((cond) =>
      matchCondition(cond, userContext),
    );
    if (!allMatch) continue;

    const actions = rule.actions || [];
    for (const action of actions) {
      for (const cand of candidates) {
        // match by type and slug/key
        if (cand.type !== action.targetType) continue;
        const slug = cand.slug || cand.key || cand.id || "";
        if (!slug) continue;
        if (String(slug) !== String(action.targetSlugOrKey)) continue;
        // channel guard if present
        if (
          action.channel &&
          cand.channel &&
          String(action.channel) !== String(cand.channel)
        )
          continue;
        // apply boost
        cand.score = (cand.score || 0) + (Number(action.priorityBoost) || 0);
        cand.reasons.push({
          rule: rule.name || rule._id,
          boost: action.priorityBoost,
        });
      }
    }
  }

  // Return sorted by score desc
  return candidates.sort((a, b) => (b.score || 0) - (a.score || 0));
}

export default { loadRules, evaluatePersonalization };
