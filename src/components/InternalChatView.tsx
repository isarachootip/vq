import React, { useState } from 'react';
import type { ChatChannel, Technician, Branch } from '../types';
import { 
  MessageSquare, 
  Send, 
  CheckCheck, 
  User, 
  MapPin, 
  Award, 
  Link, 
  Building
} from 'lucide-react';

interface InternalChatViewProps {
  channels: ChatChannel[];
  onSendMessage: (channelId: string, text: string) => void;
  technicians: Technician[];
  branches: Branch[];
}

export const InternalChatView: React.FC<InternalChatViewProps> = ({
  channels,
  onSendMessage,
  technicians,
  branches
}) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>(channels[0]?.id || '');
  const [inputText, setInputText] = useState<string>('');

  const activeChannel = channels.find((c) => c.id === selectedChannelId) || channels[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChannel) return;

    onSendMessage(activeChannel.id, inputText);
    setInputText('');
  };

  // Find technician details if linked
  const linkedTech = activeChannel?.techId 
    ? technicians.find((t) => t.id === activeChannel.techId) 
    : null;

  return (
    <div className="v-panel bg-white border border-slate-200 overflow-hidden flex flex-col md:flex-row h-135">
      
      {/* 1. Left Sidebar: Channels List */}
      <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <span>ห้องแชทประสานงาน (Internal Chat)</span>
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">คลิกเลือกทีมช่าง หรือ สาขาเพื่อคุยประสานงาน</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {channels.map((channel) => {
            const isSelected = channel.id === selectedChannelId;
            return (
              <button
                key={channel.id}
                onClick={() => setSelectedChannelId(channel.id)}
                className={`w-full text-left p-3.5 flex items-start gap-3 transition cursor-pointer hover:bg-slate-100/50 ${
                  isSelected ? 'bg-blue-600/10 border-l-4 border-blue-600' : ''
                }`}
              >
                {/* Avatar icon */}
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 text-slate-100 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                  {channel.avatarInitials}
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-bold text-slate-800 text-xs truncate">{channel.name}</h4>
                    {channel.unreadCount > 0 && (
                      <span className="bg-rose-500 text-slate-900 font-extrabold text-[8px] px-1.5 py-0.25 rounded-full shrink-0 animate-pulse">
                        {channel.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate font-medium">{channel.lastMessage}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Middle Area: Active Chat Panel */}
      <div className="flex-1 flex flex-col bg-white">
        {activeChannel ? (
          <>
            {/* Active Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/20">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-slate-900 text-slate-100 border border-slate-800 flex items-center justify-center font-bold text-xs">
                  {activeChannel.avatarInitials}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">{activeChannel.name}</h4>
                  <span className="text-[9px] text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> ออนไลน์ประสานงานอยู่
                  </span>
                </div>
              </div>
            </div>

            {/* Message History Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-100/50 min-h-60 text-xs">
              {activeChannel.messages.map((msg) => {
                const isMe = msg.sender === 'coordinator';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[9px] font-bold text-slate-400 mb-0.5 px-1">
                      {msg.senderName} ({msg.timestamp})
                    </span>
                    <div
                      className={`p-2.5 rounded-2xl max-w-[80%] leading-relaxed ${
                        isMe
                          ? 'bg-amber-500 text-slate-900 font-medium rounded-tr-none'
                          : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-xs'
                      }`}
                    >
                      {msg.text}
                      {isMe && <CheckCheck className="h-3 w-3 inline ml-1.5 text-slate-900 shrink-0" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message composer input */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-200 flex gap-2">
              <input
                type="text"
                placeholder={`ส่งข้อความคุยกับ ${activeChannel.name}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 v-input py-2 text-xs border-slate-200 bg-slate-100 rounded-lg"
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 p-2.5 rounded-lg transition border-0 cursor-pointer shadow-xs"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
            กรุณาเลือกช่องแชทการเชื่อมต่อสื่อสารที่แถบซ้ายมือ
          </div>
        )}
      </div>

      {/* 3. Right Panel: Profiles / LINE OA widgets */}
      <div className="w-full md:w-64 border-l border-slate-200 p-4 bg-slate-50/50 space-y-4 text-xs">
        <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wider text-[10px]">
          ข้อมูลคู่สนทนาและ LINE OA
        </h4>

        {linkedTech ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3.5 shadow-xs">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-800 leading-snug">{linkedTech.name}</h5>
                  <span className="text-[9px] px-1.5 py-0.25 rounded-md font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    ช่างสังกัด vFixQ
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-[10px]">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" /> ระดับทีม (Tier):</span>
                  <span className="font-bold text-slate-700">{linkedTech.tier}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span className="flex items-center gap-1">⭐ คะแนนรีติ้ง (Rating):</span>
                  <span className="font-bold text-slate-700">{linkedTech.rating} / 5.0</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" /> สังกัดสาขา:</span>
                  <span className="font-bold text-slate-700">
                    {branches.find((b) => b.id === linkedTech.branchId)?.name || 'ไม่ระบุสาขา'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> พื้นที่หลัก:</span>
                  <span className="font-bold text-slate-700 truncate max-w-[100px]">{linkedTech.primaryZone}</span>
                </div>
              </div>
            </div>

            {/* LINE OA Widget */}
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/5 space-y-2.5">
              <h5 className="font-bold text-emerald-700 flex items-center gap-1">
                <Link className="h-4 w-4" />
                <span>ช่องทางช่าง (LINE OA)</span>
              </h5>
              <p className="text-[10px] text-slate-400 leading-normal">
                ช่างติดตั้งได้รับใบงานจองผ่านระบบแจ้งเตือนไลน์ส่วนตัวประสานงาน
              </p>
              
              <div className="bg-white p-2 rounded-lg border border-emerald-500/20 text-center space-y-1">
                {/* Mock LINE QR Code */}
                <div className="w-14 h-14 bg-slate-900 rounded mx-auto flex items-center justify-center font-mono text-[8px] text-slate-400 font-bold border border-slate-800">
                  LINE OA
                </div>
                <span className="text-[9px] block font-bold text-emerald-700">@vfixq_line</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs text-[10px] text-slate-500">
              <p className="font-semibold text-slate-700">ผู้ใช้ฝ่ายประสานงานแอดมินสาขา</p>
              <p className="leading-normal">
                ผู้ควบคุมระบบตรวจสอบและชาร์จงาน มีไว้เพื่อแจ้งประสานงานข้ามแผนกและตรวจสอบคิวงาน
              </p>
            </div>

            {/* General Line OA Widget */}
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/5 space-y-2.5 text-center">
              <h5 className="font-bold text-emerald-700 text-left flex items-center gap-1">
                <Link className="h-4 w-4" />
                <span>LINE OA vFixQ</span>
              </h5>
              <div className="w-14 h-14 bg-slate-900 rounded mx-auto flex items-center justify-center font-mono text-[8px] text-slate-400 font-bold border border-slate-800">
                LINE OA
              </div>
              <span className="text-[10px] font-bold text-emerald-700 block">@vfixq_line</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
