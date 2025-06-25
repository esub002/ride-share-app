import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import components
import DrawerContent from './DrawerContent';
import Wallet from './components/Wallet';
import Profile from './components/Profile';
import TripHistory from './components/TripHistory';
import CustomerCommunication from './components/CustomerCommunication';
import SafetyFeatures from './components/SafetyFeatures';
import Settings from './components/Settings';
import Theme from './components/Theme';
import DriverHome from './DriverHome';
import RideManagement from './components/RideManagement';
import EarningsFinance from './components/EarningsFinance';
import SafetyCommunication from './components/SafetyCommunication';
import NotificationService from './utils/notifications';
import VoiceCommands from './components/VoiceCommands';
import AdvancedSafety from './components/AdvancedSafety';
import DriverAnalytics from './components/DriverAnalytics';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Mock authentication context
const AuthContext = React.createContext();

function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Error', 'Please enter both phone and password');
      return;
    }

    setLoading(true);
    try {
      // Mock login - replace with actual API call
      const mockUser = {
        id: 1,
        name: 'John Driver',
        phone: phone,
        car: 'Toyota Prius 2020',
        email: 'john.driver@example.com'
      };

      const mockToken = 'mock-jwt-token-123';

      // Store in context or AsyncStorage
      global.user = mockUser;
      global.token = mockToken;

      // Navigate to main app
      navigation.replace('MainApp');
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.loginContainer}>
      <View style={styles.loginContent}>
        <Text style={styles.loginTitle}>Driver Login</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function MainApp() {
  const [loggedIn, setLoggedIn] = useState(true);

  useEffect(() => {
    if (!global.user) {
      global.user = {
        id: 1,
        name: 'John Driver',
        phone: '+1234567890',
        car: 'Toyota Prius 2020',
        email: 'john.driver@example.com'
      };
      global.token = 'mock-jwt-token-123';
    }
    // Initialize push notifications
    NotificationService.init().then(() => {
      const token = NotificationService.getPushToken();
      if (global.user && token) {
        NotificationService.registerPushToken(global.user.id, token);
      }
    });
    return () => {
      NotificationService.cleanup();
    };
  }, []);

  const handleLogout = () => {
    global.user = null;
    global.token = null;
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer>
      <Drawer.Navigator
        drawerContent={(props) => (
          <DrawerContent 
            {...props} 
            user={global.user} 
            setLoggedIn={setLoggedIn}
          />
        )}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1976d2',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Drawer.Screen 
          name="DriverHome" 
          component={(props) => <DriverHome {...props} user={global.user} token={global.token} />}
          options={{
            title: 'Home',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="RideManagement" 
          component={(props) => <RideManagement {...props} user={global.user} token={global.token} />}
          options={{
            title: 'Ride Management',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="car" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="EarningsFinance" 
          component={(props) => <EarningsFinance {...props} user={global.user} token={global.token} />}
          options={{
            title: 'Earnings & Finance',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="cash" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="SafetyCommunication" 
          component={(props) => <SafetyCommunication {...props} user={global.user} token={global.token} />}
          options={{
            title: 'Safety & Communication',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="shield-checkmark" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Profile" 
          component={Profile}
          options={{
            title: 'Profile',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Wallet" 
          component={Wallet}
          options={{
            title: 'Wallet',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="wallet" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="TripHistory" 
          component={TripHistory}
          options={{
            title: 'Trip History',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="time" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="CustomerCommunication" 
          component={CustomerCommunication}
          options={{
            title: 'Messages',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="chatbubbles" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="SafetyFeatures" 
          component={SafetyFeatures}
          options={{
            title: 'Safety',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="shield-checkmark" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Settings" 
          component={Settings}
          options={{
            title: 'Settings',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Theme" 
          component={Theme}
          options={{
            title: 'Theme',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="color-palette" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="VoiceCommands" 
          component={(props) => <VoiceCommands {...props} user={global.user} token={global.token} />}
          options={{
            title: 'Voice Commands',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="mic" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="AdvancedSafety" 
          component={(props) => <AdvancedSafety {...props} user={global.user} token={global.token} />}
          options={{
            title: 'Advanced Safety',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="shield-checkmark" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="DriverAnalytics" 
          component={(props) => <DriverAnalytics {...props} user={global.user} token={global.token} />}
          options={{
            title: 'Analytics',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="analytics" size={size} color={color} />
            ),
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return <MainApp />;
}

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loginContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#1976d2',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#1976d2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
