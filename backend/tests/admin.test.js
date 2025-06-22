const request = require('supertest');
const app = require('../server');

describe('Admin Analytics Endpoint', () => {
  it('should require admin auth for analytics', async () => {
    const res = await request(app).get('/api/admin/analytics');
    expect(res.statusCode).toBe(401);
  });
  // Add more admin tests as needed, e.g., with a valid admin token
});
