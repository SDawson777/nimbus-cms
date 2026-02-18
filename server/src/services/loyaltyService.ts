import IORedis, { Redis } from "ioredis";
import getPrisma from "../lib/prisma";
import { fetchCMS } from "../lib/cms";
import { logger } from "../lib/logger";

type Scope = {
  organization?: string;
  brand?: string;
  store?: string;
};

type LoyaltyTierDoc = {
  _id: string;
  name: string;
  minPoints: number;
  multiplier?: number;
  icon?: { asset?: { url?: string } };
  color?: string;
  active?: boolean;
  enabled?: boolean;
  legalVersion?: string;
  schedule?: { startAt?: string; endAt?: string };
  organization?: { slug?: { current?: string } };
  brand?: { slug?: { current?: string } };
  stores?: Array<{ slug?: { current?: string } }>;
};

type LoyaltyRuleDoc = {
  _id: string;
  type: "dollar" | "product" | "order" | "quiz";
  points: number;
  productId?: string;
  quizId?: string;
  active?: boolean;
  enabled?: boolean;
  legalVersion?: string;
  schedule?: { startAt?: string; endAt?: string };
  organization?: { slug?: { current?: string } };
  brand?: { slug?: { current?: string } };
  stores?: Array<{ slug?: { current?: string } }>;
};

type LoyaltyRewardDoc = {
  _id: string;
  title: string;
  description?: string;
  costPoints: number;
  rewardType: "dollar_off" | "percent_off" | "free_product" | "gear";
  discountValue?: number;
  tierRequired?: { _id?: string; name?: string };
  image?: { asset?: { url?: string } };
  active?: boolean;
  enabled?: boolean;
  legalVersion?: string;
  startDate?: string;
  endDate?: string;
  schedule?: { startAt?: string; endAt?: string };
  organization?: { slug?: { current?: string } };
  brand?: { slug?: { current?: string } };
  stores?: Array<{ slug?: { current?: string } }>;
};

type LoyaltyConfig = {
  tiers: LoyaltyTierDoc[];
  rules: LoyaltyRuleDoc[];
  rewards: LoyaltyRewardDoc[];
  redemptionRules: {
    minimumPointsToRedeem: number;
    allowPartialRedemption: boolean;
  };
  legalVersion: string;
  lastSync: string;
};

type CalculateInput = Scope & {
  userId: string;
  orderTotal?: number;
  productIds?: string[];
  quizId?: string;
};

type RedeemInput = Scope & {
  userId: string;
  rewardId: string;
  quantity?: number;
  legalVersionAccepted?: string;
};

const MEMORY_CACHE = new Map<string, { value: any; expiresAt: number }>();
const CONFIG_TTL_MS = 5 * 60 * 1000;
const USER_TTL_MS = 60 * 1000;
const TIER_TTL_MS = 10 * 60 * 1000;

