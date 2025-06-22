const request = require('supertest');
const app = require('../server');

describe('User API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/user/register')
      .send({ name: 'Test User', email: 'testuser@example.com', password: 'Test1234!' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
  });

  it('should not register duplicate email', async () => {
    await request(app)
      .post('/api/auth/user/register')
      .send({ name: 'Test User', email: 'testuser@example.com', password: 'Test1234!' });
    const res = await request(app)
      .post('/api/auth/user/register')
      .send({ name: 'Test User', email: 'testuser@example.com', password: 'Test1234!' });
    expect(res.statusCode).toBe(409);
  });
});
