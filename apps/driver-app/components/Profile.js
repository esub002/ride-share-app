import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../utils/api";

export default function Profile({ token, user }) {
  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    car_info: user?.car || "",
    email: user?.email || "",
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name,
          car_info: profile.car_info,
        }),
      });

      if (response.ok) {
        Alert.alert("Success", "Profile updated successfully");
        setEditing(false);
      } else {
        Alert.alert("Error", "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Network error");
    }
    setLoading(false);
  };

  const renderField = (label, value, key, editable = true) => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editing && editable ? (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => setProfile({ ...profile, [key]: text })}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || "Not set"}</Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={50} color="#fff" />
        </View>
        <Text style={styles.title}>Driver Profile</Text>
      </View>

      <View style={styles.content}>
        {renderField("Name", profile.name, "name")}
        {renderField("Phone", profile.phone, "phone", false)}
        {renderField("Car Information", profile.car_info, "car_info")}
        {renderField("Email", profile.email, "email", false)}

        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Account Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="car" size={24} color="#2196F3" />
              <Text style={styles.statValue}>Active</Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>2 years</Text>
              <Text style={styles.statLabel}>Member</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          {editing ? (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setEditing(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={() => setEditing(true)}
            >
              <Ionicons name="create" size={20} color="#fff" />
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
    padding: 30,
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    padding: 20,
  },
  field: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  input: {
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
  },
  statsContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  actions: {
    marginTop: 20,
  },
  button: {
    backgroundColor: "#2196F3",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    backgroundColor: "#666",
    flex: 1,
    marginRight: 10,
  },
  saveButton: {
    flex: 1,
    marginLeft: 10,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
}); 