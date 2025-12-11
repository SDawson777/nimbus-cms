import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// returns a simple report on whether demo data exists
router.get('/seed-check', async (_req, res) => {
  try {
    const tenants = await prisma.tenant.count();
    const products = await prisma.product.count();
    const orders = await prisma.order.count();
    return res.json({ ok: true, tenants, products, orders });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;
