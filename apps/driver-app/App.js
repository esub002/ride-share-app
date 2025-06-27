import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
import LoadingSpinner from './components/ui/LoadingSpinner';
import offlineManager from './utils/offlineManager';
import performanceOptimizer from './utils/performanceOptimizer';
import apiService from './utils/api';
import LoginScreen from './LoginScreen';
import { Colors } from './constants/Colors';
import { Typography } from './constants/Typography';
import { Spacing } from './constants/Spacing';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Mock authentication context
const AuthContext = React.createContext();

// Component wrappers to fix navigation issues
const DriverHomeWrapper = (props) => <DriverHome {...props} user={global.user} token={global.token} />;
const RideManagementWrapper = (props) => <RideManagement {...props} user={global.user} token={global.token} />;
const EarningsFinanceWrapper = (props) => <EarningsFinance {...props} user={global.user} token={global.token} />;
const SafetyCommunicationWrapper = (props) => <SafetyCommunication {...props} user={global.user} token={global.token} />;
const VoiceCommandsWrapper = (props) => <VoiceCommands {...props} user={global.user} token={global.token} />;
const AdvancedSafetyWrapper = (props) => <AdvancedSafety {...props} user={global.user} token={global.token} />;
const DriverAnalyticsWrapper = (props) => <DriverAnalytics {...props} user={global.user} token={global.token} />;

function MainApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initialize offline manager listener
    const unsubscribe = offlineManager.addListener(({ isOnline }) => {
      setIsOnline(isOnline);
    });

    // Simulate app initialization
    const initApp = async () => {
      try {
        // Initialize notification service
        await NotificationService.init();
        
        // Initialize offline manager
        await offlineManager.init();
        
        // Initialize API service
        await apiService.init();
        
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsLoading(false);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsLoading(false);
      }
    };

    initApp();

    return () => {
      unsubscribe();
    };
  }, []);

  // Performance optimization: Memoize navigation options
  const screenOptions = performanceOptimizer.memoize('screenOptions', () => ({
    headerStyle: {
      backgroundColor: Colors.light.primary,
    },
    headerTintColor: Colors.light.textInverse,
    headerTitleStyle: {
      ...Typography.h4,
      color: Colors.light.textInverse,
    },
  }));

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSpinner 
          type="pulse" 
          text="Initializing Driver App..." 
          color={Colors.light.primary}
          size="large"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <OfflineIndicator />
      <Drawer.Navigator
        drawerContent={(props) => <DrawerContent {...props} />}
        screenOptions={screenOptions}
      >
        <Drawer.Screen 
          name="Home" 
          component={DriverHome} 
          options={{
            title: 'Driver Dashboard',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="home" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="RideManagement" 
          component={RideManagement} 
          options={{
            title: 'Ride Management',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="car" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="EarningsFinance" 
          component={EarningsFinance} 
          options={{
            title: 'Earnings & Finance',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="cash" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="SafetyCommunication" 
          component={SafetyCommunication} 
          options={{
            title: 'Safety & Communication',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="shield" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="VoiceCommands" 
          component={VoiceCommands} 
          options={{
            title: 'Voice Commands',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="mic" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="AdvancedSafety" 
          component={AdvancedSafety} 
          options={{
            title: 'Advanced Safety',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="warning" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="DriverAnalytics" 
          component={DriverAnalytics} 
          options={{
            title: 'Analytics',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="analytics" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Wallet" 
          component={Wallet} 
          options={{
            title: 'Wallet',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="wallet" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Profile" 
          component={Profile} 
          options={{
            title: 'Profile',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="person" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="TripHistory" 
          component={TripHistory} 
          options={{
            title: 'Trip History',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="time" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="CustomerCommunication" 
          component={CustomerCommunication} 
          options={{
            title: 'Customer Communication',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="chatbubbles" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="SafetyFeatures" 
          component={SafetyFeatures} 
          options={{
            title: 'Safety Features',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="medical" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Settings" 
          component={Settings} 
          options={{
            title: 'Settings',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="settings" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Theme" 
          component={Theme} 
          options={{
            title: 'Theme',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="color-palette" color={color} size={size} />
            ),
          }}
        />
      </Drawer.Navigator>
    </SafeAreaView>
  );
}

function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      // Initialize API service
      await apiService.init();
      
      // Check if user is already authenticated
      const status = apiService.getStatus();
      if (status.hasToken) {
        try {
          const profile = await apiService.getDriverProfile();
          global.user = profile;
          global.token = apiService.token;
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear it
          apiService.clearToken();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Authentication check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (token, userProfile) => {
    global.user = userProfile;
    global.token = token;
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    apiService.clearToken();
    global.user = null;
    global.token = null;
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSpinner 
          type="bounce" 
          text="Checking Authentication..." 
          color={Colors.light.primary}
          size="large"
        />
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="MainApp" component={MainApp} />
        ) : (
          <Stack.Screen name="Login" component={(props) => <LoginScreen {...props} onLogin={handleLogin} />} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <AppNavigator />
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
});
