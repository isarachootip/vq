import React, { useState } from 'react';
import type { PortalBanner } from '../types';
import { 
  Image as ImageIcon, 
  PlusCircle, 
  Trash2, 
  Edit2, 
  Eye, 
  Check, 
  X
} from 'lucide-react';

interface BannerManagerViewProps {
  banners: PortalBanner[];
  onAddBanner: (banner: PortalBanner) => void;
  onUpdateBanner: (banner: PortalBanner) => void;
  onDeleteBanner: (id: string) => void;
}

const PRESET_BANNER_IMAGES = [
  {
    name: 'โปรโมชั่นติดตั้งพื้นไม้ SPC (Shera)',
    url: 'https://storage.googleapis.com/prod-qchang-v1/coupon/upload/20260720/20260720182034Banner%20-%20Shera%20SPC%2021-31%20Jul26-Web%20900x900.png'
  },
  {
    name: 'โปรโมชั่นทำความสะอาดแอร์ฆ่าเชื้อโรค',
    url: 'https://storage.googleapis.com/prod-qchang-v1/coupon/upload/20260615/20260615112030Banner_AirCon_Cleaning.png'
  },
  {
    name: 'แคมเปญติดตั้งครัวบิลต์อิน Master Kitchen',
    url: 'https://storage.googleapis.com/prod-qchang-v1/coupon/upload/20260510/20260510103040Banner_Kitchen_BuiltIn.png'
  }
];

