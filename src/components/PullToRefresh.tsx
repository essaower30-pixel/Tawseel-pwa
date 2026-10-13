import React, { useState, useEffect, useRef } from "react";
import { RefreshCw, ArrowDown, Check } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false
}) => {
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshSuccess, setRefreshSuccess] = useState<boolean>(false);

  const startYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const threshold = 70; // px to trigger refresh
  const maxPull = 110; // max px allowed to pull

  useEffect(() => {
    if (disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pull to refresh if user is at the very top of the page
      if (window.scrollY <= 5 && !isRefreshing) {
        startYRef.current = e.touches[0].clientY;
        isDraggingRef.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      if (diff > 0 && window.scrollY <= 0) {
        // Apply friction to pull
        const pull = Math.min(diff * 0.45, maxPull);
        setPullDistance(pull);
        if (pull > 10 && e.cancelable) {
          // Prevent browser default pull-to-refresh on Chrome Android
          e.preventDefault();
        }
      } else {
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isDraggingRef.current || isRefreshing) return;
      isDraggingRef.current = false;

      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        setPullDistance(threshold);

        try {
          await onRefresh();
          setRefreshSuccess(true);
          setTimeout(() => {
            setRefreshSuccess(false);
            setIsRefreshing(false);
            setPullDistance(0);
          }, 600);
        } catch {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [disabled, isRefreshing, pullDistance, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div className="relative w-full">
      {/* Pull To Refresh Indicator Bar */}
      {pullDistance > 0 && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-transform pointer-events-none"
          style={{
            transform: `translateY(${Math.max(0, pullDistance - 15)}px)`,
            opacity: Math.min(1, pullDistance / 30)
          }}
        >
          <div className="bg-white/95 backdrop-blur-md border border-orange-200/90 shadow-xl rounded-full px-4 py-2 flex items-center gap-2 text-xs font-black text-slate-800 animate-fade-in">
            {refreshSuccess ? (
              <>
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-emerald-700">تم التحديث بنجاح ✨</span>
              </>
            ) : isRefreshing ? (
              <>
                <RefreshCw className="w-4 h-4 text-orange-600 animate-spin" />
                <span className="text-orange-600">جاري تحديث التطبيق والبيانات...</span>
              </>
            ) : progress >= 1 ? (
              <>
                <RefreshCw className="w-4 h-4 text-orange-600 animate-bounce" />
                <span className="text-orange-600">اترك الشاشة للتحديث الفوري 🔄</span>
              </>
            ) : (
              <>
                <ArrowDown
                  className="w-4 h-4 text-slate-500 transition-transform duration-150"
                  style={{ transform: `rotate(${progress * 180}deg)` }}
                />
                <span className="text-slate-600">اسحب للأسفل للتحديث...</span>
              </>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  );
};
