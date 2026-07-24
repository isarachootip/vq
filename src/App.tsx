import { useState } from 'react';
import { DashboardView } from './components/DashboardView';
import { SmartBookingView } from './components/SmartBookingView';
import { SkillMatrixView } from './components/SkillMatrixView';
import { IntegrationFlowView } from './components/IntegrationFlowView';
import { PenaltyAuditView } from './components/PenaltyAuditView';
import { BranchManager } from './components/BranchManager';
import { BranchMapView } from './components/BranchMapView';
import { ZoneManager } from './components/ZoneManager';
import { SkillManager } from './components/SkillManager';
import { KmHubView } from './components/KmHubView';
import { QChangPortalView } from './components/QChangPortalView';

import type { Technician, QueueBooking, PenaltyRecord, Branch, Zone, Skill } from './types';
import { 
  INITIAL_TECHNICIANS, 
  INITIAL_BOOKINGS, 
  INITIAL_PENALTIES,
  INITIAL_BRANCHES,
  INITIAL_ZONES,
  INITIAL_SKILLS 
} from './mockData';

import { 
  LayoutDashboard, 
  Calendar, 
  Building, 
  Users, 
  Map, 
  MapPin,
  Wrench, 
  Cpu, 
  ShieldAlert, 
  RefreshCw, 
  Menu,
  ChevronRight,
  BookOpen,
  ShoppingBag
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Data States
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [skills, setSkills] = useState<Skill[]>(INITIAL_SKILLS);
  const [technicians, setTechnicians] = useState<Technician[]>(INITIAL_TECHNICIANS);
  const [bookings, setBookings] = useState<QueueBooking[]>(INITIAL_BOOKINGS);
  const [penalties, setPenalties] = useState<PenaltyRecord[]>(INITIAL_PENALTIES);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Stats
  const activeTechsCount = technicians.filter((t) => t.status === 'Available').length;
  const pendingBookingsCount = bookings.filter((b) => b.status === 'Pending Dispatch' || b.status === 'Scheduled').length;
  const activePenaltiesCount = penalties.filter((p) => p.status === 'Active Penalty').length;

  // Handlers for Branch
  const handleAddBranch = (branch: Branch) => {
    setBranches((prev) => [...prev, branch]);
    showToast(`เพิ่มสาขา ${branch.name} เรียบร้อยแล้ว`);
  };

  const handleAddMultipleBranches = (newBranches: Branch[]) => {
    setBranches((prev) => [...prev, ...newBranches]);
    showToast(`นำเข้าข้อมูลสาขาสำเร็จ ${newBranches.length} รายการ`);
  };

  const handleDeleteBranch = (id: string) => {
    setBranches((prev) => prev.filter((b) => b.id !== id));
    showToast('ลบข้อมูลสาขาสำเร็จ');
  };

  // Handlers for Zone
  const handleAddZone = (zone: Zone) => {
    setZones((prev) => [...prev, zone]);
    showToast(`เพิ่มโซน ${zone.name} เรียบร้อยแล้ว`);
  };

  const handleAddMultipleZones = (newZones: Zone[]) => {
    setZones((prev) => [...prev, ...newZones]);
    showToast(`นำเข้าข้อมูลโซนสำเร็จ ${newZones.length} รายการ`);
  };

  const handleDeleteZone = (id: string) => {
    setZones((prev) => prev.filter((z) => z.id !== id));
    showToast('ลบข้อมูลโซนสำเร็จ');
  };

  // Handlers for Skill
  const handleAddSkill = (skill: Skill) => {
    setSkills((prev) => [...prev, skill]);
    showToast(`เพิ่มทักษะ ${skill.name} เรียบร้อยแล้ว`);
  };

  const handleAddMultipleSkills = (newSkills: Skill[]) => {
    setSkills((prev) => [...prev, ...newSkills]);
    showToast(`นำเข้าข้อมูลทักษะสำเร็จ ${newSkills.length} รายการ`);
  };

  const handleDeleteSkill = (id: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== id));
    showToast('ลบข้อมูลทักษะสำเร็จ');
  };

  // Handlers for Technician
  const handleAddMultipleTechnicians = (newTechs: Technician[]) => {
    setTechnicians((prev) => [...prev, ...newTechs]);
    showToast(`นำเข้าข้อมูลทีมช่างสำเร็จ ${newTechs.length} ทีม`);
  };

  const handleDeleteTechnician = (id: string) => {
    setTechnicians((prev) => prev.filter((t) => t.id !== id));
    showToast('ลบข้อมูลทีมช่างสำเร็จ');
  };

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
      tierImpact: 'ปรับลดเป็น Cooldown / พักงานชั่วคราว',
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
    setBranches(INITIAL_BRANCHES);
    setZones(INITIAL_ZONES);
    setSkills(INITIAL_SKILLS);
    setTechnicians(INITIAL_TECHNICIANS);
    setBookings(INITIAL_BOOKINGS);
    setPenalties(INITIAL_PENALTIES);
    showToast('รีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้นเรียบร้อยแล้ว');
  };

  // Sidebar Menu Items Definition
  const menuItems = [
    { id: 'dashboard', label: 'ตารางคิวงานติดตั้ง', icon: LayoutDashboard },
    { id: 'qchang-portal', label: 'จองบริการ (Q-Chang style)', icon: ShoppingBag },
    { id: 'smart-booking', label: 'จองคิวช่างอัจฉริยะ', icon: Calendar },
    { id: 'divider-1', label: 'ข้อมูลระบบหลัก (Master)', isDivider: true },
    { id: 'branch-manager', label: 'ข้อมูลสาขา (Branch)', icon: Building },
    { id: 'branch-map', label: 'แผนที่สาขา (All-Store Map)', icon: MapPin },
    { id: 'tech-manager', label: 'ข้อมูลช่าง & Skill Matrix', icon: Users },
    { id: 'zone-manager', label: 'ข้อมูลพื้นที่และโซน (Zone)', icon: Map },
    { id: 'skill-manager', label: 'ข้อมูลทักษะช่าง (Skill)', icon: Wrench },
    { id: 'divider-2', label: 'จำลองผลลัพธ์', isDivider: true },
    { id: 'integration-flow', label: 'Integration Simulator', icon: Cpu },
    { id: 'penalty-audit', label: 'รายการลงโทษ E-CN', icon: ShieldAlert },
    { id: 'divider-3', label: 'เอกสารเรียนรู้', isDivider: true },
    { id: 'km-hub', label: 'คู่มือระบบ & FAQ (KM)', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 antialiased font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded bg-blue-600 text-white font-bold text-xs shadow-lg border border-blue-400 animate-slideUp">
          {toastMessage}
        </div>
      )}

      {/* LEFT SIDEBAR Layout */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-xs">
        <div>
          {/* Top Logo Panel */}
          <div className="p-5 border-b border-slate-200 flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center shadow-sm">
              <Wrench className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight">vService</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Installer System</p>
            </div>
          </div>

          {/* Quick Stats Widget inside Sidebar */}
          <div className="p-4 mx-3 my-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs space-y-1.5 shadow-xs">
            <div className="flex justify-between items-center">
              <span>ช่างพร้อมใช้งาน:</span>
              <span className="font-bold text-emerald-600">{activeTechsCount} ทีม</span>
            </div>
            <div className="flex justify-between items-center">
              <span>งานจองรอดำเนินการ:</span>
              <span className="font-bold text-blue-600">{pendingBookingsCount} คิว</span>
            </div>
            <div className="flex justify-between items-center">
              <span>โทษปรับ Active E-CN:</span>
              <span className="font-bold text-rose-600">{activePenaltiesCount} รายการ</span>
            </div>
          </div>

          {/* Menu Items List */}
          <nav className="px-3 py-2 space-y-0.5">
            {menuItems.map((item) => {
              if (item.isDivider) {
                return (
                  <div key={item.id} className="pt-4 pb-1.5 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {item.label}
                  </div>
                );
              }

              const Icon = item.icon!;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs md:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="h-3 w-3 text-blue-500" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-300">
              AD
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-700">Administrator</p>
              <p className="text-[9px] text-slate-400 font-mono">vService Portal</p>
            </div>
          </div>
          <button
            onClick={handleResetData}
            title="รีเซ็ตข้อมูล Mock ทั้งหมด"
            className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Workspace Top Header Bar */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center space-x-2">
            <Menu className="h-5 w-5 text-slate-400 md:hidden" />
            <h2 className="text-sm md:text-base font-bold text-slate-800 font-sans">
              {menuItems.find((item) => item.id === activeTab)?.label || 'Workspace'}
            </h2>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
            <span>สภาพแวดล้อม: <strong className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">ระบบจำลอง (Simulator)</strong></span>
            <span>|</span>
            <span>วันที่ระบบ: <strong className="text-slate-700">23 กรกฎาคม 2026</strong></span>
          </div>
        </header>

        {/* Workspace Scrollable Workarea */}
        <main className="flex-1 overflow-y-auto p-6">
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
              branches={branches}
              onConfirmBooking={(b) => {
                handleConfirmBooking(b);
                setActiveTab('dashboard');
              }}
            />
          )}

          {activeTab === 'branch-manager' && (
            <BranchManager
              branches={branches}
              onAddBranch={handleAddBranch}
              onAddMultipleBranches={handleAddMultipleBranches}
              onDeleteBranch={handleDeleteBranch}
            />
          )}

          {activeTab === 'branch-map' && (
            <BranchMapView branches={branches} />
          )}

          {activeTab === 'tech-manager' && (
            <SkillMatrixView
              technicians={technicians}
              branches={branches}
              onUpdateTechnician={handleUpdateTechnician}
              onAddMultipleTechnicians={handleAddMultipleTechnicians}
              onDeleteTechnician={handleDeleteTechnician}
            />
          )}

          {activeTab === 'zone-manager' && (
            <ZoneManager
              zones={zones}
              onAddZone={handleAddZone}
              onAddMultipleZones={handleAddMultipleZones}
              onDeleteZone={handleDeleteZone}
            />
          )}

          {activeTab === 'skill-manager' && (
            <SkillManager
              skills={skills}
              onAddSkill={handleAddSkill}
              onAddMultipleSkills={handleAddMultipleSkills}
              onDeleteSkill={handleDeleteSkill}
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

          {activeTab === 'km-hub' && (
            <KmHubView />
          )}

          {activeTab === 'qchang-portal' && (
            <QChangPortalView
              branches={branches}
              onConfirmBooking={handleConfirmBooking}
              onNavigateToTab={(tabId) => setActiveTab(tabId)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
