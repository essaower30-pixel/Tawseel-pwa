import React, { useState } from "react";
import { 
  RefreshCw, 
  X, 
  Sparkles, 
  RotateCcw, 
  Database, 
  Trash2, 
  CheckCircle2, 
  Smartphone, 
  Zap,
  ArrowRight
} from "lucide-react";

interface InAppRefreshModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickRefresh: () => Promise<void> | void;
  onFullReload: () => void;
  onClearCacheReload: () => Promise<void> | void;
  onOpenStandaloneGuide?: () => void;
  isStandalone?: boolean;
}

export const InAppRefreshModal: React.FC<InAppRefreshModalProps> = ({
  isOpen,
  onClose,
  onQuickRefresh,
  onFullReload,
  onClearCacheReload,
  onOpenStandaloneGuide,
  isStandalone = false
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuick = async () => {
    setLoadingAction("quick");
    try {
      await onQuickRefresh();
      setSuccessMessage("تم تحديث كافة المتاجر والطلبات والبيانات بنجاح! ⚡");
      setTimeout(() => {
        setSuccessMessage(null);
        setLoadingAction(null);
        onClose();
      }, 700);
    } catch {
      setLoadingAction(null);
    }
  };

  const handleFull = () => {
    setLoadingAction("full");
    onFullReload();
  };

  const handleClearCache = async () => {
    setLoadingAction("cache");
    try {
      await onClearCacheReload();
    } catch {
      setLoadingAction(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs font-sans animate-fade-in"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 text-slate-800 text-right space-y-4 max-h-[92vh] overflow-y-auto relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                تحديث التطبيق (ريفرش داخلي) 🔄
              </h3>
              <p className="text-[11px] text-slate-500 font-bold">
                {isStandalone ? "التطبيق يعمل كنافذة مستقلة بدون قوقل كروم" : "تحديث مباشر وسريع دون الحاجة لمتصفح خارجي"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-black transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-black text-emerald-800 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Refresh Options */}
        <div className="space-y-2.5">
          {/* Option 1: Quick Data Refresh */}
          <button
            type="button"
            onClick={handleQuick}
            disabled={loadingAction !== null}
            className="w-full p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-orange-200/90 rounded-2xl flex items-center justify-between text-right transition-all cursor-pointer group active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                <Zap className={`w-5 h-5 ${loadingAction === "quick" ? "animate-bounce" : ""}`} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <span>تحديث فوري للبيانات ⚡</span>
                  <span className="text-[10px] bg-orange-200 text-orange-950 px-2 py-0.2 rounded-full font-black">
                    الأسرع
                  </span>
                </h4>
                <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                  تحديث المتاجر، السلة، والطلبات فوراً مع البقاء في نفس الصفحة.
                </p>
              </div>
            </div>
            <RefreshCw className={`w-4 h-4 text-orange-600 shrink-0 ${loadingAction === "quick" ? "animate-spin" : "group-hover:rotate-45 transition-transform"}`} />
          </button>

          {/* Option 2: Full App Reload */}
          <button
            type="button"
            onClick={handleFull}
            disabled={loadingAction !== null}
            className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between text-right transition-all cursor-pointer group active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-md">
                <RotateCcw className={`w-5 h-5 ${loadingAction === "full" ? "animate-spin" : ""}`} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                  إعادة تشغيل وتحديث كامل 🔄
                </h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  إعادة تحميل كاملة للتطبيق والتحقق من وجود أي إصدار برمجي جديد.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform shrink-0" />
          </button>

          {/* Option 3: Clear Temporary Cache */}
          <button
            type="button"
            onClick={handleClearCache}
            disabled={loadingAction !== null}
            className="w-full p-3.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-2xl flex items-center justify-between text-right transition-all cursor-pointer group active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-rose-900">
                  مسح الكاش المؤقت وحل التعليق 🧹
                </h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  تفريغ ملفات الذاكرة القديمة وضمان فتح أحدث نسخة دون أي تضارب.
                </p>
              </div>
            </div>
            <RefreshCw className={`w-4 h-4 text-rose-600 shrink-0 ${loadingAction === "cache" ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Standalone independent launch banner */}
        {!isStandalone && onOpenStandaloneGuide && (
          <div className="pt-2 border-t border-slate-100">
            <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h5 className="text-xs font-black text-emerald-950">
                    تشغيل مستقل عن قوقل كروم 📲
                  </h5>
                  <p className="text-[10px] text-emerald-700 font-bold">
                    ثبّت التطبيق ليفتح كبرنامج مستقل بكامل الشاشة وبدون شريط المتصفح.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStandaloneGuide();
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer whitespace-nowrap shrink-0 transition-all"
              >
                تثبيت الآن
              </button>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-black text-xs rounded-xl transition-all cursor-pointer text-center"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
