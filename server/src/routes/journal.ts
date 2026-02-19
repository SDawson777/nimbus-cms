import { randomUUID } from "crypto";
import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { JWT_SECRET } from "../config/env";
import { createWriteClient } from "../lib/cms";
import { logger } from "../lib/logger";
import getPrisma from "../lib/prisma";

export const journalRouter = Router();

const MAX_UPLOAD_BYTES = Number(
  process.env.JOURNAL_UPLOAD_MAX_BYTES || 5 * 1024 * 1024,
);
const ALLOWED_UPLOAD_MIME = new Set(["image/png", "image/jpeg"]);

function sanitizeText(
  input?: string | null,
  maxLen = 4000,
): string | undefined {
  if (typeof input !== "string") return undefined;
  const stripped = input
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) return undefined;
  return stripped.slice(0, maxLen);
}

function extractUserIdFromTokenPayload(payload: any): string | null {
  if (!payload || typeof payload === "string") return null;
  const candidates = [
    (payload as any).id,
    (payload as any).userId,
    payload.sub,
    (payload as any).user?.id,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0)
      return candidate;
  }
  return null;
}

function requireUserJwt(
  req: Request,
  res: Response,
  next: (error?: any) => void,
) {
  const authHeader = req.header("authorization") || req.header("Authorization");
  const token =
    typeof authHeader === "string"
      ? authHeader.replace(/^Bearer\s+/i, "").trim()
      : "";
  if (!token) {
    return res.status(401).json({ error: "AUTH_REQUIRED" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = extractUserIdFromTokenPayload(payload);
    if (!userId) {
      return res.status(401).json({ error: "INVALID_TOKEN" });
    }
    (req as any).userId = userId;
    (req as any).user = { id: userId };
    next();
  } catch {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
}

let upload: any = null;
try {
  const m = require("multer");
  upload = m({
    storage: m.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_BYTES },
  });
} catch {
  upload = null;
}

const attachedProductSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().max(4000).optional(),
  isPublic: z.boolean().default(false),
  moderationFlag: z.boolean().optional(),
});

const saveJournalSchema = z.object({
  title: z.string().max(200).optional(),
  body: z.string().max(12000).optional(),
  productId: z.string().min(1).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(4000).optional(),
  mood: z.string().max(100).optional(),
  effects: z.any().optional(),
  tags: z.array(z.string().max(60)).max(50).optional(),
  images: z.array(z.string().url()).max(20).optional(),
  drawings: z.array(z.string().url()).max(20).optional(),
  attachedProducts: z.array(attachedProductSchema).max(20).optional(),
});

