import React, { useState } from 'react';
import type { QueueBooking, Technician, ServiceItem } from '../types';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  Filter, 
  MapPin, 
  ShieldAlert, 
  ArrowRight, 
  Layers, 
  Calendar as CalendarIcon,
  Info,
  Phone
} from 'lucide-react';

interface DashboardViewProps {
  bookings: QueueBooking[];
  technicians: Technician[];
  services: ServiceItem[];
  onDispatchToKanna: (bookingId: string) => void;
  onSelectBookingForSim: (booking: QueueBooking) => void;
  onConfirmBooking: (newBooking: QueueBooking) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  bookings,
  technicians,
  services,
  onDispatchToKanna,
  onSelectBookingForSim,
  onConfirmBooking,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>('2026-07-24'); // Default to 24th to highlight demo data
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Manual Booking Modal States
  const [showManualBookingModal, setShowManualBookingModal] = useState<boolean>(false);
  const [mCustName, setMCustName] = useState<string>('');
  const [mCustPhone, setMCustPhone] = useState<string>('');
  const [mServiceId, setMServiceId] = useState<string>(services[0]?.id || '');
  const [mZone, setMZone] = useState<string>('Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา)');
  const [mDate, setMDate] = useState<string>('2026-07-24');
  const [mTimeSlot, setMTimeSlot] = useState<string>('Morning (09:00 - 12:00)');
  const [mSource, setMSource] = useState<'Line OA' | 'Call Center 1308' | 'Walk-in'>('Call Center 1308');

