import React, { useState, useMemo } from "react";
import { Store } from "../types";
import { Megaphone, Sparkles, Store as StoreIcon } from "lucide-react";

interface StoreNewsTickerProps {
  stores: Store[];
  onSelectStore?: (store: Store) => void;
}

interface TickerItem {
  id: string;
  storeId?: string;
  storeName: string;
  message: string;
  store?: Store;
  isPlaceholder?: boolean;
}

export const StoreNewsTicker: React.FC<StoreNewsTickerProps> = ({
  stores,
  onSelectStore
}) => {
  const [hoverPaused, setHoverPaused] = useState(false);

  // Collect only genuine ticker announcements set by store owners
  const announcements: TickerItem[] = useMemo(() => {
    const list: TickerItem[] = [];

    stores
      .filter((st) => st.isApproved !== false)
      .forEach((st) => {
        if (st.tickerAnnouncement && st.tickerAnnouncement.trim() !== "") {
          list.push({
            id: `st_ticker_${st.id}`,
            storeId: st.id,
            storeName: st.name,
            message: st.tickerAnnouncement.trim(),
            store: st,
            isPlaceholder: false
          });
        }
      });

    // If no store has posted an announcement yet, show only the simple placeholder phrase
    if (list.length === 0) {
      list.push({
        id: "placeholder_offer",
        storeName: "ترقبوا العروض",
        message: "ترقبوا العروض ✨",
        isPlaceholder: true
      });
    }

    return list;
  }, [stores]);

  // Ensure seamless continuous loop with repeated items
  const repeatedAnnouncements = useMemo(() => {
    if (announcements.length === 0) return [];
    if (announcements.length === 1) {
      return [
        announcements[0],
        announcements[0],
        announcements[0],
        announcements[0],
        announcements[0],
        announcements[0]
      ];
    }
    if (announcements.length === 2) {
      return [...announcements, ...announcements, ...announcements];
    }
    return [...announcements, ...announcements];
  }, [announcements]);

  return (
    <div className="w-full relative group select-none" dir="rtl">
      {/* Outer Shell */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-2xl border border-slate-800 shadow-md flex items-center overflow-hidden h-10 sm:h-11 relative">
        
        {/* Compact Orange Badge on the right to leave maximum space for scrolling text */}
        <div className="bg-gradient-to-l from-orange-600 to-amber-600 text-white px-2 sm:px-2.5 h-full flex items-center gap-1 shrink-0 z-20 shadow-xs font-black text-[11px] sm:text-xs tracking-tight border-l border-orange-400/30">
          <Megaphone className="w-3.5 h-3.5 text-white shrink-0" />
          <span className="whitespace-nowrap">العروض</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse shrink-0" />
        </div>

        {/* Continuous Full-Width Marquee Content */}
        <div 
          className="flex-1 overflow-hidden h-full flex items-center relative"
          onMouseEnter={() => setHoverPaused(true)}
          onMouseLeave={() => setHoverPaused(false)}
          onTouchStart={() => setHoverPaused(true)}
          onTouchEnd={() => setHoverPaused(false)}
        >
          {/* Edge gradient shadows */}
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />

          {/* Smooth Fast Marquee (28s duration) */}
          <div 
            className="flex items-center gap-8 sm:gap-12 animate-marquee-news py-1"
            style={{ 
              animationDuration: "28s",
              animationPlayState: hoverPaused ? "paused" : "running"
            }}
          >
            {repeatedAnnouncements.map((item, idx) => (
              <div
                key={`${item.id}_${idx}`}
                onClick={() => {
                  if (item.store && onSelectStore) {
                    onSelectStore(item.store);
                  }
                }}
                className={`flex items-center gap-2 shrink-0 text-xs sm:text-sm transition-all ${
                  item.store && onSelectStore
                    ? "cursor-pointer hover:text-orange-300 active:scale-95"
                    : "cursor-default"
                }`}
                title={item.store ? `انقر للانتقال إلى متجر (${item.storeName})` : undefined}
              >
                {item.isPlaceholder ? (
                  <span className="flex items-center gap-1.5 font-bold text-amber-300 text-xs sm:text-sm whitespace-nowrap">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{item.message}</span>
                  </span>
                ) : (
                  <>
                    <span className="bg-orange-500/25 text-orange-400 border border-orange-500/40 px-2 py-0.5 rounded-lg text-[11px] font-black shrink-0 flex items-center gap-1 shadow-2xs">
                      <StoreIcon className="w-3 h-3" />
                      <span>{item.storeName}</span>
                    </span>

                    <span className="font-bold text-slate-100 text-xs sm:text-sm whitespace-nowrap">
                      {item.message}
                    </span>
                  </>
                )}

                <span className="text-amber-500/60 font-bold mx-2">✦</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
