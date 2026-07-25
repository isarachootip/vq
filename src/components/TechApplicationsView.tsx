import React, { useState } from 'react';
import type { TechnicianApplication } from '../types';
import { 
  Users, 
  Search, 
  Filter, 
  Check, 
  UserCheck, 
  Briefcase, 
  FileSignature, 
  AlertCircle 
} from 'lucide-react';

interface TechApplicationsViewProps {
  applications: TechnicianApplication[];
  onUpdateStatus: (id: string, newStatus: TechnicianApplication['status']) => void;
  onDeleteApplication: (id: string) => void;
}

export const TechApplicationsView: React.FC<TechApplicationsViewProps> = ({
  applications,
  onUpdateStatus,
  onDeleteApplication
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredApps = applications.filter((app) => {
    const matchesStatus = selectedStatus === 'ALL' || app.status === selectedStatus;
    const matchesSearch = 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.lineId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.refNum.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: TechnicianApplication['status']) => {
    switch (status) {
      case 'accept':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'approve':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'sign contract':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'employee':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'reject':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusTextTh = (status: TechnicianApplication['status']) => {
    switch (status) {
      case 'accept':
        return 'รับสมัครขั้นต้น (Accept)';
      case 'approve':
        return 'ผ่านการประเมิน (Approve)';
      case 'sign contract':
        return 'เซ็นสัญญา (Sign Contract)';
      case 'employee':
        return 'บรรจุเป็นช่าง (Employee)';
      case 'reject':
        return 'ปฏิเสธคำขอ (Reject)';
      default:
        return status;
    }
  };

  // Stats Counters
  const countTotal = applications.length;
  const countAccept = applications.filter(a => a.status === 'accept').length;
  const countApprove = applications.filter(a => a.status === 'approve').length;
  const countContract = applications.filter(a => a.status === 'sign contract').length;
  const countEmployee = applications.filter(a => a.status === 'employee').length;
  const countReject = applications.filter(a => a.status === 'reject').length;

  return (
    <div className="space-y-6">
      
      {/* 1. Header Block */}
      <div className="v-panel p-5 bg-white border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-800">จัดการใบสมัครทีมช่าง (Technician Applications)</h2>
          </div>
          <p className="text-xs text-slate-500">
            ตรวจสอบข้อมูลผู้สมัครงานช่าง vFixQ ประเมินทักษะฝีมือ และปรับสถานะเอกสารตามลำดับขั้นรับช่างใหม่
          </p>
        </div>
      </div>

      {/* 2. Stats Dashboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="v-panel p-4 bg-white border border-slate-200 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400">ขั้นแรกรับสมัคร</span>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-black text-blue-600">{countAccept}</span>
            <span className="text-[10px] text-slate-400 font-bold">Accept</span>
          </div>
        </div>

        <div className="v-panel p-4 bg-white border border-slate-200 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400">ผ่านการประเมิน</span>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-black text-yellow-600">{countApprove}</span>
            <span className="text-[10px] text-slate-400 font-bold">Approve</span>
          </div>
        </div>

        <div className="v-panel p-4 bg-white border border-slate-200 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400">รอทำสัญญา</span>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-black text-purple-600">{countContract}</span>
            <span className="text-[10px] text-slate-400 font-bold">Sign Contract</span>
          </div>
        </div>

        <div className="v-panel p-4 bg-white border border-slate-200 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400">บรรจุเป็นช่างสำเร็จ</span>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-black text-emerald-600">{countEmployee}</span>
            <span className="text-[10px] text-slate-400 font-bold">Employee</span>
          </div>
        </div>

        <div className="v-panel p-4 bg-white border border-slate-200 flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">ไม่ผ่านการพิจารณา</span>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-black text-rose-500">{countReject}</span>
            <span className="text-[10px] text-slate-400 font-bold">Reject</span>
          </div>
        </div>

      </div>

      {/* 3. Search & Filters */}
      <div className="v-panel p-4 bg-white border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-slate-500 font-bold">
            <Filter className="h-4 w-4 text-amber-500" />
            <span>กรองตามสถานะ:</span>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="v-input py-1 px-3 text-xs"
          >
            <option value="ALL">แสดงทั้งหมด (Total: {countTotal})</option>
            <option value="accept">รับสมัครขั้นต้น (Accept)</option>
            <option value="approve">ผ่านการประเมิน (Approve)</option>
            <option value="sign contract">เซ็นสัญญา (Sign Contract)</option>
            <option value="employee">บรรจุเป็นช่าง (Employee)</option>
            <option value="reject">ปฏิเสธคำขอ (Reject)</option>
          </select>
        </div>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="ค้นหาชื่อผู้สมัคร, เบอร์โทร, LINE ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="v-input w-full pl-9 py-1.5 text-xs rounded-full border-slate-200 bg-slate-100"
          />
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* 4. Main Applications Table */}
      <div className="v-panel overflow-hidden bg-white border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">🗂️ รายการใบสมัครช่างติดตั้ง ({filteredApps.length} รายการ)</h3>
          <span className="text-[10px] text-slate-400">อัปเดตเรียลไทม์เมื่อช่างกรอกข้อมูลจากหน้าร้าน</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="v-table">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">รหัสใบสมัคร / วันที่</th>
                <th className="px-4 py-3 text-left">รูปโปรไฟล์</th>
                <th className="px-4 py-3 text-left">ข้อมูลหัวหน้าทีม</th>
                <th className="px-4 py-3 text-left">พิกัดรับงาน / ประสบการณ์</th>
                <th className="px-4 py-3 text-left">ทักษะความชำนาญ</th>
                <th className="px-4 py-3 text-left">สถานะสมัคร (Status)</th>
                <th className="px-4 py-3 text-right">การจัดการสถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                    ไม่พบรายการใบสมัครช่างตามตัวกรองนี้
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono">
                      <div className="font-bold text-slate-800">{app.refNum}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{app.appliedAt}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="h-10 w-10 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center text-slate-400 font-mono text-[9px] relative shadow-inner">
                        {app.avatarUrl ? (
                          <img src={app.avatarUrl} alt={app.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>ไม่มีรูป</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{app.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">📞 {app.phone}</div>
                      <div className="text-[10px] text-blue-600 mt-0.5">💬 LINE: {app.lineId}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{app.zone.split(':')[0]}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">ประสบการณ์ {app.experience}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {app.skills.map((s) => (
                          <span 
                            key={s} 
                            className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] text-slate-600 font-semibold"
                          >
                            {s.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(app.status)}`}>
                        {getStatusTextTh(app.status)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        
                        {/* Status Transition buttons */}
                        {app.status === 'accept' && (
                          <>
                            <button
                              onClick={() => onUpdateStatus(app.id, 'approve')}
                              className="px-2 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold text-[10px] cursor-pointer border-0 shadow-xs flex items-center gap-0.5"
                              title="ผ่านการประเมินเบื้องต้น"
                            >
                              <UserCheck className="h-3 w-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => onUpdateStatus(app.id, 'reject')}
                              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-[10px] cursor-pointer border border-rose-200"
                              title="ปฏิเสธใบสมัคร"
                            >
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {app.status === 'approve' && (
                          <>
                            <button
                              onClick={() => onUpdateStatus(app.id, 'sign contract')}
                              className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] cursor-pointer border-0 shadow-xs flex items-center gap-0.5"
                              title="เตรียมเซ็นสัญญา"
                            >
                              <FileSignature className="h-3 w-3" />
                              <span>Sign Contract</span>
                            </button>
                            <button
                              onClick={() => onUpdateStatus(app.id, 'reject')}
                              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-[10px] cursor-pointer border border-rose-200"
                            >
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {app.status === 'sign contract' && (
                          <>
                            <button
                              onClick={() => onUpdateStatus(app.id, 'employee')}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer border-0 shadow-xs flex items-center gap-0.5"
                              title="บรรจุเป็นช่างเข้าสู่ระบบงานติดตั้ง"
                            >
                              <Briefcase className="h-3 w-3" />
                              <span>Employee</span>
                            </button>
                            <button
                              onClick={() => onUpdateStatus(app.id, 'reject')}
                              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-[10px] cursor-pointer border border-rose-200"
                            >
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {app.status === 'employee' && (
                          <span className="text-emerald-600 font-bold text-[10px] flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            <Check className="h-3.5 w-3.5" />
                            <span>บรรจุเป็นช่างแล้ว</span>
                          </span>
                        )}

                        {app.status === 'reject' && (
                          <button
                            onClick={() => onDeleteApplication(app.id)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 font-semibold text-[10px] cursor-pointer border border-slate-200"
                            title="ลบเอกสารใบสมัคร"
                          >
                            <span>ลบใบสมัคร</span>
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Warning Alert Panel */}
      <div className="v-panel p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 text-xs leading-relaxed text-amber-800">
        <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <span className="font-bold">💡 คำแนะนำสำหรับการทดลองยื่นเอกสารสมัครช่าง:</span>
          <p className="mt-0.5 text-slate-600">
            ท่านสามารถเปิดหน้าเว็บหน้าร้านลูกค้า กรอกสมัครช่างหัวข้อย่อยด้านล่าง ใส่ชื่อ เบอร์โทร ไอดีไลน์ และเลือกอัปรูปภาพใบหน้าของท่าน 
            ใบสมัครดังกล่าวจะปรากฏเข้าสู่หน้าจอนี้แบบเรียลไทม์ โดยเมื่อผู้ดูแลคลิกเปลี่ยนสถานะจนถึงขั้น **"Employee"** ข้อมูลช่างคนนี้จะได้รับการแปลงสถานะเข้าสู่ฐานช่างพร้อมออกปฏิบัติงานของ Vfixq (มีชื่อ รูปโปรไฟล์ และสเตตัสในระบบแผนที่อัจฉริยะ) ทันที!
          </p>
        </div>
      </div>

    </div>
  );
};
