import { CardCreate, BankAccountCreate, DriverProfileUpdate, ContactInfoUpdate } from '../models';

export class DataValidation {
  // Card validation
  static validateCard(cardData: CardCreate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Card number validation (Luhn algorithm)
    if (!this.isValidCardNumber(cardData.cardNumber)) {
      errors.push('Invalid card number');
    }

    // Card holder validation
    if (!cardData.cardHolder || cardData.cardHolder.trim().length < 2) {
      errors.push('Card holder name must be at least 2 characters');
    }

    // Expiry date validation
    if (!this.isValidExpiryDate(cardData.expiryMonth, cardData.expiryYear)) {
      errors.push('Invalid expiry date');
    }

    // CVV validation
    if (!this.isValidCVV(cardData.cvv, cardData.brand)) {
      errors.push('Invalid CVV');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Bank account validation
  static validateBankAccount(bankAccountData: BankAccountCreate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Bank name validation
    if (!bankAccountData.bankName || bankAccountData.bankName.trim().length < 2) {
      errors.push('Bank name must be at least 2 characters');
    }

    // Account number validation
    if (!this.isValidAccountNumber(bankAccountData.accountNumber)) {
      errors.push('Invalid account number');
    }

    // Account holder validation
    if (!bankAccountData.accountHolder || bankAccountData.accountHolder.trim().length < 2) {
      errors.push('Account holder name must be at least 2 characters');
    }

    // Routing number validation (US format)
    if (!this.isValidRoutingNumber(bankAccountData.routingNumber)) {
      errors.push('Invalid routing number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Profile validation
  static validateProfile(profileData: DriverProfileUpdate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (profileData.name && profileData.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (profileData.email && !this.isValidEmail(profileData.email)) {
      errors.push('Invalid email address');
    }

    if (profileData.phone && !this.isValidPhone(profileData.phone)) {
      errors.push('Invalid phone number');
    }

    if (profileData.licenseNumber && profileData.licenseNumber.trim().length < 5) {
      errors.push('License number must be at least 5 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Contact info validation
  static validateContactInfo(contactData: ContactInfoUpdate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (contactData.email && !this.isValidEmail(contactData.email)) {
      errors.push('Invalid email address');
    }

    if (contactData.phone && !this.isValidPhone(contactData.phone)) {
      errors.push('Invalid phone number');
    }

    if (contactData.emergencyContact) {
      const emergencyErrors = this.validateEmergencyContact(contactData.emergencyContact);
      errors.push(...emergencyErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Emergency contact validation
  static validateEmergencyContact(emergencyContact: any): string[] {
    const errors: string[] = [];

    if (!emergencyContact.name || emergencyContact.name.trim().length < 2) {
      errors.push('Emergency contact name must be at least 2 characters');
    }

    if (!emergencyContact.phone || !this.isValidPhone(emergencyContact.phone)) {
      errors.push('Invalid emergency contact phone number');
    }

    if (!emergencyContact.relation || emergencyContact.relation.trim().length < 2) {
      errors.push('Emergency contact relation must be at least 2 characters');
    }

    return errors;
  }

  // Utility validation methods
  static isValidCardNumber(cardNumber: string): boolean {
    if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
      return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  static isValidExpiryDate(month: string, year: string): boolean {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const expMonth = parseInt(month);
    const expYear = parseInt(year);

    if (isNaN(expMonth) || isNaN(expYear)) {
      return false;
    }

    if (expMonth < 1 || expMonth > 12) {
      return false;
    }

    if (expYear < currentYear) {
      return false;
    }

    if (expYear === currentYear && expMonth < currentMonth) {
      return false;
    }

    return true;
  }

  static isValidCVV(cvv: string, brand: string): boolean {
    if (!cvv || cvv.length < 3 || cvv.length > 4) {
      return false;
    }

    // CVV length depends on card brand
    if (brand === 'amex' && cvv.length !== 4) {
      return false;
    }

    if (brand !== 'amex' && cvv.length !== 3) {
      return false;
    }

    return /^\d+$/.test(cvv);
  }

  static isValidAccountNumber(accountNumber: string): boolean {
    if (!accountNumber || accountNumber.length < 8 || accountNumber.length > 17) {
      return false;
    }

    return /^\d+$/.test(accountNumber);
  }

  static isValidRoutingNumber(routingNumber: string): boolean {
    if (!routingNumber || routingNumber.length !== 9) {
      return false;
    }

    return /^\d+$/.test(routingNumber);
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone: string): boolean {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Check if it's a valid length (7-15 digits)
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      return false;
    }

    return true;
  }

  // Format methods
  static formatCardNumber(cardNumber: string): string {
    // Remove all non-digit characters
    const digitsOnly = cardNumber.replace(/\D/g, '');
    
    // Format as XXXX XXXX XXXX XXXX
    return digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digitsOnly.length === 10) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
    }
    
    return phone;
  }

  static maskCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 4) {
      return cardNumber;
    }
    
    const last4 = cardNumber.slice(-4);
    const masked = '*'.repeat(cardNumber.length - 4);
    return masked + last4;
  }

  static maskAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber.length < 4) {
      return accountNumber;
    }
    
    const last4 = accountNumber.slice(-4);
    const masked = '*'.repeat(accountNumber.length - 4);
    return masked + last4;
  }
} 