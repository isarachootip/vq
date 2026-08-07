import React, { useState, useMemo } from 'react';
import type { QueueBooking, Technician, ServiceItem, Zone } from '../types';
import { INITIAL_ZONES } from '../mockData';
import { CustomDateInput } from './CustomDateInput';
import { InteractiveMapPickerModal } from './InteractiveMapPickerModal';
import { BuildFlowIcon } from './BuildFlowIcon';
import { parseCoordinatesFromText, formatLatDms, formatLngDms, reverseGeocodeAddress } from '../utils/coordinateUtils';
import { 
  Clock, 
  Filter, 
  MapPin, 
  ShieldAlert, 
  ArrowRight, 
  Layers, 
  Calendar as CalendarIcon,
  Info,
  Phone,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Sparkles,
  Folder,
  FileText
} from 'lucide-react';

interface DashboardViewProps {
  bookings: QueueBooking[];
  technicians: Technician[];
  services: ServiceItem[];
  zones?: Zone[];
  onDispatchToKanna: (bookingId: string) => void;
  onSelectBookingForSim: (booking: QueueBooking) => void;
  onConfirmBooking: (newBooking: QueueBooking) => void;
  onAssignTechnician?: (bookingId: string, techId: string, techName: string) => void;
}

const CATEGORY_GROUPS = [
  { code: 'ALL', name: 'ทุกหมวดหมู่บริการ (All Groups)' },
  { code: 'CE', name: 'CE - หมวดเครื่องปรับอากาศ (Air Conditioning)' },
  { code: 'CEC', name: 'CEC - หมวดงานบริการล้างทำความสะอาด (Clean & Service)' },
  { code: 'SOLAR', name: 'SOLAR - หมวดระบบพลังงานแสงอาทิตย์ (Solar Cell)' },
  { code: 'FITIN', name: 'Fit-In / Built-in - เฟอร์นิเจอร์บิวท์อิน' },
  { code: 'ELEC', name: 'Electrical - งานระบบไฟฟ้า & Smart Home' },
  { code: 'FLOOR', name: 'Flooring - งานพื้น ผนัง และฝ้าเพดาน' },
  { code: 'PLUMB', name: 'Plumbing - งานระบบประปาและสุขภัณฑ์' },
];

export const isBkkZone = (z: { name?: string; code?: string; id?: string } | string): boolean => {
  const nameStr = typeof z === 'string' ? z : (z?.name || '');
  const codeStr = typeof z === 'string' ? '' : (z?.code || '');
  const idStr = typeof z === 'string' ? '' : (z?.id || '');
  
  const nameUpper = nameStr.toUpperCase();
  const codeUpper = codeStr.toUpperCase();
  const idLower = idStr.toLowerCase();

  // Check if explicitly marked as UPC
  if (nameUpper.includes('[UPC]')) return false;

  // BKK encompasses Bangkok & Greater Bangkok (นนทบุรี, ปทุมธานี, สมุทรปราการ)
  return (
    nameUpper.includes('[BKK]') ||
    nameUpper.includes('BKK') ||
    nameUpper.includes('กรุงเทพ') ||
    nameUpper.includes('นนทบุรี') ||
    nameUpper.includes('ปทุมธานี') ||
    nameUpper.includes('สมุทรปราการ') ||
    codeUpper.startsWith('Z01') ||
    codeUpper.startsWith('Z02') ||
    codeUpper.startsWith('Z03') ||
    codeUpper.startsWith('Z04') ||
    idLower.includes('bkk')
  );
};

