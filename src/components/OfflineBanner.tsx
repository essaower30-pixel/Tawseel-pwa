import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WifiOff, Wifi, X, RefreshCw } from "lucide-react";

/**
 * Custom hook to track real-time online / offline connectivity status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showReconnectedToast, setShowReconnectedToast] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // When coming back online, reset dismissed and show reconnection toast
  useEffect(() => {
    if (isOnline) {
      setDismissed(false);
      setShowReconnectedToast(true);
      const timer = setTimeout(() => {
        setShowReconnectedToast(false);
      }, 4500);
      return () => clearTimeout(timer);
    } else {
      setShowReconnectedToast(false);
    }
  }, [isOnline]);

  const handleCheckConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      // Lightweight test request with timestamp to bypass cache
      await fetch(`./favicon.png?t=${Date.now()}`, { method: "HEAD", cache: "no-store" });
      // If reached, browser is actually online
      window.dispatchEvent(new Event("online"));
    } catch {
      // Still offline
    } finally {
      setTimeout(() => setIsChecking(false), 600);
    }
  }, []);

  return (
    <>
      {/* Top Main Notification Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none" dir="rtl">
        <AnimatePresence>
          {!isOnline && !dismissed && (
            <motion.div
              initial={{ y: -70, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -70, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full bg-linear-to-r from-amber-700 via-orange-600 to-amber-700 text-white shadow-xl px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-between gap-2.5 pointer-events-auto border-b border-amber-400/30"
            >
              <div className="flex items-center gap-2.5 mx-auto text-center sm:text-right">
                <div className="p-1 rounded-full bg-amber-500/30 shrink-0">
                  <WifiOff className="w-4 h-4 text-amber-200 animate-pulse" />
                </div>
                <span>
                  أنت تتصفح التطبيق في <strong className="text-amber-200 underline decoration-amber-300 font-black">وضع عدم الاتصال (أوفلاين)</strong> — المتاجر، السلة، والطلبات متاحة ومحفوظة محلياً 📱
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCheckConnection}
                  disabled={isChecking}
                  className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[11px] font-bold text-white transition-all cursor-pointer flex items-center gap-1 shrink-0 active:scale-95 disabled:opacity-50"
                  title="فحص الاتصال بالإنترنت"
                >
                  <RefreshCw className={`w-3 h-3 ${isChecking ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">فحص الاتصال</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDismissed(true)}
                  className="p-1 hover:bg-white/20 rounded-lg cursor-pointer transition-colors text-white/90 hover:text-white shrink-0"
                  title="إخفاء التنبيه"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {isOnline && showReconnectedToast && (
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full bg-emerald-600 text-white shadow-xl px-4 py-2.5 text-center text-xs sm:text-sm font-black flex items-center justify-center gap-2 pointer-events-auto border-b border-emerald-400/30"
            >
              <Wifi className="w-4 h-4 text-emerald-200 shrink-0 animate-bounce" />
              <span>تم استعادة الاتصال بالإنترنت بنجاح! جاري مزامنة البيانات تلقائياً مع السحابة ⚡</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Bottom Reminder Pill (Visible if top banner was dismissed while offline) */}
      <AnimatePresence>
        {!isOnline && dismissed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={() => setDismissed(false)}
            className="fixed bottom-20 left-4 z-40 bg-slate-900/90 backdrop-blur-md text-amber-400 border border-amber-500/40 rounded-full px-3 py-1.5 shadow-xl flex items-center gap-2 text-xs font-black cursor-pointer hover:bg-slate-900 transition-all hover:scale-105 active:scale-95 select-none animate-pulse"
            title="أنت في وضع عدم الاتصال - اضغط لعرض التفاصيل"
            dir="rtl"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            <span>تصفح بدون نت (أوفلاين)</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
