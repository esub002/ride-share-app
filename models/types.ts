// User, Driver, and Ride models for type safety and code reuse
export type User = {
  id: number;
  name: string;
  email: string;
  verified: boolean;
  created_at: string;
};

export type Driver = {
  id: number;
  name: string;
  car_info: string;
  available: boolean;
  email: string;
  verified: boolean;
  latitude?: number;
  longitude?: number;
  created_at: string;
};

export type Ride = {
  id: number;
  rider_id: number;
  driver_id: number;
  origin: string;
  destination: string;
  status: string;
  requested_at: string;
  accepted_at?: string;
};
