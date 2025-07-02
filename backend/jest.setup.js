// Jest setup file
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/ride_share_test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.PORT = '3001';

// Mock database connection for tests
const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn()
};

// Mock the database module
jest.mock('./db', () => mockPool);

// Mock Redis/ioredis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(true),
    setex: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    info: jest.fn().mockResolvedValue('redis_version:6.0.0'),
    ping: jest.fn().mockResolvedValue('PONG')
  }));
});

// Mock the cache utility
jest.mock('./utils/cache', () => ({
  CacheManager: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(true),
    cacheApiResponse: jest.fn().mockResolvedValue(true),
    getApiResponse: jest.fn().mockResolvedValue(null),
    cacheQueryResult: jest.fn().mockResolvedValue(true),
    getQueryResult: jest.fn().mockResolvedValue(null),
    setSession: jest.fn().mockResolvedValue(true),
    getSession: jest.fn().mockResolvedValue(null),
    deleteSession: jest.fn().mockResolvedValue(true),
    cacheRealtimeData: jest.fn().mockResolvedValue(true),
    getRealtimeData: jest.fn().mockResolvedValue(null),
    cacheUserData: jest.fn().mockResolvedValue(true),
    getUserData: jest.fn().mockResolvedValue(null),
    cacheDriverData: jest.fn().mockResolvedValue(true),
    getDriverData: jest.fn().mockResolvedValue(null),
    cacheRideData: jest.fn().mockResolvedValue(true),
    getRideData: jest.fn().mockResolvedValue(null),
    cacheLocationData: jest.fn().mockResolvedValue(true),
    getLocationData: jest.fn().mockResolvedValue(null),
    invalidatePattern: jest.fn().mockResolvedValue(true),
    invalidateUser: jest.fn().mockResolvedValue(true),
    invalidateDriver: jest.fn().mockResolvedValue(true),
    invalidateRide: jest.fn().mockResolvedValue(true),
    getStats: jest.fn().mockResolvedValue({}),
    healthCheck: jest.fn().mockResolvedValue(true),
    isConnected: true
  })),
  cacheMiddleware: jest.fn().mockImplementation(() => (req, res, next) => next()),
  withQueryCache: jest.fn().mockImplementation((query, params, ttl) => Promise.resolve(null))
}));

// Mock Socket.IO
jest.mock('socket.io', () => {
  return {
    Server: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      use: jest.fn()
    }))
  };
});

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn().mockReturnValue({ id: 1, role: 'driver' })
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' })
  })
}));

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Setup default database responses
  mockPool.query.mockResolvedValue({
    rows: [],
    rowCount: 0
  });
});

// Global test teardown
afterAll(() => {
  // Clean up any remaining mocks
  jest.restoreAllMocks();
});

// Suppress console logs during tests unless explicitly needed
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}; 