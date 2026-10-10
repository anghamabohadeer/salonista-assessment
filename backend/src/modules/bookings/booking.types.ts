export const PAYMENT_METHODS = ['pay_at_salon'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';

export interface NewBooking {
  customerId: number;
  salonId: number;
  serviceId: number;
  /** 'YYYY-MM-DD' */
  date: string;
  /** 'HH:mm' */
  time: string;
  paymentMethod: PaymentMethod;
}

export interface Booking {
  id: number;
  customerId: number;
  date: string;
  time: string;
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  createdAt: string;
  salon: {
    id: number;
    name: string;
    location: string;
  };
  service: {
    id: number;
    name: string;
    price: number;
    durationMinutes: number;
  };
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Availability {
  salonId: number;
  serviceId: number;
  date: string;
  slots: TimeSlot[];
}
