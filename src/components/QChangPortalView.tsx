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
  Building,
  Sparkles,
  Wind,
  Layout,
  Home,
  Smartphone
} from 'lucide-react';

interface QChangPortalViewProps {
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

export const QChangPortalView: React.FC<QChangPortalViewProps> = ({
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

  // Map INITIAL_INSTALLATION_TYPES to UI catalog
  const services: ServiceItem[] = [
    {
      id: 'inst-aircon-multi',
      name: 'บริการติดตั้งเครื่องปรับอากาศ Multi-Split (3 เครื่อง)',
      category: 'เครื่องปรับอากาศ',
      priceText: 'เริ่มต้น 3,500 บาท',
      priceNumber: 3500,
      image: '/ac_service.jpg',
      description: 'บริการเดินท่อน้ำยา ติดตั้งคอยล์เย็น-ร้อน คอมเพรสเซอร์ภายนอก แขวนคอยล์เย็น และทดสอบแรงดันระบบน้ำยาแอร์ R32 ประกันงานติดตั้ง 180 วัน',
      requiredSkillLevel: 3
    },
    {
      id: 'inst-built-kitchen',
      name: 'บริการติดตั้งชุดครัว Built-in Master (ชุดใหญ่)',
      category: 'เฟอร์นิเจอร์ & บิลต์อิน',
      priceText: 'เริ่มต้น 12,000 บาท',
      priceNumber: 12000,
      image: '/kitchen_service.jpg',
      description: 'ติดตั้งชุดครัว Built-in เต็มเซ็ต, ประกอบตู้อะคริลิค/ไม้, แผ่นหินท็อปครัว, งานเจาะระบายอากาศดูดควัน และปรับหน้าบานตู้ระนาบไฮคลาส',
      requiredSkillLevel: 3
    },
    {
      id: 'inst-built-closet',
      name: 'บริการติดตั้งตู้เสื้อผ้า Walk-in Closet',
      category: 'เฟอร์นิเจอร์ & บิลต์อิน',
      priceText: 'เริ่มต้น 4,500 บาท',
      priceNumber: 4500,
      image: '/kitchen_service.jpg',
      description: 'ประกอบและติดตั้งตู้เสื้อผ้าหน้าบานกระจก โครงอะลูมิเนียมเกรดพรีเมียม ซ่อนไฟหลืบไฟราว LED และลิ้นชัก Soft-close ครบวงจร',
      requiredSkillLevel: 2
    },
    {
      id: 'inst-flooring-laminate',
      name: 'บริการปูพื้นไม้สำเร็จรูป SPC (เกรดนำเข้า)',
      category: 'พื้นและผนัง',
      priceText: 'เริ่มต้น 450 บาท / ตร.ม.',
      priceNumber: 450,
      image: '/flooring_service.jpg',
      description: 'ปรับระดับหน้าพื้น ปูแผ่นโฟมรองกันความชื้นเกรดพรีเมียม ติดตั้งแผ่นไม้ SPC คลิกล็อกรอยต่อสนิท ไร้ขอบ เคลือบยูวีกันรอยขูดขีด',
      requiredSkillLevel: 2
    },
    {
      id: 'inst-smart-home',
      name: 'บริการติดตั้งระบบ Smart Home & Digital Lock',
      category: 'ไฟฟ้า & มาร์ทโฮม',
      priceText: 'เริ่มต้น 1,800 บาท',
      priceNumber: 1800,
      image: '/ac_service.jpg', // reusable asset
      description: 'ติดตั้งอุปกรณ์ล็อคประตูดิจิทัล (Digital Door Lock) เจาะประตูไม้/เหล็ก พร้อมสวิตช์ไฟอัจฉริยะ เซ็ตอัประบบเชื่อมแอป Gateway',
      requiredSkillLevel: 2
    },
    {
      id: 'inst-curtains-motor',
      name: 'บริการติดตั้งผ้าม่านมอเตอร์ไฟฟ้า + วอลเปเปอร์',
      category: 'ผ้าม่าน & วอลเปเปอร์',
      priceText: 'เริ่มต้น 3,200 บาท',
      priceNumber: 3200,
      image: '/flooring_service.jpg', // reusable asset
      description: 'ติดตั้งผ้าม่านพับ/ผ้าม่านรางไฟฟ้ารับคำสั่งเสียง ติดตั้งมอเตอร์ม่าน ปลั๊กพ่วงไฟฟ้า และปูวอลเปเปอร์ไวนิลนำเข้าจากยุโรป',
      requiredSkillLevel: 1
    }
  ];

  const categories = ['ทั้งหมด', 'เครื่องปรับอากาศ', 'เฟอร์นิเจอร์ & บิลต์อิน', 'พื้นและผนัง', 'ไฟฟ้า & มาร์ทโฮม', 'ผ้าม่าน & วอลเปเปอร์'];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'เครื่องปรับอากาศ': return <Wind className="h-4 w-4" />;
      case 'เฟอร์นิเจอร์ & บิลต์อิน': return <Home className="h-4 w-4" />;
      case 'พื้นและผนัง': return <Layout className="h-4 w-4" />;
      case 'ไฟฟ้า & มาร์ทโฮม': return <Smartphone className="h-4 w-4" />;
      case 'ผ้าม่าน & วอลเปเปอร์': return <Sparkles className="h-4 w-4" />;
      default: return <ShoppingBag className="h-4 w-4" />;
    }
  };

