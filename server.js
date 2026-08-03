import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// PostgreSQL Connection Pool Setup
const dbConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
let dbPool = null;
let isDbConnected = false;

if (dbConnectionString || process.env.POSTGRES_HOST) {
  const dbConfig = dbConnectionString
    ? { connectionString: dbConnectionString, ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false } }
    : {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: Number(process.env.POSTGRES_PORT || 5432),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        database: process.env.POSTGRES_DB || 'buildflowdb',
      };

  dbPool = new Pool(dbConfig);

  dbPool
    .query('SELECT NOW()')
    .then(async () => {
      isDbConnected = true;
      console.log('✅ Connected to PostgreSQL Database successfully');
      await initDbTables();
    })
    .catch((err) => {
      console.warn('⚠️ Could not connect to PostgreSQL Database:', err.message);
      isDbConnected = false;
    });
} else {
  console.log('ℹ️ No DATABASE_URL provided. Running server with local memory/JSON storage mode.');
}

async function initDbTables() {
  if (!dbPool) return;
  try {
    // Create users table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(100),
        password VARCHAR(255),
        line_id VARCHAR(100),
        role VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'Active',
        branch_id VARCHAR(255),
        branch_name VARCHAR(255),
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create zones table
    await dbPool.query(`
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

    // Create technicians table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS technicians (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
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
      ALTER TABLE technicians ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
    `);

    // Create standard_costs table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS standard_costs (
        id VARCHAR(255) PRIMARY KEY,
        sku VARCHAR(100) NOT NULL,
        group_name VARCHAR(255),
        product_category VARCHAR(255),
        service_type VARCHAR(255),
        product_detail TEXT,
        description TEXT NOT NULL,
        unit VARCHAR(50) DEFAULT 'EACH',
        gp_percent NUMERIC(5,2) DEFAULT 0,
        cost_standard NUMERIC(12,2) DEFAULT 0,
        cost_premium NUMERIC(12,2) DEFAULT 0,
        price_standard NUMERIC(12,2) DEFAULT 0,
        price_premium NUMERIC(12,2) DEFAULT 0,
        cost_center VARCHAR(100),
        retention VARCHAR(100),
        remark TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ PostgreSQL database tables (users, zones, technicians, standard_costs) verified/created');
    } catch (err) {
      console.error('❌ Error initializing database tables:', err.message);
    }
  }

  // Storage Paths
  const DATA_DIR = path.join(__dirname, 'data');
  const DATA_FILE = path.join(DATA_DIR, 'line_conversations.json');
  const ZONES_FILE = path.join(DATA_DIR, 'zones.json');
  const TECHS_FILE = path.join(DATA_DIR, 'technicians.json');
  const USERS_FILE = path.join(DATA_DIR, 'users.json');
  const STANDARD_COSTS_FILE = path.join(DATA_DIR, 'standard_costs.json');
  const INTEGRATION_LOGS_FILE = path.join(DATA_DIR, 'integration_logs.json');
  const CONFIG_FILE = path.join(DATA_DIR, 'line_config.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadJson(filepath, fallback) {
  try {
    if (fs.existsSync(filepath)) {
      const data = fs.readFileSync(filepath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error loading ${filepath}:`, err);
  }
  return fallback;
}

function saveJson(filepath, data) {
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error saving ${filepath}:`, err);
  }
}

let conversationsStore = loadJson(DATA_FILE, []);
let lineConfig = loadJson(CONFIG_FILE, {
  channelId: '',
  channelSecret: '',
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || ''
});

// Helper to fetch user profile from LINE API
async function fetchLineUserProfile(userId, token) {
  const accessToken = token || lineConfig.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken) return null;
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`[LINE PROFILE API SUCCESS]: User ${userId} -> ${data.displayName}`);
      return data;
    } else {
      const errText = await res.text();
      console.error(`[LINE PROFILE API ERROR ${res.status}]:`, errText);
    }
  } catch (err) {
    console.error('[LINE PROFILE API EXCEPTION]:', err);
  }
  return null;
}

// Background profile refetcher for conversations with placeholder names
async function tryRefetchProfiles() {
  const accessToken = lineConfig.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken) return;

  let updated = false;
  for (const conv of conversationsStore) {
    if (conv.lineUserId && (conv.customerName.includes('คุณ LINE') || !conv.customerName)) {
      const profile = await fetchLineUserProfile(conv.lineUserId, accessToken);
      if (profile && profile.displayName) {
        conv.customerName = profile.displayName;
        if (profile.pictureUrl) conv.avatarUrl = profile.pictureUrl;
        updated = true;
      }
    }
  }
  if (updated) {
    saveJson(DATA_FILE, conversationsStore);
  }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Config Endpoint
