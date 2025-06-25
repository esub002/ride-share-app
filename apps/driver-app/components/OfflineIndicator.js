import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import offlineManager from '../utils/offlineManager';

const OfflineIndicator = ({ style = {} }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const slideAnim = new Animated.Value(-50);

  useEffect(() => {
    const unsubscribe = offlineManager.addListener(({ isOnline, pendingActions }) => {
      setIsOnline(isOnline);
      setPendingActions(pendingActions);
      
      // Show indicator when offline or when there are pending actions
      const shouldShow = !isOnline || pendingActions > 0;
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

    return unsubscribe;
  }, []);

  const handleSync = async () => {
    if (isOnline && pendingActions > 0) {
      // Trigger sync of pending actions
      console.log('Manual sync triggered');
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
          name={isOnline ? "cloud-upload" : "cloud-offline"} 
          size={20} 
          color="#fff" 
        />
        <Text style={styles.text}>
          {isOnline 
            ? `Syncing ${pendingActions} pending actions...`
            : 'You are offline'
          }
        </Text>
        
        {isOnline && pendingActions > 0 && (
          <TouchableOpacity onPress={handleSync} style={styles.syncButton}>
            <Ionicons name="refresh" size={16} color="#fff" />
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
});

export default OfflineIndicator; 