import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Settings({ token, user }) {
  const [settings, setSettings] = useState({
    notifications: true,
    sound: true,
    vibration: true,
    autoAccept: false,
    darkMode: false,
    locationSharing: true,
  });

  const handleSettingChange = async (key, value) => {
    setSettings({ ...settings, [key]: value });
    try {
      await AsyncStorage.setItem(`driver_settings_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error("Error saving setting:", error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => {} },
      ]
    );
  };

  const renderSettingItem = (icon, title, subtitle, type, key, value) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color="#2196F3" style={styles.settingIcon} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {type === "switch" ? (
        <Switch
          value={value}
          onValueChange={(newValue) => handleSettingChange(key, newValue)}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={value ? "#2196F3" : "#f4f3f4"}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#666" />
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        {renderSettingItem(
          "notifications",
          "Push Notifications",
          "Receive ride requests and updates",
          "switch",
          "notifications",
          settings.notifications
        )}
        {renderSettingItem(
          "volume-high",
          "Sound",
          "Play sounds for notifications",
          "switch",
          "sound",
          settings.sound
        )}
        {renderSettingItem(
          "phone-portrait",
          "Vibration",
          "Vibrate for notifications",
          "switch",
          "vibration",
          settings.vibration
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ride Preferences</Text>
        {renderSettingItem(
          "checkmark-circle",
          "Auto Accept Rides",
          "Automatically accept ride requests",
          "switch",
          "autoAccept",
          settings.autoAccept
        )}
        {renderSettingItem(
          "location",
          "Location Sharing",
          "Share location with riders",
          "switch",
          "locationSharing",
          settings.locationSharing
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        {renderSettingItem(
          "moon",
          "Dark Mode",
          "Use dark theme",
          "switch",
          "darkMode",
          settings.darkMode
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="person" size={24} color="#2196F3" style={styles.settingIcon} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Edit Profile</Text>
              <Text style={styles.settingSubtitle}>Update your information</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="shield-checkmark" size={24} color="#2196F3" style={styles.settingIcon} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Privacy Policy</Text>
              <Text style={styles.settingSubtitle}>Read our privacy policy</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="help-circle" size={24} color="#2196F3" style={styles.settingIcon} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Help & Support</Text>
              <Text style={styles.settingSubtitle}>Get help and contact support</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="information-circle" size={24} color="#2196F3" style={styles.settingIcon} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>App Version</Text>
              <Text style={styles.settingSubtitle}>1.0.0</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color="#fff" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
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
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    marginLeft: 20,
  },
  settingItem: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    marginRight: 15,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  settingSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: "#f44336",
    margin: 20,
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
}); 