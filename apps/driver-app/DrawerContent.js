import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerContentScrollView } from "@react-navigation/drawer";

export default function DrawerContent(props) {
  const { user, setLoggedIn } = props;

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: setLoggedIn,
        },
      ]
    );
  };

  const menuItems = [
    {
      name: "Home",
      icon: "home",
      screen: "DriverHome",
    },
    {
      name: "Ride Management",
      icon: "car",
      screen: "RideManagement",
    },
    {
      name: "Earnings & Finance",
      icon: "cash",
      screen: "EarningsFinance",
    },
    {
      name: "Safety & Communication",
      icon: "shield-checkmark",
      screen: "SafetyCommunication",
    },
    {
      name: "Profile",
      icon: "person",
      screen: "Profile",
    },
    {
      name: "Wallet",
      icon: "wallet",
      screen: "Wallet",
    },
    {
      name: "Trip History",
      icon: "time",
      screen: "TripHistory",
    },
    {
      name: "Messages",
      icon: "chatbubbles",
      screen: "CustomerCommunication",
    },
    {
      name: "Safety",
      icon: "shield-checkmark",
      screen: "SafetyFeatures",
    },
    {
      name: "Settings",
      icon: "settings",
      screen: "Settings",
    },
    {
      name: "Theme",
      icon: "color-palette",
      screen: "Theme",
    },
  ];

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props}>
        {/* User Profile Section */}
        <View style={styles.userSection}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <Text style={styles.userName}>{user?.name || "Driver"}</Text>
          <Text style={styles.userCar}>{user?.car || "Vehicle"}</Text>
          <Text style={styles.userPhone}>{user?.phone || ""}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => {
                props.navigation.navigate(item.screen);
                props.navigation.closeDrawer();
              }}
            >
              <Ionicons name={item.icon} size={24} color="#333" />
              <Text style={styles.menuText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </DrawerContentScrollView>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#FF5722" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  userSection: {
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  userCar: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  userPhone: {
    fontSize: 14,
    color: "#666",
  },
  menuSection: {
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    marginBottom: 1,
  },
  menuText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
  },
  logoutSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  logoutText: {
    fontSize: 16,
    color: "#FF5722",
    marginLeft: 15,
    fontWeight: "600",
  },
});
