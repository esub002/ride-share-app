// Jest setup file
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/ride_share_test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.PORT = '3001'; 