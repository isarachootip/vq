import React, { useState, useRef } from 'react';
import type { Technician, SkillCategory, Branch } from '../types';
import { generate200Technicians } from '../generateTechs';
import { TechDetailProfileModal } from './TechDetailProfileModal';
import { 
  Users, 
  Star, 
  MapPin, 
  Search, 
  Upload, 
  Download, 
  CheckCircle, 
  Trash, 
  LayoutGrid, 
  List, 
  Pencil,
  UserCheck
} from 'lucide-react';

interface SkillMatrixViewProps {
  technicians: Technician[];
  branches: Branch[];
  onUpdateTechnician: (updatedTech: Technician) => void;
  onAddMultipleTechnicians: (techs: Technician[]) => void;
  onDeleteTechnician?: (techId: string) => void;
}

export const SkillMatrixView: React.FC<SkillMatrixViewProps> = ({
  technicians,
  branches,
  onUpdateTechnician,
  onAddMultipleTechnicians,
  onDeleteTechnician,
}) => {
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingTech, setEditingTech] = useState<Technician | null>(null);

  // Import states
  const [importPreview, setImportPreview] = useState<Technician[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Silver':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Bronze':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Cooldown':
        return 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
      case 'Suspended':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getBranchName = (branchId?: string) => {
    if (!branchId) return 'ไม่ระบุสาขา';
    const br = branches.find((b) => b.id === branchId);
    return br ? br.name : 'ไม่พบสาขา';
  };

  // Quick Preset Importer
  const handleLoadSampleData = () => {
    handleLoad200Techs();
  };

  const handleLoad200Techs = () => {
    const all200Techs = generate200Technicians();
    const nonDuplicates = all200Techs.filter(
      (sample) => !technicians.some((t) => t.id === sample.id || t.code === sample.code)
    );

    if (nonDuplicates.length === 0) {
      alert('ชุดข้อมูลช่างครบ 200 ทีม ได้รับการนำเข้าเข้าสู่ระบบทั้งหมดเรียบร้อยแล้ว');
      return;
    }

    onAddMultipleTechnicians(nonDuplicates);
    alert(`นำเข้าข้อมูลทีมช่างครอบคลุมทุกโซนและทุกทักษะสำเร็จจำนวน ${nonDuplicates.length} ทีม! (รวมช่างในระบบ: ${technicians.length + nonDuplicates.length} คน)`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let parsedData: any[] = [];

        if (file.name.endsWith('.json')) {
          parsedData = JSON.parse(text);
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split('\n');
          const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = values[index];
            });
            parsedData.push(obj);
          }
        } else {
          setImportError('รองรับเฉพาะไฟล์ .csv หรือ .json เท่านั้น');
          return;
        }

        const validated: Technician[] = parsedData
          .filter((item: any) => item.code && item.name)
          .map((item: any, idx: number) => {
            let parsedSkills: any[] = [];
            if (item.skills && Array.isArray(item.skills)) {
              parsedSkills = item.skills;
            } else {
              parsedSkills = [{ category: 'Built-in Furniture', level: 2, isCertified: true }];
            }

            return {
              id: `tech-import-${Date.now()}-${idx}`,
              code: String(item.code).toUpperCase().trim(),
              name: String(item.name).trim(),
              phone: String(item.phone || '080-000-0000').trim(),
              avatar: String(item.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'),
              tier: (item.tier as any) || 'Silver',
              rating: Number(item.rating) || 4.5,
              completedJobs: Number(item.completedJobs) || 0,
              penaltyPoints: Number(item.penaltyPoints) || 0,
              activePenaltiesCount: 0,
              primaryZone: String(item.primaryZone || 'Zone 1: กรุงเทพฯ').trim(),
              secondaryZones: [],
              skills: parsedSkills,
              dailyCapacityHours: 8,
              bookedHoursToday: 0,
              status: (item.status as any) || 'Available',
              branchId: String(item.branchId || 'br-01').trim(),
            };
          });

        if (validated.length === 0) {
          setImportError('ไม่พบข้อมูลช่างที่ถูกต้องในไฟล์ (ต้องการฟิลด์ code และ name)');
        } else {
          setImportPreview(validated);
          setImportError(null);
        }
      } catch (err) {
        setImportError('ไฟล์ชำรุด หรือรูปแบบไม่ถูกต้อง กรุณาตรวจสอบไฟล์');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!importPreview) return;
    const uniqueImports = importPreview.filter(
      (imported) => !technicians.some((t) => t.code === imported.code)
    );

    if (uniqueImports.length === 0) {
      alert('ไม่สามารถนำเข้าได้ เนื่องจากรหัสช่างทั้งหมดมีอยู่ในระบบแล้ว');
    } else {
      onAddMultipleTechnicians(uniqueImports);
      alert(`นำเข้าข้อมูลช่างสำเร็จ ${uniqueImports.length} ทีม`);
    }
    setImportPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        code: 'T-GOLD-99',
        name: 'ทีมช่างทดสอบนำเข้า 1',
        phone: '081-111-2233',
        tier: 'Gold',
        rating: 4.85,
        completedJobs: 50,
        penaltyPoints: 0,
        primaryZone: 'Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา - ประเวศ)',
        branchId: 'br-01',
        skills: [{ category: 'Built-in Furniture', level: 3, isCertified: true }],
      },
    ];
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'technicians_template.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header & Action Row */}
      <div className="v-panel p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800 font-sans">จัดการรายชื่อทีมช่าง & ทักษะ (Technicians Matrix)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            บริหารจัดการระดับความชำนาญ (Skill Level 1-3), การรับรองมาตรฐาน (Certified), สังกัดสาขา และคะแนน Penalty ของทีมช่าง
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="v-btn-secondary py-1.5 flex items-center space-x-1 text-xs cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>นำเข้าไฟล์ช่าง (.CSV / .JSON)</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.json"
            className="hidden"
          />

          <button
            onClick={handleLoad200Techs}
            className="v-btn-secondary py-1.5 px-3 text-xs text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100 cursor-pointer rounded-xl font-medium flex items-center gap-1.5"
          >
            <span>👷‍♂️ โหลดทีมช่าง 200 คน (ทุก Zone)</span>
          </button>

          <button
            onClick={handleLoadSampleData}
            className="v-btn-secondary py-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 cursor-pointer"
          >
            โหลดช่างตัวอย่างด่วน
          </button>

          <button
            onClick={() => setEditingTech(technicians[0] || null)}
            className="py-1.5 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm cursor-pointer transition-all"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Detail Profile ช่าง (เปิดฟอร์มตามอัปเดต)</span>
          </button>
        </div>
      </div>

      {/* Import File Preview */}
      {importPreview && (
        <div className="v-panel p-5 bg-blue-50/50 border-blue-200 space-y-3 rounded-2xl">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2">
            <div className="flex items-center space-x-2 text-blue-800 font-bold text-sm">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span>ตรวจพบข้อมูลทีมช่างใหม่พร้อมนำเข้า {importPreview.length} ทีม</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setImportPreview(null)}
                className="px-3 py-1 bg-white border border-slate-300 rounded text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-3 py-1 bg-blue-600 rounded text-xs text-white hover:bg-blue-700 font-semibold cursor-pointer"
              >
                ยืนยันการนำเข้าข้อมูล
              </button>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto border border-blue-100 rounded bg-white">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-2 border-b">รหัสช่าง</th>
                  <th className="p-2 border-b">ชื่อทีมช่าง</th>
                  <th className="p-2 border-b">เบอร์โทร</th>
                  <th className="p-2 border-b">สังกัดสาขา</th>
                  <th className="p-2 border-b">โซนหลัก</th>
                  <th className="p-2 border-b">ทักษะเริ่มต้น</th>
                </tr>
              </thead>
              <tbody>
                {importPreview.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2 border-b font-mono font-bold text-blue-600">{item.code}</td>
                    <td className="p-2 border-b text-slate-800 font-semibold">{item.name}</td>
                    <td className="p-2 border-b text-slate-600">{item.phone}</td>
                    <td className="p-2 border-b text-slate-600 font-bold">{getBranchName(item.branchId)}</td>
                    <td className="p-2 border-b text-slate-500 truncate max-w-[120px]">{item.primaryZone}</td>
                    <td className="p-2 border-b text-indigo-700 font-medium">
                      {item.skills[0]?.category} (L{item.skills[0]?.level})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {importError && (
        <div className="v-panel p-4 bg-rose-50 border-rose-200 text-rose-800 text-xs rounded-xl">
          <span>⚠️ {importError}</span>
        </div>
      )}

      {/* Filter, Search, and View Mode Switcher Panel */}
      <div className="v-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาชื่อช่าง, รหัสช่าง, โซน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="v-input w-48 md:w-64 pl-8 text-xs py-1.5"
            />
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="v-input py-1.5 text-xs"
          >
            <option value="ALL">ทุกหมวดหมู่ Skill</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="v-input py-1.5 text-xs"
          >
            <option value="ALL">ทุกระดับ Tier</option>
            <option value="Gold">Gold Tier</option>
            <option value="Silver">Silver Tier</option>
            <option value="Cooldown">Penalty Cooldown</option>
          </select>
        </div>

        <div className="flex items-center gap-3 justify-between md:justify-end">
          {/* Card / List View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 ${
                viewMode === 'card'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
              title="แสดงมุมมองการ์ด (Grid/Card View)"
            >
              <LayoutGrid className="h-4 w-4" />
              <span>🎴 การ์ด (Card)</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
              title="แสดงมุมมองตารางรายการ (Table/List View)"
            >
              <List className="h-4 w-4" />
              <span>📋 รายการ (List)</span>
            </button>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center space-x-1 cursor-pointer shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">เทมเพลต JSON</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: CARD GRID VIEW */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
          {filteredTechs.length === 0 ? (
            <div className="v-panel p-12 text-center text-slate-400 col-span-full border border-dashed border-slate-200">
              ไม่พบข้อมูลทีมช่างตรงตามเงื่อนไขการค้นหา
            </div>
          ) : (
            filteredTechs.map((tech) => (
              <div
                key={tech.id}
                className="v-panel v-panel-hover p-5 flex flex-col justify-between space-y-4 bg-white border border-slate-200 rounded-2xl shadow-xs"
              >
                {/* Top Profile Info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={tech.avatar}
                        alt={tech.name}
                        className="h-12 w-12 rounded-lg object-cover border border-slate-200 shadow-xs"
                      />
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{tech.name}</h3>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-mono text-blue-600 font-semibold">{tech.code}</span>
                          <span>•</span>
                          <span className="text-slate-600 font-semibold">{getBranchName(tech.branchId)}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getTierBadgeClass(tech.tier)}`}>
                      {tech.tier}
                    </span>
                  </div>

                  {/* Performance Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-center text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold">คะแนนเรตติ้ง</div>
                      <div className="font-bold text-amber-500 flex items-center justify-center space-x-0.5 mt-0.5">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                        <span>{tech.rating}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold">งานสำเร็จ</div>
                      <div className="font-bold text-slate-700 mt-0.5">{tech.completedJobs} งาน</div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold">คะแนนโดนปรับ</div>
                      <div className={`font-bold mt-0.5 ${tech.penaltyPoints > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {tech.penaltyPoints} คะแนน
                      </div>
                    </div>
                  </div>

                  {/* Service Zone */}
                  <div className="text-xs text-slate-600 flex items-start space-x-1.5 bg-slate-50/50 p-2 rounded border border-slate-100">
                    <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-slate-700">พื้นที่หลัก:</span>
                      <span className="line-clamp-1">{tech.primaryZone}</span>
                    </div>
                  </div>

                  {/* Skill Matrix List */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      ระดับทักษะความสามารถ ({tech.skills.length} ทักษะ)
                    </div>
                    <div className="space-y-1">
                      {tech.skills.map((skill, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 text-xs"
                        >
                          <span className="text-slate-700 font-medium">{skill.category}</span>
                          <div className="flex items-center space-x-1.5">
                            {skill.isCertified && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Cert
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              Level {skill.level}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-[11px] font-bold flex items-center space-x-1 ${tech.status === 'Available' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    <span>● สถานะ:</span>
                    <span>{tech.status}</span>
                  </span>

                  <div className="flex space-x-1">
                    {onDeleteTechnician && (
                      <button
                        onClick={() => {
                          if (confirm(`ต้องการลบทีมช่าง ${tech.name} หรือไม่?`)) {
                            onDeleteTechnician(tech.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="ลบทีมช่าง"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingTech(tech)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                    >
                      แก้ไขข้อมูลช่าง
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW MODE 2: TABLE / LIST VIEW */}
      {viewMode === 'list' && (
        <div className="v-panel overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-xs animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="v-table w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">ทีมช่าง & รหัส (Technician)</th>
                  <th className="px-4 py-3.5">สังกัดสาขา (Branch)</th>
                  <th className="px-4 py-3.5">พื้นที่บริการหลัก (Primary Zone)</th>
                  <th className="px-4 py-3.5 text-center">เรตติ้ง / งานสำเร็จ / Penalty</th>
                  <th className="px-4 py-3.5 text-center">ระดับ Tier</th>
                  <th className="px-4 py-3.5 text-center">สถานะงาน</th>
                  <th className="px-4 py-3.5">ทักษะความชำนาญ (Skills Matrix)</th>
                  <th className="px-4 py-3.5 text-right">จัดการ (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTechs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                      ไม่พบข้อมูลทีมช่างตรงตามเงื่อนไขการค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredTechs.map((tech) => (
                    <tr key={tech.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={tech.avatar}
                            alt={tech.name}
                            className="h-10 w-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <strong className="block font-bold text-slate-800 text-xs">{tech.name}</strong>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                              <span className="font-mono text-blue-600 font-bold">{tech.code}</span>
                              <span>•</span>
                              <span>📞 {tech.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="px-4 py-3 text-slate-700 font-semibold">
                        {getBranchName(tech.branchId)}
                      </td>

                      {/* Primary Zone */}
                      <td className="px-4 py-3 text-slate-600 max-w-[180px]">
                        <span className="line-clamp-1">{tech.primaryZone}</span>
                      </td>

                      {/* Performance */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2 text-[11px]">
                          <span className="font-bold text-amber-600 flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                            {tech.rating}
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-700 font-semibold">{tech.completedJobs} งาน</span>
                          <span className="text-slate-300">|</span>
                          <span className={`font-bold ${tech.penaltyPoints > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {tech.penaltyPoints} แต้ม
                          </span>
                        </div>
                      </td>

                      {/* Tier */}
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getTierBadgeClass(tech.tier)}`}>
                          {tech.tier}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          tech.status === 'Available' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          ● {tech.status}
                        </span>
                      </td>

                      {/* Skills List */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {tech.skills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] border border-slate-200 font-medium flex items-center gap-1"
                            >
                              <span>{s.category}</span>
                              <span className="font-bold text-blue-600">L{s.level}</span>
                              {s.isCertified && <span className="text-[9px] text-emerald-600 font-bold">✓</span>}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setEditingTech(tech)}
                            title="แก้ไขข้อมูลช่าง"
                            className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-amber-50 cursor-pointer transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {onDeleteTechnician && (
                            <button
                              onClick={() => {
                                if (confirm(`ต้องการลบทีมช่าง ${tech.name} หรือไม่?`)) {
                                  onDeleteTechnician(tech.id);
                                }
                              }}
                              title="ลบทีมช่าง"
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer transition-colors"
                            >
                              <Trash className="h-4 w-4" />
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
      )}

      {/* Tech Detail Profile Modal */}
      <TechDetailProfileModal
        technician={editingTech}
        isOpen={!!editingTech}
        onClose={() => setEditingTech(null)}
        onSave={(updatedTech) => {
          onUpdateTechnician(updatedTech);
          setEditingTech(null);
        }}
      />
    </div>
  );
};
