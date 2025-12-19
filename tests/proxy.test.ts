import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';

let server: any;
beforeAll((done) => {
  // ensure MAPBOX_TOKEN is set for predictable response
  process.env.MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || 'test-token';
  server = app.listen(0, done);
});
afterAll((done) => {
  server.close(done);
});

describe('Proxy endpoints', () => {
  it('returns mapbox token status', async () => {
    const res = await request(server).get('/api/v1/nimbus/proxy/mapbox/has_token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('enabled');
    expect(typeof res.body.enabled).toBe('boolean');
  });
});
