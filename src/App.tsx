import { useState, useEffect } from 'react';
import { DashboardView } from './components/DashboardView';
import { SmartBookingView } from './components/SmartBookingView';
import { SkillMatrixView } from './components/SkillMatrixView';
import { IntegrationFlowView } from './components/IntegrationFlowView';
import { PenaltyAuditView } from './components/PenaltyAuditView';
import { BranchManager } from './components/BranchManager';
import { BranchMapView } from './components/BranchMapView';
import { ZoneManager } from './components/ZoneManager';
import { SkillManager } from './components/SkillManager';
import { KmHubView } from './components/KmHubView';
import { VfixqPortalView } from './components/VfixqPortalView';
import { BackendSettingsView } from './components/BackendSettingsView';
import { BranchAnnouncementsView } from './components/BranchAnnouncementsView';
import { InternalChatView } from './components/InternalChatView';
import { BannerManagerView } from './components/BannerManagerView';
import { TechApplicationsView } from './components/TechApplicationsView';
import { ServiceCatalogManagerView } from './components/ServiceCatalogManagerView';

import type { Technician, QueueBooking, PenaltyRecord, Branch, Zone, Skill, BranchAnnouncement, ChatMessage, ChatChannel, PortalBanner, TechnicianApplication, TechnicianSkill, SkillCategory, ServiceItem } from './types';
import { 
  INITIAL_TECHNICIANS, 
  INITIAL_BOOKINGS, 
  INITIAL_PENALTIES,
  INITIAL_BRANCHES,
  INITIAL_ZONES,
  INITIAL_SKILLS 
} from './mockData';

import { 
  LayoutDashboard, 
  Calendar, 
  Building, 
  Users, 
  Map, 
  MapPin,
  Wrench, 
  Cpu, 
  ShieldAlert, 
  RefreshCw, 
  Menu,
  ChevronRight,
  BookOpen,
  ShoppingBag,
  Settings,
  Megaphone,
  MessageSquare,
  Image as ImageIcon,
  FileText,
  Briefcase
} from 'lucide-react';

const INITIAL_BANNERS: PortalBanner[] = [
  {
    id: 'banner-1',
    imageUrl: 'https://storage.googleapis.com/prod-qchang-v1/coupon/upload/20260720/20260720182034Banner%20-%20Shera%20SPC%2021-31%20Jul26-Web%20900x900.png',
    title: 'โปรโมชั่นติดตั้งพื้นไม้ SPC เกรดพรีเมียม Shera',
    description: 'รับโปรโมชันจองช่างขยายประกันเพิ่ม 365 วัน ฟรีบริการพ่นน้ำยาโอโซนฆ่าเชื้อโรค มูลค่า 350.-',
    campaignTag: 'Campaign',
    isActive: true
  }
];

const INITIAL_TECH_APPLICATIONS: TechnicianApplication[] = [
  {
    id: 'app-1',
    refNum: 'AP-T-582012',
    name: 'ช่างอำนาจ ยอดฝีมือ',
    phone: '0899998888',
    lineId: 'amnart_cool',
    zone: 'Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา - ประเวศ)',
    skills: ['ระบบปรับอากาศ (ล้าง/ติดตั้ง)', 'งานไฟฟ้าและเครื่องใช้ไฟฟ้า'],
    experience: '3-5 ปี',
    avatarUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
    status: 'accept',
    appliedAt: '2026-07-24 14:30'
  },
  {
    id: 'app-2',
    refNum: 'AP-T-239108',
    name: 'ช่างสมหมาย การไฟฟ้า',
    phone: '0851112222',
    lineId: 'sommai_volt',
    zone: 'Zone 2: นนทบุรี - ปทุมธานี (ราชพฤกษ์ - แจ้งวัฒนะ)',
    skills: ['งานไฟฟ้าและเครื่องใช้ไฟฟ้า', 'งานประปาและห้องน้ำ'],
    experience: 'มากกว่า 5 ปี',
    avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150',
    status: 'approve',
    appliedAt: '2026-07-25 09:15'
  }
];

