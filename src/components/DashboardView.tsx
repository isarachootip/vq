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

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="v-panel p-4 flex items-center space-x-4 bg-white">
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

        <div className="v-panel p-4 flex items-center space-x-4 bg-white">
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

        <div className="v-panel p-4 flex items-center space-x-4 bg-white">
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

        <div className="v-panel p-4 flex items-center space-x-4 bg-white">
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

      {/* Filter & Search Bar */}
      <div className="v-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <Filter className="h-4 w-4 text-blue-600" />
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
            placeholder="ค้นหา Ref, ชื่อลูกค้า, หรือประเภทงาน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="v-input w-full md:w-72 pl-9 py-1 text-xs"
          />
          <Layers className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Main Queue List Table */}
      <div className="v-panel overflow-hidden bg-white">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-800">ตารางรายการคิวงานติดตั้ง (Real-Time Installation Queue)</h2>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-semibold border border-slate-200">
              {filteredBookings.length} รายการ
            </span>
          </div>
          <span className="text-xs text-slate-400">ข้อมูลเชื่อมโยงเรียลไทม์</span>
        </div>

        <div className="overflow-x-auto">
          <table className="v-table text-xs">
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
                    ไม่พบรายการคิวงานติดตั้งในระบบ
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const assignedTech = technicians.find((t) => t.id === b.assignedTechTeamId);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono">
                        <div className="font-bold text-slate-800">{b.bookingRef}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{b.bookingDate} | {b.timeSlot}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">จาก {b.createdFrom}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{b.customerName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{b.addressZone}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {b.installationTypeName}
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
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
                              <div className="font-semibold text-slate-800 text-[11px]">{assignedTech.name}</div>
                              <div className="flex items-center space-x-2 text-[10px] text-slate-500">
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
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${getStatusBadge(b.status)}`}>
                          {b.status}
                        </span>
                        {b.penaltyRef && (
                          <div className="text-[10px] text-rose-600 font-mono mt-1 flex items-center space-x-0.5">
                            <ShieldAlert className="h-3 w-3" />
                            <span>{b.penaltyRef}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {b.status === 'Scheduled' && (
                            <button
                              onClick={() => onDispatchToKanna(b.id)}
                              className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors flex items-center space-x-1 shadow-sm"
                            >
                              <Send className="h-3 w-3" />
                              <span>ส่ง KANNA</span>
                            </button>
                          )}

                          <button
                            onClick={() => onSelectBookingForSim(b)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[11px] transition-colors flex items-center space-x-1 font-semibold"
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
    </div>
  );
};
