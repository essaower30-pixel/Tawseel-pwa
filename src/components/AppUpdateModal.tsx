import React, { useState } from "react";
import { 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  ArrowLeft, 
  X, 
  ShieldCheck, 
  Zap, 
  Info,
  Calendar,
  Layers
} from "lucide-react";
import { AppUpdateInfo } from "../utils/updateManager";

interface AppUpdateModalProps {
  update: AppUpdateInfo;
  onClose: () => void;
  onApplyUpdate: () => void;
  isPreview?: boolean;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  update,
  onClose,
  onApplyUpdate,
  isPreview = false,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleExecuteUpdate = () => {
    setIsUpdating(true);
    // Simulate instantaneous cache clear & sync
    setTimeout(() => {
      setIsUpdating(false);
      setIsComplete(true);
      setTimeout(() => {
        onApplyUpdate();
      }, 700);
    }, 600);
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans overflow-y-auto"
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl p-5 sm:p-7 w-full max-w-lg shadow-2xl border border-slate-100 space-y-5 my-auto relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
              <Sparkles className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base sm:text-lg tracking-tight">
                  تحديث جديد للنظام والخدمات 🚀
                </h3>
                <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                  {update.version}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3 h-3 text-slate-400 inline" />
                <span>تاريخ التحديث: {update.releaseDate}</span>
                {update.publishedBy && (
                  <span className="text-slate-400">• بواسطة {update.publishedBy}</span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-black transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Update Main Title Banner */}
        <div className="p-4 bg-linear-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200/80 space-y-1 text-right">
          <div className="flex items-center gap-2 text-xs font-black text-orange-800">
            <Zap className="w-4 h-4 text-orange-500 shrink-0" />
            <span>{update.title}</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
            قامت إدارة المنصة بإضافة ميزات وتعديلات جديدة لترقية وتطوير النظام وتقديم أفضل تجربة لجميع المستخدمين.
          </p>
        </div>

        {/* Features & Modifications List */}
        <div className="space-y-2.5 text-right">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-orange-500" />
              <span>ما الجديد في هذا التحديث؟ ({update.features.length} ميزات وتعديلات):</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
              ميزات معتمدة ✓
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {update.features.map((feature, idx) => (
              <div 
                key={idx}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl transition-all flex items-start gap-2.5 text-xs text-slate-800"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="font-bold leading-relaxed flex-1">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Notes if present */}
        {update.notes && (
          <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-2xl flex items-start gap-2 text-xs text-blue-900 text-right">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-black block text-[11px] text-blue-800">ملاحظة من الإدارة:</span>
              <p className="text-[11px] text-blue-700 leading-relaxed font-semibold">
                {update.notes}
              </p>
            </div>
          </div>
        )}

        {/* Icon auto-disappear explanation */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2 text-[11px] text-slate-500 font-bold text-right">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            ستختفي أيقونة التحديث تلقائياً من أعلى الشاشة فور النقر على زر التحديث وتأكيد استلام الميزات الجديدة.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleExecuteUpdate}
            disabled={isUpdating || isComplete}
            className={`w-full py-3.5 px-4 text-white font-black text-xs sm:text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
              isComplete
                ? "bg-emerald-600 shadow-emerald-500/20"
                : isUpdating
                ? "bg-orange-400 cursor-wait"
                : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"
            }`}
          >
            {isComplete ? (
              <>
                <CheckCircle2 className="w-5 h-5 animate-bounce" />
                <span>تم تحديث التطبيق بنجاح! جاري التفعيل... ✓</span>
              </>
            ) : isUpdating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري تطبيق التحديث وتحميل الميزات الجديدة...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>تحديث التطبيق الآن والبدء 🔄</span>
                <ArrowLeft className="w-4 h-4 mr-auto" />
              </>
            )}
          </button>

          {!isUpdating && !isComplete && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
            >
              {isPreview ? "إغلاق المعاينة ✕" : "تصفح الآن والتحديث لاحقاً"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
