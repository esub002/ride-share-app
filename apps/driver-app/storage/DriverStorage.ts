import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DriverProfile,
  DriverProfileUpdate,
  ContactInfo,
  ContactInfoUpdate,
  Wallet,
  WalletUpdate,
  Card,
  CardCreate,
  CardUpdate,
  BankAccount,
  BankAccountCreate,
  BankAccountUpdate,
  Transaction,
  TransactionCreate,
  TransactionUpdate,
} from '../models';

// Storage keys
const STORAGE_KEYS = {
  DRIVER_PROFILE: 'driver_profile',
  CONTACT_INFO: 'driver_contact_info',
  WALLET: 'driver_wallet',
  CARDS: 'driver_cards',
  BANK_ACCOUNTS: 'driver_bank_accounts',
  TRANSACTIONS: 'driver_transactions',
} as const;

class DriverStorage {
  // Driver Profile Methods
  async saveDriverProfile(profile: DriverProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DRIVER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving driver profile:', error);
      throw new Error('Failed to save driver profile');
    }
  }

  async getDriverProfile(): Promise<DriverProfile | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DRIVER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting driver profile:', error);
      return null;
    }
  }

  async updateDriverProfile(updates: DriverProfileUpdate): Promise<DriverProfile | null> {
    try {
      const currentProfile = await this.getDriverProfile();
      if (!currentProfile) {
        throw new Error('No driver profile found');
      }

      const updatedProfile: DriverProfile = {
        ...currentProfile,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };

      await this.saveDriverProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating driver profile:', error);
      throw error;
    }
  }

  // Contact Info Methods
  async saveContactInfo(contactInfo: ContactInfo): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONTACT_INFO, JSON.stringify(contactInfo));
    } catch (error) {
      console.error('Error saving contact info:', error);
      throw new Error('Failed to save contact info');
    }
  }

  async getContactInfo(): Promise<ContactInfo | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CONTACT_INFO);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting contact info:', error);
      return null;
    }
  }

  async updateContactInfo(updates: ContactInfoUpdate): Promise<ContactInfo | null> {
    try {
      const currentContactInfo = await this.getContactInfo();
      if (!currentContactInfo) {
        throw new Error('No contact info found');
      }

      const updatedContactInfo: ContactInfo = {
        ...currentContactInfo,
        ...updates,
        emergencyContact: updates.emergencyContact 
          ? { ...currentContactInfo.emergencyContact, ...updates.emergencyContact }
          : currentContactInfo.emergencyContact,
      };

      await this.saveContactInfo(updatedContactInfo);
      return updatedContactInfo;
    } catch (error) {
      console.error('Error updating contact info:', error);
      throw error;
    }
  }

  // Wallet Methods
  async saveWallet(wallet: Wallet): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(wallet));
    } catch (error) {
      console.error('Error saving wallet:', error);
      throw new Error('Failed to save wallet');
    }
  }

  async getWallet(): Promise<Wallet | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WALLET);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting wallet:', error);
      return null;
    }
  }

  async updateWallet(updates: WalletUpdate): Promise<Wallet | null> {
    try {
      const currentWallet = await this.getWallet();
      if (!currentWallet) {
        throw new Error('No wallet found');
      }

      const updatedWallet: Wallet = {
        ...currentWallet,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await this.saveWallet(updatedWallet);
      return updatedWallet;
    } catch (error) {
      console.error('Error updating wallet:', error);
      throw error;
    }
  }

  // Card Methods
  async saveCards(cards: Card[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
    } catch (error) {
      console.error('Error saving cards:', error);
      throw new Error('Failed to save cards');
    }
  }

  async getCards(): Promise<Card[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CARDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting cards:', error);
      return [];
    }
  }

  async addCard(cardData: CardCreate): Promise<Card> {
    try {
      const cards = await this.getCards();
      const newCard: Card = {
        id: `card_${Date.now()}`,
        ...cardData,
        last4: cardData.cardNumber.slice(-4),
        isDefault: cardData.isDefault || false,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      // If this card is set as default, unset other cards
      if (newCard.isDefault) {
        cards.forEach(card => card.isDefault = false);
      }

      cards.push(newCard);
      await this.saveCards(cards);
      return newCard;
    } catch (error) {
      console.error('Error adding card:', error);
      throw error;
    }
  }

  async updateCard(cardId: string, updates: CardUpdate): Promise<Card | null> {
    try {
      const cards = await this.getCards();
      const cardIndex = cards.findIndex(card => card.id === cardId);
      
      if (cardIndex === -1) {
        throw new Error('Card not found');
      }

      const updatedCard: Card = {
        ...cards[cardIndex],
        ...updates,
      };

      // If this card is set as default, unset other cards
      if (updates.isDefault) {
        cards.forEach((card, index) => {
          if (index !== cardIndex) {
            card.isDefault = false;
          }
        });
      }

      cards[cardIndex] = updatedCard;
      await this.saveCards(cards);
      return updatedCard;
    } catch (error) {
      console.error('Error updating card:', error);
      throw error;
    }
  }

  async deleteCard(cardId: string): Promise<void> {
    try {
      const cards = await this.getCards();
      const filteredCards = cards.filter(card => card.id !== cardId);
      await this.saveCards(filteredCards);
    } catch (error) {
      console.error('Error deleting card:', error);
      throw error;
    }
  }

  // Bank Account Methods
  async saveBankAccounts(bankAccounts: BankAccount[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BANK_ACCOUNTS, JSON.stringify(bankAccounts));
    } catch (error) {
      console.error('Error saving bank accounts:', error);
      throw new Error('Failed to save bank accounts');
    }
  }

  async getBankAccounts(): Promise<BankAccount[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BANK_ACCOUNTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting bank accounts:', error);
      return [];
    }
  }

  async addBankAccount(bankAccountData: BankAccountCreate): Promise<BankAccount> {
    try {
      const bankAccounts = await this.getBankAccounts();
      const newBankAccount: BankAccount = {
        id: `bank_${Date.now()}`,
        ...bankAccountData,
        isDefault: bankAccountData.isDefault || false,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      // If this account is set as default, unset other accounts
      if (newBankAccount.isDefault) {
        bankAccounts.forEach(account => account.isDefault = false);
      }

      bankAccounts.push(newBankAccount);
      await this.saveBankAccounts(bankAccounts);
      return newBankAccount;
    } catch (error) {
      console.error('Error adding bank account:', error);
      throw error;
    }
  }

  async updateBankAccount(accountId: string, updates: BankAccountUpdate): Promise<BankAccount | null> {
    try {
      const bankAccounts = await this.getBankAccounts();
      const accountIndex = bankAccounts.findIndex(account => account.id === accountId);
      
      if (accountIndex === -1) {
        throw new Error('Bank account not found');
      }

      const updatedAccount: BankAccount = {
        ...bankAccounts[accountIndex],
        ...updates,
      };

      // If this account is set as default, unset other accounts
      if (updates.isDefault) {
        bankAccounts.forEach((account, index) => {
          if (index !== accountIndex) {
            account.isDefault = false;
          }
        });
      }

      bankAccounts[accountIndex] = updatedAccount;
      await this.saveBankAccounts(bankAccounts);
      return updatedAccount;
    } catch (error) {
      console.error('Error updating bank account:', error);
      throw error;
    }
  }

  async deleteBankAccount(accountId: string): Promise<void> {
    try {
      const bankAccounts = await this.getBankAccounts();
      const filteredAccounts = bankAccounts.filter(account => account.id !== accountId);
      await this.saveBankAccounts(filteredAccounts);
    } catch (error) {
      console.error('Error deleting bank account:', error);
      throw error;
    }
  }

  // Transaction Methods
  async saveTransactions(transactions: Transaction[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
      throw new Error('Failed to save transactions');
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  async addTransaction(transactionData: TransactionCreate): Promise<Transaction> {
    try {
      const transactions = await this.getTransactions();
      const newTransaction: Transaction = {
        id: `txn_${Date.now()}`,
        ...transactionData,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      transactions.push(newTransaction);
      await this.saveTransactions(transactions);
      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  async updateTransaction(transactionId: string, updates: TransactionUpdate): Promise<Transaction | null> {
    try {
      const transactions = await this.getTransactions();
      const transactionIndex = transactions.findIndex(txn => txn.id === transactionId);
      
      if (transactionIndex === -1) {
        throw new Error('Transaction not found');
      }

      const updatedTransaction: Transaction = {
        ...transactions[transactionIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      transactions[transactionIndex] = updatedTransaction;
      await this.saveTransactions(transactions);
      return updatedTransaction;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  // Utility Methods
  async clearAllDriverData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Error clearing driver data:', error);
      throw new Error('Failed to clear driver data');
    }
  }

  async getDriverDataSummary(): Promise<{
    hasProfile: boolean;
    hasContactInfo: boolean;
    hasWallet: boolean;
    cardsCount: number;
    bankAccountsCount: number;
    transactionsCount: number;
  }> {
    try {
      const [profile, contactInfo, wallet, cards, bankAccounts, transactions] = await Promise.all([
        this.getDriverProfile(),
        this.getContactInfo(),
        this.getWallet(),
        this.getCards(),
        this.getBankAccounts(),
        this.getTransactions(),
      ]);

      return {
        hasProfile: !!profile,
        hasContactInfo: !!contactInfo,
        hasWallet: !!wallet,
        cardsCount: cards.length,
        bankAccountsCount: bankAccounts.length,
        transactionsCount: transactions.length,
      };
    } catch (error) {
      console.error('Error getting driver data summary:', error);
      return {
        hasProfile: false,
        hasContactInfo: false,
        hasWallet: false,
        cardsCount: 0,
        bankAccountsCount: 0,
        transactionsCount: 0,
      };
    }
  }
}

export default new DriverStorage(); 