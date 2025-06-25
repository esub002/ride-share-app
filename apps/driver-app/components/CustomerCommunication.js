import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../utils/api";
import * as Linking from 'expo-linking';

export default function CustomerCommunication({ token, user, currentRide }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [riderInfo, setRiderInfo] = useState(null);
  const [typing, setTyping] = useState(false);
  const scrollViewRef = useRef();

  useEffect(() => {
    if (currentRide) {
      fetchRiderInfo();
      fetchMessages();
      setShowChat(true);
    }
  }, [currentRide]);

  const fetchRiderInfo = async () => {
    if (!currentRide) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/rides/${currentRide.id}/rider`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRiderInfo(data);
      }
    } catch (error) {
      console.error("Error fetching rider info:", error);
    }
  };

  const fetchMessages = async () => {
    if (!currentRide) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/rides/${currentRide.id}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentRide) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/rides/${currentRide.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: newMessage.trim(),
          sender: "driver",
        }),
      });

      if (response.ok) {
        const message = await response.json();
        setMessages([...messages, message]);
        setNewMessage("");
        scrollToBottom();
      } else {
        Alert.alert("Error", "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Network error");
    }
    setLoading(false);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleCall = () => {
    if (!riderInfo?.phone) {
      Alert.alert("No Phone Number", "Rider's phone number is not available");
      return;
    }

    Alert.alert(
      "Call Rider",
      `Call ${riderInfo.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Call", 
          onPress: () => {
            Linking.openURL(`tel:${riderInfo.phone}`);
          }
        },
      ]
    );
  };

  const updateRideStatus = async (status) => {
    if (!currentRide) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/rides/${currentRide.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        Alert.alert("Status Updated", `Ride status updated to ${status}`);
      } else {
        Alert.alert("Error", "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Error", "Network error");
    }
    setLoading(false);
  };

  const sendQuickMessage = (message) => {
    setNewMessage(message);
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.sender === "driver" ? styles.driverMessage : styles.riderMessage
    ]}>
      <Text style={[
        styles.messageText,
        item.sender === "driver" ? styles.driverMessageText : styles.riderMessageText
      ]}>
        {item.message}
      </Text>
      <Text style={styles.messageTime}>
        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  const quickMessages = [
    "I'm on my way",
    "I've arrived",
    "I'm waiting outside",
    "Traffic delay",
    "Be there in 5 minutes",
  ];

  if (!currentRide) {
    return (
      <View style={styles.noRideContainer}>
        <Ionicons name="chatbubbles" size={64} color="#ccc" />
        <Text style={styles.noRideText}>No active ride</Text>
        <Text style={styles.noRideSubtext}>Start a ride to communicate with your rider</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowChat(!showChat)}>
          <Ionicons name={showChat ? "chevron-down" : "chevron-up"} size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Chat with {riderInfo?.name || "Rider"}</Text>
          <Text style={styles.headerSubtitle}>
            {currentRide.origin} → {currentRide.destination}
          </Text>
        </View>
        <TouchableOpacity onPress={handleCall} style={styles.callButton}>
          <Ionicons name="call" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickMessages.map((message, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickMessageButton}
              onPress={() => sendQuickMessage(message)}
            >
              <Text style={styles.quickMessageText}>{message}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chat Messages */}
      {showChat && (
        <View style={styles.chatContainer}>
          <FlatList
            ref={scrollViewRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            style={styles.messagesList}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
          />

          {/* Message Input */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.inputContainer}
          >
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || loading}
            >
              {loading ? (
                <Ionicons name="hourglass" size={20} color="#ccc" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Status Updates */}
      <View style={styles.statusSection}>
        <Text style={styles.statusTitle}>Update Ride Status</Text>
        <View style={styles.statusButtons}>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => updateRideStatus("arrived")}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.statusButtonText}>Arrived</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => updateRideStatus("started")}
            disabled={loading}
          >
            <Ionicons name="play" size={20} color="#2196F3" />
            <Text style={styles.statusButtonText}>Started</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => updateRideStatus("completed")}
            disabled={loading}
          >
            <Ionicons name="flag" size={20} color="#FF9800" />
            <Text style={styles.statusButtonText}>Complete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  noRideContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  noRideText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 20,
  },
  noRideSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  header: {
    backgroundColor: "#2196F3",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  callButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 8,
    borderRadius: 20,
  },
  quickActions: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  quickMessageButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  quickMessageText: {
    fontSize: 12,
    color: "#333",
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    padding: 15,
  },
  messageContainer: {
    marginBottom: 10,
    maxWidth: "80%",
  },
  driverMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#2196F3",
    borderRadius: 15,
    borderBottomRightRadius: 5,
    padding: 10,
  },
  riderMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 15,
    borderBottomLeftRadius: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  driverMessageText: {
    color: "#fff",
  },
  riderMessageText: {
    color: "#333",
  },
  messageTime: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 5,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    alignItems: "flex-end",
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#2196F3",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  statusSection: {
    backgroundColor: "#fff",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  statusButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  statusButtonText: {
    fontSize: 12,
    color: "#333",
    marginLeft: 5,
  },
}); 