import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import offlineManager from '../utils/offlineManager';

const OfflineIndicator = ({ style = {}, isAvailable, onGoOnline }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const slideAnim = new Animated.Value(-50);

  useEffect(() => {
    const unsubscribe = offlineManager.addListener(({ isOnline, pendingActions }) => {
      setIsOnline(isOnline);
      setPendingActions(pendingActions);
      
      // Show indicator when offline, when there are pending actions, or when driver is not available
      const shouldShow = !isOnline || pendingActions > 0 || !isAvailable;
      setIsVisible(shouldShow);
      
      if (shouldShow) {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.spring(slideAnim, {
          toValue: -50,
          useNativeDriver: true,
        }).start();
      }
    });

    // Also check availability status
    const shouldShow = !isAvailable;
    setIsVisible(shouldShow);
    
    if (shouldShow) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }

    return unsubscribe;
  }, [isAvailable]);

  const handleSync = async () => {
    if (isOnline && pendingActions > 0) {
      // Trigger sync of pending actions
      console.log('Manual sync triggered');
    }
  };

  const handleGoOnline = () => {
    if (onGoOnline) {
      onGoOnline();
    }
  };

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        style, 
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.content}>
        <Ionicons 
          name={!isAvailable ? "radio-button-off" : (isOnline ? "cloud-upload" : "cloud-offline")} 
          size={20} 
          color="#fff" 
        />
        <Text style={styles.text}>
          {!isAvailable 
            ? 'You are offline'
            : (isOnline 
              ? `Syncing ${pendingActions} pending actions...`
              : 'Network offline'
            )
          }
        </Text>
        
        {isOnline && pendingActions > 0 && (
          <TouchableOpacity onPress={handleSync} style={styles.syncButton}>
            <Ionicons name="refresh" size={16} color="#fff" />
          </TouchableOpacity>
        )}
        
        {/* Show Go Online button if driver is not available */}
        {!isAvailable && (
          <TouchableOpacity onPress={handleGoOnline} style={styles.goOnlineButton}>
            <Ionicons name="radio-button-on" size={16} color="#fff" />
            <Text style={styles.goOnlineText}>Go Online</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF9800',
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
    textAlign: 'center',
  },
  syncButton: {
    padding: 4,
  },
  goOnlineButton: {
    marginLeft: 12,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  goOnlineText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },
});

export default OfflineIndicator; 