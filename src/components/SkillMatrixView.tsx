import React, { useState } from 'react';
import type { Technician, SkillCategory } from '../types';
import { Users, Star, MapPin, Search, Phone } from 'lucide-react';

interface SkillMatrixViewProps {
  technicians: Technician[];
  onUpdateTechnician: (updatedTech: Technician) => void;
}

export const SkillMatrixView: React.FC<SkillMatrixViewProps> = ({
  technicians,
  onUpdateTechnician,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingTech, setEditingTech] = useState<Technician | null>(null);

  const categories: SkillCategory[] = [
    'Built-in Furniture',
    'Flooring & Tile',
    'Electrical & Smart Home',
    'Plumbing & Sanitary',
    'Air Condition & HVAC',
    'Curtains & Wallpaper',
  ];

  const filteredTechs = technicians.filter((t) => {
    const matchesCategory =
      selectedCategory === 'ALL' || t.skills.some((s) => s.category === selectedCategory);
    const matchesTier = selectedTier === 'ALL' || t.tier === selectedTier;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.primaryZone.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesTier && matchesSearch;
  });

  const getTierBadgeClass = (tier: Technician['tier']) => {
    switch (tier) {
      case 'Gold':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 glow-amber';
      case 'Silver':
        return 'bg-slate-300/20 text-slate-200 border-slate-400/40';
      case 'Bronze':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'Cooldown':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 glow-rose animate-pulse';
      case 'Suspended':
        return 'bg-red-950 text-red-400 border-red-800';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Row */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Technician & Skill Matrix Management</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            บริหารจัดการระดับความชำนาญ (Skill Level 1-3), การรับรองมาตรฐาน (Certified), Tier สิทธิประโยชน์ และติดตามคะแนน Penalty
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาชื่อช่าง, โค้ด, หรือโซน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 md:w-64 px-3 py-1.5 pl-8 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">ทุกหมวดหมู่ Skill</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">ทุกระดับ Tier</option>
            <option value="Gold">Gold Tier</option>
            <option value="Silver">Silver Tier</option>
            <option value="Cooldown">Penalty Cooldown</option>
          </select>
        </div>
      </div>

      {/* Technician Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTechs.map((tech) => (
          <div
            key={tech.id}
            className="glass-panel glass-panel-hover p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4"
          >
            {/* Top Profile Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={tech.avatar}
                    alt={tech.name}
                    className="h-12 w-12 rounded-xl object-cover border-2 border-slate-700 shadow-md"
                  />
                  <div>
                    <h3 className="font-bold text-white text-sm line-clamp-1">{tech.name}</h3>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                      <span className="font-mono text-indigo-300 font-semibold">{tech.code}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1 text-slate-400">
                        <Phone className="h-3 w-3" />
                        <span>{tech.phone}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getTierBadgeClass(tech.tier)}`}>
                  {tech.tier}
                </span>
              </div>

              {/* Performance Metrics Bar */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Rating</div>
                  <div className="font-bold text-amber-400 flex items-center justify-center space-x-0.5 mt-0.5">
                    <Star className="h-3 w-3 fill-amber-400" />
                    <span>{tech.rating}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400">งานสำเร็จ</div>
                  <div className="font-bold text-slate-200 mt-0.5">{tech.completedJobs} งาน</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400">Penalty Score</div>
                  <div className={`font-bold mt-0.5 ${tech.penaltyPoints > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {tech.penaltyPoints} คะแนน
                  </div>
                </div>
              </div>

              {/* Service Zone */}
              <div className="text-xs text-slate-400 flex items-start space-x-1.5">
                <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{tech.primaryZone}</span>
              </div>

              {/* Skill Matrix List */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Skill Level Matrix ({tech.skills.length} ทักษะ)
                </div>
                <div className="space-y-1.5">
                  {tech.skills.map((skill, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-800/80 text-xs"
                    >
                      <span className="text-slate-300 font-medium">{skill.category}</span>
                      <div className="flex items-center space-x-2">
                        {skill.isCertified && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Certified
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Level {skill.level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className={`text-[11px] font-semibold ${tech.status === 'Available' ? 'text-emerald-400' : 'text-rose-400'}`}>
                ● สถานะ: {tech.status}
              </span>

              <button
                onClick={() => setEditingTech(tech)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                ปรับแต่ง Skill & Tier
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingTech && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 max-w-lg w-full space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">
              แก้ไขข้อมูล Skill & Tier ของ {editingTech.name}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">ระดับ Tier</label>
                <select
                  value={editingTech.tier}
                  onChange={(e) =>
                    setEditingTech({ ...editingTech, tier: e.target.value as Technician['tier'] })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="Gold">Gold Tier (รับงาน優先)</option>
                  <option value="Silver">Silver Tier (มาตรฐาน)</option>
                  <option value="Bronze">Bronze Tier (เริ่มต้น)</option>
                  <option value="Cooldown">Penalty Cooldown (พักจ่ายงาน)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">คะแนน Penalty สะสม</label>
                <input
                  type="number"
                  value={editingTech.penaltyPoints}
                  onChange={(e) =>
                    setEditingTech({ ...editingTech, penaltyPoints: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">สถานะการพร้อมรับงาน</label>
                <select
                  value={editingTech.status}
                  onChange={(e) =>
                    setEditingTech({ ...editingTech, status: e.target.value as Technician['status'] })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="Available">Available (พร้อมรับคิว)</option>
                  <option value="On Job">On Job (กำลังติดตั้ง)</option>
                  <option value="In Cooldown">In Cooldown (ติดบทลงโทษ)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
              <button
                onClick={() => setEditingTech(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onUpdateTechnician(editingTech);
                  setEditingTech(null);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500"
              >
                บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
