import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';

let server: any;
beforeAll((done) => {
  // No OPENAI key and no SANITY token in CI by default; ensure dry-run path works
  delete process.env.OPENAI_API_KEY;
  delete process.env.SANITY_API_TOKEN;
  server = app.listen(0, done);
});
afterAll((done) => {
  server.close(done);
});

describe('AI Drafts endpoint', () => {
  it('returns 202 preview when missing token', async () => {
    const res = await request(server)
      .post('/api/v1/nimbus/ai/drafts')
      .send({ title: 'Test Draft Title', dryRun: true })
      .set('Accept', 'application/json');
    expect(res.status).toBe(202);
    expect(res.body).toHaveProperty('previewOnly', true);
    expect(typeof res.body.studioUrl).toBe('string');
  });
});
