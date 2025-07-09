// API Configuration for Driver App

// Base URL for API endpoints
export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SEND_OTP: '/auth/driver/send-otp',
    VERIFY_OTP: '/auth/driver/verify-otp',
    CHECK_EXISTS: '/auth/driver/exists',
    GOOGLE_SIGNIN: '/auth/driver/google-signin',
    GOOGLE_SIGNUP: '/auth/driver/google-signup',
    VALIDATE_TOKEN: '/auth/validate',
    REFRESH_TOKEN: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },

  // Driver Profile
  DRIVER: {
    PROFILE: '/drivers/profile',
    UPDATE_PROFILE: '/drivers/profile',
    UPLOAD_AVATAR: '/drivers/avatar',
  },

  // Rides
  RIDES: {
    ACTIVE: '/rides/active',
    HISTORY: '/rides/history',
    ACCEPT: '/rides/accept',
    COMPLETE: '/rides/complete',
    CANCEL: '/rides/cancel',
  },

  // Earnings
  EARNINGS: {
    SUMMARY: '/earnings/summary',
    HISTORY: '/earnings/history',
    WITHDRAW: '/earnings/withdraw',
  },

  // Wallet
  WALLET: {
    BALANCE: '/wallet/balance',
    CARDS: '/wallet/cards',
    BANK_ACCOUNTS: '/wallet/bank-accounts',
    TRANSACTIONS: '/wallet/transactions',
  },

  // Safety
  SAFETY: {
    EMERGENCY: '/safety/emergency',
    CHECK_IN: '/safety/check-in',
    INCIDENTS: '/safety/incidents',
  },

  // Analytics
  ANALYTICS: {
    PERFORMANCE: '/analytics/performance',
    EARNINGS: '/analytics/earnings',
    RIDES: '/analytics/rides',
  },
} as const;

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const;

// Content Types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
} as const;

// API Response Status
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
} as const;

// Error Codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const; 