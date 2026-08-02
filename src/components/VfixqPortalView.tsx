import React, { useState, useEffect } from 'react';
import type { Branch, QueueBooking, PortalBanner, ServiceItem } from '../types';
import { CustomDateInput } from './CustomDateInput';
import { SERVICE_ZONES } from '../mockData';
import { 
  ShoppingBag, 
  Search, 
  MapPin, 
  User, 
  Phone, 
  Check, 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Sparkles,
  MessageSquare,
  MessageCircle,
  Send,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface VfixqPortalViewProps {
  branches: Branch[];
  onConfirmBooking: (newBooking: QueueBooking) => void;
  onNavigateToTab: (tabId: string) => void;
  banners: PortalBanner[];
  onRegisterTechnician: (app: {
    name: string;
    phone: string;
    lineId: string;
    zone: string;
    skills: string[];
    experience: string;
    avatarUrl?: string;
    refNum: string;
  }) => void;
  services: ServiceItem[];
  bannerSlideInterval?: number;
}

const formatDateDDMMYYYY = (dateStr: string | null) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
};

export const VfixqPortalView: React.FC<VfixqPortalViewProps> = ({
  branches,
  onConfirmBooking,
  onNavigateToTab,
  banners,
  onRegisterTechnician,
  services,
  bannerSlideInterval
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [activeBannerIdx, setActiveBannerIdx] = useState<number>(0);
  
  const activeBanners = banners.filter(b => b.isActive);
  const safeBannerIdx = activeBannerIdx >= activeBanners.length ? 0 : activeBannerIdx;

  // Auto-slide effect for banners
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const intervalMs = (bannerSlideInterval || 5) * 1000;
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % activeBanners.length);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [activeBanners.length, bannerSlideInterval]);
  
  const handleNextBanner = () => {
    if (activeBanners.length <= 1) return;
    setActiveBannerIdx((prev) => (prev + 1) % activeBanners.length);
  };

  const handlePrevBanner = () => {
    if (activeBanners.length <= 1) return;
    setActiveBannerIdx((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };
  
  // Wizard States
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [customerFirstName, setCustomerFirstName] = useState<string>('');
  const [customerLastName, setCustomerLastName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerLineId, setCustomerLineId] = useState<string>('');
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

  // Technician Application Form Modal states
  const [showTechAppModal, setShowTechAppModal] = useState<boolean>(false);
  const [techAppName, setTechAppName] = useState<string>('');
  const [techAppPhone, setTechAppPhone] = useState<string>('');
  const [techAppZone, setTechAppZone] = useState<string>('Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา - ประเวศ)');
  const [techAppSkills, setTechAppSkills] = useState<string[]>([]);
  const [techAppExperience, setTechAppExperience] = useState<string>('1-3 ปี');
  const [isTechAppSuccess, setIsTechAppSuccess] = useState<boolean>(false);
  const [techAppRef, setTechAppRef] = useState<string>('');
  const [techAppLineId, setTechAppLineId] = useState<string>('');
  const [techAppImage, setTechAppImage] = useState<string>('');

  // Customer Webchat states
  const [showWebchat, setShowWebchat] = useState<boolean>(false);
  const [webchatMessages, setWebchatMessages] = useState<any[]>([
    { id: '1', sender: 'agent', name: 'ช่างเทคนิค vFixQ', text: 'สวัสดีครับ! ยินดีต้อนรับสู่ศูนย์บริการช่าง vFixQ มีคำถามเกี่ยวกับบริการติดตั้ง ทักษะช่าง หรือการจองคิว สอบถามได้เลยครับ 🛠️', timestamp: '11:00' }
  ]);
  const [webchatInput, setWebchatInput] = useState<string>('');

  const handleSendWebchat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webchatInput.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      name: 'ลูกค้า',
      text: webchatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setWebchatMessages((prev) => [...prev, userMsg]);
    const typedText = webchatInput.toLowerCase();
    setWebchatInput('');

    // Simulate Agent response
    setTimeout(() => {
      let replyText = 'ได้รับเรื่องแล้วครับ! หากต้องการสอบถามวันนัดหมายจัดส่งคิวงานด่วน หรือมีปัญหารูปแบบทักษะงานติดตั้งใด ๆ สามารถติดต่อประสานงานผ่านช่องทาง Line OA: @vfixq_line หรือโทรสายด่วน 1308 ได้เลยครับ';
      
      if (typedText.includes('แอร์') || typedText.includes('ปรับอากาศ') || typedText.includes('ac')) {
        replyText = 'สำหรับบริการติดตั้งเครื่องปรับอากาศ Multi-Split จะรวมการเดินท่อน้ำยาไม่เกิน 4 เมตร พร้อมขาแขวนเหล็กหนา และรับประกันผลงานติดตั้งซ่อมแอร์รั่ว 180 วันครับ!';
      } else if (typedText.includes('พื้น') || typedText.includes('spc')) {
        replyText = 'งานปูพื้น SPC ทางเราคัดสรรวัสดุหนาพิเศษกันกระแทก ปูทับโฟมหนา 1.5 มม. เพื่อป้องกันความชื้นและเสียงสะท้อน รับประกันผลงานยุบขอบ 1 ปีเต็มครับ!';
      } else if (typedText.includes('ครัว') || typedText.includes('built')) {
        replyText = 'งานติดตั้งตู้ลอยและบิลต์อินชุดครัว จะมีการใช้ระบบเลเซอร์วัดระดับน้ำ ติดตั้งท่อระบายลมดูดควันออกนอกอาคาร และเช็กหน้าบานตู้แบบ Soft-close ทุกชิ้นครับ';
      } else if (typedText.includes('สมัคร') || typedText.includes('งานช่าง') || typedText.includes('สมัครช่าง')) {
        replyText = 'สนใจร่วมงานกับทีมช่าง vFixQ เพื่อรับงานติดตั้งสินค้าใช่ไหมครับ? สามารถเลื่อนหน้าเว็บลงไปด้านล่างสุดของเว็บ แล้วกดปุ่ม "กรอกใบสมัครร่วมเป็นช่าง vFixQ" เพื่อกรอกข้อมูลได้เลยครับ!';
      } else if (typedText.includes('ราคา') || typedText.includes('เท่าไหร่') || typedText.includes('กี่บาท')) {
        replyText = 'ราคางานบริการเบื้องต้น: ติดตั้งแอร์เริ่มต้น 3,500 บาท, ปูพื้น SPC ตารางเมตรละ 450 บาท, บิลต์อินครัวเริ่มต้น 12,000 บาทครับ สามารถเลือกชมแพ็กเกจได้บนหน้าหลักได้เลยครับ';
      }

      const agentReply = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        name: 'ช่างเทคนิค vFixQ',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setWebchatMessages((prev) => [...prev, agentReply]);
    }, 1000);
  };



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
    const fullCustomerName = `${customerFirstName} ${customerLastName}`.trim();
    if (!selectedService || !fullCustomerName || !customerPhone || !bookingDate) return;

    const randNum = Math.floor(1000 + Math.random() * 9000);
    const bookingRef = `BK-V-${randNum}`;
    setCreatedBookingRef(bookingRef);

    const newBooking: QueueBooking = {
      id: `bk-${Date.now()}`,
      bookingRef,
      customerName: fullCustomerName,
      customerPhone,
      lineId: customerLineId,
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
    setCustomerFirstName('');
    setCustomerLastName('');
    setCustomerPhone('');
    setCustomerLineId('');
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

        <div className="relative max-w-xs flex-1 mx-4 hidden sm:block">
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
          <span className="hover:text-amber-500 cursor-pointer hidden sm:inline">🛒 ตะกร้าสินค้า</span>
          <button 
            onClick={() => onNavigateToTab('dashboard')} 
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-3.5 py-1.5 rounded-full cursor-pointer font-bold transition flex items-center gap-1 shadow-md border-0 whitespace-nowrap"
          >
            <span>⚙️</span>
            <span className="hidden md:inline"> เข้าระบบหลังบ้าน (1308 Console)</span>
            <span className="md:hidden text-[10px]"> ระบบหลังบ้าน</span>
          </button>
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
              <span className="font-semibold text-slate-700">{`${customerFirstName} ${customerLastName}`.trim()} ({customerPhone})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">โซนจุดจอง:</span>
              <span className="font-semibold text-slate-700">{selectedZone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">วันเวลานัด:</span>
              <span className="font-semibold text-slate-700">{formatDateDDMMYYYY(bookingDate)} | {bookingTimeSlot}</span>
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
          
          {/* Dynamic Panorama Banner Slider */}
          <div className="v-panel p-1 bg-gradient-to-r from-amber-500/25 via-slate-900 to-amber-500/25 rounded-2xl overflow-hidden border border-amber-500/30 shadow-lg">
            <div className="relative rounded-xl overflow-hidden bg-slate-950 h-80 sm:h-96 md:h-[400px] lg:h-[460px] w-full flex flex-col justify-end shadow-2xl transition-all duration-500">
              
              {/* Slide image */}
              <img 
                src={
                  activeBanners[safeBannerIdx]?.imageUrl || 
                  'https://storage.googleapis.com/prod-qchang-v1/coupon/upload/20260720/20260720182034Banner%20-%20Shera%20SPC%2021-31%20Jul26-Web%20900x900.png'
                } 
                alt={activeBanners[safeBannerIdx]?.title || 'โปรโมชั่นหลัก'} 
                className="absolute inset-0 w-full h-full object-cover brightness-100 animate-fadeIn"
              />

              {/* Text overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex flex-col justify-end p-6 sm:p-8 z-10">
                <div className="bg-amber-500 text-slate-900 font-extrabold px-3 py-0.5 text-[10px] md:text-xs w-fit rounded-md uppercase tracking-wider mb-2 shadow-md">
                  {activeBanners[safeBannerIdx]?.campaignTag || 'Campaign'}
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight drop-shadow-md">
                  {activeBanners[safeBannerIdx]?.title || 'โปรโมชั่นติดตั้งพื้นไม้ SPC เกรดพรีเมียม Shera'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 mt-2 max-w-2xl leading-relaxed drop-shadow-sm">
                  {activeBanners[safeBannerIdx]?.description || 'รับโปรโมชันจองช่างขยายประกันเพิ่ม 365 วัน ฟรีบริการพ่นน้ำยาโอโซนฆ่าเชื้อโรค มูลค่า 350.-'}
                </p>
              </div>

              {/* Slider Navigation controls */}
              {activeBanners.length > 1 && (
                <>
                  <button
                    onClick={handlePrevBanner}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-slate-900/50 hover:bg-slate-900/80 text-white p-2 rounded-full transition z-20 cursor-pointer border-0 shadow-md flex items-center justify-center hover:scale-105"
                  >
                    <ChevronLeft className="h-5 w-5 text-amber-500 stroke-[3]" />
                  </button>
                  <button
                    onClick={handleNextBanner}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-slate-900/50 hover:bg-slate-900/80 text-white p-2 rounded-full transition z-20 cursor-pointer border-0 shadow-md flex items-center justify-center hover:scale-105"
                  >
                    <ChevronRight className="h-5 w-5 text-amber-500 stroke-[3]" />
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2.5 z-20">
                    {activeBanners.map((_, idx) => (
                      <span
                        key={idx}
                        onClick={() => setActiveBannerIdx(idx)}
                        className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${
                          safeBannerIdx === idx 
                            ? 'bg-amber-500 scale-120 w-5 shadow-md' 
                            : 'bg-white/50 hover:bg-white'
                        }`}
                      ></span>
                    ))}
                  </div>
                </>
              )}

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
          <div className="v-panel p-5 bg-white space-y-4 shadow-sm border border-slate-200/80 rounded-2xl">
            <h3 className="text-sm sm:text-base font-bold text-slate-700 tracking-wide flex items-center gap-2">
              <span>ค้นหาตามหมวดหมู่งานติดตั้งและบริการทั้งหมด</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">15 Categories</span>
            </h3>
            
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2.5 sm:gap-3">
              <button
                onClick={() => setActiveCategory('ทั้งหมด')}
                className={`p-3 rounded-xl text-center transition-all cursor-pointer border flex flex-col items-center justify-center min-h-[76px] sm:min-h-[84px] gap-1.5 ${
                  activeCategory === 'ทั้งหมด' 
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-md scale-102' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200/80 hover:border-amber-400'
                }`}
              >
                <div className="text-xl sm:text-2xl">🏡</div>
                <span className="block text-xs sm:text-sm font-bold leading-tight">ทั้งหมด</span>
              </button>

              {categoriesGrid.map((cat) => {
                const isSelected = activeCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`p-2.5 sm:p-3 rounded-xl text-center transition-all cursor-pointer border flex flex-col items-center justify-center min-h-[76px] sm:min-h-[84px] gap-1.5 ${
                      isSelected 
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-md scale-102' 
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200/80 hover:border-amber-400'
                    }`}
                  >
                    <div className="text-xl sm:text-2xl">{cat.icon}</div>
                    <span className="block text-xs sm:text-[13px] font-semibold leading-tight line-clamp-2 px-0.5">{cat.name}</span>
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
                  {selectedService.image && (
                    <div className="relative h-44 rounded-lg overflow-hidden mb-3 border border-slate-200 shadow-sm bg-slate-900">
                      <img 
                        src={selectedService.image} 
                        alt={selectedService.name} 
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-950/85 text-slate-200 border border-slate-700 shadow-sm">
                        🏷️ {selectedService.category}
                      </span>
                    </div>
                  )}
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
              <h4 className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-2 flex items-center justify-between">
                <span>ขั้นตอนที่ 2: ที่อยู่ผู้รับบริการและข้อมูลสั่งซื้อสินค้า</span>
                <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-normal">
                  *ยังไม่ต้องระบุเลขตั๋วงาน (เนื่องจากยังไม่ชำระเงิน)
                </span>
              </h4>

              <div className="space-y-4">
                {/* 1. Customer Name Row (First Name & Last Name) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ชื่อจริงผู้รับบริการ:</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="เช่น คุณสมเกียรติ"
                        value={customerFirstName}
                        onChange={(e) => setCustomerFirstName(e.target.value)}
                        className="v-input w-full pl-9 py-2 text-xs"
                      />
                      <User className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">นามสกุล:</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="เช่น มั่นคง"
                        value={customerLastName}
                        onChange={(e) => setCustomerLastName(e.target.value)}
                        className="v-input w-full pl-9 py-2 text-xs"
                      />
                      <User className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>

                {/* 2. Contact Info Row (Phone & LINE ID) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">เบอร์โทรศัพท์มือถือ:</label>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="เช่น 089-1234567"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="v-input w-full pl-9 py-2 text-xs font-mono"
                      />
                      <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">LINE ID (ไลน์ไอดี):</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="เช่น @somkiat หรือ somkiat_line"
                        value={customerLineId}
                        onChange={(e) => setCustomerLineId(e.target.value)}
                        className="v-input w-full pl-9 py-2 text-xs font-mono text-emerald-700"
                      />
                      <MessageCircle className="h-4 w-4 text-emerald-500 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>

                {/* 3. Zone & Branch Selection Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">โซนพิกัดจัดเก็บคิวงานติดตั้ง:</label>
                    <div className="relative">
                      <select
                        value={selectedZone}
                        onChange={(e) => setSelectedZone(e.target.value)}
                        className="v-input w-full pl-9 py-2 text-xs font-semibold"
                      >
                        {SERVICE_ZONES.map((zone) => (
                          <option key={zone} value={zone}>{zone}</option>
                        ))}
                      </select>
                      <MapPin className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600">เลือกสาขาไทวัสดุ / BnB Home ที่ซื้อสินค้า:</label>
                    <input
                      type="text"
                      placeholder="พิมพ์ชื่อค้นหา (บางนา, ราชพฤกษ์, ปทุมธานี)..."
                      value={branchSearchQuery}
                      onChange={(e) => setBranchSearchQuery(e.target.value)}
                      className="v-input w-full pl-9 py-2 text-xs"
                    />
                    
                    <div className="space-y-1 max-h-32 overflow-y-auto mt-2 border border-slate-200/50 rounded-lg p-2 bg-slate-100/50">
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
                  disabled={!customerFirstName.trim() || !customerLastName.trim() || !customerPhone.trim()}
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
                  <CustomDateInput
                    value={bookingDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(val) => setBookingDate(val)}
                    iconPosition="left"
                    className="v-input w-full py-2 text-xs"
                  />
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
                        <div className="font-semibold text-slate-700">{`${customerFirstName} ${customerLastName}`.trim() || '-'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">เบอร์โทรศัพท์:</div>
                        <div className="font-semibold text-slate-700">{customerPhone || '-'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">LINE ID (ไลน์ไอดี):</div>
                        <div className="font-semibold text-emerald-700 font-mono">{customerLineId || '-'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">โซนที่อยู่จัดเก็บคิว:</div>
                        <div className="font-semibold text-slate-700">{selectedZone}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[10px] text-slate-400">สาขาที่ซื้อสินค้า:</div>
                        <div className="font-semibold text-slate-700">
                          {branches.find(b => b.id === selectedBranchId)?.name || 'สาขาหลัก'}
                        </div>
                      </div>
                      <div className="col-span-2 border-t border-slate-200 pt-2.5">
                        <div className="text-[10px] text-slate-400">วันเวลานัดเข้าหน้างาน:</div>
                        <div className="font-bold text-slate-800 text-xs">{formatDateDDMMYYYY(bookingDate)} | {bookingTimeSlot}</div>
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

      {/* 5.5 TECHNICIAN APPLICATION FORM MODAL */}
      {showTechAppModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-200 animate-fadeIn overflow-y-auto">
          <div className="v-panel p-6 bg-white max-w-xl w-full space-y-4 relative border border-slate-200 shadow-2xl my-8">
            <button
              onClick={() => {
                setShowTechAppModal(false);
                setIsTechAppSuccess(false);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer border-0"
            >
              ✕
            </button>

            {!isTechAppSuccess ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                const num = Math.floor(100000 + Math.random() * 900000);
                const generatedRef = `AP-T-${num}`;
                setTechAppRef(generatedRef);
                setIsTechAppSuccess(true);
                onRegisterTechnician({
                  name: techAppName,
                  phone: techAppPhone,
                  lineId: techAppLineId,
                  zone: techAppZone,
                  skills: techAppSkills,
                  experience: techAppExperience,
                  avatarUrl: techAppImage,
                  refNum: generatedRef
                });
              }} className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    <span className="text-xl">🛠️</span>
                    <span>ใบสมัครร่วมเป็นทีมช่าง vFixQ</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">กรอกข้อมูลผู้สมัครเพื่อส่งประเมินและจัดสรรสายงานติดตั้ง</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">ชื่อ-นามสกุล หัวหน้าทีมช่าง:</label>
                    <input
                      type="text"
                      required
                      placeholder="ระบุชื่อจริงและนามสกุล"
                      value={techAppName}
                      onChange={(e) => setTechAppName(e.target.value)}
                      className="v-input w-full py-2"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">เบอร์โทรศัพท์มือถือติดต่อ:</label>
                    <input
                      type="text"
                      required
                      pattern="[0-9]{10}"
                      placeholder="ระบุเบอร์โทร 10 หลัก (เช่น 0812345678)"
                      value={techAppPhone}
                      onChange={(e) => setTechAppPhone(e.target.value)}
                      className="v-input w-full py-2"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">LINE ID ผู้ประสานงาน:</label>
                    <input
                      type="text"
                      required
                      placeholder="ระบุ LINE ID (เช่น @vfixq_chang)"
                      value={techAppLineId}
                      onChange={(e) => setTechAppLineId(e.target.value)}
                      className="v-input w-full py-2"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">โซนหลักที่รับปฏิบัติงาน:</label>
                    <select
                      value={techAppZone}
                      onChange={(e) => setTechAppZone(e.target.value)}
                      className="v-input w-full py-2"
                    >
                      {SERVICE_ZONES.map((zone) => (
                        <option key={zone} value={zone}>{zone}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">ประสบการณ์หน้างานช่าง:</label>
                    <select
                      value={techAppExperience}
                      onChange={(e) => setTechAppExperience(e.target.value)}
                      className="v-input w-full py-2"
                    >
                      <option value="น้อยกว่า 1 ปี">น้อยกว่า 1 ปี</option>
                      <option value="1-3 ปี">1-3 ปี</option>
                      <option value="3-5 ปี">3-5 ปี</option>
                      <option value="มากกว่า 5 ปี">มากกว่า 5 ปี</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="block font-bold text-slate-600">ทักษะ/ประเภทงานติดตั้งที่ทีมมีความชำนาญ (เลือกได้หลายข้อ):</label>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-100/50 rounded-xl border border-slate-200">
                    {[
                      'ระบบปรับอากาศ (ล้าง/ติดตั้ง)',
                      'งานไฟฟ้าและเครื่องใช้ไฟฟ้า',
                      'งานบิลต์อิน / เฟอร์นิเจอร์ Fit-In',
                      'งานปูพื้น ผนัง และฝ้าเพดาน',
                      'งานประปาและห้องน้ำ',
                      'งานรีโนเวทและต่อเติมโครงสร้าง'
                    ].map((skill) => {
                      const hasSkill = techAppSkills.includes(skill);
                      return (
                        <label key={skill} className="flex items-center gap-2 cursor-pointer py-1">
                          <input
                            type="checkbox"
                            checked={hasSkill}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTechAppSkills([...techAppSkills, skill]);
                              } else {
                                setTechAppSkills(techAppSkills.filter((s) => s !== skill));
                              }
                            }}
                            className="accent-blue-600"
                          />
                          <span className="text-[10px] text-slate-600">{skill}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="block font-bold text-slate-600">รูปภาพหัวหน้าทีมช่าง (Profile Picture):</label>
                  <div className="flex items-center gap-4 p-3 bg-slate-100/50 rounded-xl border border-slate-200">
                    <div className="w-14 h-14 rounded-lg bg-slate-200 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center text-slate-400 font-mono text-[9px] relative">
                      {techAppImage ? (
                        <img src={techAppImage} alt="Profile preview" className="w-full h-full object-cover" />
                      ) : (
                        <span>ไม่มีรูป</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setTechAppImage(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-[10px] text-slate-500 w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-semibold file:bg-amber-500 file:text-slate-900 hover:file:bg-amber-600 file:cursor-pointer"
                      />
                      <p className="text-[8px] text-slate-400">รองรับไฟล์ PNG, JPG หรือ JPEG ขนาดไม่เกิน 5MB</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="block font-bold text-slate-600">เอกสารแนบผู้สมัคร (รูปถ่ายบัตร ปชช. / บัตรวิชาชีพช่างไฟฟ้า):</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-100 hover:bg-slate-200 transition cursor-pointer">
                    <p className="text-[10px] text-slate-400 font-bold">📄 ลากรูปไฟล์เอกสารใบรับรองฝีมือแรงงานช่างมาวางที่นี่ (Simulated Upload)</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTechAppModal(false);
                      setIsTechAppSuccess(false);
                    }}
                    className="flex-1 v-btn-secondary py-2 text-xs"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 v-btn-primary py-2 text-xs"
                  >
                    ส่งใบสมัครเข้าระบบ
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center p-6 space-y-4 animate-fadeIn">
                <div className="mx-auto w-14 h-14 bg-emerald-950/40 rounded-full border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl font-bold">
                  ✓
                </div>
                
                {techAppImage && (
                  <div className="mx-auto w-20 h-20 rounded-full border-2 border-amber-500 overflow-hidden shadow-md">
                    <img src={techAppImage} alt="tech avatar" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-sm md:text-base">ยื่นใบสมัครร่วมเป็นช่างสำเร็จ!</h3>
                  <p className="text-xs text-slate-500">
                    เลขที่ใบสมัครตรวจสอบของคุณ: <span className="font-mono font-bold text-amber-500">{techAppRef}</span>
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  ข้อมูลประวัติของทีมช่าง {techAppName} (LINE ID: {techAppLineId || 'ไม่ระบุ'}) ได้ถูกจัดเก็บเข้าคลังตรวจสอบของระบบ vFixQ เรียบร้อยแล้ว ทีมผู้ควบคุมการรับช่างจะติดต่อกลับผ่านเบอร์มือถือ {techAppPhone} ของคุณภายใน 3 วันทำการ
                </p>
                <button
                  onClick={() => {
                    setShowTechAppModal(false);
                    setIsTechAppSuccess(false);
                    // Reset fields
                    setTechAppLineId('');
                    setTechAppImage('');
                    setTechAppName('');
                    setTechAppPhone('');
                  }}
                  className="w-full v-btn-secondary py-2 text-xs cursor-pointer"
                >
                  ปิดหน้าต่างนี้
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. VSERVICE OFFICIAL CORPORATE FOOTER (designed clean with 1308 hotline) */}
      <footer className="v-panel p-6 bg-slate-100 border border-slate-200 mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-500 leading-relaxed">
        <div className="space-y-3">
          <div className="text-amber-500 font-extrabold text-sm tracking-widest flex items-center gap-1.5">
            <ShoppingBag className="h-4 w-4" />
            <span>vService & Vfixq Network</span>
          </div>
          <p className="text-[11px] text-slate-400">
            ระบบจัดคิวช่างอัจฉริยะและสั่งจองบริการติดตั้งสินค้าครบวงจร<br/>
            ประสานงานบริการโดยตรงเพื่อให้การส่งมอบงานหน้างานมีมาตรฐานสูงสุด
          </p>
          <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 w-fit">
            <Phone className="h-4 w-4 animate-bounce shrink-0" />
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Vfix Call Center (สายด่วน)</div>
              <div className="text-xs font-black tracking-wider">โทร. 1308</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-slate-800">ขั้นตอนการสมัครร่วมเป็นทีมช่าง vFixQ</h4>
          <div className="text-[10px] text-slate-500 space-y-1 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs leading-relaxed">
            <div className="flex items-center gap-1.5"><span className="w-4 h-4 bg-amber-500 text-slate-900 rounded-full flex items-center justify-center font-bold text-[8px] shrink-0">1</span> <span>ส่งข้อมูลสมัคร & รูปถ่ายช่าง (Accept)</span></div>
            <div className="flex items-center gap-1.5"><span className="w-4 h-4 bg-amber-500 text-slate-900 rounded-full flex items-center justify-center font-bold text-[8px] shrink-0">2</span> <span>ประเมินระดับฝีมือช่าง (Approve)</span></div>
            <div className="flex items-center gap-1.5"><span className="w-4 h-4 bg-amber-500 text-slate-900 rounded-full flex items-center justify-center font-bold text-[8px] shrink-0">3</span> <span>ลงนามสัญญาปฏิบัติงาน (Sign Contract)</span></div>
            <div className="flex items-center gap-1.5"><span className="w-4 h-4 bg-amber-500 text-slate-900 rounded-full flex items-center justify-center font-bold text-[8px] shrink-0">4</span> <span>บรรจุขึ้นระบบทะเบียนช่าง (Employee)</span></div>
          </div>
          
          <button
            onClick={() => setShowTechAppModal(true)}
            className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-lg transition shadow-md border-0 cursor-pointer text-center block mt-2"
          >
            📋 กรอกใบสมัครร่วมเป็นช่าง vFixQ
          </button>
          <ul className="space-y-1.5 font-medium pt-1.5">
            <li><button onClick={() => setInfoModalTab('terms')} className="hover:text-amber-500 cursor-pointer text-slate-500 bg-transparent border-0 p-0 text-left">ข้อกำหนดเงื่อนไขประกันงานติดตั้ง</button></li>
            <li><button onClick={() => onNavigateToTab('km-hub')} className="hover:text-amber-500 cursor-pointer text-slate-500 bg-transparent border-0 p-0 text-left">ศูนย์สืบค้นองค์ความรู้ (KM Hub)</button></li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-center gap-4">
          <a
            href="https://lin.ee/xm7zN6c"
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 bg-white p-3 rounded-2xl border-2 border-emerald-500/40 shadow-sm w-fit shrink-0 text-center hover:border-emerald-500 hover:shadow-lg transition-all duration-300 cursor-pointer group block no-underline bg-gradient-to-b from-white to-emerald-50/30 hover:scale-102"
            title="กดเพื่อเปิดแอป LINE เพิ่มเพื่อน https://lin.ee/xm7zN6c"
          >
            <div className="relative inline-block">
              <img 
                src="/line_qr.png" 
                alt="LINE QR Code" 
                className="w-24 h-24 mx-auto rounded-xl object-contain border border-emerald-500/30 p-1.5 bg-white shadow-xs group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
                LINE 💬
              </span>
            </div>
            <div className="mt-2 space-y-1">
              <span className="text-xs block font-black text-emerald-700 tracking-wider">@vservice_line</span>
              <span className="inline-flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all group-hover:bg-emerald-600">
                💬 แอด LINE เพิ่มเพื่อน (คลิกที่นี่) ↗
              </span>
            </div>
          </a>
          <div className="space-y-1.5">
            <div className="font-bold text-slate-800">ดาวน์โหลดแอปช่าง vService</div>
            <div className="flex items-center gap-2">
              <span className="bg-slate-900 border border-slate-700 text-[10px] text-slate-300 font-semibold px-2 py-1 rounded select-none cursor-not-allowed">App Store</span>
              <span className="bg-slate-900 border border-slate-700 text-[10px] text-slate-300 font-semibold px-2 py-1 rounded select-none cursor-not-allowed">Google Play</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Webchat Button */}
      <div className="fixed bottom-5 right-5 z-150">
        <button
          onClick={() => setShowWebchat(!showWebchat)}
          className="w-14 h-14 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-full flex items-center justify-center shadow-2xl transition hover:scale-105 border-2 border-slate-900 cursor-pointer relative"
        >
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-ping"></span>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
          <MessageSquare className="h-6 w-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Webchat Drawer Panel */}
      {showWebchat && (
        <div className="fixed bottom-22 right-5 z-150 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-120 animate-fadeIn text-xs">
          {/* Header */}
          <div className="bg-slate-900 p-3.5 rounded-t-2xl flex justify-between items-center border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 leading-none">ห้องแชทช่างเทคนิค vFixQ</h4>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">ออนไลน์พร้อมช่วยเหลือเรื่องงานติดตั้ง</p>
              </div>
            </div>
            <button
              onClick={() => setShowWebchat(false)}
              className="text-slate-400 hover:text-white font-bold text-xs p-1 rounded-md hover:bg-slate-800 transition cursor-pointer border-0"
            >
              ✕
            </button>
          </div>

          {/* Message Feed */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 max-h-80 bg-slate-50 min-h-60 text-xs">
            {webchatMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[9px] font-bold text-slate-400 mb-0.5 px-1">{msg.name} ({msg.timestamp})</span>
                  <div
                    className={`p-2.5 rounded-2xl max-w-[80%] leading-relaxed ${
                      isUser
                        ? 'bg-amber-500 text-slate-900 font-medium rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Composer */}
          <form
            onSubmit={handleSendWebchat}
            className="p-2.5 border-t border-slate-200 bg-white rounded-b-2xl flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="พิมพ์ข้อความคุยกับช่างติดตั้ง..."
              value={webchatInput}
              onChange={(e) => setWebchatInput(e.target.value)}
              className="flex-1 v-input py-1.5 text-xs border-slate-200 bg-slate-100 rounded-lg"
            />
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 p-2 rounded-lg transition border-0 cursor-pointer shadow-xs"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
