import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

/**
 * Get or create a singleton PrismaClient instance with production-ready
 * connection pooling and logging configuration.
 * 
 * Connection pooling is configured via DATABASE_URL query parameters:
 * - connection_limit: Maximum number of connections in the pool (default: 10)
 * - pool_timeout: Maximum time to wait for a connection (default: 20 seconds)
 * 
 * Example DATABASE_URL:
 * postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
 */
export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: [
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
      // Connection pooling is configured via DATABASE_URL query parameters
      // For production, ensure your DATABASE_URL includes:
      // ?connection_limit=10&pool_timeout=20
    });
    
    // Log when client is created
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ PrismaClient initialized with connection pooling');
    }
  }
  return prisma;
}

export default getPrisma;

