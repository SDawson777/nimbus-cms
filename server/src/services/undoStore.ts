import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const DATA_DIR = path.join(__dirname, '..', '..', 'server_data');
const LOG_FILE = path.join(DATA_DIR, 'undo_events.log');

export type UndoEvent = {
  id: string;
  action: string; // e.g., 'content.create', 'content.update', 'content.delete'
  resource: string; // e.g., 'article', 'product'
  resourceId?: string;
  before?: any;
  after?: any;
  meta?: Record<string, any>;
  createdAt: string;
  createdBy?: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

export async function appendEvent(event: UndoEvent) {
  await ensureDir();
  const line = JSON.stringify(event) + '\n';
  await fs.appendFile(LOG_FILE, line, { encoding: 'utf8' });
}

export async function listEvents(limit = 100, offset = 0) {
  try {
    const data = await fs.readFile(LOG_FILE, { encoding: 'utf8' });
    const lines = data.trim().split('\n').filter(Boolean);
    const items = lines.map((l) => JSON.parse(l));
    // newest last in file -> return reverse for recent-first
    const recent = items.reverse();
    return recent.slice(offset, offset + limit);
  } catch (e) {
    return [];
  }
}

export async function getEventById(id: string) {
  try {
    const data = await fs.readFile(LOG_FILE, { encoding: 'utf8' });
    const lines = data.trim().split('\n').filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      const obj = JSON.parse(lines[i]);
      if (obj.id === id) return obj as UndoEvent;
    }
    return null;
  } catch (e) {
    return null;
  }
}
