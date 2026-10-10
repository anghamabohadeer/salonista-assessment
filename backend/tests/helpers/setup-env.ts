import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

process.env.NODE_ENV = 'test';

// Jest gives every test file its own copy of process.env, so values are
// assigned explicitly (process.loadEnvFile would only update the real one).
// Variables already present in the environment win, as in production.
if (existsSync('.env')) {
  const fileValues = parseEnv(readFileSync('.env', 'utf8'));
  for (const [key, value] of Object.entries(fileValues)) {
    process.env[key] ??= value;
  }
}
