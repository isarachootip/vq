import React, { useState } from 'react';
import type { QueueBooking, Technician, ServiceItem } from '../types';
import { CustomDateInput } from './CustomDateInput';
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
  Phone,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Sparkles
} from 'lucide-react';

interface DashboardViewProps {
  bookings: QueueBooking[];
  technicians: Technician[];
  services: ServiceItem[];
  onDispatchToKanna: (bookingId: string) => void;
  onSelectBookingForSim: (booking: QueueBooking) => void;
  onConfirmBooking: (newBooking: QueueBooking) => void;
  onAssignTechnician?: (bookingId: string, techId: string, techName: string) => void;
}

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

export const DashboardView: React.FC<DashboardViewProps> = ({
  bookings,
  technicians,
  services,
  onDispatchToKanna,
  onSelectBookingForSim,
  onConfirmBooking,
  onAssignTechnician,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>('2026-07-24'); // Default to 24th to highlight demo data
  const [viewYear, setViewYear] = useState<number>(2026);
  const [viewMonth, setViewMonth] = useState<number>(7); // 1 = Jan, 7 = Jul
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Manual Booking Modal States
  const [showManualBookingModal, setShowManualBookingModal] = useState<boolean>(false);
  const [mTicketNo, setMTicketNo] = useState<string>('');
  const [mCustName, setMCustName] = useState<string>('');
  const [mCustPhone, setMCustPhone] = useState<string>('');
  const [mLineId, setMLineId] = useState<string>('');
  const [mCategoryCode, setMCategoryCode] = useState<string>('ALL');
  const [mServiceId, setMServiceId] = useState<string>(services[0]?.id || '');
  const [mRegion, setMRegion] = useState<'BKK' | 'UPC'>('BKK');
  const [mZone, setMZone] = useState<string>('Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา)');
  const [mLat, setMLat] = useState<string>('13.75633');
  const [mLng, setMLng] = useState<string>('100.50177');
  const [mDate, setMDate] = useState<string>('2026-07-24');
  const [mTimeSlot, setMTimeSlot] = useState<string>('Morning (09:00 - 12:00)');
  const [mSource, setMSource] = useState<'Line OA' | 'Call Center 1308' | 'Walk-in'>('Call Center 1308');
  const [mTicketError, setMTicketError] = useState<string>('');

  const generateRandomTicketNo = () => {
    // Generate 10-digit numeric ticket number
    const num = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setMTicketNo(num);
    setMTicketError('');
  };

  const matchCategoryGroup = (serviceCat: string, code: string) => {
    if (code === 'ALL') return true;
    const c = serviceCat.toLowerCase();
    if (code === 'CE') return c.includes('ปรับอากาศ') || c.includes('ce') || c.includes('แอร์');
    if (code === 'CEC') return c.includes('ล้าง') || c.includes('cec') || c.includes('ทำความสะอาด');
    if (code === 'SOLAR') return c.includes('โซล่า') || c.includes('solar') || c.includes('แสงอาทิตย์');
    if (code === 'FITIN') return c.includes('fit-in') || c.includes('built-in') || c.includes('เฟอร์นิเจอร์');
    if (code === 'ELEC') return c.includes('ไฟฟ้า') || c.includes('smart') || c.includes('electrical');
    if (code === 'FLOOR') return c.includes('พื้น') || c.includes('ผนัง') || c.includes('ฝ้า') || c.includes('flooring');
    if (code === 'PLUMB') return c.includes('ประปา') || c.includes('สุขภัณฑ์') || c.includes('ห้องน้ำ') || c.includes('plumbing');
    return true;
  };

  const filteredServicesForModal = services.filter((s) => matchCategoryGroup(s.category, mCategoryCode));

  const handleCategoryCodeChange = (code: string) => {
    setMCategoryCode(code);
    const matches = services.filter((s) => matchCategoryGroup(s.category, code));
    if (matches.length > 0) {
      setMServiceId(matches[0].id);
    }
  };

  // Assign Technician Modal States
  const [assignModalBooking, setAssignModalBooking] = useState<QueueBooking | null>(null);
  const [selectedTechIdForAssign, setSelectedTechIdForAssign] = useState<string>('');

  const handleOpenAssignModal = (b: QueueBooking) => {
    setAssignModalBooking(b);
    const eligible = technicians.filter(
      (t) => t.status !== 'In Cooldown' && t.tier !== 'Cooldown'
    );
    if (eligible.length > 0) {
      setSelectedTechIdForAssign(eligible[0].id);
    }
  };

  const handleConfirmAssignTech = () => {
    if (!assignModalBooking || !selectedTechIdForAssign) return;
    const tech = technicians.find((t) => t.id === selectedTechIdForAssign);
    if (!tech) return;

    if (onAssignTechnician) {
      onAssignTechnician(assignModalBooking.id, tech.id, tech.name);
    } else {
      assignModalBooking.assignedTechTeamId = tech.id;
      assignModalBooking.assignedTechTeamName = tech.name;
      assignModalBooking.status = 'Scheduled';
    }

    setAssignModalBooking(null);
  };

  const unassignedCount = bookings.filter(
    (b) => !b.assignedTechTeamId || b.assignedTechTeamId === '' || b.status === 'Pending Dispatch'
  ).length;

  const handleAutoAssignAllPending = () => {
    const unassigned = bookings.filter(
      (b) => !b.assignedTechTeamId || b.assignedTechTeamId === '' || b.status === 'Pending Dispatch'
    );
    const eligibleTechs = technicians.filter(
      (t) => t.status !== 'In Cooldown' && t.tier !== 'Cooldown'
    );
    if (eligibleTechs.length === 0) return;

    unassigned.forEach((b, idx) => {
      const chosenTech = eligibleTechs[idx % eligibleTechs.length];
      if (onAssignTechnician) {
        onAssignTechnician(b.id, chosenTech.id, chosenTech.name);
      } else {
        b.assignedTechTeamId = chosenTech.id;
        b.assignedTechTeamName = chosenTech.name;
        b.status = 'Scheduled';
      }
    });
  };

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

  // Dynamic calendar parameters based on viewYear and viewMonth
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayOfWeek });
  const weekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Format YYYY-MM-DD date string to dd/mm/yyyy
  const formatDateDDMMYYYY = (dateStr: string | null) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  };

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
    const ddmmyyyy = formatDateDDMMYYYY(dateStr);
    return `คิวติดตั้งประจำวันที่ ${ddmmyyyy} (${parseInt(day)} ${thaiMonths[parseInt(month) - 1]} ${parseInt(year) + 543})`;
  };

  const handleManualBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMTicketError('');

    // Ticket Number 10 digits validation
    const cleanedTicket = mTicketNo.trim();
    if (!cleanedTicket || !/^\d{10}$/.test(cleanedTicket)) {
      setMTicketError('❌ เลขที่ Ticket ต้องเป็นตัวเลข 10 หลักเท่านั้น (เช่น 1092837465)');
      return;
    }

    if (!mCustName.trim() || !mCustPhone.trim()) return;

    const selectedService = services.find(s => s.id === mServiceId);
    if (!selectedService) return;

    const randomDigits = Math.floor(Math.random() * 90 + 10);
    const bookingRef = `BK-${mDate}-${randomDigits}`;

    const newBooking: QueueBooking = {
      id: `booking-manual-${Date.now()}`,
      bookingRef,
      ticketNo: cleanedTicket,
      customerName: mCustName,
      customerPhone: mCustPhone,
      lineId: mLineId,
      bookingDate: mDate,
      timeSlot: mTimeSlot,
      createdFrom: mSource,
      addressZone: mZone,
      latitude: parseFloat(mLat) || 13.75633,
      longitude: parseFloat(mLng) || 100.50177,
      installationTypeId: selectedService.id,
      installationTypeName: selectedService.name,
      requiredSkillLevel: selectedService.requiredSkillLevel,
      assignedTechTeamId: undefined,
      status: 'Pending Dispatch',
      createdAt: new Date().toISOString()
    };

    onConfirmBooking(newBooking);
    
    // Reset Form
    setMTicketNo('');
    setMCustName('');
    setMCustPhone('');
    setMLineId('');
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
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3 flex-wrap">
            <div className="flex items-center space-x-1.5">
              <CalendarIcon className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-slate-800 text-sm">📅 ปฏิทินกำหนดการงานติดตั้ง</h3>
            </div>
            
            {/* Month & Year Selectors */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg bg-white hover:bg-slate-200 text-slate-700 transition cursor-pointer shadow-xs border-0 flex items-center justify-center"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft size={16} />
              </button>

              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="bg-white border-0 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer shadow-xs"
              >
                {thaiMonths.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="bg-white border-0 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer shadow-xs"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y + 543} ({y})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg bg-white hover:bg-slate-200 text-slate-700 transition cursor-pointer shadow-xs border-0 flex items-center justify-center"
                title="เดือนถัดไป"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {selectedDate && (
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
                <span>วันที่เลือก:</span>
                <span className="text-blue-700 font-extrabold">{formatDateDDMMYYYY(selectedDate)}</span>
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {unassignedCount > 0 && (
              <button
                onClick={handleAutoAssignAllPending}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full cursor-pointer shadow-sm border-0 transition flex items-center gap-1.5 animate-pulse"
                title="ระบบจะวิเคราะห์หาช่างและจัดคิวให้อัตโนมัติทุกรายการที่รอจัดสรร"
              >
                <Sparkles size={14} />
                <span>🤖 จัดสรรช่างให้อัตโนมัติ ({unassignedCount})</span>
              </button>
            )}

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

            {/* Days in month cells */}
            {calendarDays.map((day) => {
              const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const ddmmyyyy = `${String(day).padStart(2, '0')}/${String(viewMonth).padStart(2, '0')}/${viewYear}`;
              const count = getBookingsCountForDate(dateStr);
              const summary = getBookingsStatusSummary(dateStr);
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  title={`วันที่ ${ddmmyyyy}`}
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
                        {b.ticketNo && (
                          <div className="text-[10px] font-bold text-amber-700 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded w-fit mt-0.5">
                            🎫 Ticket: {b.ticketNo}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 mt-0.5 font-bold">📅 {formatDateDDMMYYYY(b.bookingDate)} | {b.timeSlot}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">จาก {b.createdFrom}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                          <span>{b.customerName}</span>
                          {b.lineId && (
                            <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
                              LINE: {b.lineId}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{b.addressZone}</span>
                        </div>
                        {b.latitude && b.longitude && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[9px] text-blue-600 font-mono font-bold hover:underline block mt-0.5"
                          >
                            📍 {b.latitude.toFixed(4)}, {b.longitude.toFixed(4)} ↗
                          </a>
                        )}
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
                          <div className="flex flex-col space-y-1 items-start">
                            <span className="text-amber-600 font-bold italic text-[11px]">ยังไม่ได้จัดสรรช่าง</span>
                            <button
                              onClick={() => handleOpenAssignModal(b)}
                              className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-[9px] transition flex items-center space-x-1 shadow-xs border-0 cursor-pointer animate-pulse"
                            >
                              <UserCheck className="h-3 w-3" />
                              <span>จัดสรรช่าง</span>
                            </button>
                          </div>
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
                          {!assignedTech && (
                            <button
                              onClick={() => handleOpenAssignModal(b)}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition flex items-center space-x-1 shadow-sm border-0 cursor-pointer"
                            >
                              <UserCheck className="h-3 w-3" />
                              <span>จัดสรรช่าง</span>
                            </button>
                          )}

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
              
              {/* Ticket No Row */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className="text-amber-600">🎫</span>
                    <span>เลขที่ตั๋วงาน (Ticket No.) — 10 หลัก:</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomTicketNo}
                    className="text-[10px] font-bold text-amber-700 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded cursor-pointer transition border border-amber-500/30"
                  >
                    🎲 สุ่มเลข Ticket 10 หลัก
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="กรอกเลขตั๋ว 10 หลัก เช่น 1092837465"
                  value={mTicketNo}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setMTicketNo(val);
                    if (val.length === 10) setMTicketError('');
                    else if (val.length > 0) setMTicketError('⚠️ ต้องป้อนตัวเลขให้ครบ 10 หลัก (ปัจจุบัน ' + val.length + '/10)');
                  }}
                  className="v-input w-full py-2 font-mono text-sm font-black text-amber-900 tracking-widest bg-white"
                />
                {mTicketError && <p className="text-[10px] text-rose-600 font-bold">{mTicketError}</p>}
              </div>

              {/* Customer Info row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">LINE ID (ไลน์ไอดี):</label>
                  <input
                    type="text"
                    placeholder="เช่น @somkiat หรือ somkiat_line"
                    value={mLineId}
                    onChange={(e) => setMLineId(e.target.value)}
                    className="v-input w-full py-2 font-mono text-emerald-700"
                  />
                </div>
              </div>

              {/* Service & Category Grouping Row (1.0 -> 2.0) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-xs flex items-center gap-1">
                    <span className="bg-amber-500 text-slate-900 px-1.5 py-0.2 rounded text-[10px] font-black">1.0</span>
                    <span>เลือกหมวดหมู่งานติดตั้ง (Category Group):</span>
                  </label>
                  <select
                    value={mCategoryCode}
                    onChange={(e) => handleCategoryCodeChange(e.target.value)}
                    className="v-input w-full py-2 bg-amber-50/40 border-amber-500/50 font-semibold text-slate-800"
                  >
                    {CATEGORY_GROUPS.map((cg) => (
                      <option key={cg.code} value={cg.code}>
                        {cg.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-xs">2. เลือกบริการงานติดตั้ง (Service Item):</label>
                  <select
                    value={mServiceId}
                    onChange={(e) => setMServiceId(e.target.value)}
                    className="v-input w-full py-2 font-medium"
                  >
                    {filteredServicesForModal.length === 0 ? (
                      <option value="">-- ไม่พบบริการในหมวดหมู่นี้ --</option>
                    ) : (
                      filteredServicesForModal.map((s) => (
                        <option key={s.id} value={s.id}>
                          [{s.category}] {s.name} (Min Level: {s.requiredSkillLevel})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-xs">🌏 เลือกประเภทพื้นที่ (Region Type):</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMRegion('BKK');
                        setMZone('Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา)');
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs border cursor-pointer transition ${
                        mRegion === 'BKK' 
                          ? 'bg-amber-500 text-slate-900 border-amber-600 shadow-xs' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🏙️ BKK (กรุงเทพฯ และปริมณฑล)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMRegion('UPC');
                        setMZone('Zone UPC-N1: เชียงใหม่ - ลำพูน');
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs border cursor-pointer transition ${
                        mRegion === 'UPC' 
                          ? 'bg-amber-500 text-slate-900 border-amber-600 shadow-xs' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🏞️ UPC (ต่างจังหวัด / ภูมิภาค)
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-xs">📍 เลือกโซนพื้นที่ให้บริการ ({mRegion}):</label>
                  <select
                    value={mZone}
                    onChange={(e) => setMZone(e.target.value)}
                    className="v-input w-full py-2 bg-white font-semibold text-slate-800"
                  >
                  {mRegion === 'BKK' ? (
                    <>
                      <option value="Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา)">Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา - ประเวศ)</option>
                      <option value="Zone 2: นนทบุรี (ราชพฤกษ์ - แจ้งวัฒนะ)">Zone 2: นนทบุรี (ราชพฤกษ์ - ปากเกร็ด - แจ้งวัฒนะ)</option>
                      <option value="Zone 3: ปทุมธานี (รังสิต - ลำลูกกา)">Zone 3: ปทุมธานี (รังสิต - คลองหลวง - ลำลูกกา)</option>
                      <option value="Zone 4: สมุทรปราการ (เทพารักษ์ - ศรีนครินทร์)">Zone 4: สมุทรปราการ (เทพารักษ์ - บางพลี - ศรีนครินทร์)</option>
                      <option value="Zone 5: กรุงเทพฯ ฝั่งธนบุรี (ตลิ่งชัน - บางแค)">Zone 5: กรุงเทพฯ ฝั่งธนบุรี (ตลิ่งชัน - บางแค - เพชรเกษม)</option>
                      <option value="Zone 6: กรุงเทพฯ ตอนเหนือ (จตุจักร - ลาดพร้าว)">Zone 6: กรุงเทพฯ ตอนเหนือ (จตุจักร - ลาดพร้าว - สายไหม)</option>
                    </>
                  ) : (
                    <>
                      <option value="Zone UPC-N1: เชียงใหม่ - ลำพูน">Zone UPC-N1: ภาคเหนือ (เชียงใหม่ - ลำพูน - เชียงราย)</option>
                      <option value="Zone UPC-NE1: ขอนแก่น - อุดรธานี">Zone UPC-NE1: ภาคอีสาน (ขอนแก่น - อุดรธานี - นครราชสีมา)</option>
                      <option value="Zone UPC-E1: ชลบุรี - ระยอง">Zone UPC-E1: ภาคตะวันออก (ชลบุรี - พัทยา - ระยอง)</option>
                      <option value="Zone UPC-S1: ภูเก็ต - สุราษฎร์ธานี">Zone UPC-S1: ภาคใต้ (ภูเก็ต - สุราษฎร์ธานี - หาดใหญ่)</option>
                      <option value="Zone UPC-W1: นครปฐม - ราชบุรี">Zone UPC-W1: ภาคตะวันตก (นครปฐม - ราชบุรี - กาญจนบุรี)</option>
                      <option value="Zone UPC-C1: พิษณุโลก - นครสวรรค์">Zone UPC-C1: ภาคกลางบน (พิษณุโลก - นครสวรรค์ - พิจิตร)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

              {/* Date & Time slot */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">วันที่นัดหมายติดตั้ง:</label>
                  <CustomDateInput
                    required
                    value={mDate}
                    onChange={(val) => setMDate(val)}
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

      {/* 6. Assign Technician Modal */}
      {assignModalBooking && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-slate-900/60 animate-fadeIn">
          <div className="v-panel p-6 bg-white w-full max-w-lg border border-slate-200 rounded-2xl shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-sm font-bold text-slate-800">
                <UserCheck className="h-5 w-5 text-emerald-600" />
                <span>⚡ จัดสรรทีมช่างให้แก่คิวงาน: <span className="font-mono text-blue-700">{assignModalBooking.bookingRef}</span></span>
              </div>
              <button 
                onClick={() => setAssignModalBooking(null)}
                className="text-slate-400 hover:text-slate-600 text-sm border-0 bg-transparent font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Booking Details */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">ชื่อลูกค้า:</span>
                <span className="font-bold text-slate-800">{assignModalBooking.customerName} ({assignModalBooking.customerPhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">ประเภทงานติดตั้ง:</span>
                <span className="font-bold text-blue-700">{assignModalBooking.installationTypeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">โซนที่อยู่:</span>
                <span className="font-semibold">{assignModalBooking.addressZone}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">วัน/เวลานัดหมาย:</span>
                <span className="font-semibold text-slate-800">{formatDateDDMMYYYY(assignModalBooking.bookingDate)} | {assignModalBooking.timeSlot}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="font-semibold text-slate-500">ทักษะที่ต้องการ:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Skill Level {assignModalBooking.requiredSkillLevel}
                </span>
              </div>
            </div>

            {/* Select Technician */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">เลือกทีมช่างที่ต้องการมอบหมายงาน (Smart Match):</label>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {technicians
                  .filter((t) => t.status !== 'In Cooldown' && t.tier !== 'Cooldown')
                  .map((tech, idx) => {
                    const isSelected = selectedTechIdForAssign === tech.id;
                    const hasSkill = tech.skills.some((s) => s.level >= (assignModalBooking.requiredSkillLevel || 1));
                    return (
                      <div
                        key={tech.id}
                        onClick={() => setSelectedTechIdForAssign(tech.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-400/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={tech.avatar}
                            alt={tech.name}
                            className="h-9 w-9 rounded-lg object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                              <span>{tech.name}</span>
                              {idx === 0 && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-400 text-slate-900 shadow-2xs">
                                  ⭐ Rank #1 Match
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                              <span className={tech.tier === 'Gold' ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                                {tech.tier} Tier
                              </span>
                              <span>• ⭐ {tech.rating}</span>
                              <span>• {tech.primaryZone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          {hasSkill ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ทักษะตรงสาย
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                              ทักษะทั่วไป
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setAssignModalBooking(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer border-0"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={!selectedTechIdForAssign}
                onClick={handleConfirmAssignTech}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer border-0 shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
              >
                <UserCheck className="h-4 w-4" />
                <span>✅ ยืนยันจัดสรรช่างทีมนี้</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
