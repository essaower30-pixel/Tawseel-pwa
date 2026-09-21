import React, { useState } from "react";
import { ShieldCheck, Bike, Store as StoreIcon, ArrowRight, Sparkles, ChevronLeft } from "lucide-react";

interface FloatingPortalReturnButtonProps {
  userRole: "admin" | "driver" | "store_owner";
  staffName?: string;
  storeName?: string;
  driverName?: string;
  onReturn: () => void;
}

export const FloatingPortalReturnButton: React.FC<FloatingPortalReturnButtonProps> = ({
  userRole,
  staffName,
  storeName,
  driverName,
  onReturn,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  let title = "العودة لوظيفتك";
  let subtext = "تتصفح حالياً كزبون";
  let themeGradient = "from-purple-900 via-indigo-900 to-slate-900 border-purple-400/60 shadow-purple-950/40 text-purple-100";
  let btnGradient = "from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-300/50";
  let icon = <ShieldCheck className="w-4 h-4 text-amber-300 animate-pulse" />;

  if (userRole === "admin") {
    const displayName = staffName || "الإدارة";
    title = `العودة لمهام: ${displayName}`;
    subtext = "حسابك وصلاحياتك الإدارية نشطة";
    themeGradient = "from-purple-950 via-slate-900 to-indigo-950 border-purple-500/50 shadow-purple-950/50 text-purple-100";
    btnGradient = "from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-300/50";
    icon = <ShieldCheck className="w-4 h-4 text-amber-300 animate-pulse" />;
  } else if (userRole === "driver") {
    const displayName = driverName || "الكابتن";
    title = `العودة للوحة: ${displayName}`;
    subtext = "استلام وتوصيل الطلبات النشطة";
    themeGradient = "from-blue-950 via-slate-900 to-cyan-950 border-blue-500/50 shadow-blue-950/50 text-blue-100";
    btnGradient = "from-blue-600 via-emerald-600 to-blue-600 hover:from-blue-500 hover:to-emerald-500 text-white border-blue-300/50";
    icon = <Bike className="w-4 h-4 text-emerald-300 animate-pulse" />;
  } else if (userRole === "store_owner") {
    const displayName = storeName || "متجري";
    title = `العودة لإدارة: ${displayName}`;
    subtext = "إدارة المنتجات وقبول الطلبات";
    themeGradient = "from-emerald-950 via-slate-900 to-teal-950 border-emerald-500/50 shadow-emerald-950/50 text-emerald-100";
    btnGradient = "from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-300/50";
    icon = <StoreIcon className="w-4 h-4 text-amber-300 animate-pulse" />;
  }

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-[74px] sm:bottom-20 start-3 sm:start-5 z-40 animate-fade-in"
        dir="rtl"
      >
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className={`p-2.5 rounded-full bg-gradient-to-r ${themeGradient} border-2 shadow-2xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all`}
          title={`توسيع زر العودة (${title})`}
        >
          {icon}
          <span className="absolute -top-1 -end-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div 
      className="fixed bottom-[72px] sm:bottom-20 start-2.5 sm:start-5 z-40 max-w-[calc(100vw-20px)] xs:max-w-xs animate-fade-in"
      dir="rtl"
    >
      <div className={`p-2 sm:p-2.5 rounded-2xl bg-gradient-to-r ${themeGradient} border border-opacity-60 shadow-2xl backdrop-blur-md flex items-center justify-between gap-2`}>
        {/* Clickable Area to return */}
        <button
          type="button"
          onClick={onReturn}
          className={`flex-1 flex items-center gap-2 py-1.5 px-2.5 rounded-xl bg-gradient-to-r ${btnGradient} border text-right transition-all cursor-pointer active:scale-98 shadow-md`}
          title="الضغط للعودة المباشرة إلى لوحة العمل"
        >
          <div className="shrink-0">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black truncate">{title}</span>
            </div>
            <span className="text-[10px] opacity-90 truncate block text-amber-200/90 font-medium">
              {subtext}
            </span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 rotate-180 shrink-0 text-amber-200" />
        </button>

        {/* Minimize Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(true);
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 text-xs transition-colors shrink-0"
          title="تصغير الزر"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
