/* eslint-disable no-console */
type Level = 'info' | 'warn' | 'error';

const silent = process.env.NODE_ENV === 'test';

function write(level: Level, message: string, meta?: unknown): void {
  if (silent) {
    return;
  }
  const line = `${new Date().toISOString()} ${level.toUpperCase()} ${message}`;
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (meta === undefined) {
    sink(line);
  } else {
    sink(line, meta);
  }
}

/** Minimal structured-ish logger; swap for pino/winston in production. */
export const logger = {
  info: (message: string, meta?: unknown) => write('info', message, meta),
  warn: (message: string, meta?: unknown) => write('warn', message, meta),
  error: (message: string, meta?: unknown) => write('error', message, meta),
};
