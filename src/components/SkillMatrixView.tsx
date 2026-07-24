import React, { useState, useRef } from 'react';
import type { Technician, SkillCategory, Branch } from '../types';
import { Users, Star, MapPin, Search, Upload, Download, CheckCircle, Trash } from 'lucide-react';

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
    const sampleTechs: Technician[] = [
      {
        id: `tech-s1`,
        code: 'T-SILV-06',
        name: 'ทีมช่างชัยวัฒน์ เซอร์วิส',
        phone: '085-333-4455',
        avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=150',
        tier: 'Silver',
        rating: 4.60,
        completedJobs: 32,
        penaltyPoints: 0,
        activePenaltiesCount: 0,
        primaryZone: 'Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา - ประเวศ)',
        secondaryZones: [],
        skills: [{ category: 'Plumbing & Sanitary', level: 3, isCertified: true }],
        dailyCapacityHours: 8,
        bookedHoursToday: 0,
        status: 'Available',
        branchId: 'br-04',
      },
      {
        id: `tech-s2`,
        code: 'T-GOLD-07',
        name: 'ทีมช่างขวัญใจ แอร์แอนด์คลีน',
        phone: '086-444-5566',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
        tier: 'Gold',
        rating: 4.90,
        completedJobs: 95,
        penaltyPoints: 0,
        activePenaltiesCount: 0,
        primaryZone: 'Zone 2: นนทบุรี (ราชพฤกษ์ - แจ้งวัฒนะ - บางบัวทอง)',
        secondaryZones: ['Zone 3: ปทุมธานี (รังสิต - ลำลูกกา - คลองหลวง)'],
        skills: [{ category: 'Air Condition & HVAC', level: 3, isCertified: true }],
        dailyCapacityHours: 8,
        bookedHoursToday: 0,
        status: 'Available',
        branchId: 'br-03',
      }
    ];

    const nonDuplicateSamples = sampleTechs.filter(
      (sample) => !technicians.some((t) => t.code === sample.code)
    );

    if (nonDuplicateSamples.length === 0) {
      alert('ข้อมูลช่างตัวอย่างชุดนี้ได้รับการนำเข้าแล้วทั้งหมด');
      return;
    }

    onAddMultipleTechnicians(nonDuplicateSamples);
    alert(`นำเข้าข้อมูลช่างตัวอย่างสำเร็จ ${nonDuplicateSamples.length} ทีม!`);
  };

  // CSV/JSON File Import
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
            // Skill parser
            let skillsList = [];
            if (item.skills && Array.isArray(item.skills)) {
              skillsList = item.skills;
            } else if (item.primarySkillCategory) {
              skillsList.push({
                category: item.primarySkillCategory as SkillCategory,
                level: Number(item.primarySkillLevel || 1) as 1 | 2 | 3,
                isCertified: String(item.isCertified).toLowerCase() === 'true',
              });
            } else {
              skillsList.push({
                category: 'Built-in Furniture' as SkillCategory,
                level: 1 as 1 | 2 | 3,
                isCertified: false,
              });
            }

            return {
              id: `tech-import-${Date.now()}-${idx}`,
              code: String(item.code).toUpperCase().trim(),
              name: String(item.name).trim(),
              phone: String(item.phone || '080-000-0000').trim(),
              avatar: String(item.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=150').trim(),
              tier: (item.tier || 'Silver') as Technician['tier'],
              rating: Number(item.rating || 4.5),
              completedJobs: Number(item.completedJobs || 0),
              penaltyPoints: Number(item.penaltyPoints || 0),
              activePenaltiesCount: Number(item.activePenaltiesCount || 0),
              primaryZone: String(item.primaryZone || 'Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา - ประเวศ)').trim(),
              secondaryZones: item.secondaryZones ? String(item.secondaryZones).split(';').map(z => z.trim()) : [],
              skills: skillsList,
              dailyCapacityHours: Number(item.dailyCapacityHours || 8),
              bookedHoursToday: 0,
              status: (item.status || 'Available') as Technician['status'],
              branchId: item.branchId || undefined,
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
      alert(`นำเข้าข้อมูลทีมช่างใหม่สำเร็จ ${uniqueImports.length} ทีม`);
    }
    setImportPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        code: 'T-GOLD-99',
        name: 'ทีมช่างนำเข้าตัวอย่าง',
        phone: '081-111-2222',
        tier: 'Gold',
        primaryZone: 'Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา - ประเวศ)',
        primarySkillCategory: 'Electrical & Smart Home',
        primarySkillLevel: 3,
        isCertified: true,
        branchId: 'br-01',
      }
    ];
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'technician_template.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Row */}
      <div className="v-panel p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
            className="v-btn-secondary py-1.5 flex items-center space-x-1 text-xs"
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
            onClick={handleLoadSampleData}
            className="v-btn-secondary py-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            โหลดช่างตัวอย่างด่วน
          </button>
        </div>
      </div>

      {/* Import File Preview */}
      {importPreview && (
        <div className="v-panel p-5 bg-blue-50/50 border-blue-200 space-y-3">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2">
            <div className="flex items-center space-x-2 text-blue-800 font-bold text-sm">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span>ตรวจพบข้อมูลทีมช่างใหม่พร้อมนำเข้า {importPreview.length} ทีม</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setImportPreview(null)}
                className="px-3 py-1 bg-white border border-slate-300 rounded text-xs text-slate-600 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-3 py-1 bg-blue-600 rounded text-xs text-white hover:bg-blue-700 font-semibold"
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
        <div className="v-panel p-4 bg-rose-50 border-rose-200 text-rose-800 text-xs">
          <span>⚠️ {importError}</span>
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="v-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาชื่อช่าง, รหัสช่าง, โซน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="v-input w-48 md:w-64 pl-8"
            />
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="v-input"
          >
            <option value="ALL">ทุกหมวดหมู่ Skill</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="v-input"
          >
            <option value="ALL">ทุกระดับ Tier</option>
            <option value="Gold">Gold Tier</option>
            <option value="Silver">Silver Tier</option>
            <option value="Cooldown">Penalty Cooldown</option>
          </select>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="text-xs text-slate-500 hover:text-slate-700 flex items-center space-x-1"
        >
          <Download className="h-3.5 w-3.5" />
          <span>ดาวน์โหลดเทมเพลต JSON</span>
        </button>
      </div>

      {/* Technician Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTechs.map((tech) => (
          <div
            key={tech.id}
            className="v-panel v-panel-hover p-5 flex flex-col justify-between space-y-4 bg-white"
          >
            {/* Top Profile Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={tech.avatar}
                    alt={tech.name}
                    className="h-12 w-12 rounded-lg object-cover border border-slate-200 shadow-sm"
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
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setEditingTech(tech)}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                >
                  แก้ไขข้อมูลช่าง
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingTech && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="v-panel p-6 max-w-lg w-full space-y-4 bg-white animate-scaleUp">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
              แก้ไขข้อมูลและพารามิเตอร์ช่าง: {editingTech.name}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">สังกัดสาขาหลัก (Branch)</label>
                <select
                  value={editingTech.branchId || ''}
                  onChange={(e) =>
                    setEditingTech({ ...editingTech, branchId: e.target.value || undefined })
                  }
                  className="v-input w-full"
                >
                  <option value="">-- ไม่ระบุสาขา --</option>
                  {branches.map((br) => (
                    <option key={br.id} value={br.id}>
                      {br.code} - {br.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">ระดับ Tier งานช่าง</label>
                <select
                  value={editingTech.tier}
                  onChange={(e) =>
                    setEditingTech({ ...editingTech, tier: e.target.value as Technician['tier'] })
                  }
                  className="v-input w-full"
                >
                  <option value="Gold">Gold Tier (สิทธิคิวแรกสุด)</option>
                  <option value="Silver">Silver Tier (มาตรฐาน)</option>
                  <option value="Bronze">Bronze Tier (ทั่วไป)</option>
                  <option value="Cooldown">Penalty Cooldown (พักจ่ายงาน)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  type="text"
                  value={editingTech.phone}
                  onChange={(e) =>
                    setEditingTech({ ...editingTech, phone: e.target.value })
                  }
                  className="v-input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">คะแนน Penalty สะสม</label>
                  <input
                    type="number"
                    value={editingTech.penaltyPoints}
                    onChange={(e) =>
                      setEditingTech({ ...editingTech, penaltyPoints: parseInt(e.target.value) || 0 })
                    }
                    className="v-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">สถานะคิวช่าง</label>
                  <select
                    value={editingTech.status}
                    onChange={(e) =>
                      setEditingTech({ ...editingTech, status: e.target.value as Technician['status'] })
                    }
                    className="v-input w-full"
                  >
                    <option value="Available">Available (ว่างพร้อมรับงาน)</option>
                    <option value="On Job">On Job (กำลังเดินทาง/ติดตั้ง)</option>
                    <option value="In Cooldown">In Cooldown (โดนทำโทษพักงาน)</option>
                    <option value="Offline">Offline (หยุดงาน)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
              <button
                onClick={() => setEditingTech(null)}
                className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold border border-slate-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onUpdateTechnician(editingTech);
                  setEditingTech(null);
                }}
                className="v-btn-primary text-xs"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
