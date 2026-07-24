import React, { useState, useRef } from 'react';
import type { Zone } from '../types';
import { Map, Plus, Download, Upload, Trash, CheckCircle, Search } from 'lucide-react';

interface ZoneManagerProps {
  zones: Zone[];
  onAddZone: (zone: Zone) => void;
  onAddMultipleZones: (zones: Zone[]) => void;
  onDeleteZone: (zoneId: string) => void;
}

export const ZoneManager: React.FC<ZoneManagerProps> = ({
  zones,
  onAddZone,
  onAddMultipleZones,
  onDeleteZone,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [zipcodesStr, setZipcodesStr] = useState('');

  // Import variables
  const [importPreview, setImportPreview] = useState<Zone[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredZones = zones.filter(
    (z) =>
      z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      alert('กรุณากรอกรหัสโซนและชื่อโซน');
      return;
    }
    if (zones.some((z) => z.code.toUpperCase() === code.toUpperCase())) {
      alert('รหัสโซนนี้มีอยู่ในระบบแล้ว');
      return;
    }

    const zipcodes = zipcodesStr
      .split(',')
      .map((zip) => zip.trim())
      .filter((zip) => zip.length > 0);

    const newZone: Zone = {
      id: `zone-${Date.now()}`,
      code: code.toUpperCase(),
      name,
      description,
      coverageZipcodes: zipcodes,
    };

    onAddZone(newZone);
    setCode('');
    setName('');
    setDescription('');
    setZipcodesStr('');
    setShowAddForm(false);
  };

  const handleLoadSampleData = () => {
    const sampleZones: Zone[] = [
      { id: 'zone-s1', code: 'Z05', name: 'เชียงใหม่ (ตัวเมือง - หางดง - สันทราย)', description: 'พื้นที่ให้บริการเขตภาคเหนือตอนบนครอบคลุมอำเภอหลัก', coverageZipcodes: ['50000', '50230', '50210'] },
      { id: 'zone-s2', code: 'Z06', name: 'ชลบุรี (พัทยา - ศรีราชา - บางละมุง)', description: 'พื้นที่ให้บริการเขตนวัตกรรมและอุตสาหกรรมภาคตะวันออก', coverageZipcodes: ['20150', '20110', '20260'] },
      { id: 'zone-s3', code: 'Z07', name: 'ภูเก็ต (กะทู้ - ถลาง - เมืองภูเก็ต)', description: 'โซนท่องเที่ยวพิเศษครอบคลุมเกาะภูเก็ตทั้งหมด', coverageZipcodes: ['83000', '83120', '83110'] },
    ];

    const nonDuplicateSamples = sampleZones.filter(
      (sample) => !zones.some((z) => z.code === sample.code)
    );

    if (nonDuplicateSamples.length === 0) {
      alert('ข้อมูลโซนตัวอย่างชุดนี้ได้รับการนำเข้าแล้วทั้งหมด');
      return;
    }

    onAddMultipleZones(nonDuplicateSamples);
    alert(`นำเข้าข้อมูลพื้นที่/โซนตัวอย่าง ${nonDuplicateSamples.length} โซน สำเร็จ!`);
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

        const validated: Zone[] = parsedData
          .filter((item: any) => item.code && item.name)
          .map((item: any, idx: number) => {
            let zipcodes: string[] = [];
            if (item.coverageZipcodes) {
              if (Array.isArray(item.coverageZipcodes)) {
                zipcodes = item.coverageZipcodes.map((z: any) => String(z).trim());
              } else {
                zipcodes = String(item.coverageZipcodes)
                  .split(';')
                  .map((z: any) => z.trim())
                  .filter((z: any) => z.length > 0);
              }
            }
            return {
              id: `zone-import-${Date.now()}-${idx}`,
              code: String(item.code).toUpperCase().trim(),
              name: String(item.name).trim(),
              description: String(item.description || '').trim(),
              coverageZipcodes: zipcodes,
            };
          });

        if (validated.length === 0) {
          setImportError('ไม่พบข้อมูลโซนที่ถูกต้องในไฟล์ (ต้องการฟิลด์ code และ name)');
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
      (imported) => !zones.some((z) => z.code === imported.code)
    );

    if (uniqueImports.length === 0) {
      alert('ไม่สามารถนำเข้าได้ เนื่องจากรหัสโซนทั้งหมดมีอยู่ในระบบแล้ว');
    } else {
      onAddMultipleZones(uniqueImports);
      alert(`นำเข้าโซนบริการใหม่สำเร็จ ${uniqueImports.length} โซน`);
    }
    setImportPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        code: 'Z90',
        name: 'โซนทดลองนำเข้า 1',
        description: 'รายละเอียดโซนทดลองนำเข้า 1',
        coverageZipcodes: ['10110', '10120'],
      },
      {
        code: 'Z91',
        name: 'โซนทดลองนำเข้า 2',
        description: 'รายละเอียดโซนทดลองนำเข้า 2',
        coverageZipcodes: ['20000', '20110'],
      },
    ];
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'zone_template.json');
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
            <Map className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">ระบบจัดการและนำเข้าข้อมูลพื้นที่/โซน (Zone Management)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดขอบเขตโซนพื้นที่การให้บริการ (Service Zone) และระบุรหัสไปรษณีย์สำหรับการแมตช์ที่อยู่ในการนัดหมายติดตั้ง
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
            <span>เพิ่มโซนแมนนวล</span>
          </button>
        </div>
      </div>

      {/* Manual Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="v-panel p-5 grid grid-cols-1 md:grid-cols-5 gap-4 animate-fadeIn">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">รหัสโซน (Zone Code) *</label>
            <input
              type="text"
              placeholder="เช่น Z05"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="v-input w-full"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อพื้นที่ / ขอบเขตบริการ *</label>
            <input
              type="text"
              placeholder="เช่น นนทบุรี (ราชพฤกษ์ - แจ้งวัฒนะ)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="v-input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">คำอธิบาย</label>
            <input
              type="text"
              placeholder="เช่น โซนที่อยู่อาศัยฝั่งเหนือ"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="v-input w-full"
            />
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1">รหัสไปรษณีย์ (คั่นด้วย Comma ,)</label>
              <input
                type="text"
                placeholder="เช่น 10260,10250"
                value={zipcodesStr}
                onChange={(e) => setZipcodesStr(e.target.value)}
                className="v-input w-full"
              />
            </div>
            <button type="submit" className="v-btn-primary h-9 text-xs">
              บันทึก
            </button>
          </div>
        </form>
      )}

      {/* Import File Preview */}
      {importPreview && (
        <div className="v-panel p-5 bg-blue-50/50 border-blue-200 space-y-3">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2">
            <div className="flex items-center space-x-2 text-blue-800 font-bold text-sm">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span>ตรวจพบข้อมูลโซนใหม่พร้อมนำเข้า {importPreview.length} รายการ</span>
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
                  <th className="p-2 border-b">รหัสโซน</th>
                  <th className="p-2 border-b">ขอบเขตบริการ</th>
                  <th className="p-2 border-b">คำอธิบาย</th>
                  <th className="p-2 border-b">รหัสไปรษณีย์</th>
                </tr>
              </thead>
              <tbody>
                {importPreview.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2 border-b font-mono font-bold text-blue-600">{item.code}</td>
                    <td className="p-2 border-b text-slate-800">{item.name}</td>
                    <td className="p-2 border-b text-slate-600">{item.description}</td>
                    <td className="p-2 border-b">
                      <div className="flex flex-wrap gap-1">
                        {item.coverageZipcodes.map((zip) => (
                          <span key={zip} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10px]">
                            {zip}
                          </span>
                        ))}
                      </div>
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

      {/* Main Zone Directory Table */}
      <div className="v-panel overflow-hidden bg-white">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="ค้นหารหัสโซน, ชื่อพื้นที่, หรือคำอธิบาย..."
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
              <th className="px-6 py-3 text-left">รหัสโซน (Zone Code)</th>
              <th className="px-6 py-3 text-left">ชื่อขอบเขตพื้นที่บริการ</th>
              <th className="px-6 py-3 text-left">คำอธิบายรายละเอียด</th>
              <th className="px-6 py-3 text-left">รหัสไปรษณีย์ที่ครอบคลุม</th>
              <th className="px-6 py-3 text-right">ลบข้อมูล</th>
            </tr>
          </thead>
          <tbody>
            {filteredZones.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  ไม่พบข้อมูลโซนบริการในระบบ
                </td>
              </tr>
            ) : (
              filteredZones.map((zone) => (
                <tr key={zone.id}>
                  <td className="px-6 py-3 font-mono font-bold text-slate-800">{zone.code}</td>
                  <td className="px-6 py-3 text-slate-700 font-semibold">{zone.name}</td>
                  <td className="px-6 py-3 text-slate-500">{zone.description}</td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-1 max-w-sm">
                      {zone.coverageZipcodes.length === 0 ? (
                        <span className="text-slate-400 italic">ไม่จำกัดรหัสไปรษณีย์</span>
                      ) : (
                        zone.coverageZipcodes.map((zip) => (
                          <span key={zip} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                            {zip}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`คุณต้องการลบโซนพื้นที่ ${zone.name} หรือไม่?`)) {
                          onDeleteZone(zone.id);
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
