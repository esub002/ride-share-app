// Jest setup for driver app
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Expo modules
jest.mock('expo-location');
jest.mock('expo-notifications');
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    Marker: View,
    Polyline: View,
    PROVIDER_GOOGLE: 'google',
  };
});

// Mock socket.io
jest.mock('./utils/socket', () => ({
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock API service
jest.mock('./utils/api', () => ({
  init: jest.fn(),
  getDriverProfile: jest.fn(),
  getEarningsData: jest.fn(),
  getCurrentRide: jest.fn(),
  acceptRide: jest.fn(),
  rejectRide: jest.fn(),
  completeRide: jest.fn(),
  updateLocation: jest.fn(),
}));

// Mock offline manager
jest.mock('./utils/offlineManager', () => ({
  addListener: jest.fn(() => jest.fn()),
  isDeviceOnline: jest.fn(() => true),
  storeOfflineData: jest.fn(),
  getOfflineData: jest.fn(),
  addPendingAction: jest.fn(),
  getPendingActionsCount: jest.fn(() => 0),
  clearCache: jest.fn(),
}));

// Mock performance optimizer
jest.mock('./utils/performanceOptimizer', () => ({
  memoize: jest.fn((key, func) => func()),
  debounce: jest.fn(),
  throttle: jest.fn(),
  optimizedApiCall: jest.fn((key, func) => func()),
  clearCaches: jest.fn(),
  getPerformanceMetrics: jest.fn(() => ({})),
}));

// Mock notification service
jest.mock('./utils/notifications', () => ({
  init: jest.fn(),
  getPushToken: jest.fn(),
  registerPushToken: jest.fn(),
  cleanup: jest.fn(),
}));

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 