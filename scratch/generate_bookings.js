import fs from 'fs';
import path from 'path';

// Load mockData.ts or inspect it
const mockDataPath = 'c:\\atgv\\vq\\src\\mockData.ts';
let mockDataText = fs.readFileSync(mockDataPath, 'utf8');

// Thai names for mock customers
const thaiNames = [
  'คุณวิรัตน์ มงคลสุวรรณ',
  'คุณศิริพร ตั้งเจริญ',
  'คุณอนันต์ แสนสุข',
  'คุณสิริมา รัตนประเสริฐ',
  'คุณพิศาล เมธากุล',
  'คุณปิ่นเกล้า แก้วดี',
  'คุณจตุพล รุ่งวิทยา',
  'คุณณิชา โฮมอินเตอร์',
  'คุณพงศธร มั่นคง',
  'คุณกิตติ วิริยะชัย',
  'คุณลลิตา อรุณสวัสดิ์',
  'คุณธนภัทร รุ่งเรือง',
  'คุณเกรียงไกร สมบูรณ์',
  'คุณวิลาวัลย์ เจริญสุข',
  'คุณชัยสิทธิ์ โปรเซอร์วิส',
  'คุณนลินี แสนสุวรรณ'
];

// Tech mapping
const techs = [
  { id: 'tech-001', name: 'ทีมช่างสมชาย เมธากุล (เทคทีม)', branchId: 'br-01' },
  { id: 'tech-002', name: 'ทีมช่างวิชัย เจริญสุข (เอ็นจิเนียริ่ง)', branchId: 'br-02' },
  { id: 'tech-003', name: 'ทีมช่างประเสริฐ มงคล (อินสทอลเลอร์)', branchId: 'br-03' },
  { id: 'tech-004', name: 'บริษัท อนันต์ มาสเตอร์ทีม จำกัด', branchId: 'br-04' },
  { id: 'tech-005', name: 'ทีมช่างกิตติพงษ์ เลิศวิลัย (การช่าง & ตกแต่ง)', branchId: 'br-05' },
  { id: 'tech-006', name: 'ทีมช่างสุรศักดิ์ ประเสริฐสุข (เซอร์วิส & โซลูชัน)', branchId: 'br-01' },
  { id: 'tech-007', name: 'ทีมช่างณัฐวุฒิ วงศ์อนันต์ (โปร เซอร์วิส)', branchId: 'br-02' },
  { id: 'tech-008', name: 'บริษัท ธนพล โฮม เซอร์วิส จำกัด', branchId: 'br-03' },
  { id: 'tech-009', name: 'ทีมช่างชัยวัฒน์ มั่นคง (แอนด์ ทีม)', branchId: 'br-04' },
  { id: 'tech-010', name: 'ทีมช่างพิศาล ปันใจ (อินเตอร์วิศวกรรม)', branchId: 'br-05' },
  { id: 'tech-011', name: 'ทีมช่างสันติ ตั้งเจริญ (เทคทีม)', branchId: 'br-01' }
];

// Zone list
const zones = [
  '[BKK] กรุงเทพฯ ตะวันออกใต้ (ประเวศ - สวนหลวง - บางนา)',
  '[BKK] นนทบุรี',
  '[BKK] กรุงเทพฯ ชั้นใน (สุขุมวิท / ดินแดง - ห้วยขวาง - คลองเตย)',
  '[BKK] สมุทรปราการ',
  '[BKK] ปทุมธานี',
  '[BKK] กรุงเทพฯ เหนือตอนล่าง (จตุจักร - บางซื่อ - ลาดพร้าว)',
  '[BKK] กรุงเทพฯ เหนือตอนบน (หลักสี่ - ดอนเมือง - สายไหม - บางเขน)',
  '[BKK] กรุงเทพฯ ตะวันออก (บางกะปิ - บึงกุ่ม - สะพานสูง - วังทองหลาง - คันนายาว)',
  '[BKK] กรุงเทพฯ ตะวันออกนอก (มีนบุรี - ลาดกระบัง - หนองจอก - คลองสามวา)'
];

// Jobs
const jobs = [
  { id: 'inst-built-kitchen', name: 'งานติดตั้งครัว Built-in Master (ชุดใหญ่)', skill: 3 },
  { id: 'inst-built-closet', name: 'งานติดตั้งตู้เสื้อผ้า Walk-in Closet', skill: 2 },
  { id: 'inst-flooring-laminate', name: 'งานปูพื้น SPC / Laminate (50-100 ตร.ม.)', skill: 2 },
  { id: 'inst-smart-home', name: 'งานติดตั้งระบบ Smart Home & Digital Door Lock', skill: 2 },
  { id: 'inst-aircon-multi', name: 'งานติดตั้งเครื่องปรับอากาศ Multi-Split 3 เครื่อง', skill: 3 },
  { id: 'inst-curtains-motor', name: 'งานติดตั้งผ้าม่านมอเตอร์ไฟฟ้า + วอลเปเปอร์', skill: 1 }
];

