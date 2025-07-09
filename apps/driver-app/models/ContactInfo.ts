export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  emergencyContact: EmergencyContact;
  alternatePhone?: string;
  preferredContactMethod: 'phone' | 'email' | 'sms';
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
  email?: string;
  isPrimary: boolean;
}

export interface ContactInfoUpdate {
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  emergencyContact?: Partial<EmergencyContact>;
  alternatePhone?: string;
  preferredContactMethod?: 'phone' | 'email' | 'sms';
} 