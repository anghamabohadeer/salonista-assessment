import { Pool } from 'pg';
import { AppError } from '../../errors/AppError';
import { salonRepository } from './salon.repository';
import { SalonWithServices, Service } from './salon.types';

export const salonNotFound = (id: number): AppError =>
  AppError.notFound('SALON_NOT_FOUND', `Salon with id ${id} was not found`);

export function createSalonService(pool: Pool) {
  return {
    listSalons(search?: string): Promise<SalonWithServices[]> {
      return salonRepository.findAll(pool, search);
    },

    async getSalon(id: number): Promise<SalonWithServices> {
      const salon = await salonRepository.findById(pool, id);
      if (!salon) {
        throw salonNotFound(id);
      }
      return salon;
    },

    async listServices(salonId: number): Promise<Service[]> {
      // Distinguish "salon has no services" (200, []) from "no such salon" (404).
      const [exists, services] = await Promise.all([
        salonRepository.exists(pool, salonId),
        salonRepository.findServicesBySalonId(pool, salonId),
      ]);
      if (!exists) {
        throw salonNotFound(salonId);
      }
      return services;
    },
  };
}

export type SalonService = ReturnType<typeof createSalonService>;
