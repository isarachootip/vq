import React, { useState, useRef } from 'react';
import type { Skill, SkillCategory } from '../types';
import { Wrench, Plus, Download, Upload, Trash, CheckCircle, Search } from 'lucide-react';

interface SkillManagerProps {
  skills: Skill[];
  onAddSkill: (skill: Skill) => void;
  onAddMultipleSkills: (skills: Skill[]) => void;
  onDeleteSkill: (skillId: string) => void;
}

export const SkillManager: React.FC<SkillManagerProps> = ({
  skills,
  onAddSkill,
  onAddMultipleSkills,
  onDeleteSkill,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<SkillCategory>('Built-in Furniture');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [certRequired, setCertRequired] = useState(false);

  // Import variables
  const [importPreview, setImportPreview] = useState<Skill[] | null>(null);
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

  const filteredSkills = skills.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      alert('กรุณากรอกรหัสทักษะและชื่อทักษะ');
      return;
    }
    if (skills.some((s) => s.code.toUpperCase() === code.toUpperCase())) {
      alert('รหัสทักษะนี้มีอยู่ในระบบแล้ว');
      return;
    }

    const newSkill: Skill = {
      id: `skill-${Date.now()}`,
      code: code.toUpperCase(),
      category,
      name,
      description,
      certificationRequired: certRequired,
    };

    onAddSkill(newSkill);
    setCode('');
    setName('');
    setDescription('');
    setCertRequired(false);
    setShowAddForm(false);
  };

  const handleLoadSampleData = () => {
    const sampleSkills: Skill[] = [
      { id: 'sk-s1', code: 'SK-PLUMB', category: 'Plumbing & Sanitary', name: 'งานติดตั้งสุขภัณฑ์และประปาห้องน้ำ', description: 'ความเชี่ยวชาญในการติดตั้งโถสุขภัณฑ์อัจฉริยะ อ่างล้างหน้า และวางแนวน้ำดี-น้ำเสีย', certificationRequired: false },
      { id: 'sk-s2', code: 'SK-WALL', category: 'Curtains & Wallpaper', name: 'งานปูวอลเปเปอร์ไวนิลและเก็บขอบมุม', description: 'ปูวอลเปเปอร์ลายคลาสสิก/ลายโมเดิร์น เก็บตะเข็บรอยต่อ และซ่อมแซมผิวผนังยับย่น', certificationRequired: false },
    ];

    const nonDuplicateSamples = sampleSkills.filter(
      (sample) => !skills.some((s) => s.code === sample.code)
    );

    if (nonDuplicateSamples.length === 0) {
      alert('ข้อมูลทักษะตัวอย่างชุดนี้ได้รับการนำเข้าแล้วทั้งหมด');
      return;
    }

    onAddMultipleSkills(nonDuplicateSamples);
    alert(`นำเข้าข้อมูลทักษะตัวอย่าง ${nonDuplicateSamples.length} ทักษะ สำเร็จ!`);
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

        const validated: Skill[] = parsedData
          .filter((item: any) => item.code && item.name)
          .map((item: any, idx: number) => ({
            id: `skill-import-${Date.now()}-${idx}`,
            code: String(item.code).toUpperCase().trim(),
            category: (item.category || 'Built-in Furniture') as SkillCategory,
            name: String(item.name).trim(),
            description: String(item.description || '').trim(),
            certificationRequired: item.certificationRequired === true || String(item.certificationRequired).toLowerCase() === 'true',
          }));

        if (validated.length === 0) {
          setImportError('ไม่พบข้อมูลทักษะที่ถูกต้องในไฟล์ (ต้องการฟิลด์ code และ name)');
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
      (imported) => !skills.some((s) => s.code === imported.code)
    );

    if (uniqueImports.length === 0) {
      alert('ไม่สามารถนำเข้าได้ เนื่องจากรหัสทักษะทั้งหมดมีอยู่ในระบบแล้ว');
    } else {
      onAddMultipleSkills(uniqueImports);
      alert(`นำเข้าทักษะใหม่สำเร็จ ${uniqueImports.length} ทักษะ`);
    }
    setImportPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        code: 'SK-TEST',
        category: 'Electrical & Smart Home',
        name: 'ทักษะทดลองนำเข้า 1',
        description: 'รายละเอียดทักษะทดลองนำเข้า 1',
        certificationRequired: true,
      },
      {
        code: 'SK-DEMO',
        category: 'Plumbing & Sanitary',
        name: 'ทักษะทดลองนำเข้า 2',
        description: 'รายละเอียดทักษะทดลองนำเข้า 2',
        certificationRequired: false,
      },
    ];
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'skill_template.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Row */}
      <div className="v-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Wrench className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">ระบบจัดการและนำเข้าข้อมูลทักษะ (Skill Catalog)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ระบุหมวดหมู่และทักษะความชำนาญของช่าง (Skill Profile) และความจำเป็นในการถือครองใบรับรองวิชาชีพสำหรับการคัดเลือกช่าง
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="v-btn-secondary py-1.5 flex items-center space-x-1 text-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>นำเข้าไฟล์ (.CSV / .JSON)</span>
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
            โหลดข้อมูลตัวอย่างด่วน
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="v-btn-primary py-1.5 flex items-center space-x-1 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>เพิ่มทักษะแมนนวล</span>
          </button>
        </div>
      </div>

      {/* Manual Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="v-panel p-5 grid grid-cols-1 md:grid-cols-5 gap-4 animate-fadeIn">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">รหัสทักษะ (Skill Code) *</label>
            <input
              type="text"
              placeholder="เช่น SK-PLUMB"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="v-input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">หมวดหมู่หลัก</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SkillCategory)}
              className="v-input w-full"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อทักษะ/ความสามารถ *</label>
            <input
              type="text"
              placeholder="เช่น ติดตั้งสุขภัณฑ์อัจฉริยะ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="v-input w-full"
            />
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-center h-9 space-x-2">
              <input
                type="checkbox"
                id="certReq"
                checked={certRequired}
                onChange={(e) => setCertRequired(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="certReq" className="text-xs font-semibold text-slate-600 select-none">
                ต้องมีใบรับรอง (Cert)
              </label>
            </div>
            <button type="submit" className="v-btn-primary h-9 text-xs">
              บันทึก
            </button>
          </div>
        </form>
      )}

      {/* Import Preview */}
      {importPreview && (
        <div className="v-panel p-5 bg-blue-50/50 border-blue-200 space-y-3">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2">
            <div className="flex items-center space-x-2 text-blue-800 font-bold text-sm">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span>ตรวจพบข้อมูลทักษะใหม่พร้อมนำเข้า {importPreview.length} รายการ</span>
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
                  <th className="p-2 border-b">รหัสทักษะ</th>
                  <th className="p-2 border-b">หมวดหมู่</th>
                  <th className="p-2 border-b">ชื่อทักษะ</th>
                  <th className="p-2 border-b text-right">ต้องมีใบรับรอง</th>
                </tr>
              </thead>
              <tbody>
                {importPreview.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2 border-b font-mono font-bold text-blue-600">{item.code}</td>
                    <td className="p-2 border-b text-slate-600">{item.category}</td>
                    <td className="p-2 border-b text-slate-800">{item.name}</td>
                    <td className="p-2 border-b text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${item.certificationRequired ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                        {item.certificationRequired ? 'จำเป็น' : 'ไม่จำเป็น'}
                      </span>
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

      {/* Main Skill Catalog Table */}
      <div className="v-panel overflow-hidden bg-white">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="ค้นหารหัสทักษะ, ชื่อทักษะ, หรือหมวดหมู่..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="v-input w-full pl-9"
            />
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center space-x-1"
          >
            <Download className="h-3.5 w-3.5" />
            <span>ดาวน์โหลดเทมเพลต JSON</span>
          </button>
        </div>

        <table className="v-table">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left">รหัสทักษะ (Skill Code)</th>
              <th className="px-6 py-3 text-left">หมวดหมู่หลัก (Category)</th>
              <th className="px-6 py-3 text-left">ชื่อทักษะ / ขีดความสามารถ</th>
              <th className="px-6 py-3 text-center">ต้องใช้ใบรับรอง</th>
              <th className="px-6 py-3 text-right">ลบข้อมูล</th>
            </tr>
          </thead>
          <tbody>
            {filteredSkills.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  ไม่พบข้อมูลทักษะในสารบบ
                </td>
              </tr>
            ) : (
              filteredSkills.map((skill) => (
                <tr key={skill.id}>
                  <td className="px-6 py-3 font-mono font-bold text-slate-800">{skill.code}</td>
                  <td className="px-6 py-3 text-slate-500 font-semibold">{skill.category}</td>
                  <td className="px-6 py-3 text-slate-700">{skill.name}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      skill.certificationRequired
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}>
                      {skill.certificationRequired ? 'ต้องมีใบรับรอง (Certified)' : 'ทั่วไป'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`คุณต้องการลบหมวดหมู่ทักษะ ${skill.name} หรือไม่?`)) {
                          onDeleteSkill(skill.id);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
