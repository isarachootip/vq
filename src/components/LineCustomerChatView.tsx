import React, { useState, useMemo } from 'react';
import type { QueueBooking, ServiceItem } from '../types';
import {
  MessageCircle,
  Send,
  Search,
  User,
  PlusCircle,
  Briefcase,
  Sparkles,
  Paperclip
} from 'lucide-react';

export interface LineChatMessage {
  id: string;
  sender: 'customer' | 'cs_agent' | 'bot';
  senderName: string;
  text: string;
  timestamp: string;
  isRead?: boolean;
  type?: 'text' | 'image' | 'location' | 'booking_card';
  imageUrl?: string;
  bookingRef?: string;
  bookingDetails?: {
    serviceName: string;
    date: string;
    timeSlot: string;
    priceText: string;
  };
}

export interface LineCustomerConversation {
  id: string;
  customerName: string;
  lineId: string;
  avatarUrl?: string;
  phone: string;
  addressZone: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'new' | 'chatting' | 'booked' | 'completed';
  linkedBookingRef?: string;
  messages: LineChatMessage[];
}

interface LineCustomerChatViewProps {
  conversations?: LineCustomerConversation[];
  bookings: QueueBooking[];
  services: ServiceItem[];
  onNavigateToTab: (tabId: string) => void;
  onConfirmBooking?: (b: QueueBooking) => void;
}

const DEFAULT_CONVERSATIONS: LineCustomerConversation[] = [];

const QUICK_REPLIES = [
  '👋 ยินดีต้อนรับสู่บริการ vService ยินดีให้บริการครับ',
  '📍 ขออนุญาตสอบถามพื้นที่และวันที่สะดวกติดตั้งนะครับ',
  '✨ ขอส่งลิงก์เลือกคิวช่างอัจฉริยะให้นะครับ',
  '🚚 ทีมช่างรับทราบงานแล้ว กำลังเดินทางไปหน้างานครับ',
  '🙏 ขอบคุณที่เลือกใช้บริการ vService ครับ'
];

