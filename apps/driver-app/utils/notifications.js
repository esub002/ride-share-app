import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_BASE_URL } from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  // Initialize notifications
  async init() {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }

      // Get push token with fallback
      if (Device.isDevice) {
        try {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId || 'your-project-id-here';
          const token = await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          });
          this.expoPushToken = token.data;
          console.log('Push token:', this.expoPushToken);
        } catch (tokenError) {
          console.log('Could not get push token:', tokenError);
          // Continue without push token
        }
      } else {
        console.log('Must use physical device for Push Notifications');
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  // Set up notification listeners
  setupNotificationListeners() {
    try {
      // Listen for incoming notifications
      this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
        this.handleNotificationReceived(notification);
      });

      // Listen for notification responses (when user taps notification)
      this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
        this.handleNotificationResponse(response);
      });
    } catch (error) {
      console.error('Error setting up notification listeners:', error);
    }
  }

  // Handle incoming notifications
  handleNotificationReceived(notification) {
    try {
      const { title, body, data } = notification.request.content;
      
      // Handle different notification types
      switch (data?.type) {
        case 'ride_request':
          this.handleRideRequestNotification(data);
          break;
        case 'navigation_alert':
          this.handleNavigationAlert(data);
          break;
        case 'earnings_update':
          this.handleEarningsUpdate(data);
          break;
        case 'system_announcement':
          this.handleSystemAnnouncement(data);
          break;
        case 'safety_alert':
          this.handleSafetyAlert(data);
          break;
        default:
          console.log('Unknown notification type:', data?.type);
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  }

  // Handle notification responses
  handleNotificationResponse(response) {
    try {
      const { data } = response.notification.request.content;
      
      // Navigate based on notification type
      switch (data?.type) {
        case 'ride_request':
          // Navigate to ride request screen
          if (data.rideId) {
            // You can use navigation here if passed as prop
            console.log('Navigate to ride request:', data.rideId);
          }
          break;
        case 'navigation_alert':
          // Navigate to navigation screen
          console.log('Navigate to navigation');
          break;
        case 'earnings_update':
          // Navigate to earnings screen
          console.log('Navigate to earnings');
          break;
      }
    } catch (error) {
      console.error('Error handling notification response:', error);
    }
  }

  // Send push token to backend
  async registerPushToken(userId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${userId}/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pushToken: token,
          platform: Platform.OS,
        }),
      });

      if (response.ok) {
        console.log('Push token registered successfully');
        return true;
      } else {
        console.error('Failed to register push token');
        return false;
      }
    } catch (error) {
      console.error('Error registering push token:', error);
      return false;
    }
  }

  // Schedule local notification
  async scheduleLocalNotification(title, body, data = {}, trigger = null) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: trigger || null, // null means show immediately
      });
      
      console.log('Local notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      return null;
    }
  }

  // Cancel notification
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  // Cancel all notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  // Handle ride request notification
  handleRideRequestNotification(data) {
    // Play sound, vibrate, etc.
    console.log('New ride request received:', data);
  }

  // Handle navigation alert
  handleNavigationAlert(data) {
    console.log('Navigation alert:', data);
  }

  // Handle earnings update
  handleEarningsUpdate(data) {
    console.log('Earnings update:', data);
  }

  // Handle system announcement
  handleSystemAnnouncement(data) {
    console.log('System announcement:', data);
  }

  // Handle safety alert
  handleSafetyAlert(data) {
    console.log('Safety alert:', data);
  }

  // Schedule arrival notification
  async scheduleArrivalNotification(destination, estimatedTime) {
    try {
      const trigger = new Date(Date.now() + estimatedTime * 1000); // Convert to milliseconds
      
      return await this.scheduleLocalNotification(
        'Approaching Destination',
        `You will arrive at ${destination} in ${Math.round(estimatedTime / 60)} minutes`,
        { type: 'navigation_alert', destination },
        trigger
      );
    } catch (error) {
      console.error('Error scheduling arrival notification:', error);
      return null;
    }
  }

  // Schedule break reminder
  async scheduleBreakReminder() {
    try {
      const trigger = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now
      
      return await this.scheduleLocalNotification(
        'Break Time Reminder',
        'You\'ve been driving for 4 hours. Consider taking a break for safety.',
        { type: 'safety_alert' },
        trigger
      );
    } catch (error) {
      console.error('Error scheduling break reminder:', error);
      return null;
    }
  }

  // Schedule earnings milestone notification
  async scheduleEarningsMilestone(milestone, currentEarnings) {
    try {
      return await this.scheduleLocalNotification(
        'Earnings Milestone! 🎉',
        `Congratulations! You've earned $${currentEarnings} today!`,
        { type: 'earnings_update', milestone, earnings: currentEarnings }
      );
    } catch (error) {
      console.error('Error scheduling earnings milestone:', error);
      return null;
    }
  }

  // Clean up listeners
  cleanup() {
    try {
      if (this.notificationListener) {
        this.notificationListener.remove();
      }
      if (this.responseListener) {
        this.responseListener.remove();
      }
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
  }

  // Get push token
  getPushToken() {
    return this.expoPushToken;
  }
}

export default new NotificationService();