app.post('/api/line/config', (req, res) => {
  const { channelId, channelSecret, channelAccessToken } = req.body;
  if (channelId) lineConfig.channelId = channelId;
  if (channelSecret) lineConfig.channelSecret = channelSecret;
  if (channelAccessToken) lineConfig.channelAccessToken = channelAccessToken;
  
  saveJson(CONFIG_FILE, lineConfig);
  tryRefetchProfiles();
  return res.json({ status: 'success', config: lineConfig });
});

app.get('/api/line/config', (req, res) => {
  return res.json({ status: 'success', config: lineConfig });
});

// 1. LINE Webhook Verification & Real-time Event Receiver
app.all('/api/line/webhook', async (req, res) => {
  console.log(`[LINE WEBHOOK] ${req.method} request received at ${new Date().toISOString()}`);

  if (req.method === 'GET') {
    return res.status(200).send('LINE Webhook Endpoint Active OK');
  }

  const events = req.body?.events || [];
  console.log(`[LINE WEBHOOK EVENTS]: Count = ${events.length}`);

  for (const event of events) {
    console.log('[LINE WEBHOOK EVENT DETAIL]:', JSON.stringify(event));

    const userId = event.source?.userId;
    if (!userId) continue;

    const timestamp = new Date(event.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let profile = await fetchLineUserProfile(userId);
    const customerName = profile?.displayName || `คุณ LINE (${userId.substring(0, 6)})`;
    const avatarUrl = profile?.pictureUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`;
    const lineId = `@${userId.substring(0, 8)}`;

    let conv = conversationsStore.find(c => c.lineUserId === userId || c.id === `conv-${userId}`);

    let textContent = '';
    if (event.type === 'message') {
      if (event.message?.type === 'text') {
        textContent = event.message.text;
      } else if (event.message?.type === 'image') {
        textContent = '📷 [ส่งรูปภาพ]';
      } else if (event.message?.type === 'sticker') {
        textContent = '😊 [ส่งสติ๊กเกอร์]';
      } else {
        textContent = `[ส่งข้อความประเภท ${event.message?.type || 'media'}]`;
      }
    } else if (event.type === 'follow') {
      textContent = '🟢 เพิ่มเป็นเพื่อนกับบัญชี LINE OA';
    } else {
      textContent = `[กิจกรรม ${event.type}]`;
    }

    const newMsg = {
      id: `msg-${event.message?.id || Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sender: 'customer',
      senderName: profile?.displayName || customerName,
      text: textContent,
      timestamp,
      isRead: false
    };

    if (conv) {
      if (profile?.displayName) {
        conv.customerName = profile.displayName;
      }
      if (avatarUrl) conv.avatarUrl = avatarUrl;
      conv.lastMessage = textContent;
      conv.lastMessageTime = timestamp;
      conv.unreadCount = (conv.unreadCount || 0) + 1;
      conv.messages.push(newMsg);
    } else {
      conv = {
        id: `conv-${userId}`,
        lineUserId: userId,
        customerName,
        lineId,
        avatarUrl,
        phone: '08X-XXX-XXXX',
        addressZone: 'Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา)',
        lastMessage: textContent,
        lastMessageTime: timestamp,
        unreadCount: 1,
        status: 'new',
        messages: [newMsg]
      };
      conversationsStore.unshift(conv);
    }

    saveJson(DATA_FILE, conversationsStore);
  }

  // Always return 200 OK fast for LINE Platform Webhook verification
  return res.status(200).json({ status: 'ok', eventsProcessed: events.length });
});

// 2. GET API for Web App to fetch active conversations
app.get('/api/line/conversations', (req, res) => {
  tryRefetchProfiles();
  res.json({
    status: 'success',
    count: conversationsStore.length,
    conversations: conversationsStore
  });
});

// 3. POST API to send reply back to customer via LINE Push Message API
app.post('/api/line/reply', async (req, res) => {
  const { conversationId, text, channelAccessToken } = req.body;
  const token = channelAccessToken || lineConfig.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

  const conv = conversationsStore.find(c => c.id === conversationId);
  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const newMsg = {
    id: `cs-msg-${Date.now()}`,
    sender: 'cs_agent',
    senderName: 'เจ้าหน้าที่ vService CS',
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isRead: true
  };

  conv.lastMessage = text;
  conv.lastMessageTime = 'เมื่อครู่';
  conv.unreadCount = 0;
  conv.messages.push(newMsg);
  saveJson(DATA_FILE, conversationsStore);

  // Send Push Message to LINE user if token & userId exist
  if (token && conv.lineUserId) {
    try {
      const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          to: conv.lineUserId,
          messages: [{ type: 'text', text }]
        })
      });
      console.log(`[LINE PUSH RESULT]: Status ${lineRes.status}`);
    } catch (err) {
      console.error('[LINE PUSH ERROR]:', err);
    }
  }

  return res.json({ status: 'success', conversation: conv });
});

