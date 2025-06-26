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