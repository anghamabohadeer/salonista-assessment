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
  /** 'HH:mm' */
  openingTime: string;
  /** 'HH:mm' */
  closingTime: string;
}

export interface SalonWithServices extends Salon {
  services: Service[];
}
