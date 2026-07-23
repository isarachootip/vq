import React from 'react';
import { Calendar, ShieldAlert, Award, RefreshCw, LayoutDashboard, Cpu, Users, Layers, AlertCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: {
    activeTechs: number;
    pendingBookings: number;
    slaPercentage: number;
    totalPenalties: number;
  };
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  stats,
  onResetData,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'ภาพรวม & คิวช่าง (Dashboard)', icon: LayoutDashboard },
    { id: 'smart-booking', label: 'ระบบจองคิวอัจฉริยะ (Smart Booking)', icon: Calendar },
    { id: 'skill-matrix', label: 'ข้อมูลช่าง & Skill Matrix', icon: Users },
    { id: 'integration-flow', label: 'จำลอง Integration ทั้งระบบ (Simulator)', icon: Cpu },
    { id: 'penalty-audit', label: 'ประวัติ Penalty & E-CN Audit Log', icon: ShieldAlert },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-700/60 bg-slate-900/90 backdrop-blur-md">
      {/* Top Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Installer Management System
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  คิวช่าง · Skill · Penalty
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ระบบจอง จัดคิว ประเมินทักษะ และลงโทษช่างตามสถาปัตยกรรม (E-ordering ↔ KANNA ↔ STS ↔ QC ↔ E-CN)
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges & Action */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-400">ทีมช่างพร้อมใช้งาน:</span>
              <span className="font-semibold text-emerald-300">{stats.activeTechs} ทีม</span>
            </div>

            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
              <Calendar className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-slate-400">คิวรอดำเนินการ:</span>
              <span className="font-semibold text-blue-300">{stats.pendingBookings} งาน</span>
            </div>

            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
              <Award className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-slate-400">SLA Success:</span>
              <span className="font-semibold text-amber-300">{stats.slaPercentage}%</span>
            </div>

            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs">
              <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
              <span className="text-rose-300">Penalty E-CN Active:</span>
              <span className="font-semibold text-rose-300">{stats.totalPenalties} รายการ</span>
            </div>

            <button
              onClick={onResetData}
              title="รีเซ็ตข้อมูล Mock"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4 flex space-x-1 border-t border-slate-800 pt-3 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
