import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Theme({ token, user }) {
  const [selectedTheme, setSelectedTheme] = useState("light");
  const [selectedColor, setSelectedColor] = useState("blue");

  const themes = [
    { id: "light", name: "Light", icon: "sunny" },
    { id: "dark", name: "Dark", icon: "moon" },
    { id: "auto", name: "Auto", icon: "contrast" },
  ];

  const colors = [
    { id: "blue", name: "Blue", color: "#2196F3" },
    { id: "green", name: "Green", color: "#4CAF50" },
    { id: "purple", name: "Purple", color: "#9C27B0" },
    { id: "orange", name: "Orange", color: "#FF9800" },
    { id: "red", name: "Red", color: "#F44336" },
  ];

  useEffect(() => {
    loadThemeSettings();
  }, []);

  const loadThemeSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("driver_theme");
      const savedColor = await AsyncStorage.getItem("driver_color");
      
      if (savedTheme) setSelectedTheme(savedTheme);
      if (savedColor) setSelectedColor(savedColor);
    } catch (error) {
      console.error("Error loading theme settings:", error);
    }
  };

  const handleThemeChange = async (theme) => {
    setSelectedTheme(theme);
    try {
      await AsyncStorage.setItem("driver_theme", theme);
      Alert.alert("Theme Updated", "Please restart the app to see changes");
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const handleColorChange = async (color) => {
    setSelectedColor(color);
    try {
      await AsyncStorage.setItem("driver_color", color);
      Alert.alert("Color Updated", "Please restart the app to see changes");
    } catch (error) {
      console.error("Error saving color:", error);
    }
  };

  const renderThemeOption = (theme) => (
    <TouchableOpacity
      key={theme.id}
      style={[
        styles.themeOption,
        selectedTheme === theme.id && styles.selectedTheme,
      ]}
      onPress={() => handleThemeChange(theme.id)}
    >
      <Ionicons
        name={theme.icon}
        size={24}
        color={selectedTheme === theme.id ? "#fff" : "#333"}
      />
      <Text
        style={[
          styles.themeText,
          selectedTheme === theme.id && styles.selectedThemeText,
        ]}
      >
        {theme.name}
      </Text>
      {selectedTheme === theme.id && (
        <Ionicons name="checkmark" size={20} color="#fff" />
      )}
    </TouchableOpacity>
  );

  const renderColorOption = (colorOption) => (
    <TouchableOpacity
      key={colorOption.id}
      style={[
        styles.colorOption,
        { backgroundColor: colorOption.color },
        selectedColor === colorOption.id && styles.selectedColor,
      ]}
      onPress={() => handleColorChange(colorOption.id)}
    >
      {selectedColor === colorOption.id && (
        <Ionicons name="checkmark" size={20} color="#fff" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Theme & Appearance</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme Mode</Text>
        <Text style={styles.sectionDescription}>
          Choose your preferred theme mode
        </Text>
        <View style={styles.themeOptions}>
          {themes.map(renderThemeOption)}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accent Color</Text>
        <Text style={styles.sectionDescription}>
          Choose your preferred accent color
        </Text>
        <View style={styles.colorOptions}>
          {colors.map(renderColorOption)}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preview</Text>
        <View style={styles.previewContainer}>
          <View style={[styles.previewCard, { backgroundColor: "#fff" }]}>
            <View style={styles.previewHeader}>
              <View style={[styles.previewAvatar, { backgroundColor: colors.find(c => c.id === selectedColor)?.color || "#2196F3" }]}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>Driver Name</Text>
                <Text style={styles.previewStatus}>Available</Text>
              </View>
            </View>
            <View style={styles.previewContent}>
              <Text style={styles.previewText}>
                This is how your app will look with the selected theme and color.
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Ionicons name="information-circle" size={20} color="#666" />
        <Text style={styles.infoText}>
          Some changes may require a restart of the app to take full effect.
        </Text>
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
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  section: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  themeOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  themeOption: {
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
    minWidth: 80,
  },
  selectedTheme: {
    backgroundColor: "#2196F3",
  },
  themeText: {
    fontSize: 14,
    color: "#333",
    marginTop: 5,
    fontWeight: "500",
  },
  selectedThemeText: {
    color: "#fff",
  },
  colorOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  previewContainer: {
    alignItems: "center",
  },
  previewCard: {
    width: "100%",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  previewStatus: {
    fontSize: 14,
    color: "#4CAF50",
  },
  previewContent: {
    marginTop: 10,
  },
  previewText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  infoSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
    flex: 1,
  },
}); 