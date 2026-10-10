/** Shapes returned by the Salon Booking API (see backend/README API section). */

export interface Service {
  id: number;
  salonId: number;
  name: string;
  price: number;
  durationMinutes: number;
}

export interface Salon {
  id: number;
  name: string;
  location: string;
  rating: number;
  openingTime: string;
  closingTime: string;
  services: Service[];
}

export type PaymentMethod = 'pay_at_salon';
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: number;
  customerId: number;
  date: string;
  time: string;
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  createdAt: string;
  salon: { id: number; name: string; location: string };
  service: { id: number; name: string; price: number; durationMinutes: number };
}

export interface CreateBookingRequest {
  customerId: number;
  salonId: number;
  serviceId: number;
  date: string;
  time: string;
  paymentMethod: PaymentMethod;
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

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: ApiFieldError[];
  };
}
