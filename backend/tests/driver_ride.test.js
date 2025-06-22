const request = require('supertest');
const app = require('../server');

describe('Driver and Ride Endpoints', () => {
  let driverToken, driverId, rideId;
  beforeAll(async () => {
    await request(app).post('/api/auth/driver/register').send({ name: 'Driver1', car_info: 'Car', email: 'driver1@example.com', password: 'Test1234!' });
    // Manually verify driver for test
    await app.locals.pool.query("UPDATE drivers SET verified = TRUE WHERE email = 'driver1@example.com'");
    const loginRes = await request(app).post('/api/auth/driver/login').send({ email: 'driver1@example.com', password: 'Test1234!' });
    driverToken = loginRes.body.token;
    const driverRes = await app.locals.pool.query("SELECT id FROM drivers WHERE email = 'driver1@example.com'");
    driverId = driverRes.rows[0].id;
  });
  it('should update driver location', async () => {
    const res = await request(app)
      .put(`/api/drivers/${driverId}/location`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ latitude: 40.7128, longitude: -74.0060 });
    expect(res.statusCode).toBe(200);
  });
  it('should create a ride', async () => {
    // Register and verify a user for ride
    await request(app).post('/api/auth/user/register').send({ name: 'Rider1', email: 'rider1@example.com', password: 'Test1234!' });
    await app.locals.pool.query("UPDATE users SET verified = TRUE WHERE email = 'rider1@example.com'");
    const userRes = await app.locals.pool.query("SELECT id FROM users WHERE email = 'rider1@example.com'");
    const riderId = userRes.rows[0].id;
    const res = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ rider_id: riderId, driver_id: driverId, origin: 'A', destination: 'B', status: 'requested' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
    rideId = res.body.id;
  });
});
