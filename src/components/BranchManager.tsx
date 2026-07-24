import React, { useState, useRef } from 'react';
import type { Branch } from '../types';
import { Building, Plus, Download, Upload, Trash, CheckCircle, Search } from 'lucide-react';

interface BranchManagerProps {
  branches: Branch[];
  onAddBranch: (branch: Branch) => void;
  onAddMultipleBranches: (branches: Branch[]) => void;
  onDeleteBranch: (branchId: string) => void;
}

export const BranchManager: React.FC<BranchManagerProps> = ({
  branches,
  onAddBranch,
  onAddMultipleBranches,
  onDeleteBranch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [province, setProvince] = useState('กรุงเทพมหานคร');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  
  // Import variables
  const [importPreview, setImportPreview] = useState<Branch[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.province.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      alert('กรุณากรอกรหัสสาขาและชื่อสาขา');
      return;
    }
    if (branches.some((b) => b.code.toUpperCase() === code.toUpperCase())) {
      alert('รหัสสาขานี้มีอยู่ในระบบแล้ว');
      return;
    }

    const newBranch: Branch = {
      id: `br-${Date.now()}`,
      code: code.toUpperCase(),
      name,
      province,
      status,
    };

    onAddBranch(newBranch);
    setCode('');
    setName('');
    setShowAddForm(false);
  };

  // Preset quick importer
  const handleLoadSampleData = () => {
    const sampleBranches: Branch[] = [
      { id: 'br-s1', code: 'B05', name: 'สาขารัตนาธิเบศร์', province: 'นนทบุรี', status: 'Active' },
      { id: 'br-s2', code: 'B06', name: 'สาขาเชียงใหม่ (หางดง)', province: 'เชียงใหม่', status: 'Active' },
      { id: 'br-s3', code: 'B07', name: 'สาขาพัทยา', province: 'ชลบุรี', status: 'Active' },
      { id: 'br-s4', code: 'B08', name: 'สาขาภูเก็ต', province: 'ภูเก็ต', status: 'Inactive' },
    ];
    
    // Filter duplicates
    const nonDuplicateSamples = sampleBranches.filter(
      (sample) => !branches.some((b) => b.code === sample.code)
    );

    if (nonDuplicateSamples.length === 0) {
      alert('ข้อมูลตัวอย่างชุดนี้ได้รับการนำเข้าแล้วทั้งหมด');
      return;
    }

    onAddMultipleBranches(nonDuplicateSamples);
    alert(`นำเข้าข้อมูลตัวอย่าง ${nonDuplicateSamples.length} สาขา สำเร็จ!`);
  };

  // CSV/JSON File import
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
          // Simple CSV parser
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
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

        // Validate structure
        const validated: Branch[] = parsedData
          .filter((item: any) => item.code && item.name)
          .map((item: any, idx: number) => ({
            id: `br-import-${Date.now()}-${idx}`,
            code: String(item.code).toUpperCase().trim(),
            name: String(item.name).trim(),
            province: String(item.province || 'กรุงเทพมหานคร').trim(),
            status: item.status === 'Inactive' ? 'Inactive' : 'Active',
          }));

        if (validated.length === 0) {
          setImportError('ไม่พบข้อมูลสาขาที่ถูกต้องในไฟล์ (ต้องการฟิลด์ code และ name)');
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
    
    // Filter duplicates
    const uniqueImports = importPreview.filter(
      (imported) => !branches.some((b) => b.code === imported.code)
    );

    if (uniqueImports.length === 0) {
      alert('ไม่สามารถนำเข้าได้ เนื่องจากรหัสสาขาทั้งหมดมีอยู่ในระบบแล้ว');
    } else {
      onAddMultipleBranches(uniqueImports);
      alert(`นำเข้าข้อมูลใหม่สำเร็จ ${uniqueImports.length} สาขา (ข้ามรายการซ้ำ ${importPreview.length - uniqueImports.length} รายการ)`);
    }
    setImportPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download template JSON
  const handleDownloadTemplate = () => {
    const template = [
      { code: 'B90', name: 'สาขาทดลองนำเข้า 1', province: 'กรุงเทพมหานคร', status: 'Active' },
      { code: 'B91', name: 'สาขาทดลองนำเข้า 2', province: 'นนทบุรี', status: 'Inactive' }
    ];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "branch_template.json");
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
            <Building className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">ระบบจัดการและนำเข้าข้อมูลสาขา (Branch Management)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ลงทะเบียน ค้นหา และนำเข้าข้อมูลสาขาขององค์กร เพื่อเชื่อมโยงช่างและคิวงานติดตั้งตามสาขา
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
            <span>เพิ่มสาขาแมนนวล</span>
          </button>
        </div>
      </div>

      {/* Form / Import Previews */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="v-panel p-5 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">รหัสสาขา (Branch Code) *</label>
            <input
              type="text"
              placeholder="เช่น B05"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="v-input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อสาขา (Branch Name) *</label>
            <input
              type="text"
              placeholder="เช่น สาขาแจ้งวัฒนะ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="v-input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">จังหวัด (Province)</label>
            <input
              type="text"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="v-input w-full"
            />
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1">สถานะ</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                className="v-input w-full"
              >
                <option value="Active">เปิดบริการ (Active)</option>
                <option value="Inactive">ปิดบริการ (Inactive)</option>
              </select>
            </div>
            <button type="submit" className="v-btn-primary h-9 text-xs">
              บันทึก
            </button>
          </div>
        </form>
      )}

      {/* Import File Preview Modal/Box */}
      {importPreview && (
        <div className="v-panel p-5 bg-blue-50/50 border-blue-200 space-y-3">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2">
            <div className="flex items-center space-x-2 text-blue-800 font-bold text-sm">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span>ตรวจพบข้อมูลสาขาใหม่พร้อมนำเข้า {importPreview.length} รายการ</span>
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
                  <th className="p-2 border-b">รหัสสาขา</th>
                  <th className="p-2 border-b">ชื่อสาขา</th>
                  <th className="p-2 border-b">จังหวัด</th>
                  <th className="p-2 border-b text-right">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {importPreview.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2 border-b font-mono font-bold text-blue-600">{item.code}</td>
                    <td className="p-2 border-b text-slate-800">{item.name}</td>
                    <td className="p-2 border-b text-slate-600">{item.province}</td>
                    <td className="p-2 border-b text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${item.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {item.status}
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
        <div className="v-panel p-4 bg-rose-50 border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <span>⚠️ {importError}</span>
        </div>
      )}

      {/* Main Branch Directory Table */}
      <div className="v-panel overflow-hidden bg-white">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="ค้นหารหัสสาขา, ชื่อสาขา, หรือจังหวัด..."
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
              <th className="px-6 py-3 text-left">รหัสสาขา (Branch Code)</th>
              <th className="px-6 py-3 text-left">ชื่อสาขา (Branch Name)</th>
              <th className="px-6 py-3 text-left">พื้นที่จังหวัด</th>
              <th className="px-6 py-3 text-center">สถานะ</th>
              <th className="px-6 py-3 text-right">ลบข้อมูล</th>
            </tr>
          </thead>
          <tbody>
            {filteredBranches.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  ไม่พบข้อมูลสาขาในระบบ
                </td>
              </tr>
            ) : (
              filteredBranches.map((branch) => (
                <tr key={branch.id}>
                  <td className="px-6 py-3 font-mono font-bold text-slate-800">
                    {branch.code}
                  </td>
                  <td className="px-6 py-3 text-slate-700 font-semibold">
                    {branch.name}
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                    {branch.province}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      branch.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {branch.status === 'Active' ? 'เปิดบริการ' : 'ปิดบริการ'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`คุณต้องการลบสาขา ${branch.name} หรือไม่?`)) {
                          onDeleteBranch(branch.id);
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
