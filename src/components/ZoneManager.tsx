import React, { useState, useRef } from 'react';
import type { Zone, QueueBooking, Technician } from '../types';
import { 
  Map, 
  Plus, 
  Download, 
  Upload, 
  Trash, 
  CheckCircle, 
  Search, 
  Pencil, 
  X, 
  Activity, 
  Layers, 
  ChevronRight, 
  Filter, 
  ExternalLink,
  Send,
  Eye,
  LayoutGrid,
  List
} from 'lucide-react';

interface ZoneManagerProps {
  zones: Zone[];
  bookings?: QueueBooking[];
  technicians?: Technician[];
  onAddZone: (zone: Zone) => void;
  onAddMultipleZones: (zones: Zone[]) => void;
  onUpdateZone?: (zone: Zone) => void;
  onDeleteZone: (zoneId: string) => void;
  onDispatchToKanna?: (bookingId: string) => void;
}

export const ZoneManager: React.FC<ZoneManagerProps> = ({
  zones,
  bookings = [],
  technicians = [],
  onAddZone,
  onAddMultipleZones,
  onUpdateZone,
  onDeleteZone,
  onDispatchToKanna,
}) => {
  const [activeViewMode, setActiveViewMode] = useState<'monitor' | 'master'>('monitor');
  const [monitorSubView, setMonitorSubView] = useState<'card' | 'list'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<'ALL' | 'BKK' | 'UPC'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NORMAL' | 'MEDIUM' | 'HIGH'>('ALL');
  
  // Selected Zone for Detail Modal (Drill-down)
  const [selectedDetailZone, setSelectedDetailZone] = useState<Zone | null>(null);
  const [detailTab, setDetailTab] = useState<'bookings' | 'techs' | 'info'>('bookings');

  // Master Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [zipcodesStr, setZipcodesStr] = useState('');

  // Import variables
  const [importPreview, setImportPreview] = useState<Zone[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Match booking to Zone
  const getBookingsForZone = (zone: Zone): QueueBooking[] => {
    const zCode = zone.code.toLowerCase();
    const zName = zone.name.toLowerCase();
    const cleanZName = zName.replace(/^\[(bkk|upc|ct)\]\s*/, '').trim();

    return bookings.filter((b) => {
      const bZone = (b.addressZone || '').toLowerCase();
      
      // Match by standard zone codes
      if (zCode === 'z01' || zCode === 'zone-1' || zCode === 'zone 1') {
        if (bZone.includes('zone 1') || bZone.includes('สุขุมวิท') || bZone.includes('บางนา') || bZone.includes('กรุงเทพ')) return true;
      }
      if (zCode === 'z02' || zCode === 'zone-2' || zCode === 'zone 2') {
        if (bZone.includes('zone 2') || bZone.includes('นนทบุรี') || bZone.includes('ราชพฤกษ์')) return true;
      }
      if (zCode === 'z03' || zCode === 'zone-3' || zCode === 'zone 3') {
        if (bZone.includes('zone 3') || bZone.includes('ปทุมธานี') || bZone.includes('รังสิต')) return true;
      }
      if (zCode === 'z04' || zCode === 'zone-4' || zCode === 'zone 4') {
        if (bZone.includes('zone 4') || bZone.includes('สมุทรปราการ') || bZone.includes('เทพารักษ์')) return true;
      }
      if (zCode === 'z05' || zCode === 'zone-5' || zCode === 'zone 5') {
        if (bZone.includes('zone 5') || bZone.includes('ฝั่งธนบุรี') || bZone.includes('เชียงใหม่')) return true;
      }
      if (zCode === 'z06' || zCode === 'zone-6' || zCode === 'zone 6') {
        if (bZone.includes('zone 6') || bZone.includes('ตอนเหนือ') || bZone.includes('จตุจักร') || bZone.includes('ชลบุรี')) return true;
      }

      return (
        bZone.includes(zCode) ||
        bZone.includes(cleanZName) ||
        (zone.coverageZipcodes && zone.coverageZipcodes.some((zip) => bZone.includes(zip)))
      );
    });
  };

  // Helper: Match Technicians to Zone
  const getTechniciansForZone = (zone: Zone): Technician[] => {
    const zName = zone.name.toLowerCase();
    const zCode = zone.code.toLowerCase();
    const cleanZName = zName.replace(/^\[(bkk|upc|ct)\]\s*/, '').trim();

    return technicians.filter((t) => {
      const pZone = (t.primaryZone || '').toLowerCase();
      const secZones = (t.secondaryZones || []).map((sz) => sz.toLowerCase()).join(' ');

      if (zCode === 'z01' || zCode === 'zone-1' || zCode === 'zone 1') {
        if (pZone.includes('zone 1') || pZone.includes('สุขุมวิท') || secZones.includes('zone 1')) return true;
      }
      if (zCode === 'z02' || zCode === 'zone-2' || zCode === 'zone 2') {
        if (pZone.includes('zone 2') || pZone.includes('นนทบุรี') || secZones.includes('zone 2')) return true;
      }

      return (
        pZone.includes(cleanZName) ||
        pZone.includes(zCode) ||
        secZones.includes(cleanZName) ||
        secZones.includes(zCode) ||
        (zName.includes('bkk') && (pZone.includes('กรุงเทพ') || pZone.includes('bkk') || pZone.includes('สุขุมวิท')))
      );
    });
  };

  // Zone Health Status calculator
  const getZoneHealthStatus = (zoneBookings: QueueBooking[]) => {
    const activeCount = zoneBookings.filter((b) => b.status !== 'Passed (Closed)').length;
    if (activeCount >= 5) return { label: '🔴 คิวแน่นเกินพิกัด', color: 'bg-rose-50 text-rose-700 border-rose-200', level: 'HIGH' };
    if (activeCount >= 2) return { label: '🟡 มีคิวรอจัดสรร', color: 'bg-amber-50 text-amber-800 border-amber-200', level: 'MEDIUM' };
    return { label: '🟢 สถานะปกติ', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', level: 'NORMAL' };
  };

  // Filtered Zones List
  const filteredZones = zones.filter((z) => {
    const matchesSearch =
      z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.description.toLowerCase().includes(searchQuery.toLowerCase());

    const isBkk = z.name.toUpperCase().includes('BKK') || z.code.startsWith('Z01') || z.code.startsWith('Z02') || z.code.startsWith('Z03') || z.code.startsWith('Z04');
    const matchesRegion =
      regionFilter === 'ALL' ||
      (regionFilter === 'BKK' && isBkk) ||
      (regionFilter === 'UPC' && !isBkk);

    const zBookings = getBookingsForZone(z);
    const health = getZoneHealthStatus(zBookings);
    const matchesStatus = statusFilter === 'ALL' || health.level === statusFilter;

    return matchesSearch && matchesRegion && matchesStatus;
  });

  // Master Form Handlers
  const handleStartEdit = (zone: Zone) => {
    setEditingZoneId(zone.id);
    setCode(zone.code);
    setName(zone.name);
    setDescription(zone.description);
    setZipcodesStr(zone.coverageZipcodes.join(', '));
    setShowAddForm(true);
  };

  const handleResetForm = () => {
    setCode('');
    setName('');
    setDescription('');
    setZipcodesStr('');
    setEditingZoneId(null);
    setShowAddForm(false);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      alert('กรุณากรอกรหัสโซนและชื่อโซน');
      return;
    }

    const zipcodes = zipcodesStr
      .split(',')
      .map((zip) => zip.trim())
      .filter((zip) => zip.length > 0);

    if (editingZoneId) {
      const updatedZone: Zone = {
        id: editingZoneId,
        code: code.toUpperCase(),
        name,
        description,
        coverageZipcodes: zipcodes,
      };
      if (onUpdateZone) {
        onUpdateZone(updatedZone);
      }
      handleResetForm();
      return;
    }

    if (zones.some((z) => z.code.toUpperCase() === code.toUpperCase())) {
      alert('รหัสโซนนี้มีอยู่ในระบบแล้ว');
      return;
    }

    const newZone: Zone = {
      id: `zone-${Date.now()}`,
      code: code.toUpperCase(),
      name,
      description,
      coverageZipcodes: zipcodes,
    };

    onAddZone(newZone);
    handleResetForm();
  };

  const handleLoadSampleData = () => {
    handleLoadBkkPreset();
  };

  const handleLoadBkkPreset = () => {
    const bkkPresetZones: Zone[] = [
      {
        id: 'zone-bkk-c1',
        code: 'Z01-C1',
        name: '[BKK] กรุงเทพฯ ชั้นใน (เมืองเก่า / พญาไท - ราชเทวี)',
        description: 'ครอบคลุมเขตพระนคร, ดุสิต, ป้อมปราบศัตรูพ่าย, สัมพันธวงศ์, พญาไท, ราชเทวี',
        coverageZipcodes: ['10100', '10200', '10300', '10400']
      },
      {
        id: 'zone-bkk-c2',
        code: 'Z01-C2',
        name: '[BKK] กรุงเทพฯ ชั้นใน (ศูนย์กลางธุรกิจ / สาทร - สีลม - บางรัก - พระราม 3)',
        description: 'ครอบคลุมเขตปทุมวัน, บางรัก, สาทร, ยานนาวา, บางคอแหลม',
        coverageZipcodes: ['10120', '10330', '10500']
      },
      {
        id: 'zone-bkk-c3',
        code: 'Z01-C3',
        name: '[BKK] กรุงเทพฯ ชั้นใน (สุขุมวิท / ดินแดง - ห้วยขวาง - คลองเตย)',
        description: 'ครอบคลุมเขตดินแดง, ห้วยขวาง, วัฒนา, คลองเตย',
        coverageZipcodes: ['10110', '10310']
      },
      {
        id: 'zone-bkk-n1',
        code: 'Z01-N1',
        name: '[BKK] กรุงเทพฯ เหนือตอนล่าง (จตุจักร - บางซื่อ - ลาดพร้าว)',
        description: 'ครอบคลุมเขตจตุจักร, บางซื่อ, ลาดพร้าว',
        coverageZipcodes: ['10800', '10900', '10230']
      },
      {
        id: 'zone-bkk-n2',
        code: 'Z01-N2',
        name: '[BKK] กรุงเทพฯ เหนือตอนบน (หลักสี่ - ดอนเมือง - สายไหม - บางเขน)',
        description: 'ครอบคลุมเขตหลักสี่, ดอนเมือง, สายไหม, บางเขน',
        coverageZipcodes: ['10210', '10220']
      },
      {
        id: 'zone-bkk-e1',
        code: 'Z01-E1',
        name: '[BKK] กรุงเทพฯ ตะวันออก (บางกะปิ - บึงกุ่ม - สะพานสูง - วังทองหลาง - คันนายาว)',
        description: 'ครอบคลุมเขตบางกะปิ, บึงกุ่ม, สะพานสูง, วังทองหลาง, คันนายาว',
        coverageZipcodes: ['10240', '10310']
      },
      {
        id: 'zone-bkk-e2',
        code: 'Z01-E2',
        name: '[BKK] กรุงเทพฯ ตะวันออกนอก (มีนบุรี - ลาดกระบัง - หนองจอก - คลองสามวา)',
        description: 'ครอบคลุมเขตคลองสามวา, หนองจอก, มีนบุรี, ลาดกระบัง',
        coverageZipcodes: ['10510', '10520']
      },
      {
        id: 'zone-bkk-se',
        code: 'Z01-SE',
        name: '[BKK] กรุงเทพฯ ตะวันออกใต้ (ประเวศ - สวนหลวง - บางนา)',
        description: 'ครอบคลุมเขตประเวศ, สวนหลวง, บางนา',
        coverageZipcodes: ['10250', '10260']
      },
      {
        id: 'zone-bkk-w1',
        code: 'Z01-W1',
        name: '[BKK] กรุงเทพฯ ฝั่งธนบุรีเหนือ (ธนบุรี - คลองสาน - บางกอกน้อย - บางพลัด - ตลิ่งชัน - ทวีวัฒนา)',
        description: 'ครอบคลุมเขตธนบุรี, คลองสาน, บางกอกใหญ่, บางกอกน้อย, บางพลัด, ตลิ่งชัน, ทวีวัฒนา',
        coverageZipcodes: ['10170', '10600', '10700']
      },
      {
        id: 'zone-bkk-w2',
        code: 'Z01-W2',
        name: '[BKK] กรุงเทพฯ ฝั่งธนบุรีใต้ (ภาษีเจริญ - บางแค - หนองแขม - ราษฎร์บูรณะ - ทุ่งครุ - จอมทอง - บางขุนเทียน - บางบอน)',
        description: 'ครอบคลุมเขตภาษีเจริญ, บางแค, หนองแขม, ราษฎร์บูรณะ, ทุ่งครุ, จอมทอง, บางขุนเทียน, บางบอน',
        coverageZipcodes: ['10140', '10150', '10160']
      }
    ];

    const nonDuplicateSamples = bkkPresetZones.filter(
      (sample) => !zones.some((z) => z.code === sample.code)
    );

    if (nonDuplicateSamples.length === 0) {
      alert('ชุดข้อมูลโซนกรุงเทพฯ (10 โซน) ได้รับการนำเข้าเรียบร้อยแล้วทั้งหมด');
      return;
    }

    onAddMultipleZones(nonDuplicateSamples);
    alert(`นำเข้าข้อมูลโซนกรุงเทพมหานครแบบครอบคลุม 50 เขต (${nonDuplicateSamples.length} โซน) สำเร็จ!`);
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
      {/* Title & Global Action Bar */}
      <div className="v-panel p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600 shrink-0">
              <Map className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                🗺️ ระบบมอนิเตอร์และจัดการโซนบริการ (Zone Monitor & Directory)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ติดตามสถานะคิวงานแบบ Real-time แยกตามโซน พร้อมปุ่มเพิ่มโซนและนำเข้าข้อมูล
              </p>
            </div>
          </div>

          {/* Action Buttons & View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Add Zone Button (ALWAYS VISIBLE) */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="v-btn-primary py-2 px-3.5 flex items-center space-x-1.5 text-xs font-extrabold cursor-pointer bg-amber-500 hover:bg-amber-600 text-slate-900 border-0 shadow-sm rounded-xl"
            >
              <Plus className="h-4 w-4" />
              <span>+ เพิ่มโซนแมนนวล</span>
            </button>

            {/* Import Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="v-btn-secondary py-2 px-3 flex items-center space-x-1 text-xs cursor-pointer rounded-xl"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>นำเข้าไฟล์</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.json"
              className="hidden"
            />

            {/* Load BKK Preset Button */}
            <button
              onClick={handleLoadBkkPreset}
              className="v-btn-secondary py-2 px-3 text-xs text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100 cursor-pointer rounded-xl font-medium flex items-center gap-1.5"
            >
              <span>🗺️ โหลด 10 โซน กทม.</span>
            </button>

            {/* Load Sample Button */}
            <button
              onClick={handleLoadSampleData}
              className="v-btn-secondary py-2 px-3 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 cursor-pointer rounded-xl hidden sm:inline-flex"
            >
              โหลดตัวอย่างอื่น
            </button>

            {/* Mode Switcher Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveViewMode('monitor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 ${
                  activeViewMode === 'monitor'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
              >
                <Activity className="h-4 w-4" />
                <span>📊 Zone Cards</span>
              </button>
              <button
                onClick={() => setActiveViewMode('master')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 ${
                  activeViewMode === 'master'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>⚙️ ตาราง Master</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Summary Statistics KPI Bar */}
        {activeViewMode === 'monitor' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 font-bold text-lg">🗺️</div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">โซนทั้งหมด</span>
                <strong className="text-sm font-extrabold text-slate-800">{zones.length} โซน</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 font-bold text-lg">🎫</div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">คิวงานในระบบรวม</span>
                <strong className="text-sm font-extrabold text-amber-700">{bookings.length} รายการ</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-lg">👷</div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ทีมช่างพร้อมให้บริการ</span>
                <strong className="text-sm font-extrabold text-emerald-700">{technicians.length} ทีม</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 font-bold text-lg">⚡</div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">โซนคิวหนาแน่น</span>
                <strong className="text-sm font-extrabold text-indigo-700">
                  {zones.filter((z) => getBookingsForZone(z).length >= 3).length} โซน
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Manual Form (AVAILABLE GLOBALLY IN BOTH VIEWS) */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="v-panel p-5 space-y-4 animate-fadeIn border-amber-500/40 bg-slate-50/90 rounded-2xl shadow-md">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              {editingZoneId ? <Pencil className="h-4 w-4 text-amber-500" /> : <Plus className="h-4 w-4 text-blue-600" />}
              <span>{editingZoneId ? 'แก้ไขข้อมูลโซนบริการ (Edit Zone)' : 'เพิ่มโซนพื้นที่บริการใหม่ (Create Zone)'}</span>
            </h3>
            <button
              type="button"
              onClick={handleResetForm}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" /> ยกเลิก / ปิดฟอร์ม
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">รหัสโซน (Zone Code) *</label>
              <input
                type="text"
                placeholder="เช่น Z05"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="v-input w-full font-mono font-bold bg-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อพื้นที่ / ขอบเขตบริการ *</label>
              <div className="flex gap-1.5 mb-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (!name.startsWith('[BKK]')) {
                      setName('[BKK] ' + name.replace(/^\[(BKK|UPC)\]\s*/, ''));
                    }
                  }}
                  className="px-2 py-1 text-[10px] font-bold rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 border border-amber-500/30 cursor-pointer"
                >
                  + ใส่สัญลักษณ์ [BKK]
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!name.startsWith('[UPC]')) {
                      setName('[UPC] ' + name.replace(/^\[(BKK|UPC)\]\s*/, ''));
                    }
                  }}
                  className="px-2 py-1 text-[10px] font-bold rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-900 border border-blue-500/30 cursor-pointer"
                >
                  + ใส่สัญลักษณ์ [UPC]
                </button>
              </div>
              <input
                type="text"
                placeholder="เช่น [BKK] กรุงเทพฯ (บางแค - ภาษีเจริญ) หรือ [UPC] เชียงใหม่"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="v-input w-full bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">คำอธิบาย</label>
              <input
                type="text"
                placeholder="เช่น โซนที่อยู่อาศัยฝั่งเหนือ"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="v-input w-full bg-white"
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
                  className="v-input w-full bg-white"
                />
              </div>
              <button type="submit" className={`${editingZoneId ? 'bg-amber-500 hover:bg-amber-600 text-slate-900' : 'v-btn-primary'} h-9 text-xs px-4 font-bold rounded-lg transition cursor-pointer`}>
                {editingZoneId ? 'บันทึกแก้ไข' : 'บันทึกสร้าง'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Import File Preview */}
      {importPreview && (
        <div className="v-panel p-5 bg-blue-50/50 border-blue-200 space-y-3 rounded-2xl">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2">
            <div className="flex items-center space-x-2 text-blue-800 font-bold text-sm">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span>ตรวจพบข้อมูลโซนใหม่พร้อมนำเข้า {importPreview.length} รายการ</span>
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
        <div className="v-panel p-4 bg-rose-50 border-rose-200 text-rose-800 text-xs rounded-xl">
          <span>⚠️ {importError}</span>
        </div>
      )}

      {/* VIEW MODE 1: ZONE MONITOR CARDS & MONITOR LIST DASHBOARD */}
      {activeViewMode === 'monitor' && (
        <div className="space-y-5">
          {/* Filters, Search, and Sub-View Toggle Control Bar */}
          <div className="v-panel p-4 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="ค้นหารหัสโซน, ชื่อพื้นที่, หรือจังหวัด..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="v-input w-full pl-9 py-2 text-xs bg-white"
              />
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
              {/* Card / List Sub-View Switcher for Zone Monitor */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setMonitorSubView('card')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 ${
                    monitorSubView === 'card'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-transparent'
                  }`}
                  title="แสดงมุมมองการ์ดมอนิเตอร์ (Card Grid)"
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span>🎴 การ์ด (Card)</span>
                </button>
                <button
                  onClick={() => setMonitorSubView('list')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 ${
                    monitorSubView === 'list'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-transparent'
                  }`}
                  title="แสดงมุมมองตารางรายการ (List Table)"
                >
                  <List className="h-4 w-4" />
                  <span>📋 รายการ (List)</span>
                </button>
              </div>

              <span className="flex items-center gap-1 text-slate-400">
                <Filter className="h-3.5 w-3.5" />
                <span>ภูมิภาค:</span>
              </span>
              {(['ALL', 'BKK', 'UPC'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRegionFilter(r)}
                  className={`px-3 py-1 rounded-lg border font-bold text-xs cursor-pointer transition ${
                    regionFilter === r
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {r === 'ALL' ? 'ทุกภูมิภาค' : r === 'BKK' ? '🏙️ BKK' : '🏞️ UPC'}
                </button>
              ))}

              <span className="flex items-center gap-1 text-slate-400 ml-2">สถานะ:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="v-input py-1 px-2.5 text-xs bg-white font-medium"
              >
                <option value="ALL">ทุกสถานะโซน</option>
                <option value="NORMAL">🟢 สถานะปกติ</option>
                <option value="MEDIUM">🟡 มีคิวรอจัดสรร</option>
                <option value="HIGH">🔴 คิวแน่นเกินพิกัด</option>
              </select>
            </div>
          </div>

          {/* SUB-VIEW 1: ZONE CARDS GRID */}
          {monitorSubView === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
              {filteredZones.length === 0 ? (
                <div className="v-panel p-12 text-center text-slate-400 col-span-full border border-dashed border-slate-200">
                  ไม่พบข้อมูลโซนตรงตามเงื่อนไขค้นหา
                </div>
              ) : (
                filteredZones.map((zone) => {
                  const zBookings = getBookingsForZone(zone);
                  const zTechs = getTechniciansForZone(zone);
                  const health = getZoneHealthStatus(zBookings);
                  const pendingCount = zBookings.filter((b) => b.status === 'Pending Dispatch').length;

                  return (
                    <div
                      key={zone.id}
                      onClick={() => {
                        setSelectedDetailZone(zone);
                        setDetailTab('bookings');
                      }}
                      className="v-panel bg-white p-5 border border-slate-200 hover:border-blue-500 rounded-2xl shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                    >
                      {/* Top Status Bar */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs">
                                {zone.code}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {zone.name.includes('[BKK]') ? '🏙️ BKK' : zone.name.includes('[UPC]') ? '🏞️ UPC' : '🗺️ ZONE'}
                              </span>
                            </div>
                            <h3 className="font-extrabold text-slate-800 text-sm mt-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                              {zone.name}
                            </h3>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border shrink-0 ${health.color}`}>
                            {health.label}
                          </span>
                        </div>

                        {/* Queue & Capacity Metrics */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-bold">คิวรวม</span>
                            <strong className="text-sm font-extrabold text-slate-800">{zBookings.length}</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
                            <span className="text-[10px] text-amber-700 block font-bold">รอจัดสรร</span>
                            <strong className="text-sm font-extrabold text-amber-900">{pendingCount}</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                            <span className="text-[10px] text-emerald-700 block font-bold">ทีมช่าง</span>
                            <strong className="text-sm font-extrabold text-emerald-900">{zTechs.length} ทีม</strong>
                          </div>
                        </div>

                        {/* Capacity load bar */}
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                            <span>ภาระงานในโซน (Load Capacity)</span>
                            <span>{Math.min(100, zBookings.length * 20)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 rounded-full ${
                                zBookings.length >= 5 ? 'bg-rose-500' : zBookings.length >= 2 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(10, zBookings.length * 20))}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bottom CTA Button */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-bold group-hover:text-blue-700">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Eye className="h-3.5 w-3.5" />
                          <span>คลิกเพื่อดูรายละเอียดเชิงลึก</span>
                        </span>
                        <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* SUB-VIEW 2: ZONE MONITOR LIST TABLE */}
          {monitorSubView === 'list' && (
            <div className="v-panel overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-xs animate-fadeIn">
              <div className="overflow-x-auto">
                <table className="v-table w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">รหัสโซน (Code)</th>
                      <th className="px-4 py-3.5">ขอบเขตพื้นที่บริการ (Zone Name)</th>
                      <th className="px-4 py-3.5 text-center">สถานะสุขภาพ (Health)</th>
                      <th className="px-4 py-3.5 text-center">คิวรวม / รอจัดสรร / ทีมช่าง</th>
                      <th className="px-4 py-3.5">ภาระงาน (Load Capacity)</th>
                      <th className="px-4 py-3.5">รหัสไปรษณีย์</th>
                      <th className="px-4 py-3.5 text-right">จัดการ (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredZones.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                          ไม่พบข้อมูลโซนตรงตามเงื่อนไขค้นหา
                        </td>
                      </tr>
                    ) : (
                      filteredZones.map((zone) => {
                        const zBookings = getBookingsForZone(zone);
                        const zTechs = getTechniciansForZone(zone);
                        const health = getZoneHealthStatus(zBookings);
                        const pendingCount = zBookings.filter((b) => b.status === 'Pending Dispatch').length;

                        return (
                          <tr key={zone.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Code */}
                            <td className="px-4 py-3">
                              <span className="font-mono font-black text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded text-xs">
                                {zone.code}
                              </span>
                            </td>

                            {/* Zone Name */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                  {zone.name.includes('[BKK]') ? '🏙️ BKK' : zone.name.includes('[UPC]') ? '🏞️ UPC' : '🗺️ ZONE'}
                                </span>
                                <strong className="text-slate-800 text-xs">{zone.name}</strong>
                              </div>
                              {zone.description && (
                                <span className="text-[10px] text-slate-400 block line-clamp-1">{zone.description}</span>
                              )}
                            </td>

                            {/* Health Badge */}
                            <td className="px-4 py-3 text-center">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${health.color}`}>
                                {health.label}
                              </span>
                            </td>

                            {/* Metrics */}
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center space-x-2 text-[11px]">
                                <span className="font-bold text-slate-800">คิวรวม {zBookings.length}</span>
                                <span className="text-slate-300">|</span>
                                <span className="font-bold text-amber-700">รอจัดสรร {pendingCount}</span>
                                <span className="text-slate-300">|</span>
                                <span className="font-bold text-emerald-700">ช่าง {zTechs.length} ทีม</span>
                              </div>
                            </td>

                            {/* Capacity Load Progress Bar */}
                            <td className="px-4 py-3 w-40">
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                                  <span>Load</span>
                                  <span>{Math.min(100, zBookings.length * 20)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      zBookings.length >= 5 ? 'bg-rose-500' : zBookings.length >= 2 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(10, zBookings.length * 20))}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Zip Codes */}
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {zone.coverageZipcodes.length === 0 ? (
                                  <span className="text-slate-400 italic text-[10px]">ไม่จำกัด</span>
                                ) : (
                                  zone.coverageZipcodes.slice(0, 3).map((zip) => (
                                    <span key={zip} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">
                                      {zip}
                                    </span>
                                  ))
                                )}
                                {zone.coverageZipcodes.length > 3 && (
                                  <span className="text-[9px] text-slate-400 font-bold">+{zone.coverageZipcodes.length - 3}</span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => {
                                    setSelectedDetailZone(zone);
                                    setDetailTab('bookings');
                                  }}
                                  className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>ดูรายละเอียด</span>
                                </button>

                                <button
                                  onClick={() => handleStartEdit(zone)}
                                  title="แก้ไขโซน"
                                  className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-amber-50 cursor-pointer"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`คุณต้องการลบโซนพื้นที่ ${zone.name} หรือไม่?`)) {
                                      onDeleteZone(zone.id);
                                    }
                                  }}
                                  title="ลบโซน"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
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
          )}
        </div>
      )}

      {/* VIEW MODE 2: ZONE MASTER DIRECTORY & IMPORT */}
      {activeViewMode === 'master' && (
        <div className="space-y-6">
          {/* Main Zone Directory Table */}
          <div className="v-panel overflow-hidden bg-white border border-slate-200 rounded-2xl">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="ค้นหารหัสโซน, ชื่อพื้นที่, หรือคำอธิบาย..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="v-input w-full pl-9 py-2 text-xs"
                />
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center space-x-1 cursor-pointer"
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
                  <th className="px-6 py-3 text-right">จัดการ (Actions)</th>
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
                            <span className="text-slate-400 italic text-[11px]">ไม่จำกัดรหัสไปรษณีย์</span>
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
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedDetailZone(zone);
                              setDetailTab('bookings');
                            }}
                            title="ดูมอนิเตอร์เชิงลึก"
                            className="text-slate-400 hover:text-blue-600 transition-colors p-1.5 rounded hover:bg-blue-50 cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleStartEdit(zone)}
                            title="แก้ไขข้อมูลโซน"
                            className="text-slate-400 hover:text-amber-600 transition-colors p-1.5 rounded hover:bg-amber-50 cursor-pointer"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`คุณต้องการลบโซนพื้นที่ ${zone.name} หรือไม่?`)) {
                                onDeleteZone(zone.id);
                              }
                            }}
                            title="ลบโซนบริการ"
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
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

      {/* ZONE DETAIL DRILL-DOWN MODAL */}
      {selectedDetailZone && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-slate-900/60 animate-fadeIn">
          <div className="v-panel p-6 bg-white w-full max-w-4xl border border-slate-200 rounded-2xl shadow-2xl space-y-4 text-xs max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-mono font-black flex items-center justify-center text-sm shadow-md">
                  {selectedDetailZone.code}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {selectedDetailZone.name}
                    </h3>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      getZoneHealthStatus(getBookingsForZone(selectedDetailZone)).color
                    }`}>
                      {getZoneHealthStatus(getBookingsForZone(selectedDetailZone)).label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {selectedDetailZone.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailZone(null)}
                className="text-slate-400 hover:text-slate-600 text-sm border-0 bg-transparent font-bold cursor-pointer p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick KPI Bar inside Modal */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-[10px] text-amber-700 font-bold uppercase block">คิวงานรวมในโซนนี้</span>
                <strong className="text-base font-extrabold text-amber-900">
                  {getBookingsForZone(selectedDetailZone).length} คิว
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                <span className="text-[10px] text-blue-700 font-bold uppercase block">รอจัดสรรให้ช่าง</span>
                <strong className="text-base font-extrabold text-blue-900">
                  {getBookingsForZone(selectedDetailZone).filter((b) => b.status === 'Pending Dispatch').length} คิว
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-[10px] text-emerald-700 font-bold uppercase block">ทีมช่างพร้อมปฏิบัติงาน</span>
                <strong className="text-base font-extrabold text-emerald-900">
                  {getTechniciansForZone(selectedDetailZone).length} ทีม
                </strong>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-200 shrink-0">
              <button
                onClick={() => setDetailTab('bookings')}
                className={`py-2 px-4 text-xs font-bold border-b-2 cursor-pointer transition ${
                  detailTab === 'bookings'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                🎫 รายการคิวงานจองติดตั้ง ({getBookingsForZone(selectedDetailZone).length})
              </button>
              <button
                onClick={() => setDetailTab('techs')}
                className={`py-2 px-4 text-xs font-bold border-b-2 cursor-pointer transition ${
                  detailTab === 'techs'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                👷 รายชื่อทีมช่างในโซน ({getTechniciansForZone(selectedDetailZone).length})
              </button>
              <button
                onClick={() => setDetailTab('info')}
                className={`py-2 px-4 text-xs font-bold border-b-2 cursor-pointer transition ${
                  detailTab === 'info'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                📍 พื้นที่และรหัสไปรษณีย์ครอบคลุม
              </button>
            </div>

            {/* Tab 1: Bookings List in Zone */}
            {detailTab === 'bookings' && (
              <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1">
                {getBookingsForZone(selectedDetailZone).length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                    ยังไม่มีคิวงานจองติดตั้งในโซนนี้
                  </div>
                ) : (
                  getBookingsForZone(selectedDetailZone).map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-xs transition space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                            {b.bookingRef}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">{b.customerName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({b.customerPhone})</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-white shadow-2xs">
                          {b.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400 block font-semibold">งานบริการ:</span>
                          <strong className="text-slate-800">{b.installationTypeName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-semibold">วันนัดหมาย & เวลา:</span>
                          <strong className="text-slate-800">{b.bookingDate} ({b.timeSlot})</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-semibold">ช่างที่รับงาน:</span>
                          <strong className="text-blue-700">{b.assignedTechTeamName || 'ยังไม่มอบหมาย'}</strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px]">
                        <span className="text-slate-500 truncate max-w-md">📍 {b.addressZone}</span>
                        {b.status === 'Pending Dispatch' && onDispatchToKanna && (
                          <button
                            onClick={() => onDispatchToKanna(b.id)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="h-3 w-3" />
                            <span>ส่งงานต่อระบบ KANNA</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 2: Technicians in Zone */}
            {detailTab === 'techs' && (
              <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1">
                {getTechniciansForZone(selectedDetailZone).length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                    ไม่พบทีมช่างที่ลงทะเบียนในโซนนี้
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {getTechniciansForZone(selectedDetailZone).map((t) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={t.avatar}
                            alt={t.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <strong className="block text-slate-800 text-xs">{t.name}</strong>
                            <span className="text-[10px] text-slate-400 block">โซนหลัก: {t.primaryZone || 'ไม่ระบุ'} • 📞 {t.phone}</span>
                            <div className="flex gap-1 mt-1">
                              <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-1.5 py-0.2 rounded border border-blue-200">
                                Tier: {t.tier}
                              </span>
                              <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                                Status: {t.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Coverage Zipcodes & Info */}
            {detailTab === 'info' && (
              <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-1">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs">📍 รหัสไปรษณีย์ที่ครอบคลุมในโซนนี้ ({selectedDetailZone.code}):</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDetailZone.coverageZipcodes.length === 0 ? (
                      <span className="text-slate-500 italic">ไม่จำกัดรหัสไปรษณีย์ (ครอบคลุมทั้งเขตพื้นที่)</span>
                    ) : (
                      selectedDetailZone.coverageZipcodes.map((zip) => (
                        <span key={zip} className="px-2.5 py-1 rounded-lg bg-white font-mono text-slate-700 font-bold border border-slate-200 shadow-2xs text-xs">
                          📮 {zip}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2">
                  <h4 className="font-bold text-blue-900 text-xs">🗺️ ตรวจสอบแผนที่ GIS และอาณาเขตโซนบริการ</h4>
                  <p className="text-[11px] text-slate-600">
                    คุณสามารถตรวจสอบขอบเขตพิกัดการให้บริการผ่านแผนที่ GIS เพื่อยืนยันขอบเขตของ {selectedDetailZone.name}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedDetailZone.name + ' Thailand')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline pt-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>เปิดดูแผนที่สถานที่จริงบน Google Maps ↗</span>
                  </a>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedDetailZone(null)}
                className="v-btn-secondary py-1.5 px-4 cursor-pointer text-xs"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
