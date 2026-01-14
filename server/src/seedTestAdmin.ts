import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

async function seed() {
  const email = process.env.E2E_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'e2e-admin@example.com';
  const password = process.env.E2E_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'e2e-password';
  const role = process.env.E2E_ADMIN_ROLE || 'OWNER';

  const cfgPath = path.join(process.cwd(), 'config', 'admins.json');
  const backupPath = `${cfgPath}.bak.${Date.now()}`;

  if (!fs.existsSync(path.dirname(cfgPath))) {
    fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
  }

  if (fs.existsSync(cfgPath)) {
    fs.copyFileSync(cfgPath, backupPath);
    console.log('Backed up existing admins.json to', backupPath);
  } else {
    console.log('admins.json not found; will create new at', cfgPath);
  }

  let cfg = { admins: [] as any[] };
  try {
    if (fs.existsSync(cfgPath)) {
      const raw = fs.readFileSync(cfgPath, 'utf8');
      cfg = JSON.parse(raw || '{"admins":[]}');
    }
  } catch (e) {
    console.warn('Failed to parse admins.json; starting fresh');
    cfg = { admins: [] };
  }

  cfg.admins = (cfg.admins || []).filter((a) => a.email !== email);

  const id = process.env.E2E_ADMIN_ID || `e2e-${Date.now()}`;
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = {
    id,
    email,
    passwordHash,
    role,
    organizationSlug: process.env.E2E_ORG || 'e2e-org',
  };

  cfg.admins.unshift(admin);

  // Optionally seed a secondary admin (useful for RBAC/e2e tests)
  const secondaryEmail = process.env.E2E_ADMIN_SECONDARY_EMAIL;
  if (secondaryEmail) {
    const secondaryRole = process.env.E2E_ADMIN_SECONDARY_ROLE || 'EDITOR';
    const secondaryPassword = process.env.E2E_ADMIN_SECONDARY_PASSWORD || secondaryEmail.split('@')[0] + '-pass';
    const secondaryId = process.env.E2E_ADMIN_SECONDARY_ID || `e2e-secondary-${Date.now()}`;
    const secondaryHash = await bcrypt.hash(secondaryPassword, 10);
    // remove any existing same-email entry
    cfg.admins = cfg.admins.filter((a) => a.email !== secondaryEmail);
    cfg.admins.unshift({
      id: secondaryId,
      email: secondaryEmail,
      passwordHash: secondaryHash,
      role: secondaryRole,
      organizationSlug: process.env.E2E_ORG || 'e2e-org',
    });
    console.log('Seeded secondary admin:', secondaryEmail, 'role:', secondaryRole);
  }

  // Optionally seed a viewer user (for RBAC e2e tests)
  const viewerEmail = process.env.E2E_VIEWER_EMAIL;
  if (viewerEmail) {
    const viewerPassword = process.env.E2E_VIEWER_PASSWORD || 'e2e-viewer-pass';
    const viewerId = process.env.E2E_VIEWER_ID || `e2e-viewer-${Date.now()}`;
    const viewerHash = await bcrypt.hash(viewerPassword, 10);
    // remove any existing same-email entry
    cfg.admins = cfg.admins.filter((a) => a.email !== viewerEmail);
    cfg.admins.unshift({
      id: viewerId,
      email: viewerEmail,
      passwordHash: viewerHash,
      role: 'VIEWER',
      organizationSlug: process.env.E2E_ORG || 'e2e-org',
    });
    console.log('Seeded viewer admin:', viewerEmail, 'role: VIEWER');
  }

  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), 'utf8');
  console.log('Seeded admin:', email);
  return { cfgPath, backupPath };
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('seedTestAdmin failed', err);
    process.exit(1);
  });
}

export default seed;