const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 'inst-aircon-multi',
    name: 'บริการติดตั้งเครื่องปรับอากาศ Multi-Split (3 เครื่อง)',
    category: 'ระบบปรับอากาศ',
    priceText: 'เริ่มต้น 3,500 บาท',
    priceNumber: 3500,
    image: '/ac_service_1784935924336.jpg',
    description: 'บริการเดินท่อน้ำยาคอมเพรสเซอร์ แขวนคอยล์เย็น ติดตั้งขาแขวนแอร์ภายนอก และเทสแรงดันระบบน้ำยาแอร์ R32 ประกันการทำงาน 180 วัน',
    requiredSkillLevel: 3
  },
  {
    id: 'inst-built-kitchen',
    name: 'บริการติดตั้งชุดครัว Built-in Master (ชุดใหญ่)',
    category: 'เฟอร์นิเจอร์ Fit-In',
    priceText: 'เริ่มต้น 12,000 บาท',
    priceNumber: 12000,
    image: '/kitchen_service_1784935953733.jpg',
    description: 'ประกอบตู้ลอยและตู้ตั้งพื้น Built-in, ติดตั้งหินแกรนิตท็อปครัว, ต่อช่องดูดควันเจาะหน้ากากระบาย และจัดบานพับ Soft-close ตั้งองศาระดับสูงสุด',
    requiredSkillLevel: 3
  },
  {
    id: 'inst-built-closet',
    name: 'บริการติดตั้งตู้เสื้อผ้า Walk-in Closet',
    category: 'เฟอร์นิเจอร์ Fit-In',
    priceText: 'เริ่มต้น 4,500 บาท',
    priceNumber: 4500,
    image: '/kitchen_service_1784935953733.jpg',
    description: 'ประกอบตู้เสื้อโครงสร้างอะลูมิเนียม หน้ากระจกเทมเปอร์ แขวนรางเลื่อน และซ่อนระบบไฟ LED หรูหราส่องสว่างใต้ชั้นวาง',
    requiredSkillLevel: 2
  },
  {
    id: 'inst-flooring-laminate',
    name: 'บริการปูพื้นไม้สำเร็จรูป SPC (เกรดนำเข้า)',
    category: 'พื้น ผนัง และฝ้าเพดาน',
    priceText: 'เริ่มต้น 450 บาท / ตร.ม.',
    priceNumber: 450,
    image: '/flooring_service_1784935940227.jpg',
    description: 'ปรับระดับหน้าดิน/ปูนเดิม รองแผ่นโฟมหนากันความชื้น ติดตั้งแผ่นพื้น SPC แบรนด์นำเข้า ล็อกแน่นสนิท ทนน้ำและรอยขีดข่วน 100%',
    requiredSkillLevel: 2
  },
  {
    id: 'inst-smart-home',
    name: 'บริการติดตั้งระบบ Smart Home & Digital Lock',
    category: 'Smart living',
    priceText: 'เริ่มต้น 1,800 บาท',
    priceNumber: 1800,
    image: '/ac_service_1784935924336.jpg',
    description: 'ติดตั้งระบบล็อกประตูดิจิทัล (Digital Door Lock) บนประตูชนิดไม้หรือโลหะ เซ็ตระบบ Wi-Fi และเชื่อมเกตเวย์ผ่านสมาร์ทโฟน',
    requiredSkillLevel: 2
  },
  {
    id: 'inst-curtains-motor',
    name: 'บริการติดตั้งผ้าม่านมอเตอร์ไฟฟ้า + วอลเปเปอร์',
    category: 'อื่น ๆ',
    priceText: 'เริ่มต้น 3,200 บาท',
    priceNumber: 3200,
    image: '/flooring_service_1784935940227.jpg',
    description: 'ติดตั้งผ้าม่านพับ/ผ้าม่านรางมอเตอร์ เชื่อมต่อ Smart Home สั่งงานด้วยเสียง พร้อมปูวอลเปเปอร์กาวในตัวเกรดพรีเมียม',
    requiredSkillLevel: 1
  }
];

