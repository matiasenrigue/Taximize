// src/scripts/create-db.ts
import 'dotenv/config';
import { Client } from 'pg';

const {
  PG_ADMIN_URL,
  DATABASE_URL,
  DATABASE_NAME,
  DATABASE_USERNAME,
  DATABASE_PASSWORD,
} = process.env;

if (!PG_ADMIN_URL || !DATABASE_URL || !DATABASE_NAME || !DATABASE_USERNAME || !DATABASE_PASSWORD) {
  console.error(
    '❌ Missing one of PG_ADMIN_URL, DATABASE_URL, DATABASE_NAME,' +
    ' DATABASE_USERNAME or DATABASE_PASSWORD in .env'
  );
  process.exit(1);
}

async function createRoleAndDb(adminClient: Client) {
  // 1) create the role if it doesn't exist
  await adminClient.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DATABASE_USERNAME}'
      ) THEN
        CREATE ROLE "${DATABASE_USERNAME}" LOGIN PASSWORD '${DATABASE_PASSWORD}';
      END IF;
    END
    $$;
  `);

  // 2) create the database if it doesn't exist
  const { rowCount } = await adminClient.query(
    `SELECT 1 FROM pg_database WHERE datname = '${DATABASE_NAME}'`
  );

  if (rowCount === 0) {
    await adminClient.query(
      `CREATE DATABASE "${DATABASE_NAME}" OWNER "${DATABASE_USERNAME}";`
    );
    console.log(`✅ Database "${DATABASE_NAME}" created.`);
  } else {
    console.log(`ℹ️  Database "${DATABASE_NAME}" already exists.`);
  }
}


async function createUserTable(appClient: Client) {
  // Connect to your new DB as the app user and create users table
  await appClient.connect();
  await appClient.query(`
    CREATE TABLE IF NOT EXISTS users (
      email VARCHAR(255) PRIMARY KEY,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL
    );
  `);
  console.log('✅ Table "users" is ready.');
  await appClient.end();
}


async function main() {
  // Admin client for role & DB creation
  const adminClient = new Client({ connectionString: PG_ADMIN_URL });
  await adminClient.connect();

  try {
    await createRoleAndDb(adminClient);
  } finally {
    await adminClient.end();
  }

  // Now use the app user to create the users table
  const appClient = new Client({ connectionString: DATABASE_URL });
  await createUserTable(appClient);
}

main().catch(err => {
  console.error('✖️  Error setting up database:', err);
  process.exit(1);
});
