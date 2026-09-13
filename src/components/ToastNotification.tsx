import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  X, 
  ShoppingBag, 
  ArrowLeft, 
  Bike, 
  Store as StoreIcon, 
  Sparkles,
  Music,
  Check,
  EyeOff
} from "lucide-react";
import { Order } from "../types";
import { 
  isSoundEnabled, 
  setSoundEnabled, 
  playOrderAlertSound, 
  getSoundType, 
  setSoundType, 
  SoundType 
} from "../utils/soundNotifications";

export type AlertOrigin = "customer" | "store_owner" | "driver" | "admin" | "system";

export interface ToastItem {
  id: string;
  order?: Order;
  title: string;
  message: string;
  targetRole?: "admin" | "store_owner" | "driver" | "customer" | "all";
  type: "new_order" | "status_change" | "driver_assigned" | "info" | "success" | "warning";
  source?: AlertOrigin;
  createdAt: number;
}

interface ToastNotificationProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  onDismissAll?: () => void;
  onViewOrder: (order: Order) => void;
  currentRole: string;
}

// Function to resolve individual alert theme, color scheme, icon, and radiant lighting
const getAlertTheme = (toast: ToastItem, currentRole: string) => {
  const title = toast.title || "";
  const msg = toast.message || "";

  const isWarning =
    toast.type === "warning" ||
    title.includes("إخفاء") ||
    title.includes("مخفي") ||
    title.includes("إغلاق") ||
    title.includes("رفض") ||
    msg.includes("إخفاء");

  const isSuccess =
    toast.type === "success" ||
    title.includes("اعتماد") ||
    title.includes("الموافقة") ||
    title.includes("تم التسليم") ||
    title.includes("تم حفظ") ||
    toast.order?.status === "delivered";

  const isCustomerOrder =
    toast.source === "customer" ||
    (toast.type === "new_order" && !title.includes("صاحب المتجر") && !title.includes("تسجيل متجر")) ||
    title.includes("طلب زبون") ||
    title.includes("وصول طلب جديد") ||
    title.includes("طلب جديد وارد") ||
    title.includes("تم إرسال طلبكم") ||
    title.includes("الطلب المخصص") ||
    (toast.order && (toast.order.status === "pending" || !toast.order.status));

  const isStoreRequest =
    toast.source === "store_owner" ||
    title.includes("صاحب المتجر") ||
    title.includes("أصحاب المتاجر") ||
    title.includes("متجر") ||
    title.includes("المتجر") ||
    title.includes("تعميم") ||
    title.includes("بث التنبيه") ||
    title.includes("تسجيل متجر") ||
    title.includes("الصنف") ||
    (toast.type === "status_change" && (toast.order?.status === "accepted" || toast.order?.status === "preparing"));

  const isDriverAlert =
    toast.source === "driver" ||
    toast.type === "driver_assigned" ||
    title.includes("كابتن") ||
    title.includes("توصيل") ||
    toast.order?.status === "picked_up";

  // 1. طلب من الزبون (Customer Order) - إضاءة برتقالية ذهبية ساطعة مع وميض
  if (isCustomerOrder && !isWarning) {
    return {
      typeKey: "customer_order",
      badgeLabel: currentRole === "store_owner"
        ? "طلب وارد من الزبون 🛍️"
        : currentRole === "admin"
        ? "طلب جديد من الزبون للإدارة 🛍️"
        : "طلب زبون جديد 🛍️",
      icon: <ShoppingBag className="w-6 h-6 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />,
      cardBorder: "border-orange-500/70 shadow-[0_12px_45px_rgba(249,115,22,0.35)]",
      ambientGlow: "bg-orange-500/30",
      iconContainer:
        "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white shadow-[0_0_30px_rgba(249,115,22,0.95)] ring-4 ring-orange-400/60 ring-offset-2 ring-offset-slate-900 animate-bounce-slow",
      badge: "bg-orange-500/25 text-orange-300 border border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.4)]",
      pingColor: "bg-orange-400",
      dotColor: "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,1)]",
      primaryButton: "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-orange-500/35",
      accentText: "text-orange-400",
      hasBeacon: true
    };
  }

  // 2. طلب أو إشعار من أصحاب المتاجر (Store Owner Request / Alert) - إضاءة بنفسجية ملكية فخمة
  if (isStoreRequest && !isWarning) {
    return {
      typeKey: "store_request",
      badgeLabel: currentRole === "admin"
        ? "طلب / إشعار من صاحب المتجر 🏪"
        : "إشعار من صاحب المتجر 🏪",
      icon: <StoreIcon className="w-6 h-6 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />,
      cardBorder: "border-purple-500/70 shadow-[0_12px_45px_rgba(168,85,247,0.35)]",
      ambientGlow: "bg-purple-500/30",
      iconContainer:
        "bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700 text-white shadow-[0_0_30px_rgba(168,85,247,0.95)] ring-4 ring-purple-400/60 ring-offset-2 ring-offset-slate-900 animate-pulse",
      badge: "bg-purple-500/25 text-purple-300 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.4)]",
      pingColor: "bg-purple-400",
      dotColor: "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,1)]",
      primaryButton: "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg shadow-purple-500/35",
      accentText: "text-purple-400",
      hasBeacon: true
    };
  }

  // 3. تنبيه / تكليف الكابتن (Driver / Delivery Alert) - إضاءة زرقاء تركوازية ساطعة
  if (isDriverAlert && !isWarning) {
    return {
      typeKey: "driver",
      badgeLabel: "إشعار كابتن التوصيل 🛵",
      icon: <Bike className="w-6 h-6 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />,
      cardBorder: "border-cyan-500/70 shadow-[0_12px_45px_rgba(6,182,212,0.35)]",
      ambientGlow: "bg-cyan-500/30",
      iconContainer:
        "bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-white shadow-[0_0_30px_rgba(6,182,212,0.95)] ring-4 ring-cyan-400/60 ring-offset-2 ring-offset-slate-900 animate-pulse",
      badge: "bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.4)]",
      pingColor: "bg-cyan-400",
      dotColor: "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,1)]",
      primaryButton: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/35",
      accentText: "text-cyan-400",
      hasBeacon: true
    };
  }

  // 4. تنبيه إخفاء / تحذير (Warning & Hidden) - إضاءة كهرمانية ذهبية تحذيرية
  if (isWarning) {
    return {
      typeKey: "warning",
      badgeLabel: "تنبيه إخفاء / إجراء 🔒",
      icon: <EyeOff className="w-6 h-6 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />,
      cardBorder: "border-amber-500/70 shadow-[0_12px_45px_rgba(245,158,11,0.35)]",
      ambientGlow: "bg-amber-500/30",
      iconContainer:
        "bg-gradient-to-br from-amber-400 via-amber-500 to-rose-600 text-white shadow-[0_0_30px_rgba(245,158,11,0.95)] ring-4 ring-amber-400/60 ring-offset-2 ring-offset-slate-900 animate-pulse",
      badge: "bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.4)]",
      pingColor: "bg-amber-400",
      dotColor: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,1)]",
      primaryButton: "bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-600/35",
      accentText: "text-amber-400",
      hasBeacon: true
    };
  }

  // 5. اعتماد أو نجاح (Success & Approval) - إضاءة زمردية خضراء ناصعة
  if (isSuccess) {
    return {
      typeKey: "success",
      badgeLabel: "اعتماد ونجاح ✅",
      icon: <Check className="w-6 h-6 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />,
      cardBorder: "border-emerald-500/70 shadow-[0_12px_45px_rgba(16,185,129,0.35)]",
      ambientGlow: "bg-emerald-500/30",
      iconContainer:
        "bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.95)] ring-4 ring-emerald-400/60 ring-offset-2 ring-offset-slate-900 animate-pulse",
      badge: "bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.4)]",
      pingColor: "bg-emerald-400",
      dotColor: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]",
      primaryButton: "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/35",
      accentText: "text-emerald-400",
      hasBeacon: false
    };
  }

  // 6. إشعار عام للمنصة (General Info / Platform) - إضاءة زرقاء كوزمية
  return {
    typeKey: "info",
    badgeLabel: "إشعار التطبيق ⚡",
    icon: <Sparkles className="w-6 h-6 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />,
    cardBorder: "border-blue-500/60 shadow-[0_12px_40px_rgba(59,130,246,0.3)]",
    ambientGlow: "bg-blue-500/25",
    iconContainer:
      "bg-gradient-to-br from-blue-400 via-indigo-500 to-blue-600 text-white shadow-[0_0_25px_rgba(59,130,246,0.9)] ring-4 ring-blue-400/40 ring-offset-2 ring-offset-slate-900 animate-pulse",
    badge: "bg-blue-500/25 text-blue-300 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.35)]",
    pingColor: "bg-blue-400",
    dotColor: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]",
    primaryButton: "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/35",
    accentText: "text-blue-400",
    hasBeacon: false
  };
};

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toasts,
  onDismiss,
  onDismissAll,
  onViewOrder,
  currentRole,
}) => {
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [soundChoice, setSoundChoice] = useState<SoundType>(() => getSoundType());
  const [showSoundSettings, setShowSoundSettings] = useState<boolean>(false);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      playOrderAlertSound();
    }
  };

  const handleSoundSelect = (type: SoundType) => {
    setSoundChoice(type);
    setSoundType(type);
    playOrderAlertSound(type);
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex flex-col items-center gap-2.5 pointer-events-none max-w-md mx-auto" dir="rtl">
      <AnimatePresence>
        {toasts.map((toast) => {
          const theme = getAlertTheme(toast, currentRole);

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -25, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.15 } }}
              className={`w-full pointer-events-auto bg-slate-900/95 text-white backdrop-blur-md rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden transition-all border ${theme.cardBorder}`}
            >
              {/* Ambient Background Lighting Glow */}
              <div className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10 ${theme.ambientGlow}`} />

              <div className="flex items-start gap-3">
                {/* Custom Colored & Illuminated Icon Badge */}
                <div className="relative shrink-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${theme.iconContainer}`}
                  >
                    {theme.icon}
                  </div>
                  {/* Radiant Beacon Indicator */}
                  {theme.hasBeacon && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.pingColor}`}></span>
                      <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${theme.dotColor}`}></span>
                    </span>
                  )}
                </div>

                {/* Toast Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-sm text-white flex items-center gap-1">
                        <Sparkles className={`w-3.5 h-3.5 ${theme.accentText} inline`} />
                        {toast.title}
                      </span>

                      {/* Illuminated Badge for specific alert */}
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${theme.badge}`}>
                        {theme.badgeLabel}
                      </span>

                      {soundOn && (toast.type === "new_order" || theme.typeKey === "customer_order") && (
                        <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-0.5 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                          <Volume2 className="w-2.5 h-2.5 animate-pulse" />
                          <span>رنين</span>
                        </span>
                      )}
                    </div>

                    {/* Close button */}
                    <button
                      type="button"
                      onClick={() => onDismiss(toast.id)}
                      className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 font-bold leading-relaxed line-clamp-2">
                    {toast.message}
                  </p>

                  {/* Details summary (only for real orders with valid order object) */}
                  {Boolean(toast.order && toast.order.id && toast.order.id !== "tw-live") && (
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-300 flex-wrap">
                      {toast.order?.storeName && (
                        <span className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                          <StoreIcon className={`w-3 h-3 ${theme.accentText}`} />
                          {toast.order.storeName}
                        </span>
                      )}
                      {toast.order?.total !== undefined && toast.order.total > 0 && (
                        <span className={`font-black bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 ${theme.accentText}`}>
                          {toast.order.total.toLocaleString()} ل.س
                        </span>
                      )}
                      {toast.order?.customerName && (
                        <span className="text-slate-400">
                          👤 {toast.order.customerName}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2.5 mt-1 border-t border-slate-800">
                    {!toast.order ||
                    !toast.order.id ||
                    toast.order.id === "tw-live" ||
                    toast.type === "info" ||
                    toast.type === "warning" ||
                    toast.type === "success" ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onDismissAll) {
                            onDismissAll();
                          } else {
                            onDismiss(toast.id);
                          }
                        }}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-black py-2 px-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>حسناً، تم ✓</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (toast.order) {
                            onViewOrder(toast.order);
                          }
                          onDismiss(toast.id);
                        }}
                        className={`flex-1 active:scale-95 text-white text-xs font-black py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${theme.primaryButton}`}
                      >
                        <span>
                          {currentRole === "admin"
                            ? "معاينة وإدارة الطلب في لوحة الإدارة 🛵"
                            : currentRole === "store_owner"
                            ? "قبول وتجهيز الطلب في المتجر ⚡"
                            : currentRole === "driver"
                            ? "استلام وتوصيل الطلب 🚀"
                            : "معاينة وتفاصيل الطلب"}
                        </span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Sound quick toggle button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={toggleSound}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
                          soundOn
                            ? "bg-slate-800 text-orange-400 border-orange-500/40 hover:bg-slate-700"
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                        }`}
                        title={soundOn ? "صوت الرنين مفعّل (انقر للكتم)" : "صوت الرنين مكتوم (انقر للتفعيل)"}
                      >
                        {soundOn ? (
                          <Volume2 className="w-4 h-4 text-orange-400 animate-pulse" />
                        ) : (
                          <VolumeX className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>

                    {/* Sound settings & preview button */}
                    <button
                      type="button"
                      onClick={() => setShowSoundSettings(!showSoundSettings)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs transition-colors"
                      title="خيارات نغمات التنبيه"
                    >
                      <Music className="w-4 h-4 text-slate-300" />
                    </button>
                  </div>

                  {/* Extended Sound Selection panel */}
                  {showSoundSettings && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-2 mt-2 border-t border-slate-800 space-y-1.5"
                    >
                      <div className="text-[10px] font-black text-slate-400 flex items-center justify-between">
                        <span>اختر نغمة التنبيه للطلبات:</span>
                        <button
                          type="button"
                          onClick={() => playOrderAlertSound(soundChoice)}
                          className="text-orange-400 hover:underline flex items-center gap-0.5"
                        >
                          <Volume2 className="w-3 h-3" />
                          تجربة النغمة
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { id: "chime", label: "نغمة هادئة" },
                          { id: "ringtone", label: "رنين هاتف" },
                          { id: "cashier", label: "كاشير" },
                          { id: "urgent", label: "تنبيه سريع" },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSoundSelect(item.id as SoundType)}
                            className={`text-[10px] font-bold py-1 px-1 rounded-lg border transition-all truncate ${
                              soundChoice === item.id
                                ? "bg-orange-500 text-white border-orange-400"
                                : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
