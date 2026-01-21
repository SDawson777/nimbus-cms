import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import getPrisma from '../lib/prisma';
import { logger } from '../lib/logger';

type RoleString = 'OWNER' | 'ORG_ADMIN' | 'EDITOR' | 'VIEWER';

export type AdminRecord = {
  id: string;
  email: string;
  role: RoleString | string;
  organizationSlug?: string | null;
  brandSlug?: string | null;
  storeSlug?: string | null;
};

export interface AdminStore {
  list(): Promise<AdminRecord[]>;
  invite(data: Omit<AdminRecord, 'id'>): Promise<AdminRecord>;
  update(id: string, updates: Partial<AdminRecord>): Promise<AdminRecord>;
  remove(id: string): Promise<void>;
}

// File-backed implementation (legacy/demo)
class FileAdminStore implements AdminStore {
  private configPath: string;
  constructor() {
    // Keep file-backed admin CRUD aligned with the admin auth implementation,
    // which reads from `dist/config/admins.json` at runtime.
    this.configPath = path.join(__dirname, "..", "config", "admins.json");
  }
  private read() {
    if (!fs.existsSync(this.configPath)) return { admins: [] as any[] };
    try {
      return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    } catch (e) {
      logger.error('failed.read.admins.config', e as any);
      return { admins: [] };
    }
  }
  private write(cfg: any) {
    try {
      fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
      fs.writeFileSync(this.configPath, JSON.stringify(cfg, null, 2), 'utf8');
      return true;
    } catch (e) {
      logger.error('failed.write.admins.config', e as any);
      return false;
    }
  }
  async list(): Promise<AdminRecord[]> {
    const cfg = this.read();
    return (cfg.admins || []).map((a: any) => ({
      id: a.id,
      email: a.email,
      role: a.role,
      organizationSlug: a.organizationSlug,
      brandSlug: a.brandSlug,
      storeSlug: a.storeSlug,
    }));
  }
  async invite(data: Omit<AdminRecord, 'id'>): Promise<AdminRecord> {
    const cfg = this.read();
    const exists = (cfg.admins || []).find((a: any) => a.email.toLowerCase() === String(data.email).toLowerCase());
    if (exists) throw Object.assign(new Error('ALREADY_EXISTS'), { code: 'ALREADY_EXISTS' });
    const id = String(Date.now());
    const admin = { id, ...data } as any;
    cfg.admins = cfg.admins || [];
    cfg.admins.push(admin);
    if (!this.write(cfg)) throw Object.assign(new Error('WRITE_FAILED'), { code: 'WRITE_FAILED' });
    return admin;
  }
  async update(id: string, updates: Partial<AdminRecord>): Promise<AdminRecord> {
    const cfg = this.read();
    const idx = (cfg.admins || []).findIndex((a: any) => a.id === id);
    if (idx === -1) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });
    const updated = { ...cfg.admins[idx], ...updates };
    cfg.admins[idx] = updated;
    if (!this.write(cfg)) throw Object.assign(new Error('WRITE_FAILED'), { code: 'WRITE_FAILED' });
    return updated;
  }
  async remove(id: string): Promise<void> {
    const cfg = this.read();
    const idx = (cfg.admins || []).findIndex((a: any) => a.id === id);
    if (idx === -1) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });
    cfg.admins.splice(idx, 1);
    if (!this.write(cfg)) throw Object.assign(new Error('WRITE_FAILED'), { code: 'WRITE_FAILED' });
  }
}

// Prisma-backed implementation (enterprise)
class PrismaAdminStore implements AdminStore {
  constructor(private prisma: PrismaClient) {}
  async list(): Promise<AdminRecord[]> {
    const rows = await this.prisma.adminUser.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((r: any) => ({
      id: r.id,
      email: r.email,
      role: r.role,
      organizationSlug: r.organizationSlug,
      brandSlug: r.brandSlug,
      storeSlug: r.storeSlug,
    }));
  }
  async invite(data: Omit<AdminRecord, 'id'>): Promise<AdminRecord> {
    const created = await this.prisma.adminUser.create({
      data: {
        id: crypto.randomUUID(),
        email: data.email,
        role: (data.role as any) ?? 'EDITOR',
        organizationSlug: data.organizationSlug ?? null,
        brandSlug: data.brandSlug ?? null,
        storeSlug: data.storeSlug ?? null,
        updatedAt: new Date(),
      },
    });
    return {
      id: created.id,
      email: created.email,
      role: created.role,
      organizationSlug: created.organizationSlug,
      brandSlug: created.brandSlug,
      storeSlug: created.storeSlug,
    };
  }
  async update(id: string, updates: Partial<AdminRecord>): Promise<AdminRecord> {
    const updated = await this.prisma.adminUser.update({
      where: { id },
      data: {
        email: updates.email ?? undefined,
        role: updates.role as any,
        organizationSlug: updates.organizationSlug ?? undefined,
        brandSlug: updates.brandSlug ?? undefined,
        storeSlug: updates.storeSlug ?? undefined,
      },
    });
    return {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      organizationSlug: updated.organizationSlug,
      brandSlug: updated.brandSlug,
      storeSlug: updated.storeSlug,
    };
  }
  async remove(id: string): Promise<void> {
    await this.prisma.adminUser.delete({ where: { id } });
  }
}

export function getAdminStore(): AdminStore {
  const mode = (process.env.ADMIN_STORE || '').toLowerCase();
  const hasDb = Boolean(process.env.DATABASE_URL);
  // If DATABASE_URL is present we default to Prisma, unless explicitly forced to `file`.
  if (mode === 'prisma' || (mode !== 'file' && hasDb)) {
    try {
      const prisma = getPrisma();
      return new PrismaAdminStore(prisma);
    } catch (e) {
      logger.warn('admin.store.prisma_init_failed', e as any);
      // fall through to file-backed store
    }
  }
  return new FileAdminStore();
}
