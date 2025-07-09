import { API_BASE_URL, API_ENDPOINTS, API_CONFIG, HTTP_METHODS, CONTENT_TYPES } from '../config/api';
import { DriverProfile, ContactInfo, Wallet, Card, BankAccount, Transaction } from '../models';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class DriverAPIService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Generic API request method
  private async makeRequest<T>(
    endpoint: string,
    method: string = HTTP_METHODS.GET,
    body?: any,
    headers?: Record<string, string>,
    token?: string
  ): Promise<APIResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const requestHeaders: Record<string, string> = {
        'Content-Type': CONTENT_TYPES.JSON,
        ...headers,
      };

      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Driver Profile API
  async getDriverProfile(token: string): Promise<APIResponse<DriverProfile>> {
    return this.makeRequest<DriverProfile>(API_ENDPOINTS.DRIVER.PROFILE, HTTP_METHODS.GET, undefined, undefined, token);
  }

  async updateDriverProfile(updates: Partial<DriverProfile>, token: string): Promise<APIResponse<DriverProfile>> {
    return this.makeRequest<DriverProfile>(
      API_ENDPOINTS.DRIVER.UPDATE_PROFILE,
      HTTP_METHODS.PUT,
      updates,
      undefined,
      token
    );
  }

  async uploadAvatar(imageFile: File, token: string): Promise<APIResponse<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append('avatar', imageFile);

    return this.makeRequest<{ avatarUrl: string }>(
      API_ENDPOINTS.DRIVER.UPLOAD_AVATAR,
      HTTP_METHODS.POST,
      formData,
      { 'Content-Type': CONTENT_TYPES.FORM_DATA },
      token
    );
  }

  // Rides API
  async getActiveRides(token: string): Promise<APIResponse<any[]>> {
    return this.makeRequest<any[]>(API_ENDPOINTS.RIDES.ACTIVE, HTTP_METHODS.GET, undefined, undefined, token);
  }

  async getRideHistory(token: string, page: number = 1, limit: number = 20): Promise<APIResponse<PaginatedResponse<any>>> {
    const endpoint = `${API_ENDPOINTS.RIDES.HISTORY}?page=${page}&limit=${limit}`;
    return this.makeRequest<PaginatedResponse<any>>(endpoint, HTTP_METHODS.GET, undefined, undefined, token);
  }

  async acceptRide(rideId: string, token: string): Promise<APIResponse<any>> {
    return this.makeRequest<any>(
      `${API_ENDPOINTS.RIDES.ACCEPT}/${rideId}`,
      HTTP_METHODS.POST,
      undefined,
      undefined,
      token
    );
  }

  async completeRide(rideId: string, data: { actualFare: number; rating?: number; review?: string }, token: string): Promise<APIResponse<any>> {
    return this.makeRequest<any>(
      `${API_ENDPOINTS.RIDES.COMPLETE}/${rideId}`,
      HTTP_METHODS.POST,
      data,
      undefined,
      token
    );
  }

  async cancelRide(rideId: string, reason: string, token: string): Promise<APIResponse<any>> {
    return this.makeRequest<any>(
      `${API_ENDPOINTS.RIDES.CANCEL}/${rideId}`,
      HTTP_METHODS.POST,
      { reason },
      undefined,
      token
    );
  }

  // Earnings API
  async getEarningsSummary(token: string, period: 'today' | 'week' | 'month' = 'today'): Promise<APIResponse<any>> {
    const endpoint = `${API_ENDPOINTS.EARNINGS.SUMMARY}?period=${period}`;
    return this.makeRequest<any>(endpoint, HTTP_METHODS.GET, undefined, undefined, token);
  }

  async getEarningsHistory(token: string, page: number = 1, limit: number = 20): Promise<APIResponse<PaginatedResponse<any>>> {
    const endpoint = `${API_ENDPOINTS.EARNINGS.HISTORY}?page=${page}&limit=${limit}`;
    return this.makeRequest<PaginatedResponse<any>>(endpoint, HTTP_METHODS.GET, undefined, undefined, token);
  }

  async withdrawEarnings(amount: number, paymentMethod: 'card' | 'bank', token: string): Promise<APIResponse<any>> {
    return this.makeRequest<any>(
      API_ENDPOINTS.EARNINGS.WITHDRAW,
      HTTP_METHODS.POST,
      { amount, paymentMethod },
      undefined,
      token
    );
  }

  // Wallet API
  async getWalletBalance(token: string): Promise<APIResponse<{ balance: number; currency: string }>> {
    return this.makeRequest<{ balance: number; currency: string }>(
      API_ENDPOINTS.WALLET.BALANCE,
      HTTP_METHODS.GET,
      undefined,
      undefined,
      token
    );
  }

  async getWalletCards(token: string): Promise<APIResponse<Card[]>> {
    return this.makeRequest<Card[]>(API_ENDPOINTS.WALLET.CARDS, HTTP_METHODS.GET, undefined, undefined, token);
  }

  async addWalletCard(cardData: Omit<Card, 'id' | 'createdAt'>, token: string): Promise<APIResponse<Card>> {
    return this.makeRequest<Card>(API_ENDPOINTS.WALLET.CARDS, HTTP_METHODS.POST, cardData, undefined, token);
  }

  async updateWalletCard(cardId: string, updates: Partial<Card>, token: string): Promise<APIResponse<Card>> {
    return this.makeRequest<Card>(
      `${API_ENDPOINTS.WALLET.CARDS}/${cardId}`,
      HTTP_METHODS.PUT,
      updates,
      undefined,
      token
    );
  }

  async deleteWalletCard(cardId: string, token: string): Promise<APIResponse<void>> {
    return this.makeRequest<void>(
      `${API_ENDPOINTS.WALLET.CARDS}/${cardId}`,
      HTTP_METHODS.DELETE,
      undefined,
      undefined,
      token
    );
  }

  async getBankAccounts(token: string): Promise<APIResponse<BankAccount[]>> {
    return this.makeRequest<BankAccount[]>(
      API_ENDPOINTS.WALLET.BANK_ACCOUNTS,
      HTTP_METHODS.GET,
      undefined,
      undefined,
      token
    );
  }

  async addBankAccount(bankAccountData: Omit<BankAccount, 'id' | 'createdAt'>, token: string): Promise<APIResponse<BankAccount>> {
    return this.makeRequest<BankAccount>(
      API_ENDPOINTS.WALLET.BANK_ACCOUNTS,
      HTTP_METHODS.POST,
      bankAccountData,
      undefined,
      token
    );
  }

  async updateBankAccount(accountId: string, updates: Partial<BankAccount>, token: string): Promise<APIResponse<BankAccount>> {
    return this.makeRequest<BankAccount>(
      `${API_ENDPOINTS.WALLET.BANK_ACCOUNTS}/${accountId}`,
      HTTP_METHODS.PUT,
      updates,
      undefined,
      token
    );
  }

  async deleteBankAccount(accountId: string, token: string): Promise<APIResponse<void>> {
    return this.makeRequest<void>(
      `${API_ENDPOINTS.WALLET.BANK_ACCOUNTS}/${accountId}`,
      HTTP_METHODS.DELETE,
      undefined,
      undefined,
      token
    );
  }

  async getTransactions(token: string, page: number = 1, limit: number = 20): Promise<APIResponse<PaginatedResponse<Transaction>>> {
    const endpoint = `${API_ENDPOINTS.WALLET.TRANSACTIONS}?page=${page}&limit=${limit}`;
    return this.makeRequest<PaginatedResponse<Transaction>>(endpoint, HTTP_METHODS.GET, undefined, undefined, token);
  }

  // Safety API
  async reportEmergency(emergencyData: {
    type: 'medical' | 'accident' | 'suspicious' | 'other';
    location: { latitude: number; longitude: number };
    description?: string;
    rideId?: string;
  }, token: string): Promise<APIResponse<any>> {
    return this.makeRequest<any>(
      API_ENDPOINTS.SAFETY.EMERGENCY,
      HTTP_METHODS.POST,
      emergencyData,
      undefined,
      token
    );
  }

  async checkIn(location: { latitude: number; longitude: number }, token: string, rideId?: string): Promise<APIResponse<any>> {
    return this.makeRequest<any>(
      API_ENDPOINTS.SAFETY.CHECK_IN,
      HTTP_METHODS.POST,
      { location, rideId },
      undefined,
      token
    );
  }

  async getSafetyIncidents(token: string, page: number = 1, limit: number = 20): Promise<APIResponse<PaginatedResponse<any>>> {
    const endpoint = `${API_ENDPOINTS.SAFETY.INCIDENTS}?page=${page}&limit=${limit}`;
    return this.makeRequest<PaginatedResponse<any>>(endpoint, HTTP_METHODS.GET, undefined, undefined, token);
  }

  // Analytics API
  async getPerformanceAnalytics(token: string, period: 'day' | 'week' | 'month' = 'week'): Promise<APIResponse<any>> {
    const endpoint = `${API_ENDPOINTS.ANALYTICS.PERFORMANCE}?period=${period}`;
    return this.makeRequest<any>(endpoint, HTTP_METHODS.GET, undefined, undefined, token);
  }

  async getEarningsAnalytics(token: string, period: 'day' | 'week' | 'month' = 'week'): Promise<APIResponse<any>> {
    const endpoint = `${API_ENDPOINTS.ANALYTICS.EARNINGS}?period=${period}`;
    return this.makeRequest<any>(endpoint, HTTP_METHODS.GET, undefined, undefined, token);
  }

  async getRidesAnalytics(token: string, period: 'day' | 'week' | 'month' = 'week'): Promise<APIResponse<any>> {
    const endpoint = `${API_ENDPOINTS.ANALYTICS.RIDES}?period=${period}`;
    return this.makeRequest<any>(endpoint, HTTP_METHODS.GET, undefined, undefined, token);
  }

  // Health Check
  async healthCheck(): Promise<APIResponse<{ status: string; timestamp: string }>> {
    return this.makeRequest<{ status: string; timestamp: string }>('/health', HTTP_METHODS.GET);
  }
}

export default new DriverAPIService(); 