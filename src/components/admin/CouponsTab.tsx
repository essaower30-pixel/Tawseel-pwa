import React, { useState } from "react";
import { 
  Tag, 
  Plus, 
  Trash2, 
  Edit2,
  Percent, 
  CheckCircle2, 
  Power, 
  Copy,
  Gift
} from "lucide-react";
import { Coupon } from "../../types";

interface CouponsTabProps {
  coupons: Coupon[];
  onAddCoupon: (coupon: Coupon) => void;
  onUpdateCoupon: (coupon: Coupon) => void;
  onDeleteCoupon: (code: string) => void;
  currency: string;
}

export const CouponsTab: React.FC<CouponsTabProps> = ({
  coupons,
  onAddCoupon,
  onUpdateCoupon,
  onDeleteCoupon,
  currency
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(15);
  const [maxDiscount, setMaxDiscount] = useState(25000);
  const [minOrder, setMinOrder] = useState(50000);

  const openAddCoupon = () => {
    setEditingCoupon(null);
    setCode("");
    setDiscountPercent(15);
    setMaxDiscount(25000);
    setMinOrder(50000);
    setShowModal(true);
  };

  const openEditCoupon = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDiscountPercent(c.discountPercent);
    setMaxDiscount(c.maxDiscount || 25000);
    setMinOrder(c.minOrder || 50000);
    setShowModal(true);
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    if (editingCoupon) {
      onUpdateCoupon({
        ...editingCoupon,
        code: code.trim().toUpperCase(),
        discountPercent: Number(discountPercent),
        maxDiscount: Number(maxDiscount),
        minOrder: Number(minOrder)
      });
    } else {
      onAddCoupon({
        code: code.trim().toUpperCase(),
        discountPercent: Number(discountPercent),
        maxDiscount: Number(maxDiscount),
        minOrder: Number(minOrder),
        isActive: true
      });
    }

    setEditingCoupon(null);
    setCode("");
    setDiscountPercent(15);
    setMaxDiscount(25000);
    setMinOrder(50000);
    setShowModal(false);
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <Tag className="w-5 h-5 text-orange-500" />
            <span>كوبونات الخصم والترويج 🏷️</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">إنشاء رموز خصم ترويجية للزبائن لتنشيط حركة الطلب والمبيعات في القرية</p>
        </div>

        <button
          type="button"
          onClick={openAddCoupon}
          className="py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء كوبون خصم جديد 🏷️</span>
        </button>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => {
          const isActive = c.isActive !== false;

          return (
            <div 
              key={c.code}
              className={`bg-white rounded-3xl border transition-all p-4 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden ${
                isActive ? "border-slate-200 hover:border-orange-300" : "border-slate-200 bg-slate-50/70 opacity-70"
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-black text-sm">
                      %
                    </div>
                    <div>
                      <span className="font-mono font-black text-base tracking-wider text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border">
                        {c.code}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-1 font-bold">كوبون ترويجي معتمد</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {isActive ? "مفعّل ونشط" : "معطل"}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">نسبة الخصم:</span>
                    <span className="font-black text-sm text-orange-600">{c.discountPercent}%</span>
                  </div>
                  {c.minOrder && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">الحد الأدنى للطلب:</span>
                      <span className="font-bold text-slate-800">{c.minOrder.toLocaleString()} {currency}</span>
                    </div>
                  )}
                  {c.maxDiscount && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">أعلى قيمة للخصم:</span>
                      <span className="font-bold text-slate-800">{c.maxDiscount.toLocaleString()} {currency}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onUpdateCoupon({ ...c, isActive: !isActive })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    isActive ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {isActive ? "تعطيل الكوبون" : "تفعيل الكوبون"}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditCoupon(c)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                    title="تعديل الكوبون"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`حذف الكوبون "${c.code}"؟`)) {
                        onDeleteCoupon(c.code);
                      }
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                    title="حذف الكوبون"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto pt-6 sm:pt-4 pb-48 sm:pb-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-right my-auto" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <Tag className="w-5 h-5 text-orange-500" />
                <span>{editingCoupon ? "تعديل كوبون الخصم ✏️" : "إنشاء كوبون خصم جديد 🏷️"}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-3 text-xs text-slate-700">
              <div>
                <label className="block font-bold mb-1">رمز الكوبون (إنجليزي): *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="مثال: EID2025"
                  className="w-full py-2 px-3 bg-slate-50 border rounded-xl font-mono text-center tracking-widest text-base font-black focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">نسبة الخصم (%): *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-slate-50 border rounded-xl font-bold focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">أعلى خصم ({currency}):</label>
                  <input
                    type="number"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-slate-50 border rounded-xl font-bold focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">الحد الأدنى لقيمة الطلب ({currency}):</label>
                <input
                  type="number"
                  value={minOrder}
                  onChange={(e) => setMinOrder(Number(e.target.value))}
                  className="w-full py-2 px-3 bg-slate-50 border rounded-xl font-bold focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingCoupon ? "حفظ التعديلات 💾" : "إنشاء وتفعيل الكوبون 🏷️"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
