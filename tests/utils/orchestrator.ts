import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function clearDatabase() {
  const client = await pool.connect();

  try {
    await client.query('TRUNCATE TABLE users RESTART IDENTITY;');
  } finally {
    client.release();
  }
}

export async function closeTestDatabasePool() {
  await pool.end();
}