export const detectZoneFromCoordinates = (
  lat: number,
  lng: number,
  address?: string,
  allZonesList?: Zone[]
): { region: 'BKK' | 'UPC'; zone: string } => {
  if (isNaN(lat) || isNaN(lng)) {
    return { region: 'BKK', zone: '[BKK] กรุงเทพฯ ชั้นใน (เมืองเก่า / พญาไท - ราชเทวี)' };
  }

  const addrLower = (address || '').toLowerCase();

  // 1. Try matching by district / province name in address (More specific than postcode)
  if (address && allZonesList) {
    // Check for province first
    if (addrLower.includes('นนทบุรี') || addrLower.includes('nonthaburi')) {
      const z = allZonesList.find(z => z.code === 'Z02');
      if (z) return { region: 'BKK', zone: z.name };
    }
    if (addrLower.includes('ปทุมธานี') || addrLower.includes('pathum thani')) {
      const z = allZonesList.find(z => z.code === 'Z03');
      if (z) return { region: 'BKK', zone: z.name };
    }
    if (addrLower.includes('สมุทรปราการ') || addrLower.includes('samut prakan') || addrLower.includes('samutprakan')) {
      const z = allZonesList.find(z => z.code === 'Z04');
      if (z) return { region: 'BKK', zone: z.name };
    }

    // Check Bangkok districts (Thai & English support)
    const khets = [
      { code: 'Z01-C1', names: ["พระนคร", "ดุสิต", "ป้อมปราบ", "สัมพันธวงศ์", "พญาไท", "ราชเทวี", "phra nakhon", "dusit", "pom prap", "samphanthawong", "phaya thai", "ratchathewi"] },
      { code: 'Z01-C2', names: ["ปทุมวัน", "บางรัก", "สาทร", "ยานนาวา", "บางคอแหลม", "pathum wan", "bang rak", "sathon", "yan nawa", "bang kho laem"] },
      { code: 'Z01-C3', names: ["ดินแดง", "ห้วยขวาง", "วัฒนา", "คลองเตย", "din daeng", "huai khwang", "watthana", "khlong toei"] },
      { code: 'Z01-N1', names: ["จตุจักร", "บางซื่อ", "ลาดพร้าว", "chatuchak", "bang sue", "lat phrao"] },
      { code: 'Z01-N2', names: ["หลักสี่", "ดอนเมือง", "สายไหม", "บางเขน", "lak si", "don mueang", "sai mai", "bang khen"] },
      { code: 'Z01-E1', names: ["บางกะปิ", "บึงกุ่ม", "สะพานสูง", "วังทองหลาง", "คันนายาว", "bang kapi", "bueng kum", "saphan sung", "wang thonglang", "khannayao", "khhan na yao"] },
      { code: 'Z01-E2', names: ["คลองสามวา", "หนองจอก", "มีนบุรี", "ลาดกระบัง", "khlong sam wa", "nong chok", "min buri", "lat krabang"] },
      { code: 'Z01-SE', names: ["ประเวศ", "สวนหลวง", "บางนา", "prawet", "suan luang", "bang na"] },
      { code: 'Z01-W1', names: ["ธนบุรี", "คลองสาน", "บางกอกใหญ่", "บางกอกน้อย", "บางพลัด", "ตลิ่งชัน", "ทวีวัฒนา", "thon buri", "khlong san", "bang kok yai", "bang kok noi", "bang phlat", "taling chan", "thawi watthana"] },
      { code: 'Z01-W2', names: ["ภาษีเจริญ", "บางแค", "หนองแขม", "ราษฎร์บูรณะ", "ทุ่งครุ", "จอมทอง", "บางขุนเทียน", "บางบอน", "phasi charoen", "bang khae", "nong khaem", "rat burana", "thung khru", "chom thong", "bang khun thian", "bang bon"] }
    ];

    for (const kh of khets) {
      for (const name of kh.names) {
        if (addrLower.includes(name.toLowerCase())) {
          const z = allZonesList.find(z => z.code === kh.code);
          if (z) return { region: 'BKK', zone: z.name };
        }
      }
    }

    // Check UPC regions by searching for province name matching
    const upcZones = allZonesList.filter(z => !isBkkZone(z));
    for (const z of upcZones) {
      const cleanName = z.name.replace(/\[.*?\]/g, '').trim(); // Remove tag like [CT], [ET]
      if (addrLower.includes(cleanName.toLowerCase()) || (z.description && addrLower.includes(z.description.toLowerCase()))) {
        return { region: 'UPC', zone: z.name };
      }
    }
  }

  // 2. Try matching by postcode (5-digit number) from address as fallback
  let postcode: string | null = null;
  if (address) {
    const match = address.match(/\b\d{5}\b/);
    if (match) {
      postcode = match[0];
    }
  }

  if (postcode && allZonesList) {
    const matchedZone = allZonesList.find(z => 
      z.coverageZipcodes && z.coverageZipcodes.includes(postcode!)
    );
    if (matchedZone) {
      const region = isBkkZone(matchedZone) ? 'BKK' : 'UPC';
      return { region, zone: matchedZone.name };
    }
  }

  // 3. Fallback: Coordinate bounding boxes
  if (lat >= 13.35 && lat <= 14.25 && lng >= 100.2 && lng <= 100.95) {
    let targetCode = 'Z01-C3'; // Default BKK Central
    if (lat >= 13.95) {
      targetCode = 'Z03'; // ปทุมธานี
    } else if (lat >= 13.82 && lng <= 100.53) {
      targetCode = 'Z02'; // นนทบุรี
    } else if (lat <= 13.62 && lng >= 100.6) {
      targetCode = 'Z04'; // สมุทรปราการ
    } else if (lng <= 100.48) {
      targetCode = 'Z01-W1'; // ฝั่งธนบุรีเหนือ
    } else if (lat >= 13.80) {
      targetCode = 'Z01-N1'; // กรุงเทพฯ ตอนเหนือ
    } else if (lng >= 100.60) { // Expanded slightly to include Bueng Kum/Bang Kapi boundary
      targetCode = 'Z01-E1'; // กรุงเทพฯ ตะวันออก
    } else if (lat <= 13.68 && lng >= 100.60) {
      targetCode = 'Z01-SE'; // กรุงเทพฯ ตะวันออกใต้
    }

    if (allZonesList) {
      const z = allZonesList.find(x => x.code === targetCode);
      if (z) return { region: 'BKK', zone: z.name };
    }

    // Hardcoded defaults if allZonesList is empty/unavailable
    const defaultNames: Record<string, string> = {
      'Z03': '[BKK] ปทุมธานี',
      'Z02': '[BKK] นนทบุรี',
      'Z04': '[BKK] สมุทรปราการ',
      'Z01-W1': '[BKK] กรุงเทพฯ ฝั่งธนบุรีเหนือ (ธนบุรี - คลองสาน - บางกอกน้อย - บางพลัด - ตลิ่งชัน - ทวีวัฒนา)',
      'Z01-N1': '[BKK] กรุงเทพฯ เหนือตอนล่าง (จตุจักร - บางซื่อ - ลาดพร้าว)',
      'Z01-E1': '[BKK] กรุงเทพฯ ตะวันออก (บางกะปิ - บึงกุ่ม - สะพานสูง - วังทองหลาง - คันนายาว)',
      'Z01-SE': '[BKK] กรุงเทพฯ ตะวันออกใต้ (ประเวศ - สวนหลวง - บางนา)',
      'Z01-C3': '[BKK] กรุงเทพฯ ชั้นใน (สุขุมวิท / ดินแดง - ห้วยขวาง - คลองเตย)'
    };
    return { region: 'BKK', zone: defaultNames[targetCode] || '[BKK] กรุงเทพฯ ชั้นใน (เมืองเก่า / พญาไท - ราชเทวี)' };
  }

  // UPC Bounding box fallback
  let upcZoneCode = 'Z05'; // Default Central CT กำแพงเพชร
  if (lat < 11.8) {
    upcZoneCode = 'Z78'; // [ST] ภูเก็ต
  } else if (lat > 17.2) {
    upcZoneCode = 'Z49'; // [NT] เชียงใหม่
  } else if (lng > 101.5) {
    upcZoneCode = 'Z30'; // [NE] ขอนแก่น
  } else if (lng > 100.8 && lat <= 13.8) {
    upcZoneCode = 'Z26'; // [ET] ชลบุรี
  }

  if (allZonesList) {
    const z = allZonesList.find(x => x.code === upcZoneCode);
    if (z) return { region: 'UPC', zone: z.name };
    const anyUpc = allZonesList.find(x => !isBkkZone(x));
    if (anyUpc) return { region: 'UPC', zone: anyUpc.name };
  }

  return { region: 'UPC', zone: '[CT] กำแพงเพชร' };
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  bookings,
  technicians,
  services,
  zones,
  onDispatchToKanna,
  onSelectBookingForSim,
  onConfirmBooking,
  onAssignTechnician,
}) => {
  const allZonesList = useMemo(() => {
    return zones && zones.length > 0 ? zones : INITIAL_ZONES;
  }, [zones]);

  const bkkZones = useMemo(() => {
    return allZonesList.filter(z => isBkkZone(z));
  }, [allZonesList]);

  const upcZones = useMemo(() => {
    return allZonesList.filter(z => !isBkkZone(z));
  }, [allZonesList]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth() + 1); // 1 = Jan
  const [selectedRegion, setSelectedRegion] = useState<'ALL' | 'BKK' | 'UPC'>('ALL');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Project type categorization logic
  const getBookingCategory = (b: QueueBooking) => {
    const typeId = b.installationTypeId.toLowerCase();
    
    // Assign some specific booking IDs to 'ma' and 'new' to populate mock data
    if (b.id === 'bk-1007' || b.id === 'bk-1013' || b.id === 'bk-1020') {
      return 'ma';
    }
    if (b.id === 'bk-1009' || b.id === 'bk-1018' || b.id === 'bk-1025') {
      return 'new';
    }

    if (typeId.includes('kitchen') || typeId.includes('closet') || typeId.includes('built')) {
      return 'buildin';
    }
    if (typeId.includes('smart') || typeId.includes('curtain') || typeId.includes('digital') || typeId.includes('lock')) {
      return 'quick';
    }
    if (typeId.includes('floor') || typeId.includes('laminate') || typeId.includes('spc')) {
      return 'renovate';
    }
    return 'installer';
  };

  const quickCount = bookings.filter(b => getBookingCategory(b) === 'quick').length;
  const installerCount = bookings.filter(b => getBookingCategory(b) === 'installer').length;
  const renovateCount = bookings.filter(b => getBookingCategory(b) === 'renovate').length;
  const buildinCount = bookings.filter(b => getBookingCategory(b) === 'buildin').length;
  const newCount = bookings.filter(b => getBookingCategory(b) === 'new').length;
  const maCount = bookings.filter(b => getBookingCategory(b) === 'ma').length;

  // Manual Booking Modal States
  const [showManualBookingModal, setShowManualBookingModal] = useState<boolean>(false);
  const [mTicketNo, setMTicketNo] = useState<string>('');
  const [mCustFirstName, setMCustFirstName] = useState<string>('');
  const [mCustLastName, setMCustLastName] = useState<string>('');
  const [mCustPhone, setMCustPhone] = useState<string>('');
  const [mLineId, setMLineId] = useState<string>('');
  const [mCategoryCode, setMCategoryCode] = useState<string>('ALL');
  const [mServiceId, setMServiceId] = useState<string>(services[0]?.id || '');
  const [mRegion, setMRegion] = useState<'BKK' | 'UPC'>('BKK');
  const [mZone, setMZone] = useState<string>('[BKK] กรุงเทพฯ ชั้นใน (เมืองเก่า / พญาไท - ราชเทวี)');
  const [mLat, setMLat] = useState<string>('13.75633');
  const [mLng, setMLng] = useState<string>('100.50177');
  const [mDate, setMDate] = useState<string>(todayStr);
  const [mTimeSlot, setMTimeSlot] = useState<string>('Morning (09:00 - 12:00)');
  const [mSource, setMSource] = useState<'Line OA' | 'Call Center 1308' | 'Walk-in'>('Call Center 1308');
  const [mTicketError, setMTicketError] = useState<string>('');
  const [showMapPicker, setShowMapPicker] = useState<boolean>(false);
  const [autoZoneMessage, setAutoZoneMessage] = useState<string>('');

  // Smart Coordinate Auto-Fill & Extraction states
  const [mCustAddress, setMCustAddress] = useState<string>('286 ซอย รามอินทรา 57 แยก 8 แขวงท่าแร้ง เขตบางเขน กรุงเทพมหานคร...');
  const [isSearchingAddress, setIsSearchingAddress] = useState<boolean>(false);
  const [pasteCoordText, setPasteCoordText] = useState<string>('');
  const [extractStatusMsg, setExtractStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [geocodedAddress, setGeocodedAddress] = useState<string>('');

  const handleUpdateCoordinates = async (latVal: string, lngVal: string, autoGeocode: boolean = true) => {
    setMLat(latVal);
    setMLng(lngVal);
    const latNum = parseFloat(latVal);
    const lngNum = parseFloat(lngVal);
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      const detected = detectZoneFromCoordinates(latNum, lngNum, undefined, allZonesList);
      setMRegion(detected.region);
      setMZone(detected.zone);
      setAutoZoneMessage(`⚡ กำหนดให้อยู่อัตโนมัติ: ${detected.zone}`);

      if (autoGeocode) {
        setIsGeocoding(true);
        try {
          const addr = await reverseGeocodeAddress(latNum, lngNum);
          if (addr) {
            setGeocodedAddress(addr);
            setMCustAddress(addr);
            
            const refined = detectZoneFromCoordinates(latNum, lngNum, addr, allZonesList);
            setMRegion(refined.region);
            setMZone(refined.zone);
            setAutoZoneMessage(`⚡ กำหนดให้อยู่อัตโนมัติ: ${refined.zone}`);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsGeocoding(false);
        }
      }
    }
  };

  const handleExtractCoordinates = async (rawText?: string) => {
    const textToParse = rawText !== undefined ? rawText : pasteCoordText;
    if (!textToParse.trim()) {
      setExtractStatusMsg({ type: 'error', text: '⚠️ กรุณาป้อนพิกัด DMS, พิกัดตัวเลข หรือวางลิงก์ Google Maps' });
      return;
    }

    const result = parseCoordinatesFromText(textToParse);
    if (result) {
      setExtractStatusMsg({ type: 'info', text: '⏳ กำลังถอดค่าพิกัดและแปลงที่อยู่อัตโนมัติ...' });
      setMLat(String(result.lat));
      setMLng(String(result.lng));
      const detected = detectZoneFromCoordinates(result.lat, result.lng, undefined, allZonesList);
      setMRegion(detected.region);
      setMZone(detected.zone);
      setAutoZoneMessage(`⚡ กำหนดให้อยู่อัตโนมัติ: ${detected.zone}`);

      setIsGeocoding(true);
      const addr = await reverseGeocodeAddress(result.lat, result.lng);
      setIsGeocoding(false);

      if (addr) {
        setGeocodedAddress(addr);
        setMCustAddress(addr);
        
        const refined = detectZoneFromCoordinates(result.lat, result.lng, addr, allZonesList);
        setMRegion(refined.region);
        setMZone(refined.zone);
        setAutoZoneMessage(`⚡ กำหนดให้อยู่อัตโนมัติ: ${refined.zone}`);

        setExtractStatusMsg({
          type: 'success',
          text: `✅ ถอดพิกัดสำเร็จ (ละติจูด ${result.lat}, ลองจิจูด ${result.lng}) และดึงที่อยู่อัตโนมัติเรียบร้อย!`,
        });
      } else {
        setExtractStatusMsg({
          type: 'success',
          text: `✅ ถอดค่าพิกัดสำเร็จ: ละติจูด ${result.lat}, ลองจิจูด ${result.lng}`,
        });
      }
    } else {
      setExtractStatusMsg({
        type: 'error',
        text: '⚠️ ไม่สามารถถอดค่าพิกัดได้ กรุณาตรวจสอบรูปแบบ เช่น 13°51\'07.1"N 100°38\'36.3"E หรือ URL Google Maps',
      });
    }
  };

  const handleGetBrowserGps = () => {
    if (!navigator.geolocation) {
      setExtractStatusMsg({ type: 'error', text: '⚠️ เบราว์เซอร์ของคุณไม่รองรับการดึงตำแหน่ง GPS' });
      return;
    }
    setIsLocatingGps(true);
    setExtractStatusMsg({ type: 'info', text: '⏳ กำลังดึงพิกัดตำแหน่งปัจจุบันจากอุปกรณ์ (GPS)...' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGps(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        handleUpdateCoordinates(String(lat), String(lng));
        setExtractStatusMsg({
          type: 'success',
          text: `🎯 ดึงพิกัดปัจจุบันสำเร็จ: ${lat}, ${lng}`,
        });
      },
      (err) => {
        setIsLocatingGps(false);
        setExtractStatusMsg({
          type: 'error',
          text: `⚠️ ไม่สามารถดึงพิกัด GPS ได้ (${err.message})`,
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearchCoordinatesFromAddress = async () => {
    if (!mCustAddress.trim()) {
      setExtractStatusMsg({ type: 'error', text: '⚠️ กรุณากรอกข้อความที่อยู่ก่อนค้นหาพิกัด' });
      return;
    }
    setIsSearchingAddress(true);
    setExtractStatusMsg({ type: 'info', text: '⏳ กำลังค้นหาพิกัดจากข้อความที่อยู่...' });
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          mCustAddress + ' Thailand'
        )}&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        handleUpdateCoordinates(String(lat.toFixed(6)), String(lon.toFixed(6)));
        setExtractStatusMsg({
          type: 'success',
          text: `✅ ค้นหาพิกัดจากข้อความที่อยู่สำเร็จ: ละติจูด ${lat.toFixed(6)}, ลองจิจูด ${lon.toFixed(6)}`,
        });
      } else {
        setExtractStatusMsg({ type: 'error', text: '⚠️ ไม่พบพิกัดสำหรับที่อยู่นี้ ลองระบุชื่อเขต/อำเภอ หรือสถานที่ใกล้เคียง' });
      }
    } catch (err) {
      setExtractStatusMsg({ type: 'error', text: '⚠️ การค้นหาพิกัดล้มเหลว กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต' });
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleReverseGeocode = async () => {
    const latNum = parseFloat(mLat);
    const lngNum = parseFloat(mLng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      setExtractStatusMsg({ type: 'error', text: '⚠️ กรุณาระบุพิกัดละติจูดและลองจิจูดให้ถูกต้องก่อน' });
      return;
    }
    setIsGeocoding(true);
    setExtractStatusMsg({ type: 'info', text: '⏳ กำลังค้นหาที่อยู่จากพิกัดแผนที่...' });
    const addr = await reverseGeocodeAddress(latNum, lngNum);
    setIsGeocoding(false);
    if (addr) {
      setGeocodedAddress(addr);
      setMCustAddress(addr);
      
      const refined = detectZoneFromCoordinates(latNum, lngNum, addr, allZonesList);
      setMRegion(refined.region);
      setMZone(refined.zone);
      setAutoZoneMessage(`⚡ กำหนดให้อยู่อัตโนมัติ: ${refined.zone}`);

      setExtractStatusMsg({ type: 'success', text: `🏠 แปลงพิกัดเป็นที่อยู่และกรอกลงช่องที่อยู่อัตโนมัติ: ${addr}` });
    } else {
      setExtractStatusMsg({ type: 'error', text: '⚠️ ไม่พบข้อมูลที่อยู่สำหรับพิกัดนี้' });
    }
  };

  const generateRandomTicketNo = () => {
    // Generate 10-digit numeric ticket number
    const num = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setMTicketNo(num);
    setMTicketError('');
  };

  const matchCategoryGroup = (serviceCat: string, code: string) => {
    if (code === 'ALL') return true;
    const c = serviceCat.toLowerCase();
    if (code === 'CE') return c.includes('ปรับอากาศ') || c.includes('ce') || c.includes('แอร์');
    if (code === 'CEC') return c.includes('ล้าง') || c.includes('cec') || c.includes('ทำความสะอาด');
    if (code === 'SOLAR') return c.includes('โซล่า') || c.includes('solar') || c.includes('แสงอาทิตย์');
    if (code === 'FITIN') return c.includes('fit-in') || c.includes('built-in') || c.includes('เฟอร์นิเจอร์');
    if (code === 'ELEC') return c.includes('ไฟฟ้า') || c.includes('smart') || c.includes('electrical');
    if (code === 'FLOOR') return c.includes('พื้น') || c.includes('ผนัง') || c.includes('ฝ้า') || c.includes('flooring');
    if (code === 'PLUMB') return c.includes('ประปา') || c.includes('สุขภัณฑ์') || c.includes('ห้องน้ำ') || c.includes('plumbing');
    return true;
  };

  const filteredServicesForModal = services.filter((s) => matchCategoryGroup(s.category, mCategoryCode));

  const handleCategoryCodeChange = (code: string) => {
    setMCategoryCode(code);
    const matches = services.filter((s) => matchCategoryGroup(s.category, code));
    if (matches.length > 0) {
      setMServiceId(matches[0].id);
    }
  };

  // Assign Technician Modal States
  const [assignModalBooking, setAssignModalBooking] = useState<QueueBooking | null>(null);
  const [selectedTechIdForAssign, setSelectedTechIdForAssign] = useState<string>('');

  const handleOpenAssignModal = (b: QueueBooking) => {
    setAssignModalBooking(b);
    const eligible = technicians.filter(
      (t) => t.status !== 'In Cooldown' && t.tier !== 'Cooldown'
    );
    if (eligible.length > 0) {
      setSelectedTechIdForAssign(eligible[0].id);
    }
  };

  const handleConfirmAssignTech = () => {
    if (!assignModalBooking || !selectedTechIdForAssign) return;
    const tech = technicians.find((t) => t.id === selectedTechIdForAssign);
    if (!tech) return;

    if (onAssignTechnician) {
      onAssignTechnician(assignModalBooking.id, tech.id, tech.name);
    } else {
      assignModalBooking.assignedTechTeamId = tech.id;
      assignModalBooking.assignedTechTeamName = tech.name;
      assignModalBooking.status = 'Scheduled';
    }

    setAssignModalBooking(null);
  };

  const unassignedCount = bookings.filter(
    (b) => !b.assignedTechTeamId || b.assignedTechTeamId === '' || b.status === 'Pending Dispatch'
  ).length;

  const handleAutoAssignAllPending = () => {
    const unassigned = bookings.filter(
      (b) => !b.assignedTechTeamId || b.assignedTechTeamId === '' || b.status === 'Pending Dispatch'
    );
    const eligibleTechs = technicians.filter(
      (t) => t.status !== 'In Cooldown' && t.tier !== 'Cooldown'
    );
    if (eligibleTechs.length === 0) return;

    unassigned.forEach((b, idx) => {
      const chosenTech = eligibleTechs[idx % eligibleTechs.length];
      if (onAssignTechnician) {
        onAssignTechnician(b.id, chosenTech.id, chosenTech.name);
      } else {
        b.assignedTechTeamId = chosenTech.id;
        b.assignedTechTeamName = chosenTech.name;
        b.status = 'Scheduled';
      }
    });
  };

  // 1. Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesDate = !selectedDate || b.bookingDate === selectedDate;
    
    // Region Filter (BKK vs UPC)
    const isBkk = isBkkZone(b.addressZone);
    const matchesRegion = 
      selectedRegion === 'ALL' ||
      (selectedRegion === 'BKK' && isBkk) ||
      (selectedRegion === 'UPC' && !isBkk);

    const matchesZone = selectedZone === 'ALL' || b.addressZone.includes(selectedZone);
    const matchesStatus = selectedStatus === 'ALL' || b.status === selectedStatus;
    const matchesSearch =
      b.bookingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.installationTypeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDate && matchesRegion && matchesZone && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: QueueBooking['status']) => {
    switch (status) {
      case 'Pending Dispatch':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Dispatched to BuildFlow':
      case 'Dispatched to KANNA':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'STS In-Progress':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'QC Inspection':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Passed (Closed)':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Penalty E-CN Issued':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Dynamic calendar parameters based on viewYear and viewMonth
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayOfWeek });
  const weekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Format YYYY-MM-DD date string to dd/mm/yyyy
  const formatDateDDMMYYYY = (dateStr: string | null) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  };

  const getBookingsCountForDate = (dateStr: string) => {
    return bookings.filter((b) => b.bookingDate === dateStr).length;
  };

  const getBookingsStatusSummary = (dateStr: string) => {
    const list = bookings.filter((b) => b.bookingDate === dateStr);
    const pending = list.filter(b => b.status === 'Pending Dispatch' || b.status === 'Scheduled').length;
    const active = list.filter(b => b.status === 'Dispatched to BuildFlow' || b.status === 'Dispatched to KANNA' || b.status === 'STS In-Progress').length;
    const closed = list.filter(b => b.status === 'Passed (Closed)').length;
    return { pending, active, closed };
  };

  const formatDateThai = (dateStr: string | null) => {
    if (!dateStr) return 'คิวงานทั้งหมดทุกวัน';
    const [year, month, day] = dateStr.split('-');
    const ddmmyyyy = formatDateDDMMYYYY(dateStr);
    return `คิวติดตั้งประจำวันที่ ${ddmmyyyy} (${parseInt(day)} ${thaiMonths[parseInt(month) - 1]} ${parseInt(year) + 543})`;
  };

  const handleManualBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMTicketError('');

    // Ticket Number 10 digits validation
    const cleanedTicket = mTicketNo.trim();
    if (!cleanedTicket || !/^\d{10}$/.test(cleanedTicket)) {
      setMTicketError('❌ เลขที่ Ticket ต้องเป็นตัวเลข 10 หลักเท่านั้น (เช่น 1092837465)');
      return;
    }

    const mCustName = `${mCustFirstName} ${mCustLastName}`.trim();
    if (!mCustFirstName.trim() || !mCustLastName.trim() || !mCustPhone.trim()) return;

    const selectedService = services.find(s => s.id === mServiceId);
    if (!selectedService) return;

    const randomDigits = Math.floor(Math.random() * 90 + 10);
    const bookingRef = `BK-${mDate}-${randomDigits}`;

    const newBooking: QueueBooking = {
      id: `booking-manual-${Date.now()}`,
      bookingRef,
      ticketNo: cleanedTicket,
      customerName: mCustName,
      customerPhone: mCustPhone,
      lineId: mLineId,
      bookingDate: mDate,
      timeSlot: mTimeSlot,
      createdFrom: mSource,
      addressZone: mZone,
      latitude: parseFloat(mLat) || 13.75633,
      longitude: parseFloat(mLng) || 100.50177,
      installationTypeId: selectedService.id,
      installationTypeName: selectedService.name,
      requiredSkillLevel: selectedService.requiredSkillLevel,
      assignedTechTeamId: undefined,
      status: 'Pending Dispatch',
      createdAt: new Date().toISOString()
    };

    onConfirmBooking(newBooking);
    
    // Reset Form
    setMTicketNo('');
    setMCustFirstName('');
    setMCustLastName('');
    setMCustPhone('');
    setMLineId('');
    setMServiceId(services[0]?.id || '');
    setShowManualBookingModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Top KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
        
        {/* Card 1: All Projects */}
        <div className="v-panel p-3.5 bg-white border border-slate-200 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">All Projects</div>
              <div className="text-xl font-black text-slate-800 mt-1">
                {bookings.length} <span className="text-[10px] font-normal text-slate-500">โครงการ</span>
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/50 flex-shrink-0">
              <Folder className="h-4 w-4" />
            </div>
          </div>
          <div className="text-[9px] text-emerald-600 font-bold mt-2.5 flex items-center gap-0.5">
            <span>↗ ข้อมูลตามจริง</span> <span className="text-slate-400 font-normal">ในระบบ</span>
          </div>
        </div>

        {/* Card 2: Quick Service */}
        <div className="v-panel p-3.5 bg-white border border-slate-200 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Quick Service</div>
              <div className="text-xl font-black text-slate-800 mt-1">
                {quickCount} <span className="text-[10px] font-normal text-slate-500">โครงการ</span>
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100/50 flex-shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="text-[9px] text-slate-400 font-medium mt-2.5">
            งานบริการด่วน
          </div>
        </div>

        {/* Card 3: Installer Service */}
        <div className="v-panel p-3.5 bg-white border border-slate-200 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Installer Service</div>
              <div className="text-xl font-black text-slate-800 mt-1">
                {installerCount} <span className="text-[10px] font-normal text-slate-500">โครงการ</span>
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/50 flex-shrink-0">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-[9px] text-slate-400 font-medium mt-2.5">
            งานติดตั้งทั่วไป
          </div>
        </div>

        {/* Card 4: Renovate Service */}
        <div className="v-panel p-3.5 bg-white border border-slate-200 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Renovate Service</div>
              <div className="text-xl font-black text-slate-800 mt-1">
                {renovateCount} <span className="text-[10px] font-normal text-slate-500">โครงการ</span>
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-500 border border-amber-100/50 flex-shrink-0">
              <Layers className="h-4 w-4 text-amber-500" />
            </div>
          </div>
          <div className="text-[9px] text-slate-400 font-medium mt-2.5">
            งานปรับปรุงรีโนเวท
          </div>
        </div>

        {/* Card 5: Buildin */}
        <div className="v-panel p-3.5 bg-white border border-slate-200 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Buildin</div>
              <div className="text-xl font-black text-slate-800 mt-1">
                {buildinCount} <span className="text-[10px] font-normal text-slate-500">โครงการ</span>
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100/50 flex-shrink-0">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="text-[9px] text-slate-400 font-medium mt-2.5">
            งานบิวท์อิน
          </div>
        </div>

        {/* Card 6: New */}
        <div className="v-panel p-3.5 bg-white border border-slate-200 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">New</div>
              <div className="text-xl font-black text-slate-800 mt-1">
                {newCount} <span className="text-[10px] font-normal text-slate-500">โครงการ</span>
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-100/50 flex-shrink-0">
              <Clock className="h-4 w-4 text-cyan-600" />
            </div>
          </div>
          <div className="text-[9px] text-slate-400 font-medium mt-2.5">
            งานโครงการใหม่
          </div>
        </div>

        {/* Card 7: MA Service */}
        <div className="v-panel p-3.5 bg-white border border-slate-200 flex flex-col justify-between hover:shadow-md transition col-span-2 sm:col-span-1">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">MA Service</div>
              <div className="text-xl font-black text-slate-800 mt-1">
                {maCount} <span className="text-[10px] font-normal text-slate-500">โครงการ</span>
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100/50 flex-shrink-0">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
            </div>
          </div>
          <div className="text-[9px] text-slate-400 font-medium mt-2.5">
            งานบริการบำรุงรักษา
          </div>
        </div>
      </div>

      {/* 2. Interactive Calendar Panel */}
      <div className="v-panel p-5 bg-white border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3 flex-wrap">
            <div className="flex items-center space-x-1.5">
              <CalendarIcon className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-slate-800 text-sm">📅 ปฏิทินกำหนดการงานติดตั้ง</h3>
            </div>
            
            {/* Month & Year Selectors */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg bg-white hover:bg-slate-200 text-slate-700 transition cursor-pointer shadow-xs border-0 flex items-center justify-center"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft size={16} />
              </button>

              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="bg-white border-0 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer shadow-xs"
              >
                {thaiMonths.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="bg-white border-0 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer shadow-xs"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y + 543} ({y})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg bg-white hover:bg-slate-200 text-slate-700 transition cursor-pointer shadow-xs border-0 flex items-center justify-center"
                title="เดือนถัดไป"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {selectedDate && (
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
                <span>วันที่เลือก:</span>
                <span className="text-blue-700 font-extrabold">{formatDateDDMMYYYY(selectedDate)}</span>
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {unassignedCount > 0 && (
              <button
                onClick={handleAutoAssignAllPending}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full cursor-pointer shadow-sm border-0 transition flex items-center gap-1.5 animate-pulse"
                title="ระบบจะวิเคราะห์หาช่างและจัดคิวให้อัตโนมัติทุกรายการที่รอจัดสรร"
              >
                <Sparkles size={14} />
                <span>🤖 จัดสรรช่างให้อัตโนมัติ ({unassignedCount})</span>
              </button>
            )}

            <button
              onClick={() => {
                setShowManualBookingModal(true);
                if (selectedDate) {
                  setMDate(selectedDate);
                }
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full cursor-pointer shadow-sm border-0 transition flex items-center gap-1.5"
            >
              <span>➕ บันทึกคิวจอง (Line / โทรศัพท์)</span>
            </button>

            <button
              onClick={() => setSelectedDate(null)}
              className={`px-3 py-1.5 rounded-full font-bold text-xs cursor-pointer border transition flex items-center gap-1.5 ${
                selectedDate === null 
                  ? 'bg-amber-500 border-amber-600 text-slate-900 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              📋 แสดงงานติดตั้งทั้งหมดทุกวัน
            </button>
          </div>
        </div>

        {/* Calendar Grid wrapper */}
        <div className="max-w-3xl mx-auto">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center font-bold text-[11px] text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100">
            {weekdays.map((w, idx) => (
              <span key={w} className={idx === 0 ? 'text-rose-500' : idx === 6 ? 'text-blue-500' : ''}>
                {w}
              </span>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-1.5 pt-2 text-xs">
            {/* Blank padding cells */}
            {paddingDays.map((_, i) => (
              <div key={`pad-${i}`} className="min-h-16 bg-slate-50/50 rounded-lg border border-transparent"></div>
            ))}

            {/* Days in month cells */}
            {calendarDays.map((day) => {
              const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const ddmmyyyy = `${String(day).padStart(2, '0')}/${String(viewMonth).padStart(2, '0')}/${viewYear}`;
              const count = getBookingsCountForDate(dateStr);
              const summary = getBookingsStatusSummary(dateStr);
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  title={`วันที่ ${ddmmyyyy}`}
                  className={`min-h-16 p-1.5 rounded-lg border flex flex-col justify-between transition cursor-pointer select-none ${
                    isSelected
                      ? 'bg-amber-500 border-amber-600 text-slate-900 shadow-md scale-103 font-bold ring-1 ring-amber-400'
                      : count > 0
                      ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/30 text-slate-800'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-[11px] font-bold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>{day}</span>
                    {count > 0 && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    )}
                  </div>

                  {count > 0 ? (
                    <div className="space-y-0.5 mt-1 text-center">
                      <span className={`px-1 py-0.5 rounded text-[8px] font-black tracking-wide block border ${
                        isSelected 
                          ? 'bg-slate-950 text-amber-400 border-slate-950 shadow-inner' 
                          : 'bg-amber-500 text-slate-900 border-amber-500/30'
                      }`}>
                        {count} คิวงาน
                      </span>
                      {/* Mini breakdown dots */}
                      <div className="flex justify-center gap-0.5 text-[7px] font-bold">
                        {summary.pending > 0 && <span className={isSelected ? 'text-slate-900' : 'text-amber-600'}>⏳{summary.pending}</span>}
                        {summary.active > 0 && <span className={isSelected ? 'text-slate-900' : 'text-indigo-600'}>🏃{summary.active}</span>}
                        {summary.closed > 0 && <span className={isSelected ? 'text-slate-900' : 'text-emerald-600'}>✅{summary.closed}</span>}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[8px] text-slate-300 italic block text-right">ว่าง</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 justify-center">
          <Info className="h-3.5 w-3.5 text-slate-400" />
          <span>คลิกเลือกวันที่ในตารางปฏิทินด้านบน เพื่อเจาะลึกคิวงานและใช้ตัวกรองสืบค้นเฉพาะวันนั้น ๆ</span>
        </div>
      </div>

      {/* 3. Filter & Search Bar */}
      <div className="v-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
            <Filter className="h-4 w-4 text-amber-500" />
            <span>ตัวกรองคิวติดตั้ง:</span>
          </div>

          {/* Region Filter (BKK vs UPC) */}
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value as any);
              setSelectedZone('ALL');
            }}
            className="v-input py-1 text-xs font-bold bg-amber-500/10 border-amber-500/30 text-amber-900"
          >
            <option value="ALL">🌏 ทุกภูมิภาค (BKK + UPC)</option>
            <option value="BKK">🏙️ BKK (กรุงเทพฯ/ปริมณฑล)</option>
            <option value="UPC">🏞️ UPC (ต่างจังหวัด/ภูมิภาค)</option>
          </select>

          {/* Zone Filter derived dynamically from Master Zone table */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="v-input py-1 text-xs font-medium max-w-[280px]"
          >
            <option value="ALL">📍 ทุกโซนพื้นที่บริการ ({allZonesList.length} โซนระบบ)</option>

            {(selectedRegion === 'ALL' || selectedRegion === 'BKK') && (
              <optgroup label={`🏙️ โซนกรุงเทพและปริมณฑล (BKK) — ${bkkZones.length} โซน`}>
                {bkkZones.map((z) => (
                  <option key={z.id} value={z.name}>
                    {z.code ? `${z.code}: ${z.name}` : z.name}
                  </option>
                ))}
              </optgroup>
            )}

            {(selectedRegion === 'ALL' || selectedRegion === 'UPC') && (
              <optgroup label={`🏞️ โซนต่างจังหวัด / ภูมิภาค (UPC) — ${upcZones.length} โซน`}>
                {upcZones.map((z) => (
                  <option key={z.id} value={z.name}>
                    {z.code ? `${z.code}: ${z.name}` : z.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="v-input py-1 text-xs"
          >
            <option value="ALL">ทุกสถานะงาน</option>
            <option value="Pending Dispatch">Pending Dispatch</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Dispatched to BuildFlow">Dispatched to BuildFlow</option>
            <option value="STS In-Progress">STS In-Progress</option>
            <option value="QC Inspection">QC Inspection</option>
            <option value="Passed (Closed)">Passed (Closed)</option>
            <option value="Penalty E-CN Issued">Penalty E-CN Issued</option>
          </select>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหา Ref, ชื่อลูกค้า, หรือประเภทงาน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="v-input w-full md:w-72 pl-9 py-1 text-xs rounded-full"
          />
          <Layers className="h-4 w-4 text-slate-400 absolute left-3 top-2" />
        </div>
      </div>

      {/* 4. Main Queue List Table */}
      <div className="v-panel overflow-hidden bg-white border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm md:text-base font-bold text-slate-800">{formatDateThai(selectedDate)}</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-900 font-bold border border-amber-500/20">
              {filteredBookings.length} รายการ
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">ข้อมูลอิงตามวันที่เลือกและตัวกรองค้นหาด้านบน</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="v-table">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Booking Ref / วันเวลา</th>
                <th className="px-4 py-3 text-left">ลูกค้า / โซน</th>
                <th className="px-4 py-3 text-left">ประเภทงานติดตั้ง</th>
                <th className="px-4 py-3 text-left">Skill Level Required</th>
                <th className="px-4 py-3 text-left">ทีมช่างที่ได้รับมอบหมาย</th>
                <th className="px-4 py-3 text-left">สถานะ (Status)</th>
                <th className="px-4 py-3 text-right">ดำเนินการ (Actions)</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                    ไม่พบรายการคิวงานติดตั้งสำหรับตัวกรองและวันที่เลือก
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const assignedTech = technicians.find((t) => t.id === b.assignedTechTeamId);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono">
                        <div className="font-bold text-slate-800">{b.bookingRef}</div>
                        {b.ticketNo && (
                          <div className="text-[10px] font-bold text-amber-700 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded w-fit mt-0.5">
                            🎫 Ticket: {b.ticketNo}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 mt-0.5 font-bold">📅 {formatDateDDMMYYYY(b.bookingDate)} | {b.timeSlot}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">จาก {b.createdFrom}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                          <span>{b.customerName}</span>
                          {b.lineId && (
                            <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
                              LINE: {b.lineId}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{b.addressZone}</span>
                        </div>
                        {b.latitude && b.longitude && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[9px] text-blue-600 font-mono font-bold hover:underline block mt-0.5"
                          >
                            📍 {b.latitude.toFixed(4)}, {b.longitude.toFixed(4)} ↗
                          </a>
                        )}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {b.installationTypeName}
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          Skill Level {b.requiredSkillLevel}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {assignedTech ? (
                          <div className="flex items-center space-x-2">
                            <img
                              src={assignedTech.avatar}
                              alt={assignedTech.name}
                              className="h-7 w-7 rounded-lg object-cover border border-slate-200"
                            />
                            <div>
                              <div className="font-semibold text-slate-800 text-[10px]">{assignedTech.name}</div>
                              <div className="flex items-center space-x-2 text-[9px] text-slate-500">
                                <span className={
                                  assignedTech.tier === 'Gold' ? 'text-amber-600 font-bold' :
                                  assignedTech.tier === 'Silver' ? 'text-slate-500 font-bold' :
                                  assignedTech.tier === 'Cooldown' ? 'text-rose-600 font-bold' : 'text-slate-500'
                                }>
                                  {assignedTech.tier} Tier
                                </span>
                                <span>• ⭐ {assignedTech.rating}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col space-y-1 items-start">
                            <span className="text-amber-600 font-bold italic text-[11px]">ยังไม่ได้จัดสรรช่าง</span>
                            <button
                              onClick={() => handleOpenAssignModal(b)}
                              className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-[9px] transition flex items-center space-x-1 shadow-xs border-0 cursor-pointer animate-pulse"
                            >
                              <UserCheck className="h-3 w-3" />
                              <span>จัดสรรช่าง</span>
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 w-fit ${getStatusBadge(b.status)}`}>
                          {(b.status === 'Dispatched to BuildFlow' || b.status === 'Dispatched to KANNA') && (
                            <BuildFlowIcon className="h-3 w-3" />
                          )}
                          <span>{b.status === 'Dispatched to KANNA' ? 'Dispatched to BuildFlow' : b.status}</span>
                        </span>
                        {b.penaltyRef && (
                          <div className="text-[9px] text-rose-600 font-mono mt-1 flex items-center space-x-0.5">
                            <ShieldAlert className="h-3 w-3 animate-pulse" />
                            <span>{b.penaltyRef}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {!assignedTech && (
                            <button
                              onClick={() => handleOpenAssignModal(b)}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition flex items-center space-x-1 shadow-sm border-0 cursor-pointer"
                            >
                              <UserCheck className="h-3 w-3" />
                              <span>จัดสรรช่าง</span>
                            </button>
                          )}

                          {b.status === 'Scheduled' && assignedTech && (
                            <button
                              onClick={() => onDispatchToKanna(b.id)}
                              className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[10px] transition flex items-center space-x-1 shadow-sm border-0 cursor-pointer"
                            >
                              <BuildFlowIcon className="h-3.5 w-3.5" />
                              <span>ส่ง BuildFlow</span>
                            </button>
                          )}

                          <button
                            onClick={() => onSelectBookingForSim(b)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px] transition flex items-center space-x-1 font-semibold cursor-pointer"
                          >
                            <span>จำลอง Flow</span>
                            <ArrowRight className="h-3 w-3" />
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

      {/* 5. Manual Booking Form Modal */}
      {showManualBookingModal && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-slate-900/60 animate-fadeIn">
          <div className="v-panel p-6 bg-white w-full max-w-3xl border border-slate-200 rounded-2xl shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-sm font-bold text-slate-800">
                <Phone className="h-5 w-5 text-amber-500" />
                <span>📝 บันทึกจองบริการติดตั้งใหม่ (ผู้ดูแลระบบหลังบ้านป้อนเอง)</span>
              </div>
              <button 
                onClick={() => setShowManualBookingModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm border-0 bg-transparent font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualBookingSubmit} className="space-y-4">
              
              {/* Ticket No Row */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className="text-amber-600">🎫</span>
                    <span>เลขที่ตั๋วงาน (Ticket No.) — 10 หลัก:</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomTicketNo}
                    className="text-[10px] font-bold text-amber-700 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded cursor-pointer transition border border-amber-500/30"
                  >
                    🎲 สุ่มเลข Ticket 10 หลัก
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="กรอกเลขตั๋ว 10 หลัก เช่น 1092837465"
                  value={mTicketNo}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setMTicketNo(val);
                    if (val.length === 10) setMTicketError('');
                    else if (val.length > 0) setMTicketError('⚠️ ต้องป้อนตัวเลขให้ครบ 10 หลัก (ปัจจุบัน ' + val.length + '/10)');
                  }}
                  className="v-input w-full py-2 font-mono text-sm font-black text-amber-900 tracking-widest bg-white"
                />
                {mTicketError && <p className="text-[10px] text-rose-600 font-bold">{mTicketError}</p>}
              </div>

              {/* Customer Info row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">ชื่อจริงลูกค้า:</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น คุณสมเกียรติ"
                    value={mCustFirstName}
                    onChange={(e) => setMCustFirstName(e.target.value)}
                    className="v-input w-full py-2"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">นามสกุล:</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น มั่นคง"
                    value={mCustLastName}
                    onChange={(e) => setMCustLastName(e.target.value)}
                    className="v-input w-full py-2"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">เบอร์โทรศัพท์ลูกค้า:</label>
                  <input
                    type="tel"
                    required
                    placeholder="เช่น 089-1234567"
                    value={mCustPhone}
                    onChange={(e) => setMCustPhone(e.target.value)}
                    className="v-input w-full py-2 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">LINE ID (ไลน์ไอดี):</label>
                  <input
                    type="text"
                    placeholder="เช่น @somkiat หรือ somkiat_line"
                    value={mLineId}
                    onChange={(e) => setMLineId(e.target.value)}
                    className="v-input w-full py-2 font-mono text-emerald-700"
                  />
                </div>
              </div>

              {/* Address / Location Search Section (ตรงตาม buildflowx.online/leads) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold">🏡</span>
                    <span>ที่อยู่ / พิกัดสถานที่หน้างาน:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSearchCoordinatesFromAddress}
                    disabled={isSearchingAddress}
                    className="text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  >
                    <span>🔍 {isSearchingAddress ? 'กำลังค้นหาพิกัด...' : 'ค้นหาพิกัดจากข้อความที่อยู่'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="เช่น 286 ซอย รามอินทรา 57 แยก 8 แขวงท่าแร้ง เขตบางเขน กรุงเทพมหานคร..."
                  value={mCustAddress}
                  onChange={(e) => setMCustAddress(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchCoordinatesFromAddress();
                    }
                  }}
                  className="v-input w-full py-2 text-xs bg-white border-slate-300 focus:border-emerald-500 font-sans"
                />
              </div>

              {/* Location & GPS Coordinates Section FIRST with Smart Extraction & Auto Zone Detection */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3.5 shadow-xs">
                {/* Header Row */}
                <div className="flex flex-wrap justify-between items-center gap-2 pb-2.5 border-b border-amber-500/20">
                  <label className="block font-extrabold text-slate-800 text-xs flex items-center gap-2">
                    <span className="p-1 rounded-md bg-amber-500 text-slate-900 shadow-2xs text-xs">🗺️</span>
                    <span className="text-slate-900 font-bold text-xs">1. เลือกพิกัดสถานที่ติดตั้ง (GPS Coordinates) & ปักหมุด GIS:</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGetBrowserGps}
                      disabled={isLocatingGps}
                      className="py-1.5 px-3 text-[11px] flex items-center gap-1.5 font-extrabold cursor-pointer bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-400 rounded-lg shadow-2xs transition"
                    >
                      <span className="text-emerald-600">🎯</span>
                      <span>{isLocatingGps ? 'กำลังดึง GPS...' : 'ดึงพิกัดปัจจุบัน (GPS)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(true)}
                      className="py-1.5 px-3 text-[11px] flex items-center gap-1.5 font-extrabold shadow-2xs cursor-pointer bg-amber-500 hover:bg-amber-600 text-slate-900 border border-amber-600/30 rounded-lg transition"
                    >
                      <span>📍</span>
                      <span>ปักหมุดเลือกพิกัดบนแผนที่ (ฟรี GIS)</span>
                    </button>
                  </div>
                </div>

                {/* Smart Auto-Fill & URL Extractor Box (Dashed Green Box as seen in Image 2) */}
                <div className="p-3.5 bg-white border-2 border-dashed border-emerald-500 rounded-xl space-y-2.5 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="font-extrabold text-emerald-900 text-xs flex items-center gap-1.5">
                      <span className="text-emerald-600 font-bold">📋</span>
                      <span>วางพิกัด หรือ ลิงก์จาก Google Maps อัจฉริยะ (Smart Auto-Fill)</span>
                    </label>
                    <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md font-mono">
                      รองรับ DMS (13°51'08.1"N) & URL
                    </span>
                  </div>

                  {/* Lightbulb Tip Description (Image 2 style) */}
                  <div className="p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-lg text-[11px] text-emerald-900 leading-relaxed font-medium">
                    💡 <strong>วิธีก๊อปปี้จาก Google Maps:</strong> ก๊อปปี้ข้อความพิกัดในช่องค้นหา (เช่น <code>13°51'07.1"N 100°38'36.3"E</code> หรือ <code>13.851979, 100.643406</code>) หรือก๊อปปี้ลิงก์ URL มาวางในช่องนี้ ระบบจะถอดค่าแยกละติจูด/ลองจิจูดและดึงที่ให้อัตโนมัติ!
                  </div>

                  {/* Input & Extract Button */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="วางพิกัด เช่น 13°51'07.1&quot;N 100°38'36.3&quot;E"
                      value={pasteCoordText}
                      onChange={(e) => {
                        setPasteCoordText(e.target.value);
                        if (e.target.value.length > 5) {
                          const res = parseCoordinatesFromText(e.target.value);
                          if (res) {
                            handleUpdateCoordinates(String(res.lat), String(res.lng));
                            setExtractStatusMsg({
                              type: 'success',
                              text: `✅ ถอดค่าพิกัดสำเร็จ: ละติจูด ${res.lat}, ลองจิจูด ${res.lng}`,
                            });
                          }
                        }
                      }}
                      className="v-input flex-1 py-2 px-3 text-xs bg-slate-50 focus:bg-white font-mono border-slate-300 focus:border-emerald-500 rounded-lg shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleExtractCoordinates(pasteCoordText)}
                      className="px-4 py-2 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs transition"
                    >
                      <span>✨</span>
                      <span>ถอดค่าพิกัด</span>
                    </button>
                  </div>

                  {/* Extraction Status Feedback */}
                  {extractStatusMsg && (
                    <div
                      className={`text-[11px] p-2 rounded-lg font-bold flex items-center justify-between animate-fadeIn ${
                        extractStatusMsg.type === 'success'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : extractStatusMsg.type === 'error'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}
                    >
                      <span>{extractStatusMsg.text}</span>
                      <button
                        type="button"
                        onClick={() => setExtractStatusMsg(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 ml-2 font-bold cursor-pointer border-0 bg-transparent"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Latitude & Longitude Inputs Grid (Image 1 2-column layout) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <label className="block font-bold text-slate-700 text-[11px]">
                      <span>📍 ละติจูด (Latitude):</span>
                    </label>
                    <input
                      type="text"
                      placeholder="13.851979 หรือ 13°51'07.1&quot;N"
                      value={mLat}
                      onChange={(e) => handleUpdateCoordinates(e.target.value, mLng, false)}
                      onBlur={() => handleUpdateCoordinates(mLat, mLng, true)}
                      className="v-input w-full py-1.5 font-mono text-xs text-slate-900 font-bold bg-slate-50 focus:bg-white border-slate-300 focus:border-emerald-500 rounded-lg"
                    />
                    {mLat && !isNaN(parseFloat(mLat)) && (
                      <p className="text-[10px] text-emerald-700 font-mono pt-0.5">
                        {mLat} หรือ {formatLatDms(parseFloat(mLat))}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <label className="block font-bold text-slate-700 text-[11px]">
                      <span>📍 ลองจิจูด (Longitude):</span>
                    </label>
                    <input
                      type="text"
                      placeholder="100.643406 หรือ 100°38'36.3&quot;E"
                      value={mLng}
                      onChange={(e) => handleUpdateCoordinates(mLat, e.target.value, false)}
                      onBlur={() => handleUpdateCoordinates(mLat, mLng, true)}
                      className="v-input w-full py-1.5 font-mono text-xs text-slate-900 font-bold bg-slate-50 focus:bg-white border-slate-300 focus:border-emerald-500 rounded-lg"
                    />
                    {mLng && !isNaN(parseFloat(mLng)) && (
                      <p className="text-[10px] text-emerald-700 font-mono pt-0.5">
                        {mLng} หรือ {formatLngDms(parseFloat(mLng))}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleReverseGeocode}
                    disabled={isGeocoding}
                    className="text-[11px] font-bold text-emerald-900 bg-white hover:bg-emerald-50 px-3.5 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                  >
                    <span>🏡</span>
                    <span>{isGeocoding ? 'กำลังแปลงพิกัด...' : 'แปลงพิกัดนี้เป็นที่อยู่ข้อความ'}</span>
                  </button>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mLat || '13.75633'},${mLng || '100.50177'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-900 font-bold hover:underline flex items-center gap-1.5 justify-end bg-white px-3.5 py-1.5 rounded-lg border border-slate-300 shadow-2xs"
                  >
                    <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                    <span>เปิด Google Maps ตรวจสอบตำแหน่งพิกัดบ้านลูกค้า ↗</span>
                  </a>
                </div>

                {/* Display Reverse Geocoded Address if found */}
                {geocodedAddress && (
                  <div className="p-2.5 bg-emerald-100/80 border border-emerald-300 rounded-xl text-xs text-emerald-950 flex items-start gap-2 animate-fadeIn shadow-2xs">
                    <span className="text-base">📍</span>
                    <div className="flex-1">
                      <strong className="block text-[11px] text-emerald-900 font-bold">ที่อยู่จากการแปลงพิกัด:</strong>
                      <p className="text-[11.5px] leading-tight">{geocodedAddress}</p>
                    </div>
                  </div>
                )}

                {/* Region & Auto Zone selection derived from GPS */}
                <div className="pt-2.5 border-t border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-800 text-xs">🌏 โซนพื้นที่ให้บริการ (ระบุตาม GPS อัตโนมัติ):</label>
                    {autoZoneMessage && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 animate-pulse">
                        {autoZoneMessage}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMRegion('BKK');
                        setMZone('[BKK] กรุงเทพฯ ชั้นใน (เมืองเก่า / พญาไท - ราชเทวี)');
                        setAutoZoneMessage('');
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs border cursor-pointer transition ${
                        mRegion === 'BKK' 
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🏙️ BKK (กรุงเทพฯ และปริมณฑล)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMRegion('UPC');
                        setMZone('[CT] กำแพงเพชร');
                        setAutoZoneMessage('');
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs border cursor-pointer transition ${
                        mRegion === 'UPC' 
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🏞️ UPC (ต่างจังหวัด / ภูมิภาค)
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 text-xs">📍 เลือกโซนพื้นที่ให้บริการ ({mRegion}):</label>
                    <select
                      value={mZone}
                      onChange={(e) => {
                        setMZone(e.target.value);
                        setAutoZoneMessage('');
                      }}
                      className="v-input w-full py-2 bg-white font-semibold text-slate-800 border-emerald-500/40"
                    >
                      {(mRegion === 'BKK' ? bkkZones : upcZones).map((z) => (
                        <option key={z.id} value={z.name}>
                          {z.code ? `${z.code}: ${z.name}` : z.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Service & Category Grouping Row (2.0 -> 3.0) AFTER Location is selected */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-xs flex items-center gap-1">
                    <span className="bg-amber-500 text-slate-900 px-1.5 py-0.2 rounded text-[10px] font-black">1.0</span>
                    <span>เลือกหมวดหมู่งานติดตั้ง (Category Group):</span>
                  </label>
                  <select
                    value={mCategoryCode}
                    onChange={(e) => handleCategoryCodeChange(e.target.value)}
                    className="v-input w-full py-2 bg-white border-slate-300 font-semibold text-slate-800"
                  >
                    {CATEGORY_GROUPS.map((cg) => (
                      <option key={cg.code} value={cg.code}>
                        {cg.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-xs flex items-center gap-1">
                    <span className="bg-slate-800 text-white px-1.5 py-0.2 rounded text-[10px] font-black">2.0</span>
                    <span>เลือกบริการงานติดตั้ง (Service Item):</span>
                  </label>
                  <select
                    value={mServiceId}
                    onChange={(e) => setMServiceId(e.target.value)}
                    className="v-input w-full py-2 bg-white font-medium text-slate-800"
                  >
                    {filteredServicesForModal.length === 0 ? (
                      <option value="">-- ไม่พบบริการในหมวดหมู่นี้ --</option>
                    ) : (
                      filteredServicesForModal.map((s) => (
                        <option key={s.id} value={s.id}>
                          [{s.category}] {s.name} (Min Level: {s.requiredSkillLevel})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Date & Time slot */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">วันที่นัดหมายติดตั้ง:</label>
                  <CustomDateInput
                    required
                    value={mDate}
                    onChange={(val) => setMDate(val)}
                    className="v-input w-full py-2 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">ช่วงเวลาปฏิบัติงาน:</label>
                  <select
                    value={mTimeSlot}
                    onChange={(e) => setMTimeSlot(e.target.value)}
                    className="v-input w-full py-2"
                  >
                    <option value="Morning (09:00 - 12:00)">Morning (09:00 - 12:00)</option>
                    <option value="Afternoon (13:00 - 17:00)">Afternoon (13:00 - 17:00)</option>
                    <option value="Full Day">Full Day (เต็มวัน)</option>
                  </select>
                </div>
              </div>

              {/* Source selection */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-600">ช่องทางการติดต่อที่ส่งข้อมูลเข้ามา:</label>
                <div className="flex gap-4">
                  {(['Line OA', 'Call Center 1308', 'Walk-in'] as const).map((src) => (
                    <label key={src} className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded-lg hover:bg-slate-50 flex-1 justify-center">
                      <input
                        type="radio"
                        name="createdFrom"
                        checked={mSource === src}
                        onChange={() => setMSource(src)}
                        className="accent-amber-500 scale-110"
                      />
                      <span className="font-semibold text-slate-700">{src}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualBookingModal(false)}
                  className="v-btn-secondary py-2 px-4 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="v-btn-primary py-2 px-5 cursor-pointer"
                >
                  บันทึกตั๋วคิวงานติดตั้ง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Assign Technician Modal */}
      {assignModalBooking && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-slate-900/60 animate-fadeIn">
          <div className="v-panel p-6 bg-white w-full max-w-lg border border-slate-200 rounded-2xl shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-sm font-bold text-slate-800">
                <UserCheck className="h-5 w-5 text-emerald-600" />
                <span>⚡ จัดสรรทีมช่างให้แก่คิวงาน: <span className="font-mono text-blue-700">{assignModalBooking.bookingRef}</span></span>
              </div>
              <button 
                onClick={() => setAssignModalBooking(null)}
                className="text-slate-400 hover:text-slate-600 text-sm border-0 bg-transparent font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Booking Details */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">ชื่อลูกค้า:</span>
                <span className="font-bold text-slate-800">{assignModalBooking.customerName} ({assignModalBooking.customerPhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">ประเภทงานติดตั้ง:</span>
                <span className="font-bold text-blue-700">{assignModalBooking.installationTypeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">โซนที่อยู่:</span>
                <span className="font-semibold">{assignModalBooking.addressZone}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">วัน/เวลานัดหมาย:</span>
                <span className="font-semibold text-slate-800">{formatDateDDMMYYYY(assignModalBooking.bookingDate)} | {assignModalBooking.timeSlot}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="font-semibold text-slate-500">ทักษะที่ต้องการ:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Skill Level {assignModalBooking.requiredSkillLevel}
                </span>
              </div>
            </div>

            {/* Select Technician */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">เลือกทีมช่างที่ต้องการมอบหมายงาน (Smart Match):</label>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {technicians
                  .filter((t) => t.status !== 'In Cooldown' && t.tier !== 'Cooldown')
                  .map((tech, idx) => {
                    const isSelected = selectedTechIdForAssign === tech.id;
                    const hasSkill = tech.skills.some((s) => s.level >= (assignModalBooking.requiredSkillLevel || 1));
                    return (
                      <div
                        key={tech.id}
                        onClick={() => setSelectedTechIdForAssign(tech.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-400/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={tech.avatar}
                            alt={tech.name}
                            className="h-9 w-9 rounded-lg object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                              <span>{tech.name}</span>
                              {idx === 0 && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-400 text-slate-900 shadow-2xs">
                                  ⭐ Rank #1 Match
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                              <span className={tech.tier === 'Gold' ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                                {tech.tier} Tier
                              </span>
                              <span>• ⭐ {tech.rating}</span>
                              <span>• {tech.primaryZone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          {hasSkill ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ทักษะตรงสาย
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                              ทักษะทั่วไป
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setAssignModalBooking(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer border-0"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={!selectedTechIdForAssign}
                onClick={handleConfirmAssignTech}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer border-0 shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
              >
                <UserCheck className="h-4 w-4" />
                <span>✅ ยืนยันจัดสรรช่างทีมนี้</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive OpenStreetMap GIS Picker Modal */}
      {showMapPicker && (
        <InteractiveMapPickerModal
          initialLat={parseFloat(mLat) || 13.75633}
          initialLng={parseFloat(mLng) || 100.50177}
          onSelectCoordinates={(lat, lng) => {
            handleUpdateCoordinates(String(lat), String(lng));
          }}
          onClose={() => setShowMapPicker(false)}
        />
      )}

    </div>
  );
};
