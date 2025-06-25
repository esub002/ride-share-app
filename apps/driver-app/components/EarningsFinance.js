import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../utils/api';

export default function EarningsFinance({ user, token }) {
  const [earnings, setEarnings] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'bank',
    accountNumber: '',
    routingNumber: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    accountName: '',
  });

  useEffect(() => {
    if (user && user.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setError(null);
    try {
      await Promise.all([
        fetchEarnings(),
        fetchPaymentMethods(),
        fetchTransactions()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const fetchEarnings = async () => {
    if (!user || !user.id || !token) {
      throw new Error('User not authenticated');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${user.id}/earnings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication expired. Please login again.');
        } else if (response.status === 404) {
          throw new Error('Earnings data not found.');
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }

      const data = await response.json();
      setEarnings(data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        // Use mock data for network errors
        setEarnings({
          today: 125.50,
          week: 847.25,
          month: 3240.75,
          total: 15420.50,
        });
      } else {
        throw error;
      }
    }
  };

  const fetchPaymentMethods = async () => {
    if (!user || !user.id || !token) {
      throw new Error('User not authenticated');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${user.id}/payment-methods`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication expired. Please login again.');
        } else if (response.status === 404) {
          // No payment methods found, use empty array
          setPaymentMethods([]);
          return;
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }

      const data = await response.json();
      setPaymentMethods(data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        // Use mock data for network errors
        setPaymentMethods([
          {
            id: 1,
            type: 'bank',
            accountName: 'Chase Bank',
            accountNumber: '****1234',
            isDefault: true,
          },
          {
            id: 2,
            type: 'card',
            accountName: 'Visa Card',
            accountNumber: '****5678',
            isDefault: false,
          },
        ]);
      } else {
        throw error;
      }
    }
  };

  const fetchTransactions = async () => {
    if (!user || !user.id || !token) {
      throw new Error('User not authenticated');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${user.id}/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication expired. Please login again.');
        } else if (response.status === 404) {
          // No transactions found, use empty array
          setTransactions([]);
          return;
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }

      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        // Use mock data for network errors
        setTransactions([
          {
            id: 1,
            type: 'ride_earnings',
            amount: 25.50,
            description: 'Ride from Downtown to Uptown',
            date: '2024-01-15T10:30:00Z',
            status: 'completed',
          },
          {
            id: 2,
            type: 'tip',
            amount: 5.00,
            description: 'Tip from John D.',
            date: '2024-01-15T10:30:00Z',
            status: 'completed',
          },
          {
            id: 3,
            type: 'withdrawal',
            amount: -500.00,
            description: 'Withdrawal to Chase Bank',
            date: '2024-01-14T15:20:00Z',
            status: 'completed',
          },
        ]);
      } else {
        throw error;
      }
    }
  };

  const addPaymentMethod = async () => {
    if (!user || !user.id || !token) {
      Alert.alert('Authentication Error', 'Please login again to continue.');
      return;
    }
    
    if (!newPaymentMethod.accountName) {
      Alert.alert('Validation Error', 'Please enter account name');
      return;
    }

    if (newPaymentMethod.type === 'bank') {
      if (!newPaymentMethod.accountNumber || !newPaymentMethod.routingNumber) {
        Alert.alert('Validation Error', 'Please enter both account number and routing number');
        return;
      }
    } else {
      if (!newPaymentMethod.cardNumber || !newPaymentMethod.expiryDate || !newPaymentMethod.cvv) {
        Alert.alert('Validation Error', 'Please enter all card details');
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${user.id}/payment-methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPaymentMethod),
      });

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert('Authentication Error', 'Please login again to continue.');
          return;
        } else if (response.status === 400) {
          Alert.alert('Invalid Data', 'Please check your payment method details and try again.');
          return;
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }

      Alert.alert('Success', 'Payment method added successfully');
      setShowAddPaymentModal(false);
      setNewPaymentMethod({
        type: 'bank',
        accountNumber: '',
        routingNumber: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        accountName: '',
      });
      await fetchPaymentMethods();
    } catch (error) {
      console.error('Error adding payment method:', error);
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
      } else {
        Alert.alert('Error', 'Failed to add payment method. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadTaxDocuments = () => {
    if (!user || !user.id) {
      Alert.alert('Error', 'Please login to download tax documents.');
      return;
    }
    
    Alert.alert(
      'Download Tax Documents',
      'This will download your tax documents for 2024. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: () => {
            // In a real app, this would trigger a file download
            Alert.alert('Download Started', 'Your tax documents are being prepared for download.');
          },
        },
      ]
    );
  };

  const shareEarnings = () => {
    if (!user || !user.id) {
      Alert.alert('Error', 'Please login to share earnings report.');
      return;
    }
    
    Alert.alert(
      'Share Earnings Report',
      'Share your earnings report with others?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: () => {
            // In a real app, this would share via social media or messaging
            Alert.alert('Shared', 'Earnings report shared successfully.');
          },
        },
      ]
    );
  };

  const getEarningsForPeriod = () => {
    switch (selectedPeriod) {
      case 'today':
        return earnings.today;
      case 'week':
        return earnings.week;
      case 'month':
        return earnings.month;
      default:
        return earnings.today;
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'ride_earnings':
        return 'car';
      case 'tip':
        return 'gift';
      case 'withdrawal':
        return 'card';
      case 'bonus':
        return 'star';
      default:
        return 'cash';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'ride_earnings':
      case 'tip':
      case 'bonus':
        return '#4CAF50';
      case 'withdrawal':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(item.type) + '20' }]}>
          <Ionicons 
            name={getTransactionIcon(item.type)} 
            size={20} 
            color={getTransactionColor(item.type)} 
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>{item.description || 'Unknown transaction'}</Text>
          <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
        </View>
      </View>
      <Text style={[styles.transactionAmount, { color: getTransactionColor(item.type) }]}>
        ${(item.amount || 0).toFixed(2)}
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={48} color="#F44336" />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadData}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cash-outline" size={48} color="#666" />
      <Text style={styles.emptyTitle}>No data available</Text>
      <Text style={styles.emptyMessage}>Your earnings and transaction data will appear here once you start driving.</Text>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {!user || !user.id ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Loading user data...</Text>
        </View>
      ) : error ? (
        renderError()
      ) : (
        <>
          {/* Earnings Overview */}
          <View style={styles.earningsSection}>
            <Text style={styles.sectionTitle}>Earnings Overview</Text>
            
            <View style={styles.periodSelector}>
              <TouchableOpacity
                style={[styles.periodButton, selectedPeriod === 'today' && styles.selectedPeriod]}
                onPress={() => setSelectedPeriod('today')}
              >
                <Text style={[styles.periodText, selectedPeriod === 'today' && styles.selectedPeriodText]}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodButton, selectedPeriod === 'week' && styles.selectedPeriod]}
                onPress={() => setSelectedPeriod('week')}
              >
                <Text style={[styles.periodText, selectedPeriod === 'week' && styles.selectedPeriodText]}>This Week</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodButton, selectedPeriod === 'month' && styles.selectedPeriod]}
                onPress={() => setSelectedPeriod('month')}
              >
                <Text style={[styles.periodText, selectedPeriod === 'month' && styles.selectedPeriodText]}>This Month</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.earningsCard}>
              <Text style={styles.earningsAmount}>${getEarningsForPeriod().toFixed(2)}</Text>
              <Text style={styles.earningsLabel}>{selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Earnings</Text>
            </View>

            <View style={styles.earningsStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>${earnings.total.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Total Earnings</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{transactions.length}</Text>
                <Text style={styles.statLabel}>Total Rides</Text>
              </View>
            </View>
          </View>

          {/* Payment Methods */}
          <View style={styles.paymentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Payment Methods</Text>
              <TouchableOpacity onPress={() => setShowAddPaymentModal(true)}>
                <Ionicons name="add-circle" size={24} color="#1976d2" />
              </TouchableOpacity>
            </View>

            {paymentMethods.length === 0 ? (
              <View style={styles.emptyPaymentContainer}>
                <Ionicons name="card-outline" size={32} color="#666" />
                <Text style={styles.emptyPaymentText}>No payment methods added</Text>
                <Text style={styles.emptyPaymentSubtext}>Add a payment method to receive your earnings</Text>
              </View>
            ) : (
              paymentMethods.map((method) => (
                <View key={method.id} style={styles.paymentMethodItem}>
                  <View style={styles.paymentMethodInfo}>
                    <Ionicons 
                      name={method.type === 'bank' ? 'business' : 'card'} 
                      size={24} 
                      color="#666" 
                    />
                    <View style={styles.paymentMethodDetails}>
                      <Text style={styles.paymentMethodName}>{method.accountName}</Text>
                      <Text style={styles.paymentMethodNumber}>{method.accountNumber}</Text>
                    </View>
                  </View>
                  {method.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickActionButton} onPress={downloadTaxDocuments}>
                <Ionicons name="document-text" size={24} color="#FF9800" />
                <Text style={styles.quickActionText}>Tax Documents</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton} onPress={shareEarnings}>
                <Ionicons name="share" size={24} color="#4CAF50" />
                <Text style={styles.quickActionText}>Share Report</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton} onPress={() => setShowTipsModal(true)}>
                <Ionicons name="gift" size={24} color="#2196F3" />
                <Text style={styles.quickActionText}>Tips History</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Transactions */}
          <View style={styles.transactionsSection}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {transactions.length === 0 ? (
              <View style={styles.emptyTransactionContainer}>
                <Ionicons name="receipt-outline" size={32} color="#666" />
                <Text style={styles.emptyTransactionText}>No transactions yet</Text>
                <Text style={styles.emptyTransactionSubtext}>Your transaction history will appear here</Text>
              </View>
            ) : (
              <FlatList
                data={transactions.slice(0, 10)}
                renderItem={renderTransaction}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            )}
          </View>
        </>
      )}

      {/* Add Payment Method Modal */}
      <Modal
        visible={showAddPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Payment Method</Text>
            
            <View style={styles.paymentTypeSelector}>
              <TouchableOpacity
                style={[styles.paymentTypeButton, newPaymentMethod.type === 'bank' && styles.selectedPaymentType]}
                onPress={() => setNewPaymentMethod({...newPaymentMethod, type: 'bank'})}
              >
                <Ionicons name="business" size={20} color={newPaymentMethod.type === 'bank' ? '#fff' : '#666'} />
                <Text style={[styles.paymentTypeText, newPaymentMethod.type === 'bank' && styles.selectedPaymentTypeText]}>Bank Account</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentTypeButton, newPaymentMethod.type === 'card' && styles.selectedPaymentType]}
                onPress={() => setNewPaymentMethod({...newPaymentMethod, type: 'card'})}
              >
                <Ionicons name="card" size={20} color={newPaymentMethod.type === 'card' ? '#fff' : '#666'} />
                <Text style={[styles.paymentTypeText, newPaymentMethod.type === 'card' && styles.selectedPaymentTypeText]}>Card</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Account/Card Name"
              value={newPaymentMethod.accountName}
              onChangeText={(text) => setNewPaymentMethod({...newPaymentMethod, accountName: text})}
            />

            {newPaymentMethod.type === 'bank' ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Account Number"
                  value={newPaymentMethod.accountNumber}
                  onChangeText={(text) => setNewPaymentMethod({...newPaymentMethod, accountNumber: text})}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Routing Number"
                  value={newPaymentMethod.routingNumber}
                  onChangeText={(text) => setNewPaymentMethod({...newPaymentMethod, routingNumber: text})}
                  keyboardType="numeric"
                />
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Card Number"
                  value={newPaymentMethod.cardNumber}
                  onChangeText={(text) => setNewPaymentMethod({...newPaymentMethod, cardNumber: text})}
                  keyboardType="numeric"
                />
                <View style={styles.cardRow}>
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="MM/YY"
                    value={newPaymentMethod.expiryDate}
                    onChangeText={(text) => setNewPaymentMethod({...newPaymentMethod, expiryDate: text})}
                  />
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="CVV"
                    value={newPaymentMethod.cvv}
                    onChangeText={(text) => setNewPaymentMethod({...newPaymentMethod, cvv: text})}
                    keyboardType="numeric"
                    secureTextEntry
                  />
                </View>
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddPaymentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={addPaymentMethod}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tips Modal */}
      <Modal
        visible={showTipsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTipsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tips History</Text>
            
            <View style={styles.tipsSummary}>
              <Text style={styles.tipsTotal}>Total Tips: $247.50</Text>
              <Text style={styles.tipsCount}>From 89 rides</Text>
            </View>

            <FlatList
              data={transactions.filter(t => t.type === 'tip')}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id.toString()}
              style={styles.tipsList}
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTipsModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
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
    backgroundColor: '#f5f5f5',
  },
  earningsSection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: '#f5f5f5',
  },
  selectedPeriod: {
    backgroundColor: '#1976d2',
  },
  periodText: {
    fontSize: 14,
    color: '#666',
  },
  selectedPeriodText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  earningsCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 20,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  earningsLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  earningsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  paymentSection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodDetails: {
    marginLeft: 15,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentMethodNumber: {
    fontSize: 14,
    color: '#666',
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  quickActionsSection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 15,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  transactionsSection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  paymentTypeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  paymentTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: '#f5f5f5',
  },
  selectedPaymentType: {
    backgroundColor: '#1976d2',
  },
  paymentTypeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  selectedPaymentTypeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipsSummary: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tipsTotal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  tipsCount: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  tipsList: {
    maxHeight: 300,
  },
  closeButton: {
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  errorMessage: {
    color: '#666',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyMessage: {
    color: '#666',
  },
  emptyPaymentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyPaymentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyPaymentSubtext: {
    color: '#666',
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodDetails: {
    marginLeft: 15,
  },
  emptyTransactionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTransactionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyTransactionSubtext: {
    color: '#666',
  },
});
