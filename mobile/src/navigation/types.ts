import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Booking, Salon, Service } from '../api/types';

export type SalonSummary = Pick<Salon, 'id' | 'name' | 'location'>;

export type RootStackParamList = {
  SalonDiscovery: undefined;
  Booking: { salon: SalonSummary; service: Service };
  BookingConfirmation: { booking: Booking };
  MyBookings: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
