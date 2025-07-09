export interface DriverProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  carInfo: string;
  licenseNumber: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isVerified: boolean;
  isActive: boolean;
  rating?: number;
  totalRides?: number;
  joinedDate: string;
  lastUpdated: string;
}

export interface DriverProfileUpdate {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  carInfo?: string;
  licenseNumber?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
} 