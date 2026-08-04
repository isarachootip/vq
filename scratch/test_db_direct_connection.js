const { Pool } = require('pg');

async function testDbConnection() {
  const connectionString = 'postgresql://postgres:postgres@187.77.147.16:5432/buildflowdb';
  console.log('Testing direct connection to PostgreSQL on 187.77.147.16:5432/buildflowdb...');

  const pool = new Pool({
    connectionString,
    ssl: false,
    connectionTimeoutMillis: 5000
  });

  try {
    const res = await pool.query('SELECT NOW(), current_database()');
    console.log('✅ PostgreSQL Connection SUCCESSFUL!');
    console.log('Server time:', res.rows[0].now);
    console.log('Connected DB:', res.rows[0].current_database);

    // Check leads table
    const tableRes = await pool.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
    `);
    console.log('Tables in buildflowdb:', tableRes.rows.map(r => r.table_name));

    // Try inserting a lead directly into buildflowdb!
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),
        customer_address TEXT,
        customer_latitude NUMERIC,
        customer_longitude NUMERIC,
        map_url TEXT,
        job_type VARCHAR(255),
        status VARCHAR(50) DEFAULT 'New',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const insertRes = await pool.query(`
      INSERT INTO leads (customer_name, customer_phone, customer_address, customer_latitude, customer_longitude, map_url, job_type, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `, [
      'คุณอนุรักษ์ เลิศวิริยะ (จาก VFixQ Direct DB)',
      '0899674444',
      'Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา)',
      13.7395,
      100.5818,
      'https://www.google.com/maps?q=13.7395,100.5818',
      'งานติดตั้งครัว Built-in Master (ชุดใหญ่)',
      'New',
      '[Ticket: BK-2026-0764-745] [Tech: ทีมช่างวิชัย]'
    ]);

    console.log('🎉 Lead inserted into buildflowdb leads table successfully! Inserted ID:', insertRes.rows[0].id);

    // Query leads count
    const countRes = await pool.query('SELECT COUNT(*) FROM leads;');
    console.log('Total leads in buildflowdb leads table:', countRes.rows[0].count);

  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await pool.end();
  }
}

testDbConnection();
