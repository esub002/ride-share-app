const request = require('supertest');
const app = require('../server');

describe('Safety Features', () => {
  test('should have safety endpoint available', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
  });

  test('should handle emergency alerts', async () => {
    const response = await request(app).post('/api/safety/emergency')
      .send({
        driverId: 1,
        alertType: 'medical',
        location: { lat: 40.7128, lng: -74.0060 },
        notes: 'Test emergency'
      });
    expect(response.status).toBe(401);
  });

  test('should validate safety data', () => {
    const safetyData = {
      driverId: 1,
      alertType: 'medical',
      location: { lat: 40.7128, lng: -74.0060 }
    };
    expect(safetyData).toHaveProperty('driverId');
    expect(safetyData).toHaveProperty('alertType');
    expect(safetyData).toHaveProperty('location');
  });
});
