import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock Prisma client
const mockAdmins: any[] = [];
const mockInvitations: any[] = [];

vi.mock('../src/lib/prisma', () => {
  return {
    default: () => ({
      adminUser: {
        findMany: vi.fn().mockImplementation(() => Promise.resolve(mockAdmins.filter(a => !a.deletedAt))),
        findUnique: vi.fn().mockImplementation(({ where }: any) => 
          Promise.resolve(mockAdmins.find(a => a.email === where.email || a.id === where.id))
        ),
        create: vi.fn().mockImplementation(({ data }: any) => {
          const admin = { id: `admin-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
          mockAdmins.push(admin);
          return Promise.resolve(admin);
        }),
        update: vi.fn().mockImplementation(({ where, data }: any) => {
          const idx = mockAdmins.findIndex(a => a.id === where.id);
          if (idx === -1) throw { code: 'P2025' };
          mockAdmins[idx] = { ...mockAdmins[idx], ...data, updatedAt: new Date() };
          return Promise.resolve(mockAdmins[idx]);
        }),
      },
      adminInvitation: {
        create: vi.fn().mockImplementation(({ data }: any) => {
          const invitation = { id: `inv-${Date.now()}`, ...data, createdAt: new Date() };
          mockInvitations.push(invitation);
          return Promise.resolve(invitation);
        }),
      },
    }),
  };
});

vi.mock('../src/middleware/requireRole', () => {
  return {
    requireRole: () => (_req: any, _res: any, next: any) => {
      // Set mock admin on request
      (_req as any).admin = { 
        id: 'test-admin',
        email: 'test@example.com', 
        role: 'OWNER',
        organizationSlug: 'test-org'
      };
      next();
    },
  };
});

vi.mock('../src/lib/email', () => ({
  sendInvitationEmail: vi.fn().mockResolvedValue(undefined),
}));

import adminUsersRouter from '../src/routes/adminUsers';

describe('adminUsers router', () => {
  let app: express.Express;

  beforeAll(() => {
    // Clear mocks
    mockAdmins.length = 0;
    mockInvitations.length = 0;

    app = express();
    app.use(express.json());
    // mount the router under /
    app.use('/', adminUsersRouter);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('lists admins (initially empty)', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('admins');
    expect(Array.isArray(res.body.admins)).toBe(true);
    expect(res.body.admins.length).toBe(0);
  });

  it('invites a new admin', async () => {
    const res = await request(app).post('/invite').send({ 
      email: 'x@example.com',
      role: 'EDITOR'  // Required field per Zod validation
    });
    expect([200,201]).toContain(res.status);
    expect(res.body).toHaveProperty('invitation');
    expect(res.body.invitation.email).toBe('x@example.com');
  });

  it('updates an admin role', async () => {
    // First, create an admin via the mock
    mockAdmins.push({
      id: 'admin-update-test',
      email: 'update@example.com',
      role: 'EDITOR',
      organizationSlug: 'test-org',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const res = await request(app).put('/admin-update-test').send({ role: 'VIEWER' });
    expect(res.status).toBe(200);
    expect(res.body.admin.role).toBe('VIEWER');
  });

  it('deletes an admin', async () => {
    // Create an admin to delete
    mockAdmins.push({
      id: 'admin-delete-test',
      email: 'delete@example.com',
      role: 'EDITOR',
      organizationSlug: 'test-org',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const res = await request(app).delete('/admin-delete-test');
    expect(res.status).toBe(200);
    // Verify soft delete
    const deleted = mockAdmins.find(a => a.id === 'admin-delete-test');
    expect(deleted?.deletedAt).toBeDefined();
  });
});
