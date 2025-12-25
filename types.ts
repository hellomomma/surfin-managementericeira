
export enum UserRole {
  ADMIN = 'ADMIN',
  PARTNER = 'PARTNER'
}

export enum ClassType {
  GROUP = 'GROUP',
  PRIVATE = 'PRIVATE',
  PACK3 = 'PACK3',
  PACK5 = 'PACK5',
  MIXED = 'MIXED'
}

export enum ReservationStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum SurfLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

export enum InternalSource {
  WHATSAPP = 'WHATSAPP',
  INSTAGRAM = 'INSTAGRAM',
  WEBSITE = 'WEBSITE',
  SELINA = 'SELINA',
  SANDHI_HOUSE = 'SANDHI_HOUSE',
  ONDINA = 'ONDINA',
  PACO_D_ILHAS = 'PACO_D_ILHAS',
  RETREATS = 'RETREATS',
  SWELLNEST = 'SWELLNEST',
  OTHER = 'OTHER'
}

export enum PaymentMethod {
  MARCELO = 'MARCELO',
  VASCO = 'VASCO',
  WEBSITE = 'WEBSITE',
  BANK_TRANSFER = 'BANK_TRANSFER',
  PARTNER_COLLECTED = 'PARTNER_COLLECTED',
  PAID_TO_PARTNERSHIP = 'PAID_TO_PARTNERSHIP'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  password?: string;
  assignedOrigin?: InternalSource;
}

export interface SurfClass {
  id: string;
  date: string;
  time: string;
  type: ClassType;
  maxSpots: number;
  tideNote?: string;
  isArchived?: boolean; // Novo campo para Soft Delete
}

export interface Reservation {
  id: string;
  externalId?: string; 
  classId: string;
  guestName: string;
  weight: number;
  height: number;
  level: SurfLevel;
  sourceId: string; 
  internalSource?: InternalSource; 
  bookingType: ClassType; 
  paymentMethod: PaymentMethod;
  status: ReservationStatus;
  price: number;
  needsPickup: boolean;
  notes?: string;
}

export interface Expense {
  id: string;
  value: number;
  date: string;
  category: string;
  description: string;
}

export interface Revenue {
  id: string;
  value: number;
  date: string;
  category: string;
  description?: string;
  reservationId?: string;
}

export type Language = 'en' | 'pt';
