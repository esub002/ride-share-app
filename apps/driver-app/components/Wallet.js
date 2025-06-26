import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import apiService from '../utils/api';

export default function Wallet({ token, user }) {
  const [walletData, setWalletData] = useState({
    balance: 0,
    pendingAmount: 0,
    totalEarned: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  useEffect(() => {
    if (user && user.id) {
      fetchWalletData();
      fetchTransactions();
      fetchPaymentMethods();
    } else {
      // Use mock data if no user
      setWalletData({
        balance: 1250.75,
        pendingAmount: 45.50,
        totalEarned: 15420.50,
      });
      setTransactions([
        {
          id: 1,
          type: 'ride_earnings',
          amount: 25.50,
          description: 'Ride from Downtown to Uptown',
          created_at: '2024-01-15T10:30:00Z',
          status: 'completed',
        },
        {
          id: 2,
          type: 'withdrawal',
          amount: 500.00,
          description: 'Withdrawal to Chase Bank',
          created_at: '2024-01-14T15:20:00Z',
          status: 'completed',
        },
      ]);
      setPaymentMethods([
        {
          id: 1,
          type: 'bank',
          accountName: 'Chase Bank',
          accountNumber: '****1234',
        },
      ]);
      setSelectedPaymentMethod({
        id: 1,
        type: 'bank',
        accountName: 'Chase Bank',
        accountNumber: '****1234',
      });
    }
  }, [user]);

  const fetchWalletData = async () => {
    if (!user || !user.id) return;
    
    try {
      const response = await fetch(`${apiService.API_BASE_URL}/api/drivers/${user.id}/wallet`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
      } else {
        // Use mock data on error
        setWalletData({
          balance: 1250.75,
          pendingAmount: 45.50,
          totalEarned: 15420.50,
        });
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      // Use mock data on error
      setWalletData({
        balance: 1250.75,
        pendingAmount: 45.50,
        totalEarned: 15420.50,
      });
    }
  };

  const fetchTransactions = async () => {
    if (!user || !user.id) return;
    
    try {
      const data = apiService.MOCK_DATA.transactions;
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      // Use mock data on error
      setTransactions([
        {
          id: 1,
          type: 'ride_earnings',
          amount: 25.50,
          description: 'Ride from Downtown to Uptown',
          created_at: '2024-01-15T10:30:00Z',
          status: 'completed',
        },
        {
          id: 2,
          type: 'withdrawal',
          amount: 500.00,
          description: 'Withdrawal to Chase Bank',
          created_at: '2024-01-14T15:20:00Z',
          status: 'completed',
        },
      ]);
    }
  };

  const fetchPaymentMethods = async () => {
    if (!user || !user.id) return;
    
    try {
      const data = apiService.MOCK_DATA.paymentMethods;
      setPaymentMethods(data);
      if (data.length > 0) {
        setSelectedPaymentMethod(data[0]);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      // Use mock data on error
      const mockPaymentMethods = [
        {
          id: 1,
          type: 'bank',
          accountName: 'Chase Bank',
          accountNumber: '****1234',
        },
      ];
      setPaymentMethods(mockPaymentMethods);
      setSelectedPaymentMethod(mockPaymentMethods[0]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchWalletData(),
      fetchTransactions(),
      fetchPaymentMethods(),
    ]);
    setRefreshing(false);
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }

    if (parseFloat(withdrawAmount) > walletData.balance) {
      Alert.alert("Insufficient Balance", "You don't have enough balance");
      return;
    }

    if (!selectedPaymentMethod) {
      Alert.alert("No Payment Method", "Please add a payment method first");
      return;
    }

    setLoading(true);
    try {
      if (!user || !user.id) {
        Alert.alert(
          "Withdrawal Successful",
          `$${withdrawAmount} will be transferred to your ${selectedPaymentMethod.type} account within 2-3 business days.`
        );
        setShowWithdrawModal(false);
        setWithdrawAmount("");
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${apiService.API_BASE_URL}/api/drivers/${user.id}/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          paymentMethodId: selectedPaymentMethod.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert(
          "Withdrawal Successful",
          `$${withdrawAmount} will be transferred to your ${selectedPaymentMethod.type} account within 2-3 business days.`
        );
        setShowWithdrawModal(false);
        setWithdrawAmount("");
        fetchWalletData();
        fetchTransactions();
      } else {
        const error = await response.json();
        Alert.alert("Withdrawal Failed", error.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      Alert.alert("Error", "Network error. Please try again.");
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "ride_earnings":
        return "car";
      case "withdrawal":
        return "card";
      case "bonus":
        return "gift";
      case "refund":
        return "refresh";
      default:
        return "cash";
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case "ride_earnings":
      case "bonus":
        return "#4CAF50";
      case "withdrawal":
        return "#F44336";
      case "refund":
        return "#2196F3";
      default:
        return "#666";
    }
  };

  const renderTransaction = (transaction) => (
    <View key={transaction.id} style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(transaction.type) + '20' }]}>
          <Ionicons 
            name={getTransactionIcon(transaction.type)} 
            size={20} 
            color={getTransactionColor(transaction.type)} 
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>{transaction.description}</Text>
          <Text style={styles.transactionDate}>{formatDate(transaction.created_at)}</Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { color: transaction.type === 'withdrawal' ? '#F44336' : '#4CAF50' }
        ]}>
          {transaction.type === 'withdrawal' ? '-' : '+'}${transaction.amount}
        </Text>
        <Text style={styles.transactionStatus}>{transaction.status}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
      </View>

      {/* Balance Cards */}
      <View style={styles.balanceSection}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>${walletData.balance.toFixed(2)}</Text>
          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={() => setShowWithdrawModal(true)}
            disabled={walletData.balance <= 0}
          >
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>${walletData.pendingAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Earned</Text>
            <Text style={styles.statValue}>${walletData.totalEarned.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Payment Methods */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={20} color="#2196F3" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        
        {paymentMethods.length > 0 ? (
          paymentMethods.map((method) => (
            <View key={method.id} style={styles.paymentMethodItem}>
              <Ionicons 
                name={method.type === 'bank' ? 'card' : 'card-outline'} 
                size={24} 
                color="#2196F3" 
              />
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodName}>{method.name}</Text>
                <Text style={styles.paymentMethodDetails}>
                  {method.type === 'bank' ? `****${method.last4}` : method.email}
                </Text>
              </View>
              {selectedPaymentMethod?.id === method.id && (
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No payment methods added</Text>
        )}
      </View>

      {/* Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        
        {transactions.length > 0 ? (
          transactions.map(renderTransaction)
        ) : (
          <Text style={styles.emptyText}>No transactions yet</Text>
        )}
      </View>

      {/* Withdrawal Modal */}
      <Modal
        visible={showWithdrawModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw Funds</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Available Balance: ${walletData.balance.toFixed(2)}
            </Text>

            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />

            {selectedPaymentMethod && (
              <View style={styles.selectedMethod}>
                <Text style={styles.selectedMethodLabel}>To:</Text>
                <Text style={styles.selectedMethodText}>
                  {selectedPaymentMethod.name} ({selectedPaymentMethod.type})
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
              onPress={handleWithdraw}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm Withdrawal</Text>
              )}
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
  balanceSection: {
    padding: 20,
  },
  balanceCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  withdrawButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  withdrawButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  section: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  addButtonText: {
    color: "#2196F3",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 5,
  },
  paymentMethodItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  paymentMethodInfo: {
    flex: 1,
    marginLeft: 15,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  paymentMethodDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  transactionDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  transactionStatus: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  selectedMethod: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  selectedMethodLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 10,
  },
  selectedMethodText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  confirmButton: {
    backgroundColor: "#2196F3",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "#ccc",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
}); 