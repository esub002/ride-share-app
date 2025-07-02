import { Vibration, Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

class NotificationService {
  constructor() {
    this.sound = null;
    this.isSoundEnabled = true;
    this.isVibrationEnabled = true;
    this.isHapticsEnabled = true;
    this.notificationQueue = [];
    this.isProcessingQueue = false;
    this.lastNotificationTime = 0;
    this.minNotificationInterval = 2000; // Minimum 2 seconds between notifications
  }

  // Initialize the notification service
  async init() {
    try {
      // Request permissions
      await this.requestPermissions();
      
      // Load notification sound
      await this.loadNotificationSound();
      
      // Configure notification behavior
      this.configureNotifications();
      
      console.log('🔔 Notification service initialized');
    } catch (error) {
      console.error('🔔 Failed to initialize notification service:', error);
    }
  }

  // Request necessary permissions
  async requestPermissions() {
    try {
      // Request notification permissions
      const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
      
      if (notificationStatus !== 'granted') {
        console.warn('🔔 Notification permissions not granted');
      }

      // Request audio permissions (for Android)
      if (Platform.OS === 'android') {
        const { status: audioStatus } = await Audio.requestPermissionsAsync();
        if (audioStatus !== 'granted') {
          console.warn('🔔 Audio permissions not granted');
        }
      }

      return { notificationStatus, audioStatus: 'granted' };
    } catch (error) {
      console.error('🔔 Error requesting permissions:', error);
      return { notificationStatus: 'denied', audioStatus: 'denied' };
    }
  }

  // Load notification sound
  async loadNotificationSound() {
    try {
      // You can replace this with your own sound file
      const soundFile = require('../assets/sounds/notification.mp3');
      this.sound = new Audio.Sound();
      await this.sound.loadAsync(soundFile);
      console.log('🔔 Notification sound loaded');
    } catch (error) {
      console.warn('🔔 Could not load notification sound, using system sound');
      // Fallback to system sound
      this.sound = null;
    }
  }

  // Configure notification behavior
  configureNotifications() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }

  // Show ride request notification
  async showRideRequestNotification(rideRequest) {
    const now = Date.now();
    
    // Check if enough time has passed since last notification
    if (now - this.lastNotificationTime < this.minNotificationInterval) {
      console.log('🔔 Notification rate limited');
      return;
    }

    try {
      // Add to queue to prevent overlapping notifications
      this.notificationQueue.push(rideRequest);
      
      if (!this.isProcessingQueue) {
        this.processNotificationQueue();
      }
    } catch (error) {
      console.error('🔔 Error showing ride request notification:', error);
    }
  }

  // Process notification queue
  async processNotificationQueue() {
    if (this.isProcessingQueue || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.notificationQueue.length > 0) {
      const rideRequest = this.notificationQueue.shift();
      await this.processSingleNotification(rideRequest);
      
      // Small delay between notifications
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.isProcessingQueue = false;
  }

  // Process a single notification
  async processSingleNotification(rideRequest) {
    try {
      this.lastNotificationTime = Date.now();

      // Play sound
      if (this.isSoundEnabled) {
        await this.playNotificationSound();
      }

      // Trigger vibration
      if (this.isVibrationEnabled) {
        this.triggerVibration();
      }

      // Trigger haptic feedback
      if (this.isHapticsEnabled) {
        await this.triggerHapticFeedback();
      }

      // Show local notification
      await this.showLocalNotification(rideRequest);

      // Show in-app alert (optional)
      this.showInAppAlert(rideRequest);

    } catch (error) {
      console.error('🔔 Error processing notification:', error);
    }
  }

  // Play notification sound
  async playNotificationSound() {
    try {
      if (this.sound) {
        await this.sound.replayAsync();
      } else {
        // Fallback to system sound
        if (Platform.OS === 'ios') {
          // iOS system sound
          await Audio.Sound.createAsync(
            { uri: 'system://notification' },
            { shouldPlay: true }
          );
        }
      }
    } catch (error) {
      console.warn('🔔 Could not play notification sound:', error);
    }
  }

  // Trigger vibration
  triggerVibration() {
    try {
      // Custom vibration pattern for ride requests
      const pattern = [0, 500, 200, 500]; // Wait 0ms, vibrate 500ms, wait 200ms, vibrate 500ms
      Vibration.vibrate(pattern);
    } catch (error) {
      console.warn('🔔 Could not trigger vibration:', error);
    }
  }

  // Trigger haptic feedback
  async triggerHapticFeedback() {
    try {
      if (Platform.OS === 'ios') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (Platform.OS === 'android') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.warn('🔔 Could not trigger haptic feedback:', error);
    }
  }

  // Show local notification
  async showLocalNotification(rideRequest) {
    try {
      const notificationContent = {
        title: '🚗 New Ride Request',
        body: `From ${rideRequest.pickup} to ${rideRequest.destination}`,
        data: { rideRequest },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 500, 200, 500],
        autoDismiss: false,
        sticky: true, // Keep notification until user interacts
      };

      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.warn('🔔 Could not show local notification:', error);
    }
  }

  // Show in-app alert
  showInAppAlert(rideRequest) {
    // This is optional - you might want to show a custom banner instead
    // Alert.alert(
    //   '🚗 New Ride Request',
    //   `From ${rideRequest.pickup} to ${rideRequest.destination}`,
    //   [
    //     { text: 'Reject', style: 'cancel' },
    //     { text: 'Accept', onPress: () => this.handleAcceptRide(rideRequest) }
    //   ]
    // );
  }

  // Show success notification
  async showSuccessNotification(title, message) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: null,
      });

      if (this.isHapticsEnabled) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.warn('🔔 Could not show success notification:', error);
    }
  }

  // Show error notification
  async showErrorNotification(title, message) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });

      if (this.isHapticsEnabled) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.warn('🔔 Could not show error notification:', error);
    }
  }

  // Show warning notification
  async showWarningNotification(title, message) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: null,
      });

      if (this.isHapticsEnabled) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (error) {
      console.warn('🔔 Could not show warning notification:', error);
    }
  }

  // Toggle sound notifications
  toggleSound(enabled) {
    this.isSoundEnabled = enabled;
    console.log(`🔔 Sound notifications ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Toggle vibration notifications
  toggleVibration(enabled) {
    this.isVibrationEnabled = enabled;
    console.log(`🔔 Vibration notifications ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Toggle haptic feedback
  toggleHaptics(enabled) {
    this.isHapticsEnabled = enabled;
    console.log(`🔔 Haptic feedback ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Clear all notifications
  async clearAllNotifications() {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.warn('🔔 Could not clear notifications:', error);
    }
  }

  // Get notification settings
  getSettings() {
    return {
      sound: this.isSoundEnabled,
      vibration: this.isVibrationEnabled,
      haptics: this.isHapticsEnabled,
    };
  }

  // Cleanup resources
  async cleanup() {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
      }
      await this.clearAllNotifications();
    } catch (error) {
      console.error('🔔 Error cleaning up notification service:', error);
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService; 