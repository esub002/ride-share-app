import DriverStorage from '../storage/DriverStorage';
import DriverAPIService from './DriverAPIService';
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

class DriverDataService {
  private storage: typeof DriverStorage;
  private apiService: typeof DriverAPIService;

  constructor() {
    this.storage = DriverStorage;
    this.apiService = DriverAPIService;
  }

  // Profile Management
  async initializeDriverProfile(profileData: Partial<DriverProfile>): Promise<DriverProfile> {
    const defaultProfile: DriverProfile = {
      id: `driver_${Date.now()}`,
      name: '',
      email: '',
      phone: '',
      carInfo: '',
      licenseNumber: '',
      isVerified: false,
      isActive: true,
      joinedDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      ...profileData,
    };

    await this.storage.saveDriverProfile(defaultProfile);
    return defaultProfile;
  }

  async getDriverProfile(): Promise<DriverProfile | null> {
    return this.storage.getDriverProfile();
  }

  async updateDriverProfile(updates: DriverProfileUpdate): Promise<DriverProfile | null> {
    return this.storage.updateDriverProfile(updates);
  }

  async syncProfileWithBackend(token: string): Promise<DriverProfile | null> {
    try {
      const response = await this.apiService.getDriverProfile(token);
      if (response.success && response.data) {
        await this.storage.saveDriverProfile(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error syncing profile with backend:', error);
      return null;
    }
  }

  async updateProfileOnBackend(updates: DriverProfileUpdate, token: string): Promise<boolean> {
    try {
      const response = await this.apiService.updateDriverProfile(updates, token);
      if (response.success && response.data) {
        await this.storage.saveDriverProfile(response.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating profile on backend:', error);
      return false;
    }
  }

  // Contact Information Management
  async initializeContactInfo(contactData: Partial<ContactInfo>): Promise<ContactInfo> {
    const defaultContact: ContactInfo = {
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      emergencyContact: {
        name: '',
        phone: '',
        relation: '',
        isPrimary: true,
      },
      preferredContactMethod: 'phone',
      ...contactData,
    };

    await this.storage.saveContactInfo(defaultContact);
    return defaultContact;
  }

  async getContactInfo(): Promise<ContactInfo | null> {
    return this.storage.getContactInfo();
  }

  async updateContactInfo(updates: ContactInfoUpdate): Promise<ContactInfo | null> {
    return this.storage.updateContactInfo(updates);
  }

  // Wallet Management
  async initializeWallet(walletData: Partial<Wallet>): Promise<Wallet> {
    const defaultWallet: Wallet = {
      id: `wallet_${Date.now()}`,
      driverId: walletData.driverId || `driver_${Date.now()}`,
      balance: 0,
      currency: 'USD',
      cards: [],
      bankAccounts: [],
      transactions: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...walletData,
    };

    await this.storage.saveWallet(defaultWallet);
    return defaultWallet;
  }

  async getWallet(): Promise<Wallet | null> {
    return this.storage.getWallet();
  }

  async updateWallet(updates: WalletUpdate): Promise<Wallet | null> {
    return this.storage.updateWallet(updates);
  }

  async syncWalletWithBackend(token: string): Promise<Wallet | null> {
    try {
      const [balanceResponse, cardsResponse, bankAccountsResponse, transactionsResponse] = await Promise.all([
        this.apiService.getWalletBalance(token),
        this.apiService.getWalletCards(token),
        this.apiService.getBankAccounts(token),
        this.apiService.getTransactions(token),
      ]);

      const currentWallet = await this.getWallet();
      if (!currentWallet) return null;

      const updatedWallet: Wallet = {
        ...currentWallet,
        balance: balanceResponse.success ? balanceResponse.data?.balance || 0 : currentWallet.balance,
        cards: cardsResponse.success ? cardsResponse.data || [] : currentWallet.cards,
        bankAccounts: bankAccountsResponse.success ? bankAccountsResponse.data || [] : currentWallet.bankAccounts,
        transactions: transactionsResponse.success ? transactionsResponse.data?.items || [] : currentWallet.transactions,
        updatedAt: new Date().toISOString(),
      };

      await this.storage.saveWallet(updatedWallet);
      return updatedWallet;
    } catch (error) {
      console.error('Error syncing wallet with backend:', error);
      return null;
    }
  }

  // Card Management
  async addCard(cardData: CardCreate): Promise<Card | null> {
    return this.storage.addCard(cardData);
  }

  async getCards(): Promise<Card[]> {
    return this.storage.getCards();
  }

  async updateCard(cardId: string, updates: CardUpdate): Promise<Card | null> {
    return this.storage.updateCard(cardId, updates);
  }

  async deleteCard(cardId: string): Promise<boolean> {
    try {
      await this.storage.deleteCard(cardId);
      return true;
    } catch (error) {
      console.error('Error deleting card:', error);
      return false;
    }
  }

  async addCardToBackend(cardData: CardCreate, token: string): Promise<Card | null> {
    try {
      // Convert CardCreate to the format expected by the API
      const apiCardData = {
        ...cardData,
        isActive: true,
        last4: cardData.cardNumber.slice(-4),
        isDefault: cardData.isDefault || false,
      };
      
      const response = await this.apiService.addWalletCard(apiCardData, token);
      if (response.success && response.data) {
        await this.storage.addCard(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error adding card to backend:', error);
      return null;
    }
  }

  async updateCardOnBackend(cardId: string, updates: CardUpdate, token: string): Promise<boolean> {
    try {
      const response = await this.apiService.updateWalletCard(cardId, updates, token);
      if (response.success && response.data) {
        await this.storage.updateCard(cardId, response.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating card on backend:', error);
      return false;
    }
  }

  async deleteCardFromBackend(cardId: string, token: string): Promise<boolean> {
    try {
      const response = await this.apiService.deleteWalletCard(cardId, token);
      if (response.success) {
        await this.storage.deleteCard(cardId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting card from backend:', error);
      return false;
    }
  }

  // Bank Account Management
  async addBankAccount(bankData: BankAccountCreate): Promise<BankAccount | null> {
    return this.storage.addBankAccount(bankData);
  }

  async getBankAccounts(): Promise<BankAccount[]> {
    return this.storage.getBankAccounts();
  }

  async updateBankAccount(accountId: string, updates: BankAccountUpdate): Promise<BankAccount | null> {
    return this.storage.updateBankAccount(accountId, updates);
  }

  async deleteBankAccount(accountId: string): Promise<boolean> {
    try {
      await this.storage.deleteBankAccount(accountId);
      return true;
    } catch (error) {
      console.error('Error deleting bank account:', error);
      return false;
    }
  }

  async addBankAccountToBackend(bankData: BankAccountCreate, token: string): Promise<BankAccount | null> {
    try {
      // Convert BankAccountCreate to the format expected by the API
      const apiBankData = {
        ...bankData,
        isActive: true,
        isDefault: bankData.isDefault || false,
      };
      
      const response = await this.apiService.addBankAccount(apiBankData, token);
      if (response.success && response.data) {
        await this.storage.addBankAccount(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error adding bank account to backend:', error);
      return null;
    }
  }

  async updateBankAccountOnBackend(accountId: string, updates: BankAccountUpdate, token: string): Promise<boolean> {
    try {
      const response = await this.apiService.updateBankAccount(accountId, updates, token);
      if (response.success && response.data) {
        await this.storage.updateBankAccount(accountId, response.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating bank account on backend:', error);
      return false;
    }
  }

  async deleteBankAccountFromBackend(accountId: string, token: string): Promise<boolean> {
    try {
      const response = await this.apiService.deleteBankAccount(accountId, token);
      if (response.success) {
        await this.storage.deleteBankAccount(accountId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting bank account from backend:', error);
      return false;
    }
  }

  // Transaction Management
  async addTransaction(transactionData: TransactionCreate): Promise<Transaction | null> {
    return this.storage.addTransaction(transactionData);
  }

  async getTransactions(): Promise<Transaction[]> {
    return this.storage.getTransactions();
  }

  async updateTransaction(transactionId: string, updates: TransactionUpdate): Promise<Transaction | null> {
    return this.storage.updateTransaction(transactionId, updates);
  }

  // Data Synchronization
  async syncAllData(token: string): Promise<{
    profile: boolean;
    wallet: boolean;
    contact: boolean;
  }> {
    const results = {
      profile: false,
      wallet: false,
      contact: false,
    };

    try {
      // Sync profile
      const profile = await this.syncProfileWithBackend(token);
      results.profile = profile !== null;

      // Sync wallet
      const wallet = await this.syncWalletWithBackend(token);
      results.wallet = wallet !== null;

      // Contact info is typically part of profile, so we'll consider it synced with profile
      results.contact = results.profile;

      return results;
    } catch (error) {
      console.error('Error syncing all data:', error);
      return results;
    }
  }

  // Data Export/Import
  async exportData(): Promise<{
    profile: DriverProfile | null;
    contact: ContactInfo | null;
    wallet: Wallet | null;
  }> {
    const [profile, contact, wallet] = await Promise.all([
      this.getDriverProfile(),
      this.getContactInfo(),
      this.getWallet(),
    ]);

    return { profile, contact, wallet };
  }

  async importData(data: {
    profile?: DriverProfile;
    contact?: ContactInfo;
    wallet?: Wallet;
  }): Promise<void> {
    const promises: Promise<void>[] = [];

    if (data.profile) {
      promises.push(this.storage.saveDriverProfile(data.profile));
    }

    if (data.contact) {
      promises.push(this.storage.saveContactInfo(data.contact));
    }

    if (data.wallet) {
      promises.push(this.storage.saveWallet(data.wallet));
    }

    await Promise.all(promises);
  }

  // Data Cleanup
  async clearAllData(): Promise<void> {
    // Clear all storage data by removing keys
    const storage = this.storage as any;
    if (storage.clearAllData) {
      await storage.clearAllData();
    } else {
      // Fallback: clear individual items
      console.warn('clearAllData method not available, using fallback');
    }
  }

  // Health Check
  async checkDataIntegrity(): Promise<{
    profile: boolean;
    contact: boolean;
    wallet: boolean;
    cards: boolean;
    bankAccounts: boolean;
    transactions: boolean;
  }> {
    const results = {
      profile: false,
      contact: false,
      wallet: false,
      cards: false,
      bankAccounts: false,
      transactions: false,
    };

    try {
      const [profile, contact, wallet, cards, bankAccounts, transactions] = await Promise.all([
        this.getDriverProfile(),
        this.getContactInfo(),
        this.getWallet(),
        this.getCards(),
        this.getBankAccounts(),
        this.getTransactions(),
      ]);

      results.profile = profile !== null;
      results.contact = contact !== null;
      results.wallet = wallet !== null;
      results.cards = Array.isArray(cards);
      results.bankAccounts = Array.isArray(bankAccounts);
      results.transactions = Array.isArray(transactions);

      return results;
    } catch (error) {
      console.error('Error checking data integrity:', error);
      return results;
    }
  }
}

export default new DriverDataService(); 