import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Video, ResizeMode } from 'expo-av';
import { Camera } from 'expo-camera';
import * as Permissions from 'expo-permissions';

// Import our enhanced services
import enhancedRealTimeManager from '../utils/enhancedRealTimeManager';
import apiService from '../utils/api';

const { width, height } = Dimensions.get('window');

const VoiceVideoCommunication = () => {
  // State management
  const [activeCalls, setActiveCalls] = useState(new Map());
  const [incomingCalls, setIncomingCalls] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [currentCall, setCurrentCall] = useState(null);
  const [callType, setCallType] = useState('voice'); // 'voice' or 'video'
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callQuality, setCallQuality] = useState(0);
  const [showCallModal, setShowCallModal] = useState(false);
  const [permissions, setPermissions] = useState({
    audio: false,
    video: false,
  });

  // Animation refs
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const callAnimation = useRef(new Animated.Value(0)).current;
  const incomingCallAnimation = useRef(new Animated.Value(0)).current;

  // Refs for cleanup
  const callTimer = useRef(null);
  const qualityCheckInterval = useRef(null);
  const videoRef = useRef(null);
  const cameraRef = useRef(null);

  // Initialize communication system
  useEffect(() => {
    initializeCommunication();
    setupEventListeners();
    requestPermissions();
    
    return () => {
      cleanup();
    };
  }, []);

  // Initialize communication system
  const initializeCommunication = async () => {
    try {
      // Connect to real-time manager
      await enhancedRealTimeManager.connect();
      
      // Load call history
      await loadCallHistory();
      
      console.log('📞 Voice/Video communication initialized');
    } catch (error) {
      console.error('📞 Failed to initialize communication:', error);
    }
  };

  // Request permissions
  const requestPermissions = async () => {
    try {
      // Request audio permissions
      const audioPermission = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
      setPermissions(prev => ({ ...prev, audio: audioPermission.status === 'granted' }));

      // Request video permissions
      const videoPermission = await Camera.requestCameraPermissionsAsync();
      setPermissions(prev => ({ ...prev, video: videoPermission.status === 'granted' }));

      if (!audioPermission.status === 'granted') {
        Alert.alert(
          'Audio Permission Required',
          'This app needs microphone access for voice calls.',
          [{ text: 'OK' }]
        );
      }

      if (!videoPermission.status === 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'This app needs camera access for video calls.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('📞 Error requesting permissions:', error);
    }
  };

  // Setup event listeners
  const setupEventListeners = () => {
    // Incoming call
    enhancedRealTimeManager.on('call:incoming', (callData) => {
      handleIncomingCall(callData);
    });

    // Call accepted
    enhancedRealTimeManager.on('call:accepted', (callData) => {
      handleCallAccepted(callData);
    });

    // Call rejected
    enhancedRealTimeManager.on('call:rejected', (callData) => {
      handleCallRejected(callData);
    });

    // Call ended
    enhancedRealTimeManager.on('call:ended', (callData) => {
      handleCallEnded(callData);
    });

    // Call quality updates
    enhancedRealTimeManager.on('call:quality', (quality) => {
      setCallQuality(quality);
    });

    // Call duration updates
    enhancedRealTimeManager.on('call:duration', (duration) => {
      setCallDuration(duration);
    });
  };

  // Handle incoming call
  const handleIncomingCall = (callData) => {
    setIncomingCalls(prev => [...prev, callData]);
    
    // Trigger haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Start incoming call animation
    startIncomingCallAnimation();
    
    // Show incoming call modal
    setShowCallModal(true);
    setCurrentCall(callData);
    setCallType(callData.type);

    console.log('📞 Incoming call:', callData);
  };

  // Handle call accepted
  const handleCallAccepted = (callData) => {
    setCurrentCall(callData);
    setActiveCalls(prev => new Map(prev.set(callData.id, callData)));
    
    // Remove from incoming calls
    setIncomingCalls(prev => prev.filter(call => call.id !== callData.id));
    
    // Start call timer
    startCallTimer();
    
    // Start quality monitoring
    startQualityMonitoring();
    
    console.log('📞 Call accepted:', callData);
  };

  // Handle call rejected
  const handleCallRejected = (callData) => {
    // Remove from incoming calls
    setIncomingCalls(prev => prev.filter(call => call.id !== callData.id));
    
    // Add to call history
    addToCallHistory({
      ...callData,
      status: 'rejected',
      duration: 0,
      timestamp: new Date().toISOString(),
    });
    
    console.log('📞 Call rejected:', callData);
  };

  // Handle call ended
  const handleCallEnded = (callData) => {
    setCurrentCall(null);
    setActiveCalls(prev => {
      const newMap = new Map(prev);
      newMap.delete(callData.id);
      return newMap;
    });
    
    // Stop call timer
    stopCallTimer();
    
    // Stop quality monitoring
    stopQualityMonitoring();
    
    // Add to call history
    addToCallHistory({
      ...callData,
      status: 'ended',
      duration: callDuration,
      timestamp: new Date().toISOString(),
    });
    
    // Reset call state
    setCallDuration(0);
    setCallQuality(0);
    setIsMuted(false);
    setIsSpeakerOn(false);
    setIsCameraOn(true);
    
    console.log('📞 Call ended:', callData);
  };

  // Accept call
  const acceptCall = async (callData) => {
    try {
      await enhancedRealTimeManager.acceptCall(callData.id);
      handleCallAccepted(callData);
      setShowCallModal(false);
    } catch (error) {
      console.error('📞 Error accepting call:', error);
      Alert.alert('Error', 'Failed to accept call. Please try again.');
    }
  };

  // Reject call
  const rejectCall = async (callData) => {
    try {
      await enhancedRealTimeManager.rejectCall(callData.id);
      handleCallRejected(callData);
      setShowCallModal(false);
    } catch (error) {
      console.error('📞 Error rejecting call:', error);
    }
  };

  // End call
  const endCall = async () => {
    if (!currentCall) return;

    try {
      await enhancedRealTimeManager.endCall(currentCall.id);
      handleCallEnded(currentCall);
    } catch (error) {
      console.error('📞 Error ending call:', error);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Send mute state to server
    if (currentCall) {
      enhancedRealTimeManager.emit('call:mute', {
        callId: currentCall.id,
        muted: !isMuted,
      });
    }
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // Handle speaker toggle logic
  };

  // Toggle camera
  const toggleCamera = () => {
    if (callType === 'video') {
      setIsCameraOn(!isCameraOn);
      // Send camera state to server
      if (currentCall) {
        enhancedRealTimeManager.emit('call:camera', {
          callId: currentCall.id,
          cameraOn: !isCameraOn,
        });
      }
    }
  };

  // Start call timer
  const startCallTimer = () => {
    callTimer.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  // Stop call timer
  const stopCallTimer = () => {
    if (callTimer.current) {
      clearInterval(callTimer.current);
      callTimer.current = null;
    }
  };

  // Start quality monitoring
  const startQualityMonitoring = () => {
    qualityCheckInterval.current = setInterval(async () => {
      try {
        const quality = await apiService.getCallQuality(currentCall?.id);
        setCallQuality(quality);
      } catch (error) {
        console.error('📞 Error checking call quality:', error);
      }
    }, 5000);
  };

  // Stop quality monitoring
  const stopQualityMonitoring = () => {
    if (qualityCheckInterval.current) {
      clearInterval(qualityCheckInterval.current);
      qualityCheckInterval.current = null;
    }
  };

  // Load call history
  const loadCallHistory = async () => {
    try {
      const history = await apiService.getCallHistory();
      setCallHistory(history);
    } catch (error) {
      console.error('📞 Error loading call history:', error);
    }
  };

  // Add to call history
  const addToCallHistory = (callData) => {
    setCallHistory(prev => [callData, ...prev].slice(0, 50));
  };

  // Start incoming call animation
  const startIncomingCallAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(incomingCallAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(incomingCallAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Stop incoming call animation
  const stopIncomingCallAnimation = () => {
    incomingCallAnimation.setValue(0);
  };

  // Format call duration
  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get call quality color
  const getCallQualityColor = (quality) => {
    if (quality >= 80) return '#00AA00';
    if (quality >= 60) return '#FFAA00';
    return '#FF4444';
  };

  // Get call quality text
  const getCallQualityText = (quality) => {
    if (quality >= 80) return 'Excellent';
    if (quality >= 60) return 'Good';
    if (quality >= 40) return 'Fair';
    return 'Poor';
  };

  // Cleanup
  const cleanup = () => {
    stopCallTimer();
    stopQualityMonitoring();
    stopIncomingCallAnimation();
    
    enhancedRealTimeManager.off('call:incoming');
    enhancedRealTimeManager.off('call:accepted');
    enhancedRealTimeManager.off('call:rejected');
    enhancedRealTimeManager.off('call:ended');
    enhancedRealTimeManager.off('call:quality');
    enhancedRealTimeManager.off('call:duration');
  };

  // Render active calls
  const renderActiveCalls = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Active Calls</Text>
      {Array.from(activeCalls.values()).map(call => (
        <View key={call.id} style={styles.activeCallCard}>
          <View style={styles.callHeader}>
            <Ionicons
              name={call.type === 'video' ? 'videocam' : 'call'}
              size={20}
              color="#007AFF"
            />
            <Text style={styles.callTitle}>
              {call.type === 'video' ? 'Video Call' : 'Voice Call'}
            </Text>
            <Text style={styles.callDuration}>
              {formatCallDuration(callDuration)}
            </Text>
          </View>
          
          <View style={styles.callInfo}>
            <Text style={styles.callParticipant}>{call.participant}</Text>
            <Text style={styles.callQuality}>
              Quality: {getCallQualityText(callQuality)}
            </Text>
          </View>

          <View style={styles.callControls}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: isMuted ? '#FF4444' : '#007AFF' }]}
              onPress={toggleMute}
            >
              <Ionicons
                name={isMuted ? 'mic-off' : 'mic'}
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {call.type === 'video' && (
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: isCameraOn ? '#007AFF' : '#FF4444' }]}
                onPress={toggleCamera}
              >
                <Ionicons
                  name={isCameraOn ? 'videocam' : 'videocam-off'}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: '#FF4444' }]}
              onPress={endCall}
            >
              <Ionicons name="call" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
      {activeCalls.size === 0 && (
        <Text style={styles.noActiveCalls}>No active calls</Text>
      )}
    </View>
  );

  // Render incoming calls
  const renderIncomingCalls = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Incoming Calls</Text>
      {incomingCalls.map(call => (
        <Animated.View
          key={call.id}
          style={[
            styles.incomingCallCard,
            {
              transform: [{ scale: incomingCallAnimation }],
              opacity: incomingCallAnimation,
            }
          ]}
        >
          <View style={styles.callHeader}>
            <Ionicons
              name={call.type === 'video' ? 'videocam' : 'call'}
              size={20}
              color="#FFAA00"
            />
            <Text style={styles.callTitle}>
              Incoming {call.type === 'video' ? 'Video' : 'Voice'} Call
            </Text>
          </View>
          
          <Text style={styles.callParticipant}>{call.participant}</Text>
          
          <View style={styles.incomingCallControls}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: '#00AA00' }]}
              onPress={() => acceptCall(call)}
            >
              <Ionicons name="call" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: '#FF4444' }]}
              onPress={() => rejectCall(call)}
            >
              <Ionicons name="call-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      ))}
      {incomingCalls.length === 0 && (
        <Text style={styles.noIncomingCalls}>No incoming calls</Text>
      )}
    </View>
  );

  // Render call history
  const renderCallHistory = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Call History</Text>
      <ScrollView style={styles.historyContainer} showsVerticalScrollIndicator={false}>
        {callHistory.map((call, index) => (
          <View key={index} style={styles.historyItem}>
            <View style={styles.historyHeader}>
              <Ionicons
                name={call.type === 'video' ? 'videocam' : 'call'}
                size={16}
                color={call.status === 'ended' ? '#00AA00' : '#FF4444'}
              />
              <Text style={styles.historyTitle}>
                {call.type === 'video' ? 'Video Call' : 'Voice Call'}
              </Text>
              <Text style={styles.historyTime}>
                {new Date(call.timestamp).toLocaleTimeString()}
              </Text>
            </View>
            
            <Text style={styles.historyParticipant}>{call.participant}</Text>
            
            <View style={styles.historyDetails}>
              <Text style={styles.historyStatus}>
                Status: {call.status}
              </Text>
              <Text style={styles.historyDuration}>
                Duration: {formatCallDuration(call.duration)}
              </Text>
            </View>
          </View>
        ))}
        {callHistory.length === 0 && (
          <Text style={styles.noHistory}>No call history</Text>
        )}
      </ScrollView>
    </View>
  );

  // Render call modal
  const renderCallModal = () => (
    <Modal
      visible={showCallModal}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Ionicons
              name={callType === 'video' ? 'videocam' : 'call'}
              size={40}
              color="#007AFF"
            />
            <Text style={styles.modalTitle}>
              Incoming {callType === 'video' ? 'Video' : 'Voice'} Call
            </Text>
            <Text style={styles.modalParticipant}>
              {currentCall?.participant}
            </Text>
          </View>

          <View style={styles.modalControls}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#00AA00' }]}
              onPress={() => acceptCall(currentCall)}
            >
              <Ionicons name="call" size={30} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#FF4444' }]}
              onPress={() => rejectCall(currentCall)}
            >
              <Ionicons name="call-outline" size={30} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="call" size={24} color="#007AFF" />
        <Text style={styles.headerTitle}>Voice & Video Communication</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderActiveCalls()}
        {renderIncomingCalls()}
        {renderCallHistory()}
      </ScrollView>

      {renderCallModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  activeCallCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00AA00',
  },
  callHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  callTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  callDuration: {
    fontSize: 14,
    color: '#666',
  },
  callInfo: {
    marginBottom: 12,
  },
  callParticipant: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  callQuality: {
    fontSize: 12,
    color: '#666',
  },
  callControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noActiveCalls: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
  incomingCallCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFAA00',
  },
  incomingCallControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  noIncomingCalls: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
  historyContainer: {
    maxHeight: 300,
  },
  historyItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: 4,
  },
  historyTime: {
    fontSize: 12,
    color: '#666',
  },
  historyParticipant: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyStatus: {
    fontSize: 12,
    color: '#666',
  },
  historyDuration: {
    fontSize: 12,
    color: '#666',
  },
  noHistory: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  modalParticipant: {
    fontSize: 16,
    color: '#666',
  },
  modalControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VoiceVideoCommunication; 