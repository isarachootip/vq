import React, { useState, useMemo } from 'react';
import type { QueueBooking, PenaltyRecord } from '../types';
import {
  Folder,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar,
  Users,
  FileText,
  ChevronRight
} from 'lucide-react';

interface InstallationAnalyticsViewProps {
  bookings: QueueBooking[];
  penalties?: PenaltyRecord[];
}

export const InstallationAnalyticsView: React.FC<InstallationAnalyticsViewProps> = ({
  bookings,
  penalties: _penalties = []
}) => {
  const [dashboardView, setDashboardView] = useState<'my' | 'company'>('company');
  const [selectedRegion, setSelectedRegion] = useState<'ALL' | 'BKK' | 'UPC'>('ALL');

  // Helper to map booking to a value (simulating project budget)
  const getBookingValue = (b: QueueBooking) => {
    switch (b.installationTypeId) {
      case 'inst-built-kitchen':
        return 150000;
      case 'inst-aircon-multi':
        return 45000;
      case 'inst-flooring-laminate':
        return 35000;
      case 'inst-built-closet':
        return 80000;
      case 'inst-smart-home':
        return 25000;
      case 'inst-curtains-motor':
        return 40000;
      default:
        return 30000;
    }
  };

  // Helper to map booking to one of the 5 stages
  const getStageIndex = (b: QueueBooking) => {
    if (b.installationTypeId.includes('kitchen') || b.requiredSkillLevel === 3) return 4; // คุยกับลูกค้า
    if (b.createdFrom.includes('Selling') || b.status === 'Scheduled') return 3; // Submit to Sales
    if (b.createdFrom.includes('COOHOM')) return 2; // Design & Proposal
    if (b.requiredSkillLevel === 2) return 1; // Survey for Design
    return 0; // Design for Purchase (No Survey)
  };

  const stagesDefinition = [
    { id: 1, title: 'Design for Purchase (No Survey)', color: '#3b82f6' },
    { id: 2, title: 'Survey for Design (by Area Size)', color: '#10b981' },
    { id: 3, title: 'Design & Proposal', color: '#f59e0b' },
    { id: 4, title: 'Submit to Sales', color: '#6366f1' },
    { id: 5, title: 'คุยกับลูกค้า', color: '#8b5cf6' }
  ];

  // Region check function (consistent with DashboardView)
  const isBkkZone = (addressZone: string): boolean => {
    const upper = addressZone.toUpperCase();
    if (upper.includes('[UPC]')) return false;
    return (
      upper.includes('[BKK]') ||
      upper.includes('BKK') ||
      upper.includes('กรุงเทพ') ||
      upper.includes('นนทบุรี') ||
      upper.includes('ปทุมธานี') ||
      upper.includes('สมุทรปราการ')
    );
  };

  // 1. Filter bookings based on view tab and region
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Region Filter
      const isBkk = isBkkZone(b.addressZone);
      const matchesRegion =
        selectedRegion === 'ALL' ||
        (selectedRegion === 'BKK' && isBkk) ||
        (selectedRegion === 'UPC' && !isBkk);

      // View mode (mocking My Tasks filter where only some bookings belong to current coordinator)
      const matchesView =
        dashboardView === 'company' ||
        (dashboardView === 'my' && (b.requiredSkillLevel === 3 || b.status === 'Scheduled'));

      return matchesRegion && matchesView;
    });
  }, [bookings, selectedRegion, dashboardView]);

  // 2. Real Stats Calculations
  const totalCount = filteredBookings.length;
  const inProgressCount = filteredBookings.filter(
    b => b.status === 'Dispatched to BuildFlow' || b.status === 'Dispatched to KANNA' || b.status === 'STS In-Progress'
  ).length;
  const pendingCount = filteredBookings.filter(
    b => b.status === 'Pending Dispatch' || b.status === 'Scheduled' || b.status === 'QC Inspection'
  ).length;
  const completedCount = filteredBookings.filter(b => b.status === 'Passed (Closed)').length;
  const cancelledCount = filteredBookings.filter(b => b.status === 'Penalty E-CN Issued').length;

  // 3. Stage Progression calculations
  const stageStats = useMemo(() => {
    return stagesDefinition.map((stg, stgIdx) => {
      const stageBookings = filteredBookings.filter(b => getStageIndex(b) === stgIdx);
      const pending = stageBookings.filter(b => b.status === 'Pending Dispatch' || b.status === 'Scheduled').length;
      const active = stageBookings.filter(b => b.status === 'Dispatched to BuildFlow' || b.status === 'Dispatched to KANNA' || b.status === 'STS In-Progress').length;
      const completed = stageBookings.filter(b => b.status === 'Passed (Closed)').length;
      return {
        ...stg,
        total: stageBookings.length,
        pending,
        active,
        completed
      };
    });
  }, [filteredBookings]);

  // 4. Status distribution for donut chart
  const pieData = useMemo(() => {
    const total = totalCount || 1;
    return [
      { name: 'กำลังดำเนินการ', value: inProgressCount, color: '#10b981', percent: `${Math.round((inProgressCount / total) * 100)}%` },
      { name: 'เสร็จสิ้น', value: completedCount, color: '#3b82f6', percent: `${Math.round((completedCount / total) * 100)}%` },
      { name: 'รอดำเนินการ', value: pendingCount, color: '#f59e0b', percent: `${Math.round((pendingCount / total) * 100)}%` },
      { name: 'ยกเลิก', value: cancelledCount, color: '#ef4444', percent: `${Math.round((cancelledCount / total) * 100)}%` },
    ];
  }, [totalCount, inProgressCount, completedCount, pendingCount, cancelledCount]);

  // Donut chart path drawing using stroke-dasharray
  const donutRadius = 38;
  const donutCircumference = 2 * Math.PI * donutRadius; // ~238.76

  // Cumulative value trend & total project value
  const totalProjectValue = useMemo(() => {
    return filteredBookings.reduce((sum, b) => sum + getBookingValue(b), 0);
  }, [filteredBookings]);

  const valueTrendData = useMemo(() => {
    if (filteredBookings.length === 0) {
      return [{ label: 'ปัจจุบัน', value: 0 }];
    }
    // Group by date
    const map: Record<string, number> = {};
    filteredBookings.forEach(b => {
      const val = getBookingValue(b);
      map[b.bookingDate] = (map[b.bookingDate] || 0) + val;
    });

    const sortedDates = Object.keys(map).sort();
    let cumulative = 0;
    return sortedDates.map(date => {
      cumulative += map[date];
      // Format to dd/mm
      const parts = date.split('-');
      const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
      return { label, value: cumulative };
    });
  }, [filteredBookings]);

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH').format(val);
  };

  // Recent Projects (latest 5 bookings mapped to look like projects)
  const recentProjects = useMemo(() => {
    const sorted = [...filteredBookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted.slice(0, 5).map(b => {
      // Create project code e.g. PRJ-2607-1001
      const dateParts = b.bookingDate.split('-');
      const yearShort = dateParts[0] ? dateParts[0].slice(2) : '26';
      const monthStr = dateParts[1] || '07';
      const pCode = `PRJ-${yearShort}${monthStr}-${b.bookingRef.split('-').pop() || b.id.slice(-4)}`;
      
      // Determine stage
      const stageIdx = getStageIndex(b);
      const stageName = stagesDefinition[stageIdx].title.split(' ')[0]; // E.g. 'Design' or 'Survey' or 'คุยกับลูกค้า'
      const stageColor = stagesDefinition[stageIdx].color;

      return {
        id: b.id,
        code: pCode,
        customerName: b.customerName,
        stageName,
        stageColor,
        updatedAt: b.createdAt.includes(' ') ? b.createdAt : `${b.bookingDate} 12:00`
      };
    });
  }, [filteredBookings]);

  // Format YYYY-MM-DD HH:mm to dd/mm/yyyy HH:mm
  const formatDateTime = (dtStr: string) => {
    if (!dtStr) return '';
    const parts = dtStr.split(' ');
    const dateParts = parts[0].split('-');
    const time = parts[1] || '12:00';
    if (dateParts.length !== 3) return dtStr;
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} ${time}`;
  };

  // 5. SVG Path for Line Chart
  const svgLinePath = useMemo(() => {
    if (valueTrendData.length < 2) return '';
    const width = 500;
    const height = 160;
    const paddingX = 40;
    const paddingY = 20;
    const maxVal = Math.max(...valueTrendData.map(d => d.value), 100000);

    const getX = (idx: number) => paddingX + (idx / (valueTrendData.length - 1)) * (width - 2 * paddingX);
    const getY = (val: number) => height - paddingY - (val / maxVal) * (height - 2 * paddingY);

    let path = `M ${getX(0)} ${getY(valueTrendData[0].value)}`;
    for (let i = 0; i < valueTrendData.length - 1; i++) {
      const x0 = getX(i);
      const y0 = getY(valueTrendData[i].value);
      const x1 = getX(i + 1);
      const y1 = getY(valueTrendData[i + 1].value);
      const mx = (x0 + x1) / 2;
      path += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
    }
    return path;
  }, [valueTrendData]);

  const svgAreaPath = useMemo(() => {
    if (valueTrendData.length < 2) return '';
    const width = 500;
    const height = 160;
    const paddingX = 40;
    const paddingY = 20;
    const getX = (idx: number) => paddingX + (idx / (valueTrendData.length - 1)) * (width - 2 * paddingX);
    
    return `${svgLinePath} L ${getX(valueTrendData.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`;
  }, [valueTrendData, svgLinePath]);

  return (
    <div className="space-y-6 animate-fadeIn pb-8 font-sans bg-slate-50/50 -m-6 p-6">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span className="text-emerald-600">BuildFlow</span>
            <span className="text-slate-400">/</span>
            <span>ภาพรวมโครงการ</span>
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">สรุปภาพรวมการดำเนินงานและสถานะโครงการทั้งหมด</p>
        </div>

        {/* Top bar controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Region selector */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {(['ALL', 'BKK', 'UPC'] as const).map(reg => (
              <button
                key={reg}
                onClick={() => setSelectedRegion(reg)}
                className={`px-3 py-1 rounded text-[11px] font-bold transition cursor-pointer border-0 ${
                  selectedRegion === reg
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {reg === 'ALL' ? 'ทุกภูมิภาค (BKK + UPC)' : reg}
              </button>
            ))}
          </div>

          {/* View selector (My Tasks vs Company Dashboard) */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setDashboardView('my')}
              className={`px-3 py-1 rounded text-[11px] font-bold transition cursor-pointer border-0 flex items-center gap-1 ${
                dashboardView === 'my'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users size={12} />
              <span>หน้างานส่วนตัว (My Tasks)</span>
            </button>
            <button
              onClick={() => setDashboardView('company')}
              className={`px-3 py-1 rounded text-[11px] font-bold transition cursor-pointer border-0 flex items-center gap-1 ${
                dashboardView === 'company'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <TrendingUp size={12} />
              <span>ภาพรวมบริษัท (Company Dashboard)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Main Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        {/* Card 1: Total */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center space-x-3.5 hover:shadow transition">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/50">
            <Folder className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold">โครงการทั้งหมด</div>
            <div className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{totalCount}</div>
            <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
              <span>↗ 12%</span>
              <span className="text-slate-400 font-normal">จากช่วงก่อนหน้า</span>
            </div>
          </div>
        </div>

        {/* Card 2: In Progress */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center space-x-3.5 hover:shadow transition">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/50">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold">กำลังดำเนินการ</div>
            <div className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{inProgressCount}</div>
            <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
              <span>↗ 8%</span>
              <span className="text-slate-400 font-normal">จากช่วงก่อนหน้า</span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center space-x-3.5 hover:shadow transition">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/50">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold">รอดำเนินการ</div>
            <div className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{pendingCount}</div>
            <div className="text-[10px] text-rose-500 font-bold flex items-center gap-0.5">
              <span>↘ 5%</span>
              <span className="text-slate-400 font-normal">จากช่วงก่อนหน้า</span>
            </div>
          </div>
        </div>

        {/* Card 4: Completed */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center space-x-3.5 hover:shadow transition">
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600 border border-sky-100/50">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold">เสร็จสิ้น</div>
            <div className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{completedCount}</div>
            <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
              <span>↗ 15%</span>
              <span className="text-slate-400 font-normal">จากช่วงก่อนหน้า</span>
            </div>
          </div>
        </div>

        {/* Card 5: Cancelled */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center space-x-3.5 hover:shadow transition col-span-2 md:col-span-1">
          <div className="p-3 rounded-xl bg-slate-50 text-slate-400 border border-slate-100">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold">ยกเลิก</div>
            <div className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{cancelledCount}</div>
            <div className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
              <span>- 0%</span>
              <span className="text-slate-400 font-normal">จากช่วงก่อนหน้า</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Middle Row: Stage Progression & Ratio Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Stage Progression Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">สถานะโครงการตามขั้นตอน (Stage Progression)</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">จำนวนโครงการแยกตามขั้นตอนการทำงานและสถานะ</p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200">
              รวมทั้งหมด {totalCount} โครงการ
            </span>
          </div>

          {/* Flow Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
            {stageStats.map((stg, index) => (
              <div
                key={stg.title}
                className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ backgroundColor: stg.color }}>
                      {index + 1}
                    </span>
                    <span className="text-[11px] font-black text-slate-800">{stg.total} โครงการ</span>
                  </div>
                  <h4 className="text-[10px] font-extrabold text-slate-600 mt-2 leading-tight min-h-8">
                    {stg.title}
                  </h4>
                </div>

                <div className="space-y-1 text-[9px] font-medium border-t border-slate-200/50 pt-2 text-slate-500">
                  <div className="flex justify-between">
                    <span>ยังไม่เริ่ม:</span>
                    <strong className="text-slate-700">{stg.pending}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>กำลังดำเนินการ:</span>
                    <strong className="text-amber-600">{stg.active}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>เสร็จสิ้น:</span>
                    <strong className="text-emerald-600">{stg.completed}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Ratio Donut Chart */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-sm">โครงการตามสถานะ (Status Ratio)</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">สัดส่วนร้อยละของโครงการแต่ละประเภท</p>
          </div>

          <div className="flex items-center justify-around gap-2 my-auto">
            {/* SVG Donut */}
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r={donutRadius}
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="11"
                />
                
                {/* Dynamically drawing segments */}
                {(() => {
                  let accumulatedPercent = 0;
                  return pieData.map((seg) => {
                    if (seg.value === 0) return null;
                    const segmentLength = (seg.value / (totalCount || 1)) * donutCircumference;
                    const strokeOffset = donutCircumference * (1 - accumulatedPercent);
                    accumulatedPercent += (seg.value / (totalCount || 1));

                    return (
                      <circle
                        key={seg.name}
                        cx="50"
                        cy="50"
                        r={donutRadius}
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="11"
                        strokeDasharray={`${segmentLength} ${donutCircumference}`}
                        strokeDashoffset={strokeOffset}
                        transform="rotate(-90 50 50)"
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    );
                  });
                })()}
              </svg>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-black text-slate-800 leading-none">{totalCount}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">โครงการ</span>
              </div>
            </div>

            {/* Legends */}
            <div className="space-y-1.5 text-[10px] font-bold w-full pl-3">
              {pieData.map((seg) => (
                <div key={seg.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-slate-500">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: seg.color }}></span>
                    <span>{seg.name}</span>
                  </div>
                  <div className="text-slate-800">
                    {seg.value} <span className="text-[9px] text-slate-400 font-medium">({seg.percent})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 3. Bottom Row: Cumulative Value Chart, Recent Projects Table, & Side Lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Cumulative Value Line/Area Chart */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">มูลค่าโครงการ (รวมทุกสถานะ)</h3>
            <div className="text-2xl font-black text-emerald-600 mt-1 tracking-tight">
              {formatCurrency(totalProjectValue)} <span className="text-xs font-bold text-slate-400">บาท</span>
            </div>
            <div className="text-[10px] text-emerald-500 font-bold mt-0.5">
              ↗ 18% <span className="text-slate-400 font-normal">จากช่วงก่อนหน้า</span>
            </div>
          </div>

          {/* Area Spline SVG */}
          <div className="relative pt-2">
            <svg viewBox="0 0 500 160" className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area Path */}
              {svgAreaPath && <path d={svgAreaPath} fill="url(#chartGrad)" />}

              {/* Spline Path */}
              {svgLinePath && (
                <path d={svgLinePath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
              )}

              {/* Grid line at bottom */}
              <line x1="40" y1="140" x2="460" y2="140" stroke="#f1f5f9" strokeWidth="1" />

              {/* Dots and Labels */}
              {valueTrendData.map((d, idx) => {
                const width = 500;
                const height = 160;
                const paddingX = 40;
                const paddingY = 20;
                const maxVal = Math.max(...valueTrendData.map(val => val.value), 100000);
                const x = paddingX + (idx / (valueTrendData.length - 1)) * (width - 2 * paddingX);
                const y = height - paddingY - (d.value / maxVal) * (height - 2 * paddingY);

                // Show only 4 labels to avoid clutter
                const showLabel = idx === 0 || idx === Math.floor(valueTrendData.length / 3) || idx === Math.floor(valueTrendData.length * 2 / 3) || idx === valueTrendData.length - 1;

                return (
                  <g key={d.label}>
                    {showLabel && (
                      <text x={x} y="152" fill="#94a3b8" fontSize="9" textAnchor="middle" fontWeight="bold">
                        {d.label}
                      </text>
                    )}
                    <circle cx={x} cy={y} r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Recent Projects Table */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">โครงการล่าสุด (Recent Projects)</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">รายการโครงการ 5 ลำดับล่าสุดที่มีการเคลื่อนไหว</p>
            </div>
            <span className="text-[10px] text-emerald-600 font-extrabold cursor-pointer hover:underline flex items-center">
              ดูทั้งหมด <ChevronRight size={12} />
            </span>
          </div>

          <div className="overflow-x-auto my-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100/80">
                  <th className="pb-2">รหัสโครงการ</th>
                  <th className="pb-2">ชื่อลูกค้า</th>
                  <th className="pb-2 text-center">ขั้นตอนปัจจุบัน</th>
                  <th className="pb-2 text-right">อัปเดตล่าสุด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 font-bold text-slate-700">
                {recentProjects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400 italic">ไม่มีข้อมูลโครงการใหม่</td>
                  </tr>
                ) : (
                  recentProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-2.5 font-mono text-[10px] font-extrabold text-slate-500">{p.code}</td>
                      <td className="py-2.5 max-w-[80px] truncate">{p.customerName}</td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold text-white" style={{ backgroundColor: p.stageColor }}>
                          {p.stageName}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-[10px] text-slate-400 font-medium">{formatDateTime(p.updatedAt).split(' ')[0]}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Today's Tasks & Pending Docs lists */}
        <div className="space-y-4 flex flex-col justify-between">
          
          {/* Today's Tasks widget */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-sm space-y-3 flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                <Calendar size={14} className="text-emerald-600" />
                <span>กิจกรรมวันนี้ (Today's Tasks)</span>
              </h4>
              <span className="text-[10px] text-emerald-600 font-extrabold cursor-pointer hover:underline">ดูทั้งหมด</span>
            </div>

            <div className="space-y-2 text-[11px] font-bold text-slate-600 py-1">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100/50 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  <span>นัดหมายเข้าพบลูกค้า</span>
                </div>
                <strong className="text-slate-800">{filteredBookings.filter(b => b.status === 'Scheduled').length} รายการ</strong>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100/50 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>สำรวจหน้างาน</span>
                </div>
                <strong className="text-slate-800">{filteredBookings.filter(b => getStageIndex(b) === 1).length} รายการ</strong>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100/50 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  <span>ส่งแบบ/เสนอราคา</span>
                </div>
                <strong className="text-slate-800">{filteredBookings.filter(b => getStageIndex(b) === 3).length} รายการ</strong>
              </div>
            </div>
          </div>

          {/* Pending Docs widget */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-sm space-y-3 flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                <FileText size={14} className="text-emerald-600" />
                <span>เอกสารที่รอดำเนินการ (Pending Docs)</span>
              </h4>
              <span className="text-[10px] text-emerald-600 font-extrabold cursor-pointer hover:underline">ดูทั้งหมด</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500">
              <div className="p-2 rounded-xl bg-rose-50/50 border border-rose-100/40 flex justify-between items-center">
                <span>ใบประเมินราคา</span>
                <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-extrabold">12</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50/50 border border-amber-100/40 flex justify-between items-center">
                <span>แบบ 3D</span>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-extrabold">9</span>
              </div>
              <div className="p-2 rounded-xl bg-blue-50/50 border border-blue-100/40 flex justify-between items-center">
                <span>แบบแปลน</span>
                <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-extrabold">15</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50/50 border border-emerald-100/40 flex justify-between items-center">
                <span>BOQ/รายการวัสดุ</span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-extrabold">7</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
