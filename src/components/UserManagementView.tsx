import React, { useState, useMemo } from 'react';
import type { UserAccount, UserRole, Branch } from '../types';
import {
  Users,
  Shield,
  Plus,
  Search,
  Edit2,
  Trash2,
  XCircle,
  Building,
  Mail,
  Phone,
  User as UserIcon,
  ShieldAlert,
  Wrench,
  ShoppingBag,
  Sliders,
  Check,
  Lock,
  Eye,
  EyeOff,
  MessageCircle
} from 'lucide-react';

interface UserManagementViewProps {
  users: UserAccount[];
  branches: Branch[];
  onAddUser: (user: UserAccount) => void;
  onUpdateUser: (user: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
}

export const ROLE_CONFIG: Record<UserRole, { label: string; description: string; badgeClass: string; icon: React.ReactNode }> = {
  sys_admin: {
    label: 'sys_admin (ผู้ดูแลระบบสูงสุด)',
    description: 'สิทธิ์สูงสุด เข้าถึงคอนฟิกหลัก MinIO, Database, และการตั้งค่าความปลอดภัยทั้งหมด',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: <ShieldAlert className="h-3.5 w-3.5" />
  },
  admin: {
    label: 'admin (ผู้ดูแลระบบ)',
    description: 'จัดการผู้ใช้งาน ข้อมูลสาขา โซน ช่าง และอนุมัติใบสมัคร',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    icon: <Shield className="h-3.5 w-3.5" />
  },
  supervisor: {
    label: 'supervisor (ผู้ควบคุมงาน)',
    description: 'กำกับดูแลคิวงานติดตั้ง ออกคำสั่งลงโทษ E-CN และตรวจสอบ QC',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: <Sliders className="h-3.5 w-3.5" />
  },
  technician: {
    label: 'technician (ช่างเทคนิค)',
    description: 'รับงานติดตั้ง อัปเดตสถานะงาน STS และดู Skill Matrix ของตนเอง',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: <Wrench className="h-3.5 w-3.5" />
  },
  storecs: {
    label: 'storecs (เจ้าหน้าที่ CS สาขา)',
    description: 'บันทึกจองคิวงานหน้าร้าน ประสานงานลูกค้าประจำสาขา',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: <Building className="h-3.5 w-3.5" />
  },
  customer: {
    label: 'customer (ลูกค้าทั่วไป)',
    description: 'จองบริการติดตั้งผ่าน Vfixq Portal และติดตามสถานะคิวงาน',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: <ShoppingBag className="h-3.5 w-3.5" />
  }
};

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  branches,
  onAddUser,
  onUpdateUser,
  onDeleteUser
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form State
  const [fUsername, setFUsername] = useState('');
  const [fName, setFName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fPassword, setFPassword] = useState('');
  const [fLineId, setFLineId] = useState('');
  const [fRole, setFRole] = useState<UserRole>('admin');
  const [fStatus, setFStatus] = useState<'Active' | 'Inactive' | 'Suspended'>('Active');
  const [fBranchId, setFBranchId] = useState<string>('');
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Open modal for Create or Edit
  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFUsername('');
    setFName('');
    setFEmail('');
    setFPhone('');
    setFPassword('');
    setFLineId('');
    setFRole('admin');
    setFStatus('Active');
    setFBranchId(branches[0]?.id || '');
    setShowModalPassword(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (u: UserAccount) => {
    setEditingUser(u);
    setFUsername(u.username);
    setFName(u.name);
    setFEmail(u.email);
    setFPhone(u.phone);
    setFPassword(u.password || '');
    setFLineId(u.lineId || '');
    setFRole(u.role);
    setFStatus(u.status);
    setFBranchId(u.branchId || '');
    setShowModalPassword(false);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fUsername.trim() || !fName.trim()) return;

    const selectedBranch = branches.find(b => b.id === fBranchId);

    if (editingUser) {
      // Update existing
      const updated: UserAccount = {
        ...editingUser,
        username: fUsername,
        name: fName,
        email: fEmail,
        phone: fPhone,
        password: fPassword.trim() || undefined,
        lineId: fLineId.trim() || undefined,
        role: fRole,
        status: fStatus,
        branchId: fBranchId || undefined,
        branchName: selectedBranch ? selectedBranch.name : undefined
      };
      onUpdateUser(updated);
    } else {
      // Create new
      const newUser: UserAccount = {
        id: `usr-${Date.now()}`,
        username: fUsername,
        name: fName,
        email: fEmail,
        phone: fPhone,
        password: fPassword.trim() || undefined,
        lineId: fLineId.trim() || undefined,
        role: fRole,
        status: fStatus,
        branchId: fBranchId || undefined,
        branchName: selectedBranch ? selectedBranch.name : undefined,
        createdAt: new Date().toISOString().split('T')[0]
      };
      onAddUser(newUser);
    }

    setShowModal(false);
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.lineId && u.lineId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        u.phone.includes(searchQuery);

      const matchRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
      const matchStatus = selectedStatusFilter === 'ALL' || u.status === selectedStatusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, selectedRoleFilter, selectedStatusFilter]);

  // Counts by role
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {
      sys_admin: 0,
      admin: 0,
      supervisor: 0,
      technician: 0,
      storecs: 0,
      customer: 0
    };
    users.forEach(u => {
      if (counts[u.role] !== undefined) counts[u.role]++;
    });
    return counts;
  }, [users]);

  return (
    <div className="space-y-6 font-sans pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800">จัดการผู้ใช้งานและสิทธิ์ (User & Role Management)</h1>
              <p className="text-xs text-slate-500">กำหนดระดับสิทธิ์ 6 ระดับบัญชีผู้ใช้งานระบบ vService</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-slate-100 p-1 rounded-xl flex space-x-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'users' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              👥 รายชื่อผู้ใช้งาน ({users.length})
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'matrix' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📊 ตารางสิทธิ์ (Permission Matrix)
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer border-0"
          >
            <Plus size={16} />
            <span>เพิ่มผู้ใช้งานใหม่</span>
          </button>
        </div>
      </div>

      {/* Role Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(['sys_admin', 'admin', 'supervisor', 'technician', 'storecs', 'customer'] as const).map((r) => {
          const cfg = ROLE_CONFIG[r];
          return (
            <div
              key={r}
              onClick={() => setSelectedRoleFilter(selectedRoleFilter === r ? 'ALL' : r)}
              className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                selectedRoleFilter === r
                  ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200'
                  : 'bg-white border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`p-2 rounded-xl border ${cfg.badgeClass}`}>
                  {cfg.icon}
                </span>
                <span className="text-xl font-black text-slate-800">{roleCounts[r]}</span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-slate-800 truncate">{r}</div>
                <div className="text-[10px] text-slate-400 font-medium truncate">{cfg.label.split('(')[1]?.replace(')', '')}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tab 1: User Accounts Table */}
      {activeTab === 'users' && (
        <div className="v-panel bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden space-y-4 p-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, username, อีเมล..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="v-input pl-8 py-1.5 text-xs w-60 rounded-xl"
                />
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              </div>

              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="v-input py-1.5 text-xs rounded-xl"
              >
                <option value="ALL">สิทธิ์ทั้งหมด (All Roles)</option>
                <option value="sys_admin">1. sys_admin</option>
                <option value="admin">2. admin</option>
                <option value="supervisor">3. supervisor</option>
                <option value="technician">4. technician</option>
                <option value="storecs">5. storecs</option>
                <option value="customer">6. customer</option>
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="v-input py-1.5 text-xs rounded-xl"
              >
                <option value="ALL">สถานะทั้งหมด</option>
                <option value="Active">Active (ใช้งาน)</option>
                <option value="Inactive">Inactive (ระงับ)</option>
                <option value="Suspended">Suspended (โดนระงับ)</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              แสดง <strong className="text-slate-800">{filteredUsers.length}</strong> จาก {users.length} บัญชี
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
                  <th className="p-3">ชื่อผู้ใช้งาน / Username</th>
                  <th className="p-3">บทบาทสิทธิ์ (Role)</th>
                  <th className="p-3">ข้อมูลติดต่อ & LINE ID</th>
                  <th className="p-3">รหัสผ่าน (Password)</th>
                  <th className="p-3">สาขาที่สังกัด</th>
                  <th className="p-3">สถานะ</th>
                  <th className="p-3">วันที่สร้าง</th>
                  <th className="p-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400 italic">
                      ไม่พบผู้ใช้งานที่ตรงตามเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const cfg = ROLE_CONFIG[u.role];
                    const isPassVisible = !!visiblePasswords[u.id];
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition">
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{u.name}</div>
                              <div className="text-[10px] text-indigo-600 font-mono">@{u.username}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.badgeClass}`}>
                            {cfg.icon}
                            <span>{u.role}</span>
                          </span>
                        </td>

                        <td className="p-3 text-slate-600 space-y-0.5">
                          <div className="flex items-center space-x-1 text-[11px]">
                            <Mail size={11} className="text-slate-400" />
                            <span>{u.email}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-[11px]">
                            <Phone size={11} className="text-slate-400" />
                            <span>{u.phone}</span>
                          </div>
                          {u.lineId ? (
                            <div className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-700">
                              <MessageCircle size={11} className="text-emerald-500" />
                              <span>{u.lineId}</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic font-mono">- ไม่ได้ระบุ LINE ID -</div>
                          )}
                        </td>

                        <td className="p-3 font-mono">
                          {u.password ? (
                            <div className="inline-flex items-center space-x-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 text-[11px] text-slate-700">
                              <Lock size={10} className="text-slate-400" />
                              <span>{isPassVisible ? u.password : '••••••••'}</span>
                              <button
                                onClick={() => togglePasswordVisibility(u.id)}
                                className="text-slate-400 hover:text-indigo-600 border-0 bg-transparent cursor-pointer p-0 ml-1 flex items-center"
                                title={isPassVisible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                              >
                                {isPassVisible ? <EyeOff size={11} /> : <Eye size={11} />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">ไม่ได้ตั้งค่า</span>
                          )}
                        </td>

                        <td className="p-3">
                          {u.branchName ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium border border-slate-200">
                              <Building size={10} />
                              <span>{u.branchName}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">ทุกสาขา (Global)</span>
                          )}
                        </td>

                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            u.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            u.status === 'Suspended' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {u.status}
                          </span>
                        </td>

                        <td className="p-3 text-slate-400 font-mono text-[11px]">
                          {u.createdAt}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border-0 transition cursor-pointer"
                              title="แก้ไขสิทธิ์/ข้อมูล"
                            >
                              <Edit2 size={13} />
                            </button>

                            <button
                              onClick={() => onDeleteUser(u.id)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border-0 transition cursor-pointer"
                              title="ลบบัญชีผู้ใช้"
                            >
                              <Trash2 size={13} />
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
      )}

      {/* Tab 2: Permission Matrix Table */}
      {activeTab === 'matrix' && (
        <div className="v-panel bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600" />
              <span>ตารางสิทธิ์การเข้าถึงระบบตามบทบาท (Role Permission Matrix)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">สรุปการเข้าถึงเมนูและฟังก์ชันของทั้ง 6 บทบาทผู้ใช้งาน</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-200 rounded-xl">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <th className="p-3 border-r border-slate-200 w-64">ฟังก์ชัน / สิทธิ์การใช้งาน</th>
                  <th className="p-2 text-center border-r border-slate-200 bg-purple-50 text-purple-900">1. sys_admin</th>
                  <th className="p-2 text-center border-r border-slate-200 bg-indigo-50 text-indigo-900">2. admin</th>
                  <th className="p-2 text-center border-r border-slate-200 bg-blue-50 text-blue-900">3. supervisor</th>
                  <th className="p-2 text-center border-r border-slate-200 bg-amber-50 text-amber-900">4. technician</th>
                  <th className="p-2 text-center border-r border-slate-200 bg-emerald-50 text-emerald-900">5. storecs</th>
                  <th className="p-2 text-center bg-slate-50 text-slate-900">6. customer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[
                  { feature: 'ตั้งค่าระบบหลัก & MinIO Storage', sys_admin: true, admin: false, supervisor: false, technician: false, storecs: false, customer: false },
                  { feature: 'จัดการผู้ใช้งาน & กำหนด Role', sys_admin: true, admin: true, supervisor: false, technician: false, storecs: false, customer: false },
                  { feature: 'จัดการข้อมูลสาขา & โซนพื้นที่', sys_admin: true, admin: true, supervisor: true, technician: false, storecs: false, customer: false },
                  { feature: 'อนุมัติใบสมัครช่างใหม่ (Recruitment)', sys_admin: true, admin: true, supervisor: true, technician: false, storecs: false, customer: false },
                  { feature: 'ออกคำสั่งปรับ E-CN & Penalties', sys_admin: true, admin: true, supervisor: true, technician: false, storecs: false, customer: false },
                  { feature: 'จัดสรรคิวช่าง & สั่งงาน KANNA/STS', sys_admin: true, admin: true, supervisor: true, technician: false, storecs: true, customer: false },
                  { feature: 'บันทึกจองคิวหน้าร้าน (Store CS Booking)', sys_admin: true, admin: true, supervisor: true, technician: false, storecs: true, customer: false },
                  { feature: 'ดู Skill Matrix & ผลงานช่างทั้งหมด', sys_admin: true, admin: true, supervisor: true, technician: true, storecs: true, customer: false },
                  { feature: 'จองบริการติดตั้งผ่าน Vfixq Portal', sys_admin: true, admin: true, supervisor: true, technician: false, storecs: true, customer: true },
                ].map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="p-3 font-semibold text-slate-800 border-r border-slate-200">{row.feature}</td>
                    
                    <td className="p-2 text-center border-r border-slate-200">
                      {row.sys_admin ? <Check className="h-4 w-4 text-emerald-600 mx-auto font-bold" /> : <XCircle className="h-4 w-4 text-slate-300 mx-auto" />}
                    </td>

                    <td className="p-2 text-center border-r border-slate-200">
                      {row.admin ? <Check className="h-4 w-4 text-emerald-600 mx-auto font-bold" /> : <XCircle className="h-4 w-4 text-slate-300 mx-auto" />}
                    </td>

                    <td className="p-2 text-center border-r border-slate-200">
                      {row.supervisor ? <Check className="h-4 w-4 text-emerald-600 mx-auto font-bold" /> : <XCircle className="h-4 w-4 text-slate-300 mx-auto" />}
                    </td>

                    <td className="p-2 text-center border-r border-slate-200">
                      {row.technician ? <Check className="h-4 w-4 text-emerald-600 mx-auto font-bold" /> : <XCircle className="h-4 w-4 text-slate-300 mx-auto" />}
                    </td>

                    <td className="p-2 text-center border-r border-slate-200">
                      {row.storecs ? <Check className="h-4 w-4 text-emerald-600 mx-auto font-bold" /> : <XCircle className="h-4 w-4 text-slate-300 mx-auto" />}
                    </td>

                    <td className="p-2 text-center">
                      {row.customer ? <Check className="h-4 w-4 text-emerald-600 mx-auto font-bold" /> : <XCircle className="h-4 w-4 text-slate-300 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit User */}
      {showModal && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-slate-900/60 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 font-bold text-slate-800 text-sm">
                <UserIcon className="h-5 w-5 text-indigo-600" />
                <span>{editingUser ? 'แก้ไขสิทธิ์และข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}</span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm border-0 bg-transparent cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">เลือกบทบาทสิทธิ์ (User Role):</label>
                <select
                  value={fRole}
                  onChange={(e) => setFRole(e.target.value as UserRole)}
                  className="v-input w-full py-2 font-bold text-indigo-700 bg-indigo-50/40"
                >
                  <option value="sys_admin">1. sys_admin (ผู้ดูแลระบบสูงสุด)</option>
                  <option value="admin">2. admin (ผู้ดูแลระบบ)</option>
                  <option value="supervisor">3. supervisor (ผู้ควบคุมงาน)</option>
                  <option value="technician">4. technician (ช่างเทคนิค)</option>
                  <option value="storecs">5. storecs (เจ้าหน้าที่ CS สาขา)</option>
                  <option value="customer">6. customer (ลูกค้าทั่วไป)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">{ROLE_CONFIG[fRole].description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username:</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น admin_bkk"
                    value={fUsername}
                    onChange={(e) => setFUsername(e.target.value)}
                    className="v-input w-full py-1.5"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ชื่อ-นามสกุล:</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น คุณสมชาย มั่นคง"
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    className="v-input w-full py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">อีเมล (Email):</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={fEmail}
                    onChange={(e) => setFEmail(e.target.value)}
                    className="v-input w-full py-1.5"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์:</label>
                  <input
                    type="tel"
                    placeholder="089-1234567"
                    value={fPhone}
                    onChange={(e) => setFPhone(e.target.value)}
                    className="v-input w-full py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">รหัสผ่าน (Password):</label>
                  <div className="relative">
                    <input
                      type={showModalPassword ? "text" : "password"}
                      placeholder="กำหนดรหัสผ่าน เช่น Pass@123"
                      value={fPassword}
                      onChange={(e) => setFPassword(e.target.value)}
                      className="v-input w-full py-1.5 pr-8 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-indigo-600 border-0 bg-transparent cursor-pointer p-0"
                    >
                      {showModalPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">LINE ID:</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="เช่น @line_id หรือ line_user"
                      value={fLineId}
                      onChange={(e) => setFLineId(e.target.value)}
                      className="v-input w-full py-1.5 pl-7 text-xs font-mono"
                    />
                    <MessageCircle size={13} className="absolute left-2 top-2.5 text-emerald-500" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">สาขาที่สังกัด:</label>
                  <select
                    value={fBranchId}
                    onChange={(e) => setFBranchId(e.target.value)}
                    className="v-input w-full py-1.5"
                  >
                    <option value="">ทุกสาขา (Global Admin)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">สถานะใช้งาน:</label>
                  <select
                    value={fStatus}
                    onChange={(e) => setFStatus(e.target.value as any)}
                    className="v-input w-full py-1.5"
                  >
                    <option value="Active">Active (เปิดใช้งาน)</option>
                    <option value="Inactive">Inactive (ปิดการใช้งาน)</option>
                    <option value="Suspended">Suspended (ระงับสิทธิ์)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer border-0"
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer border-0 shadow-md"
                >
                  บันทึกข้อมูลผู้ใช้งาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
