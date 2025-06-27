// Server tests that don't require database connection
const request = require('supertest');

// Mock the database connection
jest.mock('../db', () => ({
  query: jest.fn((sql, params, callback) => {
    if (callback) {
      callback(null, { rows: [{ now: new Date() }] });
    }
    return Promise.resolve({ rows: [{ now: new Date() }] });
  })
}));

// Mock socket.io
jest.mock('socket.io', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
  }));
});

describe('Server Tests', () => {
  let app;

  beforeAll(() => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    
    // Import app after setting environment
    app = require('../server');
  });

  test('should have basic server setup', () => {
    expect(app).toBeDefined();
  });

  test('should handle basic request', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('should have proper middleware setup', () => {
    expect(app._router).toBeDefined();
  });
}); 