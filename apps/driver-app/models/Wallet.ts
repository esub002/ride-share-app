export interface Wallet {
  id: string;
  driverId: string;
  balance: number;
  currency: string;
  cards: Card[];
  bankAccounts: BankAccount[];
  transactions: Transaction[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  cardNumber: string;
  cardHolder: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';
  last4: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  rideId?: string;
  paymentMethod: 'card' | 'bank' | 'cash';
  createdAt: string;
}

export interface WalletUpdate {
  balance?: number;
  currency?: string;
  isActive?: boolean;
} 