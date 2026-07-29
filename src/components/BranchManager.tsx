import React, { useState, useRef } from 'react';
import type { Branch } from '../types';
import { Building, Plus, Download, Upload, Trash, CheckCircle, Search, Clock, Phone, MapPin, Pencil, X } from 'lucide-react';

interface BranchManagerProps {
  branches: Branch[];
  onAddBranch: (branch: Branch) => void;
  onAddMultipleBranches: (branches: Branch[]) => void;
  onUpdateBranch?: (branch: Branch) => void;
  onDeleteBranch: (branchId: string) => void;
}

export const BranchManager: React.FC<BranchManagerProps> = ({
  branches,
  onAddBranch,
  onAddMultipleBranches,
  onUpdateBranch,
  onDeleteBranch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  
  // Form fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [fullName, setFullName] = useState('');
  const [province, setProvince] = useState('กรุงเทพมหานคร');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [storeGroup, setStoreGroup] = useState<string>('TWD');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [openTime, setOpenTime] = useState('07:00');
  const [closeTime, setCloseTime] = useState('21:00');
  const [phone, setPhone] = useState('1308');

  // Filters
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  
  // Import variables
  const [importPreview, setImportPreview] = useState<Branch[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.address && b.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.fullName && b.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGroup = selectedGroup === 'All' || b.storeGroup === selectedGroup;

    return matchesSearch && matchesGroup;
  });

  const handleStartEdit = (branch: Branch) => {
    setEditingBranchId(branch.id);
    setCode(branch.code);
    setName(branch.name);
    setFullName(branch.fullName || '');
    setProvince(branch.province);
    setStatus(branch.status);
    setStoreGroup(branch.storeGroup || 'TWD');
    setAddress(branch.address || '');
    setLatitude(branch.latitude ? String(branch.latitude) : '');
    setLongitude(branch.longitude ? String(branch.longitude) : '');
    setOpenTime(branch.openTime || '07:00');
    setCloseTime(branch.closeTime || '21:00');
    setPhone(branch.phone || '1308');
    setShowAddForm(true);
  };

  const handleResetForm = () => {
    setCode('');
    setName('');
    setFullName('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setOpenTime('07:00');
    setCloseTime('21:00');
    setPhone('1308');
    setStoreGroup('TWD');
    setStatus('Active');
    setEditingBranchId(null);
    setShowAddForm(false);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      alert('กรุณากรอกรหัสสาขาและชื่อสาขา');
      return;
    }

    if (editingBranchId) {
      const updatedBranch: Branch = {
        id: editingBranchId,
        code: code.toUpperCase(),
        name,
        province,
        status,
        fullName: fullName || undefined,
        address: address || undefined,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        openTime: openTime || '07:00',
        closeTime: closeTime || '21:00',
        phone: phone || '1308',
        storeGroup: storeGroup || 'TWD',
      };
      if (onUpdateBranch) {
        onUpdateBranch(updatedBranch);
      }
      handleResetForm();
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
      fullName: fullName || undefined,
      address: address || undefined,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      openTime: openTime || '07:00',
      closeTime: closeTime || '21:00',
      phone: phone || '1308',
      storeGroup: storeGroup || 'TWD',
    };

    onAddBranch(newBranch);
    handleResetForm();
  };

  // Preset quick importer
  const handleLoadSampleData = () => {
    const sampleBranches: Branch[] = [
      {
        id: 'br-s1',
        code: 'B918',
        name: 'สาขาบางบัวทอง',
        province: 'นนทบุรี',
        status: 'Active',
        fullName: 'บริษัท ซีอาร์ซี ไทวัสดุ จำกัด (สาขาบางบัวทอง)',
        address: '9/9 หมู่ 3 ตำบลบางบัวทอง อำเภอบางบัวทอง จังหวัดนนทบุรี 11110',
        latitude: 13.9188,
        longitude: 100.4188,
        openTime: '07:00',
        closeTime: '21:00',
        phone: '1308',
        storeGroup: 'HBY'
      },
      {
        id: 'br-s2',
        code: 'B934',
        name: 'สาขาเชียงใหม่',
        province: 'เชียงใหม่',
        status: 'Active',
        fullName: 'บริษัท ซีอาร์ซี ไทวัสดุ จำกัด (สาขาเชียงใหม่)',
        address: '99/9 หมู่ 2 ตำบลท่าศาลา อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50000',
        latitude: 18.7884,
        longitude: 99.0156,
        openTime: '08:00',
        closeTime: '21:00',
        phone: '1308',
        storeGroup: 'TWD'
      },
      {
        id: 'br-s3',
        code: 'B954',
        name: 'สาขาพัทยาใต้',
        province: 'ชลบุรี',
        status: 'Active',
        fullName: 'บริษัท ซีอาร์ซี ไทวัสดุ จำกัด (สาขาพัทยาใต้)',
        address: '555 หมู่ 12 ตำบลหนองปรือ อำเภอบางละมุง จังหวัดชลบุรี 20150',
        latitude: 12.9084,
        longitude: 100.8956,
        openTime: '07:30',
        closeTime: '21:00',
        phone: '1308',
        storeGroup: 'TWD'
      }
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

        // Validate structure with fallbacks for Excel fields
        const validated: Branch[] = parsedData
          .filter((item: any) => (item.code || item.STCODE || item.STORE) && (item.name || item.SnameTH || item.SName))
          .map((item: any, idx: number) => {
            const rawCode = item.code || item.STCODE || item.STORE;
            const code = String(rawCode).startsWith('B') ? String(rawCode).toUpperCase().trim() : `B${String(rawCode).trim()}`;
            
            let name = item.name || item.SnameTH || item.SName;
            name = String(name).trim();
            if (!name.startsWith('สาขา')) {
              name = `สาขา${name}`;
            }

            return {
              id: `br-import-${Date.now()}-${idx}`,
              code,
              name,
              province: String(item.province || item.Province || 'กรุงเทพมหานคร').trim(),
              status: item.status === 'Inactive' ? 'Inactive' : 'Active',
              fullName: item.fullName || item.STTNAME ? String(item.fullName || item.STTNAME).trim() : undefined,
              address: item.address || item.THADDRESS ? String(item.address || item.THADDRESS).trim() : undefined,
              latitude: item.latitude || item.Lat ? Number(item.latitude || item.Lat) : undefined,
              longitude: item.longitude || item.lng ? Number(item.longitude || item.lng) : undefined,
              openTime: item.openTime || item.Opentime ? String(item.openTime || item.Opentime).trim() : undefined,
              closeTime: item.closeTime || item.CloseTime ? String(item.closeTime || item.CloseTime).trim() : undefined,
              phone: item.phone || item.STTEL ? String(item.phone || item.STTEL).trim() : undefined,
              storeGroup: item.storeGroup || item.STOREGROUP ? String(item.storeGroup || item.STOREGROUP).trim() : undefined,
            };
          });

        if (validated.length === 0) {
          setImportError('ไม่พบข้อมูลสาขาที่ถูกต้องในไฟล์');
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
      { 
        code: 'B920', 
        name: 'สาขาบางนา', 
        province: 'สมุทรปราการ', 
        status: 'Active',
        fullName: 'บริษัท ซีอาร์ซี ไทวัสดุ จำกัด (สาขาบางนา)',
        address: '9 หมู่ 7 ตำบลบางพลีใหญ่ อำเภอบางพลี จังหวัดสมุทรปราการ 10540',
        latitude: 13.6118,
        longitude: 100.6158,
        openTime: '07:00',
        closeTime: '21:00',
        phone: '1308',
        storeGroup: 'TWD'
      }
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
        <form onSubmit={handleAddSubmit} className="v-panel p-5 space-y-4 animate-fadeIn border-amber-500/40 bg-slate-50/50">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              {editingBranchId ? <Pencil className="h-4 w-4 text-amber-500" /> : <Plus className="h-4 w-4 text-blue-600" />}
              <span>{editingBranchId ? 'แก้ไขข้อมูลสาขา (Edit Branch)' : 'เพิ่มข้อมูลสาขาใหม่ (Create Branch)'}</span>
            </h3>
            {editingBranchId && (
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" /> ยกเลิกการแก้ไข
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">รหัสสาขา (Branch Code) *</label>
            <input
              type="text"
              placeholder="เช่น B920"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="v-input w-full font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อสาขา (Branch Name) *</label>
            <input
              type="text"
              placeholder="เช่น สาขาบางนา"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="v-input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อเต็มบริษัท (Corporate Name)</label>
            <input
              type="text"
              placeholder="เช่น บริษัท ซีอาร์ซี ไทวัสดุ จำกัด (สาขาบางนา)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="v-input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">กลุ่มร้านค้า (Store Group)</label>
            <select
              value={storeGroup}
              onChange={(e) => setStoreGroup(e.target.value)}
              className="v-input w-full"
            >
              <option value="TWD">TWD (ไทวัสดุ)</option>
              <option value="HBY">HBY (BnB Home)</option>
              <option value="HO">HO (สำนักงานใหญ่)</option>
            </select>
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
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">เวลาเปิด (Open Time)</label>
            <input
              type="text"
              placeholder="เช่น 07:00"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="v-input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">เวลาปิด (Close Time)</label>
            <input
              type="text"
              placeholder="เช่น 21:00"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="v-input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">เบอร์ติดต่อ (Phone)</label>
            <input
              type="text"
              placeholder="เช่น 1308"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="v-input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">พิกัด ละติจูด (Lat)</label>
            <input
              type="number"
              step="any"
              placeholder="เช่น 13.6118"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="v-input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">พิกัด ลองจิจูด (Lng)</label>
            <input
              type="number"
              step="any"
              placeholder="เช่น 100.6158"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="v-input w-full"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">ที่อยู่ตามทะเบียน (Address)</label>
            <input
              type="text"
              placeholder="กรอกที่อยู่ของสาขา..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="v-input w-full"
            />
          </div>
          <div className="flex items-end justify-between gap-3 md:col-span-3 lg:col-span-4 border-t border-slate-100 pt-3">
            <div className="w-1/3 max-w-xs">
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
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="v-btn-secondary py-2 text-xs"
              >
                ยกเลิก
              </button>
              <button type="submit" className={`${editingBranchId ? 'bg-amber-500 hover:bg-amber-600 text-slate-900' : 'v-btn-primary'} py-2 text-xs px-6 font-bold rounded-lg transition`}>
                {editingBranchId ? 'บันทึกแก้ไขสาขา' : 'บันทึกข้อมูลสาขา'}
              </button>
            </div>
          </div>
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
                  <th className="p-2 border-b">กลุ่ม</th>
                  <th className="p-2 border-b">รหัสสาขา</th>
                  <th className="p-2 border-b">ชื่อสาขา</th>
                  <th className="p-2 border-b">จังหวัด</th>
                  <th className="p-2 border-b text-right">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {importPreview.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2 border-b font-mono font-bold text-slate-500">{item.storeGroup || '-'}</td>
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
          <div className="flex flex-col md:flex-row gap-3 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="ค้นหารหัสสาขา, ชื่อสาขา, จังหวัด หรือที่อยู่..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="v-input w-full pl-9"
              />
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            
            <div className="w-full md:w-48">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="v-input w-full"
              >
                <option value="All">กลุ่มร้านค้าทั้งหมด</option>
                <option value="TWD">TWD (ไทวัสดุ)</option>
                <option value="HBY">HBY (BnB Home)</option>
                <option value="HO">HO (สำนักงานใหญ่)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center space-x-1 shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>ดาวน์โหลดเทมเพลต JSON</span>
          </button>
        </div>

        <table className="v-table">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left">กลุ่ม</th>
              <th className="px-6 py-3 text-left">รหัสสาขา</th>
              <th className="px-6 py-3 text-left">ชื่อสาขา</th>
              <th className="px-6 py-3 text-left">พื้นที่จังหวัด</th>
              <th className="px-6 py-3 text-left">เวลาทำการ / เบอร์โทร</th>
              <th className="px-6 py-3 text-left">พิกัด GPS (Google Maps)</th>
              <th className="px-6 py-3 text-center">สถานะ</th>
              <th className="px-6 py-3 text-right">จัดการ (Actions)</th>
            </tr>
          </thead>
          <tbody>
            {filteredBranches.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                  ไม่พบข้อมูลสาขาในระบบ
                </td>
              </tr>
            ) : (
              filteredBranches.map((branch) => {
                const getGroupBadge = (group?: string) => {
                  if (!group) return <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200">N/A</span>;
                  switch (group) {
                    case 'HBY':
                      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">HBY</span>;
                    case 'TWD':
                      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">TWD</span>;
                    case 'HO':
                      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">HO</span>;
                    default:
                      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200">{group}</span>;
                  }
                };

                return (
                  <tr key={branch.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 text-slate-600">
                      {getGroupBadge(branch.storeGroup)}
                    </td>
                    <td className="px-6 py-3 font-mono font-bold text-slate-800">
                      {branch.code}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      <div>
                        <div className="font-semibold text-slate-800">{branch.name}</div>
                        {branch.address && (
                          <div className="text-[11px] text-slate-400 max-w-[280px] truncate" title={branch.address}>
                            {branch.address}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-600 font-medium">
                      {branch.province}
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{branch.openTime || '07:00'} - {branch.closeTime || '21:00'}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                          <Phone className="h-3 w-3 text-slate-300" />
                          <span>{branch.phone || '1308'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {branch.latitude && branch.longitude ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors text-xs font-semibold"
                        >
                          <MapPin className="h-3 w-3 text-blue-500" />
                          <span className="font-mono text-[10px]">{branch.latitude.toFixed(5)}, {branch.longitude.toFixed(5)}</span>
                        </a>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleStartEdit(branch)}
                          title="แก้ไขข้อมูลสาขา"
                          className="text-slate-400 hover:text-amber-600 transition-colors p-1.5 rounded hover:bg-amber-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`คุณต้องการลบสาขา ${branch.name} หรือไม่?`)) {
                              onDeleteBranch(branch.id);
                            }
                          }}
                          title="ลบสาขา"
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded hover:bg-rose-50"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
