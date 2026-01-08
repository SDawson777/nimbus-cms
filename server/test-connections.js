#!/usr/bin/env node
/**
 * Test Redis and Database connections
 */

// Load environment variables
require('dotenv').config({ path: __dirname + '/.env' });

const IORedis = require('ioredis');
const { PrismaClient } = require('@prisma/client');

async function testConnections() {
  console.log('\n🔍 Testing Redis Connection...');
  console.log('REDIS_URL:', process.env.REDIS_URL ? '✅ Set' : '❌ Not set');
  
  // Test Redis
  if (process.env.REDIS_URL) {
    try {
      const redis = new IORedis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        connectTimeout: 5000,
      });
      
      await redis.ping();
      console.log('✅ Redis: Connected successfully');
      
      // Test set/get
      await redis.set('test_key', 'test_value', 'EX', 10);
      const value = await redis.get('test_key');
      console.log('✅ Redis: Set/Get test passed ->', value);
      
      await redis.quit();
    } catch (err) {
      console.error('❌ Redis Error:', err.message);
    }
  } else {
    console.log('⚠️  Redis: No REDIS_URL configured (optional)');
  }

  console.log('\n🔍 Testing Database Connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');
  
  // Test Database
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database: Connected successfully ->', result);

    // Check for demo data
    const tenantCount = await prisma.tenant.count();
    console.log(`✅ Database: Found ${tenantCount} tenant(s)`);

    if (tenantCount > 0) {
      const tenants = await prisma.tenant.findMany({
        select: { slug: true, name: true, sanityDataset: true },
      });
      console.log('📊 Tenants:');
      tenants.forEach(t => {
        console.log(`   - ${t.slug}: ${t.name} (dataset: ${t.sanityDataset})`);
      });
    } else {
      console.log('⚠️  No demo data found. Run: pnpm prisma:seed');
    }

    await prisma.$disconnect();
  } catch (err) {
    console.error('❌ Database Error:', err.message);
    if (err.message.includes('TLS')) {
      console.log('\n💡 TIP: Add ?sslmode=require to DATABASE_URL if using Railway/Heroku');
    }
  }

  console.log('\n✅ Connection test complete!\n');
}

testConnections().catch(console.error);
