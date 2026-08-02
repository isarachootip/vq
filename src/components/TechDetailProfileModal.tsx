import React, { useState } from 'react';
import type { Technician, SlotConfig, SkillScore } from '../types';
import { 
  X, 
  Plus, 
  Trash2, 
  Upload, 
  Check, 
  AlertCircle, 
  Info, 
  FileText, 
  MapPin, 
  TrendingDown,
  Award,
  LayoutGrid,
  List
} from 'lucide-react';

interface TechDetailProfileModalProps {
  technician?: Technician | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTech: Technician) => void;
}

const DEFAULT_SLOTS: SlotConfig[] = [
  { id: 's1', name: 'Slot 1: เช้า', timeRange: '08:00 - 12:00', capacity: 1, enabled: true },
  { id: 's2', name: 'Slot 2: บ่าย 1', timeRange: '12:00 - 15:00', capacity: 2, enabled: true },
  { id: 's3', name: 'Slot 3: บ่าย 2', timeRange: '15:00 - 18:00', capacity: 1, enabled: true },
];

const AVAILABLE_SKILLS = [
  'งานไฟฟ้า',
  'ติดตั้งแอร์',
  'งานประปา',
  'งานปูพื้น SPC',
  'งานเฟอร์นิเจอร์ Built-in',
  'งานผ้าม่านและวอลเปเปอร์',
  'ติดตั้ง Smart Home',
  'งานกระเบื้องและห้องน้ำ'
];

const AVAILABLE_JOB_TYPES = [
  'ติดตั้ง',
  'service MTN',
  'ซ่อมบำรุง',
  'สำรวจหน้างาน',
  'ย้ายตำแหน่งเครื่องใช้ไฟฟ้า',
  'ล้างทำความสะอาด'
];

const AVAILABLE_ZONES = [
  'นครปฐม',
  'ราชบุรี',
  'นนทบุรี',
  'กรุงเทพมหานคร',
  'สมุทรปราการ',
  'ปทุมธานี',
  'ชลบุรี',
  'ภูเก็ต'
];

const DAYS_OF_WEEK = [
  { key: 'จ.', name: 'จันทร์' },
  { key: 'อ.', name: 'อังคาร' },
  { key: 'พ.', name: 'พุธ' },
  { key: 'พฤ.', name: 'พฤหัสบดี' },
  { key: 'ศ.', name: 'ศุกร์' },
  { key: 'ส.', name: 'เสาร์' },
  { key: 'อา.', name: 'อาทิตย์' }
];

