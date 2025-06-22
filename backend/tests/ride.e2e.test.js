const request = require('supertest');
const app = require('../server');

describe('Ride API End-to-End', () => {
  let userToken, driverToken, rideId;

  beforeAll(async () => {
    // Register and login a user
    await request(app).post('/api/auth/user/register').send({ name: 'Test User', email: 'user@test.com', password: 'test123' });
    const userLogin = await request(app).post('/api/auth/user/login').send({ email: 'user@test.com', password: 'test123' });
    userToken = userLogin.body.token;
    // Register and login a driver
    await request(app).post('/api/auth/driver/register').send({ name: 'Test Driver', email: 'driver@test.com', password: 'test123', car_info: 'Test Car' });
    const driverLogin = await request(app).post('/api/auth/driver/login').send({ email: 'driver@test.com', password: 'test123' });
    driverToken = driverLogin.body.token;
    // Set driver available and location
    await request(app).patch('/api/drivers/1/availability').set('Authorization', `Bearer ${driverToken}`).send({ available: true });
    await request(app).post('/api/drivers/1/location').set('Authorization', `Bearer ${driverToken}`).send({ latitude: 40.7128, longitude: -74.006 });
  });

  it('should create a ride and assign a driver', async () => {
    const res = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ origin: 'A', destination: 'B' });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('requested');
    expect(res.body.driver_id).toBeDefined();
    rideId = res.body.id;
  });

  it('should update ride status to accepted', async () => {
    const res = await request(app)
      .patch(`/api/rides/${rideId}/status`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'accepted' });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('accepted');
  });

  it('should update ride status to completed', async () => {
    const res = await request(app)
      .patch(`/api/rides/${rideId}/status`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'completed' });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('completed');
  });
});
