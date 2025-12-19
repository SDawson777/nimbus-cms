import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';

let server: any;
beforeAll((done) => {
  server = app.listen(0, done);
});
afterAll((done) => {
  server.close(done);
});

describe('Heatmap endpoint', () => {
  it('returns SVG for valid stores', async () => {
    const stores = [
      { storeSlug: 'a', longitude: -74, latitude: 40.7, engagement: 10 },
      { storeSlug: 'b', longitude: -87.6, latitude: 41.8, engagement: 20 },
    ];
    const res = await request(server)
      .post('/api/v1/nimbus/heatmap/static')
      .send({ stores, width: 800, height: 300 })
      .set('Accept', 'image/svg+xml');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/svg+xml');
    const bodyText = typeof res.text === 'string' ? res.text : (res.body ? String(res.body) : '');
    expect(bodyText).toContain('<svg');
    // should include one of the store slugs
    expect(bodyText).toContain('a');
  });

  it('validates input and rejects too-large store arrays', async () => {
    const stores = new Array(600).fill(0).map((_, i) => ({ storeSlug: String(i), longitude: 0, latitude: 0, engagement: 1 }));
    const res = await request(server).post('/api/v1/nimbus/heatmap/static').send({ stores });
    expect(res.status).toBe(400);
  });
});
