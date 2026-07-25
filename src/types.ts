export type TierLevel = 'Gold' | 'Silver' | 'Bronze' | 'Cooldown' | 'Suspended';

export type SkillCategory = 
  | 'Built-in Furniture' 
  | 'Flooring & Tile' 
  | 'Electrical & Smart Home' 
  | 'Plumbing & Sanitary' 
  | 'Air Condition & HVAC' 
  | 'Curtains & Wallpaper';

export interface Branch {
  id: string;
  code: string;
  name: string;
  province: string;
  status: 'Active' | 'Inactive';
  fullName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  openTime?: string;
  closeTime?: string;
  phone?: string;
  storeGroup?: string;
}

export interface Zone {
  id: string;
  code: string;
  name: string;
  description: string;
  coverageZipcodes: string[];
}

export interface Skill {
  id: string;
  code: string;
  category: SkillCategory;
  name: string;
  description: string;
  certificationRequired: boolean;
}

export interface TechnicianSkill {
  category: SkillCategory;
  level: 1 | 2 | 3; // 1: Basic, 2: Advanced, 3: Master
  isCertified: boolean;
}

export interface Technician {
  id: string;
  code: string;
  name: string;
  phone: string;
  avatar: string;
  tier: TierLevel;
  rating: number; // e.g. 4.8
  completedJobs: number;
  penaltyPoints: number; // 0-100 (100 = suspended)
  activePenaltiesCount: number;
  primaryZone: string; // e.g. "Zone 1: สุขุมวิท-บางนา"
  secondaryZones: string[];
  skills: TechnicianSkill[];
  dailyCapacityHours: number;
  bookedHoursToday: number;
  status: 'Available' | 'On Job' | 'In Cooldown' | 'Offline';
  branchId?: string; // Connected branch
}

export interface InstallationTypeConfig {
  id: string;
  name: string;
  category: SkillCategory;
  minSkillLevel: 1 | 2 | 3;
  requiredTeamSize: number;
  estDurationHours: number;
  description: string;
  badgeColor: string;
}

export interface TimeSlot {
  id: string;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "12:00"
  period: 'Morning' | 'Afternoon' | 'Full Day';
}

export interface QueueBooking {
  id: string;
  bookingRef: string;
  customerName: string;
  customerPhone: string;
  addressZone: string;
  installationTypeId: string;
  installationTypeName: string;
  requiredSkillLevel: 1 | 2 | 3;
  assignedTechTeamId?: string;
  assignedTechTeamName?: string;
  bookingDate: string;
  timeSlot: string;
  status: 'Pending Dispatch' | 'Scheduled' | 'Dispatched to KANNA' | 'STS In-Progress' | 'QC Inspection' | 'Passed (Closed)' | 'Penalty E-CN Issued';
  createdFrom: 'Selling Tools (E-ordering)' | 'Manual POS' | 'COOHOM Direct' | 'Vfixq Portal';
  createdAt: string;
  penaltyRef?: string;
  branchId?: string; // Branch associated with booking
}

export interface PenaltyRecord {
  id: string;
  eCnNumber: string;
  bookingRef: string;
  techId: string;
  techName: string;
  violationType: 'QC Defect / Failed Review' | 'Late Arrival (SLA Breach)' | 'Customer Complaint (<3 Stars)' | 'Property Damage' | 'Unapproved No-Show';
  fineAmountTHB: number;
  scoreDeduction: number;
  tierImpact: string;
  issuedAt: string;
  status: 'Active Penalty' | 'Resolved / Fine Paid' | 'Appealed';
  details: string;
}

export interface IntegrationEvent {
  id: string;
  timestamp: string;
  sourceSystem: 'Selling Tools' | 'Installer Management' | 'KANNA' | 'STS' | 'QC' | '1308 Cust. Sat' | 'Penalty System (E-CN)' | 'E-billing';
  targetSystem: 'Selling Tools' | 'Installer Management' | 'KANNA' | 'STS' | 'QC' | '1308 Cust. Sat' | 'Penalty System (E-CN)' | 'E-billing';
  action: string;
  payloadSummary: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface MatchWeights {
  baseMatch: number;
  levelBonus: number;
  primaryZone: number;
  secondaryZone: number;
  branchSync: number;
  goldTier: number;
  silverTier: number;
  ratingMultiplier: number;
  penaltyDivisor: number;
}

export interface SystemConfig {
  cooldownThreshold: number;
  suspensionThreshold: number;
  kannaApiUrl: string;
  stsWebhookUrl: string;
  qcInspectorUrl: string;
  eCnErpUrl: string;
}

export interface BranchAnnouncement {
  id: string;
  title: string;
  content: string;
  category: 'งานด่วน' | 'แจ้งเตือน' | 'อบรมระบบ' | 'ข่าวสาร';
  priority: 'สูง' | 'ปกติ';
  branchName: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'coordinator' | 'technician' | 'branch_manager' | 'customer';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'technician' | 'branch' | 'hotline';
  avatarInitials: string;
  lastMessage: string;
  unreadCount: number;
  messages: ChatMessage[];
  techId?: string;
}

export interface PortalBanner {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  campaignTag: string;
  isActive: boolean;
}

export interface TechnicianApplication {
  id: string;
  refNum: string;
  name: string;
  phone: string;
  lineId: string;
  zone: string;
  skills: string[];
  experience: string;
  avatarUrl?: string;
  status: 'reject' | 'accept' | 'approve' | 'sign contract' | 'employee';
  appliedAt: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  priceText: string;
  priceNumber: number;
  image: string;
  description: string;
  requiredSkillLevel: 1 | 2 | 3;
}
