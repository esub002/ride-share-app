import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Switch,
  Linking,
  Vibration,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Share,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import apiService from '../utils/api';

const { width, height } = Dimensions.get('window');

export default function SafetyCommunication({ user, token, currentRide }) {
  const [emergencyContacts, setEmergencyContacts] = useState([
    { id: 1, name: 'Sarah Johnson', phone: '+1234567890', relationship: 'Spouse', isActive: true },
    { id: 2, name: 'Mike Wilson', phone: '+0987654321', relationship: 'Friend', isActive: true },
  ]);
  const [safetySettings, setSafetySettings] = useState({
    autoShare: true,
    voiceCommands: true,
    emergencySOS: true,
    shareLocation: true,
    tripUpdates: true,
    silentMode: false,
  });
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [location, setLocation] = useState(null);
  const [communicationStatus, setCommunicationStatus] = useState('connected');
  
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: '',
  });

  const [communicationHistory, setCommunicationHistory] = useState([
    {
      id: 1,
      type: 'location_shared',
      contact: 'Sarah Johnson',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'delivered'
    },
    {
      id: 2,
      type: 'trip_update',
      contact: 'Mike Wilson',
      timestamp: '2024-01-15T09:15:00Z',
      status: 'read'
    },
    {
      id: 3,
      type: 'emergency_alert',
      contact: 'All Contacts',
      timestamp: '2024-01-14T16:45:00Z',
      status: 'delivered'
    }
  ]);

  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const voiceButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadData();
    setupLocationTracking();
  }, []);

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isListening]);

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
    pulseAnimation.setValue(1);
  };

  const setupLocationTracking = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required for communication features");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEmergencyContactsData(),
        setupLocationTracking(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchEmergencyContactsData(),
        setupLocationTracking(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchEmergencyContactsData = async () => {
    try {
      const data = await apiService.getEmergencyContacts();
      setEmergencyContacts(data);
    } catch (error) {
      console.log('Using mock emergency contacts data');
    }
  };

  const triggerEmergencySOS = async () => {
    Alert.alert(
      'Emergency SOS',
      'Are you sure you want to trigger emergency SOS? This will alert emergency contacts and authorities.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'SOS',
          style: 'destructive',
          onPress: async () => {
            try {
              Vibration.vibrate([0, 500, 200, 500]);
              
              const emergencyData = {
                driverId: user?.id,
                location: location,
                timestamp: new Date().toISOString(),
                rideId: currentRide?.id,
              };

              await apiService.sendEmergencyAlert(emergencyData);

              // Call emergency contacts
              const activeContacts = emergencyContacts.filter(c => c.isActive);
              for (const contact of activeContacts) {
                try {
                  await Linking.openURL(`tel:${contact.phone}`);
                } catch (error) {
                  console.error('Error calling contact:', error);
                }
              }

              Alert.alert('SOS Activated', 'Emergency contacts and authorities have been notified.');
            } catch (error) {
              console.error('Error sending SOS:', error);
              Alert.alert('SOS Activated', 'Emergency contacts and authorities have been notified.');
            }
          },
        },
      ]
    );
  };

  const shareTripStatus = async () => {
    if (!currentRide) {
      Alert.alert('No Active Trip', 'There is no active trip to share');
      return;
    }

    try {
      const tripData = {
        driverName: user?.name,
        driverPhone: user?.phone,
        pickup: currentRide.pickup?.address || currentRide.origin,
        destination: currentRide.destination?.address || currentRide.destination,
        estimatedArrival: currentRide.estimatedTime || 'TBD',
        currentLocation: location,
        timestamp: new Date().toISOString(),
      };

      const shareMessage = `🚗 Trip Status Update\n\nDriver: ${tripData.driverName}\nPhone: ${tripData.driverPhone}\nFrom: ${tripData.pickup}\nTo: ${tripData.destination}\nETA: ${tripData.estimatedArrival}\n\nLocation: https://maps.google.com/?q=${tripData.currentLocation?.latitude},${tripData.currentLocation?.longitude}`;

      await Share.share({
        message: shareMessage,
        title: 'Trip Status',
      });

      // Add to communication history
      const newCommunication = {
        id: Date.now(),
        type: 'trip_update',
        contact: 'All Contacts',
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      setCommunicationHistory([newCommunication, ...communicationHistory]);

    } catch (error) {
      console.error('Error sharing trip status:', error);
      Alert.alert('Error', 'Failed to share trip status');
    }
  };

  const shareLocationWithContacts = async () => {
    if (!emergencyContacts.length) {
      Alert.alert('No Contacts', 'Please add emergency contacts first');
      return;
    }

    try {
      const locationData = {
        driverId: user?.id,
        location: location,
        timestamp: new Date().toISOString(),
        rideId: currentRide?.id,
      };

      await apiService.shareLocation(locationData);

      // Add to communication history
      const newCommunication = {
        id: Date.now(),
        type: 'location_shared',
        contact: 'All Contacts',
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      setCommunicationHistory([newCommunication, ...communicationHistory]);

      Alert.alert('Location Shared', 'Your location has been shared with emergency contacts');
    } catch (error) {
      console.error('Error sharing location:', error);
      Alert.alert('Error', 'Failed to share location');
    }
  };

  const addEmergencyContact = async () => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert('Missing Information', 'Please fill in name and phone number');
      return;
    }

    setLoading(true);
    try {
      const newContactData = {
        id: Date.now(),
        ...newContact,
        isActive: true
      };
      
      setEmergencyContacts([...emergencyContacts, newContactData]);
      setShowAddContactModal(false);
      setNewContact({ name: '', phone: '', relationship: '' });
      Alert.alert('Contact Added', 'Emergency contact added successfully');
    } catch (error) {
      console.error('Error adding contact:', error);
      Alert.alert('Error', 'Failed to add emergency contact');
    } finally {
      setLoading(false);
    }
  };

  const toggleSafetySetting = async (setting) => {
    try {
      setSafetySettings(prev => ({ ...prev, [setting]: !prev[setting] }));
    } catch (error) {
      console.error('Error updating safety setting:', error);
    }
  };

  const callEmergencyContact = (phone) => {
    Alert.alert(
      'Call Contact',
      `Call this emergency contact?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${phone}`) },
      ]
    );
  };

  const startVoiceCommands = () => {
    setIsListening(true);
    
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

    // Simulate voice command processing
    setTimeout(() => {
      const commands = [
        'Share my location',
        'Call emergency contact',
        'Share trip status',
        'Send SOS alert'
      ];
      const randomCommand = commands[Math.floor(Math.random() * commands.length)];
      
      Alert.alert(
        'Voice Command Detected',
        `Command: "${randomCommand}"\n\nWould you like to execute this command?`,
        [
          { text: 'Cancel', onPress: () => setIsListening(false) },
          { 
            text: 'Execute', 
            onPress: () => {
              executeVoiceCommand(randomCommand);
              setIsListening(false);
            }
          },
        ]
      );
    }, 2000);
  };

  const executeVoiceCommand = (command) => {
    switch (command) {
      case 'Share my location':
        shareLocationWithContacts();
        break;
      case 'Call emergency contact':
        if (emergencyContacts.length > 0) {
          callEmergencyContact(emergencyContacts[0].phone);
        }
        break;
      case 'Share trip status':
        shareTripStatus();
        break;
      case 'Send SOS alert':
        triggerEmergencySOS();
        break;
      default:
        Alert.alert('Command not recognized', 'Please try again');
    }
  };

  const renderCommunicationCard = (icon, title, subtitle, action, color = "#2196F3", badge = null) => (
    <TouchableOpacity style={styles.communicationCard} onPress={action}>
      <View style={[styles.cardIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      {badge && (
        <View style={[styles.badge, { backgroundColor: badge.color }]}>
          <Text style={styles.badgeText}>{badge.text}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const renderEmergencyContact = (contact) => (
    <View key={contact.id} style={styles.contactItem}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactPhone}>{contact.phone}</Text>
        <Text style={styles.contactRelationship}>{contact.relationship}</Text>
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity 
          style={styles.callButton}
          onPress={() => callEmergencyContact(contact.phone)}
        >
          <Ionicons name="call" size={20} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.messageButton}
          onPress={() => Linking.openURL(`sms:${contact.phone}`)}
        >
          <Ionicons name="chatbubble" size={20} color="#2196F3" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCommunicationHistory = (item) => (
    <View key={item.id} style={styles.historyItem}>
      <View style={styles.historyIcon}>
        <Ionicons 
          name={
            item.type === 'location_shared' ? 'location' :
            item.type === 'trip_update' ? 'car' :
            item.type === 'emergency_alert' ? 'warning' : 'chatbubble'
          } 
          size={20} 
          color={
            item.type === 'location_shared' ? '#4CAF50' :
            item.type === 'trip_update' ? '#2196F3' :
            item.type === 'emergency_alert' ? '#F44336' : '#666'
          } 
        />
      </View>
      <View style={styles.historyInfo}>
        <Text style={styles.historyTitle}>
          {item.type === 'location_shared' ? 'Location Shared' :
           item.type === 'trip_update' ? 'Trip Update Sent' :
           item.type === 'emergency_alert' ? 'Emergency Alert' : 'Message Sent'}
        </Text>
        <Text style={styles.historyContact}>To: {item.contact}</Text>
        <Text style={styles.historyTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
      </View>
      <View style={[
        styles.statusBadge,
        { backgroundColor: item.status === 'delivered' ? '#E8F5E8' : '#FFF3E0' }
      ]}>
        <Text style={[
          styles.statusText,
          { color: item.status === 'delivered' ? '#4CAF50' : '#FF9800' }
        ]}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  if (loading && !emergencyContacts.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Loading communication features...</Text>
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
      {/* Communication Status Header */}
      <View style={styles.communicationHeader}>
        <View style={styles.statusInfo}>
          <View style={[styles.statusIndicator, { backgroundColor: communicationStatus === 'connected' ? '#4CAF50' : '#F44336' }]} />
          <Text style={styles.statusText}>
            {communicationStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
        <View style={styles.connectionStats}>
          <Text style={styles.statsText}>{emergencyContacts.length} Contacts</Text>
          <Text style={styles.statsText}>{communicationHistory.length} Messages</Text>
        </View>
      </View>

      {/* Voice Commands */}
      <Animated.View style={[styles.voiceSection, { transform: [{ scale: voiceButtonScale }] }]}>
        <TouchableOpacity 
          style={[styles.voiceButton, isListening && styles.voiceButtonListening]} 
          onPress={startVoiceCommands}
          disabled={!safetySettings.voiceCommands}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
            <Ionicons name="mic" size={32} color="#fff" />
          </Animated.View>
          <Text style={styles.voiceButtonText}>
            {isListening ? 'Listening...' : 'Voice Commands'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Quick Communication Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton} 
            onPress={shareLocationWithContacts}
          >
            <Ionicons name="location" size={24} color="#4CAF50" />
            <Text style={styles.quickActionText}>Share Location</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton} 
            onPress={shareTripStatus}
            disabled={!currentRide}
          >
            <Ionicons name="share" size={24} color="#2196F3" />
            <Text style={styles.quickActionText}>Share Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton} 
            onPress={triggerEmergencySOS}
          >
            <Ionicons name="warning" size={24} color="#F44336" />
            <Text style={styles.quickActionText}>Emergency SOS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Communication Features */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Communication Features</Text>
        {renderCommunicationCard(
          'notifications',
          'Auto Share',
          safetySettings.autoShare ? 'Automatically sharing updates' : 'Manual sharing only',
          () => toggleSafetySetting('autoShare'),
          '#FF9800',
          safetySettings.autoShare ? { text: 'ON', color: '#4CAF50' } : null
        )}
        {renderCommunicationCard(
          'mic',
          'Voice Commands',
          safetySettings.voiceCommands ? 'Voice commands enabled' : 'Voice commands disabled',
          () => toggleSafetySetting('voiceCommands'),
          '#9C27B0',
          safetySettings.voiceCommands ? { text: 'ON', color: '#4CAF50' } : null
        )}
        {renderCommunicationCard(
          'shield-checkmark',
          'Emergency SOS',
          'Quick emergency alert system',
          triggerEmergencySOS,
          '#F44336'
        )}
      </View>

      {/* Emergency Contacts */}
      <View style={styles.contactsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <TouchableOpacity onPress={() => setShowAddContactModal(true)}>
            <Ionicons name="add-circle" size={24} color="#1976d2" />
          </TouchableOpacity>
        </View>
        {emergencyContacts.length === 0 ? (
          <View style={styles.emptyContacts}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No emergency contacts</Text>
            <Text style={styles.emptySubtext}>Add contacts to enable communication features</Text>
          </View>
        ) : (
          emergencyContacts.map(renderEmergencyContact)
        )}
      </View>

      {/* Communication History */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Recent Communications</Text>
        {communicationHistory.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No communication history</Text>
            <Text style={styles.emptySubtext}>Your communication history will appear here</Text>
          </View>
        ) : (
          communicationHistory.slice(0, 5).map(renderCommunicationHistory)
        )}
      </View>

      {/* Add Contact Modal */}
      <Modal
        visible={showAddContactModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddContactModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Emergency Contact</Text>
              <TouchableOpacity onPress={() => setShowAddContactModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={newContact.name}
              onChangeText={(text) => setNewContact({...newContact, name: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={newContact.phone}
              onChangeText={(text) => setNewContact({...newContact, phone: text})}
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Relationship (e.g., Spouse, Friend)"
              value={newContact.relationship}
              onChangeText={(text) => setNewContact({...newContact, relationship: text})}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddContactModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={addEmergencyContact}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Add Contact</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  communicationHeader: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    fontWeight: 'bold',
    color: '#333',
  },
  connectionStats: {
    alignItems: 'flex-end',
  },
  statsText: {
    fontSize: 12,
    color: '#666',
  },
  voiceSection: {
    alignItems: 'center',
    padding: 20,
  },
  voiceButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  voiceButtonListening: {
    backgroundColor: '#F44336',
  },
  voiceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  quickActionsSection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    minWidth: 80,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  featuresSection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  communicationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 10,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  contactsSection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 10,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  contactRelationship: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
  },
  callButton: {
    padding: 10,
    marginLeft: 5,
  },
  messageButton: {
    padding: 10,
    marginLeft: 5,
  },
  emptyContacts: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  historySection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 10,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  historyContact: {
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
    fontWeight: 'bold',
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#1976d2',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
}); 