export const TechDetailProfileModal: React.FC<TechDetailProfileModalProps> = ({
  technician,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  // View Mode: 'card' (แบบการ์ด) vs 'list' (แบบรายการ)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Form states based on existing technician or sample default
  const [name, setName] = useState<string>(technician?.name || 'นายสมชาย รักดี');
  const [phones, setPhones] = useState<string[]>(
    technician?.phones && technician.phones.length > 0
      ? technician.phones
      : [technician?.phone || '081-234-5678']
  );
  const [taxId, setTaxId] = useState<string>(technician?.taxId || '1-2345-67890-12-3');
  const [companyName, setCompanyName] = useState<string>(technician?.companyName || 'บจก. รักดี โลจิสติกส์');
  const [companyType, setCompanyType] = useState<'บุคคลธรรมดา' | 'นิติบุคคล'>(technician?.companyType || 'บุคคลธรรมดา');
  const [email, setEmail] = useState<string>(technician?.email || 'somchai@email.com');
  const [lineId, setLineId] = useState<string>(technician?.lineId || 'somchai_id');

  // Multi-select Skills, Job Types, Service Zones
  const [skillsExpertise, setSkillsExpertise] = useState<string[]>(
    technician?.skillsExpertise || ['งานไฟฟ้า', 'ติดตั้งแอร์']
  );
  const [jobTypes, setJobTypes] = useState<string[]>(
    technician?.jobTypes || ['ติดตั้ง', 'service MTN']
  );
  const [serviceZones, setServiceZones] = useState<string[]>(
    technician?.serviceZones || ['นครปฐม', 'ราชบุรี']
  );

  // Work Days
  const [workDays, setWorkDays] = useState<string[]>(
    technician?.workDays || ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.']
  );

  // Time Slots (Can add dynamic time slots!)
  const [slots, setSlots] = useState<SlotConfig[]>(
    technician?.slots && technician.slots.length > 0 ? technician.slots : DEFAULT_SLOTS
  );
  const [newSlotName, setNewSlotName] = useState<string>('');
  const [newSlotTime, setNewSlotTime] = useState<string>('');
  const [showAddSlotInput, setShowAddSlotInput] = useState<boolean>(false);

  // Certificates & Criminal Record
  const [certificates, setCertificates] = useState<{ id: string; name: string; size?: string }[]>(
    technician?.certificates || [
      { id: 'c1', name: 'cert_elec.jpg', size: '1.2 MB' },
      { id: 'c2', name: 'cert_aircon.pdf', size: '2.4 MB' },
      { id: 'c3', name: 'resume_draft.txt', size: '150 KB' }
    ]
  );
  const [criminalRecord, setCriminalRecord] = useState<'ไม่มี' | 'มี'>(
    technician?.criminalRecord || 'ไม่มี'
  );

  // Financial & Level
  const [creditTermDays, setCreditTermDays] = useState<number>(technician?.creditTermDays || 30);
  const [level] = useState<string>(technician?.level || 'Standard');

  // Skill Scores for auto level reduction based on real work performance
  const [skillScores, setSkillScores] = useState<SkillScore[]>(
    technician?.skillScores || [
      { category: 'งานไฟฟ้า', score: 85, autoReducedLevel: false },
      { category: 'ติดตั้งแอร์', score: 62, autoReducedLevel: true }
    ]
  );

  // Add/Remove Phone Numbers
  const handleAddPhone = () => {
    setPhones([...phones, '']);
  };

  const handleUpdatePhone = (index: number, val: string) => {
    const updated = [...phones];
    updated[index] = val;
    setPhones(updated);
  };

  const handleRemovePhone = (index: number) => {
    if (phones.length <= 1) return;
    setPhones(phones.filter((_, i) => i !== index));
  };

  // Add custom dynamic time slot
  const handleAddCustomSlot = () => {
    if (!newSlotName.trim() || !newSlotTime.trim()) return;
    const newSlot: SlotConfig = {
      id: `slot-${Date.now()}`,
      name: newSlotName.trim(),
      timeRange: newSlotTime.trim(),
      capacity: 1,
      enabled: true
    };
    setSlots([...slots, newSlot]);
    setNewSlotName('');
    setNewSlotTime('');
    setShowAddSlotInput(false);
  };

  const handleRemoveSlot = (id: string) => {
    setSlots(slots.filter(s => s.id !== id));
  };

  const handleSlotCapacityChange = (id: string, capacity: number) => {
    setSlots(slots.map(s => s.id === id ? { ...s, capacity: Math.max(0, capacity) } : s));
  };

  // Work Day Pill Toggle
  const toggleWorkDay = (dayKey: string) => {
    if (workDays.includes(dayKey)) {
      setWorkDays(workDays.filter(d => d !== dayKey));
    } else {
      setWorkDays([...workDays, dayKey]);
    }
  };

  // Skill Score adjustment & auto level calculation
  const handleSkillScoreChange = (index: number, score: number) => {
    const updated = [...skillScores];
    updated[index].score = Math.min(100, Math.max(0, score));
    updated[index].autoReducedLevel = score < 70;
    setSkillScores(updated);
  };

  // Upload file simulation
  const handleSimulateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setCertificates([
      ...certificates,
      { id: `cert-${Date.now()}`, name: file.name, size: `${(file.size / 1024).toFixed(0)} KB` }
    ]);
  };

  const handleRemoveCertificate = (id: string) => {
    setCertificates(certificates.filter(c => c.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: Technician = {
      ...(technician || {
        id: `tech-${Date.now()}`,
        code: `T-STD-${Math.floor(1000 + Math.random() * 9000)}`,
        avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
        tier: 'Silver',
        rating: 4.8,
        completedJobs: 15,
        penaltyPoints: 0,
        activePenaltiesCount: 0,
        primaryZone: serviceZones[0] ? `Zone 1: ${serviceZones[0]}` : 'Zone 1: สุขุมวิท-บางนา',
        secondaryZones: serviceZones.slice(1),
        skills: skillsExpertise.map(s => ({ category: s, level: 1, isCertified: true })),
        dailyCapacityHours: 8,
        bookedHoursToday: 2,
        status: 'Available',
      }),
      name,
      phone: phones[0] || '',
      phones,
      taxId,
      companyName,
      companyType,
      email,
      lineId,
      workDays,
      jobTypes,
      serviceZones,
      skillsExpertise,
      slots,
      certificates,
      criminalRecord,
      creditTermDays,
      level,
      skillScores
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-150 flex items-center justify-center p-3 md:p-6 bg-slate-900/65 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* Top Header with Step bar & View Mode Switch (Card / List) */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <span className="bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
              Step 1 of 5
            </span>
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Detail Profile ช่าง</span>
                <span className="text-xs font-normal text-slate-400">| Personal Information & Work Settings</span>
              </h2>
            </div>
          </div>

          {/* View Mode Toggle Controls (Card vs List View) */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'card'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>แบบการ์ด (Card View)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>แบบรายการ (List View)</span>
              </button>
            </div>

            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs bg-slate-50/50">

          {/* MODE 1: CARD VIEW (3 Columns) */}
          {viewMode === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">

              {/* COLUMN 1: 1. Personal & Contact Info + 3. Work Days & Company */}
              <div className="space-y-6">
                
                {/* Card 1: ข้อมูลส่วนตัวและติดต่อ */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <span className="h-6 w-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">1</span>
                      <span>ข้อมูลส่วนตัวและติดต่อ (Personal & Contact Info)</span>
                    </h3>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      ชื่อ-นามสกุล ช่าง <span className="text-rose-500">*</span> (Full Name *)
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="v-input w-full bg-slate-50 border-slate-200 focus:bg-white text-slate-800 font-semibold"
                      placeholder="นายสมชาย รักดี"
                      required
                    />
                  </div>

                  {/* Phone Numbers (Requirement 1: Multi Phone support) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-700 font-bold">
                        เบอร์โทร <span className="text-rose-500">*</span> (Phone Number *)
                      </label>
                      <span className="text-[10px] text-blue-600 font-semibold">(เลือกได้มากกว่า 1 เบอร์)</span>
                    </div>

                    {phones.map((phoneVal, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={phoneVal}
                          onChange={(e) => handleUpdatePhone(idx, e.target.value)}
                          className="v-input w-full bg-slate-50 border-slate-200 focus:bg-white font-mono"
                          placeholder="081-234-5678"
                          required={idx === 0}
                        />
                        {phones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePhone(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                            title="ลบเบอร์โทร"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddPhone}
                      className="mt-1 w-full py-1.5 px-3 rounded-lg border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 text-slate-600 hover:text-blue-600 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 text-blue-600" />
                      <span>เพิ่มเบอร์โทรศัพท์</span>
                    </button>
                  </div>

                  {/* Tax ID */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      เลขผู้เสียภาษี / ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      className="v-input w-full bg-slate-50 border-slate-200 focus:bg-white font-mono text-slate-800"
                      placeholder="1-2345-67890-12-3"
                      required
                    />
                  </div>

                  {/* Company Name */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      ชื่อบริษัท / ร้าน
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="v-input w-full bg-slate-50 border-slate-200 focus:bg-white text-slate-800"
                      placeholder="บจก. รักดี โลจิสติกส์"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      อีเมล <span className="text-rose-500">*</span> (Email *)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="v-input w-full bg-slate-50 border-slate-200 focus:bg-white text-slate-800"
                      placeholder="somchai@email.com"
                      required
                    />
                  </div>

                  {/* LINE ID */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      LINE ID
                    </label>
                    <input
                      type="text"
                      value={lineId}
                      onChange={(e) => setLineId(e.target.value)}
                      className="v-input w-full bg-slate-50 border-slate-200 focus:bg-white text-slate-800"
                      placeholder="somchai_id"
                    />
                  </div>

                </div>

                {/* Card 3 (Lower section): ข้อมูลรอบรับงาน & วันรับงาน */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <span className="h-6 w-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-black">3</span>
                      <span>ข้อมูลรอบรับงาน (Work Days & Type)</span>
                    </h3>
                  </div>

                  {/* Work Days (Multi select day pills) */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-2">
                      วันรับงาน <span className="text-rose-500">*</span> (Work Days *)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {DAYS_OF_WEEK.map((d) => {
                        const isSelected = workDays.includes(d.key);
                        return (
                          <button
                            key={d.key}
                            type="button"
                            onClick={() => toggleWorkDay(d.key)}
                            className={`h-9 w-9 rounded-full font-bold text-xs flex items-center justify-center transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs scale-105'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {d.key}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Company Type */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      ประเภทบริษัท <span className="text-rose-500">*</span> (Company Type *)
                    </label>
                    <select
                      value={companyType}
                      onChange={(e) => setCompanyType(e.target.value as any)}
                      className="v-input w-full bg-slate-50 border-slate-200 font-semibold"
                    >
                      <option value="บุคคลธรรมดา">บุคคลธรรมดา</option>
                      <option value="นิติบุคคล">นิติบุคคล</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* COLUMN 2: 2. ข้อมูลทักษะและงาน (Skills & Services & Slots) */}
              <div className="space-y-6">
                
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <span className="h-6 w-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-black">2</span>
                      <span>ข้อมูลทักษะและงาน (Skills & Services)</span>
                    </h3>
                  </div>

                  {/* 1. ทักษะและความเชี่ยวชาญ (Multi-select) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-700 font-bold">
                        ทักษะและความเชี่ยวชาญ <span className="text-rose-500">*</span> (Skills & Expertise *)
                      </label>
                      <span className="text-[10px] text-purple-600 font-semibold">(เลือกได้มากกว่า 1)</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[42px] items-center">
                      {skillsExpertise.map((sk) => (
                        <span
                          key={sk}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold shadow-2xs"
                        >
                          <span>{sk}</span>
                          <button
                            type="button"
                            onClick={() => setSkillsExpertise(skillsExpertise.filter(s => s !== sk))}
                            className="text-slate-400 hover:text-rose-500 font-bold cursor-pointer text-xs"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value && !skillsExpertise.includes(e.target.value)) {
                            setSkillsExpertise([...skillsExpertise, e.target.value]);
                          }
                        }}
                        className="bg-transparent border-0 text-slate-500 text-xs py-1 px-2 focus:ring-0 cursor-pointer font-medium"
                      >
                        <option value="">+ เพิ่มทักษะ...</option>
                        {AVAILABLE_SKILLS.filter(s => !skillsExpertise.includes(s)).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 2. ประเภทงานที่รับ (Multi-select) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-700 font-bold">
                        ประเภทงานที่รับ <span className="text-rose-500">*</span> (Job Types *)
                      </label>
                      <span className="text-[10px] text-purple-600 font-semibold">(เลือกได้มากกว่า 1)</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[42px] items-center">
                      {jobTypes.map((jt) => (
                        <span
                          key={jt}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold shadow-2xs"
                        >
                          <span>{jt}</span>
                          <button
                            type="button"
                            onClick={() => setJobTypes(jobTypes.filter(j => j !== jt))}
                            className="text-slate-400 hover:text-rose-500 font-bold cursor-pointer text-xs"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value && !jobTypes.includes(e.target.value)) {
                            setJobTypes([...jobTypes, e.target.value]);
                          }
                        }}
                        className="bg-transparent border-0 text-slate-500 text-xs py-1 px-2 focus:ring-0 cursor-pointer font-medium"
                      >
                        <option value="">+ เพิ่มประเภทงาน...</option>
                        {AVAILABLE_JOB_TYPES.filter(j => !jobTypes.includes(j)).map(j => (
                          <option key={j} value={j}>{j}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 3. โซน / จังหวัดที่รับงาน (Multi-select) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-700 font-bold">
                        โซน / จังหวัดที่รับงาน <span className="text-rose-500">*</span> (Service Zones *)
                      </label>
                      <span className="text-[10px] text-purple-600 font-semibold">(เลือกได้มากกว่า 1)</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[42px] items-center">
                      {serviceZones.map((sz) => (
                        <span
                          key={sz}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold shadow-2xs"
                        >
                          <MapPin className="h-3 w-3 text-purple-500" />
                          <span>{sz}</span>
                          <button
                            type="button"
                            onClick={() => setServiceZones(serviceZones.filter(z => z !== sz))}
                            className="text-slate-400 hover:text-rose-500 font-bold cursor-pointer text-xs"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value && !serviceZones.includes(e.target.value)) {
                            setServiceZones([...serviceZones, e.target.value]);
                          }
                        }}
                        className="bg-transparent border-0 text-slate-500 text-xs py-1 px-2 focus:ring-0 cursor-pointer font-medium"
                      >
                        <option value="">+ เพิ่มจังหวัด/โซน...</option>
                        {AVAILABLE_ZONES.filter(z => !serviceZones.includes(z)).map(z => (
                          <option key={z} value={z}>{z}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 4. รอบเวลารับงานต่อวัน (Slots / Day - Dynamic Add Time Slot requirement!) */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-700 font-bold">
                        รอบเวลารับงานต่อวัน <span className="text-rose-500">*</span> (Slots / Day *)
                      </label>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        เพิ่มช่วงเวลาได้อิสระ
                      </span>
                    </div>

                    {/* Slots Cards List */}
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map((st) => (
                        <div
                          key={st.id}
                          className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 relative transition-all ${
                            st.capacity > 0
                              ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-300/30'
                              : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[11px] text-slate-800">{st.name}</span>
                            {slots.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSlot(st.id)}
                                className="text-slate-300 hover:text-rose-500"
                                title="ลบช่วงเวลานี้"
                              >
                                ×
                              </button>
                            )}
                          </div>

                          <div className="text-[10px] text-slate-500 font-mono">
                            ({st.timeRange})
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                            <span className="text-[10px] text-slate-500 font-semibold">คิว/วัน:</span>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={st.capacity}
                              onChange={(e) => handleSlotCapacityChange(st.id, parseInt(e.target.value) || 0)}
                              className="w-12 py-0.5 px-1.5 text-center font-bold text-xs bg-white border border-slate-300 rounded font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Dynamic Slot button (Requirement 2: "Slot สามารถ add เพิ่มช่วงเวลาได้") */}
                    {!showAddSlotInput ? (
                      <button
                        type="button"
                        onClick={() => setShowAddSlotInput(true)}
                        className="w-full py-2 px-3 rounded-xl border border-dashed border-blue-400 bg-blue-50/30 hover:bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>+ เพิ่มช่วงเวลารับงาน (Add Dynamic Time Slot)</span>
                      </button>
                    ) : (
                      <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 animate-fadeIn">
                        <div className="font-bold text-blue-900 text-xs flex justify-between items-center">
                          <span>เพิ่มช่วงเวลารับงานใหม่:</span>
                          <button 
                            type="button" 
                            onClick={() => setShowAddSlotInput(false)}
                            className="text-slate-400 hover:text-slate-600 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="ชื่อ Slot (เช่น Slot 4: เย็น)"
                            value={newSlotName}
                            onChange={(e) => setNewSlotName(e.target.value)}
                            className="v-input w-full bg-white text-xs"
                          />
                          <input
                            type="text"
                            placeholder="ช่วงเวลา (เช่น 18:00 - 21:00)"
                            value={newSlotTime}
                            onChange={(e) => setNewSlotTime(e.target.value)}
                            className="v-input w-full bg-white text-xs font-mono"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAddSlotInput(false)}
                            className="px-2.5 py-1 rounded bg-slate-200 text-slate-700 font-semibold text-xs"
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="button"
                            onClick={handleAddCustomSlot}
                            className="px-3 py-1 rounded bg-blue-600 text-white font-bold text-xs"
                          >
                            บันทึกช่วงเวลา
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Dynamic Zone Slot Capacity Summary */}
                    <div className="p-2.5 bg-slate-100/80 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                      <span>รอบเวลารับงานต่อวัน {serviceZones[0] || 'นนทบุรี'}:</span>
                      <span className="font-bold text-blue-700">
                        รับ {slots.filter(s => s.capacity > 0).length} slot ต่อวัน ({slots.filter(s => s.capacity > 0).map(s => s.name.split(':')[0]).join(' & ')})
                      </span>
                    </div>

                  </div>
                </div>

              </div>

              {/* COLUMN 3: 3. Documents & Availability + 5. Financial & Level & Score Evaluator */}
              <div className="space-y-6">
                
                {/* Card 3: เอกสารและประวัติ */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <span className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">3</span>
                      <span>เอกสารและประวัติ (Availability & Docs)</span>
                    </h3>
                  </div>

                  {/* Certificates Drag & Drop */}
                  <div className="space-y-2">
                    <label className="block text-slate-700 font-bold">
                      แนบรูป Certificate (Attach Certificates)
                    </label>

                    <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-4 bg-slate-50 text-center space-y-2 cursor-pointer transition-colors group">
                      <input
                        type="file"
                        onChange={handleSimulateFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="h-6 w-6 text-slate-400 group-hover:text-blue-500 mx-auto transition-colors" />
                      <span className="text-xs text-slate-500 font-medium block">
                        Drag and drop file upload หรือคลิกเลือกไฟล์
                      </span>
                    </div>

                    {/* Attached Files Badge List */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {certificates.map((cert) => (
                        <div
                          key={cert.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-xs font-medium"
                        >
                          <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                          <FileText className="h-3.5 w-3.5 text-blue-500" />
                          <span className="font-mono text-[11px] text-slate-800">{cert.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCertificate(cert.id)}
                            className="text-slate-400 hover:text-rose-500 ml-1 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Criminal Record */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      ประวัติอาชญากรรม <span className="text-rose-500">*</span> (Criminal Record *)
                    </label>
                    <select
                      value={criminalRecord}
                      onChange={(e) => setCriminalRecord(e.target.value as any)}
                      className="v-input w-full bg-slate-50 border-slate-200 font-semibold"
                    >
                      <option value="ไม่มี">ไม่มี</option>
                      <option value="มี">มี</option>
                    </select>
                  </div>
                </div>

                {/* Card 5: เงื่อนไขทางการค้าและระดับ (Financial & Level) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <span className="h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">5</span>
                      <span>เงื่อนไขทางการค้าและระดับ (Financial & Level)</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Credit Term */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Credit Term (วัน) <span className="text-rose-500">*</span> (Days *)
                      </label>
                      <select
                        value={creditTermDays}
                        onChange={(e) => setCreditTermDays(Number(e.target.value))}
                        className="v-input w-full bg-slate-50 border-slate-200 font-bold text-slate-800"
                      >
                        <option value={30}>30 วัน</option>
                        <option value={45}>45 วัน</option>
                        <option value={60}>60 วัน</option>
                        <option value={90}>90 วัน</option>
                      </select>
                    </div>

                    {/* Level Badge */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        ระดับช่าง (Level)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 font-extrabold text-xs">
                          {level}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Level Initial Note */}
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>หมายเหตุเริ่มต้น:</strong> เริ่มต้นการเป็นช่างระบบให้ตั้งระดับเป็น <strong>Standard</strong>
                    </span>
                  </div>

                  {/* Requirement 3: Level reduction based on performance score per skill */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-800 font-bold flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-amber-500" />
                        <span>คะแนนประเมินการทำงานจริง (Score ราย Skill)</span>
                      </label>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        ปรับลดระดับตาม Score
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-snug">
                      เมื่อทำงานจริงแล้ว คะแนนประเมินผลงานรายทักษะจะถูกคำนวณ หากคะแนนต่ำกว่าเกณฑ์ (&lt;70%) ระบบจะปรับลด Level ทักษะนั้นอัตโนมัติ
                    </p>

                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      {skillScores.map((ss, idx) => (
                        <div key={idx} className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800">{ss.category}</span>
                            <span className={`font-mono font-bold ${ss.score < 70 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {ss.score} %
                            </span>
                          </div>

                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={ss.score}
                            onChange={(e) => handleSkillScoreChange(idx, Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />

                          {ss.score < 70 ? (
                            <div className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                              <TrendingDown className="h-3 w-3" />
                              <span>คะแนน &lt; 70%: Level ช่างลดระดับลงตาม Score ราย skill อัตโนมัติ</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                              <Check className="h-3 w-3" />
                              <span>ผ่านเกณฑ์ประเมินมาตรฐาน</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                  </div>

                </div>

              </div>

            </div>
          )}

          {/* MODE 2: LIST VIEW (Clean Table & Accordion Rows View) */}
          {viewMode === 'list' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Section 1: Personal & Contact Info Table List */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-5 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="h-5 w-5 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>ข้อมูลส่วนตัวและติดต่อ (Personal & Contact List View)</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">มุมมองตารางรายการ</span>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">ชื่อ-นามสกุล ช่าง *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="v-input w-full bg-slate-50 border-slate-200 font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">เลขผู้เสียภาษี / Citizen ID *</label>
                      <input
                        type="text"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        className="v-input w-full bg-slate-50 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">ชื่อบริษัท / ร้านค้า</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="v-input w-full bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">ประเภทบริษัท</label>
                      <select
                        value={companyType}
                        onChange={(e) => setCompanyType(e.target.value as any)}
                        className="v-input w-full bg-slate-50 font-semibold"
                      >
                        <option value="บุคคลธรรมดา">บุคคลธรรมดา</option>
                        <option value="นิติบุคคล">นิติบุคคล</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">อีเมลติดต่อ (Email) *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="v-input w-full bg-slate-50"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">LINE ID</label>
                      <input
                        type="text"
                        value={lineId}
                        onChange={(e) => setLineId(e.target.value)}
                        className="v-input w-full bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Phone List Table */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-slate-700 font-bold">รายการเบอร์โทรศัพท์ (เลือกได้มากกว่า 1 เบอร์):</label>
                      <button
                        type="button"
                        onClick={handleAddPhone}
                        className="px-2.5 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>เพิ่มเบอร์โทร</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {phones.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-16 text-slate-400 font-bold text-[10px]">เบอร์ที่ {idx + 1}:</span>
                          <input
                            type="text"
                            value={p}
                            onChange={(e) => handleUpdatePhone(idx, e.target.value)}
                            className="v-input flex-1 bg-slate-50 font-mono"
                          />
                          {phones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePhone(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Skills, Job Types & Service Zones List Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-5 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="h-5 w-5 rounded bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>ข้อมูลทักษะ & พื้นที่ให้บริการ (Skills, Job Types & Zones List)</span>
                  </h3>
                  <span className="text-[10px] text-purple-600 font-bold">( Multi-Select Allowed )</span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Skills List Row */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">ทักษะและความเชี่ยวชาญ:</label>
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      {skillsExpertise.map(sk => (
                        <span key={sk} className="px-2.5 py-1 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 flex items-center gap-1">
                          <span>{sk}</span>
                          <button type="button" onClick={() => setSkillsExpertise(skillsExpertise.filter(s => s !== sk))} className="text-slate-400 hover:text-rose-500 font-bold">×</button>
                        </span>
                      ))}
                      <select
                        value=""
                        onChange={(e) => e.target.value && !skillsExpertise.includes(e.target.value) && setSkillsExpertise([...skillsExpertise, e.target.value])}
                        className="bg-transparent border-0 text-slate-500 text-xs py-1"
                      >
                        <option value="">+ เพิ่มทักษะ...</option>
                        {AVAILABLE_SKILLS.filter(s => !skillsExpertise.includes(s)).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Job Types List Row */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">ประเภทงานที่รับ:</label>
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      {jobTypes.map(jt => (
                        <span key={jt} className="px-2.5 py-1 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 flex items-center gap-1">
                          <span>{jt}</span>
                          <button type="button" onClick={() => setJobTypes(jobTypes.filter(j => j !== jt))} className="text-slate-400 hover:text-rose-500 font-bold">×</button>
                        </span>
                      ))}
                      <select
                        value=""
                        onChange={(e) => e.target.value && !jobTypes.includes(e.target.value) && setJobTypes([...jobTypes, e.target.value])}
                        className="bg-transparent border-0 text-slate-500 text-xs py-1"
                      >
                        <option value="">+ เพิ่มประเภทงาน...</option>
                        {AVAILABLE_JOB_TYPES.filter(j => !jobTypes.includes(j)).map(j => (
                          <option key={j} value={j}>{j}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Service Zones List Row */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">โซน / จังหวัดที่รับงาน:</label>
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      {serviceZones.map(sz => (
                        <span key={sz} className="px-2.5 py-1 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-purple-500" />
                          <span>{sz}</span>
                          <button type="button" onClick={() => setServiceZones(serviceZones.filter(z => z !== sz))} className="text-slate-400 hover:text-rose-500 font-bold">×</button>
                        </span>
                      ))}
                      <select
                        value=""
                        onChange={(e) => e.target.value && !serviceZones.includes(e.target.value) && setServiceZones([...serviceZones, e.target.value])}
                        className="bg-transparent border-0 text-slate-500 text-xs py-1"
                      >
                        <option value="">+ เพิ่มจังหวัด/โซน...</option>
                        {AVAILABLE_ZONES.filter(z => !serviceZones.includes(z)).map(z => (
                          <option key={z} value={z}>{z}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Time Slots List Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-5 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="h-5 w-5 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>ตารางรอบเวลารับงานต่อวัน (Dynamic Time Slots Table List)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddSlotInput(true)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ เพิ่มช่วงเวลา</span>
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {showAddSlotInput && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                      <div className="font-bold text-blue-900 text-xs">ระบุชื่อและช่วงเวลา Slot ใหม่:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="ชื่อ Slot (เช่น Slot 4: เย็น)"
                          value={newSlotName}
                          onChange={(e) => setNewSlotName(e.target.value)}
                          className="v-input bg-white text-xs"
                        />
                        <input
                          type="text"
                          placeholder="ช่วงเวลา (เช่น 18:00 - 21:00)"
                          value={newSlotTime}
                          onChange={(e) => setNewSlotTime(e.target.value)}
                          className="v-input bg-white text-xs font-mono"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowAddSlotInput(false)} className="px-3 py-1 bg-slate-200 rounded text-xs">ยกเลิก</button>
                        <button type="button" onClick={handleAddCustomSlot} className="px-3 py-1 bg-blue-600 text-white rounded font-bold text-xs">เพิ่ม Slot</button>
                      </div>
                    </div>
                  )}

                  {/* List Table for Slots */}
                  <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="p-3 border-b">ชื่อ Slot / รอบเวลารับงาน</th>
                        <th className="p-3 border-b">ช่วงเวลา (Time Period)</th>
                        <th className="p-3 border-b text-center">จำนวนคิวรับงาน / วัน</th>
                        <th className="p-3 border-b text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {slots.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800">{st.name}</td>
                          <td className="p-3 font-mono text-slate-600">{st.timeRange}</td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={st.capacity}
                              onChange={(e) => handleSlotCapacityChange(st.id, parseInt(e.target.value) || 0)}
                              className="w-16 py-1 px-2 text-center border rounded font-mono font-bold"
                            />
                          </td>
                          <td className="p-3 text-right">
                            {slots.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSlot(st.id)}
                                className="text-rose-500 hover:text-rose-700 font-bold"
                              >
                                ลบ
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 5: Score Evaluation & Financial Terms List Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-5 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="h-5 w-5 rounded bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">5</span>
                    <span>การประเมิน Score & เงื่อนไขทางการค้า (Financial & Skill Score Evaluator)</span>
                  </h3>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Credit Term (วัน):</label>
                      <select
                        value={creditTermDays}
                        onChange={(e) => setCreditTermDays(Number(e.target.value))}
                        className="v-input w-full bg-slate-50 font-bold"
                      >
                        <option value={30}>30 วัน</option>
                        <option value={45}>45 วัน</option>
                        <option value={60}>60 วัน</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">ระดับช่างปัจจุบัน (Level):</label>
                      <div className="p-2 bg-slate-100 border rounded-xl font-bold text-slate-800">
                        {level} (เริ่มต้นให้เป็น Standard)
                      </div>
                    </div>
                  </div>

                  {/* Skill Score Evaluator List */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <label className="block text-slate-800 font-bold">ตารางวัดคะแนนประเมินการทำงานจริงราย Skill (ปรับลดระดับหาก &lt; 70%):</label>
                    <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="p-3 border-b">หมวดหมู่ทักษะ (Skill)</th>
                          <th className="p-3 border-b text-center">คะแนนประเมิน (% Score)</th>
                          <th className="p-3 border-b">ผลกระทบต่อระดับช่าง (Auto-Reduce Status)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {skillScores.map((ss, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-800">{ss.category}</td>
                            <td className="p-3 text-center font-mono font-bold">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={ss.score}
                                onChange={(e) => handleSkillScoreChange(idx, Number(e.target.value))}
                                className="w-16 py-1 px-2 text-center border rounded font-bold"
                              /> %
                            </td>
                            <td className="p-3">
                              {ss.score < 70 ? (
                                <span className="text-rose-600 font-bold flex items-center gap-1">
                                  <TrendingDown className="h-4 w-4" />
                                  <span>คะแนนต่ำกว่า 70%: ปรับลดระดับทักษะลงตาม Score อัตโนมัติ</span>
                                </span>
                              ) : (
                                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                  <Check className="h-4 w-4" />
                                  <span>ปกติผ่านเกณฑ์มาตรฐาน</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Prompt Arrow Notes Banner matching screenshot design */}
          <div className="p-4 bg-gradient-to-r from-blue-50 via-amber-50 to-emerald-50 border border-blue-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Info className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 text-sm">💡 สรุปการอัปเดตระบบโปรไฟล์ช่าง (Detail Profile):</span>
                <ul className="text-slate-600 space-y-0.5 text-[11px] list-disc list-inside">
                  <li><strong>1. ทุก field ให้เลือกได้มากกว่า 1:</strong> รองรับการเพิ่มหลายเบอร์โทร, หลายทักษะ, หลายประเภทงาน และหลายโซนรับงาน</li>
                  <li><strong>2. Slot สามารถ add เพิ่มช่วงเวลาได้:</strong> กดปุ่ม "+ เพิ่มช่วงเวลารับงาน" เพื่อสร้าง slot เวลาได้ตามต้องการ</li>
                  <li><strong>3. Level ช่าง เมื่อทำงานจริงแล้วให้ลด ตาม score ราย skill:</strong> ประเมินผลงานจริงและปรับระดับช่างลงอัตโนมัติหากคะแนนตก</li>
                  <li><strong>4. รองรับสลับมุมมอง Card / List View:</strong> สามารถสลับดูรูปแบบการ์ด หรือรูปแบบรายการได้อิสระที่แถบด้านบน</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer Action Bar (Save Changes & Cancel) */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between shrink-0 bg-white p-4 -mx-6 -mb-6 rounded-b-2xl">
            <div className="text-[11px] text-slate-400">
              สถานะเอกสาร: พร้อมอัปเดตเข้าสู่ฐานข้อมูลระบบช่าง vFixQ
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-8 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-blue-600/20 transition-colors flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>บันทึกการเปลี่ยนแปลง</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
