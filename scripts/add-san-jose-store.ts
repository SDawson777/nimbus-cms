import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSanJoseStore() {
  const previewTenant = await prisma.tenant.findUnique({ 
    where: { slug: 'preview-operator' } 
  });
  
  if (!previewTenant) {
    console.error('Preview tenant not found');
    return;
  }
  
  const store = await prisma.store.upsert({
    where: { tenantId_slug: { tenantId: previewTenant.id, slug: 'san-jose' } },
    update: {
      latitude: 37.3382,
      longitude: -121.8863
    },
    create: {
      tenantId: previewTenant.id,
      slug: 'san-jose',
      name: 'San Jose',
      address1: '300 South Ave',
      city: 'San Jose',
      state: 'CA',
      postalCode: '95113',
      country: 'US',
      latitude: 37.3382,
      longitude: -121.8863,
      phone: '+1-555-0302',
      timezone: 'America/Los_Angeles',
      isPickupEnabled: true,
      isDeliveryEnabled: true
    }
  });
  
  console.log('✅ San Jose store created:', store.id);
}

addSanJoseStore()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
