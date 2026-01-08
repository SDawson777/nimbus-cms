/**
 * Analytics API Routes
 * Enterprise-grade analytics data endpoints
 */

import express, { Request, Response } from 'express';
import getPrisma from '../lib/prisma';

const router = express.Router();
const prisma = getPrisma();

type OrdersByDayRow = { date: string | Date; count: number };
type RevenueByDayRow = { date: string | Date; revenue: number | null };

/**
 * GET /api/v1/nimbus/analytics/:workspace/overview
 * Dashboard overview metrics
 */
router.get('/:workspace/overview', async (req, res) => {
  try {
    const { workspace } = req.params;
    const { period = '30' } = req.query; // days

    const daysAgo = Number.parseInt(String(period), 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: workspace },
      include: { stores: true }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const storeIds = tenant.stores.map(s => s.id);

    // Parallel queries for performance
    const [
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      recentOrders,
      topProducts,
      ordersByDay,
      ordersByStatus,
      revenueByDay
    ] = await Promise.all([
      // Total revenue in period
      prisma.order.aggregate({
        where: {
          storeId: { in: storeIds },
          createdAt: { gte: startDate },
          status: { in: ['PAID', 'FULFILLED'] }
        },
        _sum: { total: true }
      }),
      
      // Total orders
      prisma.order.count({
        where: {
          storeId: { in: storeIds },
          createdAt: { gte: startDate }
        }
      }),
      
      // Total customers
      prisma.user.count({
        where: {
          tenantId: tenant.id,
          role: 'CUSTOMER',
          createdAt: { gte: startDate }
        }
      }),
      
      // Active products
      prisma.product.count({
        where: {
          storeId: { in: storeIds },
          isActive: true,
          status: 'ACTIVE'
        }
      }),
      
      // Recent orders
      prisma.order.findMany({
        where: {
          storeId: { in: storeIds },
          createdAt: { gte: startDate }
        },
        include: {
          user: { select: { name: true, email: true } },
          store: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Top products by purchases
      prisma.product.findMany({
        where: {
          storeId: { in: storeIds },
          isActive: true
        },
        orderBy: { purchasesLast30d: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          brand: true,
          type: true,
          price: true,
          purchasesLast30d: true,
          imageUrl: true
        }
      }),
      
      // Orders by day
      prisma.$queryRaw<OrdersByDayRow[]>`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*)::int as count
        FROM "Order"
        WHERE "storeId" = ANY(${storeIds}::text[])
          AND "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      
      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        where: {
          storeId: { in: storeIds },
          createdAt: { gte: startDate }
        },
        _count: { id: true }
      }),
      
      // Revenue by day
      prisma.$queryRaw<RevenueByDayRow[]>`
        SELECT 
          DATE("createdAt") as date,
          SUM(total)::float as revenue
        FROM "Order"
        WHERE "storeId" = ANY(${storeIds}::text[])
          AND "createdAt" >= ${startDate}
          AND status IN ('PAID', 'FULFILLED')
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `
    ]);

    // Calculate previous period for comparison
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - daysAgo);
    
    const [prevRevenue, prevOrders, prevCustomers] = await Promise.all([
      prisma.order.aggregate({
        where: {
          storeId: { in: storeIds },
          createdAt: { gte: prevStartDate, lt: startDate },
          status: { in: ['PAID', 'FULFILLED'] }
        },
        _sum: { total: true }
      }),
      prisma.order.count({
        where: {
          storeId: { in: storeIds },
          createdAt: { gte: prevStartDate, lt: startDate }
        }
      }),
      prisma.user.count({
        where: {
          tenantId: tenant.id,
          role: 'CUSTOMER',
          createdAt: { gte: prevStartDate, lt: startDate }
        }
      })
    ]);

    // Calculate trends
    const revenueCurrent = totalRevenue._sum.total || 0;
    const revenuePrev = prevRevenue._sum.total || 0;
    const revenueTrend = revenuePrev > 0
      ? ((revenueCurrent - revenuePrev) / revenuePrev * 100)
      : 0;

    const ordersTrend = prevOrders > 0
      ? ((totalOrders - prevOrders) / prevOrders * 100)
      : 0;

    const customersTrend = prevCustomers > 0
      ? ((totalCustomers - prevCustomers) / prevCustomers * 100)
      : 0;

    // Format response
    const analytics = {
      period: {
        days: daysAgo,
        start: startDate.toISOString(),
        end: new Date().toISOString()
      },
      metrics: {
        revenue: {
          current: revenueCurrent,
          previous: revenuePrev,
          trend: Number(revenueTrend.toFixed(1)),
          formatted: `$${revenueCurrent.toFixed(2)}`
        },
        orders: {
          current: totalOrders,
          previous: prevOrders,
          trend: Number(ordersTrend.toFixed(1))
        },
        customers: {
          current: totalCustomers,
          previous: prevCustomers,
          trend: Number(customersTrend.toFixed(1))
        },
        products: {
          current: totalProducts
        },
        avgOrderValue: {
          current: totalOrders > 0 ? (revenueCurrent / totalOrders).toFixed(2) : 0
        }
      },
      charts: {
        ordersByDay: ordersByDay.map(row => ({
          date: row.date,
          count: row.count
        })),
        revenueByDay: revenueByDay.map(row => ({
          date: row.date,
          revenue: Number(row.revenue ?? 0)
        })),
        ordersByStatus: ordersByStatus.map(group => ({
          status: group.status,
          count: group._count.id
        }))
      },
      topProducts: topProducts.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        type: p.type,
        price: p.price,
        sales: p.purchasesLast30d || 0,
        revenue: ((p.purchasesLast30d || 0) * p.price).toFixed(2),
        imageUrl: p.imageUrl
      })),
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        total: o.total,
        status: o.status,
        customer: o.user?.name || o.user?.email || 'Guest',
        store: o.store.name,
        createdAt: o.createdAt
      }))
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Analytics overview error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics', 
      details: message 
    });
  }
});

/**
 * GET /api/v1/nimbus/analytics/:workspace/products
 * Product performance metrics
 */
router.get('/:workspace/products', async (req, res) => {
  try {
    const { workspace } = req.params;
    const { limit = 20 } = req.query;

    const tenant = await prisma.tenant.findUnique({
      where: { slug: workspace },
      include: { stores: true }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const storeIds = tenant.stores.map(s => s.id);

    const products = await prisma.product.findMany({
      where: {
        storeId: { in: storeIds },
        isActive: true
      },
      include: {
        _count: {
          select: { reviews: true, orderItems: true }
        },
        reviews: {
          select: { rating: true }
        }
      },
      orderBy: { purchasesLast30d: 'desc' },
      take: Number.parseInt(String(limit), 10)
    });

    const formatted = products.map(p => {
      const avgRating = p.reviews.length > 0
        ? (p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length)
        : 0;

      return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        type: p.type,
        category: p.category,
        price: p.price,
        status: p.status,
        sales: p.purchasesLast30d || 0,
        revenue: ((p.purchasesLast30d || 0) * p.price).toFixed(2),
        reviews: p._count.reviews,
        avgRating: Number(avgRating.toFixed(1)),
        imageUrl: p.imageUrl
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Product analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch product analytics' });
  }
});

/**
 * GET /api/v1/nimbus/analytics/:workspace/stores
 * Store-level analytics with engagement metrics for heatmap integration
 */
router.get('/:workspace/stores', async (req, res) => {
  try {
    const { workspace } = req.params;
    const { period = '30' } = req.query;

    const daysAgo = Number.parseInt(String(period), 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const tenant = await prisma.tenant.findUnique({
      where: { slug: workspace },
      include: { stores: true }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Get analytics for each store
    const storeAnalytics = await Promise.all(
      tenant.stores.map(async (store) => {
        const [orderCount, revenue, customerCount] = await Promise.all([
          prisma.order.count({
            where: {
              storeId: store.id,
              createdAt: { gte: startDate },
              status: { in: ['PAID', 'FULFILLED'] }
            }
          }),
          prisma.order.aggregate({
            where: {
              storeId: store.id,
              createdAt: { gte: startDate },
              status: { in: ['PAID', 'FULFILLED'] }
            },
            _sum: { total: true }
          }),
          prisma.order.groupBy({
            by: ['userId'],
            where: {
              storeId: store.id,
              createdAt: { gte: startDate }
            }
          })
        ]);

        const totalRevenue = revenue._sum.total || 0;
        const uniqueCustomers = customerCount.length;

        // Calculate engagement score (0-1000 scale for heatmap)
        // Weighted: 40% revenue, 40% orders, 20% customers
        const revenueScore = Math.min(1000, totalRevenue / 100);
        const orderScore = Math.min(1000, orderCount * 10);
        const customerScore = Math.min(1000, uniqueCustomers * 20);
        const engagement = Math.round(
          (revenueScore * 0.4) + (orderScore * 0.4) + (customerScore * 0.2)
        );

        return {
          id: store.id,
          slug: store.slug,
          name: store.name,
          latitude: store.latitude,
          longitude: store.longitude,
          address: {
            address1: store.address1,
            city: store.city,
            state: store.state,
            postalCode: store.postalCode,
            country: store.country
          },
          metrics: {
            orders: orderCount,
            revenue: totalRevenue,
            customers: uniqueCustomers,
            avgOrderValue: orderCount > 0 ? (totalRevenue / orderCount).toFixed(2) : 0
          },
          engagement, // For heatmap visualization
          status: store.status
        };
      })
    );

    // Sort by engagement
    const sorted = storeAnalytics.sort((a, b) => b.engagement - a.engagement);

    res.json({
      success: true,
      data: {
        stores: sorted,
        summary: {
          totalStores: sorted.length,
          activeStores: sorted.filter(s => s.status === 'active').length,
          totalOrders: sorted.reduce((sum, s) => sum + s.metrics.orders, 0),
          totalRevenue: sorted.reduce((sum, s) => sum + s.metrics.revenue, 0),
          topPerformer: sorted[0]?.name || null
        }
      }
    });
  } catch (error) {
    console.error('Store analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch store analytics' });
  }
});

export { router as analyticsDataRouter };
export default router;
