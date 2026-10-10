import { Router } from 'express';
import { z } from 'zod';
import { idParam, parseOrThrow } from '../../utils/validation';
import { SalonService } from './salon.service';

const listQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, 'must be at most 100 characters')
    .optional()
    .transform((value) => (value ? value : undefined)),
});

const salonParamsSchema = z.object({ id: idParam });

export function createSalonRouter(salonService: SalonService): Router {
  const router = Router();

  // GET /salons?search=term
  router.get('/salons', async (req, res) => {
    const { search } = parseOrThrow(listQuerySchema, req.query, 'Invalid query parameters');
    res.json({ data: await salonService.listSalons(search) });
  });

  // GET /salons/:id
  router.get('/salons/:id', async (req, res) => {
    const { id } = parseOrThrow(salonParamsSchema, req.params, 'Invalid salon id');
    res.json({ data: await salonService.getSalon(id) });
  });

  // GET /salons/:id/services
  router.get('/salons/:id/services', async (req, res) => {
    const { id } = parseOrThrow(salonParamsSchema, req.params, 'Invalid salon id');
    res.json({ data: await salonService.listServices(id) });
  });

  return router;
}
