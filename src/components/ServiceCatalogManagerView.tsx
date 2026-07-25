import React, { useState } from 'react';
import type { ServiceItem } from '../types';
import { 
  Briefcase, 
  PlusCircle, 
  Trash2, 
  Edit2, 
  Eye, 
} from 'lucide-react';

interface ServiceCatalogManagerViewProps {
  services: ServiceItem[];
  onAddService: (service: ServiceItem) => void;
  onUpdateService: (service: ServiceItem) => void;
  onDeleteService: (id: string) => void;
}

const CATEGORY_PRESETS = [
  'ทำความสะอาด',
  'งานหลังคาและดาดฟ้า',
  'ระบบปรับอากาศ',
  'งานรีโนเวทและต่อเติม',
  'งานไฟฟ้าและเครื่องใช้ไฟฟ้า',
  'เฟอร์นิเจอร์ Fit-In',
  'พื้น ผนัง และฝ้าเพดาน',
  'โรงรถและกันสาด',
  'ประตูและหน้าต่าง',
  'งานภายนอกบ้าน',
  'เครื่องซักผ้า',
  'ห้องน้ำและประปา',
  'Smart living',
  'รถยนต์',
  'อื่น ๆ'
];

const PRESET_SERVICE_IMAGES = [
  { name: 'เครื่องปรับอากาศ (AC)', url: '/ac_service.jpg' },
  { name: 'ชุดครัวและบิลต์อิน (Kitchen)', url: '/kitchen_service.jpg' },
  { name: 'งานพื้นไม้และเซรามิก (Flooring)', url: '/flooring_service.jpg' }
];

