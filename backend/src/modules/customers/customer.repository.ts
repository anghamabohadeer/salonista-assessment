import { Queryable } from '../../db/pool';

export const customerRepository = {
  async exists(db: Queryable, id: number): Promise<boolean> {
    const { rowCount } = await db.query('SELECT 1 FROM customers WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },
};
