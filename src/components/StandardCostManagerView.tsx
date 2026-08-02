import React, { useState } from 'react';
import type { StandardCostItem } from '../types';
import {
  Calculator,
  Search,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  X,
  Save,
  Tag,
  FileText
} from 'lucide-react';

interface StandardCostManagerViewProps {
  items: StandardCostItem[];
  onAddItem: (item: StandardCostItem) => void;
  onUpdateItem: (item: StandardCostItem) => void;
  onDeleteItem: (id: string) => void;
}

export const StandardCostManagerView: React.FC<StandardCostManagerViewProps> = ({
  items,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StandardCostItem | null>(null);

  // Form States
  const [sku, setSku] = useState('');
  const [group, setGroup] = useState('ค่าบริการ Q');
  const [productCategory, setProductCategory] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [productDetail, setProductDetail] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('EACH');
  const [gpPercent, setGpPercent] = useState<number>(20);
  const [costStandard, setCostStandard] = useState<number>(500);
  const [costPremium, setCostPremium] = useState<number>(500);
  const [priceStandard, setPriceStandard] = useState<number>(650);
  const [pricePremium, setPricePremium] = useState<number>(650);
  const [costCenter, setCostCenter] = useState('21713');
  const [retention, setRetention] = useState('');
  const [remark, setRemark] = useState('');

  // Groups and Categories for Filter
  const groups = Array.from(new Set(items.map((i) => i.group).filter(Boolean)));
  const categories = Array.from(new Set(items.map((i) => i.productCategory).filter(Boolean)));

  const handleOpenAdd = () => {
    setEditingItem(null);
    setSku(`SKU-STD-${String(items.length + 1).padStart(3, '0')}`);
    setGroup('ค่าบริการ Q');
    setProductCategory('แอร์');
    setServiceType('ติดตั้ง');
    setProductDetail('');
    setDescription('');
    setUnit('EACH');
    setGpPercent(23);
    setCostStandard(600);
    setCostPremium(600);
    setPriceStandard(780);
    setPricePremium(780);
    setCostCenter('21713');
    setRetention('');
    setRemark('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: StandardCostItem) => {
    setEditingItem(item);
    setSku(item.sku);
    setGroup(item.group || 'ค่าบริการ Q');
    setProductCategory(item.productCategory || '');
    setServiceType(item.serviceType || '');
    setProductDetail(item.productDetail || '');
    setDescription(item.description || '');
    setUnit(item.unit || 'EACH');
    setGpPercent(item.gpPercent || 0);
    setCostStandard(item.costStandard || 0);
    setCostPremium(item.costPremium || 0);
    setPriceStandard(item.priceStandard || 0);
    setPricePremium(item.pricePremium || 0);
    setCostCenter(item.costCenter || '21713');
    setRetention(item.retention || '');
    setRemark(item.remark || '');
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('กรุณาระบุรายละเอียด Description คำอธิบายในใบเสร็จ');
      return;
    }

    const payload: StandardCostItem = {
      id: editingItem ? editingItem.id : `std-cost-${Date.now()}`,
      sku: sku || `SKU-STD-${Date.now()}`,
      group,
      productCategory,
      serviceType,
      productDetail,
      description,
      unit,
      gpPercent: Number(gpPercent),
      costStandard: Number(costStandard),
      costPremium: Number(costPremium),
      priceStandard: Number(priceStandard),
      pricePremium: Number(pricePremium),
      costCenter,
      retention,
      remark,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    if (editingItem) {
      onUpdateItem(payload);
    } else {
      onAddItem(payload);
    }
    setIsModalOpen(false);
  };

  // Filter Items
  const filteredItems = items.filter((i) => {
    const matchesSearch =
      i.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.productCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.serviceType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGroup = selectedGroupFilter === 'ALL' || i.group === selectedGroupFilter;
    const matchesCat = selectedCategoryFilter === 'ALL' || i.productCategory === selectedCategoryFilter;

    return matchesSearch && matchesGroup && matchesCat;
  });

  // Calculate Metrics
  const totalCostAvg = items.length ? Math.round(items.reduce((acc, curr) => acc + curr.costStandard, 0) / items.length) : 0;
  const totalPriceAvg = items.length ? Math.round(items.reduce((acc, curr) => acc + curr.priceStandard, 0) / items.length) : 0;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Panel */}
      <div className="v-panel p-6 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                ข้อมูลค่าใช้จ่ายมาตรฐาน (Standard Cost & Price Master)
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Master File ตารางอ้างอิงต้นทุนค่าบริการช่างและราคาขายมาตรฐาน (นำเข้าจากไฟล์ Excel รวม {items.length} รายการ SKU)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 border-0 cursor-pointer"
          >
            <Plus size={16} />
            <span>เพิ่มรายการ SKU ใหม่</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="v-panel p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">รายการ SKU มาตรฐาน</p>
            <h3 className="text-xl font-black text-slate-800">{items.length} รายการ</h3>
          </div>
        </div>

        <div className="v-panel p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ต้นทุนช่างเฉลี่ย (Std Cost)</p>
            <h3 className="text-xl font-black text-slate-800">฿{totalCostAvg.toLocaleString()} / รายการ</h3>
          </div>
        </div>

        <div className="v-panel p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ราคาขายเฉลี่ย (Std Price)</p>
            <h3 className="text-xl font-black text-slate-800">฿{totalPriceAvg.toLocaleString()} / รายการ</h3>
          </div>
        </div>

        <div className="v-panel p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <Tag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cost Center หลัก</p>
            <h3 className="text-xl font-black text-purple-700">21713</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="v-panel p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="ค้นหา SKU, คำอธิบาย, หรือหมวดบริการ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="v-input w-full pl-9 py-2 text-xs"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto overflow-x-auto text-xs">
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="font-bold text-slate-500">กลุ่มบริการ:</span>
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="v-input py-1.5 text-xs font-bold"
            >
              <option value="ALL">ทั้งหมด (All Groups)</option>
              {groups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="font-bold text-slate-500">หมวดสินค้า:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="v-input py-1.5 text-xs font-bold"
            >
              <option value="ALL">ทั้งหมด (All Categories)</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Master Data Table */}
      <div className="v-panel bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">SKU Code</th>
                <th className="px-4 py-3.5">กลุ่มบริการ</th>
                <th className="px-4 py-3.5">หมวดสินค้า & บริการ</th>
                <th className="px-4 py-3.5">คำอธิบายในใบเสร็จ (Description)</th>
                <th className="px-4 py-3.5 text-center">หน่วย</th>
                <th className="px-4 py-3.5 text-right">Cost ช่าง (Std)</th>
                <th className="px-4 py-3.5 text-right">ราคาขาย (Std)</th>
                <th className="px-4 py-3.5 text-right">Cost ช่าง (Prem)</th>
                <th className="px-4 py-3.5 text-right">ราคาขาย (Prem)</th>
                <th className="px-4 py-3.5 text-center">Cost Center</th>
                <th className="px-4 py-3.5 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-slate-400">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <span>ไม่พบรายการข้อมูลค่าใช้จ่ายมาตรฐานที่ตรงกับเงื่อนไข</span>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600">
                        {item.sku}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.group.includes('M') ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}>
                          {item.group}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{item.productCategory}</div>
                        <div className="text-[10px] text-slate-400">{item.serviceType}</div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-semibold text-slate-800 line-clamp-1">{item.description}</div>
                        {item.productDetail && (
                          <div className="text-[10px] text-slate-400 line-clamp-1">{item.productDetail}</div>
                        )}
                        {item.remark && item.remark !== '0' && (
                          <div className="text-[10px] text-rose-600 font-bold line-clamp-1 mt-0.5">⚠️ {item.remark}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-500">
                        {item.unit || 'EACH'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">
                        ฿{item.costStandard.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                        ฿{item.priceStandard.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        ฿{item.costPremium.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        ฿{item.pricePremium.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-600">
                        {item.costCenter || '21713'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition border-0 cursor-pointer"
                            title="แก้ไขรายการ"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`คุณต้องการลบรายการ SKU: ${item.sku} ใช่หรือไม่?`)) {
                                onDeleteItem(item.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition border-0 cursor-pointer"
                            title="ลบรายการ"
                          >
                            <Trash2 size={14} />
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-800">
                  {editingItem ? `แก้ไขข้อมูล Master SKU: ${editingItem.sku}` : 'เพิ่มรายการ Master Standard Cost ใหม่'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full border-0 bg-transparent cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">รหัส SKU Code:</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="v-input w-full font-mono font-bold text-indigo-700"
                    placeholder="เช่น SKU-STD-030"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">กลุ่มบริการ (Group):</label>
                  <select
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    className="v-input w-full font-bold"
                  >
                    <option value="ค่าบริการ M">ค่าบริการ M (Maintenance / Clean)</option>
                    <option value="ค่าบริการ Q">ค่าบริการ Q (Quality / Quote / Install)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">หมวดสินค้า (Product Category):</label>
                  <input
                    type="text"
                    required
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className="v-input w-full font-medium"
                    placeholder="เช่น แอร์, แม่บ้าน, เฟอร์นิเจอร์"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ประเภทบริการ (Service Type):</label>
                  <input
                    type="text"
                    required
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="v-input w-full font-medium"
                    placeholder="เช่น ติดตั้ง, บริการล้าง, ทำความสะอาด"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">คำอธิบายในใบเสร็จ (Receipt Description):</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="v-input w-full font-semibold text-slate-800"
                  placeholder="เช่น ค่าบริการ Q-ติดตั้ง แอร์"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-amber-800 mb-1">ต้นทุนช่าง Standard (Cost):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={costStandard}
                    onChange={(e) => setCostStandard(Number(e.target.value))}
                    className="v-input w-full font-mono font-bold text-amber-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-800 mb-1">ราคาขาย Standard (Price):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={priceStandard}
                    onChange={(e) => setPriceStandard(Number(e.target.value))}
                    className="v-input w-full font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">หน่วย (Unit):</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="v-input w-full font-mono"
                    placeholder="EACH / M2"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cost Center:</label>
                  <input
                    type="text"
                    value={costCenter}
                    onChange={(e) => setCostCenter(e.target.value)}
                    className="v-input w-full font-mono"
                    placeholder="21713"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ส่วนต่าง % GP Target:</label>
                  <input
                    type="number"
                    value={gpPercent}
                    onChange={(e) => setGpPercent(Number(e.target.value))}
                    className="v-input w-full font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">หมายเหตุ / เงื่อนไขอนุมัติ (Remark):</label>
                <textarea
                  rows={2}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="v-input w-full font-medium"
                  placeholder="เงื่อนไขหรือการอนุมัติเฉพาะรายการ..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl border-0 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 border-0 cursor-pointer"
                >
                  <Save size={15} />
                  <span>บันทึกข้อมูล Master</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
