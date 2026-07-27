import React, { useState, useMemo } from 'react';
import type { Technician, PenaltyRecord, QueueBooking, Branch } from '../types';
import {
  Users,
  Star,
  ShieldAlert,
  Briefcase as _Briefcase,
  MapPin,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Clock,
  WifiOff,
  Zap,
  Award,
  BarChart3,
  Activity,
} from 'lucide-react';

interface TechDashboardViewProps {
  technicians: Technician[];
  penalties: PenaltyRecord[];
  bookings: QueueBooking[];
  branches: Branch[];
}

const tierColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Gold: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-400' },
  Silver: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-300', dot: 'bg-slate-400' },
  Bronze: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-400' },
  Cooldown: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', dot: 'bg-blue-400' },
  Suspended: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-400' },
};

const statusColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  Available: { bg: 'bg-emerald-100 text-emerald-700', text: 'พร้อมรับงาน', icon: <CheckCircle2 size={12} /> },
  'On Job': { bg: 'bg-blue-100 text-blue-700', text: 'กำลังทำงาน', icon: <Activity size={12} /> },
  'In Cooldown': { bg: 'bg-amber-100 text-amber-700', text: 'พักงานชั่วคราว', icon: <Clock size={12} /> },
  Offline: { bg: 'bg-slate-100 text-slate-500', text: 'ออฟไลน์', icon: <WifiOff size={12} /> },
};

const categoryShortNames: Record<string, string> = {
  'Built-in Furniture': 'เฟอร์นิเจอร์',
  'Flooring & Tile': 'พื้น/กระเบื้อง',
  'Electrical & Smart Home': 'ไฟฟ้า/สมาร์ท',
  'Plumbing & Sanitary': 'ประปา/สุขภัณฑ์',
  'Air Condition & HVAC': 'แอร์/HVAC',
  'Curtains & Wallpaper': 'ผ้าม่าน/วอลเปเปอร์',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-500">
      <Star size={12} fill="currentColor" />
      {rating.toFixed(1)}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className={`rounded-2xl p-5 flex items-start gap-4 border ${color} shadow-sm`}>
      <div className="mt-0.5 opacity-80">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
        <p className="text-3xl font-black tracking-tight">{value}</p>
        {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
      </div>
    </div>
  );
}

type SortKey = 'name' | 'rating' | 'completedJobs' | 'penaltyPoints' | 'tier';
type SortDir = 'asc' | 'desc';

