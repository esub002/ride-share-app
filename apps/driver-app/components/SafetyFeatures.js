import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Switch,
  Linking,
  Vibration,
  RefreshControl,
  Dimensions,
  Share,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import apiService from '../utils/api';

const { width, height } = Dimensions.get('window');

export default function SafetyFeatures({ token, user, currentRide }) {
  const [emergencyContacts, setEmergencyContacts] = useState([
    { id: 1, name: 'Sarah Johnson', phone: '+1234567890', relationship: 'Spouse', isActive: true },
    { id: 2, name: 'Mike Wilson', phone: '+0987654321', relationship: 'Friend', isActive: true },
  ]);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSafetySettingsModal, setShowSafetySettingsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const [safetyStatus, setSafetyStatus] = useState('safe'); // safe, warning, danger
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [safetyScore, setSafetyScore] = useState(95);
  
  const [safetySettings, setSafetySettings] = useState({
    autoShareLocation: true,
    emergencyAlerts: true,
    rideSharing: true,
    backgroundTracking: true,
    voiceCommands: true,
    panicButtonEnabled: true,
    autoSOS: false,
    nightMode: false,
  });

  const [incidentReport, setIncidentReport] = useState({
    type: "",
    description: "",
    location: "",
    severity: "medium",
    photos: [],
  });

  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    relationship: "",
  });

  const [safetyMetrics, setSafetyMetrics] = useState({
    totalRides: 1247,
    safeRides: 1240,
    incidents: 7,
    responseTime: '2.3s',
    lastIncident: '2024-01-10',
  });

  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const sosButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchEmergencyContacts();
    fetchSafetySettings();
    getCurrentLocation();
    setupLocationTracking();
    setupNotifications();
  }, []);

  useEffect(() => {
    if (safetyStatus === 'danger') {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [safetyStatus]);

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

  const setupNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please enable notifications for safety alerts');
    }
  };

  const setupLocationTracking = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required for safety features");
        return;
      }

      // Start location tracking
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 10,
        },
        (location) => {
          setLocation(location.coords);
          if (isSharingLocation) {
            shareLocationWithContacts(location.coords);
          }
        }
      );
    } catch (error) {
      console.error("Error setting up location tracking:", error);
    }
  };

  const fetchEmergencyContacts = async () => {
    try {
      const data = await apiService.getEmergencyContacts();
      setEmergencyContacts(data);
    } catch (error) {
      console.log('Using mock emergency contacts data');
    }
  };

  const fetchSafetySettings = async () => {
    try {
      const data = await apiService.getSafetySettings();
      setSafetySettings(data);
    } catch (error) {
      console.log('Using mock safety settings data');
    }
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required for safety features");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const handleSOS = async () => {
    setShowSOSModal(true);
    Vibration.vibrate([0, 500, 200, 500, 200, 500]);
    
    // Animate SOS button
    Animated.sequence([
      Animated.timing(sosButtonScale, {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sosButtonScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    await getCurrentLocation();
    
    try {
      // Send emergency alert
      const emergencyData = {
        type: "sos",
        location: location,
        rideId: currentRide?.id,
        timestamp: new Date().toISOString(),
        driverId: user?.id,
        driverName: user?.name,
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

      Alert.alert(
        "🚨 EMERGENCY ALERT SENT",
        "Emergency services and your contacts have been notified. Stay calm and follow their instructions.",
        [
          { text: "Call 911", onPress: () => Linking.openURL("tel:911"), style: 'destructive' },
          { text: "OK", style: "cancel" },
        ]
      );
    } catch (error) {
      console.error("Error sending emergency alert:", error);
      Alert.alert("Error", "Failed to send emergency alert. Please call 911 directly.");
    }
  };

  const shareLocationWithContacts = async (coords) => {
    if (!emergencyContacts.length) return;

    try {
      const locationData = {
        driverId: user?.id,
        location: coords,
        timestamp: new Date().toISOString(),
        rideId: currentRide?.id,
      };

      await apiService.shareLocation(locationData);
    } catch (error) {
      console.error('Error sharing location:', error);
    }
  };

  const shareRideWithContacts = async () => {
    if (!currentRide || emergencyContacts.length === 0) {
      Alert.alert("No Contacts", "Please add emergency contacts first");
      return;
    }

    setLoading(true);
    try {
      const rideData = {
        rideId: currentRide.id,
        location: location,
        contacts: emergencyContacts.map(c => c.id),
        pickup: currentRide.pickup,
        destination: currentRide.destination,
        estimatedTime: currentRide.estimatedTime,
      };

      await apiService.shareRide(rideData);
      Alert.alert("✅ Ride Shared", "Your ride details have been shared with your emergency contacts");
    } catch (error) {
      console.error('Error sharing ride:', error);
      Alert.alert("Error", "Failed to share ride details");
    } finally {
      setLoading(false);
    }
  };

  const reportIncident = async () => {
    if (!incidentReport.type || !incidentReport.description) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const incidentData = {
        ...incidentReport,
        location: location,
        rideId: currentRide?.id,
        timestamp: new Date().toISOString(),
        driverId: user?.id,
      };

      await apiService.reportIncident(incidentData);
      Alert.alert("✅ Incident Reported", "Your incident report has been submitted successfully");
      setShowIncidentModal(false);
      setIncidentReport({
        type: "",
        description: "",
        location: "",
        severity: "medium",
        photos: [],
      });
    } catch (error) {
      console.error('Error reporting incident:', error);
      Alert.alert("Error", "Failed to submit incident report");
    } finally {
      setLoading(false);
    }
  };

  const addEmergencyContact = async () => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert("Missing Information", "Please fill in name and phone number");
      return;
    }

    setLoading(true);
    try {
      const contactData = {
        ...newContact,
        driverId: user?.id,
      };

      const newContactData = await apiService.addEmergencyContact(contactData);
      setEmergencyContacts([...emergencyContacts, newContactData]);
      setShowContactModal(false);
      setNewContact({ name: "", phone: "", relationship: "" });
      Alert.alert("✅ Contact Added", "Emergency contact added successfully");
    } catch (error) {
      console.error('Error adding contact:', error);
      Alert.alert("Error", "Failed to add emergency contact");
    } finally {
      setLoading(false);
    }
  };

  const updateSafetySetting = async (key, value) => {
    try {
      setSafetySettings(prev => ({ ...prev, [key]: value }));
      await apiService.updateSafetySetting(key, value);
    } catch (error) {
      console.error('Error updating safety setting:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchEmergencyContacts(),
        fetchSafetySettings(),
        getCurrentLocation(),
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderSafetyCard = (icon, title, subtitle, action, color = "#2196F3", badge = null) => (
    <TouchableOpacity style={styles.safetyCard} onPress={action}>
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
          onPress={() => Linking.openURL(`tel:${contact.phone}`)}
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

  if (loading && !emergencyContacts.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Loading safety features...</Text>
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
      {/* Safety Status Header */}
      <View style={styles.safetyHeader}>
        <View style={styles.safetyStatus}>
          <View style={[styles.statusIndicator, { backgroundColor: safetyStatus === 'safe' ? '#4CAF50' : safetyStatus === 'warning' ? '#FF9800' : '#F44336' }]} />
          <Text style={styles.safetyStatusText}>
            {safetyStatus === 'safe' ? 'Safe' : safetyStatus === 'warning' ? 'Warning' : 'Danger'}
          </Text>
        </View>
        <View style={styles.safetyScore}>
          <Text style={styles.scoreText}>{safetyScore}</Text>
          <Text style={styles.scoreLabel}>Safety Score</Text>
        </View>
      </View>

      {/* Emergency SOS Button */}
      <Animated.View style={[styles.sosContainer, { transform: [{ scale: sosButtonScale }] }]}>
        <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
          <Ionicons name="warning" size={32} color="#fff" />
          <Text style={styles.sosButtonText}>EMERGENCY SOS</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton} 
            onPress={shareRideWithContacts}
            disabled={!currentRide}
          >
            <Ionicons name="share" size={24} color="#2196F3" />
            <Text style={styles.quickActionText}>Share Ride</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton} 
            onPress={() => setShowIncidentModal(true)}
          >
            <Ionicons name="alert-circle" size={24} color="#FF9800" />
            <Text style={styles.quickActionText}>Report Issue</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton} 
            onPress={() => setShowContactModal(true)}
          >
            <Ionicons name="person-add" size={24} color="#4CAF50" />
            <Text style={styles.quickActionText}>Add Contact</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Safety Features */}
      <View style={styles.safetyFeaturesSection}>
        <Text style={styles.sectionTitle}>Safety Features</Text>
        {renderSafetyCard(
          'location',
          'Location Sharing',
          isSharingLocation ? 'Currently sharing location' : 'Share your location with contacts',
          () => setIsSharingLocation(!isSharingLocation),
          '#4CAF50',
          isSharingLocation ? { text: 'ON', color: '#4CAF50' } : null
        )}
        {renderSafetyCard(
          'notifications',
          'Emergency Alerts',
          'Get notified of safety issues',
          () => setShowSafetySettingsModal(true),
          '#FF9800'
        )}
        {renderSafetyCard(
          'shield-checkmark',
          'Safety Settings',
          'Configure your safety preferences',
          () => setShowSafetySettingsModal(true),
          '#2196F3'
        )}
      </View>

      {/* Emergency Contacts */}
      <View style={styles.contactsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <TouchableOpacity onPress={() => setShowContactModal(true)}>
            <Ionicons name="add-circle" size={24} color="#1976d2" />
          </TouchableOpacity>
        </View>
        {emergencyContacts.length === 0 ? (
          <View style={styles.emptyContacts}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No emergency contacts</Text>
            <Text style={styles.emptySubtext}>Add contacts to share your location and ride status</Text>
          </View>
        ) : (
          emergencyContacts.map(renderEmergencyContact)
        )}
      </View>

      {/* Safety Metrics */}
      <View style={styles.metricsSection}>
        <Text style={styles.sectionTitle}>Safety Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{safetyMetrics.totalRides}</Text>
            <Text style={styles.metricLabel}>Total Rides</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{safetyMetrics.safeRides}</Text>
            <Text style={styles.metricLabel}>Safe Rides</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{safetyMetrics.incidents}</Text>
            <Text style={styles.metricLabel}>Incidents</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{safetyMetrics.responseTime}</Text>
            <Text style={styles.metricLabel}>Avg Response</Text>
          </View>
        </View>
      </View>

      {/* SOS Confirmation Modal */}
      <Modal
        visible={showSOSModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSOSModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sosModalContent}>
            <View style={styles.sosModalHeader}>
              <Ionicons name="warning" size={48} color="#F44336" />
              <Text style={styles.sosModalTitle}>Emergency SOS Activated</Text>
            </View>
            <Text style={styles.sosModalText}>
              Emergency services and your contacts have been notified. 
              Stay calm and follow their instructions.
            </Text>
            <View style={styles.sosModalActions}>
              <TouchableOpacity 
                style={styles.emergencyCallButton}
                onPress={() => Linking.openURL("tel:911")}
              >
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.emergencyCallText}>Call 911</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowSOSModal(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Incident Report Modal */}
      <Modal
        visible={showIncidentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowIncidentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Incident</Text>
              <TouchableOpacity onPress={() => setShowIncidentModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Incident Type (e.g., Accident, Harassment, Mechanical)"
              value={incidentReport.type}
              onChangeText={(text) => setIncidentReport({...incidentReport, type: text})}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe what happened..."
              value={incidentReport.description}
              onChangeText={(text) => setIncidentReport({...incidentReport, description: text})}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.severitySelector}>
              <Text style={styles.severityLabel}>Severity:</Text>
              {['low', 'medium', 'high'].map((severity) => (
                <TouchableOpacity
                  key={severity}
                  style={[
                    styles.severityButton,
                    incidentReport.severity === severity && styles.selectedSeverity
                  ]}
                  onPress={() => setIncidentReport({...incidentReport, severity})}
                >
                  <Text style={[
                    styles.severityText,
                    incidentReport.severity === severity && styles.selectedSeverityText
                  ]}>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowIncidentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={reportIncident}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Contact Modal */}
      <Modal
        visible={showContactModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContactModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Emergency Contact</Text>
              <TouchableOpacity onPress={() => setShowContactModal(false)}>
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
                onPress={() => setShowContactModal(false)}
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

      {/* Safety Settings Modal */}
      <Modal
        visible={showSafetySettingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSafetySettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Safety Settings</Text>
              <TouchableOpacity onPress={() => setShowSafetySettingsModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Auto Share Location</Text>
                <Text style={styles.settingDescription}>Automatically share location with emergency contacts</Text>
              </View>
              <Switch
                value={safetySettings.autoShareLocation}
                onValueChange={(value) => updateSafetySetting('autoShareLocation', value)}
                trackColor={{ false: '#ddd', true: '#1976d2' }}
                thumbColor={safetySettings.autoShareLocation ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Emergency Alerts</Text>
                <Text style={styles.settingDescription}>Receive emergency notifications</Text>
              </View>
              <Switch
                value={safetySettings.emergencyAlerts}
                onValueChange={(value) => updateSafetySetting('emergencyAlerts', value)}
                trackColor={{ false: '#ddd', true: '#1976d2' }}
                thumbColor={safetySettings.emergencyAlerts ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Ride Sharing</Text>
                <Text style={styles.settingDescription}>Share ride details with contacts</Text>
              </View>
              <Switch
                value={safetySettings.rideSharing}
                onValueChange={(value) => updateSafetySetting('rideSharing', value)}
                trackColor={{ false: '#ddd', true: '#1976d2' }}
                thumbColor={safetySettings.rideSharing ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Background Tracking</Text>
                <Text style={styles.settingDescription}>Track location in background</Text>
              </View>
              <Switch
                value={safetySettings.backgroundTracking}
                onValueChange={(value) => updateSafetySetting('backgroundTracking', value)}
                trackColor={{ false: '#ddd', true: '#1976d2' }}
                thumbColor={safetySettings.backgroundTracking ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Voice Commands</Text>
                <Text style={styles.settingDescription}>Enable voice-activated safety features</Text>
              </View>
              <Switch
                value={safetySettings.voiceCommands}
                onValueChange={(value) => updateSafetySetting('voiceCommands', value)}
                trackColor={{ false: '#ddd', true: '#1976d2' }}
                thumbColor={safetySettings.voiceCommands ? '#fff' : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSafetySettingsModal(false)}
            >
              <Text style={styles.closeButtonText}>Done</Text>
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
    backgroundColor: "#f5f5f5",
  },
  safetyHeader: {
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  safetyStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  safetyStatusText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  safetyScore: {
    alignItems: "center",
  },
  scoreText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  scoreLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  sosContainer: {
    alignItems: "center",
    padding: 20,
  },
  sosButton: {
    backgroundColor: "#F44336",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sosButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  quickActionsSection: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  quickActionButton: {
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    minWidth: 80,
  },
  quickActionText: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  safetyFeaturesSection: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  safetyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    marginBottom: 10,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
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
    color: "#fff",
    fontWeight: "bold",
  },
  contactsSection: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    marginBottom: 10,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  contactPhone: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  contactRelationship: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  contactActions: {
    flexDirection: "row",
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
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
  },
  metricsSection: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  metricItem: {
    alignItems: "center",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  metricLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  severitySelector: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  severityLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginRight: 15,
  },
  severityButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    marginRight: 10,
  },
  selectedSeverity: {
    backgroundColor: "#1976d2",
    borderColor: "#1976d2",
  },
  severityText: {
    fontSize: 14,
    color: "#666",
  },
  selectedSeverityText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#1976d2",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  sosModalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  sosModalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  sosModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  sosModalText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  sosModalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  emergencyCallButton: {
    backgroundColor: "#F44336",
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginRight: 10,
  },
  emergencyCallText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  closeButton: {
    backgroundColor: "#666",
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  settingDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
}); 