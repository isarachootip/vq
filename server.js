import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Storage Paths
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'line_conversations.json');
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
      return await res.json();
    } else {
      const errText = await res.text();
      console.error(`[LINE PROFILE API ERROR ${res.status}]:`, errText);
    }
  } catch (err) {
    console.error('[LINE PROFILE API EXCEPTION]:', err);
  }
  return null;
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
      senderName: customerName,
      text: textContent,
      timestamp,
      isRead: false
    };

    if (conv) {
      conv.customerName = customerName;
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    conversationsCount: conversationsStore.length,
    timestamp: new Date().toISOString()
  });
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
