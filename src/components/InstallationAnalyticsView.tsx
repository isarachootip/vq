import React, { useState, useMemo } from 'react';
import type { QueueBooking, PenaltyRecord } from '../types';
import {
  Inbox,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Bell,
  BarChart2,
  Layers,
  Wrench
} from 'lucide-react';

interface InstallationAnalyticsViewProps {
  bookings: QueueBooking[];
  penalties?: PenaltyRecord[];
}

type PeriodType = 'Weekly' | 'MTD' | 'Yearly';

export const InstallationAnalyticsView: React.FC<InstallationAnalyticsViewProps> = ({
  bookings,
  penalties = []
}) => {
  const [period, setPeriod] = useState<PeriodType>('MTD');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Stats calculation
  const pendingCount = bookings.filter(b => b.status === 'Pending Dispatch' || b.status === 'Scheduled').length;
  const inProgressCount = bookings.filter(b => b.status === 'Dispatched to KANNA' || b.status === 'STS In-Progress').length;
  const resolvedCount = bookings.filter(b => b.status === 'Passed (Closed)').length;
  const escalatedCount = bookings.filter(b => b.status === 'Penalty E-CN Issued' || b.status === 'QC Inspection').length + penalties.length;

  // Generate trend data based on selected period
  const chartData = useMemo(() => {
    if (period === 'Weekly') {
      // 7 Days
      const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
      return days.map((day, idx) => {
        const total = [2, 5, 3, 7, 4, 6, 2][idx];
        const open = [1, 3, 2, 5, 2, 4, 1][idx];
        const resolved = total - open;
        return { label: day, total, open, resolved };
      });
    } else if (period === 'Yearly') {
      // 12 Months
      const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      return months.map((m, idx) => {
        const total = [12, 18, 15, 22, 28, 32, 24, 30, 26, 35, 40, 48][idx];
        const open = [3, 4, 2, 6, 7, 8, 5, 6, 4, 9, 8, 10][idx];
        const resolved = total - open;
        return { label: m, total, open, resolved };
      });
    } else {
      // MTD (Month to Date - 31 Days like screenshot: 01 ก.ค., 02 ก.ค. ... 31 ก.ค.)
      const mtdData = Array.from({ length: 31 }, (_, i) => {
        const dayNum = String(i + 1).padStart(2, '0');
        let total = 0;
        let open = 0;
        let resolved = 0;

        // Custom curve matching screenshot pattern (peaks around 03 ก.ค. & 09 ก.ค. & 24 ก.ค.)
        if (i === 2) { total = 5; open = 3; resolved = 2; }
        else if (i === 8) { total = 2; open = 2; resolved = 0; }
        else if (i === 21) { total = 3; open = 2; resolved = 1; }
        else if (i === 23) { total = 6; open = 4; resolved = 2; }
        else if (i === 24) { total = 2; open = 1; resolved = 1; }
        else if (i === 27) { total = 4; open = 3; resolved = 1; }
        else {
          total = 0; open = 0; resolved = 0;
        }

        return {
          label: `${dayNum} ก.ค.`,
          total,
          open,
          resolved
        };
      });
      return mtdData;
    }
  }, [period]);

  // Chart max Y value
  const maxY = Math.max(...chartData.map(d => d.total), 5);

  // SVG Chart Dimensions
  const svgWidth = 900;
  const svgHeight = 240;
  const paddingX = 40;
  const paddingY = 30;

  // Helper to map data index to SVG X & Y
  const getX = (idx: number) => paddingX + (idx / (chartData.length - 1 || 1)) * (svgWidth - 2 * paddingX);
  const getY = (val: number) => svgHeight - paddingY - (val / maxY) * (svgHeight - 2 * paddingY);

  // Build SVG Path Smooth Bezier
  const buildSmoothPath = (key: 'total' | 'open' | 'resolved') => {
    if (chartData.length === 0) return '';
    let d = `M ${getX(0)} ${getY(chartData[0][key])}`;
    for (let i = 0; i < chartData.length - 1; i++) {
      const x0 = getX(i);
      const y0 = getY(chartData[i][key]);
      const x1 = getX(i + 1);
      const y1 = getY(chartData[i + 1][key]);
      const mx = (x0 + x1) / 2;
      d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
    }
    return d;
  };

  const totalPath = buildSmoothPath('total');
  const openPath = buildSmoothPath('open');
  const resolvedPath = buildSmoothPath('resolved');

  // Closed area gradient path
  const areaTotalPath = `${totalPath} L ${getX(chartData.length - 1)} ${svgHeight - paddingY} L ${getX(0)} ${svgHeight - paddingY} Z`;

  return (
    <div className="space-y-6 animate-fadeIn pb-8 font-sans">

      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-200">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">vService Installation Analytics</h1>
              <span className="bg-blue-50 text-blue-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-blue-100">Installer System</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">ระบบติดตามคิวงาน บริหารจัดการช่าง และวิเคราะห์สถิติตามรอบเวลาติดตั้ง</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="relative p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer border-0">
            <Bell size={18} />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-rose-500"></span>
          </button>

          <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              CS
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-800">CHG System Admin</div>
              <div className="text-[10px] text-slate-400 font-medium">Administrator</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Escalated */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center space-x-4 hover:shadow-md transition">
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-xs">
            <ArrowUpRight className="h-6 w-6" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-800 tracking-tight">{escalatedCount}</div>
            <div className="text-xs font-bold text-slate-700 mt-0.5">เคสมีปัญหา (Penalty E-CN)</div>
            <div className="text-[10px] text-slate-400 font-medium">โดนค่าปรับหรือส่งต่อช่างเฉพาะทาง</div>
          </div>
        </div>

        {/* Card 2: รอรับเรื่อง (NEW) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center space-x-4 hover:shadow-md transition">
          <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs">
            <Inbox className="h-6 w-6" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-800 tracking-tight">{pendingCount}</div>
            <div className="text-xs font-bold text-slate-700 mt-0.5">คิวจัดเตรียมงาน (Pending)</div>
            <div className="text-[10px] text-slate-400 font-medium">รอจัดสรรและส่งมอบงานช่าง</div>
          </div>
        </div>

        {/* Card 3: กำลังดำเนินการ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center space-x-4 hover:shadow-md transition">
          <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-800 tracking-tight">{inProgressCount}</div>
            <div className="text-xs font-bold text-slate-700 mt-0.5">กำลังติดตั้ง (KANNA/STS)</div>
            <div className="text-[10px] text-slate-400 font-medium">ช่างอยู่ระหว่างปฏิบัติงานหน้างาน</div>
          </div>
        </div>

        {/* Card 4: ปิดงานสำเร็จ (Resolved/Closed) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center space-x-4 hover:shadow-md transition">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-800 tracking-tight">{resolvedCount}</div>
            <div className="text-xs font-bold text-slate-700 mt-0.5">ผ่าน QC ปิดงานแล้ว</div>
            <div className="text-[10px] text-slate-400 font-medium">ผ่านการตรวจ QC และปิดงานสำเร็จ</div>
          </div>
        </div>

      </div>

      {/* Main Analytics Spline Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        
        {/* Chart Header & Toggles */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-extrabold text-slate-800">
                จำนวนงานติดตั้ง รายวัน <span className="text-xs font-normal text-slate-400">({period === 'MTD' ? 'Month to Date' : period === 'Weekly' ? 'Weekly' : 'Yearly'})</span>
              </h2>
            </div>
            
            {/* Chart Legend Badges */}
            <div className="flex items-center space-x-4 mt-3 text-xs font-bold">
              <div className="flex items-center space-x-1.5 text-indigo-600">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                <span>งานติดตั้งทั้งหมด <strong className="text-slate-800">{chartData.reduce((s, d) => s + d.total, 0)}</strong></span>
              </div>

              <div className="flex items-center space-x-1.5 text-amber-500">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span>รอดำเนินการ / กำลังติดตั้ง <strong className="text-slate-800">{chartData.reduce((s, d) => s + d.open, 0)}</strong></span>
              </div>

              <div className="flex items-center space-x-1.5 text-emerald-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>ปิดงานสำเร็จ <strong className="text-slate-800">{chartData.reduce((s, d) => s + d.resolved, 0)}</strong></span>
              </div>
            </div>
          </div>

          {/* Time Period Filter Pills (Weekly / MTD / Yearly) matching screenshot */}
          <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200/60">
            {(['Weekly', 'MTD', 'Yearly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border-0 ${
                  period === p
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Interactive Spline Chart */}
        <div className="relative overflow-x-auto pt-2">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto max-h-[300px] overflow-visible">
            <defs>
              <linearGradient id="totalAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 1, 2, 3, 4, 5].map((val) => {
              const y = getY(val);
              return (
                <g key={`grid-${val}`}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray={val === 0 ? '0' : '4 4'}
                  />
                  <text
                    x={paddingX - 12}
                    y={y + 4}
                    fill="#94a3b8"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Area Fill for Total */}
            <path d={areaTotalPath} fill="url(#totalAreaGradient)" />

            {/* Total Line (Purple/Indigo) */}
            <path d={totalPath} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />

            {/* Open Line (Orange Dashed/Solid) */}
            <path d={openPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 4" strokeLinecap="round" />

            {/* Resolved Line (Green) */}
            <path d={resolvedPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

            {/* X Axis Labels & Points */}
            {chartData.map((d, idx) => {
              const cx = getX(idx);
              const cyTotal = getY(d.total);
              const cyOpen = getY(d.open);
              const cyResolved = getY(d.resolved);
              const isHovered = hoveredIndex === idx;

              // Show label every few ticks if MTD to avoid clutter
              const showLabel = period !== 'MTD' || idx % 2 === 0 || isHovered || d.total > 0;

              return (
                <g key={`point-${idx}`} onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)} className="cursor-pointer">
                  {/* X Axis Date Label */}
                  {showLabel && (
                    <text
                      x={cx}
                      y={svgHeight - 6}
                      fill={isHovered ? '#1e293b' : '#94a3b8'}
                      fontSize={period === 'MTD' ? '9' : '10'}
                      fontWeight={isHovered ? 'bold' : '500'}
                      textAnchor="middle"
                      transform={`rotate(-25 ${cx} ${svgHeight - 6})`}
                    >
                      {d.label}
                    </text>
                  )}

                  {/* Total Dot */}
                  <circle
                    cx={cx}
                    cy={cyTotal}
                    r={isHovered ? 6 : 4}
                    fill="#6366f1"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all"
                  />

                  {/* Open Dot */}
                  {d.open > 0 && (
                    <circle
                      cx={cx}
                      cy={cyOpen}
                      r={isHovered ? 5 : 3.5}
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Resolved Dot */}
                  {d.resolved > 0 && (
                    <circle
                      cx={cx}
                      cy={cyResolved}
                      r={isHovered ? 5 : 3.5}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Interactive vertical hover line */}
                  {isHovered && (
                    <line
                      x1={cx}
                      y1={paddingY}
                      x2={cx}
                      y2={svgHeight - paddingY}
                      stroke="#6366f1"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip Popup */}
          {hoveredIndex !== null && chartData[hoveredIndex] && (
            <div
              className="absolute z-10 bg-slate-900 text-white rounded-xl px-3 py-2 text-xs shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-12 animate-fadeIn border border-slate-700"
              style={{
                left: `${(hoveredIndex / (chartData.length - 1)) * 90 + 5}%`,
                top: '20px'
              }}
            >
              <div className="font-bold text-amber-400 text-[11px] border-b border-slate-800 pb-1 mb-1">
                {chartData[hoveredIndex].label}
              </div>
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between gap-3"><span className="text-indigo-300">Total:</span> <strong className="font-mono text-white">{chartData[hoveredIndex].total}</strong></div>
                <div className="flex justify-between gap-3"><span className="text-amber-300">Open/Pending:</span> <strong className="font-mono text-white">{chartData[hoveredIndex].open}</strong></div>
                <div className="flex justify-between gap-3"><span className="text-emerald-300">Resolved:</span> <strong className="font-mono text-white">{chartData[hoveredIndex].resolved}</strong></div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* SLA & Service Category Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Panel 1: SLA Performance Metrics */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">SLA & Response Performance</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span className="font-medium">เวลาตอบรับเรื่องเฉลี่ย (First Response):</span>
                <span className="font-bold text-slate-800">14 นาที</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[85%] rounded-full"></div>
              </div>
              <p className="text-[10px] text-emerald-600 mt-1 font-semibold">⚡ เร็วกว่าเป้าหมาย SLA (&lt;30 นาที)</p>
            </div>

            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span className="font-medium">อัตราปิดงานติดตั้งตามเวลา (SLA Compliance Rate):</span>
                <span className="font-bold text-slate-800">96.4%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[96%] rounded-full"></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">เป้าหมายองค์กร &gt;95%</p>
            </div>

            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span className="font-medium">ความพึงพอใจลูกค้า (CSAT Score):</span>
                <span className="font-bold text-slate-800">4.8 / 5.0 ⭐</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full w-[96%] rounded-full"></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">จากผลประเมินบริการ 1,420 เคส</p>
            </div>
          </div>
        </div>

        {/* Panel 2: Category Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Layers className="h-5 w-5 text-violet-600" />
            <h3 className="font-bold text-slate-800 text-sm">สัดส่วนคิวงานตามหมวดหมู่บริการ</h3>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { category: 'งาน Built-in & เฟอร์นิเจอร์', count: 42, pct: 35, color: 'bg-indigo-600' },
              { category: 'งานแอร์ & ระบบปรับอากาศ', count: 30, pct: 25, color: 'bg-blue-500' },
              { category: 'งานปูพื้น SPC & กระเบื้อง', count: 24, pct: 20, color: 'bg-emerald-500' },
              { category: 'งานระบบไฟฟ้า & Smart Home', count: 14, pct: 12, color: 'bg-amber-500' },
              { category: 'งานประปา & สุขภัณฑ์', count: 10, pct: 8, color: 'bg-purple-500' },
            ].map((cat) => (
              <div key={cat.category}>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span className="font-medium truncate">{cat.category}</span>
                  <span className="font-bold text-slate-800">{cat.count} งาน ({cat.pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`${cat.color} h-full rounded-full`} style={{ width: `${cat.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 3: Recent Activity Log */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <BarChart2 className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm">คิวงานติดตั้งล่าสุด (Installation Logs)</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Live Sync</span>
          </div>

          <div className="space-y-2.5">
            {bookings.slice(0, 4).map((b) => (
              <div key={b.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs hover:bg-slate-100/80 transition">
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-slate-800 truncate">{b.bookingRef}</div>
                  <div className="text-[10px] text-slate-500 truncate">{b.customerName} • {b.installationTypeName}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                  b.status === 'Passed (Closed)' ? 'bg-emerald-100 text-emerald-700' :
                  b.status === 'Penalty E-CN Issued' ? 'bg-rose-100 text-rose-700' :
                  'bg-indigo-100 text-indigo-700'
                }`}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
