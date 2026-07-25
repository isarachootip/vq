import React, { useState } from 'react';
import type { Branch, QueueBooking } from '../types';
import { SERVICE_ZONES } from '../mockData';
import { 
  ShoppingBag, 
  Search, 
  MapPin, 
  Calendar, 
  User, 
  Phone, 
  Check, 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Sparkles
} from 'lucide-react';

interface VfixqPortalViewProps {
  branches: Branch[];
  onConfirmBooking: (newBooking: QueueBooking) => void;
  onNavigateToTab: (tabId: string) => void;
}

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  priceText: string;
  priceNumber: number;
  image: string;
  description: string;
  requiredSkillLevel: 1 | 2 | 3;
}

export const VfixqPortalView: React.FC<VfixqPortalViewProps> = ({
  branches,
  onConfirmBooking,
  onNavigateToTab
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  
  // Wizard States
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา - ประเวศ)');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTimeSlot, setBookingTimeSlot] = useState<string>('09:00 - 12:00 (Morning)');
  const [addonOzone, setAddonOzone] = useState<boolean>(false);
  const [addonWarranty, setAddonWarranty] = useState<boolean>(false);
  const [branchSearchQuery, setBranchSearchQuery] = useState<string>('');
  const [createdBookingRef, setCreatedBookingRef] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Info Modal Drawers
  const [infoModalTab, setInfoModalTab] = useState<'how-to-buy' | 'payment' | 'terms' | null>(null);

  // Home Service Packages Config (Fits the category structure)
  const services: ServiceItem[] = [
    {
      id: 'inst-aircon-multi',
      name: 'บริการติดตั้งเครื่องปรับอากาศ Multi-Split (3 เครื่อง)',
      category: 'ระบบปรับอากาศ',
      priceText: 'เริ่มต้น 3,500 บาท',
      priceNumber: 3500,
      image: '/ac_service.jpg',
      description: 'บริการเดินท่อน้ำยาคอมเพรสเซอร์ แขวนคอยล์เย็น ติดตั้งขาแขวนแอร์ภายนอก และเทสแรงดันระบบน้ำยาแอร์ R32 ประกันการทำงาน 180 วัน',
      requiredSkillLevel: 3
    },
    {
      id: 'inst-built-kitchen',
      name: 'บริการติดตั้งชุดครัว Built-in Master (ชุดใหญ่)',
      category: 'เฟอร์นิเจอร์ Fit-In',
      priceText: 'เริ่มต้น 12,000 บาท',
      priceNumber: 12000,
      image: '/kitchen_service.jpg',
      description: 'ประกอบตู้ลอยและตู้ตั้งพื้น Built-in, ติดตั้งหินแกรนิตท็อปครัว, ต่อช่องดูดควันเจาะหน้ากากระบาย และจัดบานพับ Soft-close ตั้งองศาระดับสูงสุด',
      requiredSkillLevel: 3
    },
    {
      id: 'inst-built-closet',
      name: 'บริการติดตั้งตู้เสื้อผ้า Walk-in Closet',
      category: 'เฟอร์นิเจอร์ Fit-In',
      priceText: 'เริ่มต้น 4,500 บาท',
      priceNumber: 4500,
      image: '/kitchen_service.jpg',
      description: 'ประกอบตู้เสื้อโครงสร้างอะลูมิเนียม หน้ากระจกเทมเปอร์ แขวนรางเลื่อน และซ่อนระบบไฟ LED หรูหราส่องสว่างใต้ชั้นวาง',
      requiredSkillLevel: 2
    },
    {
      id: 'inst-flooring-laminate',
      name: 'บริการปูพื้นไม้สำเร็จรูป SPC (เกรดนำเข้า)',
      category: 'พื้น ผนัง และฝ้าเพดาน',
      priceText: 'เริ่มต้น 450 บาท / ตร.ม.',
      priceNumber: 450,
      image: '/flooring_service.jpg',
      description: 'ปรับระดับหน้าดิน/ปูนเดิม รองแผ่นโฟมหนากันความชื้น ติดตั้งแผ่นพื้น SPC แบรนด์นำเข้า ล็อกแน่นสนิท ทนน้ำและรอยขีดข่วน 100%',
      requiredSkillLevel: 2
    },
    {
      id: 'inst-smart-home',
      name: 'บริการติดตั้งระบบ Smart Home & Digital Lock',
      category: 'Smart living',
      priceText: 'เริ่มต้น 1,800 บาท',
      priceNumber: 1800,
      image: '/ac_service.jpg',
      description: 'ติดตั้งระบบล็อกประตูดิจิทัล (Digital Door Lock) บนประตูชนิดไม้หรือโลหะ เซ็ตระบบ Wi-Fi และเชื่อมเกตเวย์ผ่านสมาร์ทโฟน',
      requiredSkillLevel: 2
    },
    {
      id: 'inst-curtains-motor',
      name: 'บริการติดตั้งผ้าม่านมอเตอร์ไฟฟ้า + วอลเปเปอร์',
      category: 'อื่น ๆ',
      priceText: 'เริ่มต้น 3,200 บาท',
      priceNumber: 3200,
      image: '/flooring_service.jpg',
      description: 'ติดตั้งผ้าม่านพับ/ผ้าม่านรางมอเตอร์ เชื่อมต่อ Smart Home สั่งงานด้วยเสียง พร้อมปูวอลเปเปอร์กาวในตัวเกรดพรีเมียม',
      requiredSkillLevel: 1
    }
  ];

  const categoriesGrid = [
    { name: 'ทำความสะอาด', icon: '🧹' },
    { name: 'งานหลังคาและดาดฟ้า', icon: '🏠' },
    { name: 'ระบบปรับอากาศ', icon: '❄️' },
    { name: 'งานรีโนเวทและต่อเติม', icon: '🔨' },
    { name: 'งานไฟฟ้าและเครื่องใช้ไฟฟ้า', icon: '💡' },
    { name: 'เฟอร์นิเจอร์ Fit-In', icon: '🪑' },
    { name: 'พื้น ผนัง และฝ้าเพดาน', icon: '🧱' },
    { name: 'โรงรถและกันสาด', icon: '🚗' },
    { name: 'ประตูและหน้าต่าง', icon: '🚪' },
    { name: 'งานภายนอกบ้าน', icon: '🌳' },
    { name: 'เครื่องซักผ้า', icon: '🧺' },
    { name: 'ห้องน้ำและประปา', icon: '🚿' },
    { name: 'Smart living', icon: '📱' },
    { name: 'รถยนต์', icon: '🚙' },
    { name: 'อื่น ๆ', icon: '➕' }
  ];

  // Quick categories (Unique glowing capsules design)
  const quickCats = [
    { label: '🧹 บริการทำความสะอาด', category: 'ทำความสะอาด' },
    { label: '❄️ บริการปรับอากาศ', category: 'ระบบปรับอากาศ' },
    { label: '🪑 งานบิลต์อินเฟอร์นิเจอร์', category: 'เฟอร์นิเจอร์ Fit-In' },
    { label: '🧱 งานวัสดุปูพื้นผนัง', category: 'พื้น ผนัง และฝ้าเพดาน' }
  ];

  const filteredServices = services.filter(service => {
    const matchesCategory = activeCategory === 'ทั้งหมด' || service.category === activeCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredBranches = branches.filter(branch => 
    branch.name.toLowerCase().includes(branchSearchQuery.toLowerCase()) ||
    (branch.fullName && branch.fullName.toLowerCase().includes(branchSearchQuery.toLowerCase()))
  ).slice(0, 5);

  const basePrice = selectedService ? selectedService.priceNumber : 0;
  const addonOzonePrice = addonOzone ? 350 : 0;
  const addonWarrantyPrice = addonWarranty ? 500 : 0;
  const totalPrice = basePrice + addonOzonePrice + addonWarrantyPrice;

  const handleOpenWizard = (service: ServiceItem) => {
    setSelectedService(service);
    setWizardStep(1);
    setAddonOzone(false);
    setAddonWarranty(false);
    if (branches.length > 0) {
      setSelectedBranchId(branches[0].id);
    }
  };

  const handleCheckoutSubmit = () => {
    if (!selectedService || !customerName || !customerPhone || !bookingDate) return;

    const randNum = Math.floor(1000 + Math.random() * 9000);
    const bookingRef = `BK-V-${randNum}`;
    setCreatedBookingRef(bookingRef);

    const newBooking: QueueBooking = {
      id: `bk-${Date.now()}`,
      bookingRef,
      customerName,
      customerPhone,
      addressZone: selectedZone,
      installationTypeId: selectedService.id,
      installationTypeName: selectedService.name,
      requiredSkillLevel: selectedService.requiredSkillLevel,
      bookingDate,
      timeSlot: bookingTimeSlot,
      status: 'Pending Dispatch',
      createdFrom: 'Vfixq Portal',
      createdAt: new Date().toISOString(),
      branchId: selectedBranchId
    };

    onConfirmBooking(newBooking);
    setIsSuccess(true);
  };

  const handleReset = () => {
    setSelectedService(null);
    setCustomerName('');
    setCustomerPhone('');
    setBookingDate('');
    setIsSuccess(false);
    setWizardStep(1);
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* 1. CUSTOM STICKY PORTAL HEADER */}
      <header className="v-panel p-4 bg-white flex items-center justify-between border border-slate-200">
        <div className="flex items-center space-x-2.5">
          <div className="bg-amber-500 text-slate-900 font-black px-2.5 py-1 rounded-md text-sm md:text-base tracking-widest shadow-md flex items-center gap-1.5 animate-pulse">
            <ShoppingBag className="h-4.5 w-4.5 stroke-[2.5]" />
            <span>vService Portal</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest hidden sm:inline">| Vfixq Engine</span>
        </div>

        <div className="relative max-w-xs flex-1 mx-4">
          <input
            type="text"
            placeholder="ค้นหาบริการติดตั้ง ดูแลบ้าน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="v-input w-full pl-8 py-1.5 text-xs rounded-full border-slate-200 bg-slate-100"
          />
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center space-x-4 text-xs font-bold text-slate-500">
          <span className="hover:text-amber-500 cursor-pointer">🛒 ตะกร้าสินค้า</span>
          <span className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full cursor-pointer">👤 บัญชีช่าง</span>
        </div>
      </header>

      {/* 2. SUCCESS BOOKING PAGE */}
      {isSuccess && selectedService && (
        <div className="v-panel p-8 text-center bg-white space-y-6 max-w-xl mx-auto border-2 border-amber-500/20 shadow-xl animate-fadeIn">
          <div className="mx-auto w-16 h-16 bg-emerald-950/50 rounded-full border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Check className="h-8 w-8 stroke-[3]" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800">จองบริการติดตั้งผ่าน Vfixq Portal สำเร็จ!</h2>
            <p className="text-xs text-slate-500">
              เลขที่ใบงานจองติดตั้งของคุณคือ <span className="font-mono font-bold text-amber-500 text-sm">{createdBookingRef}</span>
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-100 text-left text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-400">บริการที่เลือก:</span>
              <span className="font-semibold text-slate-700">{selectedService.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ผู้สั่งซื้อบริการ:</span>
              <span className="font-semibold text-slate-700">{customerName} ({customerPhone})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">โซนจุดจอง:</span>
              <span className="font-semibold text-slate-700">{selectedZone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">วันเวลานัด:</span>
              <span className="font-semibold text-slate-700">{bookingDate} | {bookingTimeSlot}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-sm">
              <span className="text-slate-800">ราคาสุทธิ:</span>
              <span className="text-amber-500">{totalPrice.toLocaleString()} บาท</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs text-amber-600 flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 animate-pulse" />
            <span className="text-left font-medium leading-relaxed">
              ตั๋วจองบริการนี้ถูกส่งเข้าระบบจัดหาช่างอัตโนมัติแล้ว คุณสามารถเข้าไปตรวจสอบระดับคะแนนช่างได้ทันที
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => {
                handleReset();
                onNavigateToTab('dashboard');
              }}
              className="flex-1 v-btn-secondary"
            >
              ไปหน้าคิวติดตั้ง (Queue)
            </button>
            <button
              onClick={() => {
                handleReset();
                onNavigateToTab('smart-booking');
              }}
              className="flex-1 v-btn-primary"
            >
              คัดเลือกช่างอัจฉริยะ (Match Score)
            </button>
          </div>
        </div>
      )}

      {/* 3. CORE VFIXQ SERVICES CATALOG */}
      {!isSuccess && !selectedService && (
        <div className="space-y-6">
          
          {/* SPC Luxury Frame Banner */}
          <div className="v-panel p-1.5 bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/20 rounded-2xl overflow-hidden border border-amber-500/20">
            <div className="relative rounded-xl overflow-hidden bg-slate-900 max-h-72">
              <img 
                src="https://storage.googleapis.com/prod-qchang-v1/coupon/upload/20260720/20260720182034Banner%20-%20Shera%20SPC%2021-31%20Jul26-Web%20900x900.png" 
                alt="โปรโมชั่น SPC" 
                className="w-full h-full object-cover max-h-60 brightness-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-6">
                <div className="bg-amber-500 text-slate-900 font-bold px-2 py-0.5 text-[10px] w-fit rounded uppercase tracking-wider mb-2">Campaign</div>
                <h3 className="text-lg md:text-xl font-bold text-white leading-tight">โปรโมชั่นติดตั้งพื้นไม้ SPC เกรดพรีเมียม Shera</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-lg hidden sm:block">รับโปรโมชันจองช่างขยายประกันเพิ่ม 365 วัน ฟรีบริการพ่นน้ำยาโอโซนฆ่าเชื้อโรค มูลค่า 350.-</p>
              </div>
            </div>
          </div>

          {/* Quick Categories Bar (Glowing Glassmorphic Capsules) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickCats.map((q) => (
              <button
                key={q.label}
                onClick={() => setActiveCategory(q.category)}
                className={`p-3.5 rounded-xl border text-xs font-bold transition-all duration-300 text-center cursor-pointer flex flex-col items-center justify-center gap-1.5 hover:scale-103 shadow-xs hover:shadow-md ${
                  activeCategory === q.category
                    ? 'bg-blue-600/10 border-blue-600 text-blue-500 font-black shadow-inner shadow-blue-500/5'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                <span>{q.label}</span>
              </button>
            ))}
          </div>

          {/* Categories Grid Selector (15 Categories - styled premium) */}
          <div className="v-panel p-5 bg-white space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              ค้นหาตามหมวดหมู่งานติดตั้งและบริการทั้งหมด (15 Categories)
            </h3>
            
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-3">
              <button
                onClick={() => setActiveCategory('ทั้งหมด')}
                className={`p-2.5 rounded-lg text-center text-xs font-bold transition cursor-pointer border ${
                  activeCategory === 'ทั้งหมด' 
                    ? 'bg-blue-600 text-slate-900 border-blue-600 font-black' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <div>🏡</div>
                <span className="block mt-1 truncate">ทั้งหมด</span>
              </button>

              {categoriesGrid.map((cat) => {
                const isSelected = activeCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`p-2.5 rounded-lg text-center text-xs font-bold transition cursor-pointer border ${
                      isSelected 
                        ? 'bg-blue-600 text-slate-900 border-blue-600 font-black' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    <div className="text-base">{cat.icon}</div>
                    <span className="block mt-1 truncate text-[10px]">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catalog Grid Package Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.length === 0 ? (
              <div className="v-panel p-12 text-center text-slate-400 col-span-full">
                ไม่พบงานบริการที่คุณค้นหาในหมวดหมู่นี้ ลองเลือก "ทั้งหมด" เพื่อค้นหาใหม่
              </div>
            ) : (
              filteredServices.map((service) => (
                <div 
                  key={service.id} 
                  className="v-panel overflow-hidden border border-slate-200 hover:border-blue-600/30 flex flex-col justify-between group transition-all duration-300 shadow-sm hover:shadow-lg bg-white"
                >
                  <div>
                    {/* Catalog Image */}
                    <div className="relative h-40 overflow-hidden bg-slate-900 border-b border-slate-200">
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90 group-hover:brightness-100"
                      />
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950/80 text-slate-300 border border-slate-200">
                        {service.category}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-1.5">
                      <h4 className="font-bold text-slate-800 text-sm leading-snug min-h-[40px] group-hover:text-amber-500 transition-colors">
                        {service.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-200/50 bg-slate-100 flex items-center justify-between mt-auto">
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">ราคาประเมิน</div>
                      <div className="text-sm font-bold text-amber-500">{service.priceText}</div>
                    </div>
                    
                    <button
                      onClick={() => handleOpenWizard(service)}
                      className="v-btn-primary py-1 px-3.5 text-xs font-bold cursor-pointer"
                    >
                      จองคิวบริการ
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Info Quick Links Row (custom themed) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setInfoModalTab('how-to-buy')}
              className="v-panel p-4 bg-white hover:border-amber-500/40 text-center font-bold text-xs text-slate-700 flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <span>🛍️ ขั้นตอนสั่งจองและชาร์จงาน</span>
            </button>
            <button
              onClick={() => setInfoModalTab('payment')}
              className="v-panel p-4 bg-white hover:border-amber-500/40 text-center font-bold text-xs text-slate-700 flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <span>💳 วิธีชำระเงินโอนบิล</span>
            </button>
            <button
              onClick={() => setInfoModalTab('terms')}
              className="v-panel p-4 bg-white hover:border-amber-500/40 text-center font-bold text-xs text-slate-700 flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <span>📋 เงื่อนไขประกันงานช่าง</span>
            </button>
            <button
              onClick={() => onNavigateToTab('km-hub')}
              className="v-panel p-4 bg-white hover:border-amber-500/40 text-center font-bold text-xs text-slate-700 flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <span>❓ เข้าดูคลังความรู้ (KM Hub)</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. MULTI-STEP BOOKING WIZARD MODAL */}
      {selectedService && !isSuccess && (
        <div className="v-panel p-6 bg-white space-y-6 border border-slate-200 max-w-3xl mx-auto shadow-md">
          {/* Header wizard */}
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleReset}
                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">บริการจอง: {selectedService.name}</h3>
                <p className="text-[10px] text-slate-400">กรอกข้อมูลผู้ติดต่อเพื่อจัดคิวติดตั้งอัตโนมัติ</p>
              </div>
            </div>
            
            {/* Step indicators */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    wizardStep === step
                      ? 'bg-blue-600 text-slate-900 font-bold'
                      : wizardStep > step
                      ? 'bg-emerald-600 text-slate-100'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {wizardStep > step ? <Check className="h-3 w-3" /> : step}
                </div>
              ))}
            </div>
          </div>

          {/* STEP 1: Addon options */}
          {wizardStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-2">ขั้นตอนที่ 1: รายการรายละเอียดสินค้าและงานติดตั้ง</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-100 space-y-2 text-xs">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/30 text-amber-500 border border-amber-500/20">Standard Package</span>
                  <h5 className="font-bold text-slate-800 text-xs mt-2">{selectedService.name}</h5>
                  <p className="text-[10px] text-slate-500 leading-normal">{selectedService.description}</p>
                </div>

                <div className="space-y-3">
                  <h5 className="font-bold text-slate-800 text-xs">บริการเสริมพิเศษ (สแกนเลือกเพิ่ม):</h5>
                  
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-100/50 cursor-pointer transition">
                    <input 
                      type="checkbox" 
                      checked={addonOzone} 
                      onChange={(e) => setAddonOzone(e.target.checked)}
                      className="mt-1 accent-amber-500" 
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-[11px]">บริการพ่นน้ำยาอบโอโซนฆ่าเชื้อโรค</div>
                      <p className="text-[9px] text-slate-400 mt-0.5">พ่นสเปรย์ฆ่าเชื้อราและแบคทีเรียกลิ่นอับสะสมในเครื่องปรับอากาศ</p>
                      <span className="text-amber-500 font-bold text-[10px] block mt-1">+350 บาท</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-100/50 cursor-pointer transition">
                    <input 
                      type="checkbox" 
                      checked={addonWarranty} 
                      onChange={(e) => setAddonWarranty(e.target.checked)}
                      className="mt-1 accent-amber-500" 
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-[11px]">ขยายการประกันผลงานติดตั้ง (Vfixq Extended Warranty)</div>
                      <p className="text-[9px] text-slate-400 mt-0.5">ขยายเวลาดูแลท่อรั่วและอาการผิดปกติจาก 180 วัน เป็น 365 วัน</p>
                      <span className="text-amber-500 font-bold text-[10px] block mt-1">+500 บาท</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                  onClick={() => setWizardStep(2)}
                  className="v-btn-primary flex items-center space-x-2 py-1.5 text-xs cursor-pointer"
                >
                  <span>ขั้นตอนถัดไป (ข้อมูลติดต่อ)</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Location & Contacts */}
          {wizardStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-2">ขั้นตอนที่ 2: ที่อยู่ผู้รับบริการและข้อมูลสั่งซื้อสินค้า</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">ชื่อจริงผู้รับบริการ:</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="กรอกชื่อจริงและนามสกุล"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="v-input w-full pl-9 py-2 text-xs"
                      />
                      <User className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">เบอร์โทรศัพท์มือถือ:</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="ระบุเบอร์ติดต่อ 10 หลัก"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="v-input w-full pl-9 py-2 text-xs"
                      />
                      <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">โซนพิกัดจัดเก็บคิวงานติดตั้ง:</label>
                    <div className="relative">
                      <select
                        value={selectedZone}
                        onChange={(e) => setSelectedZone(e.target.value)}
                        className="v-input w-full pl-9 py-2 text-xs"
                      >
                        {SERVICE_ZONES.map((zone) => (
                          <option key={zone} value={zone}>{zone}</option>
                        ))}
                      </select>
                      <MapPin className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-500">เลือกสาขาไทวัสดุ / BnB Home ที่ซื้อสินค้า:</label>
                  <input
                    type="text"
                    placeholder="พิมพ์ชื่อค้นหา (บางนา, ราชพฤกษ์, ปทุมธานี)..."
                    value={branchSearchQuery}
                    onChange={(e) => setBranchSearchQuery(e.target.value)}
                    className="v-input w-full pl-9 py-2 text-xs"
                  />
                  
                  <div className="space-y-1 max-h-36 overflow-y-auto mt-2 border border-slate-200/50 rounded-lg p-2 bg-slate-100/50">
                    {filteredBranches.map((branch) => {
                      const isSelected = selectedBranchId === branch.id;
                      return (
                        <button
                          key={branch.id}
                          type="button"
                          onClick={() => setSelectedBranchId(branch.id)}
                          className={`w-full text-left p-1.5 rounded text-[10px] flex justify-between items-center cursor-pointer transition ${
                            isSelected 
                              ? 'bg-blue-600/10 border border-blue-600/40 text-blue-600 font-bold' 
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span className="truncate">{branch.name} - {branch.fullName || 'ไทวัสดุ'}</span>
                          {isSelected && <Check className="h-3 w-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-200">
                <button
                  onClick={() => setWizardStep(1)}
                  className="v-btn-secondary py-1.5 text-xs cursor-pointer"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={() => setWizardStep(3)}
                  disabled={!customerName || !customerPhone || !selectedBranchId}
                  className="v-btn-primary flex items-center space-x-2 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>ขั้นตอนถัดไป (วันเวลานัด)</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Scheduling */}
          {wizardStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-2">ขั้นตอนที่ 3: เลือกวันและเวลานัดหมายเข้าปฏิบัติงาน</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">ระบุวันที่สะดวกติดตั้ง:</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={bookingDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="v-input w-full pl-9 py-2 text-xs"
                    />
                    <Calendar className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">ระบุช่วงเวลานัดหมายทีมช่าง:</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'morning', label: 'เช้า (09:00 - 12:00 น.)', value: '09:00 - 12:00 (Morning)' },
                      { id: 'afternoon', label: 'บ่าย (13:00 - 17:00 น.)', value: '13:00 - 17:00 (Afternoon)' },
                      { id: 'fullday', label: 'ทั้งวัน (09:00 - 17:00 น.)', value: '09:00 - 17:00 (Full Day)' }
                    ].map((slot) => {
                      const isSelected = bookingTimeSlot === slot.value;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setBookingTimeSlot(slot.value)}
                          className={`w-full text-left p-3.5 rounded-lg border text-[11px] font-bold transition flex justify-between items-center cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-600/10 border-blue-600 text-blue-500' 
                              : 'bg-slate-100 border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <span>{slot.label}</span>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check className="h-2 w-2 text-slate-900 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-200">
                <button
                  onClick={() => setWizardStep(2)}
                  className="v-btn-secondary py-1.5 text-xs cursor-pointer"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={() => setWizardStep(4)}
                  disabled={!bookingDate}
                  className="v-btn-primary flex items-center space-x-2 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>ขั้นตอนถัดไป (ตรวจสอบบิล)</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review Summary & checkout */}
          {wizardStep === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-2">ขั้นตอนที่ 4: สรุปราคารายการสั่งจองและรายละเอียดบิล</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2 space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-100 text-xs space-y-3.5">
                    <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <span>ข้อมูลการติดต่อและจัดส่งงาน</span>
                    </h5>
                    
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <div className="text-[10px] text-slate-400">ลูกค้าผู้ว่าจ้าง:</div>
                        <div className="font-semibold text-slate-700">{customerName}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">เบอร์โทรศัพท์:</div>
                        <div className="font-semibold text-slate-700">{customerPhone}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">โซนที่อยู่จัดเก็บคิว:</div>
                        <div className="font-semibold text-slate-700">{selectedZone}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">สาขาที่ซื้อสินค้า:</div>
                        <div className="font-semibold text-slate-700">
                          {branches.find(b => b.id === selectedBranchId)?.name || 'สาขาหลัก'}
                        </div>
                      </div>
                      <div className="col-span-2 border-t border-slate-200 pt-2.5">
                        <div className="text-[10px] text-slate-400">วันเวลานัดเข้าหน้างาน:</div>
                        <div className="font-bold text-slate-800 text-xs">{bookingDate} | {bookingTimeSlot}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/20 text-[10px] text-blue-600 flex items-start gap-2">
                    <CreditCard className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      *ยอดเงินนี้เป็นยอดจำลองใบเสร็จรับเงินติดตั้ง เมื่อยืนยันระบบจะนำส่งตั๋วคิวเข้าไปประมวลผลจับคู่ตามน้ำหนักคะแนน Match Score ในระบบบริหารคิวช่างหลักทันที
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border-2 border-amber-500/20 bg-slate-100 flex flex-col justify-between">
                  <div className="space-y-3.5 text-xs">
                    <h5 className="font-bold text-slate-800 pb-1.5 border-b border-slate-200">สรุปค่าใช้จ่าย</h5>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-slate-500">
                        <span>ค่าจองติดตั้ง:</span>
                        <span>{basePrice.toLocaleString()} บาท</span>
                      </div>
                      {addonOzone && (
                        <div className="flex justify-between text-slate-500">
                          <span>พ่นอบฆ่าเชื้อโรค:</span>
                          <span>+350 บาท</span>
                        </div>
                      )}
                      {addonWarranty && (
                        <div className="flex justify-between text-slate-500">
                          <span>ขยายประกันภัย:</span>
                          <span>+500 บาท</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3.5 mt-4">
                    <div className="flex justify-between items-baseline mb-4">
                      <span className="text-[10px] text-slate-500 font-bold">ราคารวมทั้งสิ้น:</span>
                      <span className="text-base font-black text-amber-500">{totalPrice.toLocaleString()} บาท</span>
                    </div>

                    <button
                      onClick={handleCheckoutSubmit}
                      className="w-full v-btn-primary py-2 text-xs cursor-pointer"
                    >
                      ยืนยันชำระเงินจำลอง
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-200">
                <button
                  onClick={() => setWizardStep(3)}
                  className="v-btn-secondary py-1.5 text-xs cursor-pointer"
                >
                  ย้อนกลับ
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. INFORMATION LINK MODAL DRAWERS */}
      {infoModalTab && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-200 animate-fadeIn">
          <div className="v-panel p-6 bg-white max-w-lg w-full space-y-4 relative border border-slate-200">
            <button
              onClick={() => setInfoModalTab(null)}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
            >
              ✕
            </button>

            {infoModalTab === 'how-to-buy' && (
              <div className="space-y-3.5">
                <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-amber-500" />
                  <span>ขั้นตอนการสั่งจองและชาร์จงาน</span>
                </h3>
                <ol className="text-xs text-slate-600 space-y-2 list-decimal pl-4 leading-relaxed">
                  <li>เลือกประเภททักษะงานติดตั้งและแพ็กเกจที่ต้องการในหน้าแค็ตล็อกบริการของ Vfixq</li>
                  <li>กรอกชื่อ เบอร์ติดต่อ และสแกนเลือก **สาขาที่ลูกค้าสั่งซื้อสินค้า** เพื่อให้มีคะแนน Branch Sync ในการจัดช่างใกล้เคียง</li>
                  <li>นัดหมายระบุวันเข้าหน้างานและคาบช่วงเวลาที่ท่านสะดวก</li>
                  <li>ยืนยันรายการคำสั่งซื้อจำลองเพื่อให้ตั๋วจองถูกสร้างในระบบคิวงานติดตั้ง vService ของพนักงาน</li>
                </ol>
              </div>
            )}

            {infoModalTab === 'payment' && (
              <div className="space-y-3.5">
                <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-amber-500" />
                  <span>การชำระเงินและโอนบิลค่าจ้างช่าง</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ระบบจำลองนี้เชื่อมต่อการออกใบสั่งจ้างและใบเสร็จจำลองเข้าตารางคิวงานหลังบ้าน (Pending Dispatch) ซึ่งในการดำเนินการจริง ระบบ vService จะหักค่าจ้างผ่านบัญชีธนาคารช่างหลังผ่านการตรวจสอบคุณภาพ (QC Inspector Passed) โดยตรงเพื่อความปลอดภัยของลูกค้าสูงสุด
                </p>
              </div>
            )}

            {infoModalTab === 'terms' && (
              <div className="space-y-3.5">
                <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                  <span>ข้อกำหนดเงื่อนไขการประกันงานช่าง</span>
                </h3>
                <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 leading-relaxed">
                  <li>รับประกันผลงานติดตั้งแอร์รั่ว บิลต์อินหน้าบานเอียง เป็นเวลา **180 วัน** ทันทีหลังปิดงานใน STS</li>
                  <li>หากสแกนเพิ่มบริการเสริม **Extended Care** จะได้รับการคุ้มครองขยายเวลาการซ่อมแซมฟรีถึง **365 วัน**</li>
                  <li>การประกันงานช่างจะไม่คุ้มครองในกรณีที่ลูกค้าดัดแปลงแก้ไข หรือเกิดภัยธรรมชาติหน้างาน</li>
                </ul>
              </div>
            )}

            <button
              onClick={() => setInfoModalTab(null)}
              className="w-full v-btn-secondary py-1.5 text-xs text-center cursor-pointer mt-4"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* 6. VSERVICE OFFICIAL CORPORATE FOOTER (designed clean) */}
      <footer className="v-panel p-6 bg-slate-100 border border-slate-200 mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-500 leading-relaxed">
        <div className="space-y-2">
          <div className="text-amber-500 font-extrabold text-sm tracking-widest flex items-center gap-1.5">
            <ShoppingBag className="h-4 w-4" />
            <span>vService Enterprise</span>
          </div>
          <p className="text-[11px] text-slate-400">
            ระบบบริหารจัดการคิวและจับคู่ทีมช่างคุณภาพครบวงจร (Vfixq Engine)<br/>
            พัฒนาและลิขสิทธิ์โดย บริษัท เน็กซเตอร์ ดิจิตอล แอนด์ โซลูชั่น จำกัด (สำนักงานใหญ่)<br/>
            ศูนย์การค้าเกตเวย์ บางซื่อ ชั้น 6 เลขที่ 162/1-2 ถนนประชาราษฎร์ 2 เขตบางซื่อ กรุงเทพฯ 10800
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-slate-800">ลิงก์ข้อมูลเพิ่มเติม</h4>
          <ul className="space-y-1.5 font-medium">
            <li><button onClick={() => setInfoModalTab('terms')} className="hover:text-amber-500 cursor-pointer">ข้อกำหนดและเงื่อนไขการใช้บริการ</button></li>
            <li><button onClick={() => setInfoModalTab('how-to-buy')} className="hover:text-amber-500 cursor-pointer">ขั้นตอนขอเคลมประกันและตรวจสอบ QC</button></li>
            <li><button onClick={() => onNavigateToTab('km-hub')} className="hover:text-amber-500 cursor-pointer">ศูนย์สืบค้นข้อมูล KM Portal</button></li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-center gap-4">
          <div className="bg-slate-200 p-2 rounded-lg border border-slate-300 w-fit shrink-0 text-center">
            {/* mock QR code layout */}
            <div className="w-16 h-16 bg-slate-900 rounded mx-auto flex items-center justify-center font-mono text-[9px] text-slate-400 font-bold border border-slate-800">
              LINE QR
            </div>
            <span className="text-[9px] block mt-1 font-bold text-slate-400 uppercase tracking-widest">@vservice_line</span>
          </div>
          <div className="space-y-1.5">
            <div className="font-bold text-slate-800">ดาวน์โหลดแอปช่าง vService</div>
            <div className="flex items-center gap-2">
              <span className="bg-slate-900 border border-slate-700 text-[10px] text-slate-300 font-semibold px-2 py-1 rounded select-none cursor-not-allowed">App Store</span>
              <span className="bg-slate-900 border border-slate-700 text-[10px] text-slate-300 font-semibold px-2 py-1 rounded select-none cursor-not-allowed">Google Play</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