  // 1. Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesDate = !selectedDate || b.bookingDate === selectedDate;
    const matchesZone = selectedZone === 'ALL' || b.addressZone.includes(selectedZone);
    const matchesStatus = selectedStatus === 'ALL' || b.status === selectedStatus;
    const matchesSearch =
      b.bookingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.installationTypeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDate && matchesZone && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: QueueBooking['status']) => {
    switch (status) {
      case 'Pending Dispatch':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Dispatched to KANNA':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'STS In-Progress':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'QC Inspection':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Passed (Closed)':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Penalty E-CN Issued':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Calendar parameters for July 2026 (Wednesday is 1st, 31 days)
  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: 3 }); // Wednesday offset (Sun, Mon, Tue empty)
  const weekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  const getBookingsCountForDate = (dateStr: string) => {
    return bookings.filter((b) => b.bookingDate === dateStr).length;
  };

  const getBookingsStatusSummary = (dateStr: string) => {
    const list = bookings.filter((b) => b.bookingDate === dateStr);
    const pending = list.filter(b => b.status === 'Pending Dispatch' || b.status === 'Scheduled').length;
    const active = list.filter(b => b.status === 'Dispatched to KANNA' || b.status === 'STS In-Progress').length;
    const closed = list.filter(b => b.status === 'Passed (Closed)').length;
    return { pending, active, closed };
  };

  const formatDateThai = (dateStr: string | null) => {
    if (!dateStr) return 'คิวงานทั้งหมดทุกวัน';
    const [year, month, day] = dateStr.split('-');
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return `คิวติดตั้งประจำวันที่ ${parseInt(day)} ${thaiMonths[parseInt(month) - 1]} ${parseInt(year) + 543}`;
  };

  const handleManualBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mCustName.trim() || !mCustPhone.trim()) return;

    const selectedService = services.find(s => s.id === mServiceId);
    if (!selectedService) return;

    const randomDigits = Math.floor(Math.random() * 90 + 10);
    const bookingRef = `BK-${mDate}-${randomDigits}`;

    const newBooking: QueueBooking = {
      id: `booking-manual-${Date.now()}`,
      bookingRef,
      customerName: mCustName,
      customerPhone: mCustPhone,
      bookingDate: mDate,
      timeSlot: mTimeSlot,
      createdFrom: mSource,
      addressZone: mZone,
      installationTypeId: selectedService.id,
      installationTypeName: selectedService.name,
      requiredSkillLevel: selectedService.requiredSkillLevel,
      assignedTechTeamId: undefined,
      status: 'Pending Dispatch',
      createdAt: new Date().toISOString()
    };

    onConfirmBooking(newBooking);
    
    // Reset Form
    setMCustName('');
    setMCustPhone('');
    setMServiceId(services[0]?.id || '');
    setShowManualBookingModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Top KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="v-panel p-4 flex items-center space-x-4 bg-white border border-slate-200">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {bookings.filter((b) => b.status === 'Pending Dispatch' || b.status === 'Scheduled').length}
            </div>
            <div className="text-xs text-slate-500 font-medium">คิวจัดเตรียมงาน (Pending)</div>
          </div>
        </div>

        <div className="v-panel p-4 flex items-center space-x-4 bg-white border border-slate-200">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Send className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {bookings.filter((b) => b.status === 'Dispatched to KANNA' || b.status === 'STS In-Progress').length}
            </div>
            <div className="text-xs text-slate-500 font-medium">งานใน KANNA / STS</div>
          </div>
        </div>

        <div className="v-panel p-4 flex items-center space-x-4 bg-white border border-slate-200">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {bookings.filter((b) => b.status === 'Passed (Closed)').length}
            </div>
            <div className="text-xs text-slate-500 font-medium">ผ่าน QC ปิดงานแล้ว</div>
          </div>
        </div>

        <div className="v-panel p-4 flex items-center space-x-4 bg-white border border-slate-200">
          <div className="p-3 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {bookings.filter((b) => b.status === 'Penalty E-CN Issued').length}
            </div>
            <div className="text-xs text-slate-500 font-medium">โดนค่าปรับ (Penalty E-CN)</div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Calendar Panel */}
      <div className="v-panel p-5 bg-white border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-amber-500" />
            <h3 className="font-bold text-slate-800 text-sm">📅 ปฏิทินกำหนดการงานติดตั้ง (July 2026)</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowManualBookingModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full cursor-pointer shadow-sm border-0 transition flex items-center gap-1.5"
            >
              <span>➕ บันทึกคิวจอง (Line / โทรศัพท์)</span>
            </button>

            <button
              onClick={() => setSelectedDate(null)}
              className={`px-3 py-1.5 rounded-full font-bold text-xs cursor-pointer border transition flex items-center gap-1.5 ${
                selectedDate === null 
                  ? 'bg-amber-500 border-amber-600 text-slate-900 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              📋 แสดงงานติดตั้งทั้งหมดทุกวัน
            </button>
          </div>
        </div>

        {/* Calendar Grid wrapper */}
        <div className="max-w-3xl mx-auto">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center font-bold text-[11px] text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100">
            {weekdays.map((w, idx) => (
              <span key={w} className={idx === 0 ? 'text-rose-500' : idx === 6 ? 'text-blue-500' : ''}>
                {w}
              </span>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-1.5 pt-2 text-xs">
            {/* Blank padding cells */}
            {paddingDays.map((_, i) => (
              <div key={`pad-${i}`} className="min-h-16 bg-slate-50/50 rounded-lg border border-transparent"></div>
            ))}

            {/* July 1 to 31 cells */}
            {calendarDays.map((day) => {
              const dateStr = `2026-07-${String(day).padStart(2, '0')}`;
              const count = getBookingsCountForDate(dateStr);
              const summary = getBookingsStatusSummary(dateStr);
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-16 p-1.5 rounded-lg border flex flex-col justify-between transition cursor-pointer select-none ${
                    isSelected
                      ? 'bg-amber-500 border-amber-600 text-slate-900 shadow-md scale-103 font-bold ring-1 ring-amber-400'
                      : count > 0
                      ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/30 text-slate-800'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-[11px] font-bold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>{day}</span>
                    {count > 0 && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    )}
                  </div>

                  {count > 0 ? (
                    <div className="space-y-0.5 mt-1 text-center">
                      <span className={`px-1 py-0.5 rounded text-[8px] font-black tracking-wide block border ${
                        isSelected 
                          ? 'bg-slate-950 text-amber-400 border-slate-950 shadow-inner' 
                          : 'bg-amber-500 text-slate-900 border-amber-500/30'
                      }`}>
                        {count} คิวงาน
                      </span>
                      {/* Mini breakdown dots */}
                      <div className="flex justify-center gap-0.5 text-[7px] font-bold">
                        {summary.pending > 0 && <span className={isSelected ? 'text-slate-900' : 'text-amber-600'}>⏳{summary.pending}</span>}
                        {summary.active > 0 && <span className={isSelected ? 'text-slate-900' : 'text-indigo-600'}>🏃{summary.active}</span>}
                        {summary.closed > 0 && <span className={isSelected ? 'text-slate-900' : 'text-emerald-600'}>✅{summary.closed}</span>}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[8px] text-slate-300 italic block text-right">ว่าง</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 justify-center">
          <Info className="h-3.5 w-3.5 text-slate-400" />
          <span>คลิกเลือกวันที่ในตารางปฏิทินด้านบน เพื่อเจาะลึกคิวงานและใช้ตัวกรองสืบค้นเฉพาะวันนั้น ๆ</span>
        </div>
      </div>

      {/* 3. Filter & Search Bar */}
      <div className="v-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
            <Filter className="h-4 w-4 text-amber-500" />
            <span>ตัวกรองคิวติดตั้ง:</span>
          </div>

          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="v-input py-1 text-xs"
          >
            <option value="ALL">ทุกโซนบริการ</option>
            <option value="Zone 1">Zone 1: สุขุมวิท - บางนา</option>
            <option value="Zone 2">Zone 2: ราชพฤกษ์ - แจ้งวัฒนะ</option>
            <option value="Zone 3">Zone 3: รังสิต - ลำลูกกา</option>
            <option value="Zone 4">Zone 4: เทพารักษ์ - ศรีนครินทร์</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="v-input py-1 text-xs"
          >
            <option value="ALL">ทุกสถานะงาน</option>
            <option value="Pending Dispatch">Pending Dispatch</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Dispatched to KANNA">Dispatched to KANNA</option>
            <option value="STS In-Progress">STS In-Progress</option>
            <option value="QC Inspection">QC Inspection</option>
            <option value="Passed (Closed)">Passed (Closed)</option>
            <option value="Penalty E-CN Issued">Penalty E-CN Issued</option>
          </select>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหา Ref, ชื่อลูกค้า, หรือประเภทงาน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="v-input w-full md:w-72 pl-9 py-1 text-xs rounded-full"
          />
          <Layers className="h-4 w-4 text-slate-400 absolute left-3 top-2" />
        </div>
      </div>

      {/* 4. Main Queue List Table */}
      <div className="v-panel overflow-hidden bg-white border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm md:text-base font-bold text-slate-800">{formatDateThai(selectedDate)}</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-900 font-bold border border-amber-500/20">
              {filteredBookings.length} รายการ
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">ข้อมูลอิงตามวันที่เลือกและตัวกรองค้นหาด้านบน</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="v-table">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Booking Ref / วันเวลา</th>
                <th className="px-4 py-3 text-left">ลูกค้า / โซน</th>
                <th className="px-4 py-3 text-left">ประเภทงานติดตั้ง</th>
                <th className="px-4 py-3 text-left">Skill Level Required</th>
                <th className="px-4 py-3 text-left">ทีมช่างที่ได้รับมอบหมาย</th>
                <th className="px-4 py-3 text-left">สถานะ (Status)</th>
                <th className="px-4 py-3 text-right">ดำเนินการ (Actions)</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                    ไม่พบรายการคิวงานติดตั้งสำหรับตัวกรองและวันที่เลือก
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const assignedTech = technicians.find((t) => t.id === b.assignedTechTeamId);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono">
                        <div className="font-bold text-slate-800">{b.bookingRef}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{b.bookingDate} | {b.timeSlot}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">จาก {b.createdFrom}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{b.customerName}</div>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{b.addressZone}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {b.installationTypeName}
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          Skill Level {b.requiredSkillLevel}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {assignedTech ? (
                          <div className="flex items-center space-x-2">
                            <img
                              src={assignedTech.avatar}
                              alt={assignedTech.name}
                              className="h-7 w-7 rounded-lg object-cover border border-slate-200"
                            />
                            <div>
                              <div className="font-semibold text-slate-800 text-[10px]">{assignedTech.name}</div>
                              <div className="flex items-center space-x-2 text-[9px] text-slate-500">
                                <span className={
                                  assignedTech.tier === 'Gold' ? 'text-amber-600 font-bold' :
                                  assignedTech.tier === 'Silver' ? 'text-slate-500 font-bold' :
                                  assignedTech.tier === 'Cooldown' ? 'text-rose-600 font-bold' : 'text-slate-500'
                                }>
                                  {assignedTech.tier} Tier
                                </span>
                                <span>• ⭐ {assignedTech.rating}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-semibold italic">ยังไม่ได้จัดสรรช่าง</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(b.status)}`}>
                          {b.status}
                        </span>
                        {b.penaltyRef && (
                          <div className="text-[9px] text-rose-600 font-mono mt-1 flex items-center space-x-0.5">
                            <ShieldAlert className="h-3 w-3 animate-pulse" />
                            <span>{b.penaltyRef}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {b.status === 'Scheduled' && (
                            <button
                              onClick={() => onDispatchToKanna(b.id)}
                              className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-[10px] transition flex items-center space-x-1 shadow-sm border-0 cursor-pointer"
                            >
                              <Send className="h-3 w-3" />
                              <span>ส่ง KANNA</span>
                            </button>
                          )}

                          <button
                            onClick={() => onSelectBookingForSim(b)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px] transition flex items-center space-x-1 font-semibold cursor-pointer"
                          >
                            <span>จำลอง Flow</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Manual Booking Form Modal */}
      {showManualBookingModal && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-slate-900/60 animate-fadeIn">
          <div className="v-panel p-6 bg-white w-full max-w-lg border border-slate-200 rounded-2xl shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-sm font-bold text-slate-800">
                <Phone className="h-5 w-5 text-amber-500" />
                <span>📝 บันทึกจองบริการติดตั้งใหม่ (ผู้ดูแลระบบหลังบ้านป้อนเอง)</span>
              </div>
              <button 
                onClick={() => setShowManualBookingModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm border-0 bg-transparent font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualBookingSubmit} className="space-y-4">
              
              {/* Customer Info row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">ชื่อลูกค้า:</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น คุณสมเกียรติ มั่นคง"
                    value={mCustName}
                    onChange={(e) => setMCustName(e.target.value)}
                    className="v-input w-full py-2"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">เบอร์โทรศัพท์ลูกค้า:</label>
                  <input
                    type="tel"
                    required
                    placeholder="เช่น 089-1234567"
                    value={mCustPhone}
                    onChange={(e) => setMCustPhone(e.target.value)}
                    className="v-input w-full py-2"
                  />
                </div>
              </div>

              {/* Service & Zone row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">เลือกบริการงานติดตั้ง:</label>
                  <select
                    value={mServiceId}
                    onChange={(e) => setMServiceId(e.target.value)}
                    className="v-input w-full py-2"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Min Level: {s.requiredSkillLevel})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">โซนพื้นที่ให้บริการ:</label>
                  <select
                    value={mZone}
                    onChange={(e) => setMZone(e.target.value)}
                    className="v-input w-full py-2"
                  >
                    <option value="Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา)">Zone 1: สุขุมวิท - บางนา</option>
                    <option value="Zone 2: นนทบุรี (ราชพฤกษ์ - แจ้งวัฒนะ)">Zone 2: ราชพฤกษ์ - แจ้งวัฒนะ</option>
                    <option value="Zone 3: ปทุมธานี (รังสิต - ลำลูกกา)">Zone 3: รังสิต - ลำลูกกา</option>
                    <option value="Zone 4: สมุทรปราการ (เทพารักษ์ - ศรีนครินทร์)">Zone 4: เทพารักษ์ - ศรีนครินทร์</option>
                  </select>
                </div>
              </div>

              {/* Date & Time slot */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">วันที่นัดหมายติดตั้ง:</label>
                  <input
                    type="date"
                    required
                    value={mDate}
                    onChange={(e) => setMDate(e.target.value)}
                    className="v-input w-full py-2 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">ช่วงเวลาปฏิบัติงาน:</label>
                  <select
                    value={mTimeSlot}
                    onChange={(e) => setMTimeSlot(e.target.value)}
                    className="v-input w-full py-2"
                  >
                    <option value="Morning (09:00 - 12:00)">Morning (09:00 - 12:00)</option>
                    <option value="Afternoon (13:00 - 17:00)">Afternoon (13:00 - 17:00)</option>
                    <option value="Full Day">Full Day (เต็มวัน)</option>
                  </select>
                </div>
              </div>

              {/* Source selection */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-600">ช่องทางการติดต่อที่ส่งข้อมูลเข้ามา:</label>
                <div className="flex gap-4">
                  {(['Line OA', 'Call Center 1308', 'Walk-in'] as const).map((src) => (
                    <label key={src} className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded-lg hover:bg-slate-50 flex-1 justify-center">
                      <input
                        type="radio"
                        name="createdFrom"
                        checked={mSource === src}
                        onChange={() => setMSource(src)}
                        className="accent-amber-500 scale-110"
                      />
                      <span className="font-semibold text-slate-700">{src}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualBookingModal(false)}
                  className="v-btn-secondary py-2 px-4 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="v-btn-primary py-2 px-5 cursor-pointer"
                >
                  บันทึกตั๋วคิวงานติดตั้ง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
