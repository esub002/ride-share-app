import AsyncStorage from '@react-native-async-storage/async-storage';

class RequestQueueManager {
  constructor() {
    this.activeRequests = new Map(); // Currently active requests
    this.requestHistory = []; // Recent request history
    this.maxHistorySize = 50; // Maximum number of requests to keep in history
    this.requestTimeout = 30000; // 30 seconds timeout for requests
    this.duplicateThreshold = 5000; // 5 seconds threshold for duplicate detection
    this.lastRequestTime = 0;
  }

  // Initialize the queue manager
  async init() {
    try {
      // Load request history from storage
      await this.loadRequestHistory();
      console.log('📋 Request queue manager initialized');
    } catch (error) {
      console.error('📋 Failed to initialize request queue manager:', error);
    }
  }

  // Add a new ride request to the queue
  addRequest(rideRequest) {
    try {
      const requestId = rideRequest.id;
      const now = Date.now();

      // Check for duplicates
      if (this.isDuplicateRequest(rideRequest, now)) {
        console.log('📋 Duplicate request detected, ignoring:', requestId);
        return false;
      }

      // Create enhanced request object
      const enhancedRequest = {
        ...rideRequest,
        receivedAt: now,
        expiresAt: now + this.requestTimeout,
        status: 'pending', // pending, accepted, rejected, expired, cancelled
        attempts: 0,
        lastAttempt: now,
      };

      // Add to active requests
      this.activeRequests.set(requestId, enhancedRequest);

      // Add to history
      this.addToHistory(enhancedRequest);

      // Set expiration timer
      this.setExpirationTimer(requestId);

      console.log('📋 Added new request to queue:', requestId);
      return true;
    } catch (error) {
      console.error('📋 Error adding request to queue:', error);
      return false;
    }
  }

  // Check if request is a duplicate
  isDuplicateRequest(rideRequest, currentTime) {
    const requestId = rideRequest.id;
    
    // Check if request already exists in active requests
    if (this.activeRequests.has(requestId)) {
      return true;
    }

    // Check recent history for similar requests
    const recentRequests = this.requestHistory.filter(
      req => currentTime - req.receivedAt < this.duplicateThreshold
    );

    // Check for requests with same pickup/destination within threshold
    const isDuplicate = recentRequests.some(req => 
      req.pickup === rideRequest.pickup &&
      req.destination === rideRequest.destination &&
      Math.abs(currentTime - req.receivedAt) < this.duplicateThreshold
    );

    return isDuplicate;
  }

  // Add request to history
  addToHistory(request) {
    this.requestHistory.unshift(request);
    
    // Limit history size
    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory = this.requestHistory.slice(0, this.maxHistorySize);
    }

