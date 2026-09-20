import React, { useState, useMemo } from "react";
import { Store } from "../types";
import { Megaphone, Sparkles, Store as StoreIcon } from "lucide-react";

interface StoreNewsTickerProps {
  stores: Store[];
  onSelectStore?: (store: Store) => void;
  onOpenOffers?: () => void;
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
  onSelectStore,
  onOpenOffers
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

  const handleClearSelection = () => {
    try {
      if (window.getSelection) {
        window.getSelection()?.removeAllRanges();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div 
      className="w-full relative group select-none no-touch-search" 
      dir="rtl"
      onContextMenu={(e) => e.preventDefault()}
      style={{
        WebkitUserSelect: "none",
        userSelect: "none",
        WebkitTouchCallout: "none"
      }}
    >
      {/* Outer Shell */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-2xl border border-slate-800 shadow-md flex items-center overflow-hidden h-10 sm:h-11 relative select-none">
        
        {/* Compact Orange Badge on the right to leave maximum space for scrolling text */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClearSelection();
            if (onOpenOffers) onOpenOffers();
          }}
          className="bg-gradient-to-l from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-95 text-white px-2.5 sm:px-3 h-full flex items-center gap-1 shrink-0 z-20 shadow-xs font-black text-[11px] sm:text-xs tracking-tight border-l border-orange-400/30 cursor-pointer select-none transition-transform focus:outline-none"
          title="عرض كافة العروض والتخفيضات الحالية"
          style={{ WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none" }}
        >
          <Megaphone className="w-3.5 h-3.5 text-white shrink-0 pointer-events-none" />
          <span className="whitespace-nowrap pointer-events-none">العروض</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse shrink-0 pointer-events-none" />
        </button>

        {/* Continuous Full-Width Marquee Content */}
        <div 
          className="flex-1 overflow-hidden h-full flex items-center relative select-none"
          onMouseEnter={() => setHoverPaused(true)}
          onMouseLeave={() => setHoverPaused(false)}
          onTouchStart={() => {
            setHoverPaused(true);
            handleClearSelection();
          }}
          onTouchEnd={() => {
            setHoverPaused(false);
            handleClearSelection();
          }}
        >
          {/* Edge gradient shadows */}
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />

          {/* Smooth Fast Marquee (28s duration) */}
          <div 
            className="flex items-center gap-8 sm:gap-12 animate-marquee-news py-1 select-none"
            style={{ 
              animationDuration: "28s",
              animationPlayState: hoverPaused ? "paused" : "running",
              WebkitUserSelect: "none",
              userSelect: "none",
              WebkitTouchCallout: "none"
            }}
          >
            {repeatedAnnouncements.map((item, idx) => (
              <button
                key={`${item.id}_${idx}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearSelection();
                  if (item.store && onSelectStore) {
                    onSelectStore(item.store);
                  } else if (onOpenOffers) {
                    onOpenOffers();
                  }
                }}
                className={`flex items-center gap-2 shrink-0 text-xs sm:text-sm transition-all select-none focus:outline-none bg-transparent border-0 p-0 m-0 cursor-pointer active:scale-95 ${
                  item.store && onSelectStore
                    ? "hover:text-orange-300 text-slate-100"
                    : "hover:text-amber-200 text-amber-300"
                }`}
                title={item.store ? `انقر للانتقال إلى متجر (${item.storeName})` : "انقر لعرض قسم العروض والتخفيضات"}
                style={{ WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none" }}
              >
                {item.isPlaceholder ? (
                  <span className="flex items-center gap-1.5 font-bold text-amber-300 text-xs sm:text-sm whitespace-nowrap pointer-events-none select-none">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 pointer-events-none" />
                    <span className="pointer-events-none select-none">{item.message}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2 pointer-events-none select-none">
                    <span className="bg-orange-500/25 text-orange-400 border border-orange-500/40 px-2 py-0.5 rounded-lg text-[11px] font-black shrink-0 flex items-center gap-1 shadow-2xs pointer-events-none select-none">
                      <StoreIcon className="w-3 h-3 pointer-events-none" />
                      <span className="pointer-events-none select-none">{item.storeName}</span>
                    </span>

                    <span className="font-bold text-slate-100 text-xs sm:text-sm whitespace-nowrap pointer-events-none select-none">
                      {item.message}
                    </span>
                  </span>
                )}

                <span className="text-amber-500/60 font-bold mx-2 pointer-events-none select-none">✦</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
