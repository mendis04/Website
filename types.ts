export enum BookingStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  PACKED = 'Packed/Ready',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export enum PaymentMethod {
  ONLINE = 'Online',
  ONSITE = 'On-Site',
  MANUAL = 'Admin Added'
}

export interface PricingConfig {
  oneHour: number;
  twoHours: number;
  threePlusHours: number;
}

export interface CMSConfig {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  bannerImage: string;
  strategyImage: string;
  studioIntelligence: string;
  features: string[];
  pricing: PricingConfig;
  // Branding & Footer
  studioLogo: string;
  footerBrandName: string;
  directorName: string;
  contactNumber: string;
  footerTagline: string;
}

export interface StudioPackage {
  id: string;
  name: string;
  hours: number;
  price: number;
  description: string;
  thumbnail: string;
  badge: string;
}

export interface Booking {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string;
  startTime: number; 
  duration: number; 
  status: BookingStatus;
  createdAt: string;
  cost: number;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  password?: string;
  credits: number;
  isApproved: boolean;
}

export interface Transaction {
  id: string;
  teacherId: string;
  teacherName: string;
  packageId?: string;
  packageName?: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  slipImage?: string; 
  verified: boolean;
  type: 'Package' | 'Session' | 'Manual Top-up';
}