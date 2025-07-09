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

export interface BankAccountCreate {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
  isDefault?: boolean;
}

export interface BankAccountUpdate {
  bankName?: string;
  accountHolder?: string;
  isDefault?: boolean;
  isActive?: boolean;
} 