const INITIAL_ANNOUNCEMENTS: BranchAnnouncement[] = [
  {
    id: 'ann-1',
    title: 'ด่วนที่สุด! ต้องการทีมช่างแอร์ 2 ทีม ประจำโซนบางนา-ประเวศ',
    content: 'มีงานติดตั้งคิวงานแอร์ Multi-Split ค้างจ่ายงานด่วน ช่างที่มีทักษะติดตั้งเลเวล 3 และมีเครื่องมือพร้อมเข้างาน โพสต์จองคิวชาร์จงานได้ทันที ติดต่อ Call Center 1308 หรือแอดมินสาขาบางนา',
    category: 'งานด่วน',
    priority: 'สูง',
    branchName: 'ไทวัสดุ บางนา',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ann-2',
    title: 'ประกาศแจ้งการลงสนามอบรมโปรแกรม STS เวอร์ชัน 2.0 สัปดาห์หน้า',
    content: 'ขอเชิญหัวหน้าทีมช่างติดตั้งเข้าร่วมอบรมทดสอบการบันทึกสถานะ Check-in และถ่ายภาพส่งมอบงานในระบบ STS เพื่อหลีกเลี่ยงการโดนหักแต้ม E-CN วันพฤหัสบดีนี้ ณ ห้องประชุมชั้น 6 เกตเวย์ บางซื่อ',
    category: 'อบรมระบบ',
    priority: 'ปกติ',
    branchName: 'สำนักงานใหญ่',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const INITIAL_CHANNELS: ChatChannel[] = [
  {
    id: 'ch-1',
    name: 'ช่างประวิทย์ (แอร์ด่วน AC-01)',
    type: 'technician',
    avatarInitials: 'PW',
    lastMessage: 'ผมกำลังเดินทางเข้าหน้านัดหมายติดตั้งครับ',
    unreadCount: 1,
    techId: 'tech-01',
    messages: [
      { id: 'm1', sender: 'technician', senderName: 'ช่างประวิทย์', text: 'สวัสดีครับแอดมิน มีใบสั่งงานติดตั้งเข้ามาในระบบ STS แล้วครับ', timestamp: '10:15' },
      { id: 'm2', sender: 'coordinator', senderName: 'Coordinator 1308', text: 'สวัสดีค่ะช่างประวิทย์ งานติดตั้งแอร์ Multi-Split มีการแนบชุดประกันและพ่นฆ่าเชื้อฆ่าแบคทีเรียด้วยนะคะ รบกวนตรวจเช็กรายการด้วยค่ะ', timestamp: '10:20' },
      { id: 'm3', sender: 'technician', senderName: 'ช่างประวิทย์', text: 'รับทราบครับ กำลังเดินทางเข้าหน้านัดหมายติดตั้งครับ', timestamp: '10:25' }
    ]
  },
  {
    id: 'ch-2',
    name: 'คุณวิมล (แอดมินสาขาบางนา)',
    type: 'branch',
    avatarInitials: 'WM',
    lastMessage: 'ระบบตรวจสอบการชาร์จงานจาก Vfixq Portal เข้ามาเรียบร้อยแล้วค่ะ',
    unreadCount: 0,
    messages: [
      { id: 'm4', sender: 'branch_manager', senderName: 'แอดมินวิมล', text: 'ประสานงานค่ะ ใบสั่งงานคิวติดตั้ง SPC Flooring มีช่างรับหรือยังคะ?', timestamp: '09:00' },
      { id: 'm5', sender: 'coordinator', senderName: 'Coordinator 1308', text: 'กำลังรันระบบจับคู่ Match Score อัจฉริยะค่ะ ช่างสมคิดตอบรับแล้วค่ะ', timestamp: '09:10' },
      { id: 'm6', sender: 'branch_manager', senderName: 'แอดมินวิมล', text: 'โอเคค่ะ ระบบตรวจสอบการชาร์จงานจาก Vfixq Portal เข้ามาเรียบร้อยแล้วค่ะ', timestamp: '09:15' }
    ]
  }
];

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Data States
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [skills, setSkills] = useState<Skill[]>(INITIAL_SKILLS);
  const [technicians, setTechnicians] = useState<Technician[]>(INITIAL_TECHNICIANS);
  const [bookings, setBookings] = useState<QueueBooking[]>(INITIAL_BOOKINGS);
  const [penalties, setPenalties] = useState<PenaltyRecord[]>(INITIAL_PENALTIES);

  // Communication States
  const [announcements, setAnnouncements] = useState<BranchAnnouncement[]>(INITIAL_ANNOUNCEMENTS);
  const [chatChannels, setChatChannels] = useState<ChatChannel[]>(INITIAL_CHANNELS);
  const [banners, setBanners] = useState<PortalBanner[]>(INITIAL_BANNERS);
  const [techApplications, setTechApplications] = useState<TechnicianApplication[]>(INITIAL_TECH_APPLICATIONS);
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);

  // Configuration States
  const [matchWeights, setMatchWeights] = useState<any>({
    baseMatch: 40,
    levelBonus: 10,
    primaryZone: 15,
    secondaryZone: 5,
    branchSync: 15,
    goldTier: 10,
    silverTier: 5,
    ratingMultiplier: 10,
    penaltyDivisor: 5
  });

  const [systemConfig, setSystemConfig] = useState<any>({
    cooldownThreshold: 45,
    suspensionThreshold: 90,
    kannaApiUrl: 'https://api.kanna.io/v1/projects',
    stsWebhookUrl: 'https://sts-api.vservice.co.th/webhooks/checkin',
    qcInspectorUrl: 'https://qc-inspect.vservice.co.th/api/audits',
    eCnErpUrl: 'https://erp.vservice.co.th/ecn/billing'
  });
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isBackend, setIsBackend] = useState<boolean>(() => {
    return window.location.pathname.startsWith('/backend');
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setIsBackend(window.location.pathname.startsWith('/backend'));
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateToBackend = (route: boolean) => {
    const path = route ? '/backend' : '/';
    window.history.pushState({}, '', path);
    setIsBackend(route);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Stats
  const activeTechsCount = technicians.filter((t) => t.status === 'Available').length;
  const pendingBookingsCount = bookings.filter((b) => b.status === 'Pending Dispatch' || b.status === 'Scheduled').length;
  const activePenaltiesCount = penalties.filter((p) => p.status === 'Active Penalty').length;

  // Handlers for Branch
  const handleAddBranch = (branch: Branch) => {
    setBranches((prev) => [...prev, branch]);
    showToast(`เพิ่มสาขา ${branch.name} สำเร็จ`);
  };

  const handleAddAnnouncement = (newAnn: BranchAnnouncement) => {
    setAnnouncements((prev) => [newAnn, ...prev]);
    showToast('เผยแพร่ประกาศสาขาสำเร็จ!');
  };

  const handleAddBanner = (newBanner: PortalBanner) => {
    setBanners((prev) => [...prev, newBanner]);
    showToast('สร้างแบนเนอร์ประชาสัมพันธ์ใหม่สำเร็จ!');
  };

  const handleUpdateBanner = (updated: PortalBanner) => {
    setBanners((prev) => 
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
    showToast('ปรับปรุงข้อมูลแบนเนอร์เรียบร้อย');
  };

  const handleDeleteBanner = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    showToast('ลบแบนเนอร์ออกเรียบร้อยแล้ว');
  };

  const handleAddService = (newService: ServiceItem) => {
    setServices((prev) => [...prev, newService]);
    showToast(`เพิ่มบริการ ${newService.name} สำเร็จ!`);
  };

  const handleUpdateService = (updated: ServiceItem) => {
    setServices((prev) => 
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
    showToast(`แก้ไขข้อมูลบริการ ${updated.name} เรียบร้อยแล้ว`);
  };

  const handleDeleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    showToast('ลบบริการงานติดตั้งออกจากระบบแล้ว');
  };

  const handleRegisterTechnician = (appData: {
    name: string;
    phone: string;
    lineId: string;
    zone: string;
    skills: string[];
    experience: string;
    avatarUrl?: string;
    refNum: string;
  }) => {
    const newApp: TechnicianApplication = {
      id: `app-${Date.now()}`,
      refNum: appData.refNum,
      name: appData.name,
      phone: appData.phone,
      lineId: appData.lineId,
      zone: appData.zone,
      skills: appData.skills,
      experience: appData.experience,
      avatarUrl: appData.avatarUrl || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
      status: 'accept',
      appliedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setTechApplications((prev) => [newApp, ...prev]);
  };

  const handleUpdateTechAppStatus = (id: string, newStatus: TechnicianApplication['status']) => {
    setTechApplications((prev) => 
      prev.map((app) => {
        if (app.id === id) {
          if (newStatus === 'employee' && app.status !== 'employee') {
            // Promoted to active technician
            const mappedSkills: TechnicianSkill[] = app.skills.map((s) => {
              let category: SkillCategory = 'Electrical & Smart Home';
              if (s.includes('ปรับอากาศ')) category = 'Air Condition & HVAC';
              else if (s.includes('ไฟฟ้า')) category = 'Electrical & Smart Home';
              else if (s.includes('บิลต์อิน') || s.includes('เฟอร์นิเจอร์')) category = 'Built-in Furniture';
              else if (s.includes('ปูพื้น') || s.includes('ผนัง')) category = 'Flooring & Tile';
              else if (s.includes('ประปา') || s.includes('ห้องน้ำ')) category = 'Plumbing & Sanitary';
              else if (s.includes('รีโนเวท') || s.includes('ต่อเติม')) category = 'Built-in Furniture';

              return {
                category,
                level: 2,
                isCertified: true
              };
            });

            const techNum = Math.floor(100 + Math.random() * 900);
            const newTech: Technician = {
              id: `tech-${techNum}`,
              code: `T-${techNum}`,
              name: app.name,
              phone: app.phone,
              avatar: app.avatarUrl || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
              rating: 4.5,
              skills: mappedSkills,
              status: 'Available',
              tier: 'Silver',
              completedJobs: 0,
              penaltyPoints: 0,
              activePenaltiesCount: 0,
              primaryZone: app.zone,
              secondaryZones: [],
              dailyCapacityHours: 8,
              bookedHoursToday: 0,
              branchId: 'br-1', // Default Bangkok head branch
            };
            setTechnicians((prevTechs) => [...prevTechs, newTech]);
            showToast(`🎉 บรรจุช่าง ${app.name} เข้าระบบและอัปเดตรายชื่อในทะเบียนช่างเรียบร้อย!`);
          } else {
            showToast(`ปรับปรุงสถานะใบสมัครช่างเป็น ${newStatus} เรียบร้อยแล้ว`);
          }
          return { ...app, status: newStatus };
        }
        return app;
      })
    );
  };

  const handleDeleteTechApplication = (id: string) => {
    setTechApplications((prev) => prev.filter((a) => a.id !== id));
    showToast('ลบเอกสารใบสมัครช่างเรียบร้อยแล้ว');
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    showToast('ลบประกาศสาขาเรียบร้อยแล้ว');
  };

  const handleSendMessage = (channelId: string, text: string) => {
    setChatChannels((prev) => 
      prev.map((c) => {
        if (c.id === channelId) {
          const newMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            sender: 'coordinator',
            senderName: 'Coordinator 1308',
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          return {
            ...c,
            lastMessage: text,
            unreadCount: 0,
            messages: [...c.messages, newMsg]
          };
        }
        return c;
      })
    );
  };

  const handleAddMultipleBranches = (newBranches: Branch[]) => {
    setBranches((prev) => [...prev, ...newBranches]);
    showToast(`นำเข้าข้อมูลสาขาสำเร็จ ${newBranches.length} รายการ`);
  };

  const handleDeleteBranch = (id: string) => {
    setBranches((prev) => prev.filter((b) => b.id !== id));
    showToast('ลบข้อมูลสาขาสำเร็จ');
  };

  // Handlers for Zone
  const handleAddZone = (zone: Zone) => {
    setZones((prev) => [...prev, zone]);
    showToast(`เพิ่มโซน ${zone.name} เรียบร้อยแล้ว`);
  };

  const handleAddMultipleZones = (newZones: Zone[]) => {
    setZones((prev) => [...prev, ...newZones]);
    showToast(`นำเข้าข้อมูลโซนสำเร็จ ${newZones.length} รายการ`);
  };

  const handleDeleteZone = (id: string) => {
    setZones((prev) => prev.filter((z) => z.id !== id));
    showToast('ลบข้อมูลโซนสำเร็จ');
  };

  // Handlers for Skill
  const handleAddSkill = (skill: Skill) => {
    setSkills((prev) => [...prev, skill]);
    showToast(`เพิ่มทักษะ ${skill.name} เรียบร้อยแล้ว`);
  };

  const handleAddMultipleSkills = (newSkills: Skill[]) => {
    setSkills((prev) => [...prev, ...newSkills]);
    showToast(`นำเข้าข้อมูลทักษะสำเร็จ ${newSkills.length} รายการ`);
  };

  const handleDeleteSkill = (id: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== id));
    showToast('ลบข้อมูลทักษะสำเร็จ');
  };

  // Handlers for Technician
  const handleAddMultipleTechnicians = (newTechs: Technician[]) => {
    setTechnicians((prev) => [...prev, ...newTechs]);
    showToast(`นำเข้าข้อมูลทีมช่างสำเร็จ ${newTechs.length} ทีม`);
  };

  const handleDeleteTechnician = (id: string) => {
    setTechnicians((prev) => prev.filter((t) => t.id !== id));
    showToast('ลบข้อมูลทีมช่างสำเร็จ');
  };

  const handleConfirmBooking = (newBooking: QueueBooking) => {
    setBookings((prev) => [newBooking, ...prev]);
    showToast(`เพิ่มคิวงานติดตั้งใหม่ ${newBooking.bookingRef} เรียบร้อยแล้ว`);
  };

  const handleDispatchToKanna = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'Dispatched to KANNA' } : b))
    );
    showToast('ส่งข้อมูลงานติดตั้งไปยังระบบ KANNA (Project Flow) เรียบร้อยแล้ว');
  };

  const handleUpdateTechnician = (updatedTech: Technician) => {
    setTechnicians((prev) => prev.map((t) => (t.id === updatedTech.id ? updatedTech : t)));
    showToast(`อัปเดตข้อมูลและ Skill ของ ${updatedTech.name} เรียบร้อยแล้ว`);
  };

  const handleTriggerPenaltyEvent = (
    techId: string,
    bookingRef: string,
    violationType: string,
    fine: number,
    points: number,
    details: string
  ) => {
    const tech = technicians.find((t) => t.id === techId);
    if (!tech) return;

    const eCnNum = `ECN-2026-0723-${Math.floor(Math.random() * 90 + 10)}`;
    const newPenalty: PenaltyRecord = {
      id: `pen-${Date.now()}`,
      eCnNumber: eCnNum,
      bookingRef,
      techId: tech.id,
      techName: tech.name,
      violationType: violationType as any,
      fineAmountTHB: fine,
      scoreDeduction: points,
      tierImpact: 'ปรับลดเป็น Cooldown / พักงานชั่วคราว',
      issuedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Active Penalty',
      details,
    };

    setPenalties((prev) => [newPenalty, ...prev]);

    // Update technician status & points in real time
    setTechnicians((prev) =>
      prev.map((t) => {
        if (t.id === techId) {
          const newPts = t.penaltyPoints + points;
          return {
            ...t,
            penaltyPoints: newPts,
            tier: 'Cooldown',
            status: 'In Cooldown',
            activePenaltiesCount: t.activePenaltiesCount + 1,
          };
        }
        return t;
      })
    );

    // Update booking status
    setBookings((prev) =>
      prev.map((b) => (b.bookingRef === bookingRef ? { ...b, status: 'Penalty E-CN Issued', penaltyRef: eCnNum } : b))
    );

    showToast(`ออก E-CN ${eCnNum} สำหรับ ${tech.name} ปรับ ${fine} บาท & พักคิวงานสำเร็จ!`);
  };

  const handleRewardTechnician = (techId: string) => {
    setTechnicians((prev) =>
      prev.map((t) => {
        if (t.id === techId) {
          return {
            ...t,
            rating: Math.min(5.0, Number((t.rating + 0.05).toFixed(2))),
            completedJobs: t.completedJobs + 1,
          };
        }
        return t;
      })
    );
    showToast('มอบคะแนนโบนัสความพึงพอใจ 5 ดาวให้ทีมช่างเรียบร้อย!');
  };

  const handleResetData = () => {
    setBranches(INITIAL_BRANCHES);
    setZones(INITIAL_ZONES);
    setSkills(INITIAL_SKILLS);
    setTechnicians(INITIAL_TECHNICIANS);
    setBookings(INITIAL_BOOKINGS);
    setPenalties(INITIAL_PENALTIES);
    showToast('รีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้นเรียบร้อยแล้ว');
  };

  // Sidebar Menu Items Definition
  const menuItems = [
    { id: 'dashboard', label: 'ตารางคิวงานติดตั้ง', icon: LayoutDashboard },
    { id: 'vfixq-portal', label: 'จองบริการ (Vfixq Portal)', icon: ShoppingBag },
    { id: 'smart-booking', label: 'จองคิวช่างอัจฉริยะ', icon: Calendar },
    { id: 'divider-1', label: 'ข้อมูลระบบหลัก (Master)', isDivider: true },
    { id: 'branch-manager', label: 'ข้อมูลสาขา (Branch)', icon: Building },
    { id: 'branch-map', label: 'แผนที่สาขา (All-Store Map)', icon: MapPin },
    { id: 'tech-manager', label: 'ข้อมูลช่าง & Skill Matrix', icon: Users },
    { id: 'tech-applications', label: 'จัดการใบสมัครช่าง (Recruitment)', icon: FileText },
    { id: 'zone-manager', label: 'ข้อมูลพื้นที่และโซน (Zone)', icon: Map },
    { id: 'skill-manager', label: 'ข้อมูลทักษะช่าง (Skill)', icon: Wrench },
    { id: 'divider-2', label: 'จำลองผลลัพธ์', isDivider: true },
    { id: 'integration-flow', label: 'Integration Simulator', icon: Cpu },
    { id: 'penalty-audit', label: 'รายการลงโทษ E-CN', icon: ShieldAlert },
    { id: 'branch-announcements', label: 'ประกาศสาขา (Board)', icon: Megaphone },
    { id: 'internal-chat', label: 'ห้องแชทประสานงาน', icon: MessageSquare },
    { id: 'banner-manager', label: 'จัดการแบนเนอร์ (Banners)', icon: ImageIcon },
    { id: 'service-catalog-manager', label: 'จัดการบริการติดตั้ง (CRUD)', icon: Briefcase },
    { id: 'settings', label: 'การตั้งค่าระบบ (Configs)', icon: Settings },
    { id: 'divider-3', label: 'เอกสารเรียนรู้', isDivider: true },
    { id: 'km-hub', label: 'คู่มือระบบ & FAQ (KM)', icon: BookOpen },
  ];

  if (!isBackend) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans flex flex-col">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded bg-blue-600 text-white font-bold text-xs shadow-lg border border-blue-400 animate-slideUp">
            {toastMessage}
          </div>
        )}
        
        {/* Vfixq Portal view (Full Screen) */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
          <VfixqPortalView
            branches={branches}
            banners={banners}
            onRegisterTechnician={handleRegisterTechnician}
            services={services}
            onConfirmBooking={(b) => {
              handleConfirmBooking(b);
              showToast('สร้างคิวติดตั้งงานและคำนวณ Match Score สำเร็จ!');
            }}
            onNavigateToTab={(tabId) => {
              setActiveTab(tabId);
              navigateToBackend(true);
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 antialiased font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded bg-blue-600 text-white font-bold text-xs shadow-lg border border-blue-400 animate-slideUp">
          {toastMessage}
        </div>
      )}

      {/* LEFT SIDEBAR Layout */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-xs">
        <div>
          {/* Top Logo Panel */}
          <div className="p-5 border-b border-slate-200 flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded bg-amber-500 flex items-center justify-center shadow-sm">
              <Wrench className="h-4.5 w-4.5 text-slate-900" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight">vService</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Installer System</p>
            </div>
          </div>

          {/* Quick Stats Widget inside Sidebar */}
          <div className="p-4 mx-3 my-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs space-y-1.5 shadow-xs">
            <div className="flex justify-between items-center">
              <span>ช่างพร้อมใช้งาน:</span>
              <span className="font-bold text-emerald-600">{activeTechsCount} ทีม</span>
            </div>
            <div className="flex justify-between items-center">
              <span>งานจองรอดำเนินการ:</span>
              <span className="font-bold text-blue-600">{pendingBookingsCount} คิว</span>
            </div>
            <div className="flex justify-between items-center">
              <span>โทษปรับ Active E-CN:</span>
              <span className="font-bold text-rose-600">{activePenaltiesCount} รายการ</span>
            </div>
          </div>

          {/* Go to storefront button */}
          <div className="px-3 mb-2">
            <button
              onClick={() => navigateToBackend(false)}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>ดูหน้าเว็บลูกค้า (Storefront)</span>
            </button>
          </div>

          {/* Menu Items List */}
          <nav className="px-3 py-2 space-y-0.5">
            {menuItems.map((item) => {
              if (item.isDivider) {
                return (
                  <div key={item.id} className="pt-4 pb-1.5 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {item.label}
                  </div>
                );
              }

              const Icon = item.icon!;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'vfixq-portal') {
                      navigateToBackend(false);
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs md:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-700 border-l-4 border-amber-500 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="h-3 w-3 text-amber-500" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-300">
              AD
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-700">Administrator</p>
              <p className="text-[9px] text-slate-400 font-mono">vService Portal</p>
            </div>
          </div>
          <button
            onClick={handleResetData}
            title="รีเซ็ตข้อมูล Mock ทั้งหมด"
            className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Workspace Top Header Bar */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center space-x-2">
            <Menu className="h-5 w-5 text-slate-400 md:hidden" />
            <h2 className="text-sm md:text-base font-bold text-slate-800 font-sans">
              {menuItems.find((item) => item.id === activeTab)?.label || 'Workspace'}
            </h2>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
            <span>สภาพแวดล้อม: <strong className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">ระบบจำลอง (Simulator)</strong></span>
            <span>|</span>
            <span>วันที่ระบบ: <strong className="text-slate-700">23 กรกฎาคม 2026</strong></span>
          </div>
        </header>

        {/* Workspace Scrollable Workarea */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              bookings={bookings}
              technicians={technicians}
              services={services}
              onDispatchToKanna={handleDispatchToKanna}
              onSelectBookingForSim={() => {
                setActiveTab('integration-flow');
              }}
              onConfirmBooking={(b) => {
                handleConfirmBooking(b);
                showToast('บันทึกข้อมูลคิวติดตั้งใหม่ด้วยตนเองสำเร็จ!');
              }}
            />
          )}

          {activeTab === 'smart-booking' && (
            <SmartBookingView
              technicians={technicians}
              branches={branches}
              matchWeights={matchWeights}
              systemConfig={systemConfig}
              onConfirmBooking={(b) => {
                handleConfirmBooking(b);
                setActiveTab('dashboard');
              }}
            />
          )}

          {activeTab === 'branch-manager' && (
            <BranchManager
              branches={branches}
              onAddBranch={handleAddBranch}
              onAddMultipleBranches={handleAddMultipleBranches}
              onDeleteBranch={handleDeleteBranch}
            />
          )}

          {activeTab === 'branch-map' && (
            <BranchMapView branches={branches} />
          )}

          {activeTab === 'tech-manager' && (
            <SkillMatrixView
              technicians={technicians}
              branches={branches}
              onUpdateTechnician={handleUpdateTechnician}
              onAddMultipleTechnicians={handleAddMultipleTechnicians}
              onDeleteTechnician={handleDeleteTechnician}
            />
          )}

          {activeTab === 'zone-manager' && (
            <ZoneManager
              zones={zones}
              onAddZone={handleAddZone}
              onAddMultipleZones={handleAddMultipleZones}
              onDeleteZone={handleDeleteZone}
            />
          )}

          {activeTab === 'skill-manager' && (
            <SkillManager
              skills={skills}
              onAddSkill={handleAddSkill}
              onAddMultipleSkills={handleAddMultipleSkills}
              onDeleteSkill={handleDeleteSkill}
            />
          )}

          {activeTab === 'integration-flow' && (
            <IntegrationFlowView
              bookings={bookings}
              technicians={technicians}
              onTriggerPenaltyEvent={handleTriggerPenaltyEvent}
              onRewardTechnician={handleRewardTechnician}
            />
          )}

          {activeTab === 'penalty-audit' && (
            <PenaltyAuditView penalties={penalties} />
          )}

          {activeTab === 'km-hub' && (
            <KmHubView />
          )}

          {activeTab === 'vfixq-portal' && (
            <VfixqPortalView
              branches={branches}
              banners={banners}
              onRegisterTechnician={handleRegisterTechnician}
              services={services}
              onConfirmBooking={handleConfirmBooking}
              onNavigateToTab={(tabId) => setActiveTab(tabId)}
            />
          )}

          {activeTab === 'settings' && (
            <BackendSettingsView
              matchWeights={matchWeights}
              onUpdateMatchWeights={setMatchWeights}
              systemConfig={systemConfig}
              onUpdateSystemConfig={setSystemConfig}
            />
          )}

          {activeTab === 'service-catalog-manager' && (
            <ServiceCatalogManagerView
              services={services}
              onAddService={handleAddService}
              onUpdateService={handleUpdateService}
              onDeleteService={handleDeleteService}
            />
          )}

          {activeTab === 'tech-applications' && (
            <TechApplicationsView
              applications={techApplications}
              onUpdateStatus={handleUpdateTechAppStatus}
              onDeleteApplication={handleDeleteTechApplication}
            />
          )}

          {activeTab === 'branch-announcements' && (
            <BranchAnnouncementsView
              announcements={announcements}
              onAddAnnouncement={handleAddAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              branches={branches}
            />
          )}

          {activeTab === 'internal-chat' && (
            <InternalChatView
              channels={chatChannels}
              onSendMessage={handleSendMessage}
              technicians={technicians}
              branches={branches}
            />
          )}

          {activeTab === 'banner-manager' && (
            <BannerManagerView
              banners={banners}
              onAddBanner={handleAddBanner}
              onUpdateBanner={handleUpdateBanner}
              onDeleteBanner={handleDeleteBanner}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
