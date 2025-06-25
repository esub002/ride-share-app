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
  TextInput,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import NotificationService from '../utils/notifications';

export default function AdvancedSafety({ 
  user, 
  currentRide, 
  onEmergencyAlert,
  onTripShare 
}) {
  const [emergencyContacts, setEmergencyContacts] = useState([
    { id: 1, name: 'Emergency Contact 1', phone: '+1234567890', isActive: true },
    { id: 2, name: 'Emergency Contact 2', phone: '+0987654321', isActive: false },
  ]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [isSharingTrip, setIsSharingTrip] = useState(false);
  const [safetySettings, setSafetySettings] = useState({
    autoShareLocation: true,
    shareTripStatus: true,
    emergencyAlerts: true,
    voiceCommands: true,
  });
  const [driverVerification, setDriverVerification] = useState({
    licenseVerified: true,
    backgroundCheck: true,
    vehicleInspection: false,
    insuranceVerified: true,
  });

  // Emergency SOS Function
  const activateEmergencySOS = async () => {
    Alert.alert(
      'Emergency SOS',
      'Are you sure you want to activate emergency alert? This will notify emergency contacts and authorities.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Activate SOS', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Get current location
              const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
              });

              // Send emergency alert to backend
              const emergencyData = {
                driverId: user?.id,
                location: {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                },
                timestamp: new Date().toISOString(),
                rideId: currentRide?.id,
                rideStatus: currentRide?.status,
              };

              // Send push notification to emergency contacts
              await NotificationService.scheduleLocalNotification(
                'Emergency Alert',
                'Driver has activated emergency SOS',
                { type: 'emergency_sos', data: emergencyData }
              );

              // Call emergency contacts
              const activeContacts = emergencyContacts.filter(contact => contact.isActive);
              for (const contact of activeContacts) {
                try {
                  await Linking.openURL(`tel:${contact.phone}`);
                } catch (error) {
                  console.error('Error calling contact:', error);
                }
              }

              onEmergencyAlert && onEmergencyAlert(emergencyData);
              Alert.alert('Emergency Alert Sent', 'Emergency contacts have been notified.');
            } catch (error) {
              console.error('Error activating emergency SOS:', error);
              Alert.alert('Error', 'Failed to activate emergency alert');
            }
          }
        }
      ]
    );
  };

  // Share Trip Status
  const shareTripStatus = async () => {
    if (!currentRide) {
      Alert.alert('No Active Trip', 'There is no active trip to share');
      return;
    }

    setIsSharingTrip(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const tripData = {
        driverName: user?.name,
        driverPhone: user?.phone,
        pickup: currentRide.pickup?.address || currentRide.origin,
        destination: currentRide.destination?.address || currentRide.destination,
        estimatedArrival: currentRide.estimatedTime || 'TBD',
        currentLocation: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        timestamp: new Date().toISOString(),
      };

      const shareMessage = `🚗 Trip Status Update\n\nDriver: ${tripData.driverName}\nPhone: ${tripData.driverPhone}\nFrom: ${tripData.pickup}\nTo: ${tripData.destination}\nETA: ${tripData.estimatedArrival}\n\nLocation: https://maps.google.com/?q=${tripData.currentLocation.latitude},${tripData.currentLocation.longitude}`;

      await Share.share({
        message: shareMessage,
        title: 'Trip Status',
      });

      onTripShare && onTripShare(tripData);
    } catch (error) {
      console.error('Error sharing trip status:', error);
      Alert.alert('Error', 'Failed to share trip status');
    } finally {
      setIsSharingTrip(false);
    }
  };

  // Add Emergency Contact
  const addEmergencyContact = () => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const contact = {
      id: Date.now(),
      name: newContact.name,
      phone: newContact.phone,
      isActive: true,
    };

    setEmergencyContacts([...emergencyContacts, contact]);
    setNewContact({ name: '', phone: '' });
    setShowAddContact(false);
  };

  // Toggle Safety Setting
  const toggleSafetySetting = (setting) => {
    setSafetySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  // Call Emergency Contact
  const callContact = (contact) => {
    Alert.alert(
      'Call Contact',
      `Call ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => Linking.openURL(`tel:${contact.phone}`)
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Emergency SOS Button */}
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={activateEmergencySOS}
      >
        <Ionicons name="warning" size={32} color="#fff" />
        <Text style={styles.emergencyButtonText}>EMERGENCY SOS</Text>
      </TouchableOpacity>

      {/* Trip Sharing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trip Sharing</Text>
        <TouchableOpacity
          style={[styles.shareButton, isSharingTrip && styles.shareButtonActive]}
          onPress={shareTripStatus}
          disabled={isSharingTrip}
        >
          {isSharingTrip ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="share-social" size={24} color="#fff" />
              <Text style={styles.shareButtonText}>Share Trip Status</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Safety Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety Settings</Text>
        {Object.entries(safetySettings).map(([key, value]) => (
          <TouchableOpacity
            key={key}
            style={styles.settingItem}
            onPress={() => toggleSafetySetting(key)}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Text>
              <Text style={styles.settingDescription}>
                {key === 'autoShareLocation' && 'Automatically share location with emergency contacts'}
                {key === 'shareTripStatus' && 'Share trip status with trusted contacts'}
                {key === 'emergencyAlerts' && 'Receive emergency alerts and notifications'}
                {key === 'voiceCommands' && 'Enable voice commands for hands-free operation'}
              </Text>
            </View>
            <Ionicons 
              name={value ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              color={value ? "#4CAF50" : "#ccc"} 
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Driver Verification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Driver Verification</Text>
        {Object.entries(driverVerification).map(([key, value]) => (
          <View key={key} style={styles.verificationItem}>
            <View style={styles.verificationInfo}>
              <Text style={styles.verificationLabel}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Text>
            </View>
            <Ionicons 
              name={value ? "checkmark-circle" : "close-circle"} 
              size={24} 
              color={value ? "#4CAF50" : "#f44336"} 
            />
          </View>
        ))}
      </View>

      {/* Emergency Contacts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddContact(true)}
          >
            <Ionicons name="add" size={20} color="#2196F3" />
          </TouchableOpacity>
        </View>
        
        {emergencyContacts.map((contact) => (
          <View key={contact.id} style={styles.contactItem}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactPhone}>{contact.phone}</Text>
            </View>
            <View style={styles.contactActions}>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => callContact(contact)}
              >
                <Ionicons name="call" size={20} color="#4CAF50" />
              </TouchableOpacity>
              <View style={[styles.statusIndicator, contact.isActive && styles.statusActive]} />
            </View>
          </View>
        ))}
      </View>

      {/* Add Contact Modal */}
      <Modal
        visible={showAddContact}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddContact(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Emergency Contact</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Contact Name"
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
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddContact(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.addContactButton]}
                onPress={addEmergencyContact}
              >
                <Text style={styles.addContactButtonText}>Add Contact</Text>
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
    padding: 20,
  },
  emergencyButton: {
    backgroundColor: '#f44336',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  shareButton: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonActive: {
    backgroundColor: '#FF9800',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  verificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  verificationInfo: {
    flex: 1,
  },
  verificationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callButton: {
    marginRight: 15,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ccc',
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
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
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
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
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  addContactButton: {
    backgroundColor: '#2196F3',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  addContactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