let redisClient: Redis | null = null;
if (process.env.REDIS_URL) {
  try {
    redisClient = new IORedis(process.env.REDIS_URL);
  } catch (error) {
    logger.warn("loyalty.redis.init_failed", error as any);
    redisClient = null;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function isWithinSchedule(schedule?: { startAt?: string; endAt?: string }) {
  if (!schedule) return true;
  const now = Date.now();
  if (schedule.startAt && new Date(schedule.startAt).getTime() > now)
    return false;
  if (schedule.endAt && new Date(schedule.endAt).getTime() < now) return false;
  return true;
}

function readMemory<T>(key: string): T | null {
  const entry = MEMORY_CACHE.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    MEMORY_CACHE.delete(key);
    return null;
  }
  return entry.value as T;
}

function writeMemory(key: string, value: any, ttlMs: number) {
  MEMORY_CACHE.set(key, { value, expiresAt: Date.now() + ttlMs });
}

async function readCache<T>(key: string): Promise<T | null> {
  const memory = readMemory<T>(key);
  if (memory) return memory;
  if (!redisClient) return null;
  try {
    const raw = await redisClient.get(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as T;
    writeMemory(key, parsed, 15_000);
    return parsed;
  } catch {
    return null;
  }
}

async function writeCache(key: string, value: any, ttlMs: number) {
  writeMemory(key, value, ttlMs);
  if (!redisClient) return;
  try {
    await redisClient.set(key, JSON.stringify(value), "PX", ttlMs);
  } catch (error) {
    logger.warn("loyalty.cache.write_failed", error as any);
  }
}

async function invalidatePattern(pattern: string) {
  for (const key of Array.from(MEMORY_CACHE.keys())) {
    if (key.startsWith(pattern)) MEMORY_CACHE.delete(key);
  }
  if (!redisClient) return;
  try {
    const keys = await redisClient.keys(`${pattern}*`);
    if (keys.length) await redisClient.del(...keys);
  } catch (error) {
    logger.warn("loyalty.cache.invalidate_failed", error as any);
  }
}

function scopeKey(scope: Scope) {
  return `${scope.organization || "*"}:${scope.brand || "*"}:${scope.store || "*"}`;
}

function scoped<
  T extends {
    organization?: any;
    brand?: any;
    stores?: any[];
    active?: boolean;
    enabled?: boolean;
    schedule?: any;
    startDate?: string;
    endDate?: string;
  },
>(docs: T[], scope: Scope): T[] {
  const now = Date.now();
  return docs.filter((doc) => {
    if (doc.active === false || doc.enabled === false) return false;
    if (doc.schedule && !isWithinSchedule(doc.schedule)) return false;
    if (doc.startDate && new Date(doc.startDate).getTime() > now) return false;
    if (doc.endDate && new Date(doc.endDate).getTime() < now) return false;

    const orgSlug = doc.organization?.slug?.current;
    const brandSlug = doc.brand?.slug?.current;
    const storeSlugs = (doc.stores || [])
      .map((store) => store?.slug?.current)
      .filter(Boolean);

    if (scope.organization && orgSlug && orgSlug !== scope.organization)
      return false;
    if (scope.brand && brandSlug && brandSlug !== scope.brand) return false;
    if (
      scope.store &&
      storeSlugs.length > 0 &&
      !storeSlugs.includes(scope.store)
    )
      return false;

    return true;
  });
}

async function loadTiersFromCMS(scope: Scope): Promise<LoyaltyTierDoc[]> {
  const docs = await fetchCMS<LoyaltyTierDoc[]>(
    `*[_type=="loyaltyTier"] | order(minPoints asc){
      _id,
      name,
      minPoints,
      multiplier,
      icon{asset->{url}},
      color,
      active,
      enabled,
      legalVersion,
      schedule{startAt,endAt},
      organization->{"slug": slug},
      brand->{"slug": slug},
      stores[]->{"slug": slug}
    }`,
    {},
  );
  return scoped(docs || [], scope);
}

async function loadRulesFromCMS(scope: Scope): Promise<LoyaltyRuleDoc[]> {
  const docs = await fetchCMS<LoyaltyRuleDoc[]>(
    `*[_type=="loyaltyRule"] | order(_updatedAt desc){
      _id,
      type,
      points,
      productId,
      quizId,
      active,
      enabled,
      legalVersion,
      schedule{startAt,endAt},
      organization->{"slug": slug},
      brand->{"slug": slug},
      stores[]->{"slug": slug}
    }`,
    {},
  );
  return scoped(docs || [], scope);
}

async function loadRewardsFromCMS(scope: Scope): Promise<LoyaltyRewardDoc[]> {
  const docs = await fetchCMS<LoyaltyRewardDoc[]>(
    `*[_type=="loyaltyReward"] | order(costPoints asc){
      _id,
      title,
      description,
      costPoints,
      rewardType,
      discountValue,
      tierRequired->{_id,name},
      image{asset->{url}},
      active,
      enabled,
      legalVersion,
      startDate,
      endDate,
      schedule{startAt,endAt},
      organization->{"slug": slug},
      brand->{"slug": slug},
      stores[]->{"slug": slug}
    }`,
    {},
  );
  return scoped(docs || [], scope);
}

export async function getLoyaltyConfig(scope: Scope): Promise<LoyaltyConfig> {
  const key = `loyalty:config:${scopeKey(scope)}`;
  const cached = await readCache<LoyaltyConfig>(key);
  if (cached) return cached;

  const [tiers, rules, rewards] = await Promise.all([
    loadTiersFromCMS(scope),
    loadRulesFromCMS(scope),
    loadRewardsFromCMS(scope),
  ]);

  const legalVersion = [
    ...tiers.map((tier) => tier.legalVersion || ""),
    ...rules.map((rule) => rule.legalVersion || ""),
    ...rewards.map((reward) => reward.legalVersion || ""),
  ]
    .filter(Boolean)
    .sort();
  const resolvedLegalVersion = legalVersion.length
    ? legalVersion[legalVersion.length - 1]
    : "v1";

  const config: LoyaltyConfig = {
    tiers,
    rules,
    rewards,
    redemptionRules: {
      minimumPointsToRedeem:
        Math.min(
          ...rewards.map((reward) => reward.costPoints || Infinity),
          0,
        ) || 0,
      allowPartialRedemption: false,
    },
    legalVersion: resolvedLegalVersion,
    lastSync: nowIso(),
  };

  await writeCache(key, config, CONFIG_TTL_MS);
  return config;
}

export async function getLoyaltyTiers(scope: Scope) {
  const key = `loyalty:tiers:${scopeKey(scope)}`;
  const cached = await readCache<LoyaltyTierDoc[]>(key);
  if (cached) return cached;
  const tiers = await loadTiersFromCMS(scope);
  await writeCache(key, tiers, TIER_TTL_MS);
  return tiers;
}

export async function getLoyaltyRewards(scope: Scope) {
  const key = `loyalty:rewards:${scopeKey(scope)}`;
  const cached = await readCache<LoyaltyRewardDoc[]>(key);
  if (cached) return cached;
  const rewards = await loadRewardsFromCMS(scope);
  await writeCache(key, rewards, CONFIG_TTL_MS);
  return rewards;
}

async function getOrCreateAccount(userId: string) {
  const key = `loyalty:user:${userId}`;
  const cached = await readCache<any>(key);
  if (cached) return cached;

  const prisma = getPrisma() as any;
  const account = await prisma.loyaltyAccount.upsert({
    where: { userId },
    create: { userId, points: 0 },
    update: {},
  });

  await writeCache(key, account, USER_TTL_MS);
  return account;
}

function resolveTier(points: number, tiers: LoyaltyTierDoc[]) {
  let current: LoyaltyTierDoc | null = null;
  for (const tier of tiers) {
    if (points >= (tier.minPoints || 0)) current = tier;
  }
  return current;
}

function calculateRulePoints(
  input: CalculateInput,
  rule: LoyaltyRuleDoc,
): number {
  if (!rule.active || !rule.points) return 0;
  if (rule.type === "dollar") {
    return Math.floor((input.orderTotal || 0) * rule.points);
  }
  if (rule.type === "product") {
    if (!rule.productId) return 0;
    return (input.productIds || []).includes(rule.productId) ? rule.points : 0;
  }
  if (rule.type === "order") {
    return input.orderTotal && input.orderTotal > 0 ? rule.points : 0;
  }
  if (rule.type === "quiz") {
    if (!input.quizId) return 0;
    if (!rule.quizId) return rule.points;
    return rule.quizId === input.quizId ? rule.points : 0;
  }
  return 0;
}

async function logTransaction(payload: {
  userId: string;
  type: string;
  points: number;
  metadata?: Record<string, any>;
}) {
  const prisma = getPrisma() as any;
  return prisma.loyaltyTransaction.create({
    data: {
      userId: payload.userId,
      type: payload.type,
      points: payload.points,
      amount: payload.points,
      description: payload.type,
      metadata: payload.metadata || {},
    },
  });
}

export async function calculateLoyalty(input: CalculateInput) {
  const prisma = getPrisma() as any;
  const config = await getLoyaltyConfig(input);
  const account = await getOrCreateAccount(input.userId);
  const tier = resolveTier(account.points, config.tiers);
  const multiplier = Number(tier?.multiplier || 1);

  const breakdown = config.rules.map((rule) => {
    const rawPoints = calculateRulePoints(input, rule);
    return {
      ruleId: rule._id,
      type: rule.type,
      rawPoints,
      adjustedPoints: Math.floor(rawPoints * multiplier),
    };
  });

  const pointsToAward = breakdown.reduce(
    (sum, item) => sum + item.adjustedPoints,
    0,
  );

  if (pointsToAward > 0) {
    await prisma.loyaltyAccount.update({
      where: { userId: input.userId },
      data: { points: { increment: pointsToAward } },
    });

    await logTransaction({
      userId: input.userId,
      type: input.quizId ? "earn_quiz" : "earn",
      points: pointsToAward,
      metadata: {
        orderTotal: input.orderTotal,
        productIds: input.productIds,
        quizId: input.quizId,
        tier: tier?.name || null,
        multiplier,
        breakdown,
      },
    });

    await invalidatePattern(`loyalty:user:${input.userId}`);
    await invalidatePattern("loyalty:config:");
  }

  const updated = await getOrCreateAccount(input.userId);
  const updatedTier = resolveTier(updated.points, config.tiers);

  return {
    userId: input.userId,
    pointsAwarded: pointsToAward,
    pointsBalance: updated.points,
    tier: updatedTier ? { id: updatedTier._id, name: updatedTier.name } : null,
    multiplier,
    breakdown,
    legalVersion: config.legalVersion,
  };
}

export async function redeemLoyaltyReward(input: RedeemInput) {
  const prisma = getPrisma() as any;
  const quantity = Math.max(1, Number(input.quantity || 1));
  const config = await getLoyaltyConfig(input);
  const reward = config.rewards.find((item) => item._id === input.rewardId);

  if (!reward) {
    throw new Error("LOYALTY_REWARD_NOT_FOUND");
  }

  if (
    input.legalVersionAccepted &&
    input.legalVersionAccepted !== config.legalVersion
  ) {
    throw new Error("LOYALTY_LEGAL_VERSION_MISMATCH");
  }

  const account = await getOrCreateAccount(input.userId);
  const tier = resolveTier(account.points, config.tiers);
  const totalCost = reward.costPoints * quantity;

  if (
    reward.tierRequired?._id &&
    (!tier || tier._id !== reward.tierRequired._id)
  ) {
    throw new Error("LOYALTY_TIER_NOT_ELIGIBLE");
  }

  if (account.points < totalCost) {
    throw new Error("LOYALTY_INSUFFICIENT_POINTS");
  }

  await prisma.loyaltyAccount.update({
    where: { userId: input.userId },
    data: { points: { decrement: totalCost } },
  });

  const tx = await logTransaction({
    userId: input.userId,
    type: "redeem",
    points: -totalCost,
    metadata: {
      rewardId: reward._id,
      rewardType: reward.rewardType,
      quantity,
      costPoints: reward.costPoints,
      legalVersion: config.legalVersion,
    },
  });

  await invalidatePattern(`loyalty:user:${input.userId}`);
  await invalidatePattern("loyalty:config:");

  const updated = await getOrCreateAccount(input.userId);

  return {
    success: true,
    transactionId: tx.id,
    reward: {
      id: reward._id,
      title: reward.title,
      rewardType: reward.rewardType,
      discountValue: reward.discountValue,
      quantity,
    },
    pointsSpent: totalCost,
    pointsBalance: updated.points,
    legalVersion: config.legalVersion,
  };
}

export async function awardQuizPoints(
  input: Scope & { userId: string; quizId: string },
) {
  return calculateLoyalty({
    ...input,
    quizId: input.quizId,
  });
}

export async function invalidateLoyaltyCaches(userId?: string) {
  await invalidatePattern("loyalty:config:");
  await invalidatePattern("loyalty:tiers:");
  await invalidatePattern("loyalty:rewards:");
  if (userId) await invalidatePattern(`loyalty:user:${userId}`);
}
