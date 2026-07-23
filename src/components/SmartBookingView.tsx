import React, { useState } from 'react';
import type { Technician, QueueBooking } from '../types';
import { INITIAL_INSTALLATION_TYPES, SERVICE_ZONES, AVAILABLE_TIME_SLOTS } from '../mockData';
import { MapPin, CheckCircle2, ShieldAlert, UserCheck, Sparkles } from 'lucide-react';

interface SmartBookingViewProps {
  technicians: Technician[];
  onConfirmBooking: (newBooking: QueueBooking) => void;
}

export const SmartBookingView: React.FC<SmartBookingViewProps> = ({
  technicians,
  onConfirmBooking,
}) => {
  const [selectedInstId, setSelectedInstId] = useState<string>(INITIAL_INSTALLATION_TYPES[0].id);
  const [selectedZone, setSelectedZone] = useState<string>(SERVICE_ZONES[0]);
  const [bookingDate, setBookingDate] = useState<string>('2026-07-25');
  const [selectedSlotId, setSelectedSlotId] = useState<string>(AVAILABLE_TIME_SLOTS[0].id);
  const [customerName, setCustomerName] = useState<string>('คุณอนุรักษ์ เลิศวิริยะ');
  const [customerPhone, setCustomerPhone] = useState<string>('081-999-8877');
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [isBookedSuccess, setIsBookedSuccess] = useState<boolean>(false);
  const [lastBookingRef, setLastBookingRef] = useState<string>('');

  const currentInst = INITIAL_INSTALLATION_TYPES.find((i) => i.id === selectedInstId) || INITIAL_INSTALLATION_TYPES[0];
  const currentSlot = AVAILABLE_TIME_SLOTS.find((s) => s.id === selectedSlotId) || AVAILABLE_TIME_SLOTS[0];

  // Smart Matching Engine Algorithm
  const evaluatedTechs = technicians.map((tech) => {
    // 1. Skill Match Check
    const techSkill = tech.skills.find((s) => s.category === currentInst.category);
    const hasSkillCategory = !!techSkill;
    const hasRequiredLevel = techSkill ? techSkill.level >= currentInst.minSkillLevel : false;

    // 2. Status & Penalty Check
    const isPenaltyBlocked = tech.status === 'In Cooldown' || tech.tier === 'Cooldown' || tech.tier === 'Suspended';

    // 3. Zone Match
    const isPrimaryZone = tech.primaryZone === selectedZone;
    const isSecondaryZone = tech.secondaryZones.includes(selectedZone);
    const zoneSupported = isPrimaryZone || isSecondaryZone;

    // 4. Calculate Score (0 - 100)
    let score = 0;

    if (hasSkillCategory && hasRequiredLevel && !isPenaltyBlocked && zoneSupported) {
      score += 40; // Base match

      // Skill Level Bonus
      if (techSkill && techSkill.level > currentInst.minSkillLevel) score += 10;

      // Zone Bonus
      if (isPrimaryZone) score += 20;
      else if (isSecondaryZone) score += 10;

      // Tier Bonus
      if (tech.tier === 'Gold') score += 15;
      else if (tech.tier === 'Silver') score += 10;
      else score += 5;

      // Rating Bonus
      score += Math.round((tech.rating / 5.0) * 15);

      // Deduct for Penalty Points
      score -= Math.round(tech.penaltyPoints / 5);

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
    };

    onConfirmBooking(newBooking);
    setLastBookingRef(refNum);
    setIsBookedSuccess(true);
  };

  return (
    <div className="space-y-6">
      {/* Engine Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
        <div className="flex items-center space-x-3 mb-2">
          <Sparkles className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Smart Booking & Scheduling Engine</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Real-time Slot Matching Active
          </span>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl">
          ระบบจับคู่ทีมช่างและเวลาติดตั้งอัจฉริยะ ทำงานประสานกับระบบ E-ordering เพื่อวิเคราะห์ Type of Installation, Skill Matrix Level, พื้นที่การให้บริการ (Zone), ภาระงานคงเหลือ และ Penalty Score ของช่างเพื่อแนะนำคิวที่ดีที่สุดให้อัตโนมัติ
        </p>
      </div>

      {isBookedSuccess ? (
        <div className="glass-panel p-8 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 text-center space-y-4 glow-emerald">
          <div className="h-16 w-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-bold text-white">ยืนยันการจองคิวช่างสำเร็จ! (Booking Locked)</h3>
          <p className="text-sm text-slate-300">
            หมายเลขอ้างอิงการจอง: <span className="font-mono font-bold text-emerald-300 text-base">{lastBookingRef}</span>
          </p>
          <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 text-left space-y-2">
            <div className="flex justify-between"><span className="text-slate-400">ลูกค้า:</span> <span className="font-semibold text-white">{customerName}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">งานติดตั้ง:</span> <span className="font-semibold text-white">{currentInst.name}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">วัน/เวลา:</span> <span className="font-semibold text-white">{bookingDate} ({currentSlot.startTime} - {currentSlot.endTime})</span></div>
            <div className="flex justify-between"><span className="text-slate-400">ทีมช่างที่ได้รับจัดคิว:</span> <span className="font-semibold text-emerald-400">{eligibleTechs[0]?.tech.name}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">สถานะ:</span> <span className="font-semibold text-indigo-400">พร้อม Dispatch ไปยัง KANNA System</span></div>
          </div>

          <div className="pt-4 flex justify-center space-x-3">
            <button
              onClick={() => setIsBookedSuccess(false)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-600/30"
            >
              ทำการจองงานใหม่ (Book Another Job)
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Booking Parameters Input */}
          <div className="lg:col-span-5 space-y-5 glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800">
              1. ระบุเงื่อนไขงานติดตั้ง (Requirements)
            </h3>

            {/* Installation Type Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                ประเภทงานติดตั้ง (Type of Installation)
              </label>
              <select
                value={selectedInstId}
                onChange={(e) => setSelectedInstId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {INITIAL_INSTALLATION_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} (Min Level {type.minSkillLevel})
                  </option>
                ))}
              </select>
            </div>

            {/* Auto-Calculated Skill Specs Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>หมวดหมู่ทักษะ (Skill Category):</span>
                <span className="font-semibold text-indigo-300">{currentInst.category}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>ระดับทักษะขั้นต่ำ (Min Skill Level):</span>
                <span className="px-2 py-0.5 rounded font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Level {currentInst.minSkillLevel}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>จำนวนช่างที่ต้องการ (Team Size):</span>
                <span className="font-semibold text-slate-200">{currentInst.requiredTeamSize} คน / ทีม</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>ระยะเวลาติดตั้งโดยประมาณ:</span>
                <span className="font-semibold text-slate-200">{currentInst.estDurationHours} ชั่วโมง</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-800 italic">
                "{currentInst.description}"
              </p>
            </div>

            {/* Service Zone Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1">
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                <span>พื้นที่บริการ (Service Zone / Address)</span>
              </label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
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
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  วันที่ต้องการติดตั้ง
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  รอบช่วงเวลา (Time Slot)
                </label>
                <select
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
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
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-400">ข้อมูลผู้ซื้อ / สถานที่ติดตั้ง (Customer Info)</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="ชื่อ-นามสกุล ลูกค้า"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="เบอร์โทรศัพท์"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Technician & Slot Matching Recommendation */}
          <div className="lg:col-span-7 space-y-5 glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
                2. ผลการแมตช์ทีมช่าง (Smart Skill & Queue Match Results)
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                พบช่างที่ตรงเงื่อนไข {eligibleTechs.length} / {technicians.length} ทีม
              </span>
            </div>

            {eligibleTechs.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400 space-y-2">
                <ShieldAlert className="h-10 w-10 text-amber-400 mx-auto" />
                <div className="font-semibold text-white">ไม่พบทีมช่างที่มี Skill Level และ Zone ครอบคลุมในขณะนี้</div>
                <p className="text-xs">
                  ช่างอาจติด Cooldown หรือมี Skill ไม่ถึง Level {currentInst.minSkillLevel} สำหรับงานหมวดนี้
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {sortedTechs.map((item, idx) => {
                  const { tech, techSkill, score, isEligible, isPenaltyBlocked } = item;
                  const isBestMatch = idx === 0 && isEligible;
                  const isSelected = selectedTechId ? selectedTechId === tech.id : isBestMatch;

                  return (
                    <div
                      key={tech.id}
                      onClick={() => isEligible && setSelectedTechId(tech.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        !isEligible
                          ? 'opacity-40 bg-slate-900/30 border-slate-800/50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-950/40 border-blue-500/80 glow-blue shadow-lg'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={tech.avatar}
                            alt={tech.name}
                            className="h-10 w-10 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white text-sm">{tech.name}</span>
                              {isBestMatch && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
                                  <Sparkles className="h-3 w-3 text-amber-400" />
                                  <span>แนะนำอันดับ 1</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
                              <span>โค้ด: <strong className="font-mono text-slate-300">{tech.code}</strong></span>
                              <span>• Tier: <strong className={tech.tier === 'Gold' ? 'text-amber-400' : tech.tier === 'Silver' ? 'text-slate-300' : 'text-rose-400'}>{tech.tier}</strong></span>
                              <span>• Rating: <strong className="text-amber-400">⭐ {tech.rating}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <div className="text-right">
                          <div className={`text-xl font-extrabold font-mono ${isEligible ? 'text-emerald-400' : 'text-slate-600'}`}>
                            {score}%
                          </div>
                          <div className="text-[10px] text-slate-500">Match Score</div>
                        </div>
                      </div>

                      {/* Technical Details & Penalty status */}
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400">ทักษะตรงหมวด:</span>
                          {techSkill ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {techSkill.category} (L{techSkill.level})
                            </span>
                          ) : (
                            <span className="text-rose-400 font-semibold">ไม่มี Skill หมวดนี้</span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-[11px]">
                          {isPenaltyBlocked ? (
                            <span className="text-rose-400 font-semibold flex items-center space-x-1">
                              <ShieldAlert className="h-3.5 w-3.5" />
                              <span>ติด Penalty Cooldown (ห้ามจ่ายงาน)</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              Penalty Score: <strong className={tech.penaltyPoints > 0 ? 'text-amber-400' : 'text-emerald-400'}>{tech.penaltyPoints} คะแนน</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Confirm Submit Button */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={eligibleTechs.length === 0}
                className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs md:text-sm transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <UserCheck className="h-4 w-4" />
                <span>ยืนยันการจองคิวช่าง & ล็อค Slot (Hold 15 mins)</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
