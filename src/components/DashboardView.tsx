import React, { useState } from 'react';
import type { QueueBooking, Technician } from '../types';
import { Clock, CheckCircle2, AlertTriangle, Send, Filter, MapPin, ShieldAlert, ArrowRight, Layers } from 'lucide-react';

interface DashboardViewProps {
  bookings: QueueBooking[];
  technicians: Technician[];
  onDispatchToKanna: (bookingId: string) => void;
  onSelectBookingForSim: (booking: QueueBooking) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  bookings,
  technicians,
  onDispatchToKanna,
  onSelectBookingForSim,
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredBookings = bookings.filter((b) => {
    const matchesZone = selectedZone === 'ALL' || b.addressZone.includes(selectedZone);
    const matchesStatus = selectedStatus === 'ALL' || b.status === selectedStatus;
    const matchesSearch =
      b.bookingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.installationTypeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesZone && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: QueueBooking['status']) => {
    switch (status) {
      case 'Pending Dispatch':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Scheduled':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Dispatched to KANNA':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'STS In-Progress':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'QC Inspection':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Passed (Closed)':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Penalty E-CN Issued':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30 glow-rose';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {bookings.filter((b) => b.status === 'Pending Dispatch' || b.status === 'Scheduled').length}
            </div>
            <div className="text-xs text-slate-400">คิวจัดเตรียมงาน (Pending Dispatch)</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Send className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {bookings.filter((b) => b.status === 'Dispatched to KANNA' || b.status === 'STS In-Progress').length}
            </div>
            <div className="text-xs text-slate-400">งานอยู่ระหว่างดำเนินการ (KANNA / STS)</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {bookings.filter((b) => b.status === 'Passed (Closed)').length}
            </div>
            <div className="text-xs text-slate-400">ผ่าน QC ปิดงานแล้ว (Pass & Billing)</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {bookings.filter((b) => b.status === 'Penalty E-CN Issued').length}
            </div>
            <div className="text-xs text-slate-400">โดนบทลงโทษ (Penalty E-CN)</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
            <Filter className="h-4 w-4 text-blue-400" />
            <span>ตัวกรองคิว:</span>
          </div>

          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
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
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">ทุกสถานะงาน</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Dispatched to KANNA">Dispatched to KANNA</option>
            <option value="STS In-Progress">STS In-Progress</option>
            <option value="Passed (Closed)">Passed (Closed)</option>
            <option value="Penalty E-CN Issued">Penalty E-CN Issued</option>
          </select>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหา Ref, ชื่อลูกค้า, หรือ ประเภทงาน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-72 px-3 py-1.5 pl-9 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <Layers className="h-4 w-4 text-slate-500 absolute left-3 top-2" />
        </div>
      </div>

      {/* Main Queue List Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-white">ตารางรายการคิวงานติดตั้ง (Real-Time Installation Queue)</h2>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
              {filteredBookings.length} รายการ
            </span>
          </div>
          <span className="text-xs text-slate-400">อัปเดตสถานะอัตโนมัติ Real-Time</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Booking Ref / วันเวลา</th>
                <th className="px-4 py-3">ลูกค้า / โซน</th>
                <th className="px-4 py-3">ประเภทงานติดตั้ง</th>
                <th className="px-4 py-3">Skill Level Required</th>
                <th className="px-4 py-3">ทีมช่างที่ได้รับมอบหมาย</th>
                <th className="px-4 py-3">สถานะ (Status)</th>
                <th className="px-4 py-3 text-right">ดำเนินการ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    ไม่พบรายการคิวงานที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const assignedTech = technicians.find((t) => t.id === b.assignedTechTeamId);
                  return (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono">
                        <div className="font-bold text-slate-200">{b.bookingRef}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{b.bookingDate} | {b.timeSlot}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">จาก {b.createdFrom}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-200">{b.customerName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[180px]">{b.addressZone}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">{b.installationTypeName}</div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Skill Level {b.requiredSkillLevel}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {assignedTech ? (
                          <div className="flex items-center space-x-2">
                            <img
                              src={assignedTech.avatar}
                              alt={assignedTech.name}
                              className="h-6 w-6 rounded-full object-cover border border-slate-700"
                            />
                            <div>
                              <div className="font-medium text-slate-200 text-[11px]">{assignedTech.name}</div>
                              <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                                <span className={
                                  assignedTech.tier === 'Gold' ? 'text-amber-400 font-bold' :
                                  assignedTech.tier === 'Silver' ? 'text-slate-300 font-bold' :
                                  assignedTech.tier === 'Cooldown' ? 'text-rose-400 font-bold' : 'text-slate-400'
                                }>
                                  Tier: {assignedTech.tier}
                                </span>
                                <span>• Rating: ⭐ {assignedTech.rating}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-400 font-semibold italic">ยังไม่ได้มอบหมายทีม</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadge(b.status)}`}>
                          {b.status}
                        </span>
                        {b.penaltyRef && (
                          <div className="text-[10px] text-rose-400 font-mono mt-1 flex items-center space-x-1">
                            <ShieldAlert className="h-3 w-3" />
                            <span>{b.penaltyRef}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {b.status === 'Scheduled' && (
                            <button
                              onClick={() => onDispatchToKanna(b.id)}
                              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition-colors flex items-center space-x-1"
                            >
                              <Send className="h-3 w-3" />
                              <span>ส่ง KANNA</span>
                            </button>
                          )}

                          <button
                            onClick={() => onSelectBookingForSim(b)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-[11px] transition-colors flex items-center space-x-1"
                          >
                            <span>ทดลอง Sim Flow</span>
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
    </div>
  );
};
