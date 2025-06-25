import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import Voice from '@react-native-voice/voice';

export default function VoiceCommands({ 
  onRideAccept, 
  onRideReject, 
  onNavigate, 
  onEmergency, 
  onStatusUpdate,
  currentRide,
  isListening = false 
}) {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceCommands, setVoiceCommands] = useState([]);

  useEffect(() => {
    // Initialize voice recognition
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechStart = () => {
    setIsVoiceActive(true);
    setRecognizedText('');
  };

  const onSpeechEnd = () => {
    setIsVoiceActive(false);
  };

  const onSpeechResults = (event) => {
    const text = event.value[0];
    setRecognizedText(text);
    processVoiceCommand(text.toLowerCase());
  };

  const onSpeechError = (error) => {
    console.error('Voice recognition error:', error);
    setIsVoiceActive(false);
    speakFeedback('Sorry, I did not understand that command');
  };

  const startListening = async () => {
    try {
      await Voice.start('en-US');
      speakFeedback('Listening for commands');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  const speakFeedback = (text) => {
    Speech.speak(text, {
      language: 'en',
      pitch: 1.0,
      rate: 0.9,
    });
  };

  const processVoiceCommand = (command) => {
    setIsProcessing(true);
    
    // Ride management commands
    if (command.includes('accept ride') || command.includes('take ride')) {
      if (currentRide) {
        speakFeedback('Accepting ride');
        onRideAccept && onRideAccept();
      } else {
        speakFeedback('No ride available to accept');
      }
    }
    else if (command.includes('reject ride') || command.includes('decline ride')) {
      if (currentRide) {
        speakFeedback('Rejecting ride');
        onRideReject && onRideReject();
      } else {
        speakFeedback('No ride to reject');
      }
    }
    else if (command.includes('navigate') || command.includes('directions')) {
      if (currentRide) {
        speakFeedback('Opening navigation');
        onNavigate && onNavigate();
      } else {
        speakFeedback('No active ride for navigation');
      }
    }
    else if (command.includes('complete ride') || command.includes('finish ride')) {
      if (currentRide) {
        speakFeedback('Completing ride');
        onStatusUpdate && onStatusUpdate('complete');
      } else {
        speakFeedback('No active ride to complete');
      }
    }
    
    // Safety commands
    else if (command.includes('emergency') || command.includes('sos') || command.includes('help')) {
      speakFeedback('Activating emergency alert');
      onEmergency && onEmergency();
    }
    else if (command.includes('share trip') || command.includes('share location')) {
      speakFeedback('Sharing trip status');
      onStatusUpdate && onStatusUpdate('share');
    }
    
    // Status commands
    else if (command.includes('go online') || command.includes('available')) {
      speakFeedback('Going online');
      onStatusUpdate && onStatusUpdate('online');
    }
    else if (command.includes('go offline') || command.includes('unavailable')) {
      speakFeedback('Going offline');
      onStatusUpdate && onStatusUpdate('offline');
    }
    else if (command.includes('earnings') || command.includes('money')) {
      speakFeedback('Opening earnings');
      onStatusUpdate && onStatusUpdate('earnings');
    }
    
    // Navigation commands
    else if (command.includes('pickup') || command.includes('pick up')) {
      if (currentRide && currentRide.pickup) {
        speakFeedback('Navigating to pickup location');
        onNavigate && onNavigate('pickup');
      }
    }
    else if (command.includes('destination') || command.includes('drop off')) {
      if (currentRide && currentRide.destination) {
        speakFeedback('Navigating to destination');
        onNavigate && onNavigate('destination');
      }
    }
    
    // Help commands
    else if (command.includes('help') || command.includes('commands')) {
      speakFeedback('Available commands: accept ride, reject ride, navigate, complete ride, emergency, go online, go offline, earnings');
    }
    else {
      speakFeedback('Command not recognized. Say help for available commands');
    }
    
    setIsProcessing(false);
  };

  const toggleVoiceCommands = () => {
    if (isVoiceActive) {
      stopListening();
    } else {
      startListening();
    }
  };

  const availableCommands = [
    { command: 'Accept Ride', description: 'Accept current ride request' },
    { command: 'Reject Ride', description: 'Reject current ride request' },
    { command: 'Navigate', description: 'Open navigation to current destination' },
    { command: 'Complete Ride', description: 'Mark current ride as completed' },
    { command: 'Emergency', description: 'Activate emergency SOS' },
    { command: 'Share Trip', description: 'Share current trip status' },
    { command: 'Go Online', description: 'Set status as available' },
    { command: 'Go Offline', description: 'Set status as unavailable' },
    { command: 'Earnings', description: 'Check earnings' },
    { command: 'Help', description: 'List all available commands' },
  ];

  return (
    <View style={styles.container}>
      {/* Voice Command Button */}
      <TouchableOpacity
        style={[
          styles.voiceButton,
          isVoiceActive && styles.voiceButtonActive,
          isProcessing && styles.voiceButtonProcessing
        ]}
        onPress={toggleVoiceCommands}
        disabled={isProcessing}
      >
        <Ionicons 
          name={isVoiceActive ? "mic" : "mic-outline"} 
          size={32} 
          color={isVoiceActive ? "#fff" : "#2196F3"} 
        />
        {isProcessing && (
          <ActivityIndicator 
            size="small" 
            color="#fff" 
            style={styles.processingIndicator} 
          />
        )}
      </TouchableOpacity>

      {/* Status Text */}
      {isVoiceActive && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {recognizedText ? `"${recognizedText}"` : 'Listening...'}
          </Text>
        </View>
      )}

      {/* Commands List */}
      <ScrollView style={styles.commandsList}>
        <Text style={styles.commandsTitle}>Voice Commands</Text>
        {availableCommands.map((cmd, index) => (
          <View key={index} style={styles.commandItem}>
            <Text style={styles.commandText}>{cmd.command}</Text>
            <Text style={styles.commandDescription}>{cmd.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Tips:</Text>
        <Text style={styles.tipText}>• Speak clearly and naturally</Text>
        <Text style={styles.tipText}>• Use simple, direct commands</Text>
        <Text style={styles.tipText}>• Say "help" to hear all commands</Text>
        <Text style={styles.tipText}>• Works best in quiet environments</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  voiceButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  voiceButtonActive: {
    backgroundColor: '#2196F3',
    transform: [{ scale: 1.1 }],
  },
  voiceButtonProcessing: {
    backgroundColor: '#FF9800',
  },
  processingIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
  },
  commandsList: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  commandsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  commandItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  commandText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 5,
  },
  commandDescription: {
    fontSize: 14,
    color: '#666',
  },
  tipsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
}); 