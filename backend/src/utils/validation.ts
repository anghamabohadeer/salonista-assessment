import { z } from 'zod';
import { AppError } from '../errors/AppError';

/** Positive integer path parameter, e.g. `/salons/:id`. */
export const idParam = z.coerce
  .number({ error: 'must be a number' })
  .int('must be an integer')
  .positive('must be a positive integer');

/**
 * Parses `input` with `schema`, converting failures into a 400 AppError whose
 * `details` list every offending field.
 */
export function parseOrThrow<T extends z.ZodType>(
  schema: T,
  input: unknown,
  message = 'Request validation failed',
): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw AppError.validation(
      message,
      result.error.issues.map((issue) => ({
        field: issue.path.join('.') || '(root)',
        message: issue.message,
      })),
    );
  }
  return result.data;
}
