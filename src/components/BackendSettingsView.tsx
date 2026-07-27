import React from 'react';
import type { MatchWeights, SystemConfig } from '../types';
import { 
  Sliders, 
  Settings, 
  RefreshCw, 
  Database, 
  ShieldAlert, 
  Check, 
  Info,
  Award,
  MapPin,
  TrendingDown
} from 'lucide-react';

interface BackendSettingsViewProps {
  matchWeights: MatchWeights;
  onUpdateMatchWeights: (weights: MatchWeights) => void;
  systemConfig: SystemConfig;
  onUpdateSystemConfig: (config: SystemConfig) => void;
}

export const BackendSettingsView: React.FC<BackendSettingsViewProps> = ({
  matchWeights,
  onUpdateMatchWeights,
  systemConfig,
  onUpdateSystemConfig
}) => {
  
  // Custom presets
  const presets = [
    {
      name: 'ค่าเริ่มต้นแนะนำ (Default Preset)',
      desc: 'ค่าน้ำหนักมาตรฐานของระบบจัดส่งคิวช่าง vService',
      weights: {
        baseMatch: 40,
        levelBonus: 10,
        primaryZone: 15,
        secondaryZone: 5,
        branchSync: 15,
        goldTier: 10,
        silverTier: 5,
        ratingMultiplier: 10,
        penaltyDivisor: 5
      }
    },
    {
      name: 'เน้นความชำนาญและคุณภาพ (Quality First)',
      desc: 'เพิ่มความสำคัญของเลเวลและอันดับระดับช่าง (Tier & Level)',
      weights: {
        baseMatch: 30,
        levelBonus: 25,
        primaryZone: 10,
        secondaryZone: 0,
        branchSync: 5,
        goldTier: 15,
        silverTier: 5,
        ratingMultiplier: 15,
        penaltyDivisor: 5
      }
    },
    {
      name: 'เน้นความรวดเร็วตามสาขาสังกัด (Branch & Proximity First)',
      desc: 'เพิ่มความสำคัญของสาขาสังกัดช่าง (Branch Sync) เพื่อวิ่งหน้างานด่วน',
      weights: {
        baseMatch: 30,
        levelBonus: 5,
        primaryZone: 20,
        secondaryZone: 5,
        branchSync: 30,
        goldTier: 5,
        silverTier: 3,
        ratingMultiplier: 5,
        penaltyDivisor: 3
      }
    }
  ];

  const handleApplyPreset = (presetWeights: MatchWeights) => {
    onUpdateMatchWeights(presetWeights);
  };

  const handleWeightChange = (key: keyof MatchWeights, value: number) => {
    onUpdateMatchWeights({
      ...matchWeights,
      [key]: value
    });
  };

  const handleConfigChange = (key: keyof SystemConfig, value: any) => {
    onUpdateSystemConfig({
      ...systemConfig,
      [key]: value
    });
  };

  // Calculate sum of positive weights to display contribution summary
  const totalPositiveWeights = 
    matchWeights.baseMatch + 
    matchWeights.levelBonus + 
    matchWeights.primaryZone + 
    matchWeights.branchSync + 
    matchWeights.goldTier + 
    matchWeights.ratingMultiplier;

  const getPercentage = (value: number) => {
    if (totalPositiveWeights === 0) return '0%';
    return `${Math.round((value / totalPositiveWeights) * 100)}%`;
  };

  return (
    <div className="space-y-6">
      
      {/* Header View */}
      <div className="v-panel p-5 flex items-center justify-between bg-white border border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Settings className="h-6 w-6 text-blue-600 animate-spin-slow" />
            <h2 className="text-xl font-bold text-slate-800">การตั้งค่าพารามิเตอร์ระบบหลังบ้าน (Backend Configuration Panel)</h2>
          </div>
          <p className="text-xs text-slate-500">
            ปรับเปลี่ยนน้ำหนักคะแนนความเหมาะสมช่าง (Smart Booking weights), เกณฑ์ตัดแต้มพักงาน และที่อยู่อ้างอิง API ของการเชื่อมโยงระบบ
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Preset & Weights */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Admin Presets */}
          <div className="v-panel p-5 bg-white space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              <span>เทมเพลตตั้งค่าด่วน (Configuration Presets)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {presets.map((preset) => {
                // Check if current weights match preset weights
                const isActive = Object.keys(preset.weights).every(
                  (k) => matchWeights[k as keyof MatchWeights] === preset.weights[k as keyof MatchWeights]
                );

                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset.weights)}
                    className={`text-left p-4 rounded-xl border-2 transition duration-200 cursor-pointer flex flex-col justify-between ${
                      isActive 
                        ? 'bg-blue-600/10 border-blue-600 text-blue-500 font-bold shadow-md' 
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black leading-snug">{preset.name}</div>
                      <p className="text-[10px] text-slate-400 font-semibold leading-normal mt-1">{preset.desc}</p>
                    </div>
                    {isActive && (
                      <span className="text-[10px] font-black text-blue-600 block mt-3 flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> ใช้งานอยู่
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slider Weights Controls */}
          <div className="v-panel p-5 bg-white space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-blue-600" />
              <span>ค่าน้ำหนักจับคู่ช่างอัจฉริยะ (Match Score Weight Sliders)</span>
            </h3>

            <div className="space-y-4">
              {/* Slider 1: Base match */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-amber-500" /> ทักษะสายงานตรงกัน (Base Skill Match)</span>
                  <span>{matchWeights.baseMatch} คะแนน ({getPercentage(matchWeights.baseMatch)})</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={matchWeights.baseMatch}
                  onChange={(e) => handleWeightChange('baseMatch', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>

              {/* Slider 2: Level bonus */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-amber-500" /> เลเวลช่างเกินเกณฑ์กำหนด (Skill Level Bonus)</span>
                  <span>{matchWeights.levelBonus} คะแนน ({getPercentage(matchWeights.levelBonus)})</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={matchWeights.levelBonus}
                  onChange={(e) => handleWeightChange('levelBonus', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>

              {/* Slider 3: Primary Zone */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-amber-500" /> โซนเขตหลักให้บริการ (Primary Zone Match)</span>
                  <span>{matchWeights.primaryZone} คะแนน ({getPercentage(matchWeights.primaryZone)})</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={matchWeights.primaryZone}
                  onChange={(e) => handleWeightChange('primaryZone', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>

              {/* Slider 4: Branch Sync */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-amber-500" /> ช่างสังกัดตรงกับสาขาใบสั่งซื้อ (Branch Proximity Sync)</span>
                  <span>{matchWeights.branchSync} คะแนน ({getPercentage(matchWeights.branchSync)})</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={matchWeights.branchSync}
                  onChange={(e) => handleWeightChange('branchSync', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>

              {/* Slider 5: Gold tier */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-amber-500" /> ทีมช่างระดับเหรียญทอง (Gold Tier Bonus)</span>
                  <span>{matchWeights.goldTier} คะแนน ({getPercentage(matchWeights.goldTier)})</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={matchWeights.goldTier}
                  onChange={(e) => handleWeightChange('goldTier', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>

              {/* Slider 6: Rating */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-amber-500" /> อัตราเรตติ้งความพึงพอใจลูกค้า (Rating Multiplier)</span>
                  <span>สูงสุด {matchWeights.ratingMultiplier} คะแนน ({getPercentage(matchWeights.ratingMultiplier)})</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={matchWeights.ratingMultiplier}
                  onChange={(e) => handleWeightChange('ratingMultiplier', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>

              {/* Slider 7: Penalty divisor */}
              <div className="space-y-1 border-t border-slate-200/50 pt-3">
                <div className="flex justify-between text-xs font-bold text-rose-500">
                  <span className="flex items-center gap-1.5"><TrendingDown className="h-4 w-4" /> ตัวหารหักคะแนนความผิดสะสม (Penalty Points Divisor)</span>
                  <span>หักออก = แต้ม / {matchWeights.penaltyDivisor} คะแนน</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={matchWeights.penaltyDivisor}
                  onChange={(e) => handleWeightChange('penaltyDivisor', parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
                <span className="text-[10px] text-slate-400 block font-medium">
                  *ยิ่งค่าน้อยระบบจะยิ่งตัดคะแนนความเหมาะสมช่างหนักขึ้นเมื่อทำผิด (เช่น ตัวหาร 2 จะโดนหักคะแนน 2 เท่าของตัวหาร 4)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Penalty thresholds & API */}
        <div className="space-y-6">
          
          {/* Penalty Rules Thresholds */}
          <div className="v-panel p-5 bg-white space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-rose-600 animate-pulse" />
              <span>เกณฑ์ควบคุมบทลงโทษ (Penalty Controls)</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  แต้มพักงานฉุกเฉินสะสม (Cooldown Threshold):
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="30"
                    max="60"
                    value={systemConfig.cooldownThreshold}
                    onChange={(e) => handleConfigChange('cooldownThreshold', parseInt(e.target.value))}
                    className="flex-1 accent-rose-500 cursor-pointer"
                  />
                  <span className="text-xs font-black text-rose-500 w-12 text-right">{systemConfig.cooldownThreshold} แต้ม</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  แต้มระงับสิทธิ์สะสม (Suspension Threshold):
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="70"
                    max="100"
                    value={systemConfig.suspensionThreshold}
                    onChange={(e) => handleConfigChange('suspensionThreshold', parseInt(e.target.value))}
                    className="flex-1 accent-rose-500 cursor-pointer"
                  />
                  <span className="text-xs font-black text-rose-500 w-12 text-right">{systemConfig.suspensionThreshold} แต้ม</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  ⏱️ ระยะเวลาการสไลด์แบนเนอร์หน้าร้าน (Banner Slide Delay):
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="2"
                    max="12"
                    step="1"
                    value={systemConfig.bannerSlideInterval || 5}
                    onChange={(e) => handleConfigChange('bannerSlideInterval', parseInt(e.target.value))}
                    className="flex-1 accent-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-black text-amber-500 w-12 text-right">{systemConfig.bannerSlideInterval || 5} วินาที</span>
                </div>
                <span className="text-[9px] text-slate-400 block mt-1 leading-normal">
                  *กำหนดระยะเวลาเป็นวินาทีก่อนที่แบนเนอร์หน้าร้านจะสลับรูปภาพโดยอัตโนมัติ
                </span>
              </div>
              
              <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-500/20 text-[10px] text-rose-600 flex items-start gap-2">
                <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  หากช่างติดตั้งมีแต้มความผิดสะสมจาก E-CN เกินค่าเกณฑ์ Cooldown ช่างจะถูกบล็อกและโดนพักงาน 7 วัน ไม่สามารถรับคิวงานจองได้ทันที
                </span>
              </div>
            </div>
          </div>

          {/* Webhook API Endpoints */}
          <div className="v-panel p-5 bg-white space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Database className="h-4 w-4 text-blue-600" />
              <span>ที่อยู่เชื่อมต่อ API ระบบองค์กร (API Gateways)</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">KANNA API Endpoint:</label>
                <input
                  type="text"
                  value={systemConfig.kannaApiUrl}
                  onChange={(e) => handleConfigChange('kannaApiUrl', e.target.value)}
                  className="v-input w-full py-1 text-[11px] font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">STS Check-in Webhook:</label>
                <input
                  type="text"
                  value={systemConfig.stsWebhookUrl}
                  onChange={(e) => handleConfigChange('stsWebhookUrl', e.target.value)}
                  className="v-input w-full py-1 text-[11px] font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">QC Audit Inspector API:</label>
                <input
                  type="text"
                  value={systemConfig.qcInspectorUrl}
                  onChange={(e) => handleConfigChange('qcInspectorUrl', e.target.value)}
                  className="v-input w-full py-1 text-[11px] font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">E-CN Invoice billing ERP Webhook:</label>
                <input
                  type="text"
                  value={systemConfig.eCnErpUrl}
                  onChange={(e) => handleConfigChange('eCnErpUrl', e.target.value)}
                  className="v-input w-full py-1 text-[11px] font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <span>🔑 Google Maps API Key (สำหรับอนาคต):</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น AIzaSy..."
                  value={systemConfig.googleMapsApiKey || ''}
                  onChange={(e) => handleConfigChange('googleMapsApiKey', e.target.value)}
                  className="v-input w-full py-1.5 text-[11px] font-mono font-bold text-blue-700 bg-amber-500/5 border-amber-500/30"
                />
                <span className="text-[9px] text-slate-400 block mt-1 leading-relaxed">
                  *กุญแจสำคัญสำหรับเปิดฟังก์ชัน Autocomplete ช่วยแนะนำการสะกดที่อยู่ลูกค้า และวัดระยะเดินทางขับขี่จริงผ่าน Google Cloud ในการคำนวณ Match Score
                </span>
              </div>
            </div>
          </div>

          {/* MinIO Storage Configuration */}
          <div className="v-panel p-5 bg-white space-y-4 border-2 border-emerald-500/20">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="text-emerald-600">🗄️</span>
              <span>MinIO Object Storage (S3-Compatible VPS Storage)</span>
            </h3>

            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 leading-relaxed">
              <strong>📦 วิธีตั้งค่า MinIO บน Coolify:</strong><br/>
              1. เปิด Coolify → New Resource → Service → เลือก <strong>MinIO</strong><br/>
              2. ตั้งค่า User/Password → Deploy → รอ Container พร้อม<br/>
              3. เปิด MinIO Console → สร้าง Bucket: <code className="bg-emerald-100 px-1 rounded">vservice-banners</code>, <code className="bg-emerald-100 px-1 rounded">vservice-services</code>, <code className="bg-emerald-100 px-1 rounded">vservice-avatars</code><br/>
              4. ตั้ง Bucket Policy เป็น <strong>Public</strong> → สร้าง Access Key → กรอกข้อมูลด้านล่าง
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">🌐 MinIO Endpoint URL:</label>
                <input
                  type="text"
                  placeholder="เช่น https://storage.vibepjm.online"
                  value={systemConfig.minioEndpoint || ''}
                  onChange={(e) => handleConfigChange('minioEndpoint', e.target.value)}
                  className="v-input w-full py-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-500/5 border-emerald-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">🔑 Access Key:</label>
                  <input
                    type="text"
                    placeholder="เช่น vservice_api"
                    value={systemConfig.minioAccessKey || ''}
                    onChange={(e) => handleConfigChange('minioAccessKey', e.target.value)}
                    className="v-input w-full py-1.5 text-[11px] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">🔒 Secret Key:</label>
                  <input
                    type="password"
                    placeholder="รหัสลับ MinIO"
                    value={systemConfig.minioSecretKey || ''}
                    onChange={(e) => handleConfigChange('minioSecretKey', e.target.value)}
                    className="v-input w-full py-1.5 text-[11px] font-mono"
                  />
                </div>
              </div>

              <div className={`p-2.5 rounded-lg text-[10px] flex items-center gap-2 font-semibold ${systemConfig.minioEndpoint && systemConfig.minioAccessKey && systemConfig.minioSecretKey ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                <span>{systemConfig.minioEndpoint && systemConfig.minioAccessKey && systemConfig.minioSecretKey ? '✅ MinIO พร้อมใช้งาน — รูปภาพจะอัปโหลดขึ้น VPS Storage โดยตรง' : '⚠️ ยังไม่ได้ตั้งค่า — ระบบจะใช้ Base64 แทนชั่วคราว'}</span>
              </div>
            </div>
          </div>

          {/* LINE Official Account & Messaging API Configuration */}
          <div className="v-panel p-5 bg-white space-y-4 border-2 border-emerald-500/30">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="text-[#06C755]">🟢</span>
              <span>LINE Official Account & Messaging API Credentials</span>
            </h3>

            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-900 leading-relaxed">
              <strong>💬 วิธีตั้งค่า LINE Secret Key & Messaging API (LINE Developers Console):</strong><br/>
              1. เข้าสู่ระบบ <a href="https://developers.line.biz" target="_blank" rel="noreferrer" className="underline font-bold text-emerald-700">LINE Developers Console</a> แล้วเลือก Provider & Create Messaging API Channel<br/>
              2. คัดลอก <strong>Channel ID</strong> และ <strong>Channel Secret</strong> ในแท็บ Basic Settings<br/>
              3. ในแท็บ Messaging API ให้กด <strong>Issue</strong> เพื่อสร้าง <strong>Channel Access Token (Long-lived)</strong><br/>
              4. กรอก <strong>Webhook URL</strong> แล้วเปิดสวิตช์ <strong>Use Webhook</strong> เพื่อรับข้อความและส่งการ์ดจองคิวอัจฉริยะ
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">🆔 LINE Channel ID:</label>
                  <input
                    type="text"
                    placeholder="เช่น 2001234567"
                    value={systemConfig.lineChannelId || ''}
                    onChange={(e) => handleConfigChange('lineChannelId', e.target.value)}
                    className="v-input w-full py-1.5 text-[11px] font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">🔑 LINE Channel Secret:</label>
                  <input
                    type="password"
                    placeholder="เช่น 9f8e7d6c5b4a3f2e1d0c..."
                    value={systemConfig.lineChannelSecret || ''}
                    onChange={(e) => handleConfigChange('lineChannelSecret', e.target.value)}
                    className="v-input w-full py-1.5 text-[11px] font-mono font-bold text-[#06C755]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">📜 Channel Access Token (Long-lived v2.1):</label>
                <input
                  type="text"
                  placeholder="เช่น eyJhbGciOiJIUzI1NiJ9..."
                  value={systemConfig.lineChannelAccessToken || ''}
                  onChange={(e) => handleConfigChange('lineChannelAccessToken', e.target.value)}
                  className="v-input w-full py-1.5 text-[11px] font-mono font-bold text-emerald-800 bg-emerald-500/5 border-emerald-500/30"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">📱 LIFF ID (LINE Front-end Framework):</label>
                  <input
                    type="text"
                    placeholder="เช่น 2001234567-AbCdEfGh"
                    value={systemConfig.lineLiffId || ''}
                    onChange={(e) => handleConfigChange('lineLiffId', e.target.value)}
                    className="v-input w-full py-1.5 text-[11px] font-mono"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-bold text-slate-700">🌐 Webhook Callback URL:</label>
                    <button
                      type="button"
                      onClick={() => {
                        const liveOrigin = typeof window !== 'undefined' ? window.location.origin : '';
                        const urlToCopy = systemConfig.lineWebhookUrl && !systemConfig.lineWebhookUrl.includes('vservice.company.com')
                          ? systemConfig.lineWebhookUrl
                          : `${liveOrigin}/api/line/webhook`;
                        navigator.clipboard.writeText(urlToCopy);
                        alert(`คัดลอก Webhook URL (${urlToCopy}) เรียบร้อยแล้ว! นำไปวางใน LINE Developers Console ได้เลย`);
                      }}
                      className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded cursor-pointer transition border-0"
                    >
                      📋 คัดลอก URL
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="เช่น https://vq.vibepjm.online/api/line/webhook"
                    value={
                      systemConfig.lineWebhookUrl && !systemConfig.lineWebhookUrl.includes('vservice.company.com')
                        ? systemConfig.lineWebhookUrl
                        : (typeof window !== 'undefined' ? `${window.location.origin}/api/line/webhook` : 'https://vq.vibepjm.online/api/line/webhook')
                    }
                    onChange={(e) => handleConfigChange('lineWebhookUrl', e.target.value)}
                    className="v-input w-full py-1.5 text-[11px] font-mono text-blue-700 bg-blue-50/40 font-bold"
                  />
                  <span className="text-[9px] text-[#06C755] font-semibold block mt-1">
                    *คัดลอก URL นี้ไปวางในช่อง <strong>Webhook URL</strong> บน LINE Developers Console ตามโดเมนจริงของคุณ
                  </span>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg text-[10px] flex items-center gap-2 font-semibold ${systemConfig.lineChannelId && systemConfig.lineChannelSecret ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                <span>{systemConfig.lineChannelId && systemConfig.lineChannelSecret ? '✅ LINE OA Messaging API เชื่อมต่อสมบูรณ์ — พร้อมส่งการ์ดจองคิวและรับแชทสดสดผ่าน LINE' : '⚡ พร้อมสำหรับป้อน Secret Key — ป้อน Channel ID & Channel Secret เพื่อเปิดใช้งาน Messaging API'}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
