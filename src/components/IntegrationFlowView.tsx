import React, { useState, useEffect } from 'react';
import type { QueueBooking, Technician, IntegrationEvent } from '../types';
import { BuildFlowIcon } from './BuildFlowIcon';
import { Play, CheckCircle2, ShieldAlert, AlertTriangle, Cpu, RefreshCw, Database, Eye, X, Trash2 } from 'lucide-react';

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
  const [activeLogTab, setActiveLogTab] = useState<'sim' | 'db'>('sim');
  const [dbLogs, setDbLogs] = useState<any[]>([]);
  const [dbSource, setDbSource] = useState<string>('');
  const [isLoadingDbLogs, setIsLoadingDbLogs] = useState<boolean>(false);
  const [selectedPayloadLog, setSelectedPayloadLog] = useState<any | null>(null);

  const fetchDbLogs = async () => {
    setIsLoadingDbLogs(true);
    try {
      const res = await fetch('/api/integration-logs');
      if (res.ok) {
        const data = await res.json();
        setDbLogs(data.logs || []);
        setDbSource(data.source || 'postgresql');
      }
    } catch (err) {
      console.warn('Could not fetch DB integration logs:', err);
    } finally {
      setIsLoadingDbLogs(false);
    }
  };

  useEffect(() => {
    fetchDbLogs();
  }, []);

  const handleClearDbLogs = async () => {
    if (!window.confirm('คุณต้องการล้างประวัติ integration_logs ในฐานข้อมูลหรือไม่?')) return;
    try {
      await fetch('/api/integration-logs', { method: 'DELETE' });
      fetchDbLogs();
    } catch (err) {
      console.error('Error clearing DB logs:', err);
    }
  };
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
        'BuildFlow',
        'POST /api/v1/buildflow/project/create',
        `สร้าง Order ID ใน BuildFlow มอบหมายทีม ${selectedBooking.assignedTechTeamName} พร้อม Checklist งานติดตั้ง`,
        'info'
      );
    } else if (currentStep === 3) {
      setCurrentStep(4);
      addLog(
        'BuildFlow',
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
            จำลองเวิร์กโฟลว์ตั้งแต่ Selling tools ➔ Installer Management ➔ BuildFlow ➔ STS ➔ QC ➔ Penalty E-CN Feedback Loop
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
              <div className={`p-2.5 rounded-lg border transition-colors flex items-center gap-1.5 ${currentStep >= 3 ? 'bg-white border-purple-500 text-purple-700 font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-500'}`}>
                <BuildFlowIcon className="h-4 w-4" />
                <span>BuildFlow (Project Flow · Order)</span>
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

      {/* Live Logs & Database Logs Section */}
      <div className="v-panel p-5 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-3 gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveLogTab('sim')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeLogTab === 'sim'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>Simulator Stream Logs ({logs.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveLogTab('db');
                fetchDbLogs();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeLogTab === 'db'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>PostgreSQL Logs (`integration_logs`) ({dbLogs.length})</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            {activeLogTab === 'db' && (
              <>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                  DB Source: {dbSource === 'postgresql' ? '🟢 PostgreSQL Live DB' : '🟡 Local Storage JSON'}
                </span>

                <button
                  onClick={fetchDbLogs}
                  disabled={isLoadingDbLogs}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center space-x-1 transition cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoadingDbLogs ? 'animate-spin' : ''}`} />
                  <span>รีเฟรช</span>
                </button>

                <button
                  onClick={handleClearDbLogs}
                  className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[11px] font-semibold flex items-center space-x-1 transition cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>ล้าง Logs</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab 1: Simulator Activity Stream */}
        {activeLogTab === 'sim' && (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
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
        )}

        {/* Tab 2: PostgreSQL integration_logs Table View */}
        {activeLogTab === 'db' && (
          <div className="overflow-x-auto">
            {dbLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                ยังไม่มีข้อมูลในตาราง `integration_logs` (ทดสอบกดปุ่ม "ส่ง BuildFlow" เพื่อให้ระบบเขียน Log ลง DB)
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[11px]">
                    <th className="p-2.5 font-bold">ID</th>
                    <th className="p-2.5 font-bold">Timestamp</th>
                    <th className="p-2.5 font-bold">Source ➔ Target</th>
                    <th className="p-2.5 font-bold">Action</th>
                    <th className="p-2.5 font-bold">Booking Ref</th>
                    <th className="p-2.5 font-bold text-center">Payload JSON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {dbLogs.map((logItem) => {
                    const payloadObj = typeof logItem.payload === 'string' ? JSON.parse(logItem.payload || '{}') : (logItem.payload || {});
                    return (
                      <tr key={logItem.id} className="hover:bg-slate-50 transition">
                        <td className="p-2.5 font-bold text-slate-500">#{logItem.id}</td>
                        <td className="p-2.5 text-slate-500 whitespace-nowrap">
                          {new Date(logItem.created_at || logItem.timestamp).toLocaleString('th-TH')}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200 text-[10px]">
                            {logItem.source_system || logItem.sourceSystem} ➔ {logItem.target_system || logItem.targetSystem}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-slate-800">{logItem.action}</td>
                        <td className="p-2.5 text-blue-600 font-bold">{payloadObj.bookingRef || '-'}</td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => setSelectedPayloadLog(logItem)}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-200 text-[10px] font-bold flex items-center justify-center space-x-1 mx-auto transition cursor-pointer"
                          >
                            <Eye className="h-3 w-3" />
                            <span>ดู JSON</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Payload JSON Inspector Modal */}
      {selectedPayloadLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-fadeIn">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold font-mono">
                  PostgreSQL Record #{selectedPayloadLog.id} (integration_logs)
                </h3>
              </div>
              <button
                onClick={() => setSelectedPayloadLog(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">CREATED AT:</span>
                  <span className="font-bold text-slate-700">
                    {new Date(selectedPayloadLog.created_at).toLocaleString('th-TH')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ACTION / EVENT:</span>
                  <span className="font-bold text-purple-700">{selectedPayloadLog.action}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Payload JSON stored in PostgreSQL:
                </label>
                <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
                  {JSON.stringify(
                    typeof selectedPayloadLog.payload === 'string'
                      ? JSON.parse(selectedPayloadLog.payload)
                      : selectedPayloadLog.payload,
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedPayloadLog(null)}
                className="v-btn-secondary text-xs py-1.5 px-4"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