    // Save to storage periodically
    this.saveRequestHistory();
  }

  // Remove request from active queue
  removeRequest(requestId, reason = 'removed') {
    try {
      const request = this.activeRequests.get(requestId);
      if (request) {
        // Update status
        request.status = reason;
        request.removedAt = Date.now();

        // Remove from active requests
        this.activeRequests.delete(requestId);

        // Update in history
        this.updateRequestInHistory(requestId, request);

        console.log(`📋 Removed request ${requestId} (${reason})`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('📋 Error removing request:', error);
      return false;
    }
  }

  // Update request status
  updateRequestStatus(requestId, status, additionalData = {}) {
    try {
      const request = this.activeRequests.get(requestId);
      if (request) {
        request.status = status;
        request.updatedAt = Date.now();
        Object.assign(request, additionalData);

        // Update in history
        this.updateRequestInHistory(requestId, request);

        console.log(`📋 Updated request ${requestId} status to ${status}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('📋 Error updating request status:', error);
      return false;
    }
  }

  // Get all active requests
  getActiveRequests() {
    return Array.from(this.activeRequests.values());
  }

  // Get request by ID
  getRequest(requestId) {
    return this.activeRequests.get(requestId);
  }

  // Get recent request history
  getRequestHistory(limit = 10) {
    return this.requestHistory.slice(0, limit);
  }

  // Get requests by status
  getRequestsByStatus(status) {
    return this.requestHistory.filter(req => req.status === status);
  }

  // Get requests by time range
  getRequestsByTimeRange(startTime, endTime) {
    return this.requestHistory.filter(
      req => req.receivedAt >= startTime && req.receivedAt <= endTime
    );
  }

  // Check for expired requests
  checkExpiredRequests() {
    const now = Date.now();
    const expiredRequests = [];

    for (const [requestId, request] of this.activeRequests.entries()) {
      if (request.expiresAt <= now) {
        expiredRequests.push(requestId);
      }
    }

    // Remove expired requests
    expiredRequests.forEach(requestId => {
      this.removeRequest(requestId, 'expired');
    });

    return expiredRequests;
  }

  // Set expiration timer for a request
  setExpirationTimer(requestId) {
    const request = this.activeRequests.get(requestId);
    if (!request) return;

    const timeUntilExpiry = request.expiresAt - Date.now();
    
    if (timeUntilExpiry > 0) {
      setTimeout(() => {
        this.removeRequest(requestId, 'expired');
      }, timeUntilExpiry);
    }
  }

  // Update request in history
  updateRequestInHistory(requestId, updatedRequest) {
    const index = this.requestHistory.findIndex(req => req.id === requestId);
    if (index !== -1) {
      this.requestHistory[index] = updatedRequest;
      this.saveRequestHistory();
    }
  }

  // Get queue statistics
  getQueueStats() {
    const now = Date.now();
    const activeCount = this.activeRequests.size;
    const totalHistory = this.requestHistory.length;
    
    const statusCounts = this.requestHistory.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {});

    const recentRequests = this.requestHistory.filter(
      req => now - req.receivedAt < 300000 // Last 5 minutes
    ).length;

    return {
      activeRequests: activeCount,
      totalHistory,
      recentRequests,
      statusCounts,
      averageResponseTime: this.calculateAverageResponseTime(),
    };
  }

  // Calculate average response time
  calculateAverageResponseTime() {
    const respondedRequests = this.requestHistory.filter(
      req => req.status === 'accepted' || req.status === 'rejected'
    );

    if (respondedRequests.length === 0) return 0;

    const totalResponseTime = respondedRequests.reduce((sum, req) => {
      if (req.updatedAt && req.receivedAt) {
        return sum + (req.updatedAt - req.receivedAt);
      }
      return sum;
    }, 0);

    return totalResponseTime / respondedRequests.length;
  }

  // Clear all active requests
  clearActiveRequests() {
    this.activeRequests.clear();
    console.log('📋 Cleared all active requests');
  }

  // Clear request history
  async clearRequestHistory() {
    this.requestHistory = [];
    await this.saveRequestHistory();
    console.log('📋 Cleared request history');
  }

  // Load request history from storage
  async loadRequestHistory() {
    try {
      const stored = await AsyncStorage.getItem('requestHistory');
      if (stored) {
        this.requestHistory = JSON.parse(stored);
        console.log('📋 Loaded request history from storage');
      }
    } catch (error) {
      console.error('📋 Error loading request history:', error);
    }
  }

  // Save request history to storage
  async saveRequestHistory() {
    try {
      await AsyncStorage.setItem('requestHistory', JSON.stringify(this.requestHistory));
    } catch (error) {
      console.error('📋 Error saving request history:', error);
    }
  }

  // Export request data for analytics
  exportRequestData() {
    return {
      activeRequests: Array.from(this.activeRequests.values()),
      history: this.requestHistory,
      stats: this.getQueueStats(),
      exportTime: Date.now(),
    };
  }

  // Import request data
  importRequestData(data) {
    try {
      if (data.history) {
        this.requestHistory = data.history;
        this.saveRequestHistory();
      }
      console.log('📋 Imported request data');
    } catch (error) {
      console.error('📋 Error importing request data:', error);
    }
  }

  // Cleanup old requests
  cleanupOldRequests(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const cutoffTime = Date.now() - maxAge;
    this.requestHistory = this.requestHistory.filter(
      req => req.receivedAt > cutoffTime
    );
    this.saveRequestHistory();
    console.log('📋 Cleaned up old requests');
  }

  // Get requests that need attention (expiring soon, etc.)
  getRequestsNeedingAttention() {
    const now = Date.now();
    const attentionThreshold = 10000; // 10 seconds

    return Array.from(this.activeRequests.values()).filter(req => {
      const timeUntilExpiry = req.expiresAt - now;
      return timeUntilExpiry > 0 && timeUntilExpiry <= attentionThreshold;
    });
  }
}

// Create singleton instance
const requestQueueManager = new RequestQueueManager();

export default requestQueueManager; 