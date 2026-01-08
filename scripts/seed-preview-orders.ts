/**
 * Quick script to add orders to preview stores for heatmap testing
 */

import { PrismaClient, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function addPreviewOrders() {
  console.log("Adding orders to preview stores...");

  // Find preview tenant and stores
  const previewTenant = await prisma.tenant.findUnique({
    where: { slug: "preview-operator" },
    include: { stores: true }
  });

  if (!previewTenant) {
    console.error("Preview tenant not found");
    return;
  }

  console.log(`Found ${previewTenant.stores.length} stores`);

  // Find preview customers
  const customers = await prisma.user.findMany({
    where: {
      tenantId: previewTenant.id,
      role: "CUSTOMER"
    },
    take: 5
  });

  if (customers.length === 0) {
    console.log("No customers found, creating one...");
    const newCustomer = await prisma.user.create({
      data: {
        tenantId: previewTenant.id,
        email: `customer${Date.now()}@preview.test`,
        name: "Preview Customer",
        role: "CUSTOMER",
        passwordHash: "$2a$10$dummyhash" // Not used for demo
      }
    });
    customers.push(newCustomer);
  }

  console.log(`Found ${customers.length} customers`);

  // Create orders for each store with different volumes
  const orderDistribution = [
    { store: previewTenant.stores[0], count: 50, name: "San Francisco" }, // High activity
    { store: previewTenant.stores[1], count: 25, name: "Oakland" }, // Medium activity
    { store: previewTenant.stores[2], count: 10, name: "San Jose" } // Low activity
  ];

  const statuses: OrderStatus[] = ["PENDING", "PAID", "FULFILLED", "CANCELLED"];

  for (const dist of orderDistribution) {
    if (!dist.store) continue;

    console.log(`Creating ${dist.count} orders for ${dist.name}...`);

    for (let i = 0; i < dist.count; i++) {
      const customer = customers[i % customers.length];
      const status = i < dist.count * 0.7 ? "FULFILLED" : 
                    i < dist.count * 0.9 ? "PAID" : 
                    i < dist.count * 0.95 ? "PENDING" : "CANCELLED";
      
      // Random date in last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);

      const total = 50 + Math.random() * 200; // $50-$250

      try {
        await prisma.order.create({
          data: {
            userId: customer.id,
            storeId: dist.store.id,
            status: status as OrderStatus,
            total: parseFloat(total.toFixed(2)),
            createdAt: orderDate,
            meta: {
              source: "heatmap_test_seed"
            }
          }
        });
      } catch (error) {
        console.error(`Error creating order: ${error.message}`);
      }
    }
  }

  console.log("✅ Orders created successfully!");

  // Show summary
  const summary = await Promise.all(
    previewTenant.stores.map(async (store) => {
      const orderCount = await prisma.order.count({
        where: { storeId: store.id }
      });
      const revenue = await prisma.order.aggregate({
        where: {
          storeId: store.id,
          status: { in: ["PAID", "FULFILLED"] }
        },
        _sum: { total: true }
      });
      return {
        store: store.name,
        orders: orderCount,
        revenue: revenue._sum.total || 0
      };
    })
  );

  console.log("\n📊 Store Summary:");
  summary.forEach(s => {
    console.log(`  ${s.store}: ${s.orders} orders, $${s.revenue.toFixed(2)} revenue`);
  });
}

addPreviewOrders()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
