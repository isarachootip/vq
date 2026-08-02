import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_ZONES } from '../src/mockData';
import { generate200Technicians } from '../src/generateTechs';

const { Pool, Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const targetDbName = process.env.POSTGRES_DB || 'vservice_db';
const dbConfig = dbConnectionString
  ? { connectionString: dbConnectionString, ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false } }
  : {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number(process.env.POSTGRES_PORT || 5432),
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: targetDbName,
    };

async function ensureDatabaseExists() {
  if (dbConnectionString) return; // If full URL is provided, assume database is specified in URL

  const adminClient = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT || 5432),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    const checkRes = await adminClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [targetDbName]);
    if (checkRes.rowCount === 0) {
      console.log(`🔨 Database "${targetDbName}" does not exist. Creating it now...`);
      await adminClient.query(`CREATE DATABASE "${targetDbName}"`);
      console.log(`✅ Database "${targetDbName}" created successfully.`);
    }
  } catch (err: any) {
    console.warn(`⚠️ Warning during database check/creation: ${err.message}`);
  } finally {
    await adminClient.end().catch(() => {});
  }
}

async function seed() {
  console.log('🌱 Starting Database Seeding Process...');
  console.log(`📡 Connection target: ${dbConnectionString ? 'Connection String (DATABASE_URL/POSTGRES_URL)' : `Host: ${dbConfig.host}:${dbConfig.port}, DB: ${dbConfig.database}`}`);

  await ensureDatabaseExists();

  const pool = new Pool(dbConfig);

  try {
    // 1. Verify Connection
    const res = await pool.query('SELECT NOW()');
    console.log(`✅ Connected successfully to PostgreSQL server at ${res.rows[0].now}`);

    // 2. Ensure tables exist
    console.log('📦 Initializing database schema...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS zones (
        id VARCHAR(255) PRIMARY KEY,
        code VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        coverage_zipcodes JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS technicians (
        id VARCHAR(255) PRIMARY KEY,
        code VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(100),
        avatar TEXT,
        tier VARCHAR(50),
        rating NUMERIC(3,2),
        status VARCHAR(50),
        primary_zone TEXT,
        secondary_zones JSONB DEFAULT '[]'::jsonb,
        skills JSONB DEFAULT '[]'::jsonb,
        extra_data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Database schema verified.');

    // 3. Seed Zones
    console.log(`📍 Seeding ${INITIAL_ZONES.length} Zones...`);
    let zoneCount = 0;
    for (const zone of INITIAL_ZONES) {
      await pool.query(
        `INSERT INTO zones (id, code, name, description, coverage_zipcodes, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (id) DO UPDATE 
         SET code = EXCLUDED.code, name = EXCLUDED.name, description = EXCLUDED.description, coverage_zipcodes = EXCLUDED.coverage_zipcodes, updated_at = NOW()`,
        [
          zone.id,
          zone.code,
          zone.name,
          zone.description || '',
          JSON.stringify(zone.coverageZipcodes || [])
        ]
      );
      zoneCount++;
    }
    console.log(`✅ Successfully seeded ${zoneCount} zones.`);

    // 4. Seed Technicians
    const technicians = generate200Technicians();
    console.log(`👷 Seeding ${technicians.length} Technicians...`);
    let techCount = 0;
    for (const tech of technicians) {
      const { id, code, name, phone, avatar, tier, rating, status, primaryZone, secondaryZones, skills, ...extraData } = tech;
      await pool.query(
        `INSERT INTO technicians (id, code, name, phone, avatar, tier, rating, status, primary_zone, secondary_zones, skills, extra_data, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
         ON CONFLICT (id) DO UPDATE 
         SET code = EXCLUDED.code, name = EXCLUDED.name, phone = EXCLUDED.phone, avatar = EXCLUDED.avatar,
             tier = EXCLUDED.tier, rating = EXCLUDED.rating, status = EXCLUDED.status, primary_zone = EXCLUDED.primary_zone,
             secondary_zones = EXCLUDED.secondary_zones, skills = EXCLUDED.skills, extra_data = EXCLUDED.extra_data, updated_at = NOW()`,
        [
          id,
          code || 'T-999',
          name || 'Unassigned Tech',
          phone || '',
          avatar || '',
          tier || 'Silver',
          rating || 4.5,
          status || 'Available',
          primaryZone || '',
          JSON.stringify(secondaryZones || []),
          JSON.stringify(skills || []),
          JSON.stringify(extraData || {})
        ]
      );
      techCount++;
    }
    console.log(`✅ Successfully seeded ${techCount} technicians.`);

    // 5. Save local JSON backup files
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(path.join(dataDir, 'zones.json'), JSON.stringify(INITIAL_ZONES, null, 2));
    fs.writeFileSync(path.join(dataDir, 'technicians.json'), JSON.stringify(technicians, null, 2));
    console.log('📁 Local backup JSON files generated in ./data/ directory.');

    console.log('\n🎉 ALL DONE! Seed process completed successfully.');
  } catch (err: any) {
    console.error('❌ Database seeding failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
