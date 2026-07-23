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
      {/* Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{penalties.length} รายการ</div>
            <div className="text-xs text-slate-400">จำนวนรายการลงโทษ Penalty E-CN ทั้งหมด</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-300">฿{totalFineTHB.toLocaleString()}</div>
            <div className="text-xs text-slate-400">มูลค่าปรับรวมทั้งหมด (Total E-CN Fines)</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-300">100% Automated</div>
            <div className="text-xs text-slate-400">เชื่อมต่อ Feedback Loop อัตโนมัติกับคิวช่าง</div>
          </div>
        </div>
      </div>

      {/* Main Audit Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">ประวัติการลงโทษและ E-CN Audit Log (Penalty Records)</h2>
            <p className="text-xs text-slate-400">
              ส่งผ่านข้อมูลจากระบบ "Penalty ตามสัญญา (ออก E-CN)" กลับมาปรับลดคะแนนและสถานะคิวช่างใน Installer Management
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">เลขที่ E-CN / Booking Ref</th>
                <th className="px-4 py-3">ทีมช่างที่ได้รับโทษ</th>
                <th className="px-4 py-3">ประเภทความผิด (Violation)</th>
                <th className="px-4 py-3">ค่าปรับ (Fine THB)</th>
                <th className="px-4 py-3">คะแนนที่ถูกหัก</th>
                <th className="px-4 py-3">ผลกระทบต่อคิว & Tier (Impact)</th>
                <th className="px-4 py-3">รายละเอียดความผิด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {penalties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    ยังไม่มีประวัติการลงโทษ Penalty E-CN
                  </td>
                </tr>
              ) : (
                penalties.map((pen) => (
                  <tr key={pen.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono">
                      <div className="font-bold text-rose-400 flex items-center space-x-1">
                        <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                        <span>{pen.eCnNumber}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Ref: {pen.bookingRef}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{pen.issuedAt}</div>
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-200">
                      {pen.techName}
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {pen.violationType}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-amber-300">
                      ฿{pen.fineAmountTHB.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-rose-400">
                      -{pen.scoreDeduction} Points
                    </td>

                    <td className="px-4 py-3 text-slate-300 font-medium">
                      {pen.tierImpact}
                    </td>

                    <td className="px-4 py-3 text-slate-400 max-w-xs text-[11px] leading-relaxed">
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