  const filteredServices = services.filter(service => {
    const matchesCategory = activeCategory === 'ทั้งหมด' || service.category === activeCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredBranches = branches.filter(branch => 
    branch.name.toLowerCase().includes(branchSearchQuery.toLowerCase()) ||
    (branch.fullName && branch.fullName.toLowerCase().includes(branchSearchQuery.toLowerCase())) ||
    (branch.address && branch.address.toLowerCase().includes(branchSearchQuery.toLowerCase()))
  ).slice(0, 5); // list top 5 matched

  // Calculate pricing
  const basePrice = selectedService ? selectedService.priceNumber : 0;
  const addonOzonePrice = addonOzone ? 350 : 0;
  const addonWarrantyPrice = addonWarranty ? 500 : 0;
  const totalPrice = basePrice + addonOzonePrice + addonWarrantyPrice;

  // Handle click book now
  const handleOpenWizard = (service: ServiceItem) => {
    setSelectedService(service);
    setWizardStep(1);
    setAddonOzone(false);
    setAddonWarranty(false);
    // Prefill branch with first default branch
    if (branches.length > 0) {
      setSelectedBranchId(branches[0].id);
    }
  };

  // Submit checkout
  const handleCheckoutSubmit = () => {
    if (!selectedService || !customerName || !customerPhone || !bookingDate) return;

    // Generate reference code
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const bookingRef = `BK-Q-${randNum}`;
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
      createdFrom: 'Q-Chang Portal',
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
    <div className="space-y-6">
      {/* SUCCESS SCREEN */}
      {isSuccess && selectedService && (
        <div className="v-panel p-8 text-center bg-white space-y-6 max-w-xl mx-auto border-2 border-amber-500/20 shadow-xl animate-fadeIn">
          <div className="mx-auto w-16 h-16 bg-emerald-950/50 rounded-full border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Check className="h-8 w-8 stroke-[3]" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800">ส่งคำสั่งจองบริการสำเร็จเรียบร้อย!</h2>
            <p className="text-xs text-slate-500">
              เลขที่ใบงานจองของคุณคือ <span className="font-mono font-bold text-amber-500 text-sm">{createdBookingRef}</span>
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-100 text-left text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-400">บริการที่เลือก:</span>
              <span className="font-semibold text-slate-700">{selectedService.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ชื่อผู้ติดต่อ:</span>
              <span className="font-semibold text-slate-700">{customerName} ({customerPhone})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">สถานที่ติดตั้ง:</span>
              <span className="font-semibold text-slate-700">{selectedZone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">วันเวลานัดหมาย:</span>
              <span className="font-semibold text-slate-700">{bookingDate} | {bookingTimeSlot}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-sm">
              <span className="text-slate-800">ราคาสรุปรวม:</span>
              <span className="text-amber-500">{totalPrice.toLocaleString()} บาท</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs text-amber-600 flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 animate-pulse" />
            <span className="text-left font-medium leading-relaxed">
              ระบบส่งงานเข้า **Smart Booking Engine** เรียบร้อยแล้ว ช่างเทคนิคที่ตรงทักษะและเงื่อนไขของคุณจะได้รับการจัดหาคิวตามอัตรา Match Score ทันที
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
              ไปดูตารางคิวติดตั้ง (Queue)
            </button>
            
            <button
              onClick={() => {
                handleReset();
                onNavigateToTab('smart-booking');
              }}
              className="flex-1 v-btn-primary"
            >
              จัดหาช่างอัจฉริยะ (Match Engine)
            </button>
          </div>

          <button
            onClick={handleReset}
            className="text-xs text-slate-400 font-semibold underline hover:text-slate-300 block mx-auto pt-2"
          >
            จองบริการใหม่เพิ่มอีกราย
          </button>
        </div>
      )}

      {/* SERVICE CATALOG CONTAINER */}
      {!isSuccess && !selectedService && (
        <div className="space-y-6">
          {/* Header Portal */}
          <div className="v-panel p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-5 border border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-800">ศูนย์จองบริการคิวช่าง (Q-Chang Catalog Portal)</h2>
              </div>
              <p className="text-xs text-slate-500">
                เลือกซื้อบริการงานช่างคุณภาพ ได้รับความนิยมสูงสุด พร้อมการจับคู่ทีมช่างติดตั้งระดับมืออาชีพตามมาตรฐาน vService
              </p>
            </div>

            {/* Catalog search bar */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="ค้นหาบริการติดตั้ง หรือล้างระบบ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="v-input w-full pl-9 py-2 text-xs"
              />
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Navigation Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  activeCategory === cat 
                    ? 'bg-blue-600 text-slate-900 shadow-sm' 
                    : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-300'
                }`}
              >
                {getCategoryIcon(cat)}
                <span>{cat}</span>
              </button>
            ))}
          </div>

          {/* Grid Layout Catalog */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.length === 0 ? (
              <div className="v-panel p-12 text-center text-slate-400 col-span-full">
                ไม่พบงานบริการที่คุณค้นหาในหมวดหมู่นี้ ลองเปลี่ยนคำค้นหา
              </div>
            ) : (
              filteredServices.map((service) => (
                <div 
                  key={service.id} 
                  className="v-panel overflow-hidden border border-slate-200 hover:border-blue-600/30 flex flex-col justify-between group transition-all duration-300 shadow-sm hover:shadow-lg bg-white"
                >
                  <div>
                    {/* Catalog Image */}
                    <div className="relative h-44 overflow-hidden bg-slate-900 border-b border-slate-200">
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
                    <div className="p-4 space-y-2">
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
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ราคาประเมิน</div>
                      <div className="text-sm font-bold text-amber-500">{service.priceText}</div>
                    </div>
                    
                    <button
                      onClick={() => handleOpenWizard(service)}
                      className="v-btn-primary py-1 px-3.5 text-xs font-bold cursor-pointer"
                    >
                      จองบริการ
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MULTI-STEP BOOKING WIZARD */}
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
                <h3 className="font-bold text-slate-800 text-sm md:text-base">ขั้นตอนการจอง: {selectedService.name}</h3>
                <p className="text-[10px] text-slate-400">ข้อมูลจะจัดทำตั๋วติดตั้งในระบบคิวอัตโนมัติ</p>
              </div>
            </div>
            
            {/* Step badges */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    wizardStep === step
                      ? 'bg-blue-600 text-slate-900 shadow-sm ring-2 ring-blue-600/30'
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

          {/* STEP 1: Select Details */}
          {wizardStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <h4 className="font-bold text-slate-800 text-xs md:text-sm border-b border-slate-200/50 pb-2">1. เลือกแพ็กเกจย่อยและบริการเสริม (Add-on Services)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-100 space-y-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/30 text-amber-500 border border-amber-500/20">แพ็กเกจแนะนำ</span>
                  <h5 className="font-bold text-slate-800 text-xs md:text-sm mt-2">{selectedService.name}</h5>
                  <p className="text-[11px] text-slate-500 leading-normal">{selectedService.description}</p>
                  <div className="text-base font-bold text-amber-500 pt-2">รวมค่าเครื่องมือ อุปกรณ์ช่าง และใบรับประกัน</div>
                </div>

                <div className="space-y-3.5">
                  <h5 className="font-bold text-slate-800 text-xs">บริการเสริมพิเศษ (สแกนเลือกเพิ่ม):</h5>
                  
                  {/* Addon 1 */}
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-100/50 cursor-pointer transition">
                    <input 
                      type="checkbox" 
                      checked={addonOzone} 
                      onChange={(e) => setAddonOzone(e.target.checked)}
                      className="mt-1 accent-amber-500" 
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-xs">บริการพ่นน้ำยาอบโอโซนฆ่าเชื้อโรค</div>
                      <p className="text-[10px] text-slate-400 mt-0.5">พ่นสเปรย์ฆ่าเชื้อราและแบคทีเรียกลิ่นอับสะสมในท่อลมแอร์</p>
                      <span className="text-amber-500 font-bold text-[11px] block mt-1">+350 บาท</span>
                    </div>
                  </label>

                  {/* Addon 2 */}
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-100/50 cursor-pointer transition">
                    <input 
                      type="checkbox" 
                      checked={addonWarranty} 
                      onChange={(e) => setAddonWarranty(e.target.checked)}
                      className="mt-1 accent-amber-500" 
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-xs">ประกันการติดตั้งขยายเวลา (vService Extended Care)</div>
                      <p className="text-[10px] text-slate-400 mt-0.5">ขยายระยะเวลาดูแลคุ้มครองหน้างานติดตั้งรั่วจาก 180 วัน เป็น 365 วัน</p>
                      <span className="text-amber-500 font-bold text-[11px] block mt-1">+500 บาท</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200/50">
                <button
                  onClick={() => setWizardStep(2)}
                  className="v-btn-primary flex items-center space-x-2 py-1.5 text-xs cursor-pointer"
                >
                  <span>ขั้นตอนถัดไป (ข้อมูลที่อยู่)</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Location & Contact */}
          {wizardStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="font-bold text-slate-800 text-xs md:text-sm border-b border-slate-200/50 pb-2">2. ข้อมูลผู้ติดต่อจัดส่ง & โซนพื้นที่ให้บริการ</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อ-นามสกุล ผู้ว่าจ้างงานติดตั้ง:</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="ระบุชื่อจริง นามสกุล"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="v-input w-full pl-9 py-2 text-xs"
                      />
                      <User className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">เบอร์ติดต่อมือถือ:</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="ระบุเบอร์ติดต่อมือถือ 10 หลัก"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="v-input w-full pl-9 py-2 text-xs"
                      />
                      <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">เขตโซนพื้นที่ติดตั้ง (จัดเก็บคิวงาน):</label>
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

                {/* Branch sync search */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500">เลือกสาขาไทวัสดุ / BnB Home ที่สั่งซื้อสินค้า:</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อสาขา (เช่น บางนา, รังสิต, หาดใหญ่)..."
                      value={branchSearchQuery}
                      onChange={(e) => setBranchSearchQuery(e.target.value)}
                      className="v-input w-full pl-9 py-2 text-xs"
                    />
                    <Building className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>

                  {/* Suggestions list */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto mt-2 border border-slate-200/50 rounded-lg p-2 bg-slate-100/50">
                    {filteredBranches.map((branch) => {
                      const isSelected = selectedBranchId === branch.id;
                      return (
                        <button
                          key={branch.id}
                          type="button"
                          onClick={() => setSelectedBranchId(branch.id)}
                          className={`w-full text-left p-1.5 rounded text-[11px] flex justify-between items-center transition cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-600/10 border border-blue-600/40 text-blue-600 font-bold' 
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span className="truncate">{branch.name} - {branch.fullName || 'ไทวัสดุ'}</span>
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-200/50">
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

          {/* STEP 3: Date & Time */}
          {wizardStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="font-bold text-slate-800 text-xs md:text-sm border-b border-slate-200/50 pb-2">3. นัดหมายระบุวันเวลารับบริการติดตั้ง</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Date Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">เลือกวันที่ติดตั้ง:</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={bookingDate}
                      min={new Date().toISOString().split('T')[0]} // from today onwards
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="v-input w-full pl-9 py-2 text-xs"
                    />
                    <Calendar className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    *กรุณาเลือกวันจองติดตั้งล่วงหน้าอย่างน้อย 1 วัน เพื่อจัดหาคิวที่เหมาะสมที่สุด
                  </p>
                </div>

                {/* Period Time Slot */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">เลือกช่วงเวลานัดหมาย:</label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {[
                      { id: 'morning', label: 'ช่วงเช้า (09:00 - 12:00 น.)', value: '09:00 - 12:00 (Morning)' },
                      { id: 'afternoon', label: 'ช่วงบ่าย (13:00 - 17:00 น.)', value: '13:00 - 17:00 (Afternoon)' },
                      { id: 'fullday', label: 'ให้บริการทั้งวัน (09:00 - 17:00 น.)', value: '09:00 - 17:00 (Full Day)' }
                    ].map((slot) => {
                      const isSelected = bookingTimeSlot === slot.value;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setBookingTimeSlot(slot.value)}
                          className={`w-full text-left p-3.5 rounded-lg border-2 text-xs font-bold transition flex justify-between items-center cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-600/10 border-blue-600 text-blue-600 shadow-sm' 
                              : 'bg-slate-100 border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <span>{slot.label}</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check className="h-2.5 w-2.5 text-slate-900 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-200/50">
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
                  <span>ขั้นตอนสุดท้าย (สรุปบิล)</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review Summary */}
          {wizardStep === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="font-bold text-slate-800 text-xs md:text-sm border-b border-slate-200/50 pb-2">4. สรุปรายละเอียดรายการจองบริการและชำระค่าธรรมเนียม</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Left panels summary */}
                <div className="md:col-span-2 space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-100/50 space-y-3.5 text-xs">
                    <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <span>ข้อมูลการนัดหมายและที่อยู่</span>
                    </h5>
                    
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <div className="text-[10px] text-slate-400">ผู้สั่งซื้อสินค้า:</div>
                        <div className="font-semibold text-slate-700">{customerName}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">เบอร์มือถือติดต่อ:</div>
                        <div className="font-semibold text-slate-700">{customerPhone}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">พิกัดโซนติดตั้ง:</div>
                        <div className="font-semibold text-slate-700">{selectedZone}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">สาขาที่จองสังกัด:</div>
                        <div className="font-semibold text-slate-700">
                          {branches.find(b => b.id === selectedBranchId)?.name || 'สาขาทั่วไป'}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[10px] text-slate-400">วันเวลานัดเข้าหน้างาน:</div>
                        <div className="font-bold text-slate-800 text-sm">{bookingDate} | {bookingTimeSlot}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/20 text-[11px] text-blue-600 flex items-start gap-2">
                    <CreditCard className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      **การชำระเงินจำลอง**: ช่องทางนี้จะเชื่อมโยงเข้าฐานข้อมูลจำลองและออกใบงานคิวติดตั้งโดยอัตโนมัติ เพื่อนำไปสาธิตคิวช่างในหน้าจองช่างอัจฉริยะ (vService Dashboard)
                    </span>
                  </div>
                </div>

                {/* Bill details */}
                <div className="p-4 rounded-xl border-2 border-amber-500/20 bg-slate-100 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <h5 className="font-bold text-slate-800 text-xs pb-1.5 border-b border-slate-200">บิลค่าใช้จ่าย</h5>
                    
                    <div className="text-[11px] space-y-2">
                      <div className="flex justify-between text-slate-500">
                        <span>ค่าบริการจองติดตั้ง:</span>
                        <span>{basePrice.toLocaleString()} บาท</span>
                      </div>
                      
                      {addonOzone && (
                        <div className="flex justify-between text-slate-500">
                          <span>อบโอโซนฆ่าเชื้อ:</span>
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
                      <span className="text-[11px] text-slate-500 font-bold">ราคาสรุทธิ:</span>
                      <span className="text-xl font-black text-amber-500">{totalPrice.toLocaleString()} บ.</span>
                    </div>

                    <button
                      onClick={handleCheckoutSubmit}
                      className="w-full v-btn-primary py-2 text-xs cursor-pointer"
                    >
                      ยืนยันและสรุปชำระเงิน
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-200/50">
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
    </div>
  );
};
