import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

vi.mock('../src/middleware/requireRole', () => {
  return {
    requireRole: () => (_req: any, _res: any, next: any) => next(),
  };
});

import adminUsersRouter from '../src/routes/adminUsers';

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'admins.json');

describe('adminUsers router', () => {
  const backupPath = CONFIG_PATH + '.bak';
  let app: express.Express;
  const OLD_ENV = process.env;

  beforeAll(() => {
    // Force file-backed admin store for tests (avoids Prisma generate requirements)
    process.env = { ...OLD_ENV, ADMIN_STORE: 'file' };

    // backup existing config
    if (fs.existsSync(CONFIG_PATH)) fs.copyFileSync(CONFIG_PATH, backupPath);
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ admins: [] }, null, 2));

    app = express();
    app.use(express.json());
    // mount the router under /
    app.use('/', adminUsersRouter);
  });

  afterAll(() => {
    // restore backup
    if (fs.existsSync(backupPath)) fs.copyFileSync(backupPath, CONFIG_PATH);
    else fs.unlinkSync(CONFIG_PATH);

    process.env = OLD_ENV;
  });

  it('lists admins (initially empty)', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('admins');
    expect(Array.isArray(res.body.admins)).toBe(true);
    expect(res.body.admins.length).toBe(0);
  });

  it('invites a new admin', async () => {
    const res = await request(app).post('/invite').send({ email: 'x@example.com' });
    expect([200,201]).toContain(res.status);
    expect(res.body).toHaveProperty('admin');
    expect(res.body.admin.email).toBe('x@example.com');
  });

  it('updates an admin role', async () => {
    const list = await request(app).get('/');
    const id = list.body.admins[0].id;
    const res = await request(app).put(`/${id}`).send({ role: 'VIEWER' });
    expect(res.status).toBe(200);
    expect(res.body.admin.role).toBe('VIEWER');
  });

  it('deletes an admin', async () => {
    const list = await request(app).get('/');
    const id = list.body.admins[0].id;
    const res = await request(app).delete(`/${id}`);
    expect(res.status).toBe(200);
    const after = await request(app).get('/');
    expect(after.body.admins.find((a: any) => a.id === id)).toBeUndefined();
  });
});