export const TechDashboardView: React.FC<TechDashboardViewProps> = ({
  technicians,
  penalties,
  bookings: _bookings,
  branches: _branches,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterTier, setFilterTier] = useState('ALL');
  const [filterZone, setFilterZone] = useState('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('rating');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [activeSection, setActiveSection] = useState<'overview' | 'table' | 'ranking'>('overview');

  // ===== KPIs =====
  const totalTechs = technicians.length;
  const available = technicians.filter((t) => t.status === 'Available').length;
  const onJob = technicians.filter((t) => t.status === 'On Job').length;
  const cooldown = technicians.filter((t) => t.status === 'In Cooldown').length;
  const offline = technicians.filter((t) => t.status === 'Offline').length;
  const suspended = technicians.filter((t) => t.tier === 'Suspended').length;
  const avgRating = totalTechs > 0 ? technicians.reduce((s, t) => s + t.rating, 0) / totalTechs : 0;
  const totalJobs = technicians.reduce((s, t) => s + t.completedJobs, 0);
  const activePenalties = penalties.filter((p) => p.status === 'Active Penalty').length;

  // Zone distribution
  const zoneMap = useMemo(() => {
    const m: Record<string, number> = {};
    technicians.forEach((t) => {
      const zone = t.primaryZone.split(':')[0].trim();
      m[zone] = (m[zone] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [technicians]);

  const allZones = useMemo(() => Array.from(new Set(technicians.map((t) => t.primaryZone.split(':')[0].trim()))), [technicians]);

  // Skill distribution
  const skillMap = useMemo(() => {
    const m: Record<string, number> = {};
    technicians.forEach((t) =>
      t.skills.forEach((s) => {
        const name = categoryShortNames[s.category] || s.category;
        m[name] = (m[name] || 0) + 1;
      })
    );
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [technicians]);

  const maxSkillCount = skillMap[0]?.[1] || 1;
  const maxZoneCount = zoneMap[0]?.[1] || 1;

  // Tier distribution
  const tierOrder: Technician['tier'][] = ['Gold', 'Silver', 'Bronze', 'Cooldown', 'Suspended'];
  const tierCount = useMemo(() => {
    const m: Record<string, number> = {};
    technicians.forEach((t) => { m[t.tier] = (m[t.tier] || 0) + 1; });
    return m;
  }, [technicians]);

  // Top performers & at risk
  const topPerformers = useMemo(() =>
    [...technicians].sort((a, b) => b.rating - a.rating || b.completedJobs - a.completedJobs).slice(0, 5),
    [technicians]
  );
  const atRisk = useMemo(() =>
    [...technicians].filter((t) => t.penaltyPoints > 30).sort((a, b) => b.penaltyPoints - a.penaltyPoints).slice(0, 5),
    [technicians]
  );

  // Capacity utilization
  const totalCapacity = technicians.reduce((s, t) => s + t.dailyCapacityHours, 0);
  const bookedHours = technicians.reduce((s, t) => s + t.bookedHoursToday, 0);
  const capacityPct = totalCapacity > 0 ? Math.round((bookedHours / totalCapacity) * 100) : 0;

  // ===== Table Filter + Sort =====
  const filtered = useMemo(() => {
    let list = [...technicians];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.primaryZone.toLowerCase().includes(q));
    }
    if (filterStatus !== 'ALL') list = list.filter((t) => t.status === filterStatus);
    if (filterTier !== 'ALL') list = list.filter((t) => t.tier === filterTier);
    if (filterZone !== 'ALL') list = list.filter((t) => t.primaryZone.includes(filterZone));

    const tierOrderMap: Record<string, number> = { Gold: 0, Silver: 1, Bronze: 2, Cooldown: 3, Suspended: 4 };
    list.sort((a, b) => {
      let va: number | string = 0, vb: number | string = 0;
      if (sortKey === 'name') { va = a.name; vb = b.name; }
      else if (sortKey === 'rating') { va = a.rating; vb = b.rating; }
      else if (sortKey === 'completedJobs') { va = a.completedJobs; vb = b.completedJobs; }
      else if (sortKey === 'penaltyPoints') { va = a.penaltyPoints; vb = b.penaltyPoints; }
      else if (sortKey === 'tier') { va = tierOrderMap[a.tier]; vb = tierOrderMap[b.tier]; }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return list;
  }, [technicians, search, filterStatus, filterTier, filterZone, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp size={12} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-blue-500" /> : <ChevronDown size={12} className="text-blue-500" />;
  }

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow">
              <Users size={16} className="text-white" />
            </span>
            Dashboard ช่างทั้งหมด
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">ภาพรวมสถานะ ผลงาน และการกระจายตัวของช่างในระบบ</p>
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          {(['overview', 'table', 'ranking'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeSection === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {s === 'overview' ? '📊 ภาพรวม' : s === 'table' ? '📋 รายชื่อ' : '🏆 อันดับ'}
            </button>
          ))}
        </div>
      </div>

      {/* ===== KPI Cards ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={24} className="text-indigo-600" />}
          label="ช่างทั้งหมด"
          value={totalTechs}
          sub={`พร้อมงาน ${available} คน`}
          color="bg-indigo-50 border-indigo-100 text-indigo-900"
        />
        <StatCard
          icon={<Star size={24} className="text-amber-500" />}
          label="Rating เฉลี่ย"
          value={avgRating.toFixed(2)}
          sub={`งานสำเร็จรวม ${totalJobs.toLocaleString()} งาน`}
          color="bg-amber-50 border-amber-100 text-amber-900"
        />
        <StatCard
          icon={<Zap size={24} className="text-emerald-600" />}
          label="กำลังรับงาน"
          value={onJob}
          sub={`ว่าง ${available} | พัก ${cooldown} | ออฟ ${offline}`}
          color="bg-emerald-50 border-emerald-100 text-emerald-900"
        />
        <StatCard
          icon={<ShieldAlert size={24} className="text-red-500" />}
          label="โทษที่ยังค้างอยู่"
          value={activePenalties}
          sub={`ถูกระงับ ${suspended} คน`}
          color="bg-red-50 border-red-100 text-red-900"
        />
      </div>

      {/* ===== OVERVIEW SECTION ===== */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Status Donut-style */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Activity size={15} className="text-indigo-500" /> สถานะช่าง
            </h3>
            <div className="space-y-3">
              {[
                { label: 'พร้อมรับงาน', count: available, total: totalTechs, color: 'bg-emerald-500' },
                { label: 'กำลังทำงาน', count: onJob, total: totalTechs, color: 'bg-blue-500' },
                { label: 'พักงานชั่วคราว', count: cooldown, total: totalTechs, color: 'bg-amber-400' },
                { label: 'ออฟไลน์', count: offline, total: totalTechs, color: 'bg-slate-300' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                    <span>{row.label}</span>
                    <span className="font-bold text-slate-800">{row.count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${row.color}`}
                      style={{ width: `${totalTechs ? (row.count / totalTechs) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Tier Pills */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 mb-3">Tier ช่าง</p>
              <div className="flex flex-wrap gap-2">
                {tierOrder.map((tier) => {
                  const c = tierColors[tier];
                  const cnt = tierCount[tier] || 0;
                  return (
                    <span key={tier} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                      {tier} ({cnt})
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Capacity Bar */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <BarChart3 size={15} className="text-violet-500" /> ประสิทธิภาพการใช้งาน
            </h3>

            {/* Capacity Gauge */}
            <div className="flex flex-col items-center py-2">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                  <circle
                    cx="50" cy="50" r="38" fill="none"
                    stroke={capacityPct > 80 ? '#ef4444' : capacityPct > 60 ? '#f59e0b' : '#6366f1'}
                    strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 38}`}
                    strokeDashoffset={`${2 * Math.PI * 38 * (1 - capacityPct / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-slate-800">{capacityPct}%</span>
                  <span className="text-[10px] text-slate-400 font-medium">งานเต็ม</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">{bookedHours.toFixed(1)} / {totalCapacity.toFixed(1)} ชั่วโมง (วันนี้)</p>
            </div>

            {/* Skill Distribution */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 mb-3">ทักษะที่มีมากที่สุด</p>
              <div className="space-y-2">
                {skillMap.slice(0, 4).map(([skill, cnt]) => (
                  <div key={skill}>
                    <div className="flex justify-between text-xs text-slate-600 mb-0.5">
                      <span className="font-medium truncate">{skill}</span>
                      <span className="font-bold">{cnt}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-400 rounded-full" style={{ width: `${(cnt / maxSkillCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Zone Distribution */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <MapPin size={15} className="text-rose-500" /> การกระจายตามโซน
            </h3>
            <div className="space-y-2.5">
              {zoneMap.slice(0, 8).map(([zone, cnt]) => (
                <div key={zone} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-16 shrink-0 font-medium truncate">{zone}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-400 to-pink-400 rounded-full"
                      style={{ width: `${(cnt / maxZoneCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-6 text-right">{cnt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== TABLE SECTION ===== */}
      {activeSection === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ / รหัสช่าง / โซน..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="ALL">สถานะทั้งหมด</option>
              <option value="Available">พร้อมรับงาน</option>
              <option value="On Job">กำลังทำงาน</option>
              <option value="In Cooldown">พักงาน</option>
              <option value="Offline">ออฟไลน์</option>
            </select>

            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="ALL">Tier ทั้งหมด</option>
              {tierOrder.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="ALL">โซนทั้งหมด</option>
              {allZones.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>

            <span className="text-xs text-slate-400 font-medium ml-auto">{filtered.length} รายการ</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 font-bold uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">#</th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:text-slate-700 select-none"
                    onClick={() => toggleSort('name')}
                  >
                    <span className="flex items-center gap-1">ช่าง <SortIcon k="name" /></span>
                  </th>
                  <th className="px-4 py-3 text-left">สถานะ</th>
                  <th
                    className="px-4 py-3 text-center cursor-pointer hover:text-slate-700 select-none"
                    onClick={() => toggleSort('tier')}
                  >
                    <span className="flex items-center justify-center gap-1">Tier <SortIcon k="tier" /></span>
                  </th>
                  <th
                    className="px-4 py-3 text-center cursor-pointer hover:text-slate-700 select-none"
                    onClick={() => toggleSort('rating')}
                  >
                    <span className="flex items-center justify-center gap-1">Rating <SortIcon k="rating" /></span>
                  </th>
                  <th
                    className="px-4 py-3 text-center cursor-pointer hover:text-slate-700 select-none"
                    onClick={() => toggleSort('completedJobs')}
                  >
                    <span className="flex items-center justify-center gap-1">งานสำเร็จ <SortIcon k="completedJobs" /></span>
                  </th>
                  <th
                    className="px-4 py-3 text-center cursor-pointer hover:text-slate-700 select-none"
                    onClick={() => toggleSort('penaltyPoints')}
                  >
                    <span className="flex items-center justify-center gap-1">แต้มโทษ <SortIcon k="penaltyPoints" /></span>
                  </th>
                  <th className="px-4 py-3 text-left">โซนหลัก</th>
                  <th className="px-4 py-3 text-center">ทักษะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((tech, idx) => {
                  const sc = statusColors[tech.status];
                  const tc = tierColors[tech.tier];
                  const penaltyPct = Math.min(tech.penaltyPoints, 100);
                  const penaltyColor = penaltyPct >= 70 ? 'bg-red-500' : penaltyPct >= 40 ? 'bg-amber-400' : 'bg-emerald-400';
                  return (
                    <tr key={tech.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs font-bold">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                            {tech.avatar || tech.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-xs">{tech.name}</p>
                            <p className="text-slate-400 text-[10px]">{tech.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${sc.bg}`}>
                          {sc.icon}
                          {sc.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tc.bg} ${tc.text} ${tc.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                          {tech.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StarRating rating={tech.rating} />
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700 text-sm">{tech.completedJobs}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-xs font-bold ${penaltyPct >= 70 ? 'text-red-600' : penaltyPct >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {penaltyPct}
                          </span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${penaltyColor}`} style={{ width: `${penaltyPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600 truncate block max-w-36">{tech.primaryZone}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-wrap justify-center gap-1">
                          {tech.skills.slice(0, 2).map((s, i) => (
                            <span key={i} className="text-[10px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded font-medium">
                              {categoryShortNames[s.category]?.slice(0, 5) || s.category.slice(0, 5)}
                            </span>
                          ))}
                          {tech.skills.length > 2 && (
                            <span className="text-[10px] text-slate-400">+{tech.skills.length - 2}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Filter size={32} className="mx-auto mb-2 opacity-40" />
                <p className="font-medium">ไม่พบช่างที่ตรงตามเงื่อนไข</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== RANKING SECTION ===== */}
      {activeSection === 'ranking' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top Performers */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              <h3 className="font-bold text-slate-800">Top 5 ช่างผลงานดีสุด</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {topPerformers.map((tech, idx) => {
                const tc = tierColors[tech.tier];
                const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                return (
                  <div key={tech.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/70 transition-colors">
                    <span className="text-xl w-8 text-center">{medals[idx]}</span>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                      {tech.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{tech.name}</p>
                      <p className="text-xs text-slate-400">{tech.primaryZone}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 mb-0.5">
                        <StarRating rating={tech.rating} />
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${tc.bg} ${tc.text} ${tc.border}`}>{tech.tier}</span>
                    </div>
                    <div className="text-right min-w-12">
                      <p className="text-sm font-black text-slate-800">{tech.completedJobs}</p>
                      <p className="text-[10px] text-slate-400">งาน</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* At Risk */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <h3 className="font-bold text-slate-800">ช่างที่ต้องติดตาม (แต้มโทษสูง)</h3>
            </div>
            {atRisk.length === 0 ? (
              <div className="px-5 py-10 text-center text-slate-400">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400" />
                <p className="font-medium">ทุกคนอยู่ในเกณฑ์ดี 🎉</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {atRisk.map((tech, idx) => {
                  const penaltyPct = Math.min(tech.penaltyPoints, 100);
                  const penaltyColor = penaltyPct >= 70 ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50';
                  const barColor = penaltyPct >= 70 ? 'bg-red-500' : 'bg-amber-400';
                  return (
                    <div key={tech.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/70 transition-colors">
                      <span className="text-lg w-8 text-center font-bold text-slate-400">{idx + 1}</span>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                        {tech.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">{tech.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${penaltyPct}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-black px-2.5 py-0.5 rounded-lg ${penaltyColor}`}>
                          {tech.penaltyPoints} pts
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{tech.activePenaltiesCount} โทษค้างอยู่</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Full Ranking Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Award size={16} className="text-violet-500" />
              <h3 className="font-bold text-slate-800">อันดับช่างทั้งหมด (เรียงตาม Rating)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 font-bold uppercase tracking-wide">
                    <th className="px-4 py-3 text-center w-12">อันดับ</th>
                    <th className="px-4 py-3 text-left">ช่าง</th>
                    <th className="px-4 py-3 text-center">Tier</th>
                    <th className="px-4 py-3 text-center">Rating</th>
                    <th className="px-4 py-3 text-center">งานสำเร็จ</th>
                    <th className="px-4 py-3 text-center">แต้มโทษ</th>
                    <th className="px-4 py-3 text-center">ความจุงาน (วันนี้)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[...technicians]
                    .sort((a, b) => b.rating - a.rating || b.completedJobs - a.completedJobs)
                    .map((tech, idx) => {
                      const tc = tierColors[tech.tier];
                      const usedPct = tech.dailyCapacityHours > 0 ? (tech.bookedHoursToday / tech.dailyCapacityHours) * 100 : 0;
                      const rankBadge = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
                      return (
                        <tr key={tech.id} className={`hover:bg-slate-50/70 transition-colors ${idx < 3 ? 'bg-amber-50/30' : ''}`}>
                          <td className="px-4 py-2.5 text-center text-base">{rankBadge}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                                {tech.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 text-xs">{tech.name}</p>
                                <p className="text-slate-400 text-[10px]">{tech.code}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${tc.bg} ${tc.text} ${tc.border}`}>{tech.tier}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <StarRating rating={tech.rating} />
                          </td>
                          <td className="px-4 py-2.5 text-center font-bold text-slate-700">{tech.completedJobs}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`text-xs font-bold ${tech.penaltyPoints >= 70 ? 'text-red-600' : tech.penaltyPoints >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {tech.penaltyPoints}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${usedPct >= 80 ? 'bg-red-400' : usedPct >= 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                  style={{ width: `${Math.min(usedPct, 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 shrink-0">{tech.bookedHoursToday}/{tech.dailyCapacityHours}h</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
