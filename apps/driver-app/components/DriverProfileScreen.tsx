import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DriverDataService from '../services/DriverDataService';
import DriverAuthService from '../services/DriverAuthService';
import { DriverProfile, ContactInfo } from '../models';

interface DriverProfileScreenProps {
  navigation: any;
}

const DriverProfileScreen: React.FC<DriverProfileScreenProps> = ({ navigation }) => {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [profileData, contactData] = await Promise.all([
        DriverDataService.getDriverProfile(),
        DriverDataService.getContactInfo(),
      ]);

      setProfile(profileData);
      setContact(contactData);
    } catch (error) {
      console.error('Error loading profile data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const syncWithBackend = async () => {
    try {
      setSyncing(true);
      // Get token from storage or context
      const token = 'your-auth-token'; // Replace with actual token retrieval
      
      const results = await DriverDataService.syncAllData(token);
      
      if (results.profile || results.wallet || results.contact) {
        await loadProfileData(); // Reload data after sync
        Alert.alert('Success', 'Profile data synced successfully');
      } else {
        Alert.alert('Warning', 'No data was synced. Please check your connection.');
      }
    } catch (error) {
      console.error('Error syncing with backend:', error);
      Alert.alert('Error', 'Failed to sync with backend');
    } finally {
      setSyncing(false);
    }
  };

  const exportData = async () => {
    try {
      const data = await DriverDataService.exportData();
      console.log('Exported data:', data);
      Alert.alert('Success', 'Data exported successfully. Check console for details.');
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const clearData = async () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all local data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await DriverDataService.clearAllData();
              setProfile(null);
              setContact(null);
              Alert.alert('Success', 'All data cleared successfully');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const checkDataIntegrity = async () => {
    try {
      const integrity = await DriverDataService.checkDataIntegrity();
      const issues = Object.entries(integrity)
        .filter(([_, valid]) => !valid)
        .map(([key, _]) => key);

      if (issues.length === 0) {
        Alert.alert('Data Integrity', 'All data is valid and intact');
      } else {
        Alert.alert('Data Integrity Issues', `Issues found with: ${issues.join(', ')}`);
      }
    } catch (error) {
      console.error('Error checking data integrity:', error);
      Alert.alert('Error', 'Failed to check data integrity');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Driver Profile</Text>
          <Text style={styles.subtitle}>Manage your personal information</Text>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          {profile ? (
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>{profile.name || 'Not set'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{profile.email || 'Not set'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{profile.phone || 'Not set'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Car Info:</Text>
                <Text style={styles.value}>{profile.carInfo || 'Not set'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>License:</Text>
                <Text style={styles.value}>{profile.licenseNumber || 'Not set'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Status:</Text>
                <Text style={[styles.value, { color: profile.isActive ? '#4CAF50' : '#F44336' }]}>
                  {profile.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>No profile data available</Text>
          )}
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          {contact ? (
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Address:</Text>
                <Text style={styles.value}>{contact.address || 'Not set'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>City:</Text>
                <Text style={styles.value}>{contact.city || 'Not set'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>State:</Text>
                <Text style={styles.value}>{contact.state || 'Not set'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Emergency Contact:</Text>
                <Text style={styles.value}>{contact.emergencyContact?.name || 'Not set'}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>No contact data available</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={syncWithBackend}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.buttonText}>Sync with Backend</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={exportData}
          >
            <Text style={styles.buttonText}>Export Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={checkDataIntegrity}
          >
            <Text style={styles.buttonText}>Check Data Integrity</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={clearData}
          >
            <Text style={styles.buttonText}>Clear All Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 5,
  },
  section: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  infoContainer: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#333333',
    flex: 2,
    textAlign: 'right',
  },
  noDataText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actionsContainer: {
    margin: 20,
    gap: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  infoButton: {
    backgroundColor: '#5856D6',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
});

export default DriverProfileScreen; 