export const ServiceCatalogManagerView: React.FC<ServiceCatalogManagerViewProps> = ({
  services,
  onAddService,
  onUpdateService,
  onDeleteService
}) => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>(CATEGORY_PRESETS[0]);
  const [priceText, setPriceText] = useState<string>('เริ่มต้น 3,500 บาท');
  const [priceNumber, setPriceNumber] = useState<number>(3500);
  const [image, setImage] = useState<string>(PRESET_SERVICE_IMAGES[0].url);
  const [description, setDescription] = useState<string>('');
  const [requiredSkillLevel, setRequiredSkillLevel] = useState<1 | 2 | 3>(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    if (editingId) {
      const updated: ServiceItem = {
        id: editingId,
        name,
        category,
        priceText,
        priceNumber,
        image,
        description,
        requiredSkillLevel
      };
      onUpdateService(updated);
    } else {
      const newService: ServiceItem = {
        id: `service-${Date.now()}`,
        name,
        category,
        priceText,
        priceNumber,
        image,
        description,
        requiredSkillLevel
      };
      onAddService(newService);
    }

    resetForm();
  };

  const handleStartEdit = (service: ServiceItem) => {
    setEditingId(service.id);
    setName(service.name);
    setCategory(service.category);
    setPriceText(service.priceText);
    setPriceNumber(service.priceNumber);
    setImage(service.image);
    setDescription(service.description);
    setRequiredSkillLevel(service.requiredSkillLevel);
    setShowForm(true);
  };

  const resetForm = () => {
    setName('');
    setCategory(CATEGORY_PRESETS[0]);
    setPriceText('เริ่มต้น 3,500 บาท');
    setPriceNumber(3500);
    setImage(PRESET_SERVICE_IMAGES[0].url);
    setDescription('');
    setRequiredSkillLevel(2);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Control Panel */}
      <div className="v-panel p-5 bg-white border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-6 w-6 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-800">จัดการข้อมูลบริการงานติดตั้ง (Service Catalog Manager)</h2>
          </div>
          <p className="text-xs text-slate-500">
            สร้าง แก้ไข ลบแพ็กเกจบริการติดตั้ง และระบุรูปภาพประกอบรวมถึงทักษะฝีมือช่างที่จำเป็น
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }}
          className="v-btn-primary flex items-center space-x-2 py-2 px-4 text-xs shrink-0 cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          <span>{showForm ? 'ปิดแบบฟอร์ม' : 'เพิ่มบริการใหม่'}</span>
        </button>
      </div>

      {/* 2. CRUD Form */}
      {showForm && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          
          <form onSubmit={handleSubmit} className="v-panel p-5 bg-white border border-slate-200 space-y-4 text-xs">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>{editingId ? '✏️ แก้ไขข้อมูลบริการ' : '✨ เพิ่มบริการงานติดตั้งใหม่'}</span>
              <button 
                type="button" 
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-700 font-bold border-0 bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-600 mb-1">ชื่อบริการติดตั้ง:</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น บริการติดตั้งเครื่องปรับอากาศ Wall Type"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="v-input w-full py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">หมวดหมู่บริการ:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="v-input w-full py-2"
                  >
                    {CATEGORY_PRESETS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">ระดับฝีมือช่างขั้นต่ำ (Skill Level):</label>
                  <select
                    value={requiredSkillLevel}
                    onChange={(e) => setRequiredSkillLevel(Number(e.target.value) as 1 | 2 | 3)}
                    className="v-input w-full py-2 font-bold"
                  >
                    <option value={1}>Level 1: Basic (ช่างทั่วไป)</option>
                    <option value={2}>Level 2: Advanced (ช่างชำนาญการ)</option>
                    <option value={3}>Level 3: Master (ผู้เชี่ยวชาญพิเศษ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">ข้อความแสดงราคา (Price text):</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น เริ่มต้น 3,500 บาท"
                    value={priceText}
                    onChange={(e) => setPriceText(e.target.value)}
                    className="v-input w-full py-2"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">ราคาตัวเลขคำนวณ (บาท):</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={priceNumber}
                    onChange={(e) => setPriceNumber(Number(e.target.value))}
                    className="v-input w-full py-2 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">รายละเอียดงานติดตั้ง / การรับประกัน:</label>
                <textarea
                  required
                  rows={3}
                  placeholder="อธิบายขั้นตอนงาน ขาแขวน อุปกรณ์แถม หรือประกันผลงานติดตั้ง..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="v-input w-full py-2 leading-relaxed"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">รูปภาพประกอบการติดตั้ง (Image File / URL):</label>
                
                {/* Image File Uploader */}
                <div className="flex items-center gap-4 p-3 bg-slate-100/50 rounded-xl border border-slate-200 mb-2">
                  <div className="w-14 h-14 rounded-lg bg-slate-200 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center text-slate-400 font-mono text-[9px] relative shadow-inner">
                    {image ? (
                      <img src={image} alt="Service preview" className="w-full h-full object-cover" />
                    ) : (
                      <span>ไม่มีรูป</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setImage(event.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-[10px] text-slate-500 w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-semibold file:bg-amber-500 file:text-slate-900 hover:file:bg-amber-600 file:cursor-pointer"
                    />
                    <p className="text-[8px] text-slate-400">อัปรูปถ่ายผลงานจริง หรือเลือกไฟล์ภาพประกอบ</p>
                  </div>
                </div>

                {/* Preset image suggestions */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">หรือใช้รูปภาพมาตรฐานในระบบ:</span>
                  <div className="flex gap-2">
                    {PRESET_SERVICE_IMAGES.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setImage(preset.url)}
                        className={`py-1 px-2.5 rounded text-[10px] border cursor-pointer font-semibold transition ${
                          image === preset.url
                            ? 'bg-amber-500 text-slate-900 border-amber-600'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={resetForm}
                className="v-btn-secondary py-1.5 px-4"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="v-btn-primary py-1.5 px-4"
              >
                {editingId ? 'บันทึกการแก้ไข' : 'สร้างรายการ'}
              </button>
            </div>
          </form>

          {/* Live Preview on Storefront */}
          <div className="v-panel p-5 bg-white border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center gap-1">
              <Eye className="h-4 w-4 text-slate-400" />
              <span>ตัวอย่างการ์ดบริการหน้าร้านจริง (Storefront Card Preview)</span>
            </h3>

            {/* Simulated storefront card */}
            <div className="max-w-xs mx-auto v-panel bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between">
              <div className="relative h-44 overflow-hidden bg-slate-900 border-b border-slate-100">
                {image ? (
                  <img 
                    src={image} 
                    alt={name || 'Service Name'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-[10px] bg-slate-800">
                    [ ไม่มีรูปภาพ ]
                  </div>
                )}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold bg-slate-950/80 text-amber-500 border border-amber-500/20">
                  {category}
                </span>
              </div>

              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs line-clamp-1">{name || 'ชื่อบริการติดตั้งงาน'}</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-normal">{description || 'รายละเอียดขั้นตอนงานติดตั้งพร้อมระยะเวลาประกันคุณภาพ...'}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-2">
                  <div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">ราคาประเมิน</div>
                    <div className="text-[11px] font-black text-amber-500">{priceText}</div>
                  </div>
                  <span className="px-2 py-1 rounded bg-amber-500 text-slate-900 font-bold text-[9px]">
                    จองบริการ
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-800 text-[10px] leading-relaxed">
              👉 **ทิปส์**: เมื่อกดอัปโหลดรูปภาพ ระบบจะแปลงภาพไฟล์เครื่องคอมพิวเตอร์ของท่านให้อยู่ในรูปแบบ Data URL ที่ส่งตรงไปแสดงผลบนหน้าเว็บไซต์ลูกค้าฝั่งหน้าร้านทันทีโดยไม่ต้องผ่าน CDN ภายนอก
            </div>
          </div>
        </div>
      )}

      {/* 3. Services List Grid */}
      <div className="space-y-4 text-xs">
        <h3 className="font-bold text-slate-800 text-sm">🗂️ รายการบริการงานติดตั้งทั้งหมดในระบบ ({services.length} รายการ)</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service) => (
            <div 
              key={service.id}
              className="v-panel overflow-hidden bg-white border border-slate-200 flex flex-col justify-between hover:shadow-md transition-all"
            >
              {/* Card Image */}
              <div className="relative h-32 overflow-hidden bg-slate-900 border-b border-slate-100">
                <img 
                  src={service.image} 
                  alt={service.name} 
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-950/80 text-amber-500 border border-amber-500/20">
                  {service.category}
                </span>

                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-600 text-white shadow-sm border border-blue-500/20">
                  Skill Level {service.requiredSkillLevel}
                </span>
              </div>

              {/* Card Details */}
              <div className="p-4 space-y-1.5 flex-1">
                <h4 className="font-bold text-slate-800 truncate">{service.name}</h4>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{service.description}</p>
                <div className="text-[10px] font-black text-amber-600 pt-1">
                  💰 {service.priceText} ({service.priceNumber.toLocaleString()} บาท)
                </div>
              </div>

              {/* Action Buttons row */}
              <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-1.5">
                <button
                  onClick={() => handleStartEdit(service)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer border-0 bg-transparent"
                  title="แก้ไขบริการ"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDeleteService(service.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition cursor-pointer border-0 bg-transparent"
                  title="ลบบริการ"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