const querySchema = z.object({
  search: z.string().max(120).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

function resolveDateRange(input: z.infer<typeof querySchema>) {
  if (input.date) {
    const start = new Date(`${input.date}T00:00:00.000Z`);
    const end = new Date(`${input.date}T23:59:59.999Z`);
    return { start, end };
  }

  const start = input.startDate ? new Date(input.startDate) : null;
  const end = input.endDate ? new Date(input.endDate) : null;

  return {
    start: start && !Number.isNaN(start.getTime()) ? start : null,
    end: end && !Number.isNaN(end.getTime()) ? end : null,
  };
}

function searchMatch(
  entry: any,
  searchNeedle: string,
  productIdSet: Set<string>,
): boolean {
  const haystacks = [entry.title, entry.body, entry.notes, entry?.Product?.name]
    .filter((value) => typeof value === "string")
    .map((value: string) => value.toLowerCase());
  if (haystacks.some((text) => text.includes(searchNeedle))) return true;

  const attached = Array.isArray(entry.attachedProducts)
    ? entry.attachedProducts
    : [];
  for (const item of attached) {
    const id = typeof item?.productId === "string" ? item.productId : null;
    if (id && productIdSet.has(id)) return true;
  }
  return false;
}

journalRouter.get("/", requireUserJwt, async (req: Request, res: Response) => {
  try {
    const query = querySchema.parse(req.query || {});
    const prisma = getPrisma() as any;
    const userId = (req as any).userId as string;
    const search = sanitizeText(query.search, 120)?.toLowerCase();

    const { start, end } = resolveDateRange(query);
    const createdAtFilter: any = {};
    if (start) createdAtFilter.gte = start;
    if (end) createdAtFilter.lte = end;

    const where: any = { userId };
    if (Object.keys(createdAtFilter).length) where.createdAt = createdAtFilter;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const productMatches = search
      ? await prisma.product.findMany({
          where: { name: { contains: search, mode: "insensitive" } },
          select: { id: true },
          take: 200,
        })
      : [];

    const productIdSet: Set<string> = new Set<string>(
      (productMatches as Array<{ id: string }>).map((row) => row.id),
    );

    const entries = await prisma.journalEntry.findMany({
      where,
      include: {
        Product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: query.take,
      skip: query.skip,
    });

    const filteredEntries = search
      ? entries.filter((entry: any) => searchMatch(entry, search, productIdSet))
      : entries;

    return res.json({
      entries: filteredEntries,
      count: filteredEntries.length,
      take: query.take,
      skip: query.skip,
    });
  } catch (error: any) {
    logger.error("journal.list.error", error);
    return res
      .status(400)
      .json({ error: error?.message || "FAILED_TO_FETCH_JOURNALS" });
  }
});

journalRouter.post(
  "/upload",
  requireUserJwt,
  upload ? upload.single("file") : (_req, _res, next) => next(),
  async (req: Request, res: Response) => {
    try {
      const file = (req as any).file as
        | {
            originalname: string;
            buffer: Buffer;
            size: number;
            mimetype: string;
          }
        | undefined;

      if (!file?.buffer || !file.originalname) {
        return res.status(400).json({ error: "FILE_REQUIRED" });
      }
      if (!ALLOWED_UPLOAD_MIME.has(String(file.mimetype).toLowerCase())) {
        return res.status(400).json({ error: "UNSUPPORTED_FILE_TYPE" });
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        return res.status(413).json({ error: "FILE_TOO_LARGE" });
      }

      const client = createWriteClient();
      // @ts-ignore
      const uploaded = await client.assets.upload("image", file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      const url =
        (uploaded &&
          (uploaded.url || (uploaded.asset && uploaded.asset.url))) ||
        null;
      const assetId =
        (uploaded &&
          (uploaded._id || (uploaded.asset && uploaded.asset._id))) ||
        null;

      if (!url) {
        return res.status(502).json({ error: "UPLOAD_FAILED" });
      }

      return res.json({
        ok: true,
        url,
        assetId,
        mime: file.mimetype,
        size: file.size,
      });
    } catch (error: any) {
      logger.error("journal.upload.error", error);
      return res.status(500).json({ error: "FAILED_TO_UPLOAD_FILE" });
    }
  },
);

journalRouter.post("/", requireUserJwt, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const prisma = getPrisma() as any;
    const input = saveJournalSchema.parse(req.body || {});

    const attachedProducts = (input.attachedProducts || []).map((item) => ({
      productId: item.productId,
      rating: item.rating,
      reviewText: sanitizeText(item.reviewText, 4000) || "",
      isPublic: !!item.isPublic,
      moderationFlag: item.moderationFlag,
    }));

    const productIds = Array.from(
      new Set(
        [
          input.productId,
          ...attachedProducts.map((item) => item.productId),
        ].filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0,
        ),
      ),
    );

    if (productIds.length > 0) {
      const foundProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true },
      });
      if (foundProducts.length !== productIds.length) {
        return res.status(400).json({ error: "INVALID_PRODUCT_ID" });
      }

      const purchasedRows = await prisma.orderItem.findMany({
        where: {
          productId: { in: productIds },
          Order: { userId },
        },
        select: { productId: true },
      });
      const purchasedSet = new Set(
        purchasedRows.map((row: any) => row.productId),
      );
      const missingPurchased = productIds.filter((id) => !purchasedSet.has(id));
      if (missingPurchased.length > 0) {
        return res.status(403).json({
          error: "PRODUCT_NOT_PURCHASED",
          productIds: missingPurchased,
        });
      }
    }

    const created = await prisma.journalEntry.create({
      data: {
        id: randomUUID(),
        userId,
        productId: input.productId,
        title: sanitizeText(input.title, 200),
        body: sanitizeText(input.body, 12000),
        rating: input.rating,
        notes: sanitizeText(input.notes, 4000),
        mood: sanitizeText(input.mood, 100),
        effects: input.effects,
        tags: (input.tags || [])
          .map((tag) => sanitizeText(tag, 60))
          .filter(Boolean),
        images: input.images || [],
        drawings: input.drawings || [],
        attachedProducts,
      },
    });

    const publicReviewCandidates = attachedProducts.filter(
      (item) => item.isPublic,
    );
    let reviewsCreated = 0;

    for (const item of publicReviewCandidates) {
      await prisma.review.create({
        data: {
          id: randomUUID(),
          userId,
          productId: item.productId,
          rating: item.rating,
          comment: item.reviewText || null,
          updatedAt: new Date(),
          meta: {
            source: "journal_entry",
            journalEntryId: created.id,
            moderationFlag: item.moderationFlag ?? false,
          },
        },
      });
      reviewsCreated += 1;
    }

    return res.status(201).json({ entry: created, reviewsCreated });
  } catch (error: any) {
    logger.error("journal.save.error", error);
    return res
      .status(400)
      .json({ error: error?.message || "FAILED_TO_SAVE_JOURNAL" });
  }
});

export default journalRouter;
