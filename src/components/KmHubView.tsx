import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Cpu, 
  MessageSquare, 
  Smartphone, 
  ClipboardCheck, 
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'matching' | 'penalty' | 'integration' | 'general';
}

interface SystemNode {
  id: string;
  title: string;
  subtitle: string;
  shortDesc: string;
  icon: React.ComponentType<any>;
  details: string[];
  colorClass: string;
  borderColorClass: string;
  textColorClass: string;
}

export const KmHubView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'faq' | 'architecture' | 'guide'>('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [faqExpanded, setFaqExpanded] = useState<Record<string, boolean>>({});
  const [selectedSystemId, setSelectedSystemId] = useState<string>('e-ordering');

  const faqs: FAQItem[] = [
    {
      id: 'faq-match-score',
      question: 'การคำนวณคะแนน Match Score (%) ของระบบจองช่างมีเกณฑ์อย่างไร?',
      category: 'matching',
      answer: 'ระบบจะนำช่างที่ผ่านเกณฑ์พื้นฐาน (มีประเภททักษะที่ต้องการ และมีเลเวลผ่านเกณฑ์ขั้นต่ำ) มาจัดลำดับคะแนน (0-100%) ดังนี้:\n\n' +
              '• 🎯 **ทักษะตรงสาย (Base Skill Match)**: ได้รับพื้นฐานทันที +40 คะแนน\n' +
              '• 🌟 **เลเวลทักษะ (Skill Level Bonus)**: หากเลเวลช่างสูงกว่าเกณฑ์ขั้นต่ำที่ต้องการ ได้รับโบนัส +10 คะแนน\n' +
              '• 📍 **พื้นที่ให้บริการ (Zone Match)**: ตรงกับเขตหลัก (Primary Zone) +15 คะแนน, ตรงกับเขตรอง (Secondary Zone) +5 คะแนน\n' +
              '• 🏢 **สังกัดสาขา (Branch Sync)**: ช่างสังกัดอยู่สาขาเดียวกับสาขาที่รับงานจอง ได้รับคะแนนพิเศษ +15 คะแนน\n' +
              '• 🏆 **ระดับความน่าเชื่อถือ (Tech Tier)**: ระดับ Gold ได้รับ +10 คะแนน, ระดับ Silver ได้รับ +5 คะแนน\n' +
              '• ⭐ **คะแนนรีวิวลูกค้า (Rating Bonus)**: คะแนนดิบนำมาคำนวณสัดส่วนเต็ม 10 เช่น เรตติ้ง 4.8 ได้รับ +9.6 คะแนน (คำนวณจาก Rating / 5.0 * 10)\n' +
              '• ⚠️ **แต้มบทลงโทษ (Penalty Deduction)**: หักคะแนนออกตามแต้มสะสมความผิด โดยนำแต้มปรับสะสมมาหาร 5 (เช่น มีแต้มผิด 25 แต้ม จะโดนหัก -5 คะแนน)\n\n' +
              'คะแนนทั้งหมดจะรวมกันและปัดเศษ (สูงสุดไม่เกิน 100% ขั้นต่ำ 0%) เพื่อให้แนะนำช่างที่เหมาะสมที่สุดในตำแหน่งต้นๆ'
    },
    {
      id: 'faq-penalty-impact',
      question: 'แต้มลงโทษสะสม (Penalty Points) ส่งผลกระทบต่อสิทธิ์ในการรับคิวงานช่างอย่างไรบ้าง?',
      category: 'penalty',
      answer: 'แต้มลงโทษจะถูกหักสะสมจากความผิด เช่น ทำงานล่าช้า, ทำทรัพย์สินเสียหาย หรือไม่ผ่าน QC โดยเกณฑ์การควบคุมคิวมีดังนี้:\n\n' +
              '• 🟢 **0 - 14 คะแนน (ระดับปกติ)**: ช่างสามารถรับงานและจองคิวอัจฉริยะได้ตามปกติ (หักคะแนน Match Score เล็กน้อย)\n' +
              '• 🟡 **15 - 29 คะแนน (เฝ้าระวัง)**: ระบบปรับลดคิวงานลง 15% และคะแนนความเหมาะสมจะถูกหักเพิ่มขึ้น\n' +
              '• 🟠 **30 - 44 คะแนน (พักงานชั่วคราว / Bronze)**: ปรับลดระดับงานอัตโนมัติ และได้รับคิวงานช้ากว่าทีมช่างปกติ\n' +
              '• 🔴 **45 - 89 คะแนน (พักงานฉุกเฉิน / Cooldown)**: ช่างจะติดสถานะพักงาน (In Cooldown) ทันทีเป็นเวลา 7 วัน ทำให้ระบบจองช่างอัจฉริยะบล็อกไม่ให้จ่ายคิวงานให้ทีมนี้โดยเด็ดขาด\n' +
              '• ❌ **90 คะแนนขึ้นไป (ระงับสิทธิ์ / Suspended)**: ระงับสิทธิ์ในการรับงานติดตั้งถาวร หรือจนกว่าจะผ่านการพิจารณาอุทธรณ์และอบรมพัฒนาใหม่'
    },
    {
      id: 'faq-kanna-vs-sts',
      question: 'ระบบ KANNA และระบบ STS ต่างกันอย่างไรในการเชื่อมต่อเพื่อคุมงานช่าง?',
      category: 'integration',
      answer: 'ทั้งสองระบบทำงานร่วมกันในการติดตามงานสนาม แต่มีบทบาทที่ต่างกันเด่นชัด:\n\n' +
              '1. **KANNA (Project Management & Chat)**: เป็นศูนย์กลางการสื่อสารและโครงร่างงาน ใช้เก็บประวัติการจ่ายงาน สถานะการรับงานของช่าง และเป็นห้องแชทระหว่างแอดมิน vService กับช่างที่รับงาน เพื่อคุยรายละเอียดและแก้ไขปัญหาหน้างานจริง\n' +
              '2. **STS (Service Tracking System - Mobile Web App)**: เป็นระบบที่ช่างใช้สแกนและบันทึกเวลาจริงเชิงกายภาพและผลงาน ได้แก่ การกด GPS Check-in เพื่อยืนยันว่าเข้าพื้นที่บ้านลูกค้าตรงเวลา, การอัปโหลดรูปภาพสถานะหน้างานก่อน-หลังติดตั้ง และการกด Check-out เพื่อปิดงานเข้าขั้นตอนตรวจรับเงิน'
    },
    {
      id: 'faq-qc-loop',
      question: 'กระบวนการ Feedback Loop จาก QC ไปสู่การลงโทษ E-CN ทำงานอย่างไร?',
      category: 'integration',
      answer: 'เมื่อช่างทำงานเสร็จและกดปิดงานในระบบ STS ระบบจะส่งสัญญาณแจ้งเตือนไปยังทีมผู้ตรวจสอบคุณภาพ (QC Inspector):\n\n' +
              '1. ผู้ตรวจสอบหน้างานจริงจะเข้าประเมินงานติดตั้งตามเกณฑ์มาตรฐาน\n' +
              '2. หากพบข้อบกพร่อง (เช่น ท่อน้ำยารั่ว, หน้าบานเอียง, ผิวชำรุด) จะทำบันทึกและกดประเมิน **QC Failed**\n' +
              '3. ข้อมูลรายงานจะส่งตรงไปยังระบบ **Penalty System (E-CN)** เพื่อออกใบสั่งปรับ E-CN อัตโนมัติระบุค่าปรับและตัดแต้มช่าง\n' +
              '4. ผลของการตัดแต้ม (เช่น การลด Tier หรือ Cooldown) จะถูกส่งกลับเข้ามาอัปเดตประวัติช่างใน **Installer Management** ทันที เพื่อพักงานหรือลดสิทธิ์ในการถูกจองคิวงานถัดไปโดยอัตโนมัติ'
    },
    {
      id: 'faq-clear-points',
      question: 'ช่างสามารถล้างคะแนนหรือยื่นอุทธรณ์ใบสั่งปรับ (Penalty E-CN) ได้อย่างไร?',
      category: 'penalty',
      answer: 'ช่างสามารถดำเนินการได้ผ่านช่องทางอย่างเป็นทางการดังนี้:\n\n' +
              '• **การจ่ายค่าปรับ**: เมื่อช่างชำระเงินค่าปรับตามยอดในใบ E-CN สำเร็จ สถานะของคดีความจะเปลี่ยนเป็น "Resolved / Fine Paid" ซึ่งจะช่วยจำกัดไม่ให้หักคะแนนเพิ่มเติม\n' +
              '• **การยื่นอุทธรณ์ (Appealed)**: ในกรณีที่มีเหตุสุดวิสัย (เช่น ลูกค้าแจ้งข้อมูลหน้างานผิดพลาด หรือพิกัดเลื่อน) ช่างสามารถยื่นเอกสารหลักฐานอุทธรณ์ผ่านเจ้าหน้าที่สาขา เพื่อให้คณะกรรมการพิจารณาคืนคะแนนความประพฤติและปลด Cooldown ก่อนกำหนดได้'
    }
  ];

  const systemNodes: SystemNode[] = [
    {
      id: 'e-ordering',
      title: 'E-ordering / COOHOM',
      subtitle: 'Selling Tools System',
      shortDesc: 'ระบบจองสั่งซื้อและออกแบบ',
      icon: Layers,
      colorClass: 'bg-blue-50 text-blue-700',
      borderColorClass: 'border-blue-200 focus:border-blue-500',
      textColorClass: 'text-blue-800',
      details: [
        'รับคำสั่งซื้อสินค้าพร้อมงานติดตั้งจากหน้าร้าน (ไทวัสดุ/BnB Home) และช่องทางออนไลน์',
        'ลูกค้าเลือกวันติดตั้งและทำการเลือกรูปแบบประเภทการติดตั้ง',
        'ระบบส่งข้อมูลที่อยู่ เบอร์ติดต่อ และประเภทงานติดตั้งเข้าสู่ฐานข้อมูลระบบ Installer Management เพื่อประมวลผลจัดหาคิวช่าง'
      ]
    },
    {
      id: 'installer-mgmt',
      title: 'Installer Management',
      subtitle: 'vService Core Engine',
      shortDesc: 'ระบบบริหารคิว ทักษะ และการคำนวณจับคู่ช่าง',
      icon: Cpu,
      colorClass: 'bg-purple-50 text-purple-700',
      borderColorClass: 'border-purple-200 focus:border-purple-500',
      textColorClass: 'text-purple-800',
      details: [
        'วิเคราะห์ความประพฤติ ประวัติทักษะ (Skill Matrix) โซนบริการ และแต้มความผิดของช่างทั้งหมด',
        'ประมวลผลผ่าน Smart Booking Engine เพื่อคำนวณ Match Score (%) ค้นหาช่างที่ดีและว่างที่สุด',
        'ควบคุมสิทธิ์การกระจายคิวงาน และบังคับใช้การพักงาน (Cooldown) เมื่อช่างติดโทษปรับสะสม'
      ]
    },
    {
      id: 'kanna',
      title: 'KANNA System',
      subtitle: 'Project & Communication',
      shortDesc: 'เครื่องมือติดตามงานและแชทกับช่าง',
      icon: MessageSquare,
      colorClass: 'bg-indigo-50 text-indigo-700',
      borderColorClass: 'border-indigo-200 focus:border-indigo-500',
      textColorClass: 'text-indigo-800',
      details: [
        'เปิดจองโปรเจกต์งานติดตั้งและสร้างห้องแชทอัตโนมัติสำหรับทีมช่างและแอดมินหลังบ้าน',
        'แจ้งข้อมูลรายละเอียดที่อยู่ หน้างาน และไฟล์เอกสารติดตั้งไปยังแอปพลิเคชันมือถือของช่าง',
        'บันทึกสเตตัสการส่งมอบงานและการพูดคุยโต้ตอบตลอดการปฏิบัติงาน'
      ]
    },
    {
      id: 'sts',
      title: 'STS (Service Tracking)',
      subtitle: 'On-site Mobile Webapp',
      shortDesc: 'บันทึกเวลาจริงและผลงานช่าง',
      icon: Smartphone,
      colorClass: 'bg-emerald-50 text-emerald-700',
      borderColorClass: 'border-emerald-200 focus:border-emerald-500',
      textColorClass: 'text-emerald-800',
      details: [
        'ใช้บันทึกเวลาปฏิบัติงานจริง ณ บ้านลูกค้าด้วยพิกัด GPS เพื่อเช็กการเข้างานตรงเวลา (SLA)',
        'บันทึกรูปถ่ายหน้างานก่อนทำ ระหว่างทำ และหลังติดตั้งเสร็จ เพื่อเก็บหลักฐานการทำงาน',
        'ส่งข้อมูลรูปถ่ายและเวลาปิดงานกลับเข้าระบบเพื่อรอตรวจสอบคุณภาพการส่งมอบงาน'
      ]
    },
    {
      id: 'qc',
      title: 'QC Inspection',
      subtitle: 'Quality Control Audit',
      shortDesc: 'การประเมินคุณภาพงานติดตั้ง',
      icon: ClipboardCheck,
      colorClass: 'bg-teal-50 text-teal-700',
      borderColorClass: 'border-teal-200 focus:border-teal-500',
      textColorClass: 'text-teal-800',
      details: [
        'เจ้าหน้าที่ Inspector เข้าตรวจสอบผลงานการติดตั้งตามมาตรฐาน Checklist รายหมวดหมู่',
        'หากงานผ่านเกณฑ์: ระบบส่งต่อจ่ายเงินค่าจ้างติดตั้งให้ทีมช่าง',
        'หากงานไม่ผ่านเกณฑ์ (Failed): Inspector บันทึกรายการข้อบกพร่องและสร้างงานส่งต่อให้ระบบบทลงโทษปรับปรุง'
      ]
    },
    {
      id: 'e-cn',
      title: 'E-CN & Penalty Loop',
      subtitle: 'Enforcement Feedback',
      shortDesc: 'ระบบแจ้งลงโทษและพักงานช่าง',
      icon: ShieldAlert,
      colorClass: 'bg-rose-50 text-rose-700',
      borderColorClass: 'border-rose-200 focus:border-rose-500',
      textColorClass: 'text-rose-800',
      details: [
        'ออกเอกสารลดสิทธิ์/แจ้งหนี้ค่าปรับ (E-CN Invoice) ส่งไปยังทีมช่างเพื่อชำระค่าชดเชยความเสียหาย',
        'คำนวณการหักคะแนนพฤติกรรม และส่งแต้มลบมาอัปเดตที่โปรไฟล์ช่าง',
        'ส่งข้อมูลสั่งห้ามส่งคิวงาน (Cooldown 7 วัน หรือ Suspended) กลับมาคุมสิทธิ์ช่างในหน้าหลักอัตโนมัติ'
      ]
    }
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (id: string) => {
    setFaqExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'matching':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">การจัดคิวช่าง</span>;
      case 'penalty':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">กฎและโทษปรับ</span>;
      case 'integration':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">การเชื่อมต่อระบบ</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">ทั่วไป</span>;
    }
  };

  const activeSystem = systemNodes.find(n => n.id === selectedSystemId) || systemNodes[0];
  const ActiveIcon = activeSystem.icon;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="v-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">ศูนย์การเรียนรู้ & FAQ (Knowledge Management Portal)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            คลังข้อมูลกฎเกณฑ์การประเมินช่าง, โครงสร้างสถาปัตยกรรมระบบเชื่อมต่อ และคู่มือการใช้งานฟังก์ชันการทำงานในระบบ
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-lg shrink-0 border border-slate-200">
          <button
            onClick={() => setActiveSubTab('faq')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'faq' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            💡 คำถามที่พบบ่อย (FAQs)
          </button>
          <button
            onClick={() => setActiveSubTab('architecture')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'architecture' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🔗 สถาปัตยกรรมระบบ (KM)
          </button>
          <button
            onClick={() => setActiveSubTab('guide')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'guide' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🛠️ คู่มือใช้งาน Prototype
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: FAQs */}
      {activeSubTab === 'faq' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Search bar inside FAQ */}
          <div className="v-panel p-4 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="ค้นหาหัวข้อคำถาม หรือคำค้น เช่น Match Score, โดนพักงาน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="v-input w-full pl-9 py-2"
              />
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <span className="text-xs text-slate-400 font-semibold font-sans">
              พบ {filteredFaqs.length} รายการถามตอบ
            </span>
          </div>

          {/* Accordion FAQ List */}
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="v-panel p-10 text-center text-slate-400">
                ไม่พบคำตอบที่คุณค้นหา ลองเปลี่ยนคำค้น เช่น "E-CN", "พิกัด", "ช่าง"
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isExpanded = !!faqExpanded[faq.id];
                return (
                  <div 
                    key={faq.id} 
                    className="v-panel overflow-hidden border border-slate-200 transition-all hover:border-slate-300 shadow-xs bg-white"
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 pr-4">
                        <div className="shrink-0">{getCategoryBadge(faq.category)}</div>
                        <span className="font-bold text-slate-800 text-sm md:text-base">{faq.question}</span>
                      </div>
                      <div className="shrink-0 text-slate-400">
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 text-xs md:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/30 whitespace-pre-line animate-slideDown">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: System KM & Architecture */}
      {activeSubTab === 'architecture' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Interactive Flow Chart Container */}
          <div className="v-panel p-6 bg-white overflow-x-auto">
            <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-wider text-center">
              วงจรการเชื่อมต่อข้อมูลหน้างานและการลงโทษ (E-ordering ↔ KANNA ↔ STS ↔ QC ↔ E-CN Feedback Loop)
            </h3>
            
            <div className="flex items-center justify-between min-w-[900px] pb-4 px-2">
              {systemNodes.map((node, index) => {
                const IconComponent = node.icon;
                const isSelected = selectedSystemId === node.id;
                
                return (
                  <React.Fragment key={node.id}>
                    {/* Node Element */}
                    <button
                      onClick={() => setSelectedSystemId(node.id)}
                      className={`relative flex flex-col items-center p-3.5 rounded-xl border-2 transition-all duration-300 w-36 cursor-pointer hover:shadow-md hover:scale-105 ${
                        isSelected 
                          ? `${node.colorClass} ${node.borderColorClass} ring-4 ring-slate-100 font-bold scale-105`
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`p-2 rounded-lg mb-2 ${isSelected ? 'bg-white shadow-sm' : node.colorClass}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">
                        {node.title}
                      </span>
                      <span className="text-[9px] text-slate-400 text-center mt-1">
                        {node.subtitle}
                      </span>

                      {/* Selection indicator arrow */}
                      {isSelected && (
                        <div className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-slate-200 rotate-45 z-20"></div>
                      )}
                    </button>

                    {/* Connecting Arrow */}
                    {index < systemNodes.length - 1 && (
                      <div className="flex flex-col items-center justify-center shrink-0">
                        <ArrowRight className="h-5 w-5 text-slate-300 animate-pulse" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">API</span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Node Detail Description Panel */}
          <div className="v-panel p-6 bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-200 pb-5 md:pb-0 md:pr-6 flex flex-col items-center md:items-start text-center md:text-left justify-center">
              <div className={`p-3.5 rounded-2xl mb-4 ${activeSystem.colorClass}`}>
                <ActiveIcon className="h-7 w-7" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">{activeSystem.title}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{activeSystem.subtitle}</p>
              <p className="text-xs font-semibold text-blue-600 mt-2">{activeSystem.shortDesc}</p>
            </div>

            <div className="md:col-span-2 space-y-4">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                บทบาทหน้าที่และการส่งรับข้อมูล (System Responsibilities & Data Flow)
              </h5>
              
              <ul className="space-y-3.5">
                {activeSystem.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-xs md:text-sm text-slate-600 leading-relaxed">
                      {detail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Extra KM Info: Core Rules Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="v-panel p-5 border-l-4 border-amber-500 space-y-3 bg-white">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-amber-600" />
                <h4 className="font-bold text-slate-800 text-sm">สูตรคำนวณ Match Score (%) ใน Smart Booking</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                การหาคิวช่างที่ดีที่สุดอิงจากสูตร: <br/>
                <code className="block bg-slate-50 p-2 rounded mt-1.5 font-mono text-[10px] text-slate-700 leading-normal">
                  Score = BaseMatch(40) + SkillBonus(10) + ZoneMatch(15/5) + BranchSync(15) + TierBonus(10/5) + RatingBonus(10) - PenaltyDeduction(Points / 5)
                </code>
                เกณฑ์ผ่านการจับคู่ขั้นต่ำคือช่างจะต้องผ่าน **เลเวลทักษะความเชี่ยวชาญ** ที่งานต้องการเป็นหลัก ไม่ติดโทษแบน และอยู่ในโซนบริการเท่านั้น
              </p>
            </div>

            <div className="v-panel p-5 border-l-4 border-rose-500 space-y-3 bg-white">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <h4 className="font-bold text-slate-800 text-sm">กฎเหล็กการพักคิวงาน (Cooldown & Penalty Control)</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                หากเกิดใบสั่งปรับ E-CN ขึ้น ช่างจะโดนลดคะแนนประพฤติตามความเสียหาย:
                <span className="block mt-1.5 space-y-1">
                  <span className="block text-[11px]">• 🛑 **ตัด 25 แต้มขึ้นไป**: ลด Tier ทันที + ติดสถานะพักรับคิวงานชั่วคราว (**Cooldown 7 วัน**)</span>
                  <span className="block text-[11px]">• ❌ **ตัดสะสมเกิน 90 แต้ม**: ระงับสิทธิ์การให้บริการในระบบ (**Suspended**)</span>
                </span>
                ประวัติความผิดทั้งหมดจะอัปเดตโปรไฟล์ช่างแบบเรียลไทม์เพื่อรักษามาตรฐานการติดตั้ง
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: Core Features Guide */}
      {activeSubTab === 'guide' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="v-panel p-5 bg-white space-y-4">
            <h3 className="font-bold text-slate-800 text-base">คู่มือการทดสอบฟังก์ชันต่างๆ บนแอปจำลอง (Prototype Walkthrough)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ต้นแบบ vService ระบบบริหารช่างได้รับการออกแบบมาเพื่อแสดงผลการรับส่งข้อมูลจริงระหว่างแอปพลิเคชันต่างๆ คุณสามารถทดสอบเวิร์กโฟลว์ด้วยตนเองได้ตามขั้นตอนดังนี้:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/30 transition-all space-y-2">
                <h4 className="font-bold text-slate-800 text-xs md:text-sm">1. ระบบแนะนำช่างอัจฉริยะ (Smart Booking)</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  ไปที่เมนู **จองคิวช่างอัจฉริยะ** ➔ เลือกสาขา ➔ เลือกประเภทงาน ➔ กดปุ่ม "คำนวณและแนะนำทีมช่าง" ➔ ระบบจะแสดงรายชื่อช่างที่เหมาะสมที่สุดพร้อมรายละเอียด Match Score และเหตุผลเกณฑ์คำนวณ ➔ กด "เลือกทีมช่างและสร้างคิวงาน" เพื่อส่งข้อมูลเข้าตารางหลัก
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/30 transition-all space-y-2">
                <h4 className="font-bold text-slate-800 text-xs md:text-sm">2. การส่งงานและอัปเดต (Integration Simulator)</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  ไปที่เมนู **ตารางคิวงานติดตั้ง** ➔ สังเกตสถานะคิวงาน ➔ กดปุ่ม "ส่งไป KANNA" เพื่อส่งงาน ➔ หน้าต่างจะโชว์ Logs การเชื่อมต่อ ➔ ไปที่แท็บ **Integration Simulator** เพื่อกดอัปเดตสเตตัสงานจาก KANNA ➔ STS (Check-in) ➔ ปิดงาน ➔ และตรวจ QC
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/30 transition-all space-y-2">
                <h4 className="font-bold text-slate-800 text-xs md:text-sm">3. การทดสอบ Feedback Loop บทลงโทษ (QC Failed)</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  ที่เมนู **Integration Simulator** ให้เลือกงานติดตั้งที่ต้องการทดสอบ ➔ กดปุ่มจำลองเหตุการณ์ "QC ตรวจพบตำหนิ (Failed)" ➔ ระบบจะทำการเรียกใบแจ้งหนี้ค่าปรับ E-CN ➔ ประวัติช่างจะเปลี่ยนเป็น "In Cooldown" ทันที และโดนตัดสิทธิ์การแนะนำคิวงานใหม่
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/30 transition-all space-y-2">
                <h4 className="font-bold text-slate-800 text-xs md:text-sm">4. ตรวจสอบใบลงโทษ และล้างประวัติ</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  ไปที่เมนู **รายการลงโทษ E-CN** เพื่อตรวจเช็กยอดค่าปรับและรายละเอียดสาเหตุการโดนตัดคะแนน ➔ และกลับไปที่เมนูหลักเพื่อตรวจสอบการสืบค้นหาข้อมูลสาขาและแผนที่สาขาทั้ง 95+ แห่งที่นำเข้ามาจากไฟล์ภายนอก
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
