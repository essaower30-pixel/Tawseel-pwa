import React, { useState, useEffect } from "react";
import { Bell, Volume2, X, CheckCircle2, Sparkles, Smartphone } from "lucide-react";
import { requestNotificationPermission, showSystemNotification } from "../utils/soundNotifications";

interface NotificationPermissionBannerProps {
  onPermissionChange?: (granted: boolean) => void;
}

export const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({
  onPermissionChange,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isEnabling, setIsEnabling] = useState<boolean>(false);
  const [justGranted, setJustGranted] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    // Check if user already dismissed recently
    const dismissedAt = localStorage.getItem("tw_notif_banner_dismissed");
    if (dismissedAt) {
      const diff = Date.now() - parseInt(dismissedAt, 10);
      // Wait at least 1 day before prompting again if dismissed
      if (diff < 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Only display if permission is still default (not yet granted and not permanently denied)
    if (Notification.permission === "default") {
      // Delay showing slightly so user sees the page first
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      const granted = await requestNotificationPermission();
      if (onPermissionChange) {
        onPermissionChange(granted);
      }
      if (granted) {
        setJustGranted(true);
        // Trigger test notification with sound, vibration, and status bar badge!
        await showSystemNotification("تطبيق توصيل 🛵", {
          body: "تم تفعيل التنبيهات بنجاح! ستظهر أيقونة التطبيق في شريط الإشعارات أعلى الشاشة مع صوت الرنين عند كل طلب جديد أو تحديث.",
          soundType: "ringtone",
          requireInteraction: true,
        });

        // Hide after showing success state for 2 seconds
        setTimeout(() => {
          setIsVisible(false);
        }, 2200);
      } else {
        setIsVisible(false);
      }
    } catch (e) {
      console.warn("Enable notifications error:", e);
      setIsVisible(false);
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem("tw_notif_banner_dismissed", Date.now().toString());
    } catch {}
  };

  if (!isVisible) return null;

  return (
    <aside
      id="notification-permission-banner"
      dir="rtl"
      aria-label="تفعيل تنبيهات الطلبات"
      className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div className="bg-slate-900/95 backdrop-blur-md border-2 border-orange-500/80 text-white p-4 rounded-2xl shadow-2xl shadow-orange-950/40 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-orange-500/20 rounded-full blur-xl pointer-events-none" />

        {justGranted ? (
          <div className="flex items-center gap-3 py-1 text-emerald-400">
            <CheckCircle2 className="w-6 h-6 shrink-0 animate-bounce" />
            <div>
              <p className="text-sm font-black text-white">تم تفعيل التنبيهات بنجاح! 🔔</p>
              <p className="text-xs text-emerald-300 mt-0.5">ستظهر أيقونة التطبيق وصوت الرنين عند وصول أي طلب جديد.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/30">
                  <Bell className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>تفعيل تنبيهات الطلبات</span>
                    <span className="text-[10px] bg-orange-500/30 text-orange-300 px-2 py-0.5 rounded-full border border-orange-400/40">
                      أيقونة أعلى الشاشة 🛵
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 font-medium leading-relaxed">
                    لتصلك إشعارات الطلبات فوراً مع ظهور أيقونة التطبيق في شريط التنبيهات أعلى الهاتف وصوت رنين مميز.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleEnable}
                disabled={isEnabling}
                className="flex-1 py-2 px-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black rounded-xl shadow-lg shadow-orange-600/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Volume2 className="w-4 h-4" />
                <span>{isEnabling ? "جاري التفعيل..." : "تفعيل التنبيهات والصوت 🔔"}</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                لاحقاً
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
