import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import navigationService from '../utils/navigationService';

const NavControls = ({
  ride,
  navigationMode,
  onModeChange,
  showTraffic = true,
  onTrafficToggle,
  showAlternatives = true,
  onAlternativesToggle,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const handleModeChange = (mode) => {
    onModeChange(mode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSettings(false);
  };

  const handleExternalNavigation = async (app = 'default') => {
    try {
      const destination = navigationMode === 'pickup' 
        ? { latitude: ride.pickup_lat || 37.78825, longitude: ride.pickup_lng || -122.4324 }
        : { latitude: ride.destination_lat || 37.7849, longitude: ride.destination_lng || -122.4094 };

      let url;
      const { latitude, longitude } = destination;

      switch (app) {
        case 'google':
          url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
          break;
        case 'apple':
          if (Platform.OS === 'ios') {
            url = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
          } else {
            throw new Error('Apple Maps is only available on iOS');
          }
          break;
        case 'waze':
          url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
          break;
        default:
          if (Platform.OS === 'ios') {
            url = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
          } else {
            url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
          }
      }

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error(`Navigation app not available`);
      }
    } catch (error) {
      console.error('🧭 Failed to open external navigation:', error);
      Alert.alert(
        'Navigation Error',
        `Unable to open ${app} navigation. Please install the app or try another option.`,
        [{ text: 'OK' }]
      );
    }
  };

  const getNavigationModeIcon = (mode) => {
    return mode === 'pickup' ? 'location' : 'flag';
  };

  const getNavigationModeColor = (mode) => {
    return mode === 'pickup' ? '#4CAF50' : '#FF5722';
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainControls}>
        <TouchableOpacity
          style={[styles.modeButton, { backgroundColor: getNavigationModeColor(navigationMode) }]}
          onPress={() => setShowSettings(true)}
        >
          <Ionicons 
            name={getNavigationModeIcon(navigationMode)} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.modeButtonText}>
            {navigationMode === 'pickup' ? 'Pickup' : 'Dropoff'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.externalButton}
          onPress={() => handleExternalNavigation()}
        >
          <Ionicons name="open-outline" size={20} color="#666" />
          <Text style={styles.externalButtonText}>External</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionsButton}
          onPress={() => setShowSettings(true)}
        >
          <Ionicons name="settings" size={20} color="#666" />
          <Text style={styles.optionsButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Navigation Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Navigation Mode</Text>
                <View style={styles.modeOptions}>
                  <TouchableOpacity
                    style={[
                      styles.modeOption,
                      navigationMode === 'pickup' && styles.modeOptionSelected
                    ]}
                    onPress={() => handleModeChange('pickup')}
                  >
                    <Ionicons 
                      name="location" 
                      size={20} 
                      color={navigationMode === 'pickup' ? '#fff' : '#666'} 
                    />
                    <Text style={[
                      styles.modeOptionText,
                      navigationMode === 'pickup' && styles.modeOptionTextSelected
                    ]}>
                      Pickup
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modeOption,
                      navigationMode === 'dropoff' && styles.modeOptionSelected
                    ]}
                    onPress={() => handleModeChange('dropoff')}
                  >
                    <Ionicons 
                      name="flag" 
                      size={20} 
                      color={navigationMode === 'dropoff' ? '#fff' : '#666'} 
                    />
                    <Text style={[
                      styles.modeOptionText,
                      navigationMode === 'dropoff' && styles.modeOptionTextSelected
                    ]}>
                      Dropoff
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>External Navigation</Text>
                <View style={styles.appOptions}>
                  <TouchableOpacity
                    style={styles.appOption}
                    onPress={() => handleExternalNavigation('google')}
                  >
                    <Ionicons name="logo-google" size={24} color="#4285F4" />
                    <Text style={styles.appOptionText}>Google Maps</Text>
                  </TouchableOpacity>

                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.appOption}
                      onPress={() => handleExternalNavigation('apple')}
                    >
                      <Ionicons name="map" size={24} color="#007AFF" />
                      <Text style={styles.appOptionText}>Apple Maps</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.appOption}
                    onPress={() => handleExternalNavigation('waze')}
                  >
                    <Ionicons name="car" size={24} color="#33CCFF" />
                    <Text style={styles.appOptionText}>Waze</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Display Options</Text>
                
                <View style={styles.toggleOption}>
                  <Text style={styles.toggleLabel}>Show Traffic</Text>
                  <Switch
                    value={showTraffic}
                    onValueChange={onTrafficToggle}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={showTraffic ? '#2196F3' : '#f4f3f4'}
                  />
                </View>

                <View style={styles.toggleOption}>
                  <Text style={styles.toggleLabel}>Show Alternative Routes</Text>
                  <Switch
                    value={showAlternatives}
                    onValueChange={onAlternativesToggle}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={showAlternatives ? '#2196F3' : '#f4f3f4'}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
  },
  modeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  externalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  externalButtonText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  optionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  optionsButtonText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  settingSection: {
    marginBottom: 25,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  modeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
  },
  modeOptionSelected: {
    backgroundColor: '#2196F3',
  },
  modeOptionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '600',
  },
  modeOptionTextSelected: {
    color: '#fff',
  },
  appOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  appOption: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    minWidth: 80,
  },
  appOptionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  toggleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  toggleLabel: {
    fontSize: 14,
    color: '#333',
  },
});

export default NavControls; 