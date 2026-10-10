import { z } from 'zod';
import { isValidDate, isValidTime } from '../../utils/dateTime';
import { idParam } from '../../utils/validation';
import { PAYMENT_METHODS } from './booking.types';

const entityId = (name: string) =>
  z
    .number({ error: `${name} is required and must be a number` })
    .int(`${name} must be an integer`)
    .positive(`${name} must be a positive integer`);

export const bookingDate = z
  .string({ error: 'date is required (YYYY-MM-DD)' })
  .refine(isValidDate, 'date must be a valid calendar date in YYYY-MM-DD format');

export const bookingTime = z
  .string({ error: 'time is required (HH:mm)' })
  .refine(isValidTime, 'time must be a valid 24-hour time in HH:mm format');

export const createBookingSchema = z.strictObject({
  customerId: entityId('customerId'),
  salonId: entityId('salonId'),
  serviceId: entityId('serviceId'),
  date: bookingDate,
  time: bookingTime,
  paymentMethod: z.enum(PAYMENT_METHODS, {
    error: `paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}`,
  }),
});

export const customerParamsSchema = z.object({ customerId: idParam });

export const availabilityParamsSchema = z.object({
  salonId: idParam,
  serviceId: idParam,
});

export const availabilityQuerySchema = z.object({ date: bookingDate });
