import { Pool } from 'pg';
import { BookingRules } from '../../config/env';
import { isUniqueViolation } from '../../db/errors';
import { withTransaction } from '../../db/transaction';
import { AppError } from '../../errors/AppError';
import { customerRepository } from '../customers/customer.repository';
import { salonRepository } from '../salons/salon.repository';
import { salonNotFound } from '../salons/salon.service';
import { ACTIVE_SLOT_CONSTRAINT, bookingRepository } from './booking.repository';
import { Availability, Booking, NewBooking } from './booking.types';
import { generateSlotTimes, isPastSlot, validateBookingDate, validateBookingSlot } from './scheduling';

interface BookingServiceDeps {
  pool: Pool;
  rules: BookingRules;
  /** Injectable clock for deterministic tests. */
  now?: () => Date;
}

const customerNotFound = (id: number) =>
  AppError.notFound('CUSTOMER_NOT_FOUND', `Customer with id ${id} was not found`);

const serviceNotFound = (serviceId: number, salonId: number) =>
  AppError.notFound(
    'SERVICE_NOT_FOUND',
    `Service with id ${serviceId} was not found for salon ${salonId}`,
  );

const slotUnavailable = () =>
  AppError.conflict(
    'SLOT_UNAVAILABLE',
    'This time slot has just been booked. Please choose another time.',
  );

export function createBookingService({ pool, rules, now = () => new Date() }: BookingServiceDeps) {
  return {
    /**
     * Creates a booking while preventing double booking:
     *
     * 1. Everything runs in one transaction.
     * 2. The service row is locked with SELECT ... FOR UPDATE, so concurrent
     *    requests for the same service queue up instead of interleaving.
     * 3. Inside the lock the slot is checked for availability (clean 409).
     * 4. A partial unique index on (service_id, booking_date, booking_time)
     *    is the final guarantee; a unique violation is also reported as 409.
     */
    async createBooking(input: NewBooking): Promise<Booking> {
      try {
        return await withTransaction(pool, async (client) => {
          if (!(await customerRepository.exists(client, input.customerId))) {
            throw customerNotFound(input.customerId);
          }

          const salon = await salonRepository.findById(client, input.salonId);
          if (!salon) {
            throw salonNotFound(input.salonId);
          }

          const service = await salonRepository.findServiceOfSalon(
            client,
            input.salonId,
            input.serviceId,
            { lock: true },
          );
          if (!service) {
            throw serviceNotFound(input.serviceId, input.salonId);
          }

          const timeProblem = validateBookingSlot(
            {
              date: input.date,
              time: input.time,
              hours: salon,
              durationMinutes: service.durationMinutes,
            },
            now(),
            rules,
          );
          if (timeProblem) {
            throw AppError.unprocessable('INVALID_BOOKING_TIME', timeProblem);
          }

          if (await bookingRepository.isSlotTaken(client, service.id, input.date, input.time)) {
            throw slotUnavailable();
          }

          const bookingId = await bookingRepository.insert(client, input);
          const booking = await bookingRepository.findById(client, bookingId);
          return booking!;
        });
      } catch (error) {
        if (isUniqueViolation(error, ACTIVE_SLOT_CONSTRAINT)) {
          throw slotUnavailable();
        }
        throw error;
      }
    },

    async listCustomerBookings(customerId: number): Promise<Booking[]> {
      if (!(await customerRepository.exists(pool, customerId))) {
        throw customerNotFound(customerId);
      }
      return bookingRepository.findByCustomerId(pool, customerId);
    },

    /** Start times for a service on a date, flagged as available or not. */
    async getAvailability(salonId: number, serviceId: number, date: string): Promise<Availability> {
      const salon = await salonRepository.findById(pool, salonId);
      if (!salon) {
        throw salonNotFound(salonId);
      }
      const service = await salonRepository.findServiceOfSalon(pool, salonId, serviceId);
      if (!service) {
        throw serviceNotFound(serviceId, salonId);
      }

      const currentTime = now();
      const dateProblem = validateBookingDate(date, currentTime, rules);
      if (dateProblem) {
        throw AppError.unprocessable('INVALID_BOOKING_TIME', dateProblem);
      }

      const booked = await bookingRepository.findBookedTimes(pool, serviceId, date);
      const slots = generateSlotTimes(salon, service.durationMinutes, rules.slotIntervalMinutes).map(
        (time) => ({
          time,
          available: !booked.has(time) && !isPastSlot(date, time, currentTime),
        }),
      );

      return { salonId, serviceId, date, slots };
    },
  };
}

export type BookingService = ReturnType<typeof createBookingService>;
