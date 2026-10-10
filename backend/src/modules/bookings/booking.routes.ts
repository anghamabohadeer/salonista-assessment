import { Router } from 'express';
import { parseOrThrow } from '../../utils/validation';
import {
  availabilityParamsSchema,
  availabilityQuerySchema,
  createBookingSchema,
  customerParamsSchema,
} from './booking.schemas';
import { BookingService } from './booking.service';

export function createBookingRouter(bookingService: BookingService): Router {
  const router = Router();

  // POST /bookings
  router.post('/bookings', async (req, res) => {
    const input = parseOrThrow(createBookingSchema, req.body ?? {}, 'Invalid booking request');
    const booking = await bookingService.createBooking(input);
    res.status(201).location(`/bookings/${booking.customerId}`).json({ data: booking });
  });

  // GET /bookings/:customerId
  router.get('/bookings/:customerId', async (req, res) => {
    const { customerId } = parseOrThrow(customerParamsSchema, req.params, 'Invalid customer id');
    res.json({ data: await bookingService.listCustomerBookings(customerId) });
  });

  // GET /salons/:salonId/services/:serviceId/availability?date=YYYY-MM-DD
  router.get('/salons/:salonId/services/:serviceId/availability', async (req, res) => {
    const { salonId, serviceId } = parseOrThrow(
      availabilityParamsSchema,
      req.params,
      'Invalid salon or service id',
    );
    const { date } = parseOrThrow(availabilityQuerySchema, req.query, 'Invalid query parameters');
    res.json({ data: await bookingService.getAvailability(salonId, serviceId, date) });
  });

  return router;
}
