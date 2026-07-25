import React, { useState } from 'react';
import type { BranchAnnouncement, Branch } from '../types';
import { 
  Megaphone, 
  PlusCircle, 
  Clock, 
  MapPin, 
  Trash2, 
  AlertTriangle, 
  Info,
  Calendar,
  BookOpen
} from 'lucide-react';

interface BranchAnnouncementsViewProps {
  announcements: BranchAnnouncement[];
  onAddAnnouncement: (newAnn: BranchAnnouncement) => void;
  onDeleteAnnouncement: (id: string) => void;
  branches: Branch[];
}

export const BranchAnnouncementsView: React.FC<BranchAnnouncementsViewProps> = ({
  announcements,
  onAddAnnouncement,
  onDeleteAnnouncement,
  branches
}) => {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [category, setCategory] = useState<'งานด่วน' | 'แจ้งเตือน' | 'อบรมระบบ' | 'ข่าวสาร'>('งานด่วน');
  const [priority, setPriority] = useState<'สูง' | 'ปกติ'>('ปกติ');
  const [selectedBranchName, setSelectedBranchName] = useState<string>('สาขาบางนา');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newAnn: BranchAnnouncement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      category,
      priority,
      branchName: selectedBranchName,
      createdAt: new Date().toISOString()
    };

    onAddAnnouncement(newAnn);
    setTitle('');
    setContent('');
    setShowAddForm(false);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'งานด่วน': return <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />;
      case 'แจ้งเตือน': return <Info className="h-4 w-4 text-amber-500 shrink-0" />;
      case 'อบรมระบบ': return <Calendar className="h-4 w-4 text-blue-500 shrink-0" />;
      default: return <BookOpen className="h-4 w-4 text-emerald-500 shrink-0" />;
    }
  };

  const getPriorityStyle = (pri: string) => {
    if (pri === 'สูง') {
      return 'bg-rose-50 text-rose-700 border-rose-200 font-extrabold animate-pulse';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="v-panel p-5 flex flex-col sm:flex-row justify-between sm:items-center bg-white border border-slate-200 gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Megaphone className="h-6 w-6 text-blue-600 animate-bounce" />
            <h2 className="text-xl font-bold text-slate-800">กระดานประกาศสาขา (Branch Announcements Board)</h2>
          </div>
          <p className="text-xs text-slate-500">
            ดูงานรับคำสั่งติดตั้งเร่งด่วนและประกาศจากสาขาต่าง ๆ ทั่วประเทศ สำหรับทีมช่าง vFixQ
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="v-btn-primary flex items-center space-x-2 py-2 px-4 text-xs shrink-0 cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          <span>{showAddForm ? 'ปิดแบบฟอร์ม' : 'เขียนประกาศใหม่'}</span>
        </button>
      </div>

      {/* Write Announcement Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="v-panel p-5 bg-white border border-slate-200 space-y-4 animate-fadeIn">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">📢 เขียนจดหมายและแจ้งประกาศสาขา</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-600 mb-1">หัวข้อประกาศ:</label>
              <input
                type="text"
                required
                placeholder="เช่น ต้องการช่างแอร์ด่วน 2 ทีม โซนสุขุมวิท / แจ้งปิดปรับปรุงเซิร์ฟเวอร์ STS"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="v-input w-full py-2"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">สาขาที่ลงประกาศ:</label>
              <select
                value={selectedBranchName}
                onChange={(e) => setSelectedBranchName(e.target.value)}
                className="v-input w-full py-2"
              >
                {branches.slice(0, 10).map((branch) => (
                  <option key={branch.id} value={branch.name}>{branch.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">ประเภทประกาศ:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="v-input w-full py-2"
              >
                <option value="งานด่วน">🔥 งานด่วนพิเศษ</option>
                <option value="แจ้งเตือน">⚠️ ประกาศแจ้งเตือน</option>
                <option value="อบรมระบบ">🎓 อบรม / พัฒนาทักษะ</option>
                <option value="ข่าวสาร">📰 ข่าวประชาสัมพันธ์</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">ความสำคัญ (Priority):</label>
              <div className="flex items-center space-x-4 pt-1.5 font-bold">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    checked={priority === 'สูง'}
                    onChange={() => setPriority('สูง')}
                    className="accent-rose-600"
                  />
                  <span className="text-rose-500">สูง (High Alert)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    checked={priority === 'ปกติ'}
                    onChange={() => setPriority('ปกติ')}
                    className="accent-slate-700"
                  />
                  <span className="text-slate-600">ปกติ</span>
                </label>
              </div>
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-600 mb-1">เนื้อความ / รายละเอียดประกาศ:</label>
            <textarea
              required
              rows={4}
              placeholder="ระบุข้อตกลง ค่าตอบแทน วันเวลาปฏิทิน และเบอร์ประสานงานติดต่อช่าง..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="v-input w-full py-2 font-sans"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 text-xs">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="v-btn-secondary py-1.5 px-4"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="v-btn-primary py-1.5 px-4"
            >
              เผยแพร่ประกาศ
            </button>
          </div>
        </form>
      )}

      {/* Feed List Grid */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="v-panel p-12 text-center text-slate-400">
            ยังไม่มีรายการแจ้งเตือนใด ๆ จากสาขาในขณะนี้
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className={`v-panel p-5 bg-white border border-slate-200 transition-all duration-300 hover:shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                ann.priority === 'สูง' ? 'border-l-4 border-l-rose-500' : 'border-l-4 border-l-amber-500'
              }`}
            >
              <div className="space-y-2 flex-1">
                {/* Meta Row */}
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getPriorityStyle(ann.priority)}`}>
                    {ann.priority === 'สูง' ? 'ด่วนที่สุด' : 'ปกติ'}
                  </span>
                  
                  <div className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1 border border-slate-200">
                    {getCategoryIcon(ann.category)}
                    <span className="font-bold">{ann.category}</span>
                  </div>

                  <div className="text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>ผู้ประกาศ: {ann.branchName}</span>
                  </div>

                  <div className="text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(ann.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Title and content */}
                <div>
                  <h4 className="font-bold text-slate-800 text-sm leading-snug">{ann.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap leading-relaxed">{ann.content}</p>
                </div>
              </div>

              {/* Action delete */}
              <button
                onClick={() => onDeleteAnnouncement(ann.id)}
                title="ลบประกาศนี้"
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer self-end md:self-center border-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