const timeSlots = [
  '09:00 - 12:00 (Morning)',
  '13:00 - 17:00 (Afternoon)',
  '09:00 - 17:00 (Full Day)'
];

const generatedBookings = [];
let idCounter = 1015;

// Generate bookings from August 5th to August 30th
for (let day = 5; day <= 30; day++) {
  const dateStr = `2026-08-${String(day).padStart(2, '0')}`;
  
  // Decide how many bookings on this day (1 or 2, occasionally 3 on weekends)
  const isWeekend = day % 7 === 1 || day % 7 === 2; // Rough weekend check
  const numBookings = isWeekend ? (day % 3 === 0 ? 3 : 2) : (day % 4 === 0 ? 0 : 1);

  for (let k = 0; k < numBookings; k++) {
    const bookingId = `bk-${idCounter}`;
    const bookingRef = `BK-2026-08${String(day).padStart(2, '0')}-${String(k + 1).padStart(2, '0')}`;
    const customerName = thaiNames[(day + k * 7) % thaiNames.length];
    const customerPhone = `08${(day % 9) + 1}-${String(200 + (day * 43) % 799).padStart(3, '0')}-${String(1000 + (day * 137) % 8999).padStart(4, '0')}`;
    const addressZone = zones[(day + k * 3) % zones.length];
    
    const job = jobs[(day + k * 11) % jobs.length];
    const timeSlot = timeSlots[(day + k * 5) % timeSlots.length];
    
    // Status can only be 'Pending Dispatch' or 'Scheduled' (so not yet dispatched)
    const status = (day + k) % 2 === 0 ? 'Pending Dispatch' : 'Scheduled';
    const tech = techs[(day + k * 9) % techs.length];
    
    const bookingObj = {
      id: bookingId,
      bookingRef,
      customerName,
      customerPhone,
      addressZone,
      installationTypeId: job.id,
      installationTypeName: job.name,
      requiredSkillLevel: job.skill,
      bookingDate: dateStr,
      timeSlot,
      status,
      createdFrom: ['Selling Tools (E-ordering)', 'Vfixq Portal', 'COOHOM Direct', 'Line OA', 'Call Center 1308'][(day + k) % 5],
      createdAt: `2026-08-03 ${String(8 + (day % 10)).padStart(2, '0')}:${String((day * 7) % 60).padStart(2, '0')}`,
      branchId: tech.branchId
    };

    if (status === 'Scheduled') {
      bookingObj.assignedTechTeamId = tech.id;
      bookingObj.assignedTechTeamName = tech.name;
    }

    generatedBookings.push(bookingObj);
    idCounter++;
  }
}

console.log(`Generated ${generatedBookings.length} bookings for August 5 - 30, 2026.`);

// Find where INITIAL_BOOKINGS ends in mockData.ts
// We want to discard the previously appended bookings and restore to original + new ones
// The original bookings end with bk-1014:
const startIndex = mockDataText.indexOf('export const INITIAL_BOOKINGS: QueueBooking[] = [');
if (startIndex === -1) {
  console.error('Could not find INITIAL_BOOKINGS start');
  process.exit(1);
}

// Find index of bk-1014 to ensure we reset from the original list of 14 bookings
const marker1014 = 'bk-1014';
const markerIndex = mockDataText.indexOf(marker1014);
if (markerIndex === -1) {
  console.error('Could not find bk-1014 marker');
  process.exit(1);
}

// Find the first closing '];' after bk-1014
const searchSlice = mockDataText.slice(markerIndex);
const closingIndex = searchSlice.indexOf('];');
if (closingIndex === -1) {
  console.error('Could not find closing marker');
  process.exit(1);
}

const fullEndIndex = markerIndex + closingIndex + 2;

// The text up to fullEndIndex is the original 14 bookings. We can slice it out and parse it.
const originalBookingsText = mockDataText.substring(startIndex, fullEndIndex);

// Let's strip the closing '];' and replace it with our new generated bookings
const newBookingsStr = generatedBookings.map(b => '  ' + JSON.stringify(b, null, 4).replace(/\n/g, '\n  ')).join(',\n') + '\n];';
const modifiedBookingsText = originalBookingsText.replace(/\n\];$/, ',\n' + newBookingsStr);

// Assemble new mockData.ts content
const newMockDataText = mockDataText.substring(0, startIndex) + modifiedBookingsText + mockDataText.substring(fullEndIndex);

fs.writeFileSync(mockDataPath, newMockDataText);
console.log('Successfully updated src/mockData.ts with non-dispatched bookings!');
