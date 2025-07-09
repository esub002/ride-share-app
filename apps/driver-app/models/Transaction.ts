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
  updatedAt?: string;
}

export interface TransactionCreate {
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  rideId?: string;
  paymentMethod: 'card' | 'bank' | 'cash';
}

export interface TransactionUpdate {
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
} 