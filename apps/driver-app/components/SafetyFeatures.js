import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { API_BASE_URL } from "../utils/api";

export default function SafetyFeatures({ token, user, currentRide }) {
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [safetySettings, setSafetySettings] = useState({
    autoShareLocation: true,
    emergencyAlerts: true,
    rideSharing: false,
    backgroundTracking: true,
  });
  const [incidentReport, setIncidentReport] = useState({
    type: "",
    description: "",
    location: "",
    severity: "medium",
  });
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    relationship: "",
  });

  useEffect(() => {
    fetchEmergencyContacts();
    fetchSafetySettings();
    getCurrentLocation();
  }, []);

  const fetchEmergencyContacts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${user.id}/emergency-contacts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmergencyContacts(data);
      }
    } catch (error) {
      console.error("Error fetching emergency contacts:", error);
    }
  };

  const fetchSafetySettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${user.id}/safety-settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSafetySettings(data);
      }
    } catch (error) {
      console.error("Error fetching safety settings:", error);
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
    
    // Get current location
    await getCurrentLocation();
    
    // Send emergency alert
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${user.id}/emergency-alert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "sos",
          location: location,
          rideId: currentRide?.id,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        // Call emergency services
        Alert.alert(
          "Emergency Alert Sent",
          "Emergency services have been notified. Stay calm and follow their instructions.",
          [
            { text: "Call 911", onPress: () => Linking.openURL("tel:911") },
            { text: "OK", style: "cancel" },
          ]
        );
      }
    } catch (error) {
      console.error("Error sending emergency alert:", error);
      Alert.alert("Error", "Failed to send emergency alert. Please call 911 directly.");
    }
  };

  const shareRideWithContacts = async () => {
    if (!currentRide || emergencyContacts.length === 0) {
      Alert.alert("No Contacts", "Please add emergency contacts first");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${user.id}/share-ride`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rideId: currentRide.id,
          location: location,
          contacts: emergencyContacts.map(c => c.id),
        }),
      });

      if (response.ok) {
        Alert.alert("Ride Shared", "Your ride details have been shared with your emergency contacts");
      } else {
        Alert.alert("Error", "Failed to share ride");
      }
    } catch (error) {
      console.error("Error sharing ride:", error);
      Alert.alert("Error", "Network error");
    }
    setLoading(false);
  };

  const reportIncident = async () => {
    if (!incidentReport.type || !incidentReport.description) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${user.id}/incidents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...incidentReport,
          location: location,
          rideId: currentRide?.id,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        Alert.alert("Incident Reported", "Your incident report has been submitted");
        setShowIncidentModal(false);
        setIncidentReport({ type: "", description: "", location: "", severity: "medium" });
      } else {
        Alert.alert("Error", "Failed to submit incident report");
      }
    } catch (error) {
      console.error("Error reporting incident:", error);
      Alert.alert("Error", "Network error");
    }
    setLoading(false);
  };

  const addEmergencyContact = async () => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert("Missing Information", "Please fill in name and phone number");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${user.id}/emergency-contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newContact),
      });

      if (response.ok) {
        Alert.alert("Contact Added", "Emergency contact added successfully");
        setShowContactModal(false);
        setNewContact({ name: "", phone: "", relationship: "" });
        fetchEmergencyContacts();
      } else {
        Alert.alert("Error", "Failed to add contact");
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      Alert.alert("Error", "Network error");
    }
    setLoading(false);
  };

  const updateSafetySetting = async (key, value) => {
    setSafetySettings({ ...safetySettings, [key]: value });
    
    try {
      await fetch(`${API_BASE_URL}/api/drivers/${user.id}/safety-settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (error) {
      console.error("Error updating safety setting:", error);
    }
  };

  const renderSafetyCard = (icon, title, subtitle, action, color = "#2196F3") => (
    <TouchableOpacity style={styles.safetyCard} onPress={action}>
      <View style={[styles.cardIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Safety & Security</Text>
      </View>

      {/* Emergency SOS Button */}
      <View style={styles.sosSection}>
        <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
          <Ionicons name="warning" size={32} color="#fff" />
          <Text style={styles.sosButtonText}>EMERGENCY SOS</Text>
        </TouchableOpacity>
        <Text style={styles.sosDescription}>
          Press in case of emergency. Will alert emergency services and your contacts.
        </Text>
      </View>

      {/* Safety Tools */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety Tools</Text>
        
        {renderSafetyCard(
          "share-social",
          "Share Ride",
          "Share your ride details with trusted contacts",
          shareRideWithContacts,
          "#4CAF50"
        )}
        
        {renderSafetyCard(
          "document-text",
          "Report Incident",
          "Report safety incidents or concerns",
          () => setShowIncidentModal(true),
          "#FF9800"
        )}
        
        {renderSafetyCard(
          "shield-checkmark",
          "Safety Check",
          "Verify your current safety status",
          () => Alert.alert("Safety Check", "All systems are operational"),
          "#9C27B0"
        )}
      </View>

      {/* Emergency Contacts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <TouchableOpacity onPress={() => setShowContactModal(true)}>
            <Ionicons name="add" size={20} color="#2196F3" />
          </TouchableOpacity>
        </View>
        
        {emergencyContacts.length > 0 ? (
          emergencyContacts.map((contact) => (
            <View key={contact.id} style={styles.contactItem}>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
                <Text style={styles.contactRelation}>{contact.relationship}</Text>
              </View>
              <TouchableOpacity
                style={styles.callContactButton}
                onPress={() => Linking.openURL(`tel:${contact.phone}`)}
              >
                <Ionicons name="call" size={20} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No emergency contacts added</Text>
        )}
      </View>

      {/* Safety Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Auto-share Location</Text>
            <Text style={styles.settingDescription}>Share location with emergency contacts</Text>
          </View>
          <Switch
            value={safetySettings.autoShareLocation}
            onValueChange={(value) => updateSafetySetting("autoShareLocation", value)}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={safetySettings.autoShareLocation ? "#2196F3" : "#f4f3f4"}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Emergency Alerts</Text>
            <Text style={styles.settingDescription}>Receive emergency notifications</Text>
          </View>
          <Switch
            value={safetySettings.emergencyAlerts}
            onValueChange={(value) => updateSafetySetting("emergencyAlerts", value)}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={safetySettings.emergencyAlerts ? "#2196F3" : "#f4f3f4"}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Ride Sharing</Text>
            <Text style={styles.settingDescription}>Share ride details with contacts</Text>
          </View>
          <Switch
            value={safetySettings.rideSharing}
            onValueChange={(value) => updateSafetySetting("rideSharing", value)}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={safetySettings.rideSharing ? "#2196F3" : "#f4f3f4"}
          />
        </View>
      </View>

      {/* SOS Modal */}
      <Modal
        visible={showSOSModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSOSModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={32} color="#F44336" />
              <Text style={styles.modalTitle}>Emergency Alert</Text>
            </View>
            
            <Text style={styles.modalDescription}>
              Emergency services have been notified of your location. Stay calm and follow their instructions.
            </Text>
            
            <View style={styles.emergencyActions}>
              <TouchableOpacity
                style={styles.emergencyButton}
                onPress={() => Linking.openURL("tel:911")}
              >
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.emergencyButtonText}>Call 911</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.emergencyButton, styles.secondaryButton]}
                onPress={() => setShowSOSModal(false)}
              >
                <Text style={styles.secondaryButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Incident Report Modal */}
      <Modal
        visible={showIncidentModal}
        animationType="slide"
        transparent={true}
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
              placeholder="Incident type (e.g., harassment, accident, etc.)"
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
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={reportIncident}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Contact Modal */}
      <Modal
        visible={showContactModal}
        animationType="slide"
        transparent={true}
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
              placeholder="Relationship (e.g., Spouse, Parent)"
              value={newContact.relationship}
              onChangeText={(text) => setNewContact({...newContact, relationship: text})}
            />
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={addEmergencyContact}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Add Contact</Text>
              )}
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
  header: {
    backgroundColor: "#2196F3",
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  sosSection: {
    padding: 20,
    alignItems: "center",
  },
  sosButton: {
    backgroundColor: "#F44336",
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  sosButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 5,
  },
  sosDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  section: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  safetyCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  contactPhone: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  contactRelation: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  callContactButton: {
    padding: 10,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  settingDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 20,
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
    maxWidth: 400,
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
  modalDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 20,
  },
  emergencyActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  emergencyButton: {
    backgroundColor: "#F44336",
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  emergencyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: "#666",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#2196F3",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
}); 