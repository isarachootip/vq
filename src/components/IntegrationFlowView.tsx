import React, { useState } from 'react';
import type { QueueBooking, Technician, IntegrationEvent } from '../types';
import { Play, CheckCircle2, ShieldAlert, AlertTriangle, Cpu, RefreshCw } from 'lucide-react';

interface IntegrationFlowViewProps {
  bookings: QueueBooking[];
  technicians: Technician[];
  onTriggerPenaltyEvent: (techId: string, bookingRef: string, violationType: string, fine: number, points: number, details: string) => void;
  onRewardTechnician: (techId: string) => void;
}

export const IntegrationFlowView: React.FC<IntegrationFlowViewProps> = ({
  bookings,
  technicians,
  onTriggerPenaltyEvent,
  onRewardTechnician,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedBooking, setSelectedBooking] = useState<QueueBooking>(bookings[0]);
  const [qcResult, setQcResult] = useState<'PASS' | 'FAIL_QC' | 'LATE_ARRIVE'>('PASS');
  const [logs, setLogs] = useState<IntegrationEvent[]>([
    {
      id: 'log-01',
      timestamp: '08:30:12',
      sourceSystem: 'Selling Tools',
      targetSystem: 'Installer Management',
      action: 'API /booking/slots/search',
      payloadSummary: 'ค้นหา Slot ว่างสำหรับงาน Built-in Kitchen (Skill Level 3, Zone 1)',
      type: 'info',
    },
    {
      id: 'log-02',
      timestamp: '08:30:15',
      sourceSystem: 'Installer Management',
      targetSystem: 'Selling Tools',
      action: 'Slot Locked (Hold 15 mins)',
      payloadSummary: 'ล็อค Slot ช่างสมชาย (T-GOLD-01) วันที่ 2026-07-24 (09:00 - 17:00)',
      type: 'success',
    },
  ]);

  const assignedTech = technicians.find((t) => t.id === selectedBooking?.assignedTechTeamId);

  const addLog = (
    source: IntegrationEvent['sourceSystem'],
    target: IntegrationEvent['targetSystem'],
    action: string,
    payload: string,
    type: IntegrationEvent['type'] = 'info'
  ) => {
    const newLog: IntegrationEvent = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toTimeString().split(' ')[0],
      sourceSystem: source,
      targetSystem: target,
      action,
      payloadSummary: payload,
      type,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Step 1 -> 2: Auto Match
      setCurrentStep(2);
      addLog(
        'Selling Tools',
        'Installer Management',
        'POST /api/v1/booking/confirm',
        `ลูกค้าสั่งซื้อสำเร็จ อนุมัติคิวงาน ${selectedBooking.bookingRef} แมตช์ทีมช่าง ${selectedBooking.assignedTechTeamName}`,
        'success'
      );
    } else if (currentStep === 2) {
      // Step 2 -> 3: Dispatch to KANNA
      setCurrentStep(3);
      addLog(
        'Installer Management',
        'KANNA',
        'POST /api/v1/kanna/project/create',
        `สร้าง Order ID ใน KANNA มอบหมายทีม ${selectedBooking.assignedTechTeamName} พร้อม Checklist งานติดตั้ง`,
        'info'
      );
    } else if (currentStep === 3) {
      // Step 3 -> 4: STS Work Tracking
      setCurrentStep(4);
      addLog(
        'KANNA',
        'STS',
        'Check-In & Progress Sync',
        `ช่างเข้าหน้างาน และ Check-in ผ่านแอป STS อัปโหลดรูปภาพเตรียมงานติดตั้ง`,
        'info'
      );
    } else if (currentStep === 4) {
      // Step 4 -> 5: Submit QC
      setCurrentStep(5);
      addLog(
        'STS',
        'QC',
        'POST /api/v1/qc/review/submit',
        `ช่างส่งมอบงานติดตั้งเสร็จสิ้น ยื่นเรื่องเข้าสู่กระบวนการตรวจ QC`,
        'info'
      );
    } else if (currentStep === 5) {
      // Step 5 -> 6: Evaluation & Penalty Feedback
      setCurrentStep(6);
      if (qcResult === 'PASS') {
        addLog(
          'QC',
          '1308 Cust. Sat',
          'Pass Review -> Cust Sat 5 Stars',
          `งานผ่าน QC ลูกค้าประเมินความพึงพอใจ 5 ดาวเต็ม`,
          'success'
        );
        addLog(
          '1308 Cust. Sat',
          'E-billing',
          'Issue E-Invoice / E-Tax',
          `ออก E-Invoice รับชำระเงินเรียบร้อย`,
          'success'
        );
        addLog(
          '1308 Cust. Sat',
          'Installer Management',
          'Incentive Score Reward',
          `ส่งคะแนนความพึงพอใจกลับ Installer Management เพื่อเพิ่ม Incentive Bonus ให้ทีมช่าง +5 คะแนน`,
          'success'
        );
        if (assignedTech) onRewardTechnician(assignedTech.id);
      } else if (qcResult === 'FAIL_QC') {
        addLog(
          'QC',
          'Penalty System (E-CN)',
          'QC Failed -> Issue E-CN Penalty',
          `ตรวจพบงาน Defect โครงสร้างเอียง ออก E-CN ปรับ 3,500 บาท และหักคะแนน 25 คะแนน`,
          'error'
        );
        addLog(
          'Penalty System (E-CN)',
          'Installer Management',
          'Feedback Loop: Penalty Enforcement',
          `ส่ง Event ปรับลด Tier ช่างเป็น Cooldown (พักงาน 7 วัน) และปรับลด Queue Priority อัตโนมัติ!`,
          'warning'
        );
        if (assignedTech) {
          onTriggerPenaltyEvent(
            assignedTech.id,
            selectedBooking.bookingRef,
            'QC Defect / Failed Review',
            3500,
            25,
            'งาน QC ไม่ผ่าน ตรวจพบโครงสร้างเอียงและรอยขีดข่วน'
          );
        }
      } else if (qcResult === 'LATE_ARRIVE') {
        addLog(
          'STS',
          'Penalty System (E-CN)',
          'SLA Breach: Late Arrival > 2 Hrs',
          `เข้างานสายเกินกำหนด ออก E-CN ปรับ 1,000 บาท หักคะแนน SLA 10 คะแนน`,
          'error'
        );
        addLog(
          'Penalty System (E-CN)',
          'Installer Management',
          'Feedback Loop: Priority Degradation',
          `หัก Queue Priority ในการจ่ายงานรอบถัดไป 15%`,
          'warning'
        );
        if (assignedTech) {
          onTriggerPenaltyEvent(
            assignedTech.id,
            selectedBooking.bookingRef,
            'Late Arrival (SLA Breach)',
            1000,
            10,
            'เข้าหน้างานสายกว่าเวลานัดหมาย 2 ชั่วโมง'
          );
        }
      }
    }
  };

  const handleResetFlow = () => {
    setCurrentStep(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="h-6 w-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">System Integration Workflow Simulator</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            จำลองวงจรการทำงานและการรับส่งข้อมูลตั้งแต่ Selling tools $\rightarrow$ Installer Management $\rightarrow$ KANNA $\rightarrow$ STS $\rightarrow$ QC $\rightarrow$ Penalty E-CN Feedback Loop
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedBooking?.id}
            onChange={(e) => {
              const b = bookings.find((bk) => bk.id === e.target.value);
              if (b) setSelectedBooking(b);
            }}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
          >
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bookingRef} ({b.customerName})
              </option>
            ))}
          </select>

          <button
            onClick={handleResetFlow}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center space-x-1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>เริ่ม Step 1 ใหม่</span>
          </button>

          <button
            onClick={handleNextStep}
            disabled={currentStep >= 6}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 disabled:opacity-40 flex items-center space-x-1.5"
          >
            <Play className="h-4 w-4" />
            <span>ถัดไป: Step {currentStep < 6 ? currentStep + 1 : 6}</span>
          </button>
        </div>
      </div>

      {/* Interactive Visual Flow Diagram (Matching User Prompt Image Architecture) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
          แผนผังการเชื่อมโยงระบบ (System Architecture Integration Diagram)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {/* Box 1: Selling tools & Design (Purple Theme) */}
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
              <span className="text-xs font-bold text-purple-300">งานขายและออกแบบ</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">Front-End</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <span className="font-semibold text-slate-200">Selling tools</span>
                <span className="text-[10px] text-slate-400">E-ordering / checklist</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <span className="font-semibold text-slate-200">POS</span>
                <span className="text-[10px] text-slate-400">ชำระเงินหน้าร้าน</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <span className="font-semibold text-slate-200">COOHOM</span>
                <span className="text-[10px] text-slate-400">ออกแบบ · ยืนยันแบบ</span>
              </div>
            </div>
          </div>

          {/* Box 2: Installer Management (HIGHLIGHTED GREEN CENTERPIECE) */}
          <div className={`p-5 rounded-2xl border-2 transition-all space-y-3 ${
            currentStep >= 2 ? 'bg-indigo-950/60 border-indigo-500 glow-blue shadow-2xl scale-[1.02]' : 'bg-slate-900/40 border-slate-700'
          }`}>
            <div className="flex items-center justify-between border-b border-indigo-500/40 pb-2">
              <span className="text-sm font-extrabold text-indigo-300">Installer management</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400">
                ★ Core Scheduling Engine
              </span>
            </div>
            <div className="text-xs text-slate-300 space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-indigo-500/40 text-center font-bold text-indigo-300">
                คิวช่าง · Skill Matrix · Penalty Control
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div>• จับคู่ Skill Level (1-3) + Zone</div>
                <div>• คำนวณ Capacity & Available Slots</div>
                <div>• รับ Feedback Loop ปรับคะแนน Penalty</div>
              </div>
            </div>
          </div>

          {/* Box 3: Execution & QC (Green Theme) */}
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
              <span className="text-xs font-bold text-emerald-300">งานติดตั้งและ QC</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Field Execution</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className={`p-2.5 rounded-lg border transition-colors ${currentStep >= 3 ? 'bg-slate-900 border-emerald-500 text-emerald-300 font-bold' : 'bg-slate-900/80 border-slate-800 text-slate-300'}`}>
                KANNA (project flow · order)
              </div>
              <div className={`p-2.5 rounded-lg border transition-colors ${currentStep >= 4 ? 'bg-slate-900 border-cyan-500 text-cyan-300 font-bold' : 'bg-slate-900/80 border-slate-800 text-slate-300'}`}>
                STS (work tracking)
              </div>
              <div className={`p-2.5 rounded-lg border transition-colors ${currentStep >= 5 ? 'bg-slate-900 border-purple-500 text-purple-300 font-bold' : 'bg-slate-900/80 border-slate-800 text-slate-300'}`}>
                QC (job review)
              </div>
            </div>
          </div>
        </div>

        {/* Step 5 Scenario Selection Bar */}
        {currentStep === 5 && (
          <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/50 space-y-3">
            <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider">
              เลือกผลการตรวจ QC / ประเมินความพึงพอใจเพื่อทดสอบ Feedback Loop:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setQcResult('PASS')}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all ${
                  qcResult === 'PASS'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 glow-emerald font-bold'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>1. ผ่าน QC 100% (5 ดาว + Bonus)</span>
              </button>

              <button
                type="button"
                onClick={() => setQcResult('FAIL_QC')}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all ${
                  qcResult === 'FAIL_QC'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 glow-rose font-bold'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400'
                }`}
              >
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span>2. ไม่ผ่าน QC (ออก E-CN + Cooldown)</span>
              </button>

              <button
                type="button"
                onClick={() => setQcResult('LATE_ARRIVE')}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all ${
                  qcResult === 'LATE_ARRIVE'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 glow-amber font-bold'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400'
                }`}
              >
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                <span>3. เข้างานสาย (SLA Fine + หัก Queue)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Live System Integration Payload Logs */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Live Integration Logs & Payload Audit ({logs.length} Transactions)
          </h3>
          <span className="text-xs text-slate-400 font-mono">Real-time Stream</span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`p-3 rounded-xl border text-xs font-mono flex items-start space-x-3 transition-all ${
                log.type === 'error'
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                  : log.type === 'warning'
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                  : log.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : 'bg-slate-900/70 border-slate-800 text-slate-300'
              }`}
            >
              <span className="text-[10px] text-slate-400 font-semibold shrink-0 pt-0.5">{log.timestamp}</span>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300 font-bold">
                    {log.sourceSystem} $\rightarrow$ {log.targetSystem}
                  </span>
                  <span className="font-bold text-white">{log.action}</span>
                </div>
                <div className="text-[11px] opacity-90 font-sans">{log.payloadSummary}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
