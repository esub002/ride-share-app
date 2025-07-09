import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DriverDataService from '../services/DriverDataService';
import { Wallet, Card, BankAccount, Transaction } from '../models';

interface WalletScreenProps {
  navigation: any;
}

const WalletScreen: React.FC<WalletScreenProps> = ({ navigation }) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [walletData, cardsData, bankAccountsData, transactionsData] = await Promise.all([
        DriverDataService.getWallet(),
        DriverDataService.getCards(),
        DriverDataService.getBankAccounts(),
        DriverDataService.getTransactions(),
      ]);

      setWallet(walletData);
      setCards(cardsData);
      setBankAccounts(bankAccountsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const syncWithBackend = async () => {
    try {
      setSyncing(true);
      const token = 'your-auth-token'; // Replace with actual token retrieval
      
      const walletData = await DriverDataService.syncWalletWithBackend(token);
      if (walletData) {
        setWallet(walletData);
        setCards(walletData.cards);
        setBankAccounts(walletData.bankAccounts);
        setTransactions(walletData.transactions);
        Alert.alert('Success', 'Wallet data synced successfully');
      } else {
        Alert.alert('Warning', 'No wallet data was synced. Please check your connection.');
      }
    } catch (error) {
      console.error('Error syncing wallet with backend:', error);
      Alert.alert('Error', 'Failed to sync wallet with backend');
    } finally {
      setSyncing(false);
    }
  };

  const renderCard = ({ item }: { item: Card }) => (
    <View style={styles.cardItem}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardBrand}>{item.brand.toUpperCase()}</Text>
        {item.isDefault && <Text style={styles.defaultBadge}>Default</Text>}
      </View>
      <Text style={styles.cardNumber}>•••• •••• •••• {item.last4}</Text>
      <Text style={styles.cardHolder}>{item.cardHolder}</Text>
      <Text style={styles.cardExpiry}>Expires: {item.expiryMonth}/{item.expiryYear}</Text>
    </View>
  );

  const renderBankAccount = ({ item }: { item: BankAccount }) => (
    <View style={styles.bankItem}>
      <View style={styles.bankHeader}>
        <Text style={styles.bankName}>{item.bankName}</Text>
        {item.isDefault && <Text style={styles.defaultBadge}>Default</Text>}
      </View>
      <Text style={styles.accountType}>{item.accountType}</Text>
      <Text style={styles.accountHolder}>{item.accountHolder}</Text>
      <Text style={styles.accountNumber}>•••• •••• •••• {item.accountNumber.slice(-4)}</Text>
    </View>
  );

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionHeader}>
        <Text style={styles.transactionType}>{item.type.toUpperCase()}</Text>
        <Text style={[
          styles.transactionAmount,
          { color: item.type === 'credit' ? '#4CAF50' : '#F44336' }
        ]}>
          {item.type === 'credit' ? '+' : '-'}${item.amount.toFixed(2)}
        </Text>
      </View>
      <Text style={styles.transactionDescription}>{item.description}</Text>
      <Text style={styles.transactionDate}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      <Text style={styles.transactionStatus}>{item.status}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Wallet</Text>
          <Text style={styles.subtitle}>Manage your payment methods and transactions</Text>
        </View>

        {/* Balance Section */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            ${wallet?.balance?.toFixed(2) || '0.00'}
          </Text>
          <Text style={styles.balanceCurrency}>{wallet?.currency || 'USD'}</Text>
        </View>

        {/* Cards Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Cards</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddCard')}
            >
              <Text style={styles.addButtonText}>+ Add Card</Text>
            </TouchableOpacity>
          </View>
          {cards.length > 0 ? (
            <FlatList
              data={cards}
              renderItem={renderCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              style={styles.listContainer}
            />
          ) : (
            <Text style={styles.noDataText}>No cards added yet</Text>
          )}
        </View>

        {/* Bank Accounts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bank Accounts</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddBankAccount')}
            >
              <Text style={styles.addButtonText}>+ Add Account</Text>
            </TouchableOpacity>
          </View>
          {bankAccounts.length > 0 ? (
            <FlatList
              data={bankAccounts}
              renderItem={renderBankAccount}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              style={styles.listContainer}
            />
          ) : (
            <Text style={styles.noDataText}>No bank accounts added yet</Text>
          )}
        </View>

        {/* Recent Transactions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('TransactionHistory')}
            >
              <Text style={styles.viewAllButtonText}>View All</Text>
            </TouchableOpacity>
          </View>
          {transactions.length > 0 ? (
            <FlatList
              data={transactions.slice(0, 5)} // Show only recent 5 transactions
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              style={styles.listContainer}
            />
          ) : (
            <Text style={styles.noDataText}>No transactions yet</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={syncWithBackend}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Sync with Backend</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('WithdrawFunds')}
          >
            <Text style={styles.buttonText}>Withdraw Funds</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={() => navigation.navigate('TransactionHistory')}
          >
            <Text style={styles.buttonText}>Transaction History</Text>
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
  balanceSection: {
    margin: 20,
    backgroundColor: '#007AFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginVertical: 5,
  },
  balanceCurrency: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  viewAllButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewAllButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    marginTop: 10,
  },
  cardItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardBrand: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    color: '#FFFFFF',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 5,
  },
  cardHolder: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 3,
  },
  cardExpiry: {
    fontSize: 12,
    color: '#999999',
  },
  bankItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  bankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bankName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  accountType: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
    textTransform: 'capitalize',
  },
  accountHolder: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 3,
  },
  accountNumber: {
    fontSize: 12,
    color: '#999999',
  },
  transactionItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionDescription: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 5,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 3,
  },
  transactionStatus: {
    fontSize: 12,
    color: '#666666',
    textTransform: 'capitalize',
  },
  noDataText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
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

export default WalletScreen; 