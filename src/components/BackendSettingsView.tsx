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

        </div>

      </div>

    </div>
  );
};
