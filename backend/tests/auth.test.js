const request = require('supertest');
const app = require('../server');

describe('Auth and Protected Endpoints', () => {
  let token;
  beforeAll(async () => {
    await request(app).post('/api/auth/user/register').send({ name: 'User2', email: 'user2@example.com', password: 'Test1234!' });
    // Manually verify user for test
    await app.locals.pool.query("UPDATE users SET verified = TRUE WHERE email = 'user2@example.com'");
  });
  it('should login user', async () => {
    const res = await request(app)
      .post('/api/auth/user/login')
      .send({ email: 'user2@example.com', password: 'Test1234!' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });
  it('should access protected users endpoint', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
