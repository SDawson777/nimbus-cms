import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import undoRouter from '../server/src/routes/undo';

const TEST_PORT = 0;
const DATA_DIR = path.join(__dirname, '..', 'server', 'server_data');
const LOG_FILE = path.join(DATA_DIR, 'undo_events.log');

let server: any;
let app: any;

beforeAll((done) => {
  app = express();
  app.use(express.json());
  // mount router without admin middleware for unit testing
  app.use('/api/v1/test/undo', undoRouter);
  server = app.listen(TEST_PORT, done);
});

afterAll(async (done) => {
  try {
    await fs.unlink(LOG_FILE);
  } catch (e) {
    // ignore
  }
  server.close(done);
});

describe('Undo routes', () => {
  it('can create, list, get and preview undo events', async () => {
    const payload = {
      action: 'content.update',
      resource: 'article',
      resourceId: 'test-1',
      before: { title: 'old' },
      after: { title: 'new' },
      createdBy: 'tester',
    };

    const createRes = await request(server)
      .post('/api/v1/test/undo/events')
      .send(payload)
      .set('Accept', 'application/json');
    expect(createRes.status).toBe(201);
    expect(createRes.body).toHaveProperty('id');
    const id = createRes.body.id;

    const listRes = await request(server).get('/api/v1/test/undo/events');
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveProperty('data');
    expect(Array.isArray(listRes.body.data)).toBe(true);

    const getRes = await request(server).get(`/api/v1/test/undo/events/${id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data).toHaveProperty('id', id);

    const previewRes = await request(server).post(
      `/api/v1/test/undo/events/${id}/preview-undo`,
    );
    expect(previewRes.status).toBe(200);
    expect(previewRes.body).toHaveProperty('inverse');

      // Execute (enqueue) the undo — should return 202 and a queued id
      const execRes = await request(server)
        .post(`/api/v1/test/undo/events/${id}/execute`)
        .send({ requestedBy: 'tester' })
        .set('Accept', 'application/json');
      expect(execRes.status).toBe(202);
      expect(execRes.body).toHaveProperty('queuedId');

      const listAfter = await request(server).get('/api/v1/test/undo/events');
      expect(listAfter.status).toBe(200);
      // there should be at least one undo.execution entry
      const execFound = (listAfter.body.data || []).some((e) => e.action === 'undo.execution');
      expect(execFound).toBe(true);
  });
});