export const BannerManagerView: React.FC<BannerManagerViewProps> = ({
  banners,
  onAddBanner,
  onUpdateBanner,
  onDeleteBanner
}) => {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>(PRESET_BANNER_IMAGES[0].url);
  const [description, setDescription] = useState<string>('');
  const [campaignTag, setCampaignTag] = useState<string>('Campaign');
  const [isActive, setIsActive] = useState<boolean>(true);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim() || !description.trim()) return;

    const newBanner: PortalBanner = {
      id: `banner-${Date.now()}`,
      imageUrl,
      title,
      description,
      campaignTag,
      isActive
    };

    onAddBanner(newBanner);
    resetForm();
  };

  const handleStartEdit = (banner: PortalBanner) => {
    setEditingBannerId(banner.id);
    setTitle(banner.title);
    setImageUrl(banner.imageUrl);
    setDescription(banner.description);
    setCampaignTag(banner.campaignTag);
    setIsActive(banner.isActive);
    setShowAddForm(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBannerId || !title.trim() || !imageUrl.trim() || !description.trim()) return;

    const updated: PortalBanner = {
      id: editingBannerId,
      imageUrl,
      title,
      description,
      campaignTag,
      isActive
    };

    onUpdateBanner(updated);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setImageUrl(PRESET_BANNER_IMAGES[0].url);
    setDescription('');
    setCampaignTag('Campaign');
    setIsActive(true);
    setEditingBannerId(null);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Control Panel */}
      <div className="v-panel p-5 bg-white border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ImageIcon className="h-6 w-6 text-blue-600 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-800">ตัวจัดการแบนเนอร์ประชาสัมพันธ์ (Banner Manager)</h2>
          </div>
          <p className="text-xs text-slate-500">
            ปรับแต่งแบนเนอร์โฆษณาในหน้าแรกของ Vfixq Portal ให้ดูใหญ่ ชัดเจน ดึงดูดสายตาลูกค้า
          </p>
        </div>

        <button
          onClick={() => {
            if (showAddForm) resetForm();
            else setShowAddForm(true);
          }}
          className="v-btn-primary flex items-center space-x-2 py-2 px-4 text-xs shrink-0 cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          <span>{showAddForm ? 'ปิดตัวนำเข้า' : 'สร้างแบนเนอร์ใหม่'}</span>
        </button>
      </div>

      {/* 2. Banner Preview / Editor Form */}
      {showAddForm && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Form Editor panel */}
          <form 
            onSubmit={editingBannerId ? handleUpdateSubmit : handleCreate} 
            className="v-panel p-5 bg-white border border-slate-200 space-y-4"
          >
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>{editingBannerId ? '✏️ แก้ไขข้อมูลแบนเนอร์' : '✨ สร้างแบนเนอร์ใหม่'}</span>
              <button 
                type="button" 
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-700 font-bold border-0 cursor-pointer text-xs"
              >
                ✕
              </button>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">หัวข้อแบนเนอร์ (Title):</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น โปรโมชั่นติดตั้งพื้นไม้ SPC เกรดพรีเมียม Shera"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="v-input w-full py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">คำบรรยายสั้น (Description):</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น รับสิทธิ์ขยายประกันเพิ่ม 365 วัน ฟรีพ่นโอโซนฆ่าเชื้อโรค"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="v-input w-full py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">แท็กแคมเปญ (Tag):</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น Campaign หรือ Hot Deal"
                    value={campaignTag}
                    onChange={(e) => setCampaignTag(e.target.value)}
                    className="v-input w-full py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">สถานะใช้งาน:</label>
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="accent-amber-500 w-4 h-4"
                      />
                      <span className={isActive ? 'text-emerald-600' : 'text-slate-400'}>
                        {isActive ? 'แสดงผลทันที (Active)' : 'ปิดการแสดงผล (Draft)'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">รูปภาพแบนเนอร์ (อัปโหลดรูปภาพ / หรือกรอก URL):</label>
                
                {/* Image File Uploader */}
                <div className="flex items-center gap-4 p-3 bg-slate-100/50 rounded-xl border border-slate-200 mb-2">
                  <div className="w-16 h-10 rounded bg-slate-200 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center text-slate-400 font-mono text-[9px] relative shadow-inner">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Banner Preview" className="w-full h-full object-cover" />
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
                              setImageUrl(event.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-[10px] text-slate-500 w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-semibold file:bg-amber-500 file:text-slate-900 hover:file:bg-amber-600 file:cursor-pointer"
                    />
                    <p className="text-[8px] text-slate-400">อัปรูปภาพแบนเนอร์ขนาดใหญ่พรีเมียมจากเครื่องคอมพิวเตอร์ของคุณ</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">หรือกรอกลิ้งก์ภาพ URL:</span>
                  <input
                    type="url"
                    placeholder="ใส่ที่อยู่รูปภาพโฆษณา (HTTPS URL)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="v-input w-full py-2 font-mono"
                  />
                </div>
                
                {/* Preset Recommendations */}
                <div className="mt-2.5 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">หรือเลือกรูปตัวอย่างแนะนำ:</span>
                  <div className="flex flex-col gap-1">
                    {PRESET_BANNER_IMAGES.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className="text-left text-[10px] text-blue-600 hover:text-blue-800 truncate border-0 cursor-pointer block p-1 rounded hover:bg-slate-50 font-semibold bg-transparent"
                      >
                        🔗 {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 text-xs">
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
                {editingBannerId ? 'บันทึกการแก้ไข' : 'สร้างแบนเนอร์'}
              </button>
            </div>
          </form>

          {/* Live Preview Panel */}
          <div className="v-panel p-5 bg-white border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center gap-1">
              <Eye className="h-4 w-4 text-slate-400" />
              <span>ตัวอย่างการแสดงผลหน้าร้านค้าจริง (Bigger Panorama Banner Preview)</span>
            </h3>

            {/* Giant panorama banner preview */}
            <div className="v-panel p-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
              <div className="relative rounded-xl overflow-hidden bg-slate-950 h-56 sm:h-64 flex flex-col justify-end">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="absolute inset-0 w-full h-full object-cover brightness-90 animate-fadeIn"
                    onError={(e) => {
                      // Fallback if URL is broken
                      e.currentTarget.src = 'https://storage.googleapis.com/prod-qchang-v1/coupon/upload/20260720/20260720182034Banner%20-%20Shera%20SPC%2021-31%20Jul26-Web%20900x900.png';
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-mono text-xs">
                    [ ไม่มีรูปภาพแสดงผล ]
                  </div>
                )}
                
                {/* Overlay Text Details */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex flex-col justify-end p-5 z-10">
                  <div className="bg-amber-500 text-slate-900 font-bold px-2 py-0.5 text-[9px] w-fit rounded uppercase tracking-wider mb-1.5 shadow-sm">
                    {campaignTag || 'Campaign'}
                  </div>
                  <h3 className="text-sm sm:text-lg font-extrabold text-white leading-tight">
                    {title || 'หัวข้อแบนเนอร์ประชาสัมพันธ์'}
                  </h3>
                  <p className="text-[10px] text-slate-300 mt-1 max-w-md line-clamp-2">
                    {description || 'คำบรรยายสั้นโปรโมชั่นติดตั้งสินค้า'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-700 text-[10px] leading-relaxed">
              👉 ขนาดแบนเนอร์ได้รับการปรับสัดส่วนใหม่ให้ **มีความสูง (Height: 320px) และมุมมองแบบกว้างขยายเต็มขอบจอ (Wide Panorama View)** เพื่อให้เห็นภาพสินค้า โลโก้ และเนื้อความข้อความโปรโมชั่นได้ใหญ่ คมชัด และสะดุดตา
            </div>
          </div>
        </div>
      )}

      {/* 3. Banners List Directory */}
      <div className="space-y-4 text-xs">
        <h3 className="font-bold text-slate-800 text-sm">🗂️ รายการแบนเนอร์ในระบบทั้งหมด ({banners.length} รายการ)</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {banners.map((banner) => (
            <div 
              key={banner.id} 
              className={`v-panel overflow-hidden border bg-white flex flex-col justify-between hover:shadow-md transition-all ${
                banner.isActive ? 'border-amber-500/30 ring-1 ring-amber-500/15' : 'border-slate-200 opacity-70'
              }`}
            >
              {/* Card Image Header */}
              <div className="relative h-32 overflow-hidden bg-slate-900 border-b border-slate-100">
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title} 
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-950/80 text-slate-300 border border-slate-800">
                  {banner.campaignTag}
                </span>

                {/* Active Indicator Status */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border ${
                    banner.isActive 
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-600' 
                      : 'bg-slate-500/20 border-slate-500/30 text-slate-500'
                  }`}>
                    {banner.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </span>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-4 space-y-1.5 flex-1">
                <h4 className="font-bold text-slate-800 truncate">{banner.title}</h4>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{banner.description}</p>
              </div>

              {/* Action Buttons row */}
              <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                {/* Toggle Active status */}
                <button
                  onClick={() => onUpdateBanner({ ...banner, isActive: !banner.isActive })}
                  className={`flex items-center gap-1 py-1 px-2.5 rounded font-bold border transition cursor-pointer ${
                    banner.isActive 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 hover:bg-amber-500/20' 
                      : 'bg-slate-200 border-slate-300 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {banner.isActive ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                  <span>{banner.isActive ? 'ปิดการแสดง' : 'เปิดการแสดง'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStartEdit(banner)}
                    title="แก้ไขแบนเนอร์"
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer border-0"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteBanner(banner.id)}
                    title="ลบแบนเนอร์"
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition cursor-pointer border-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