export const LineCustomerChatView: React.FC<LineCustomerChatViewProps> = ({
  bookings,
  services,
  onNavigateToTab,
}) => {
  // Load conversation list from localStorage or fallback
  const [convList, setConvList] = useState<LineCustomerConversation[]>(() => {
    try {
      const saved = localStorage.getItem('vfixq_line_live_conversations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Purge legacy mockup data (e.g. conv-01, conv-02)
          const filtered = parsed.filter(
            (c: LineCustomerConversation) => !['conv-01', 'conv-02', 'conv-03', 'conv-04'].includes(c.id)
          );
          return filtered;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [isLiveMode, setIsLiveMode] = useState<boolean>(() => {
    return localStorage.getItem('vfixq_line_live_mode') !== 'false';
  });

  const [selectedId, setSelectedId] = useState<string>(convList[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [inputText, setInputText] = useState<string>('');

  // Persist convList to localStorage
  const updateConvList = (newConvs: LineCustomerConversation[]) => {
    setConvList(newConvs);
    try {
      localStorage.setItem('vfixq_line_live_conversations', JSON.stringify(newConvs));
    } catch (e) {
      console.error(e);
    }
  };

  // Real-time listener & Backend API polling for incoming LINE messages
  React.useEffect(() => {
    let isMounted = true;

    const fetchLiveConversations = async () => {
      try {
        const res = await fetch('/api/line/conversations');
        if (res.ok) {
          const data = await res.json();
          if (data.conversations && Array.isArray(data.conversations) && isMounted) {
            if (data.conversations.length > 0) {
              setConvList(data.conversations);
              localStorage.setItem('vfixq_line_live_conversations', JSON.stringify(data.conversations));
            }
          }
        }
      } catch (err) {
        // quiet fallback if standalone
      }
    };

    fetchLiveConversations();
    const interval = setInterval(fetchLiveConversations, 2500);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vfixq_line_live_conversations' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setConvList(parsed);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Clear Mock Data handler
  const handleClearMockData = () => {
    if (window.confirm('คุณต้องการล้างข้อมูลตัวอย่าง (Mockup Data) ทั้งหมด เพื่อเริ่มรับข้อความจริงใช่หรือไม่?')) {
      updateConvList([]);
      setSelectedId('');
      localStorage.setItem('vfixq_line_live_mode', 'true');
      setIsLiveMode(true);
      fetch('/api/line/clear', { method: 'POST' }).catch((e) => console.error(e));
    }
  };

  // Restore Default Demo Data handler
  const handleRestoreDemoData = () => {
    updateConvList(DEFAULT_CONVERSATIONS);
    setSelectedId(DEFAULT_CONVERSATIONS[0]?.id || '');
  };

  // Simulate Incoming Real Message from Webhook
  const handleSimulateIncomingWebhookMsg = () => {
    const testNames = ['คุณประเสริฐ ช่างทอง', 'คุณกนกวรรณ สุขเสริฐ', 'คุณธีรยุทธ การค้า', 'คุณวรรณา เลิศวณิช'];
    const randomName = testNames[Math.floor(Math.random() * testNames.length)];
    const randomLineId = `@${randomName.split(' ')[0].toLowerCase()}_line`;
    const randomPhone = `08${Math.floor(Math.random() * 89 + 10)}-${Math.floor(Math.random() * 899 + 100)}-${Math.floor(Math.random() * 8999 + 1000)}`;

    const newMsg: LineChatMessage = {
      id: `webhook-msg-${Date.now()}`,
      sender: 'customer',
      senderName: randomName,
      text: `สวัสดีครับ สอบถามคิวงานติดตั้งแอร์บ้านประจำโซน 1 จาก LINE OA Webhook (${new Date().toLocaleTimeString()})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };

    const newConv: LineCustomerConversation = {
      id: `conv-webhook-${Date.now()}`,
      customerName: randomName,
      lineId: randomLineId,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
      phone: randomPhone,
      addressZone: 'Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา)',
      lastMessage: newMsg.text,
      lastMessageTime: 'เมื่อครู่',
      unreadCount: 1,
      status: 'new',
      messages: [newMsg]
    };

    updateConvList([newConv, ...convList]);
    setSelectedId(newConv.id);
  };

  const activeConv = useMemo(() => {
    return convList.find((c) => c.id === selectedId) || convList[0];
  }, [convList, selectedId]);

  const linkedBooking = useMemo(() => {
    if (!activeConv?.linkedBookingRef) return null;
    return bookings.find((b) => b.bookingRef === activeConv.linkedBookingRef) || null;
  }, [activeConv, bookings]);

  // Filter conversations
  const filteredConvs = useMemo(() => {
    return convList.filter((c) => {
      const matchSearch =
        c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lineId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        (c.linkedBookingRef && c.linkedBookingRef.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'unread' && c.unreadCount > 0) ||
        c.status === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [convList, searchQuery, filterStatus]);

  // Send message handler
  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !activeConv) return;

    const newMsg: LineChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'cs_agent',
      senderName: 'เจ้าหน้าที่ vService CS',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true
    };

    const updated = convList.map((c) => {
      if (c.id === activeConv.id) {
        return {
          ...c,
          lastMessage: text,
          lastMessageTime: 'เมื่อครู่',
          unreadCount: 0,
          status: c.status === 'new' ? ('chatting' as const) : c.status,
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    });

    updateConvList(updated);

    // Call backend API to push message back to LINE user's phone
    fetch('/api/line/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: activeConv.id,
        text
      })
    }).catch((err) => console.log('Backend reply offline fallback:', err));

    if (!textToSend) setInputText('');
  };

  // Send Booking Rich Card handler
  const handleSendBookingCard = () => {
    if (!activeConv) return;
    const ref = activeConv.linkedBookingRef || `BK-2026-0727-${Math.floor(Math.random() * 89 + 10)}`;

    const cardMsg: LineChatMessage = {
      id: `card-${Date.now()}`,
      sender: 'cs_agent',
      senderName: 'ระบบอัตโนมัติ vService LINE OA',
      text: 'การ์ดยืนยันคิวงานติดตั้ง (LINE Rich Card)',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'booking_card',
      bookingRef: ref,
      bookingDetails: {
        serviceName: services[0]?.name || 'บริการติดตั้งเครื่องปรับอากาศ',
        date: '25/07/2026',
        timeSlot: 'Morning (09:00 - 12:00)',
        priceText: 'ทีมช่างสมชาย (Gold Tier ⭐ 4.9)'
      }
    };

    const updated = convList.map((c) => {
      if (c.id === activeConv.id) {
        return {
          ...c,
          lastMessage: `[การ์ดจองคิวงาน ${ref}]`,
          lastMessageTime: 'เมื่อครู่',
          status: 'booked' as const,
          linkedBookingRef: ref,
          messages: [...c.messages, cardMsg]
        };
      }
      return c;
    });

    updateConvList(updated);
  };

  return (
    <div className="space-y-4 font-sans">
      
      {/* Top Header LINE OA Bar */}
      <div className="bg border border-emerald-500/30 rounded-2xl p-4 shadow-sm text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-3" style={{ background: 'linear-gradient(135deg, #06C755 0%, #00B900 100%)' }}>
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-white text-[#06C755] flex items-center justify-center shadow-md font-black text-xl shrink-0">
            LINE
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black tracking-tight">LINE Official Account (Live Customer Chat)</h1>
              <span className="bg-white/20 text-white font-bold text-[10px] px-2 py-0.5 rounded-full border border-white/30">
                @vServiceInstaller
              </span>
              <span className="bg-emerald-900/40 text-emerald-100 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-300/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                {isLiveMode ? '🟢 Live Webhook Mode' : '🟡 Simulator'}
              </span>
            </div>
            <p className="text-xs text-white/80 font-medium mt-0.5">ระบบแชทสดบริการลูกค้าและส่งการ์ดจองคิวติดตั้งผ่าน LINE OA (Webhook Real-time Active)</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {convList.length > 0 ? (
            <button
              onClick={handleClearMockData}
              className="px-3 py-1.5 bg-red-600/90 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition cursor-pointer border border-red-400/50 flex items-center gap-1 shadow-sm"
              title="ล้างข้อมูลตัวอย่างเดิม เพื่อเริ่มรับแชทสดจาก LINE OA จริง"
            >
              <span>🗑️ ล้างข้อมูลตัวอย่าง (Mockup Data)</span>
            </button>
          ) : (
            <button
              onClick={handleRestoreDemoData}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl transition cursor-pointer border border-white/30 flex items-center gap-1"
            >
              <span>🔄 เติมข้อมูลตัวอย่าง (Load Demo)</span>
            </button>
          )}

          <button
            onClick={handleSimulateIncomingWebhookMsg}
            className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-bold text-xs rounded-xl transition cursor-pointer border border-yellow-200 flex items-center gap-1 shadow-sm"
            title="ทดสอบยิง event ข้อความเข้ามาจาก LINE Webhook"
          >
            <span>⚡ ทดสอบรับข้อความ Webhook ใหม่</span>
          </button>

          <button
            onClick={() => onNavigateToTab('smart-booking')}
            className="px-3 py-1.5 bg-white text-[#06C755] font-bold text-xs rounded-xl shadow-xs hover:bg-slate-50 transition cursor-pointer border-0 flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            <span>สร้างคิวจองอัจฉริยะ</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Chat Layout */}
      <div className="v-panel bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* ===== Column 1: Customer Conversation List (3 cols) ===== */}
        <div className="lg:col-span-3 border-r border-slate-200 flex flex-col bg-slate-50/60">
          
          {/* List Search & Filter */}
          <div className="p-3 border-b border-slate-200 space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาชื่อลูกค้า, LINE ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#06C755]"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1 text-[11px] overflow-x-auto pb-1">
              {[
                { id: 'ALL', label: 'ทั้งหมด' },
                { id: 'unread', label: 'ยังไม่ได้ตอบ' },
                { id: 'chatting', label: 'คุยอยู่' },
                { id: 'booked', label: 'จองแล้ว' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap border-0 cursor-pointer ${
                    filterStatus === f.id
                      ? 'bg-[#06C755] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConvs.length === 0 ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#06C755] flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#06C755] animate-ping"></span>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">🟢 พร้อมรับข้อความสดจาก LINE OA</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    ล้างข้อมูลตัวอย่างเรียบร้อยแล้ว<br/>
                    เมื่อผู้ใช้ส่งข้อความใน LINE App ข้อความจะยิงผ่าน Webhook เข้ามาที่นี่ทันที
                  </p>
                </div>
                <div className="pt-2 flex flex-col gap-1.5">
                  <button
                    onClick={handleSimulateIncomingWebhookMsg}
                    className="px-3 py-1.5 bg-[#06C755] hover:bg-[#00B900] text-white font-bold text-[11px] rounded-xl shadow-xs transition border-0 cursor-pointer"
                  >
                    ⚡ ทดสอบยิงข้อความ Webhook
                  </button>
                  <button
                    onClick={handleRestoreDemoData}
                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] rounded-lg transition border-0 cursor-pointer"
                  >
                    🔄 โหลดข้อมูลตัวอย่างกลับมา
                  </button>
                </div>
              </div>
            ) : (
              filteredConvs.map((conv) => {
                const isSelected = conv.id === activeConv?.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedId(conv.id);
                      // Clear unread
                      const updated = convList.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c));
                      updateConvList(updated);
                    }}
                    className={`p-3 flex items-start space-x-3 cursor-pointer transition select-none ${
                      isSelected
                        ? 'bg-emerald-50/80 border-l-4 border-[#06C755]'
                        : 'hover:bg-slate-100/70'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {conv.avatarUrl ? (
                        <img
                          src={conv.avatarUrl}
                          alt={conv.customerName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-xs">
                          {conv.customerName.charAt(0)}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#06C755] text-white rounded-full flex items-center justify-center text-[8px] font-black border border-white">
                        L
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <div className="font-bold text-slate-800 text-xs truncate max-w-[130px]">
                          {conv.customerName}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{conv.lastMessageTime}</span>
                      </div>

                      <div className="text-[10px] font-mono text-emerald-600 font-bold mt-0.5">
                        {conv.lineId}
                      </div>

                      <p className="text-[11px] text-slate-500 truncate mt-1">
                        {conv.lastMessage}
                      </p>

                      {/* Badges */}
                      <div className="flex items-center space-x-1 mt-1.5">
                        {conv.linkedBookingRef && (
                          <span className="text-[9px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded font-bold">
                            {conv.linkedBookingRef}
                          </span>
                        )}
                        {conv.unreadCount > 0 && (
                          <span className="ml-auto text-[9px] bg-[#06C755] text-white font-black px-1.5 py-0.2 rounded-full shadow-xs">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* ===== Column 2: Center Main LINE Chat Area (6 cols) ===== */}
        <div className="lg:col-span-6 flex flex-col h-full bg-[#8CABD9]/10">
          
          {/* Active Chat Header */}
          {activeConv ? (
            <>
              <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={activeConv.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={activeConv.customerName}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#06C755] rounded-full border border-white"></span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800 text-xs">{activeConv.customerName}</span>
                      <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                        {activeConv.lineId}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                      <span>📞 {activeConv.phone}</span>
                      <span>•</span>
                      <span>{activeConv.addressZone.split(':')[0]}</span>
                    </div>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={handleSendBookingCard}
                    className="px-2.5 py-1.5 bg-[#06C755] hover:bg-[#00B900] text-white font-bold text-[11px] rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer border-0"
                    title="ส่งการ์ดจองบริการผ่าน LINE OA"
                  >
                    <PlusCircle size={13} />
                    <span>ส่งการ์ดจอง</span>
                  </button>

                  <button
                    onClick={() => onNavigateToTab('smart-booking')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition flex items-center gap-1 cursor-pointer border border-slate-200"
                    title="จองคิวช่างให้อัตโนมัติ"
                  >
                    <Sparkles size={13} className="text-amber-500" />
                    <span>แมตช์ช่าง</span>
                  </button>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/70" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
                <div className="text-center my-2">
                  <span className="text-[10px] font-bold bg-white/80 text-slate-500 px-3 py-1 rounded-full border border-slate-200 shadow-xs">
                    วันนี้ • ป้องกันและเชื่อมต่อผ่าน LINE Official API Security
                  </span>
                </div>

                {activeConv.messages.map((msg) => {
                  const isCustomer = msg.sender === 'customer';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'} animate-fadeIn`}
                    >
                      <div className="text-[9px] text-slate-400 font-medium mb-0.5 px-1">
                        {msg.senderName}
                      </div>

                      {/* Message Bubble */}
                      <div className="flex items-end gap-1.5 max-w-[85%]">
                        {isCustomer && (
                          <img
                            src={activeConv.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover shrink-0 mb-1"
                          />
                        )}

                        {/* LINE Rich Card Component */}
                        {msg.type === 'booking_card' ? (
                          <div className="bg-white rounded-2xl border border-emerald-300 shadow-md p-3.5 space-y-2.5 max-w-sm text-xs">
                            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                              <span className="font-extrabold text-[#06C755] flex items-center gap-1 text-xs">
                                🟢 LINE OA Rich Booking Card
                              </span>
                              <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                                {msg.bookingRef}
                              </span>
                            </div>

                            {msg.bookingDetails && (
                              <div className="space-y-1.5 text-slate-700 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                                <div className="font-bold text-slate-900">{msg.bookingDetails.serviceName}</div>
                                <div className="text-[11px] text-slate-600">📅 วันที่นัด: <strong>{msg.bookingDetails.date}</strong> ({msg.bookingDetails.timeSlot})</div>
                                <div className="text-[11px] text-emerald-700 font-bold">👷 {msg.bookingDetails.priceText}</div>
                              </div>
                            )}

                            <div className="flex justify-between items-center pt-1 text-[10px]">
                              <span className="text-slate-400">สถานะ: <strong>คิวเตรียมจัดส่งทีมช่าง</strong></span>
                              <button
                                onClick={() => onNavigateToTab('dashboard')}
                                className="text-[#06C755] font-bold underline cursor-pointer border-0 bg-transparent"
                              >
                                ดูตารางคิวงาน &rarr;
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Standard Text Bubble */
                          <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                              isCustomer
                                ? 'bg-white text-slate-800 rounded-tl-xs border border-slate-200'
                                : 'bg-[#06C755] text-white font-medium rounded-tr-xs shadow-md'
                            }`}
                          >
                            {msg.text}
                          </div>
                        )}

                        {!isCustomer && (
                          <span className="text-[9px] text-slate-400 font-mono shrink-0 mb-0.5">
                            {msg.isRead && <span className="text-[#06C755] font-bold mr-0.5">อ่านแล้ว</span>}
                            {msg.timestamp}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Reply Auto Templates */}
              <div className="p-2 bg-slate-50 border-t border-slate-200 flex gap-1.5 overflow-x-auto text-[10px]">
                <span className="font-bold text-slate-400 self-center shrink-0">คำตอบด่วน:</span>
                {QUICK_REPLIES.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(reply)}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-full border border-slate-200 transition cursor-pointer whitespace-nowrap font-medium"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Message Input Footer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
              >
                <button
                  type="button"
                  onClick={handleSendBookingCard}
                  className="p-2 rounded-xl text-slate-400 hover:text-[#06C755] hover:bg-emerald-50 transition border-0 bg-transparent cursor-pointer"
                  title="แนบการ์ดจองคิวงาน"
                >
                  <Paperclip size={18} />
                </button>

                <input
                  type="text"
                  placeholder="พิมพ์ข้อความตอบกลับลูกค้าใน LINE OA..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 v-input py-2 px-3 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#06C755]"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-4 py-2 bg-[#06C755] hover:bg-[#00B900] disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1 cursor-pointer border-0"
                >
                  <Send size={14} />
                  <span>ส่ง</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 bg-white">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#06C755] flex items-center justify-center border border-emerald-200 shadow-sm relative">
                <MessageCircle size={32} />
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#06C755] rounded-full border-2 border-white animate-ping"></span>
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm">🟢 ระบบพร้อมรับข้อความสดผ่าน LINE Webhook</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  ล้าง Mockup Data เรียบร้อยแล้ว ขณะนี้ระบบกำลังเชื่อมต่อรับข้อความสดจาก <strong className="text-emerald-700 font-mono font-bold">{typeof window !== 'undefined' ? `${window.location.origin}/api/line/webhook` : 'https://vibepjm.online/api/line/webhook'}</strong>
                </p>
              </div>
              <div className="pt-2 flex items-center space-x-2">
                <button
                  onClick={handleSimulateIncomingWebhookMsg}
                  className="px-4 py-2 bg-[#06C755] hover:bg-[#00B900] text-white font-bold text-xs rounded-xl shadow-sm transition border-0 cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>ทดสอบยิงข้อความ Webhook ตัวอย่าง</span>
                </button>
                <button
                  onClick={handleRestoreDemoData}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition border border-slate-200 cursor-pointer"
                >
                  โหลดชุดตัวอย่างกลับมา
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ===== Column 3: Right CRM Customer & Booking Context Panel (3 cols) ===== */}
        <div className="lg:col-span-3 border-l border-slate-200 bg-slate-50/50 p-4 space-y-4 overflow-y-auto">
          
          {/* Customer CRM Profile Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 text-xs">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
              <User size={16} className="text-[#06C755]" />
              <h3 className="font-bold text-slate-800">ข้อมูลลูกค้า (CRM Profile)</h3>
            </div>

            {activeConv && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">ชื่อลูกค้า:</span>
                  <span className="font-bold text-slate-800">{activeConv.customerName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">LINE ID:</span>
                  <span className="font-mono text-emerald-700 font-bold">{activeConv.lineId}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">เบอร์โทรศัพท์:</span>
                  <span className="font-mono text-slate-700 font-bold">{activeConv.phone}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">โซนที่อยู่:</span>
                  <span className="text-slate-700 font-medium text-[11px] truncate max-w-[130px]">{activeConv.addressZone}</span>
                </div>
              </div>
            )}
          </div>

          {/* Connected Booking Context Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <Briefcase size={16} className="text-blue-600" />
                <h3 className="font-bold text-slate-800">ตั๋วคิวงานจองติดตั้ง</h3>
              </div>
              {linkedBooking && (
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                  {linkedBooking.status}
                </span>
              )}
            </div>

            {linkedBooking ? (
              <div className="space-y-2 bg-blue-50/40 p-3 rounded-xl border border-blue-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium">หมายเลขอ้างอิง Ref:</span>
                  <div className="font-mono font-bold text-blue-700 text-sm">{linkedBooking.bookingRef}</div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-medium">บริการติดตั้ง:</span>
                  <div className="font-bold text-slate-800 text-[11px]">{linkedBooking.installationTypeName}</div>
                </div>

                <div className="flex justify-between text-[11px] border-t border-blue-100 pt-1.5">
                  <span className="text-slate-500">วันนัดติดตั้ง:</span>
                  <span className="font-bold text-slate-800">{linkedBooking.bookingDate}</span>
                </div>

                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">ช่วงเวลา:</span>
                  <span className="font-bold text-slate-800">{linkedBooking.timeSlot}</span>
                </div>

                {linkedBooking.assignedTechTeamName && (
                  <div className="border-t border-blue-100 pt-1.5">
                    <span className="text-[10px] text-slate-400">ทีมช่างประจำคิว:</span>
                    <div className="font-bold text-emerald-700 text-[11px]">{linkedBooking.assignedTechTeamName}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-slate-400 italic bg-slate-50 rounded-xl border border-slate-100">
                ยังไม่มีตั๋วคิวงานผูกกับสนทนานี้
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-xs space-y-2">
            <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-600" />
              <span>เครื่องมือประสานงาน LINE OA</span>
            </h4>
            <p className="text-[11px] text-emerald-700">สามารถส่งการ์ดจองคิวงานในแชทให้ลูกค้ากดยืนยันวันเวลาได้ทันที</p>
          </div>

        </div>

      </div>

    </div>
  );
};
