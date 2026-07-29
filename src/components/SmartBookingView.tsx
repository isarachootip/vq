import React, { useState } from 'react';
import type { Technician, QueueBooking, Branch, MatchWeights, SystemConfig } from '../types';
import { CustomDateInput } from './CustomDateInput';
import { INITIAL_INSTALLATION_TYPES, SERVICE_ZONES, AVAILABLE_TIME_SLOTS } from '../mockData';
import { MapPin, CheckCircle2, ShieldAlert, UserCheck, Sparkles } from 'lucide-react';

interface SmartBookingViewProps {
  technicians: Technician[];
  branches: Branch[];
  onConfirmBooking: (newBooking: QueueBooking) => void;
  matchWeights?: MatchWeights;
  systemConfig?: SystemConfig;
}

const formatDateDDMMYYYY = (dateStr: string | null) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
};

const CATEGORY_GROUPS = [
  { code: 'ALL', name: 'ทุกหมวดหมู่บริการ (All Groups)' },
  { code: 'CE', name: 'CE - หมวดเครื่องปรับอากาศ (Air Conditioning)' },
  { code: 'CEC', name: 'CEC - หมวดงานบริการล้างทำความสะอาด (Clean & Service)' },
  { code: 'SOLAR', name: 'SOLAR - หมวดระบบพลังงานแสงอาทิตย์ (Solar Cell)' },
  { code: 'FITIN', name: 'Fit-In / Built-in - เฟอร์นิเจอร์บิวท์อิน' },
  { code: 'ELEC', name: 'Electrical - งานระบบไฟฟ้า & Smart Home' },
  { code: 'FLOOR', name: 'Flooring - งานพื้น ผนัง และฝ้าเพดาน' },
  { code: 'PLUMB', name: 'Plumbing - งานระบบประปาและสุขภัณฑ์' },
];

const matchCategoryGroup = (serviceCat: string, name: string, code: string) => {
  if (code === 'ALL') return true;
  const cat = (serviceCat + ' ' + name).toLowerCase();
  if (code === 'CE') return cat.includes('ปรับอากาศ') || cat.includes('ce') || cat.includes('แอร์');
  if (code === 'CEC') return cat.includes('ล้าง') || cat.includes('cec') || cat.includes('ทำความสะอาด');
  if (code === 'SOLAR') return cat.includes('โซล่า') || cat.includes('solar') || cat.includes('แสงอาทิตย์');
  if (code === 'FITIN') return cat.includes('fit-in') || cat.includes('built-in') || cat.includes('เฟอร์นิเจอร์');
  if (code === 'ELEC') return cat.includes('ไฟฟ้า') || cat.includes('smart') || cat.includes('electrical');
  if (code === 'FLOOR') return cat.includes('พื้น') || cat.includes('ผนัง') || cat.includes('ฝ้า') || cat.includes('flooring') || cat.includes('tile');
  if (code === 'PLUMB') return cat.includes('ประปา') || cat.includes('สุขภัณฑ์') || cat.includes('ห้องน้ำ') || cat.includes('plumbing');
  return true;
};

