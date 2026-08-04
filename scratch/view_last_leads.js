import pg from 'pg';
const { Pool } = pg;

async function viewLastLeads() {
  const connectionString = 'postgresql://postgres:postgres@187.77.147.16:5432/buildflowdb';
  console.log('Connecting to PostgreSQL to check leads table...');

  const pool = new Pool({
    connectionString,
    ssl: false,
  });

  try {
    const res = await pool.query('SELECT id, customer_name, customer_phone, job_type, status, notes, created_at FROM leads ORDER BY id DESC LIMIT 10');
    console.log('--- Last 10 leads in database: ---');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error querying database:', err.message);
  } finally {
    await pool.end();
  }
}

viewLastLeads();
