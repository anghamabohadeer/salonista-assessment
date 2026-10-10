/**
 * Creates the schema and loads sample data from ../database/*.sql.
 *
 *   npm run db:setup            → uses DATABASE_URL
 *   npm run db:setup -- --test  → uses TEST_DATABASE_URL
 *
 * WARNING: schema.sql drops and recreates all tables.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

const SQL_DIR = path.resolve(__dirname, '..', '..', 'database');
const FILES = ['schema.sql', 'seed.sql'];

async function main(): Promise<void> {
  if (existsSync('.env')) {
    process.loadEnvFile('.env');
  }
  const useTestDb = process.argv.includes('--test');
  const variable = useTestDb ? 'TEST_DATABASE_URL' : 'DATABASE_URL';
  const connectionString = process.env[variable];
  if (!connectionString) {
    throw new Error(`${variable} is not set (see backend/.env.example)`);
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    for (const file of FILES) {
      await client.query(readFileSync(path.join(SQL_DIR, file), 'utf8'));
      console.log(`✔ Applied ${file}`);
    }
    console.log(`Database ready (${variable}).`);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error('Database setup failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
