import React from 'react';
import type { PenaltyRecord } from '../types';
import { ShieldAlert, FileText, DollarSign } from 'lucide-react';

interface PenaltyAuditViewProps {
  penalties: PenaltyRecord[];
}

export const PenaltyAuditView: React.FC<PenaltyAuditViewProps> = ({ penalties }) => {
  const totalFineTHB = penalties.reduce((acc, curr) => acc + curr.fineAmountTHB, 0);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="v-panel p-5 flex items-center space-x-4 bg-white">
          <div className="p-3 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{penalties.length} รายการ</div>
            <div className="text-xs text-slate-500 font-semibold">จำนวนโทษปรับสะสม (Total E-CNs)</div>
          </div>
        </div>

        <div className="v-panel p-5 flex items-center space-x-4 bg-white">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">฿{totalFineTHB.toLocaleString()}</div>
            <div className="text-xs text-slate-500 font-semibold">ยอดเงินปรับรวมทั้งหมด</div>
          </div>
        </div>

        <div className="v-panel p-5 flex items-center space-x-4 bg-white">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">100% Automated</div>
            <div className="text-xs text-slate-500 font-semibold">เชื่อมต่อระบบคิวช่างอัตโนมัติ</div>
          </div>
        </div>
      </div>

      {/* Main Audit Table */}
      <div className="v-panel overflow-hidden bg-white">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">ประวัติใบเตือนและการออกใบลงโทษ E-CN (Penalty Records)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ประวัติการส่งข้อมูลจากระบบ "Penalty ตามสัญญา" เพื่อทำการปรับเปลี่ยนคิวงานช่างในระบบบริหารจัดการช่าง
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="v-table text-xs">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">เลขที่ E-CN / Booking Ref</th>
                <th className="px-4 py-3 text-left">ทีมช่างที่ถูกบทลงโทษ</th>
                <th className="px-4 py-3 text-left">ประเภทความผิด (Violation)</th>
                <th className="px-4 py-3 text-left">ค่าปรับ (Fine Amount)</th>
                <th className="px-4 py-3 text-left">คะแนนที่ถูกหัก</th>
                <th className="px-4 py-3 text-left">ผลกระทบต่อคิว & Tier (Impact)</th>
                <th className="px-4 py-3 text-left">รายละเอียดความผิด</th>
              </tr>
            </thead>
            <tbody>
              {penalties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                    ไม่พบรายการประวัติการลงโทษในระบบ
                  </td>
                </tr>
              ) : (
                penalties.map((pen) => (
                  <tr key={pen.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono">
                      <div className="font-bold text-rose-600 flex items-center space-x-0.5">
                        <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                        <span>{pen.eCnNumber}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Ref: {pen.bookingRef}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{pen.issuedAt}</div>
                    </td>

                    <td className="px-4 py-3 font-bold text-slate-800">
                      {pen.techName}
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        {pen.violationType}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-amber-600">
                      ฿{pen.fineAmountTHB.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-rose-600">
                      -{pen.scoreDeduction} คะแนน
                    </td>

                    <td className="px-4 py-3 text-slate-700 font-semibold">
                      {pen.tierImpact}
                    </td>

                    <td className="px-4 py-3 text-slate-500 max-w-xs leading-relaxed">
                      {pen.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