// 4. Clear conversations API
app.post('/api/line/clear', (req, res) => {
  conversationsStore = [];
  saveJson(DATA_FILE, []);
  console.log('[LINE SERVER]: Conversations cleared by admin');
  res.json({ status: 'cleared' });
});

// Health check & DB Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    dbConnected: isDbConnected,
    conversationsCount: conversationsStore.length,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/db/status', async (req, res) => {
  if (!isDbConnected || !dbPool) {
    return res.json({ status: 'offline', mode: 'json_file_fallback' });
  }
  try {
    const result = await dbPool.query('SELECT NOW()');
    return res.json({ status: 'connected', dbTime: result.rows[0].now });
  } catch (err) {
    return res.status(500).json({ status: 'error', error: err.message });
  }
});

// ----------------------------------------------------
// ZONE API ENDPOINTS (PostgreSQL + Local File Fallback)
// ----------------------------------------------------
app.get('/api/zones', async (req, res) => {
  if (isDbConnected && dbPool) {
    try {
      const result = await dbPool.query('SELECT id, code, name, description, coverage_zipcodes as "coverageZipcodes" FROM zones ORDER BY code ASC');
      return res.json({ status: 'success', source: 'postgresql', zones: result.rows });
    } catch (err) {
      console.error('Error querying zones from PostgreSQL:', err);
    }
  }
  const fallbackZones = loadJson(ZONES_FILE, []);
  return res.json({ status: 'success', source: 'json_file', zones: fallbackZones });
});

