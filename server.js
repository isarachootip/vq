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
app.use(express.json());

// In-memory & Persistent File Storage for LINE Conversations
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'line_conversations.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadConversations() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading conversations:', err);
  }
  return [];
}

function saveConversations(conversations) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(conversations, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving conversations:', err);
  }
}

let conversationsStore = loadConversations();

// Helper to fetch user profile from LINE API
async function fetchLineUserProfile(userId, channelAccessToken) {
  if (!channelAccessToken) return null;
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: {
        Authorization: `Bearer ${channelAccessToken}`
      }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Error fetching LINE profile:', err);
  }
  return null;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Webhook Verification & Event Handler for LINE OA
app.all('/api/line/webhook', async (req, res) => {
  console.log(`[LINE WEBHOOK] Received ${req.method} request at ${new Date().toISOString()}`);

  if (req.method === 'GET') {
    return res.status(200).send('LINE Webhook Endpoint Active');
  }

  const events = req.body?.events || [];
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

  for (const event of events) {
    console.log('[LINE EVENT]:', JSON.stringify(event));

    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;
      const text = event.message.text;
      const replyToken = event.replyToken;
      const timestamp = new Date(event.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let profile = await fetchLineUserProfile(userId, channelAccessToken);
      const customerName = profile?.displayName || `ลูกค้า LINE (${userId.substring(0, 6)})`;
      const avatarUrl = profile?.pictureUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
      const lineId = `@${userId.substring(0, 8)}`;

      let conv = conversationsStore.find(c => c.lineId === lineId || c.id === `conv-${userId}`);

      const newMsg = {
        id: `msg-${event.message.id || Date.now()}`,
        sender: 'customer',
        senderName: customerName,
        text,
        timestamp,
        isRead: false
      };

      if (conv) {
        conv.customerName = customerName;
        if (avatarUrl) conv.avatarUrl = avatarUrl;
        conv.lastMessage = text;
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
          addressZone: 'Zone 1: กรุงเทพฯ',
          lastMessage: text,
          lastMessageTime: timestamp,
          unreadCount: 1,
          status: 'new',
          messages: [newMsg]
        };
        conversationsStore.unshift(conv);
      }

      saveConversations(conversationsStore);
    }
  }

  return res.status(200).json({ status: 'ok', eventsReceived: events.length });
});

// 2. GET API for Web App to fetch active conversations
app.get('/api/line/conversations', (req, res) => {
  res.json({
    status: 'success',
    conversations: conversationsStore
  });
});

// 3. POST API to send reply back to customer via LINE Push Message API
app.post('/api/line/reply', async (req, res) => {
  const { conversationId, text, channelAccessToken } = req.body;
  const token = channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

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
  saveConversations(conversationsStore);

  // Send Push Message to LINE if token & userId exist
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
  saveConversations([]);
  res.json({ status: 'cleared' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
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
