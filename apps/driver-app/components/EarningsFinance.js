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
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../utils/api';

const { width } = Dimensions.get('window');

export default function EarningsFinance({ user, token }) {
  const [earnings, setEarnings] = useState({
    today: 85.50,
    week: 420.75,
    month: 1850.25,
    total: 2850.50,
    pending: 125.00
  });
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 1,
      type: 'bank',
      accountName: 'Chase Bank',
      accountNumber: '****1234',
      isDefault: true
    },
    {
      id: 2,
      type: 'card',
      accountName: 'Visa Card',
      accountNumber: '****5678',
      isDefault: false
    }
  ]);
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      type: 'ride',
      amount: 25.50,
      date: '2024-01-15T10:30:00Z',
      description: 'Ride from Downtown to Uptown',
      status: 'completed'
    },
    {
      id: 2,
      type: 'tip',
      amount: 5.00,
      date: '2024-01-15T09:15:00Z',
      description: 'Tip from Sarah J.',
      status: 'completed'
    },
    {
      id: 3,
      type: 'bonus',
      amount: 15.00,
      date: '2024-01-14T16:45:00Z',
      description: 'Peak hour bonus',
      status: 'completed'
    },
    {
      id: 4,
      type: 'withdrawal',
      amount: -100.00,
      date: '2024-01-13T14:20:00Z',
      description: 'Bank transfer to Chase',
      status: 'completed'
    }
  ]);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'bank',
    accountName: '',
    accountNumber: '',
    routingNumber: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });
  const [withdrawalAmount, setWithdrawalAmount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEarningsData(),
        fetchPaymentMethodsData(),
        fetchTransactionsData(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      // Use mock data if API fails
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchEarningsData(),
        fetchPaymentMethodsData(),
        fetchTransactionsData(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchEarningsData = async () => {
    try {
      const data = await apiService.getEarningsData();
      setEarnings(data);
    } catch (error) {
      // Use mock data if API fails
      console.log('Using mock earnings data');
    }
  };

  const fetchPaymentMethodsData = async () => {
    try {
      const data = await apiService.getPaymentMethods();
      setPaymentMethods(data);
    } catch (error) {
      // Use mock data if API fails
      console.log('Using mock payment methods data');
    }
  };

  const fetchTransactionsData = async () => {
    try {
      const data = await apiService.getTransactions();
      setTransactions(data);
    } catch (error) {
      // Use mock data if API fails
      console.log('Using mock transactions data');
    }
  };

  const addPaymentMethod = async () => {
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newMethod = {
        id: Date.now(),
        type: newPaymentMethod.type,
        accountName: newPaymentMethod.accountName,
        accountNumber: newPaymentMethod.type === 'bank' ? 
          `****${newPaymentMethod.accountNumber.slice(-4)}` : 
          `****${newPaymentMethod.cardNumber.slice(-4)}`,
        isDefault: paymentMethods.length === 0
      };

      setPaymentMethods([...paymentMethods, newMethod]);
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
    } catch (error) {
      console.error('Error adding payment method:', error);
      Alert.alert('Error', 'Failed to add payment method. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid withdrawal amount');
      return;
    }

    if (amount > earnings.pending) {
      Alert.alert('Insufficient Funds', `You can only withdraw up to $${earnings.pending.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTransaction = {
        id: Date.now(),
        type: 'withdrawal',
        amount: -amount,
        date: new Date().toISOString(),
        description: 'Withdrawal to bank account',
        status: 'pending'
      };

      setTransactions([newTransaction, ...transactions]);
      setEarnings(prev => ({
        ...prev,
        pending: prev.pending - amount
      }));
      
      Alert.alert('Success', `Withdrawal request submitted for $${amount.toFixed(2)}`);
      setShowWithdrawalModal(false);
      setWithdrawalAmount('');
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      Alert.alert('Error', 'Failed to process withdrawal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTaxDocuments = () => {
    Alert.alert(
      'Download Tax Documents',
      'This will download your tax documents for 2024. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: () => {
            Alert.alert('Download Started', 'Your tax documents are being prepared for download.');
          },
        },
      ]
    );
  };

  const shareEarnings = () => {
    Alert.alert(
      'Share Earnings Report',
      'Share your earnings report with others?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: () => {
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'ride':
        return 'car';
      case 'tip':
        return 'gift';
      case 'bonus':
        return 'star';
      case 'withdrawal':
        return 'arrow-down';
      default:
        return 'cash';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'ride':
        return '#4CAF50';
      case 'tip':
        return '#FF9800';
      case 'bonus':
        return '#2196F3';
      case 'withdrawal':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Ionicons 
          name={getTransactionIcon(item.type)} 
          size={20} 
          color={getTransactionColor(item.type)} 
        />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.transactionAmount}>
        <Text style={[
          styles.transactionAmountText,
          { color: item.amount < 0 ? '#F44336' : '#4CAF50' }
        ]}>
          {item.amount > 0 ? '+' : ''}${Math.abs(item.amount).toFixed(2)}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'completed' ? '#E8F5E8' : '#FFF3E0' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'completed' ? '#4CAF50' : '#FF9800' }
          ]}>
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={64} color="#f44336" />
      <Text style={styles.errorText}>Something went wrong</Text>
      <Text style={styles.errorSubtext}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadData}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="wallet-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No earnings data available</Text>
      <Text style={styles.emptySubtext}>Start driving to see your earnings here</Text>
    </View>
  );

  if (loading && !earnings) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Loading earnings data...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {error ? (
        renderError()
      ) : (
        <>
          {/* Header with Tabs */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Earnings & Finance</Text>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
                onPress={() => setSelectedTab('overview')}
              >
                <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>
                  Overview
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'transactions' && styles.activeTab]}
                onPress={() => setSelectedTab('transactions')}
              >
                <Text style={[styles.tabText, selectedTab === 'transactions' && styles.activeTabText]}>
                  Transactions
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'payments' && styles.activeTab]}
                onPress={() => setSelectedTab('payments')}
              >
                <Text style={[styles.tabText, selectedTab === 'payments' && styles.activeTabText]}>
                  Payments
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {selectedTab === 'overview' && (
            <>
              {/* Earnings Overview */}
              <View style={styles.earningsSection}>
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
                    <Text style={[styles.periodText, selectedPeriod === 'week' && styles.selectedPeriodText]}>Week</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.periodButton, selectedPeriod === 'month' && styles.selectedPeriod]}
                    onPress={() => setSelectedPeriod('month')}
                  >
                    <Text style={[styles.periodText, selectedPeriod === 'month' && styles.selectedPeriodText]}>Month</Text>
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
                    <Text style={styles.statValue}>${earnings.pending.toFixed(2)}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{transactions.length}</Text>
                    <Text style={styles.statLabel}>Total Rides</Text>
                  </View>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.quickActionsSection}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.quickActions}>
                  <TouchableOpacity 
                    style={styles.quickActionButton} 
                    onPress={() => setShowWithdrawalModal(true)}
                  >
                    <Ionicons name="arrow-down" size={24} color="#4CAF50" />
                    <Text style={styles.quickActionText}>Withdraw</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickActionButton} onPress={downloadTaxDocuments}>
                    <Ionicons name="document-text" size={24} color="#FF9800" />
                    <Text style={styles.quickActionText}>Tax Docs</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickActionButton} onPress={shareEarnings}>
                    <Ionicons name="share" size={24} color="#2196F3" />
                    <Text style={styles.quickActionText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Recent Transactions Preview */}
              <View style={styles.recentTransactionsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Transactions</Text>
                  <TouchableOpacity onPress={() => setSelectedTab('transactions')}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>
                {transactions.slice(0, 3).map((transaction) => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionIcon}>
                      <Ionicons 
                        name={getTransactionIcon(transaction.type)} 
                        size={20} 
                        color={getTransactionColor(transaction.type)} 
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDescription}>{transaction.description}</Text>
                      <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                    </View>
                    <Text style={[
                      styles.transactionAmountText,
                      { color: transaction.amount < 0 ? '#F44336' : '#4CAF50' }
                    ]}>
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {selectedTab === 'transactions' && (
            <View style={styles.transactionsSection}>
              <Text style={styles.sectionTitle}>All Transactions</Text>
              {transactions.length === 0 ? (
                <View style={styles.emptyTransactionContainer}>
                  <Ionicons name="receipt-outline" size={32} color="#666" />
                  <Text style={styles.emptyTransactionText}>No transactions yet</Text>
                  <Text style={styles.emptyTransactionSubtext}>Your transaction history will appear here</Text>
                </View>
              ) : (
                <FlatList
                  data={transactions}
                  renderItem={renderTransaction}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                />
              )}
            </View>
          )}

          {selectedTab === 'payments' && (
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
          )}
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Payment Method</Text>
              <TouchableOpacity onPress={() => setShowAddPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
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
                    style={[styles.input, styles.cardInput]}
                    placeholder="MM/YY"
                    value={newPaymentMethod.expiryDate}
                    onChangeText={(text) => setNewPaymentMethod({...newPaymentMethod, expiryDate: text})}
                  />
                  <TextInput
                    style={[styles.input, styles.cardInput]}
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
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Add Method</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Withdrawal Modal */}
      <Modal
        visible={showWithdrawalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWithdrawalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Withdrawal</Text>
              <TouchableOpacity onPress={() => setShowWithdrawalModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.withdrawalInfo}>
              Available for withdrawal: <Text style={styles.withdrawalAmount}>${earnings.pending.toFixed(2)}</Text>
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              value={withdrawalAmount}
              onChangeText={setWithdrawalAmount}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowWithdrawalModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={requestWithdrawal}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Withdraw</Text>
                )}
              </TouchableOpacity>
            </View>
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
  header: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1976d2',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#1976d2',
    fontWeight: 'bold',
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
    fontWeight: 'bold',
  },
  selectedPeriodText: {
    color: '#fff',
  },
  earningsCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  earningsLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
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
  recentTransactionsSection: {
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
  viewAllText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  transactionDescription: {
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
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
  emptyPaymentContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyPaymentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  emptyPaymentSubtext: {
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
    fontWeight: 'bold',
    marginLeft: 5,
  },
  selectedPaymentTypeText: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardInput: {
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
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#1976d2',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  withdrawalInfo: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  withdrawalAmount: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  errorSubtext: {
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
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
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    color: '#666',
  },
});
