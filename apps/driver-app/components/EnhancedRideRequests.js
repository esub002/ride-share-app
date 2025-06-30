import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Import our enhanced services
import enhancedSocket from '../utils/enhancedSocket';
import notificationService from '../utils/notificationService';
import requestQueueManager from '../utils/requestQueueManager';
import apiService from '../utils/api';

const { width, height } = Dimensions.get('window');

const EnhancedRideRequests = ({ onRideAccepted, onRideRejected }) => {
  // State management
  const [rideRequests, setRideRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [showHistory, setShowHistory] = useState(false);
  const [queueStats, setQueueStats] = useState(null);

  // Animation refs
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(1)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Refs for cleanup
  const refreshInterval = useRef(null);
  const statsInterval = useRef(null);
  const attentionInterval = useRef(null);

  // Initialize services and setup listeners
  useEffect(() => {
    initializeServices();
    setupSocketListeners();
    setupIntervals();
    
    return () => {
      cleanup();
    };
  }, []);

  // Initialize all services
  const initializeServices = async () => {
    try {
      // Initialize notification service
      await notificationService.init();
      
      // Initialize request queue manager
      await requestQueueManager.init();
      
      // Connect to enhanced socket
      await enhancedSocket.connect();
      
      // Load initial ride requests
      await loadRideRequests();
      
      console.log('🚗 Enhanced real-time ride requests initialized');
    } catch (error) {
      console.error('🚗 Failed to initialize services:', error);
    }
  };

  // Setup socket event listeners
  const setupSocketListeners = () => {
    // Connection status updates
    enhancedSocket.on('connected', () => {
      setConnectionStatus('connected');
      triggerSuccessAnimation();
    });

    enhancedSocket.on('disconnected', () => {
      setConnectionStatus('disconnected');
      triggerErrorAnimation();
    });

    enhancedSocket.on('reconnecting', (data) => {
      setConnectionStatus('reconnecting');
      console.log('🔄 Reconnecting...', data);
    });

    enhancedSocket.on('connectionError', (error) => {
      setConnectionStatus('error');
      console.error('🔌 Connection error:', error);
    });

    // New ride request
    enhancedSocket.on('newRideRequest', (rideRequest) => {
      handleNewRideRequest(rideRequest);
    });

    // Ride request cancelled
    enhancedSocket.on('rideCancelled', (data) => {
      handleRideCancelled(data.id);
    });

    // Ride request expired
    enhancedSocket.on('rideExpired', (data) => {
      handleRideExpired(data.id);
    });

    // Ride status updates
    enhancedSocket.on('rideStatusUpdate', (data) => {
      handleRideStatusUpdate(data);
    });
  };

  // Setup periodic intervals
  const setupIntervals = () => {
    // Refresh ride requests every 30 seconds
    refreshInterval.current = setInterval(loadRideRequests, 30000);
    
    // Update queue stats every 10 seconds
    statsInterval.current = setInterval(updateQueueStats, 10000);
    
    // Check for requests needing attention every 5 seconds
    attentionInterval.current = setInterval(checkRequestsNeedingAttention, 5000);
  };

  // Cleanup intervals and listeners
  const cleanup = () => {
    if (refreshInterval.current) clearInterval(refreshInterval.current);
    if (statsInterval.current) clearInterval(statsInterval.current);
    if (attentionInterval.current) clearInterval(attentionInterval.current);
    
    enhancedSocket.off('connected');
    enhancedSocket.off('disconnected');
    enhancedSocket.off('reconnecting');
    enhancedSocket.off('connectionError');
    enhancedSocket.off('newRideRequest');
    enhancedSocket.off('rideCancelled');
    enhancedSocket.off('rideExpired');
    enhancedSocket.off('rideStatusUpdate');
  };

  // Handle new ride request
  const handleNewRideRequest = useCallback((rideRequest) => {
    try {
      // Add to queue manager
      const added = requestQueueManager.addRequest(rideRequest);
      if (!added) {
        console.log('🚗 Request not added (duplicate or invalid)');
        return;
      }

      // Update local state
      setRideRequests(prev => [rideRequest, ...prev]);
      setLastUpdate(new Date());

      // Trigger animations and notifications
      triggerPulseAnimation();
      triggerShakeAnimation();
      
      // Show notification
      notificationService.showRideRequestNotification(rideRequest);
      
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      console.log('🚗 New ride request processed:', rideRequest.id);
    } catch (error) {
      console.error('🚗 Error handling new ride request:', error);
    }
  }, []);

  // Handle ride cancelled
  const handleRideCancelled = useCallback((rideId) => {
    removeRideRequest(rideId);
    notificationService.showWarningNotification(
      'Ride Cancelled',
      'A ride request has been cancelled by the passenger.'
    );
  }, []);

  // Handle ride expired
  const handleRideExpired = useCallback((rideId) => {
    removeRideRequest(rideId);
    notificationService.showWarningNotification(
      'Ride Expired',
      'A ride request has expired.'
    );
  }, []);

  // Handle ride status update
  const handleRideStatusUpdate = useCallback((data) => {
    // Update request in queue manager
    requestQueueManager.updateRequestStatus(data.rideId, data.status, data);
    
    // Update local state if needed
    setRideRequests(prev => 
      prev.map(req => 
        req.id === data.rideId ? { ...req, ...data } : req
      )
    );
  }, []);

  // Load ride requests from API
  const loadRideRequests = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const requests = await apiService.getAvailableRides();
      const activeRequests = requestQueueManager.getActiveRequests();
      
      // Merge API requests with queue manager requests
      const mergedRequests = [...activeRequests, ...(requests || [])];
      
      setRideRequests(mergedRequests);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('🚗 Failed to load ride requests:', error);
      notificationService.showErrorNotification(
        'Connection Error',
        'Failed to load ride requests. Please check your connection.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Remove ride request
  const removeRideRequest = (rideId) => {
    requestQueueManager.removeRequest(rideId, 'removed');
    setRideRequests(prev => prev.filter(ride => ride.id !== rideId));
  };

  // Handle accept ride
  const handleAcceptRide = async (rideRequest) => {
    try {
      // Update status in queue manager
      requestQueueManager.updateRequestStatus(rideRequest.id, 'accepted');
      
      // Send acceptance via socket
      enhancedSocket.acceptRide(rideRequest.id);
      
      // Remove from local state
      removeRideRequest(rideRequest.id);
      
      // Callback
      if (onRideAccepted) {
        onRideAccepted(rideRequest);
      }
      
      // Show success notification
      notificationService.showSuccessNotification(
        'Ride Accepted!',
        `You're on your way to ${rideRequest.pickup}`
      );
      
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      console.error('🚗 Error accepting ride:', error);
      notificationService.showErrorNotification(
        'Error',
        'Failed to accept ride. Please try again.'
      );
    }
  };

  // Handle reject ride
  const handleRejectRide = async (rideRequest) => {
    try {
      // Update status in queue manager
      requestQueueManager.updateRequestStatus(rideRequest.id, 'rejected');
      
      // Send rejection via socket
      enhancedSocket.rejectRide(rideRequest.id, 'Driver unavailable');
      
      // Remove from local state
      removeRideRequest(rideRequest.id);
      
      // Callback
      if (onRideRejected) {
        onRideRejected(rideRequest);
      }
      
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
    } catch (error) {
      console.error('🚗 Error rejecting ride:', error);
      notificationService.showErrorNotification(
        'Error',
        'Failed to reject ride. Please try again.'
      );
    }
  };

  // Update queue statistics
  const updateQueueStats = () => {
    const stats = requestQueueManager.getQueueStats();
    setQueueStats(stats);
  };

  // Check for requests needing attention
  const checkRequestsNeedingAttention = () => {
    const attentionRequests = requestQueueManager.getRequestsNeedingAttention();
    if (attentionRequests.length > 0) {
      // Trigger subtle notification for expiring requests
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Animation functions
  const triggerPulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnimation, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerSuccessAnimation = () => {
    Animated.sequence([
      Animated.timing(fadeAnimation, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerErrorAnimation = () => {
    Animated.sequence([
      Animated.timing(slideAnimation, {
        toValue: -20,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 20,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Utility functions
  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FF9800';
      case 'reconnecting': return '#FF9800';
      case 'error': return '#f44336';
      default: return '#ccc';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Online';
      case 'connecting': return 'Connecting...';
      case 'reconnecting': return 'Reconnecting...';
      case 'error': return 'Connection Error';
      default: return 'Offline';
    }
  };

  // Render ride request card
  const renderRideRequestCard = (rideRequest, index) => {
    const isExpiringSoon = rideRequest.expiresAt && 
      (rideRequest.expiresAt - Date.now()) < 10000; // 10 seconds

    return (
      <Animated.View 
        key={rideRequest.id} 
        style={[
          styles.rideCard,
          { 
            transform: [
              { scale: index === 0 ? pulseAnimation : 1 },
              { translateX: index === 0 ? shakeAnimation : 0 }
            ],
            borderColor: isExpiringSoon ? '#f44336' : '#eee',
            borderWidth: isExpiringSoon ? 2 : 1,
          }
        ]}
      >
        <View style={styles.rideHeader}>
          <View style={styles.rideInfo}>
            <Text style={styles.rideTitle}>Ride Request #{rideRequest.id}</Text>
            <Text style={styles.rideTime}>
              {formatTime(rideRequest.created_at)}
              {rideRequest.receivedAt && (
                <Text style={styles.timeAgo}> • {formatTimeAgo(rideRequest.receivedAt)}</Text>
              )}
            </Text>
          </View>
          <View style={styles.fareContainer}>
            <Text style={styles.fareAmount}>${rideRequest.fare}</Text>
            <Text style={styles.fareLabel}>Fare</Text>
          </View>
        </View>

        <View style={styles.locationContainer}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color="#4CAF50" />
            <Text style={styles.locationText} numberOfLines={2}>
              {rideRequest.pickup}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#FF9800" />
            <Text style={styles.locationText} numberOfLines={2}>
              {rideRequest.destination}
            </Text>
          </View>
        </View>

        <View style={styles.rideDetails}>
          {rideRequest.distance && (
            <View style={styles.detailItem}>
              <Ionicons name="map" size={14} color="#666" />
              <Text style={styles.detailText}>
                {formatDistance(rideRequest.distance)}
              </Text>
            </View>
          )}
          {rideRequest.estimated_duration && (
            <View style={styles.detailItem}>
              <Ionicons name="time" size={14} color="#666" />
              <Text style={styles.detailText}>
                {rideRequest.estimated_duration} min
              </Text>
            </View>
          )}
          {rideRequest.passenger_name && (
            <View style={styles.detailItem}>
              <Ionicons name="person" size={14} color="#666" />
              <Text style={styles.detailText}>
                {rideRequest.passenger_name}
              </Text>
            </View>
          )}
        </View>

        {isExpiringSoon && (
          <View style={styles.expiringWarning}>
            <Ionicons name="warning" size={14} color="#f44336" />
            <Text style={styles.expiringText}>Expiring soon!</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRejectRide(rideRequest)}
          >
            <Ionicons name="close" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAcceptRide(rideRequest)}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Enhanced Ride Requests Component</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
});

export default EnhancedRideRequests; 