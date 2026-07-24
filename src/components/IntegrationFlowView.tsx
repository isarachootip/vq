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
      setCurrentStep(2);
      addLog(
        'Selling Tools',
        'Installer Management',
        'POST /api/v1/booking/confirm',
        `ลูกค้าสั่งซื้อสำเร็จ อนุมัติคิวงาน ${selectedBooking.bookingRef} แมตช์ทีมช่าง ${selectedBooking.assignedTechTeamName}`,
        'success'
      );
    } else if (currentStep === 2) {
      setCurrentStep(3);
      addLog(
        'Installer Management',
        'KANNA',
        'POST /api/v1/kanna/project/create',
        `สร้าง Order ID ใน KANNA มอบหมายทีม ${selectedBooking.assignedTechTeamName} พร้อม Checklist งานติดตั้ง`,
        'info'
      );
    } else if (currentStep === 3) {
      setCurrentStep(4);
      addLog(
        'KANNA',
        'STS',
        'Check-In & Progress Sync',
        `ช่างเข้าหน้างาน และ Check-in ผ่านแอป STS อัปโหลดรูปภาพเตรียมงานติดตั้ง`,
        'info'
      );
    } else if (currentStep === 4) {
      setCurrentStep(5);
      addLog(
        'STS',
        'QC',
        'POST /api/v1/qc/review/submit',
        `ช่างส่งมอบงานติดตั้งเสร็จสิ้น ยื่นเรื่องเข้าสู่กระบวนการตรวจ QC`,
        'info'
      );
    } else if (currentStep === 5) {
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
      <div className="v-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800 font-sans">จำลองวงจรการทำงานและการเชื่อมโยงข้อมูล (Integration Simulator)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            จำลองเวิร์กโฟลว์ตั้งแต่ Selling tools ➔ Installer Management ➔ KANNA ➔ STS ➔ QC ➔ Penalty E-CN Feedback Loop
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <select
            value={selectedBooking?.id}
            onChange={(e) => {
              const b = bookings.find((bk) => bk.id === e.target.value);
              if (b) setSelectedBooking(b);
            }}
            className="v-input py-1.5 text-xs font-semibold"
          >
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bookingRef} ({b.customerName})
              </option>
            ))}
          </select>

          <button
            onClick={handleResetFlow}
            className="v-btn-secondary py-1.5 text-xs flex items-center space-x-1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>เริ่มรอบใหม่</span>
          </button>

          <button
            onClick={handleNextStep}
            disabled={currentStep >= 6}
            className="v-btn-primary py-1.5 text-xs flex items-center space-x-1.5 shadow-sm disabled:opacity-40"
          >
            <Play className="h-4 w-4" />
            <span>ขั้นตอนถัดไป (Step {currentStep < 6 ? currentStep + 1 : 6})</span>
          </button>
        </div>
      </div>

      {/* Diagram (Matching User Prompt Image Architecture) */}
      <div className="v-panel p-6 bg-white space-y-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
          แผนผังการรับส่งข้อมูลระหว่างระบบ (vService Integration Map)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {/* Box 1: Sales & Ordering (Light Purple) */}
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-3">
            <div className="flex items-center justify-between border-b border-purple-200 pb-2">
              <span className="text-xs font-bold text-purple-700">1. งานขายและออกแบบ</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">Front-Office</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center shadow-xs">
                <span className="font-semibold text-slate-700">Selling tools</span>
                <span className="text-[10px] text-slate-400 font-mono">E-ordering / Checklist</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center shadow-xs">
                <span className="font-semibold text-slate-700">POS</span>
                <span className="text-[10px] text-slate-400 font-mono">รับชำระเงิน</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center shadow-xs">
                <span className="font-semibold text-slate-700">COOHOM</span>
                <span className="text-[10px] text-slate-400 font-mono">ออกแบบ 3D / สเปก</span>
              </div>
            </div>
          </div>

          {/* Box 2: Installer Management (HIGHLIGHTED BLUE CENTERPIECE) */}
          <div className={`p-5 rounded-xl border-2 transition-all space-y-3 ${
            currentStep >= 2 ? 'bg-blue-50/50 border-blue-500 shadow-md scale-[1.02]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between border-b border-blue-200 pb-2">
              <span className="text-sm font-bold text-blue-700">2. Installer Management</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 border border-blue-300">
                Core Scheduling
              </span>
            </div>
            <div className="text-xs text-slate-700 space-y-2">
              <div className="p-2.5 rounded-lg bg-white border border-blue-300 text-center font-bold text-blue-700 shadow-xs">
                คิวช่าง · Skill Matrix · Penalty Control
              </div>
              <div className="text-[11px] text-slate-500 space-y-1">
                <div>• คัดเลือกช่างตามระดับทักษะ Level 1-3</div>
                <div>• ตรวจสอบความถูกต้องของสังกัดสาขา</div>
                <div>• ปรับสถานะช่างอัตโนมัติจาก Penalty E-CN</div>
              </div>
            </div>
          </div>

          {/* Box 3: Execution & QC (Light Emerald) */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <span className="text-xs font-bold text-emerald-700">3. งานติดตั้งและตรวจสอบ</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Field Execution</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className={`p-2.5 rounded-lg border transition-colors ${currentStep >= 3 ? 'bg-white border-emerald-500 text-emerald-700 font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-500'}`}>
                KANNA (Project Flow · Order)
              </div>
              <div className={`p-2.5 rounded-lg border transition-colors ${currentStep >= 4 ? 'bg-white border-cyan-500 text-cyan-700 font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-500'}`}>
                STS (Work Tracking)
              </div>
              <div className={`p-2.5 rounded-lg border transition-colors ${currentStep >= 5 ? 'bg-white border-purple-500 text-purple-700 font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-500'}`}>
                QC (Job Review)
              </div>
            </div>
          </div>
        </div>

        {/* Step 5 Scenario Selection */}
        {currentStep === 5 && (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 animate-scaleUp">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              จำลองผลการประเมินคุณภาพงาน (Select QC & Cust Sat Outcome):
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setQcResult('PASS')}
                className={`p-3 rounded-lg border text-xs font-bold flex items-center space-x-2 transition-all ${
                  qcResult === 'PASS'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>ผ่าน QC 100% (ประเมิน 5 ดาว + ได้โบนัส)</span>
              </button>

              <button
                type="button"
                onClick={() => setQcResult('FAIL_QC')}
                className={`p-3 rounded-lg border text-xs font-bold flex items-center space-x-2 transition-all ${
                  qcResult === 'FAIL_QC'
                    ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>ตก QC (ปรับ E-CN + สั่งพักงานชั่วคราว)</span>
              </button>

              <button
                type="button"
                onClick={() => setQcResult('LATE_ARRIVE')}
                className={`p-3 rounded-lg border text-xs font-bold flex items-center space-x-2 transition-all ${
                  qcResult === 'LATE_ARRIVE'
                    ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                <span>เข้างานสายผิด SLA (ปรับเงิน + ลดลำดับคิว)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Live Logs */}
      <div className="v-panel p-5 bg-white space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            ประวัติการรับส่งข้อมูลระบบ (System Integration Payload Audit Logs)
          </h3>
          <span className="text-[10px] text-slate-400 font-mono font-semibold">Active Stream</span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`p-3 rounded-lg border text-xs font-mono flex items-start space-x-3 transition-all ${
                log.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : log.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : log.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <span className="text-[10px] text-slate-400 font-bold shrink-0 pt-0.5">{log.timestamp}</span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.2 rounded bg-white border border-slate-200 text-[10px] text-slate-600 font-bold">
                    {log.sourceSystem} ➔ {log.targetSystem}
                  </span>
                  <span className="font-bold text-slate-800">{log.action}</span>
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