export const SmartBookingView: React.FC<SmartBookingViewProps> = ({
  technicians,
  branches,
  onConfirmBooking,
  matchWeights,
  systemConfig,
}) => {
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string>('ALL');
  const [selectedInstId, setSelectedInstId] = useState<string>(INITIAL_INSTALLATION_TYPES[0].id);

  const filteredInstallationTypes = INITIAL_INSTALLATION_TYPES.filter((type) =>
    matchCategoryGroup(type.category, type.name, selectedCategoryCode)
  );
  const [selectedZone, setSelectedZone] = useState<string>(SERVICE_ZONES[0]);
  const [bookingDate, setBookingDate] = useState<string>('2026-07-25');
  const [selectedSlotId, setSelectedSlotId] = useState<string>(AVAILABLE_TIME_SLOTS[0].id);
  const [customerName, setCustomerName] = useState<string>('คุณอนุรักษ์ เลิศวิริยะ');
  const [customerPhone, setCustomerPhone] = useState<string>('081-999-8877');
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [isBookedSuccess, setIsBookedSuccess] = useState<boolean>(false);
  const [lastBookingRef, setLastBookingRef] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || '');

  const currentInst = INITIAL_INSTALLATION_TYPES.find((i) => i.id === selectedInstId) || INITIAL_INSTALLATION_TYPES[0];
  const currentSlot = AVAILABLE_TIME_SLOTS.find((s) => s.id === selectedSlotId) || AVAILABLE_TIME_SLOTS[0];

  const getBranchName = (branchId?: string) => {
    if (!branchId) return 'ไม่ระบุสาขา';
    const br = branches.find((b) => b.id === branchId);
    return br ? br.name : 'ไม่พบสาขา';
  };

  // Define default values if not passed
  const weights = matchWeights || {
    baseMatch: 40,
    levelBonus: 10,
    primaryZone: 15,
    secondaryZone: 5,
    branchSync: 15,
    goldTier: 10,
    silverTier: 5,
    ratingMultiplier: 10,
    penaltyDivisor: 5
  };

  const sysConfig = systemConfig || {
    cooldownThreshold: 45,
    suspensionThreshold: 90
  };

  // Smart Matching Engine Algorithm
  const evaluatedTechs = technicians.map((tech) => {
    // 1. Skill Match Check
    const techSkill = tech.skills.find((s) => s.category === currentInst.category);
    const hasSkillCategory = !!techSkill;
    const hasRequiredLevel = techSkill ? techSkill.level >= currentInst.minSkillLevel : false;

    // 2. Status & Penalty Check
    const isPenaltyBlocked = 
      tech.status === 'In Cooldown' || 
      tech.tier === 'Cooldown' || 
      tech.tier === 'Suspended' ||
      tech.penaltyPoints >= sysConfig.cooldownThreshold;

    // 3. Zone Match
    const isPrimaryZone = tech.primaryZone === selectedZone;
    const isSecondaryZone = tech.secondaryZones.includes(selectedZone);
    const zoneSupported = isPrimaryZone || isSecondaryZone;

    // 4. Branch Match (Optional weight bonus if technician is from the selected branch)
    const isBranchMatch = tech.branchId === selectedBranchId;

    // 5. Calculate Score (0 - 100)
    let score = 0;

    if (hasSkillCategory && hasRequiredLevel && !isPenaltyBlocked && zoneSupported) {
      score += weights.baseMatch; // Base match

      // Skill Level Bonus
      if (techSkill && techSkill.level > currentInst.minSkillLevel) score += weights.levelBonus;

      // Zone Bonus
      if (isPrimaryZone) score += weights.primaryZone;
      else if (isSecondaryZone) score += weights.secondaryZone;

      // Branch Match Bonus
      if (isBranchMatch) score += weights.branchSync;

      // Tier Bonus
      if (tech.tier === 'Gold') score += weights.goldTier;
      else if (tech.tier === 'Silver') score += weights.silverTier;

      // Rating Bonus
      score += Math.round((tech.rating / 5.0) * weights.ratingMultiplier);

      // Deduct for Penalty Points
      score -= Math.round(tech.penaltyPoints / weights.penaltyDivisor);

      // Ensure clamp 0-100
      score = Math.max(0, Math.min(100, score));
    }

    return {
      tech,
      techSkill,
      hasSkillCategory,
      hasRequiredLevel,
      isPenaltyBlocked,
      zoneSupported,
      isBranchMatch,
      score,
      isEligible: hasSkillCategory && hasRequiredLevel && !isPenaltyBlocked && zoneSupported && score > 0,
    };
  });

  // Sort by match score descending
  const sortedTechs = [...evaluatedTechs].sort((a, b) => b.score - a.score);
  const eligibleTechs = sortedTechs.filter((item) => item.isEligible);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedTech = eligibleTechs.find((t) => t.tech.id === selectedTechId)?.tech || eligibleTechs[0]?.tech;

    if (!assignedTech) {
      alert('ไม่พบทีมช่างที่ตรงกับเงื่อนไขในขณะนี้ กรุณาเปลี่ยนวันหรือปรับเปลี่ยนประเภทงาน');
      return;
    }

    const refNum = `BK-2026-07${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 900 + 100)}`;
    const newBooking: QueueBooking = {
      id: `bk-${Date.now()}`,
      bookingRef: refNum,
      customerName,
      customerPhone,
      addressZone: selectedZone,
      installationTypeId: currentInst.id,
      installationTypeName: currentInst.name,
      requiredSkillLevel: currentInst.minSkillLevel,
      assignedTechTeamId: assignedTech.id,
      assignedTechTeamName: assignedTech.name,
      bookingDate,
      timeSlot: `${currentSlot.startTime} - ${currentSlot.endTime} (${currentSlot.period})`,
      status: 'Scheduled',
      createdFrom: 'Selling Tools (E-ordering)',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      branchId: selectedBranchId,
    };

    onConfirmBooking(newBooking);
    setLastBookingRef(refNum);
    setIsBookedSuccess(true);
  };

  return (
    <div className="space-y-6">
      {/* Engine Banner */}
      <div className="v-panel p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center space-x-2 mb-1.5">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-800 font-sans">ระบบจัดคิวอัจฉริยะ (Smart Booking & Scheduling Engine)</h2>
        </div>
        <p className="text-xs text-slate-600 max-w-4xl leading-relaxed">
          อัลกอริทึมวิเคราะห์หาทีมช่างโดยอัตโนมัติ โดยประเมินประเภทงานติดตั้ง ทักษะความเชี่ยวชาญ (Skill Level), พื้นที่ปฏิบัติการ (Zone), ความสอดคล้องของสาขา (Branch Connection) และคำนวณหักคะแนนความประพฤติ (Penalty Point) เพื่อป้องกันการจ่ายงานให้ช่างที่ถูกพักงานหรือมีคะแนนต่ำ
        </p>
      </div>

      {isBookedSuccess ? (
        <div className="v-panel p-8 bg-emerald-50 border-emerald-300 text-center space-y-4 shadow-sm animate-scaleUp">
          <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">ลงทะเบียนจองคิวติดตั้งสำเร็จ! (Booking Registered)</h3>
          <p className="text-xs text-slate-600">
            หมายเลขอ้างอิงคิวงาน: <span className="font-mono font-bold text-blue-700 text-sm">{lastBookingRef}</span>
          </p>
          <div className="max-w-md mx-auto p-4 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 text-left space-y-2.5 shadow-xs">
            <div className="flex justify-between border-b pb-1.5"><span className="text-slate-500 font-semibold">ชื่อลูกค้า:</span> <span className="font-bold text-slate-800">{customerName}</span></div>
            <div className="flex justify-between border-b pb-1.5"><span className="text-slate-500 font-semibold">งานติดตั้ง:</span> <span className="font-semibold text-slate-800">{currentInst.name}</span></div>
            <div className="flex justify-between border-b pb-1.5"><span className="text-slate-500 font-semibold">วัน/เวลา:</span> <span className="font-semibold text-slate-800">{formatDateDDMMYYYY(bookingDate)} ({currentSlot.startTime} - {currentSlot.endTime})</span></div>
            <div className="flex justify-between border-b pb-1.5"><span className="text-slate-500 font-semibold">สังกัดสาขาดูแล:</span> <span className="font-semibold text-slate-800">{getBranchName(selectedBranchId)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500 font-semibold">ทีมช่างที่ได้รับเลือก:</span> <span className="font-bold text-emerald-600">{eligibleTechs[0]?.tech.name}</span></div>
          </div>

          <div className="pt-3 flex justify-center">
            <button
              onClick={() => setIsBookedSuccess(false)}
              className="v-btn-primary text-xs"
            >
              จองคิวงานใหม่ถัดไป
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Requirements Parameters */}
          <div className="lg:col-span-5 space-y-4 v-panel p-5 bg-white">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-100">
              1. ระบุข้อกำหนดงานติดตั้ง (Specifications)
            </h3>

            {/* Branch Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                สาขาผู้ดูแลการจอง (Booking Branch)
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="v-input w-full"
              >
                {branches.map((br) => (
                  <option key={br.id} value={br.id}>
                    [{br.code}] {br.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Two-Step Installation Selection Container (Step 1.0 -> Step 2.0) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Step 1.0: Category Group */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-[11px] flex items-center gap-1">
                    <span className="bg-amber-500 text-slate-900 px-1.5 py-0.2 rounded text-[10px] font-black">1.0</span>
                    <span>เลือกหมวดหมู่งานติดตั้ง (Category Group):</span>
                  </label>
                  <select
                    value={selectedCategoryCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setSelectedCategoryCode(code);
                      const filtered = INITIAL_INSTALLATION_TYPES.filter((type) =>
                        matchCategoryGroup(type.category, type.name, code)
                      );
                      if (filtered.length > 0) {
                        setSelectedInstId(filtered[0].id);
                      }
                    }}
                    className="v-input w-full py-2 bg-white font-semibold text-slate-800 text-xs border-slate-300"
                  >
                    {CATEGORY_GROUPS.map((cg) => (
                      <option key={cg.code} value={cg.code}>
                        {cg.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2.0: Service Item */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-[11px] flex items-center gap-1">
                    <span className="bg-slate-800 text-white px-1.5 py-0.2 rounded text-[10px] font-black">2.0</span>
                    <span>เลือกบริการงานติดตั้ง (Service Item):</span>
                  </label>
                  <select
                    value={selectedInstId}
                    onChange={(e) => setSelectedInstId(e.target.value)}
                    className="v-input w-full py-2 bg-white font-medium text-slate-800 text-xs border-slate-300"
                  >
                    {filteredInstallationTypes.length === 0 ? (
                      <option value="">-- ไม่พบบริการในหมวดหมู่นี้ --</option>
                    ) : (
                      filteredInstallationTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          [{type.category}] {type.name} (Min Level {type.minSkillLevel})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Calculated Specs Card */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>ทักษะที่เกี่ยวข้อง:</span>
                <span className="font-bold text-indigo-700">{currentInst.category}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>ความชำนาญขั้นต่ำ:</span>
                <span className="px-2 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Level {currentInst.minSkillLevel}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>จำนวนช่างที่ต้องการ:</span>
                <span className="font-semibold text-slate-800">{currentInst.requiredTeamSize} คน / ทีม</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>ระยะเวลาติดตั้ง:</span>
                <span className="font-semibold text-slate-800">{currentInst.estDurationHours} ชั่วโมง</span>
              </div>
            </div>

            {/* Zone Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center space-x-1">
                <MapPin className="h-3.5 w-3.5 text-blue-500" />
                <span>พื้นที่การติดตั้ง (Installation Zone)</span>
              </label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="v-input w-full"
              >
                {SERVICE_ZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>

            {/* Preferred Date & Slot */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  วันที่จองติดตั้ง
                </label>
                <CustomDateInput
                  value={bookingDate}
                  onChange={(val) => setBookingDate(val)}
                  className="v-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ช่วงเวลา (Time Slot)
                </label>
                <select
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  className="v-input w-full"
                >
                  {AVAILABLE_TIME_SLOTS.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.startTime} - {slot.endTime} ({slot.period})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Customer Information Input */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-500">ข้อมูลผู้รับบริการ (Customer Info)</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="ชื่อ-นามสกุล ลูกค้า"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="v-input w-full"
                />
                <input
                  type="text"
                  placeholder="เบอร์โทรศัพท์"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="v-input w-full"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Engine Recommendation Results */}
          <div className="lg:col-span-7 space-y-4 v-panel p-5 bg-white">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. ผลการแมตช์ความเหมาะสมช่าง (Smart Match Results)
              </h3>
              <span className="text-[11px] text-slate-500 font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                พบช่างที่พร้อมปฏิบัติงาน {eligibleTechs.length} / {technicians.length} ทีม
              </span>
            </div>

            {eligibleTechs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 text-slate-500 space-y-2.5">
                <ShieldAlert className="h-10 w-10 text-amber-500 mx-auto" />
                <div className="font-bold text-slate-700">ไม่พบทีมช่างที่มีคุณสมบัติเหมาะสมในขณะนี้</div>
                <p className="text-xs max-w-sm mx-auto text-slate-400">
                  ทีมช่างที่มีความชำนาญตามเกณฑ์อาจติดภาระงานชิ้นอื่น อยู่ในโซนอื่น หรืออยู่ระหว่างการพักงานชั่วคราว (Cooldown)
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {sortedTechs.map((item, idx) => {
                  const { tech, techSkill, score, isEligible, isPenaltyBlocked, isBranchMatch } = item;
                  const isBestMatch = idx === 0 && isEligible;
                  const isSelected = selectedTechId ? selectedTechId === tech.id : isBestMatch;

                  return (
                    <div
                      key={tech.id}
                      onClick={() => isEligible && setSelectedTechId(tech.id)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                        !isEligible
                          ? 'opacity-40 bg-slate-50 border-slate-100 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-50/50 border-blue-500/80 ring-2 ring-blue-500/10'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={tech.avatar}
                            alt={tech.name}
                            className="h-10 w-10 rounded-lg object-cover border border-slate-200"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-800 text-xs md:text-sm">{tech.name}</span>
                              {isBestMatch && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center space-x-0.5">
                                  <Sparkles className="h-3 w-3 text-amber-600 fill-amber-500" />
                                  <span>แนะนำอันดับ 1</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2.5 text-[11px] text-slate-500 mt-1">
                              <span>รหัส: <strong className="font-mono text-slate-700">{tech.code}</strong></span>
                              <span>•</span>
                              <span>สังกัด: <strong className="text-slate-700">{getBranchName(tech.branchId)}</strong></span>
                              <span>•</span>
                              <span>เรตติ้ง: <strong className="text-amber-600 font-bold">⭐ {tech.rating}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <div className="text-right">
                          <div className={`text-lg font-black font-mono ${isEligible ? 'text-blue-600' : 'text-slate-400'}`}>
                            {score}%
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold">Match Weight</div>
                        </div>
                      </div>

                      {/* Technical Details & Penalty status */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs gap-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-400 font-medium">ระดับทักษะ:</span>
                          {techSkill ? (
                            <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {techSkill.category} (Level {techSkill.level})
                            </span>
                          ) : (
                            <span className="text-rose-600 font-semibold">ขาดทักษะตรงสาย</span>
                          )}
                          
                          {isBranchMatch && (
                            <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              สาขาตรงกัน (+15%)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          {isPenaltyBlocked ? (
                            <span className="text-rose-600 font-semibold flex items-center space-x-0.5 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 text-[10px]">
                              <ShieldAlert className="h-3.5 w-3.5" />
                              <span>ติด Penalty Cooldown (ระงับงาน)</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium">
                              Penalty Point: <strong className={tech.penaltyPoints > 0 ? 'text-rose-600' : 'text-emerald-600'}>{tech.penaltyPoints} คะแนน</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Submit button */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={eligibleTechs.length === 0}
                className="w-full md:w-auto px-6 py-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
              >
                <UserCheck className="h-4 w-4" />
                <span>ยืนยันการจัดคิวช่าง & ล็อคคิวทันที (Hold 15 mins)</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
