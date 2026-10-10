import { Queryable } from '../../db/pool';
import { Salon, SalonWithServices, Service } from './salon.types';

interface SalonRow {
  id: number;
  name: string;
  location: string;
  rating: number;
  opening_time: string;
  closing_time: string;
}

interface SalonWithServicesRow extends SalonRow {
  services: Service[];
}

interface ServiceRow {
  id: number;
  salon_id: number;
  name: string;
  price: number;
  duration_minutes: number;
}

const SALON_COLUMNS = `
  s.id, s.name, s.location,
  s.rating::float8 AS rating,
  to_char(s.opening_time, 'HH24:MI') AS opening_time,
  to_char(s.closing_time, 'HH24:MI') AS closing_time`;

const SERVICE_COLUMNS = `
  sv.id, sv.salon_id, sv.name,
  sv.price::float8 AS price,
  sv.duration_minutes`;

// Services are aggregated into each salon row so the discovery screen needs a
// single request (no N+1 calls from the client).
const SALON_WITH_SERVICES_SELECT = `
  SELECT ${SALON_COLUMNS},
         COALESCE(
           json_agg(
             json_build_object(
               'id', sv.id,
               'salonId', sv.salon_id,
               'name', sv.name,
               'price', sv.price::float8,
               'durationMinutes', sv.duration_minutes
             ) ORDER BY sv.price, sv.name
           ) FILTER (WHERE sv.id IS NOT NULL),
           '[]'::json
         ) AS services
  FROM salons s
  LEFT JOIN services sv ON sv.salon_id = s.id`;

const toSalon = (row: SalonRow): Salon => ({
  id: row.id,
  name: row.name,
  location: row.location,
  rating: row.rating,
  openingTime: row.opening_time,
  closingTime: row.closing_time,
});

const toSalonWithServices = (row: SalonWithServicesRow): SalonWithServices => ({
  ...toSalon(row),
  services: row.services,
});

const toService = (row: ServiceRow): Service => ({
  id: row.id,
  salonId: row.salon_id,
  name: row.name,
  price: row.price,
  durationMinutes: row.duration_minutes,
});

/** Escapes LIKE wildcards so user input is matched literally. */
const escapeLike = (value: string): string => value.replace(/[\\%_]/g, (char) => `\\${char}`);

export const salonRepository = {
  /** All salons, optionally filtered by name, location or service name. */
  async findAll(db: Queryable, search?: string): Promise<SalonWithServices[]> {
    const pattern = search ? `%${escapeLike(search)}%` : null;
    const { rows } = await db.query<SalonWithServicesRow>(
      `${SALON_WITH_SERVICES_SELECT}
       WHERE $1::text IS NULL
          OR s.name ILIKE $1
          OR s.location ILIKE $1
          OR EXISTS (SELECT 1 FROM services x WHERE x.salon_id = s.id AND x.name ILIKE $1)
       GROUP BY s.id
       ORDER BY s.rating DESC, s.name ASC`,
      [pattern],
    );
    return rows.map(toSalonWithServices);
  },

  async findById(db: Queryable, id: number): Promise<SalonWithServices | null> {
    const { rows } = await db.query<SalonWithServicesRow>(
      `${SALON_WITH_SERVICES_SELECT}
       WHERE s.id = $1
       GROUP BY s.id`,
      [id],
    );
    return rows[0] ? toSalonWithServices(rows[0]) : null;
  },

  async exists(db: Queryable, id: number): Promise<boolean> {
    const { rowCount } = await db.query('SELECT 1 FROM salons WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },

  async findServicesBySalonId(db: Queryable, salonId: number): Promise<Service[]> {
    const { rows } = await db.query<ServiceRow>(
      `SELECT ${SERVICE_COLUMNS}
       FROM services sv
       WHERE sv.salon_id = $1
       ORDER BY sv.price ASC, sv.name ASC`,
      [salonId],
    );
    return rows.map(toService);
  },

  /**
   * Fetches a service of a given salon. With `lock`, takes a row-level lock
   * (SELECT ... FOR UPDATE) held until the surrounding transaction ends, which
   * serialises concurrent bookings for the same service.
   */
  async findServiceOfSalon(
    db: Queryable,
    salonId: number,
    serviceId: number,
    options: { lock?: boolean } = {},
  ): Promise<Service | null> {
    const { rows } = await db.query<ServiceRow>(
      `SELECT ${SERVICE_COLUMNS}
       FROM services sv
       WHERE sv.id = $1 AND sv.salon_id = $2
       ${options.lock ? 'FOR UPDATE' : ''}`,
      [serviceId, salonId],
    );
    return rows[0] ? toService(rows[0]) : null;
  },
};
