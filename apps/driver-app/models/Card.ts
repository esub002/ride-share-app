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

export interface CardCreate {
  cardNumber: string;
  cardHolder: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';
  isDefault?: boolean;
}

export interface CardUpdate {
  cardHolder?: string;
  isDefault?: boolean;
  isActive?: boolean;
} 