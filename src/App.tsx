import { useState } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { SmartBookingView } from './components/SmartBookingView';
import { SkillMatrixView } from './components/SkillMatrixView';
import { IntegrationFlowView } from './components/IntegrationFlowView';
import { PenaltyAuditView } from './components/PenaltyAuditView';

import type { Technician, QueueBooking, PenaltyRecord } from './types';
import { INITIAL_TECHNICIANS, INITIAL_BOOKINGS, INITIAL_PENALTIES } from './mockData';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [technicians, setTechnicians] = useState<Technician[]>(INITIAL_TECHNICIANS);
  const [bookings, setBookings] = useState<QueueBooking[]>(INITIAL_BOOKINGS);
  const [penalties, setPenalties] = useState<PenaltyRecord[]>(INITIAL_PENALTIES);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Stats calculation
  const activeTechsCount = technicians.filter((t) => t.status === 'Available').length;
  const pendingBookingsCount = bookings.filter((b) => b.status === 'Pending Dispatch' || b.status === 'Scheduled').length;
  const activePenaltiesCount = penalties.filter((p) => p.status === 'Active Penalty').length;
  const slaPercentage = 96.5;

  // Handlers
  const handleConfirmBooking = (newBooking: QueueBooking) => {
    setBookings((prev) => [newBooking, ...prev]);
    showToast(`เพิ่มคิวงานติดตั้งใหม่ ${newBooking.bookingRef} เรียบร้อยแล้ว`);
  };

  const handleDispatchToKanna = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'Dispatched to KANNA' } : b))
    );
    showToast('ส่งข้อมูลงานติดตั้งไปยังระบบ KANNA (Project Flow) เรียบร้อยแล้ว');
  };

  const handleUpdateTechnician = (updatedTech: Technician) => {
    setTechnicians((prev) => prev.map((t) => (t.id === updatedTech.id ? updatedTech : t)));
    showToast(`อัปเดตข้อมูลและ Skill ของ ${updatedTech.name} เรียบร้อยแล้ว`);
  };

  const handleTriggerPenaltyEvent = (
    techId: string,
    bookingRef: string,
    violationType: string,
    fine: number,
    points: number,
    details: string
  ) => {
    const tech = technicians.find((t) => t.id === techId);
    if (!tech) return;

    const eCnNum = `ECN-2026-0723-${Math.floor(Math.random() * 90 + 10)}`;
    const newPenalty: PenaltyRecord = {
      id: `pen-${Date.now()}`,
      eCnNumber: eCnNum,
      bookingRef,
      techId: tech.id,
      techName: tech.name,
      violationType: violationType as any,
      fineAmountTHB: fine,
      scoreDeduction: points,
      tierImpact: 'ปรับลดเป็น Cooldown / หัก Priority 20%',
      issuedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Active Penalty',
      details,
    };

    setPenalties((prev) => [newPenalty, ...prev]);

    // Update technician status & points in real time
    setTechnicians((prev) =>
      prev.map((t) => {
        if (t.id === techId) {
          const newPts = t.penaltyPoints + points;
          return {
            ...t,
            penaltyPoints: newPts,
            tier: 'Cooldown',
            status: 'In Cooldown',
            activePenaltiesCount: t.activePenaltiesCount + 1,
          };
        }
        return t;
      })
    );

    // Update booking status
    setBookings((prev) =>
      prev.map((b) => (b.bookingRef === bookingRef ? { ...b, status: 'Penalty E-CN Issued', penaltyRef: eCnNum } : b))
    );

    showToast(`ออก E-CN ${eCnNum} สำหรับ ${tech.name} ปรับ ${fine} บาท & พักคิวงานสำเร็จ!`);
  };

  const handleRewardTechnician = (techId: string) => {
    setTechnicians((prev) =>
      prev.map((t) => {
        if (t.id === techId) {
          return {
            ...t,
            rating: Math.min(5.0, Number((t.rating + 0.05).toFixed(2))),
            completedJobs: t.completedJobs + 1,
          };
        }
        return t;
      })
    );
    showToast('มอบคะแนนโบนัสความพึงพอใจ 5 ดาวให้ทีมช่างเรียบร้อย!');
  };

  const handleResetData = () => {
    setTechnicians(INITIAL_TECHNICIANS);
    setBookings(INITIAL_BOOKINGS);
    setPenalties(INITIAL_PENALTIES);
    showToast('รีเซ็ตข้อมูล Mock ทั้งหมดกลับสู่ค่าเริ่มต้นเรียบร้อยแล้ว');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium text-xs shadow-2xl shadow-indigo-600/40 border border-indigo-400 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={{
          activeTechs: activeTechsCount,
          pendingBookings: pendingBookingsCount,
          slaPercentage,
          totalPenalties: activePenaltiesCount,
        }}
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            bookings={bookings}
            technicians={technicians}
            onDispatchToKanna={handleDispatchToKanna}
            onSelectBookingForSim={() => {
              setActiveTab('integration-flow');
            }}
          />
        )}

        {activeTab === 'smart-booking' && (
          <SmartBookingView
            technicians={technicians}
            onConfirmBooking={(b) => {
              handleConfirmBooking(b);
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'skill-matrix' && (
          <SkillMatrixView
            technicians={technicians}
            onUpdateTechnician={handleUpdateTechnician}
          />
        )}

        {activeTab === 'integration-flow' && (
          <IntegrationFlowView
            bookings={bookings}
            technicians={technicians}
            onTriggerPenaltyEvent={handleTriggerPenaltyEvent}
            onRewardTechnician={handleRewardTechnician}
          />
        )}

        {activeTab === 'penalty-audit' && (
          <PenaltyAuditView penalties={penalties} />
        )}
      </main>
    </div>
  );
}

export default App;
