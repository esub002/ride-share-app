import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  ActivityIndicator,
  Switch,
  RefreshControl,
  Linking,
  Vibration
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function VoiceCommands({ user, token, currentRide }) {
  const [isListening, setIsListening] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [settings, setSettings] = useState({
    autoExecute: false,
    voiceFeedback: true,
    vibrationFeedback: true,
    sensitivity: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const voiceButtonScale = useRef(new Animated.Value(1)).current;
  const waveAnimation = useRef(new Animated.Value(0)).current;

  // Voice command definitions
  const voiceCommands = [
    {
      command: 'share location',
      action: 'shareLocation',
      description: 'Share current location with emergency contacts',
      icon: 'location',
      color: '#4CAF50'
    },
    {
      command: 'call emergency',
      action: 'callEmergency',
      description: 'Call primary emergency contact',
      icon: 'call',
      color: '#F44336'
    },
    {
      command: 'share trip',
      action: 'shareTrip',
      description: 'Share current trip status',
      icon: 'car',
      color: '#2196F3'
    },
    {
      command: 'sos alert',
      action: 'sosAlert',
      description: 'Send emergency SOS alert',
      icon: 'warning',
      color: '#F44336'
    },
    {
      command: 'go online',
      action: 'goOnline',
      description: 'Set driver status to online',
      icon: 'radio-button-on',
      color: '#4CAF50'
    },
    {
      command: 'go offline',
      action: 'goOffline',
      description: 'Set driver status to offline',
      icon: 'radio-button-off',
      color: '#9E9E9E'
    },
    {
      command: 'accept ride',
      action: 'acceptRide',
      description: 'Accept current ride request',
      icon: 'checkmark-circle',
      color: '#4CAF50'
    },
    {
      command: 'reject ride',
      action: 'rejectRide',
      description: 'Reject current ride request',
      icon: 'close-circle',
      color: '#F44336'
    },
    {
      command: 'start navigation',
      action: 'startNavigation',
      description: 'Start navigation to destination',
      icon: 'navigate',
      color: '#2196F3'
    },
    {
      command: 'complete ride',
      action: 'completeRide',
      description: 'Mark current ride as complete',
      icon: 'flag',
      color: '#4CAF50'
    }
  ];

  useEffect(() => {
    loadSettings();
    loadCommandHistory();
  }, []);

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
      startWaveAnimation();
    } else {
      stopPulseAnimation();
      stopWaveAnimation();
    }
  }, [isListening]);

  const loadSettings = async () => {
    try {
      // Load settings from AsyncStorage or API
      // For now, using default settings
    } catch (error) {
      console.error('Error loading voice command settings:', error);
    }
  };

  const loadCommandHistory = async () => {
    try {
      // Load command history from API
      const mockHistory = [
        {
          id: 1,
          command: 'share location',
          timestamp: new Date(Date.now() - 300000),
          status: 'executed',
          result: 'Location shared with 2 contacts'
        },
        {
          id: 2,
          command: 'accept ride',
          timestamp: new Date(Date.now() - 600000),
          status: 'executed',
          result: 'Ride accepted successfully'
        },
        {
          id: 3,
          command: 'call emergency',
          timestamp: new Date(Date.now() - 900000),
          status: 'failed',
          result: 'No emergency contacts found'
        }
      ];
      setCommandHistory(mockHistory);
    } catch (error) {
      console.error('Error loading command history:', error);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnimation.stopAnimation();
    pulseAnimation.setValue(1);
  };

  const startWaveAnimation = () => {
    Animated.loop(
      Animated.timing(waveAnimation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopWaveAnimation = () => {
    waveAnimation.stopAnimation();
    waveAnimation.setValue(0);
  };

  const startVoiceRecognition = () => {
    if (!isEnabled) {
      Alert.alert('Voice Commands Disabled', 'Please enable voice commands in settings');
      return;
    }

    setIsListening(true);
    setCurrentCommand('');

    // Animate voice button
    Animated.sequence([
      Animated.timing(voiceButtonScale, {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(voiceButtonScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Simulate voice recognition (replace with actual speech recognition)
    setTimeout(() => {
      simulateVoiceRecognition();
    }, 2000);
  };

  const simulateVoiceRecognition = () => {
    const commands = voiceCommands.map(cmd => cmd.command);
    const randomCommand = commands[Math.floor(Math.random() * commands.length)];
    
    setCurrentCommand(randomCommand);
    
    if (settings.autoExecute) {
      executeCommand(randomCommand);
    } else {
      showCommandConfirmation(randomCommand);
    }
  };

  const showCommandConfirmation = (command) => {
    const commandInfo = voiceCommands.find(cmd => cmd.command === command);
    
    Alert.alert(
      'Voice Command Detected',
      `Command: "${command}"\n\n${commandInfo?.description || 'Unknown command'}\n\nWould you like to execute this command?`,
      [
        { 
          text: 'Cancel', 
          onPress: () => {
            setIsListening(false);
            setCurrentCommand('');
            addToHistory(command, 'cancelled', 'Command cancelled by user');
          }
        },
        { 
          text: 'Execute', 
          onPress: () => {
            executeCommand(command);
          }
        },
      ]
    );
  };

  const executeCommand = async (command) => {
    setIsListening(false);
    setLoading(true);

    try {
      const commandInfo = voiceCommands.find(cmd => cmd.command === command);
      
      if (!commandInfo) {
        throw new Error('Unknown command');
      }

      let result = '';
      
      switch (commandInfo.action) {
        case 'shareLocation':
          result = await shareLocation();
          break;
        case 'callEmergency':
          result = await callEmergency();
          break;
        case 'shareTrip':
          result = await shareTrip();
          break;
        case 'sosAlert':
          result = await sendSOSAlert();
          break;
        case 'goOnline':
          result = await goOnline();
          break;
        case 'goOffline':
          result = await goOffline();
          break;
        case 'acceptRide':
          result = await acceptRide();
          break;
        case 'rejectRide':
          result = await rejectRide();
          break;
        case 'startNavigation':
          result = await startNavigation();
          break;
        case 'completeRide':
          result = await completeRide();
          break;
        default:
          result = 'Command not implemented';
      }

      addToHistory(command, 'executed', result);
      
      if (settings.voiceFeedback) {
        // Add voice feedback here
        console.log(`Executed: ${command}`);
      }
      
      if (settings.vibrationFeedback) {
        Vibration.vibrate(100);
      }

    } catch (error) {
      console.error('Error executing command:', error);
      addToHistory(command, 'failed', error.message);
      Alert.alert('Command Failed', error.message);
    } finally {
      setLoading(false);
      setCurrentCommand('');
    }
  };

  const addToHistory = (command, status, result) => {
    const newEntry = {
      id: Date.now(),
      command,
      timestamp: new Date(),
      status,
      result
    };
    setCommandHistory(prev => [newEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
  };

  // Command execution functions
  const shareLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({});
      // Send location to backend
      return 'Location shared with emergency contacts';
    } catch (error) {
      throw new Error('Failed to share location');
    }
  };

  const callEmergency = async () => {
    try {
      // Get emergency contacts from backend
      const emergencyContacts = []; // Replace with API call
      if (emergencyContacts.length === 0) {
        throw new Error('No emergency contacts found');
      }
      
      const phone = emergencyContacts[0].phone;
      await Linking.openURL(`tel:${phone}`);
      return 'Emergency contact called';
    } catch (error) {
      throw new Error('Failed to call emergency contact');
    }
  };

  const shareTrip = async () => {
    try {
      if (!currentRide) {
        throw new Error('No active trip to share');
      }
      // Share trip status via backend
      return 'Trip status shared';
    } catch (error) {
      throw new Error('Failed to share trip status');
    }
  };

  const sendSOSAlert = async () => {
    try {
      // Send SOS alert via backend
      return 'SOS alert sent to emergency contacts and authorities';
    } catch (error) {
      throw new Error('Failed to send SOS alert');
    }
  };

  const goOnline = async () => {
    try {
      // Update driver status via backend
      return 'Driver status set to online';
    } catch (error) {
      throw new Error('Failed to go online');
    }
  };

  const goOffline = async () => {
    try {
      // Update driver status via backend
      return 'Driver status set to offline';
    } catch (error) {
      throw new Error('Failed to go offline');
    }
  };

  const acceptRide = async () => {
    try {
      if (!currentRide) {
        throw new Error('No ride request to accept');
      }
      // Accept ride via backend
      return 'Ride accepted successfully';
    } catch (error) {
      throw new Error('Failed to accept ride');
    }
  };

  const rejectRide = async () => {
    try {
      if (!currentRide) {
        throw new Error('No ride request to reject');
      }
      // Reject ride via backend
      return 'Ride rejected';
    } catch (error) {
      throw new Error('Failed to reject ride');
    }
  };

  const startNavigation = async () => {
    try {
      if (!currentRide?.destination) {
        throw new Error('No destination to navigate to');
      }
      // Start navigation
      return 'Navigation started';
    } catch (error) {
      throw new Error('Failed to start navigation');
    }
  };

  const completeRide = async () => {
    try {
      if (!currentRide) {
        throw new Error('No active ride to complete');
      }
      // Complete ride via backend
      return 'Ride completed successfully';
    } catch (error) {
      throw new Error('Failed to complete ride');
    }
  };

  const toggleSetting = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadSettings(),
      loadCommandHistory()
    ]);
    setRefreshing(false);
  };

  const renderCommandItem = (commandInfo) => (
    <View key={commandInfo.command} style={styles.commandItem}>
      <View style={[styles.commandIcon, { backgroundColor: commandInfo.color + '20' }]}>
        <Ionicons name={commandInfo.icon} size={24} color={commandInfo.color} />
      </View>
      <View style={styles.commandInfo}>
        <Text style={styles.commandText}>{commandInfo.command}</Text>
        <Text style={styles.commandDescription}>{commandInfo.description}</Text>
      </View>
    </View>
  );

  const renderHistoryItem = (item) => (
    <View key={item.id} style={styles.historyItem}>
      <View style={styles.historyIcon}>
        <Ionicons 
          name={
            item.status === 'executed' ? 'checkmark-circle' :
            item.status === 'failed' ? 'close-circle' : 'time'
          } 
          size={20} 
          color={
            item.status === 'executed' ? '#4CAF50' :
            item.status === 'failed' ? '#F44336' : '#FF9800'
          } 
        />
      </View>
      <View style={styles.historyInfo}>
        <Text style={styles.historyCommand}>{item.command}</Text>
        <Text style={styles.historyResult}>{item.result}</Text>
        <Text style={styles.historyTime}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      <View style={[
        styles.statusBadge,
        { backgroundColor: 
          item.status === 'executed' ? '#E8F5E8' :
          item.status === 'failed' ? '#FFEBEE' : '#FFF3E0'
        }
      ]}>
        <Text style={[
          styles.statusText,
          { color: 
            item.status === 'executed' ? '#4CAF50' :
            item.status === 'failed' ? '#F44336' : '#FF9800'
          }
        ]}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Processing voice command...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Voice Command Status */}
      <View style={styles.statusHeader}>
        <View style={styles.statusInfo}>
          <View style={[styles.statusIndicator, { backgroundColor: isEnabled ? '#4CAF50' : '#F44336' }]} />
          <Text style={styles.statusText}>
            Voice Commands {isEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={setIsEnabled}
          trackColor={{ false: '#767577', true: '#81c784' }}
          thumbColor={isEnabled ? '#4CAF50' : '#f4f3f4'}
        />
      </View>

      {/* Voice Command Button */}
      <Animated.View style={[styles.voiceSection, { transform: [{ scale: voiceButtonScale }] }]}>
        <TouchableOpacity 
          style={[styles.voiceButton, isListening && styles.voiceButtonListening]} 
          onPress={startVoiceRecognition}
          disabled={!isEnabled || loading}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
            <Ionicons name="mic" size={32} color="#fff" />
          </Animated.View>
          <Text style={styles.voiceButtonText}>
            {isListening ? 'Listening...' : 'Tap to Speak'}
          </Text>
          {currentCommand && (
            <Text style={styles.currentCommand}>"{currentCommand}"</Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Available Commands */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Commands</Text>
        <View style={styles.commandsList}>
          {voiceCommands.map(renderCommandItem)}
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingsList}>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Auto Execute Commands</Text>
            <Switch
              value={settings.autoExecute}
              onValueChange={() => toggleSetting('autoExecute')}
              trackColor={{ false: '#767577', true: '#81c784' }}
              thumbColor={settings.autoExecute ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Voice Feedback</Text>
            <Switch
              value={settings.voiceFeedback}
              onValueChange={() => toggleSetting('voiceFeedback')}
              trackColor={{ false: '#767577', true: '#81c784' }}
              thumbColor={settings.voiceFeedback ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Vibration Feedback</Text>
            <Switch
              value={settings.vibrationFeedback}
              onValueChange={() => toggleSetting('vibrationFeedback')}
              trackColor={{ false: '#767577', true: '#81c784' }}
              thumbColor={settings.vibrationFeedback ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      {/* Command History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Commands</Text>
        <View style={styles.historyList}>
          {commandHistory.length > 0 ? (
            commandHistory.map(renderHistoryItem)
          ) : (
            <Text style={styles.emptyText}>No commands executed yet</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  voiceSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  voiceButton: {
    backgroundColor: '#2196F3',
    borderRadius: 50,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  voiceButtonListening: {
    backgroundColor: '#F44336',
  },
  voiceButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  currentCommand: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  commandsList: {
    gap: 12,
  },
  commandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  commandIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commandInfo: {
    flex: 1,
  },
  commandText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  commandDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingsList: {
    gap: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  historyIcon: {
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyCommand: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  historyResult: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  historyTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    fontStyle: 'italic',
    padding: 24,
  },
}); 