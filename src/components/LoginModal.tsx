import React, { useState } from 'react';
import type { UserAccount } from '../types';
import {
  Wrench,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  LogIn,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';

interface LoginModalProps {
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
  onGoToStorefront?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  users,
  onLoginSuccess,
  onGoToStorefront
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('กรุณากรอก Username และ Password');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // Find matching user
      const cleanUser = username.trim().toLowerCase();
      const matched = users.find(
        (u) =>
          (u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser) &&
          u.password === password
      );

      if (matched) {
        if (matched.status === 'Suspended') {
          setErrorMsg('บัญชีนี้ถูกระงับสิทธิ์การใช้งาน (Suspended) กรุณาติดต่อ Admin');
          setLoading(false);
          return;
        }
        onLoginSuccess(matched);
      } else {
        setErrorMsg('Username หรือ Password ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      }
      setLoading(false);
    }, 400);
  };


  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn font-sans">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 space-y-6 relative overflow-hidden">
        
        {/* Background Decorative Element */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Brand Header */}
        <div className="text-center space-y-2 relative">
          {onGoToStorefront && (
            <button
              onClick={onGoToStorefront}
              className="absolute left-0 top-0 text-slate-400 hover:text-slate-700 text-xs font-bold flex items-center gap-1 border-0 bg-transparent cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>หน้าลูกค้า</span>
            </button>
          )}

          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
            <Wrench className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">vService INSTALLER SYSTEM</h1>
            <p className="text-xs text-slate-500 font-medium">เข้าสู่ระบบหลังบ้านบริหารคิวช่าง (Backoffice Portal)</p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-shake">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">ชื่อผู้ใช้งาน (Username / Email):</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="เช่น sysadmin หรือ admin_center"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="v-input w-full py-2.5 pl-9 text-xs rounded-xl font-medium"
              />
              <UserIcon className="absolute left-3 top-3 text-slate-400" size={15} />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">รหัสผ่าน (Password):</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="ระบุรหัสผ่านเข้าใช้งาน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="v-input w-full py-2.5 pl-9 pr-10 text-xs rounded-xl font-mono"
              />
              <Lock className="absolute left-3 top-3 text-slate-400" size={15} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 border-0 bg-transparent cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2 border-0 cursor-pointer disabled:opacity-50"
          >
            <LogIn size={16} />
            <span>{loading ? 'กำลังยืนยันตัวตน...' : 'เข้าสู่ระบบหลังบ้าน (Sign In)'}</span>
          </button>
        </form>


      </div>
    </div>
  );
};
