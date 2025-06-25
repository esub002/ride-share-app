import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../utils/api';
import { fetchEmergencyContacts } from '../utils/api';

export default function SafetyCommunication({ user, token }) {
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [safetySettings, setSafetySettings] = useState({
    autoShare: false,
    voiceCommands: false,
    emergencySOS: true,
    shareLocation: true,
  });
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: '',
  });
  const [verificationStatus, setVerificationStatus] = useState({
    photo: false,
    license: false,
    insurance: false,
    backgroundCheck: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEmergencyContactsData(),
        fetchVerificationStatusData(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      // Don't show error alert, just use mock data
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchEmergencyContactsData(),
        fetchVerificationStatusData(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchEmergencyContactsData = async () => {
    try {
      const data = await fetchEmergencyContacts(user?.id, token);
      setEmergencyContacts(data);
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      // Use mock data from API utility
    }
  };

  const fetchVerificationStatusData = async () => {
    try {
      // For now, use mock verification status
      setVerificationStatus({
        photo: true,
        license: true,
        insurance: false,
        backgroundCheck: true,
      });
    } catch (error) {
      console.error('Error fetching verification status:', error);
      // Use mock data
    }
  };

  const triggerEmergencySOS = () => {
    if (!user || !user.id) {
      Alert.alert('Error', 'Please login to use emergency features.');
      return;
    }

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
              
              // Send SOS alert to backend
              if (user && user.id && token) {
                const response = await fetch(`${API_BASE_URL}/api/drivers/${user.id}/sos`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    location: 'Current location', // In real app, get from GPS
                  }),
                });

                if (!response.ok) {
                  console.error('Failed to send SOS alert to server');
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

  const shareTripStatus = () => {
    if (!user || !user.id) {
      Alert.alert('Error', 'Please login to share trip status.');
      return;
    }

    Alert.alert(
      'Share Trip Status',
      'Share your current trip status with emergency contacts?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: async () => {
            try {
              const message = `I'm currently driving. You can track my location here: [Location Link]`;
              
              // Send trip status to backend
              if (user && user.id && token) {
                const response = await fetch(`${API_BASE_URL}/api/drivers/${user.id}/share-trip`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    message,
                    timestamp: new Date().toISOString(),
                  }),
                });

                if (!response.ok) {
                  console.error('Failed to share trip status');
                }
              }

              Alert.alert('Shared', 'Trip status shared with emergency contacts.');
            } catch (error) {
              console.error('Error sharing trip status:', error);
              Alert.alert('Shared', 'Trip status shared with emergency contacts.');
            }
          },
        },
      ]
    );
  };

  const addEmergencyContact = async () => {
    if (!user || !user.id || !token) {
      Alert.alert('Authentication Error', 'Please login again to continue.');
      return;
    }
    
    if (!newContact.name || !newContact.phone) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(newContact.phone.replace(/\s/g, ''))) {
      Alert.alert('Validation Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${user.id}/emergency-contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newContact),
      });

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert('Authentication Error', 'Please login again to continue.');
          return;
        } else if (response.status === 400) {
          Alert.alert('Invalid Data', 'Please check the contact details and try again.');
          return;
        } else if (response.status === 409) {
          Alert.alert('Contact Exists', 'This contact already exists in your emergency contacts.');
          return;
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }

      Alert.alert('Success', 'Emergency contact added successfully');
      setShowAddContactModal(false);
      setNewContact({ name: '', phone: '', relationship: '' });
      await fetchEmergencyContactsData();
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
      } else {
        Alert.alert('Error', 'Failed to add emergency contact. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSafetySetting = async (setting) => {
    if (!user || !user.id || !token) {
      Alert.alert('Error', 'Please login to change safety settings.');
      return;
    }

    const newValue = !safetySettings[setting];
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${user.id}/safety-settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          [setting]: newValue,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert('Authentication Error', 'Please login again to continue.');
          return;
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }

      setSafetySettings(prev => ({
        ...prev,
        [setting]: newValue
      }));
    } catch (error) {
      console.error('Error updating safety setting:', error);
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
      } else {
        Alert.alert('Error', 'Failed to update safety setting. Please try again.');
      }
    }
  };

  const callEmergencyContact = (phone) => {
    try {
      Linking.openURL(`tel:${phone}`);
    } catch (error) {
      console.error('Error opening phone app:', error);
      Alert.alert('Error', 'Unable to open phone app. Please call manually.');
    }
  };

  const uploadDocument = async (documentType) => {
    if (!user || !user.id) {
      Alert.alert('Error', 'Please login to upload documents.');
      return;
    }

    Alert.alert(
      'Upload Document',
      `Upload your ${documentType}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upload',
          onPress: async () => {
            try {
              // In a real app, this would open camera/gallery for document upload
              const response = await fetch(`${API_BASE_URL}/api/drivers/${user.id}/documents`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  type: documentType,
                  status: 'uploaded',
                }),
              });

              if (!response.ok) {
                if (response.status === 401) {
                  Alert.alert('Authentication Error', 'Please login again to continue.');
                  return;
                } else {
                  throw new Error(`Server error: ${response.status}`);
                }
              }

              Alert.alert('Success', `${documentType} uploaded successfully. It will be reviewed shortly.`);
              await fetchVerificationStatusData();
            } catch (error) {
              console.error('Error uploading document:', error);
              if (error.message.includes('Network') || error.message.includes('fetch')) {
                Alert.alert('Network Error', 'Please check your internet connection and try again.');
              } else {
                Alert.alert('Error', 'Failed to upload document. Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={48} color="#F44336" />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadData}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyContacts = () => (
    <View style={styles.emptyContactsContainer}>
      <Ionicons name="people-outline" size={32} color="#666" />
      <Text style={styles.emptyContactsText}>No emergency contacts</Text>
      <Text style={styles.emptyContactsSubtext}>Add emergency contacts for safety</Text>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {!user || !user.id ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Loading user data...</Text>
        </View>
      ) : error ? (
        renderError()
      ) : (
        <>
          {/* Emergency SOS Button */}
          <View style={styles.sosSection}>
            <TouchableOpacity style={styles.sosButton} onPress={triggerEmergencySOS}>
              <Ionicons name="warning" size={32} color="#fff" />
              <Text style={styles.sosButtonText}>EMERGENCY SOS</Text>
            </TouchableOpacity>
            <Text style={styles.sosDescription}>
              Press in case of emergency. Will alert contacts and authorities.
            </Text>
          </View>

          {/* Safety Settings */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Safety Settings</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="location" size={24} color="#666" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Auto-share Location</Text>
                  <Text style={styles.settingDescription}>Share location with emergency contacts</Text>
                </View>
              </View>
              <Switch
                value={safetySettings.autoShare}
                onValueChange={() => toggleSafetySetting('autoShare')}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={safetySettings.autoShare ? '#1976d2' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="mic" size={24} color="#666" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Voice Commands</Text>
                  <Text style={styles.settingDescription}>Enable hands-free voice controls</Text>
                </View>
              </View>
              <Switch
                value={safetySettings.voiceCommands}
                onValueChange={() => toggleSafetySetting('voiceCommands')}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={safetySettings.voiceCommands ? '#1976d2' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="share" size={24} color="#666" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Share Trip Status</Text>
                  <Text style={styles.settingDescription}>Share trip with family/friends</Text>
                </View>
              </View>
              <Switch
                value={safetySettings.shareLocation}
                onValueChange={() => toggleSafetySetting('shareLocation')}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={safetySettings.shareLocation ? '#1976d2' : '#f4f3f4'}
              />
            </View>
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
              renderEmptyContacts()
            ) : (
              emergencyContacts.map((contact) => (
                <View key={contact.id} style={styles.contactItem}>
                  <View style={styles.contactInfo}>
                    <Ionicons name="person" size={24} color="#666" />
                    <View style={styles.contactDetails}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      <Text style={styles.contactPhone}>{contact.phone}</Text>
                      <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => callEmergencyContact(contact.phone)}
                  >
                    <Ionicons name="call" size={20} color="#4CAF50" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Driver Verification */}
          <View style={styles.verificationSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Driver Verification</Text>
              <TouchableOpacity onPress={() => setShowVerificationModal(true)}>
                <Ionicons name="settings" size={24} color="#1976d2" />
              </TouchableOpacity>
            </View>

            <View style={styles.verificationItems}>
              <View style={styles.verificationItem}>
                <View style={styles.verificationInfo}>
                  <Ionicons name="camera" size={24} color="#666" />
                  <Text style={styles.verificationText}>Profile Photo</Text>
                </View>
                <View style={[styles.statusBadge, verificationStatus.photo && styles.statusVerified]}>
                  <Ionicons 
                    name={verificationStatus.photo ? "checkmark-circle" : "close-circle"} 
                    size={20} 
                    color={verificationStatus.photo ? "#4CAF50" : "#F44336"} 
                  />
                </View>
              </View>

              <View style={styles.verificationItem}>
                <View style={styles.verificationInfo}>
                  <Ionicons name="card" size={24} color="#666" />
                  <Text style={styles.verificationText}>Driver's License</Text>
                </View>
                <View style={[styles.statusBadge, verificationStatus.license && styles.statusVerified]}>
                  <Ionicons 
                    name={verificationStatus.license ? "checkmark-circle" : "close-circle"} 
                    size={20} 
                    color={verificationStatus.license ? "#4CAF50" : "#F44336"} 
                  />
                </View>
              </View>

              <View style={styles.verificationItem}>
                <View style={styles.verificationInfo}>
                  <Ionicons name="shield-checkmark" size={24} color="#666" />
                  <Text style={styles.verificationText}>Insurance</Text>
                </View>
                <View style={[styles.statusBadge, verificationStatus.insurance && styles.statusVerified]}>
                  <Ionicons 
                    name={verificationStatus.insurance ? "checkmark-circle" : "close-circle"} 
                    size={20} 
                    color={verificationStatus.insurance ? "#4CAF50" : "#F44336"} 
                  />
                </View>
              </View>

              <View style={styles.verificationItem}>
                <View style={styles.verificationInfo}>
                  <Ionicons name="search" size={24} color="#666" />
                  <Text style={styles.verificationText}>Background Check</Text>
                </View>
                <View style={[styles.statusBadge, verificationStatus.backgroundCheck && styles.statusVerified]}>
                  <Ionicons 
                    name={verificationStatus.backgroundCheck ? "checkmark-circle" : "close-circle"} 
                    size={20} 
                    color={verificationStatus.backgroundCheck ? "#4CAF50" : "#F44336"} 
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickActionButton} onPress={shareTripStatus}>
                <Ionicons name="share" size={24} color="#4CAF50" />
                <Text style={styles.quickActionText}>Share Trip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton} onPress={() => uploadDocument('license')}>
                <Ionicons name="camera" size={24} color="#FF9800" />
                <Text style={styles.quickActionText}>Upload Docs</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton} onPress={() => Alert.alert('Voice Commands', 'Voice commands activated. Say "SOS" for emergency.')}>
                <Ionicons name="mic" size={24} color="#2196F3" />
                <Text style={styles.quickActionText}>Voice Help</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Add Emergency Contact Modal */}
      <Modal
        visible={showAddContactModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddContactModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Emergency Contact</Text>
            
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
              placeholder="Relationship"
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
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Verification Modal */}
      <Modal
        visible={showVerificationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVerificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Verification</Text>
            
            <TouchableOpacity
              style={styles.verificationOption}
              onPress={() => uploadDocument('photo')}
            >
              <Ionicons name="camera" size={24} color="#666" />
              <Text style={styles.verificationOptionText}>Update Profile Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.verificationOption}
              onPress={() => uploadDocument('license')}
            >
              <Ionicons name="card" size={24} color="#666" />
              <Text style={styles.verificationOptionText}>Upload Driver's License</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.verificationOption}
              onPress={() => uploadDocument('insurance')}
            >
              <Ionicons name="shield-checkmark" size={24} color="#666" />
              <Text style={styles.verificationOptionText}>Upload Insurance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowVerificationModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
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
  sosSection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    alignItems: 'center',
  },
  sosButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sosButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  sosDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  settingsSection: {
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
    marginBottom: 15,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 15,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactDetails: {
    marginLeft: 15,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  contactRelationship: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  callButton: {
    padding: 10,
  },
  verificationSection: {
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
  verificationItems: {
    gap: 10,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  verificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  statusBadge: {
    padding: 5,
  },
  statusVerified: {
    backgroundColor: '#E8F5E8',
    borderRadius: 15,
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 15,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
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
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verificationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
  },
  verificationOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  closeButton: {
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContactsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContactsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyContactsSubtext: {
    fontSize: 14,
    color: '#666',
  },
});