app.post('/api/zones/bulk', async (req, res) => {
  const { zones } = req.body;
  if (!Array.isArray(zones)) {
    return res.status(400).json({ error: 'zones must be an array' });
  }

  let dbSavedCount = 0;
  if (isDbConnected && dbPool) {
    try {
      for (const zone of zones) {
        await dbPool.query(
          `INSERT INTO zones (id, code, name, description, coverage_zipcodes, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (id) DO UPDATE 
           SET code = EXCLUDED.code, name = EXCLUDED.name, description = EXCLUDED.description, coverage_zipcodes = EXCLUDED.coverage_zipcodes, updated_at = NOW()`,
          [
            zone.id || `zone-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            zone.code,
            zone.name,
            zone.description || '',
            JSON.stringify(zone.coverageZipcodes || [])
          ]
        );
        dbSavedCount++;
      }
    } catch (err) {
      console.error('Error saving zones to PostgreSQL:', err);
    }
  }

  // Backup to JSON file as fallback
  saveJson(ZONES_FILE, zones);

  return res.json({
    status: 'success',
    savedCount: zones.length,
    dbSavedCount,
    source: isDbConnected ? 'postgresql' : 'json_file'
  });
});

app.delete('/api/zones/:id', async (req, res) => {
  const { id } = req.params;
  if (isDbConnected && dbPool) {
    try {
      await dbPool.query('DELETE FROM zones WHERE id = $1', [id]);
    } catch (err) {
      console.error('Error deleting zone from PostgreSQL:', err);
    }
  }
  const currentZones = loadJson(ZONES_FILE, []);
  const filtered = currentZones.filter(z => z.id !== id);
  saveJson(ZONES_FILE, filtered);

  return res.json({ status: 'success', deletedId: id });
});

// ----------------------------------------------------
// TECHNICIAN API ENDPOINTS (PostgreSQL + Local File Fallback)
// ----------------------------------------------------
app.get('/api/technicians', async (req, res) => {
  if (isDbConnected && dbPool) {
    try {
      const result = await dbPool.query('SELECT id, code, name, phone, avatar, tier, rating, status, primary_zone as "primaryZone", secondary_zones as "secondaryZones", skills, extra_data FROM technicians ORDER BY code ASC');
      const techs = result.rows.map(row => ({
        id: row.id,
        code: row.code,
        name: row.name,
        phone: row.phone,
        avatar: row.avatar,
        tier: row.tier,
        rating: Number(row.rating || 4.5),
        status: row.status,
        primaryZone: row.primaryZone,
        secondaryZones: row.secondaryZones || [],
        skills: row.skills || [],
        ...(row.extra_data || {})
      }));
      return res.json({ status: 'success', source: 'postgresql', technicians: techs });
    } catch (err) {
      console.error('Error querying technicians from PostgreSQL:', err);
    }
  }
  const fallbackTechs = loadJson(TECHS_FILE, []);
  return res.json({ status: 'success', source: 'json_file', technicians: fallbackTechs });
});

app.post('/api/technicians/bulk', async (req, res) => {
  const { technicians } = req.body;
  if (!Array.isArray(technicians)) {
    return res.status(400).json({ error: 'technicians must be an array' });
  }

  let dbSavedCount = 0;
  if (isDbConnected && dbPool) {
    try {
      for (const tech of technicians) {
        const { id, code, name, phone, avatar, tier, rating, status, primaryZone, secondaryZones, skills, ...extraData } = tech;
        await dbPool.query(
          `INSERT INTO technicians (id, code, name, phone, avatar, tier, rating, status, primary_zone, secondary_zones, skills, extra_data, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
           ON CONFLICT (id) DO UPDATE 
           SET code = EXCLUDED.code, name = EXCLUDED.name, phone = EXCLUDED.phone, avatar = EXCLUDED.avatar,
               tier = EXCLUDED.tier, rating = EXCLUDED.rating, status = EXCLUDED.status, primary_zone = EXCLUDED.primary_zone,
               secondary_zones = EXCLUDED.secondary_zones, skills = EXCLUDED.skills, extra_data = EXCLUDED.extra_data, updated_at = NOW()`,
          [
            id || `tech-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
        dbSavedCount++;
      }
    } catch (err) {
      console.error('Error saving technicians to PostgreSQL:', err);
    }
  }

  // Backup to JSON file as fallback
  saveJson(TECHS_FILE, technicians);

  return res.json({
    status: 'success',
    savedCount: technicians.length,
    dbSavedCount,
    source: isDbConnected ? 'postgresql' : 'json_file'
  });
});

app.delete('/api/technicians/:id', async (req, res) => {
  const { id } = req.params;
  if (isDbConnected && dbPool) {
    try {
      await dbPool.query('DELETE FROM technicians WHERE id = $1', [id]);
    } catch (err) {
      console.error('Error deleting technician from PostgreSQL:', err);
    }
  }
  const currentTechs = loadJson(TECHS_FILE, []);
  const filtered = currentTechs.filter(t => t.id !== id);
  saveJson(TECHS_FILE, filtered);

  return res.json({ status: 'success', deletedId: id });
});

// ----------------------------------------------------
// USER API ENDPOINTS (PostgreSQL + Local File Fallback)
// ----------------------------------------------------
app.get('/api/users', async (req, res) => {
  if (isDbConnected && dbPool) {
    try {
      const result = await dbPool.query('SELECT id, username, name, email, phone, password, line_id as "lineId", role, status, branch_id as "branchId", branch_name as "branchName", avatar_url as "avatarUrl", created_at as "createdAt" FROM users ORDER BY created_at ASC');
      return res.json({ status: 'success', source: 'postgresql', users: result.rows });
    } catch (err) {
      console.error('Error querying users from PostgreSQL:', err);
    }
  }
  const fallbackUsers = loadJson(USERS_FILE, []);
  const uniqueUsers = [];
  const seenIds = new Set();
  for (const u of fallbackUsers) {
    if (u.id && !seenIds.has(u.id)) {
      seenIds.add(u.id);
      uniqueUsers.push(u);
    }
  }
  return res.json({ status: 'success', source: 'json_file', users: uniqueUsers });
});

app.post('/api/users', async (req, res) => {
  const u = req.body;
  if (!u || (!u.username && !u.id)) {
    return res.status(400).json({ error: 'user payload invalid' });
  }

  const userId = u.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const userObj = { ...u, id: userId };

  if (isDbConnected && dbPool) {
    try {
      const existing = await dbPool.query('SELECT id FROM users WHERE id = $1 OR username = $2', [userId, u.username]);
      if (existing.rows.length > 0) {
        const targetId = existing.rows[0].id;
        await dbPool.query(
          `UPDATE users 
           SET username = $1, name = $2, email = $3, phone = $4, password = $5, line_id = $6,
               role = $7, status = $8, branch_id = $9, branch_name = $10, avatar_url = $11, updated_at = NOW()
           WHERE id = $12`,
          [
            userObj.username,
            userObj.name,
            userObj.email || '',
            userObj.phone || '',
            userObj.password || 'Pass1234',
            userObj.lineId || '',
            userObj.role || 'technician',
            userObj.status || 'Active',
            userObj.branchId || null,
            userObj.branchName || null,
            userObj.avatarUrl || null,
            targetId
          ]
        );
      } else {
        await dbPool.query(
          `INSERT INTO users (id, username, name, email, phone, password, line_id, role, status, branch_id, branch_name, avatar_url, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
          [
            userId,
            userObj.username,
            userObj.name,
            userObj.email || '',
            userObj.phone || '',
            userObj.password || 'Pass1234',
            userObj.lineId || '',
            userObj.role || 'technician',
            userObj.status || 'Active',
            userObj.branchId || null,
            userObj.branchName || null,
            userObj.avatarUrl || null
          ]
        );
      }
    } catch (err) {
      console.error('Error saving single user to PostgreSQL:', err);
    }
  }

  const currentUsers = loadJson(USERS_FILE, []);
  const idx = currentUsers.findIndex(item => item.id === userId || item.username === userObj.username);
  if (idx >= 0) {
    currentUsers[idx] = userObj;
  } else {
    currentUsers.unshift(userObj);
  }
  saveJson(USERS_FILE, currentUsers);

  return res.json({ status: 'success', user: userObj });
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const u = req.body;
  const userObj = { ...u, id };

  if (isDbConnected && dbPool) {
    try {
      const existing = await dbPool.query('SELECT id FROM users WHERE id = $1 OR username = $2', [id, u.username]);
      if (existing.rows.length > 0) {
        const targetId = existing.rows[0].id;
        await dbPool.query(
          `UPDATE users 
           SET username = $1, name = $2, email = $3, phone = $4, password = $5, line_id = $6,
               role = $7, status = $8, branch_id = $9, branch_name = $10, avatar_url = $11, updated_at = NOW()
           WHERE id = $12`,
          [
            userObj.username,
            userObj.name,
            userObj.email || '',
            userObj.phone || '',
            userObj.password || 'Pass1234',
            userObj.lineId || '',
            userObj.role || 'technician',
            userObj.status || 'Active',
            userObj.branchId || null,
            userObj.branchName || null,
            userObj.avatarUrl || null,
            targetId
          ]
        );
      } else {
        await dbPool.query(
          `INSERT INTO users (id, username, name, email, phone, password, line_id, role, status, branch_id, branch_name, avatar_url, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
          [
            id,
            userObj.username,
            userObj.name,
            userObj.email || '',
            userObj.phone || '',
            userObj.password || 'Pass1234',
            userObj.lineId || '',
            userObj.role || 'technician',
            userObj.status || 'Active',
            userObj.branchId || null,
            userObj.branchName || null,
            userObj.avatarUrl || null
          ]
        );
      }
    } catch (err) {
      console.error('Error updating user in PostgreSQL:', err);
    }
  }

  const currentUsers = loadJson(USERS_FILE, []);
  const idx = currentUsers.findIndex(item => item.id === id || item.username === userObj.username);
  if (idx >= 0) {
    currentUsers[idx] = userObj;
  } else {
    currentUsers.unshift(userObj);
  }
  saveJson(USERS_FILE, currentUsers);

  return res.json({ status: 'success', user: userObj });
});

app.post('/api/users/bulk', async (req, res) => {
  const { users } = req.body;
  if (!Array.isArray(users)) {
    return res.status(400).json({ error: 'users must be an array' });
  }

  let dbSavedCount = 0;
  if (isDbConnected && dbPool) {
    try {
      for (const u of users) {
        await dbPool.query(
          `INSERT INTO users (id, username, name, email, phone, password, line_id, role, status, branch_id, branch_name, avatar_url, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
           ON CONFLICT (id) DO UPDATE 
           SET username = EXCLUDED.username, name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone,
               password = EXCLUDED.password, line_id = EXCLUDED.line_id, role = EXCLUDED.role, status = EXCLUDED.status,
               branch_id = EXCLUDED.branch_id, branch_name = EXCLUDED.branch_name, avatar_url = EXCLUDED.avatar_url, updated_at = NOW()`,
          [
            u.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            u.username,
            u.name,
            u.email || '',
            u.phone || '',
            u.password || 'Pass1234',
            u.lineId || '',
            u.role || 'technician',
            u.status || 'Active',
            u.branchId || null,
            u.branchName || null,
            u.avatarUrl || null
          ]
        );
        dbSavedCount++;
      }
    } catch (err) {
      console.error('Error saving users to PostgreSQL:', err);
    }
  }

  // Backup to JSON file as fallback
  saveJson(USERS_FILE, users);

  return res.json({
    status: 'success',
    savedCount: users.length,
    dbSavedCount,
    source: isDbConnected ? 'postgresql' : 'json_file'
  });
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  if (isDbConnected && dbPool) {
    try {
      await dbPool.query('DELETE FROM users WHERE id = $1', [id]);
    } catch (err) {
      console.error('Error deleting user from PostgreSQL:', err);
    }
  }
  const currentUsers = loadJson(USERS_FILE, []);
  const filtered = currentUsers.filter(u => u.id !== id);
  saveJson(USERS_FILE, filtered);

  return res.json({ status: 'success', deletedId: id });
});

// ----------------------------------------------------
// STANDARD COSTS MASTER API ENDPOINTS
// ----------------------------------------------------
app.get('/api/standard-costs', async (req, res) => {
  if (isDbConnected && dbPool) {
    try {
      const result = await dbPool.query(`
        SELECT id, sku, group_name as "group", product_category as "productCategory", service_type as "serviceType",
               product_detail as "productDetail", description, unit, gp_percent as "gpPercent",
               cost_standard as "costStandard", cost_premium as "costPremium", price_standard as "priceStandard",
               price_premium as "pricePremium", cost_center as "costCenter", retention, remark,
               created_at as "createdAt", updated_at as "updatedAt"
        FROM standard_costs ORDER BY created_at ASC
      `);
      const formatted = result.rows.map(row => ({
        ...row,
        gpPercent: Number(row.gpPercent || 0),
        costStandard: Number(row.costStandard || 0),
        costPremium: Number(row.costPremium || 0),
        priceStandard: Number(row.priceStandard || 0),
        pricePremium: Number(row.pricePremium || 0)
      }));
      return res.json({ status: 'success', source: 'postgresql', standardCosts: formatted });
    } catch (err) {
      console.error('Error querying standard costs from PostgreSQL:', err);
    }
  }
  const fallbackCosts = loadJson(STANDARD_COSTS_FILE, []);
  return res.json({ status: 'success', source: 'json_file', standardCosts: fallbackCosts });
});

app.post('/api/standard-costs/bulk', async (req, res) => {
  const { standardCosts } = req.body;
  if (!Array.isArray(standardCosts)) {
    return res.status(400).json({ error: 'standardCosts must be an array' });
  }

  let dbSavedCount = 0;
  if (isDbConnected && dbPool) {
    try {
      for (const item of standardCosts) {
        await dbPool.query(
          `INSERT INTO standard_costs (id, sku, group_name, product_category, service_type, product_detail, description, unit, gp_percent, cost_standard, cost_premium, price_standard, price_premium, cost_center, retention, remark, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
           ON CONFLICT (id) DO UPDATE 
           SET sku = EXCLUDED.sku, group_name = EXCLUDED.group_name, product_category = EXCLUDED.product_category,
               service_type = EXCLUDED.service_type, product_detail = EXCLUDED.product_detail, description = EXCLUDED.description,
               unit = EXCLUDED.unit, gp_percent = EXCLUDED.gp_percent, cost_standard = EXCLUDED.cost_standard,
               cost_premium = EXCLUDED.cost_premium, price_standard = EXCLUDED.price_standard, price_premium = EXCLUDED.price_premium,
               cost_center = EXCLUDED.cost_center, retention = EXCLUDED.retention, remark = EXCLUDED.remark, updated_at = NOW()`,
          [
            item.id || `std-cost-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            item.sku || 'SKU-STD-000',
            item.group || '',
            item.productCategory || '',
            item.serviceType || '',
            item.productDetail || '',
            item.description || '',
            item.unit || 'EACH',
            item.gpPercent || 0,
            item.costStandard || 0,
            item.costPremium || 0,
            item.priceStandard || 0,
            item.pricePremium || 0,
            item.costCenter || '21713',
            item.retention || '',
            item.remark || ''
          ]
        );
        dbSavedCount++;
      }
    } catch (err) {
      console.error('Error saving standard costs to PostgreSQL:', err);
    }
  }

  saveJson(STANDARD_COSTS_FILE, standardCosts);

  return res.json({
    status: 'success',
    savedCount: standardCosts.length,
    dbSavedCount,
    source: isDbConnected ? 'postgresql' : 'json_file'
  });
});

app.delete('/api/standard-costs/:id', async (req, res) => {
  const { id } = req.params;
  if (isDbConnected && dbPool) {
    try {
      await dbPool.query('DELETE FROM standard_costs WHERE id = $1', [id]);
    } catch (err) {
      console.error('Error deleting standard cost item from PostgreSQL:', err);
    }
  }
  const currentItems = loadJson(STANDARD_COSTS_FILE, []);
  const filtered = currentItems.filter(item => item.id !== id);
  saveJson(STANDARD_COSTS_FILE, filtered);

  return res.json({ status: 'success', deletedId: id });
});

// Leads API Endpoints
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

app.post('/api/leads', async (req, res) => {
  const leadData = req.body || {};
  const newLead = {
    id: leadData.id || `lead_${Date.now()}`,
    customer_name: leadData.customer_name || 'Customer',
    customer_phone: leadData.customer_phone || '',
    customer_address: leadData.customer_address || '',
    customer_latitude: leadData.customer_latitude || null,
    customer_longitude: leadData.customer_longitude || null,
    map_url: leadData.map_url || '',
    job_type: leadData.job_type || 'General Service',
    notes: leadData.notes || '',
    status: 'New',
    created_at: new Date().toISOString()
  };

  if (isDbConnected && dbPool) {
    try {
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id VARCHAR(255) PRIMARY KEY,
          customer_name VARCHAR(255) NOT NULL,
          customer_phone VARCHAR(100),
          customer_address TEXT,
          customer_latitude NUMERIC,
          customer_longitude NUMERIC,
          map_url TEXT,
          job_type VARCHAR(255),
          notes TEXT,
          status VARCHAR(50) DEFAULT 'New',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await dbPool.query(
        `INSERT INTO leads (id, customer_name, customer_phone, customer_address, customer_latitude, customer_longitude, map_url, job_type, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [newLead.id, newLead.customer_name, newLead.customer_phone, newLead.customer_address, newLead.customer_latitude, newLead.customer_longitude, newLead.map_url, newLead.job_type, newLead.notes, newLead.status]
      );
    } catch (err) {
      console.error('Error inserting lead to DB:', err);
    }
  }

  const currentLeads = loadJson(LEADS_FILE, []);
  saveJson(LEADS_FILE, [newLead, ...currentLeads]);

  return res.json({ status: 'success', message: 'Lead added successfully', lead: newLead });
});

app.get('/api/leads', async (req, res) => {
  let leads = [];
  if (isDbConnected && dbPool) {
    try {
      const result = await dbPool.query('SELECT * FROM leads ORDER BY created_at DESC');
      leads = result.rows;
    } catch (err) {
      console.error('Error fetching leads from DB:', err);
    }
  }
  if (leads.length === 0) {
    leads = loadJson(LEADS_FILE, []);
  }
  return res.json({ status: 'success', count: leads.length, leads });
});

// Projects API Endpoint
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

app.post('/api/projects', async (req, res) => {
  const p = req.body || {};
  const newProj = {
    id: p.id || `P${new Date().toISOString().slice(2,10).replace(/-/g,'')}-001`,
    name: p.name || 'New Project',
    description: p.description || '',
    status: p.status || 'In Progress',
    startDate: p.startDate || new Date().toISOString().slice(0,10),
    endDate: p.endDate || null,
    budget: p.budget || 0,
    address: p.address || '',
    created_at: new Date().toISOString()
  };

  const currentProjects = loadJson(PROJECTS_FILE, []);
  saveJson(PROJECTS_FILE, [newProj, ...currentProjects]);

  return res.json({ status: 'success', message: 'Project created successfully', project: newProj });
});

// Tasks API Endpoint
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

app.post('/api/tasks', async (req, res) => {
  const t = req.body || {};
  const newTask = {
    id: t.id || `task_${Date.now()}`,
    projectId: t.projectId || 'P1',
    title: t.title || 'New Task',
    description: t.description || '',
    status: t.status || 'To Do',
    priority: t.priority || 'Medium',
    estimatedHours: t.estimatedHours || 0,
    created_at: new Date().toISOString()
  };

  const currentTasks = loadJson(TASKS_FILE, []);
  saveJson(TASKS_FILE, [newTask, ...currentTasks]);

  return res.json({ status: 'success', message: 'Task created successfully', task: newTask });
});

// BuildFlow Production Dispatch Endpoint & Relay Proxy
app.post(['/api/buildflow/dispatch', '/api/v1/projects'], async (req, res) => {
  const payload = req.body || {};
  console.log('🚀 [BuildFlow Dispatch Request Received on Coolify]:', payload);

  const targetUrl = process.env.BUILDFLOW_API_URL || 'https://buildflowx.online/api/v1/projects';
  let externalStatus = 'skipped';
  let externalResponse = null;

  try {
    // Relay request server-to-server (bypasses browser CORS on Production)
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    externalStatus = response.status === 200 || response.status === 201 ? 'success' : 'forwarded';
    try {
      externalResponse = await response.json();
    } catch (_) {
      externalResponse = await response.text();
    }
  } catch (err) {
    console.warn('⚠️ BuildFlow external relay notice:', err.message);
    externalStatus = 'relay_notice';
  }

  // Save to JSON File Fallback
  const currentLogs = loadJson(INTEGRATION_LOGS_FILE, []);
  const newLogEntry = {
    id: Date.now(),
    source_system: payload.sourceSystem || 'Installer Management (VQ)',
    target_system: 'BuildFlow',
    action: 'DISPATCH_PROJECT',
    payload,
    created_at: new Date().toISOString()
  };
  saveJson(INTEGRATION_LOGS_FILE, [newLogEntry, ...currentLogs].slice(0, 100));

  // Save to PostgreSQL if connected
  if (isDbConnected && dbPool) {
    try {
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS integration_logs (
          id SERIAL PRIMARY KEY,
          source_system VARCHAR(100),
          target_system VARCHAR(100),
          action VARCHAR(255),
          payload JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await dbPool.query(
        `INSERT INTO integration_logs (source_system, target_system, action, payload) VALUES ($1, $2, $3, $4)`,
        [
          payload.sourceSystem || 'Installer Management (VQ)',
          'BuildFlow',
          'DISPATCH_PROJECT',
          JSON.stringify(payload)
        ]
      );
    } catch (dbErr) {
      console.error('Error logging integration dispatch to DB:', dbErr);
    }
  }

  return res.json({
    status: 'success',
    message: 'Dispatched to BuildFlow successfully on Coolify Production',
    targetUrl,
    externalStatus,
    externalResponse,
    dispatchedAt: new Date().toISOString()
  });
});

// GET Integration Logs (from PostgreSQL or JSON file fallback)
app.get('/api/integration-logs', async (req, res) => {
  let logs = [];
  let source = 'json_file';

  if (isDbConnected && dbPool) {
    try {
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS integration_logs (
          id SERIAL PRIMARY KEY,
          source_system VARCHAR(100),
          target_system VARCHAR(100),
          action VARCHAR(255),
          payload JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      const result = await dbPool.query('SELECT * FROM integration_logs ORDER BY created_at DESC LIMIT 100');
      logs = result.rows;
      source = 'postgresql';
    } catch (err) {
      console.error('Error fetching integration logs from PostgreSQL:', err);
    }
  }

  if (logs.length === 0) {
    logs = loadJson(INTEGRATION_LOGS_FILE, []);
  }

  return res.json({
    status: 'success',
    count: logs.length,
    source,
    logs
  });
});

// DELETE Integration Logs
app.delete('/api/integration-logs', async (req, res) => {
  if (isDbConnected && dbPool) {
    try {
      await dbPool.query('TRUNCATE TABLE integration_logs');
    } catch (err) {
      console.error('Error clearing integration_logs in PostgreSQL:', err);
    }
  }
  saveJson(INTEGRATION_LOGS_FILE, []);
  return res.json({ status: 'success', message: 'Cleared all integration logs' });
});



// Serve static built frontend files for production
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 vService Production Server running on port ${PORT}`);
});
