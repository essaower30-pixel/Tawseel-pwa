import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WifiOff, Wifi, X } from "lucide-react";

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });
  const [showReconnectedToast, setShowReconnectedToast] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setDismissed(false);
      setShowReconnectedToast(true);
      const timer = setTimeout(() => {
        setShowReconnectedToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedToast(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none" dir="rtl">
      <AnimatePresence>
        {!isOnline && !dismissed && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white shadow-xl px-4 py-2 text-xs sm:text-sm font-bold flex items-center justify-between gap-2 pointer-events-auto border-b border-amber-400/30"
          >
            <div className="flex items-center gap-2 mx-auto">
              <WifiOff className="w-4 h-4 animate-pulse shrink-0 text-amber-200" />
              <span>
                أنت تتصفح الآن في <strong className="underline decoration-amber-300">وضع عدم الاتصال (أوفلاين)</strong> — التطبيق يعمل بشكل كامل محلياً.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-white/20 rounded-lg cursor-pointer transition-colors text-white shrink-0"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {isOnline && showReconnectedToast && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="w-full bg-emerald-600 text-white shadow-xl px-4 py-2 text-center text-xs sm:text-sm font-black flex items-center justify-center gap-2 pointer-events-auto border-b border-emerald-400/30"
          >
            <Wifi className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>تم استعادة الاتصال بالإنترنت بنجاح! جاري مزامنة البيانات تلقائياً ⚡</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
