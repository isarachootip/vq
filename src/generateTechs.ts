import type { Technician, TierLevel, TechnicianSkill } from './types';

export const generate200Technicians = (): Technician[] => {
  const firstNames = [
    'สมชาย', 'วิชัย', 'ประเสริฐ', 'อนันต์', 'กิตติพงษ์', 'สุรศักดิ์', 'ณัฐวุฒิ', 'ธนพล', 'ชัยวัฒน์', 'พงศกร',
    'สันติ', 'อภิสิทธิ์', 'ธีรพงษ์', 'วรวุฒิ', 'อนุชา', 'ศักดิ์ดา', 'พิษณุ', 'เอกชัย', 'สมศักดิ์', 'นพดล',
    'รังสรรค์', 'บรรจง', 'วีระ', 'สุรชัย', 'พรชัย', 'กิตติ', 'เกษม', 'นคร', 'ดนัย', 'ปรีชา',
    'สุเมธ', 'สรพงษ์', 'ทศพล', 'อาทิตย์', 'ทรงพล', 'วิษณุ', 'อรรถพล', 'ภาณุพงศ์', 'นรินทร์', 'วรเชษฐ์'
  ];

  const lastNames = [
    'รัตนประเสริฐ', 'วงศ์อนันต์', 'เดชอนันต์', 'เมธากุล', 'พานิชย์', 'ทองคำ', 'เจริญสุข', 'มั่นคง', 'สมบูรณ์', 'มงคล',
    'สุวรรณ', 'ชินวัตร', 'กิตติวัฒน์', 'ตั้งเจริญ', 'ศรีสุข', 'เลิศวิลัย', 'พัฒนา', 'อัมพร', 'ประเสริฐสุข', 'วงษ์สุวรรณ'
  ];

  const companySuffixes = [
    'การช่าง', 'อินสทอลเลอร์', 'เซอร์วิส & โซลูชัน', 'แอนด์ ทีม', 'เอ็นจิเนียริ่ง', 'การช่าง & ตกแต่ง',
    'โฮม เซอร์วิส', 'เทคทีม', 'มาสเตอร์ทีม', 'โปร เซอร์วิส'
  ];

  const zonesList = [
    { code: 'Z01-C1', name: '[BKK] กรุงเทพฯ ชั้นใน (เมืองเก่า / พญาไท - ราชเทวี)' },
    { code: 'Z01-C2', name: '[BKK] กรุงเทพฯ ชั้นใน (ศูนย์กลางธุรกิจ / สาทร - สีลม - บางรัก - พระราม 3)' },
    { code: 'Z01-C3', name: '[BKK] กรุงเทพฯ ชั้นใน (สุขุมวิท / ดินแดง - ห้วยขวาง - คลองเตย)' },
    { code: 'Z01-N1', name: '[BKK] กรุงเทพฯ เหนือตอนล่าง (จตุจักร - บางซื่อ - ลาดพร้าว)' },
    { code: 'Z01-N2', name: '[BKK] กรุงเทพฯ เหนือตอนบน (หลักสี่ - ดอนเมือง - สายไหม - บางเขน)' },
    { code: 'Z01-E1', name: '[BKK] กรุงเทพฯ ตะวันออก (บางกะปิ - บึงกุ่ม - สะพานสูง - วังทองหลาง - คันนายาว)' },
    { code: 'Z01-E2', name: '[BKK] กรุงเทพฯ ตะวันออกนอก (มีนบุรี - ลาดกระบัง - หนองจอก - คลองสามวา)' },
    { code: 'Z01-SE', name: '[BKK] กรุงเทพฯ ตะวันออกใต้ (ประเวศ - สวนหลวง - บางนา)' },
    { code: 'Z01-W1', name: '[BKK] กรุงเทพฯ ฝั่งธนบุรีเหนือ (ธนบุรี - คลองสาน - บางกอกน้อย - บางพลัด - ตลิ่งชัน - ทวีวัฒนา)' },
    { code: 'Z01-W2', name: '[BKK] กรุงเทพฯ ฝั่งธนบุรีใต้ (ภาษีเจริญ - บางแค - หนองแขม - ราษฎร์บูรณะ - ทุ่งครุ - จอมทอง - บางขุนเทียน - บางบอน)' },
    { code: 'Z02', name: '[BKK] นนทบุรี' },
    { code: 'Z03', name: '[BKK] ปทุมธานี' },
    { code: 'Z04', name: '[BKK] สมุทรปราการ' },
  ];

  const skillCategories = [
    'Air Condition & HVAC',
    'Built-in Furniture',
    'Electrical & Smart Home',
    'Flooring & Tile',
    'Plumbing & Sanitary',
    'Curtains & Wallpaper',
    'Roof & Waterproofing',
    'Solar Cell & EV Charger',
  ];

  const avatarUrls = [
    'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150',
  ];

  const branches = ['br-01', 'br-02', 'br-03', 'br-04', 'br-05'];

  const techs: Technician[] = [];

  for (let i = 1; i <= 200; i++) {
    const fName = firstNames[(i - 1) % firstNames.length];
    const lName = lastNames[(i * 3) % lastNames.length];
    const suffix = companySuffixes[(i * 7) % companySuffixes.length];
    const zoneObj = zonesList[(i - 1) % zonesList.length];
    const secZoneObj = zonesList[(i + 4) % zonesList.length];

    let tier: TierLevel = 'Silver';
    let status: 'Available' | 'On Job' | 'In Cooldown' | 'Offline' = 'Available';
    let penaltyPoints = 0;
    let activePenaltiesCount = 0;

    if (i % 10 === 0) {
      tier = 'Cooldown';
      status = 'In Cooldown';
      penaltyPoints = 40 + (i % 30);
      activePenaltiesCount = 1 + (i % 2);
    } else if (i % 3 === 0) {
      tier = 'Gold';
      status = i % 6 === 0 ? 'On Job' : 'Available';
    } else if (i % 5 === 0) {
      tier = 'Bronze';
      status = i % 15 === 0 ? 'Offline' : 'Available';
    } else {
      tier = 'Silver';
      status = i % 4 === 0 ? 'On Job' : 'Available';
    }

    const primarySkill = skillCategories[(i - 1) % skillCategories.length];
    const secondarySkill = skillCategories[(i + 2) % skillCategories.length];
    const skillsList: TechnicianSkill[] = [
      { category: primarySkill, level: (tier === 'Gold' ? 3 : (i % 2 === 0 ? 2 : 1)) as 1 | 2 | 3, isCertified: true },
      { category: secondarySkill, level: (i % 3 === 0 ? 2 : 1) as 1 | 2 | 3, isCertified: i % 2 === 0 }
    ];

    if (tier === 'Gold' && i % 2 === 0) {
      const thirdSkill = skillCategories[(i + 5) % skillCategories.length];
      skillsList.push({ category: thirdSkill, level: 2, isCertified: true });
    }

    const padId = String(i).padStart(3, '0');
    const techCode = `T-${tier.substring(0, 4).toUpperCase()}-${padId}`;
    const nameStr = i % 4 === 0 
      ? `บริษัท ${fName} ${suffix} จำกัด` 
      : `ทีมช่าง${fName} ${lName} (${suffix})`;

    techs.push({
      id: `tech-${padId}`,
      code: techCode,
      name: nameStr,
      phone: `08${(i % 9) + 1}-${String(100 + (i * 37) % 899).padStart(3, '0')}-${String(1000 + (i * 123) % 8999).padStart(4, '0')}`,
      avatar: avatarUrls[(i - 1) % avatarUrls.length],
      tier,
      rating: parseFloat((4.2 + (i % 75) * 0.01).toFixed(2)),
      completedJobs: 15 + ((i * 13) % 230),
      penaltyPoints,
      activePenaltiesCount,
      primaryZone: zoneObj.name,
      secondaryZones: [secZoneObj.name],
      skills: skillsList,
      dailyCapacityHours: 8,
      bookedHoursToday: status === 'On Job' ? 4 + (i % 4) : (status === 'Available' ? (i % 3) : 0),
      status,
      branchId: branches[i % branches.length],
      companyName: nameStr,
      companyType: i % 4 === 0 ? 'นิติบุคคล' : 'บุคคลธรรมดา',
      criminalRecord: 'ไม่มี',
    });
  }

  return techs;
};
