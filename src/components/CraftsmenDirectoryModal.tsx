import React, { useState } from "react";
import { 
  Wrench, 
  Search, 
  MapPin, 
  X,
  Star,
  UserCheck
} from "lucide-react";
import { Craftsman } from "../types";
import { ContactActions } from "./ContactActions";
import { matchesArabicSearch } from "../utils/arabicSearch";

interface CraftsmenDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  craftsmen: Craftsman[];
}

export const CraftsmenDirectoryModal: React.FC<CraftsmenDirectoryModalProps> = ({
  isOpen,
  onClose,
  craftsmen
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCraft, setSelectedCraft] = useState("all");

  if (!isOpen) return null;

  // Distinct crafts
  const craftTypes = Array.from(
    new Set(craftsmen.map((c) => c.craft.trim()).filter(Boolean))
  );

  const filteredCraftsmen = craftsmen.filter((c) => {
    const craftFullText = `${c.name} ${c.craft} ${c.phone} ${c.neighborhood || ""} ${c.description || ""} مهني حرفي`;
    const matchesSearch = matchesArabicSearch(craftFullText, searchQuery);
    const matchesCraft =
      selectedCraft === "all" || c.craft.trim() === selectedCraft;
    return matchesSearch && matchesCraft;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl w-full max-w-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto text-right font-sans animate-scale-up" 
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-700 via-orange-850 to-slate-900 text-white shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl -ml-20 -mt-20 pointer-events-none" />
          
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black flex items-center gap-2">
                  <span>دليل الحرفيين وأصحاب المهن والخدمات 🛠️</span>
                </h2>
                <p className="text-xs text-amber-200/90 font-medium">
                  بطاقات تعريفية للتواصل المباشر مع المهنيين والحرفيين (حدادة، سباكة، كهرباء، نجارة...)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-amber-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Craft Filter */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200/80 shrink-0 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الحرفي، المهنة (حداد، سباك، كهربائي)، المنطقة..."
              className="w-full py-2 pr-10 pl-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Craft Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCraft("all")}
              className={`py-1 px-3 rounded-lg font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedCraft === "all"
                  ? "bg-orange-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              الكل ({craftsmen.length})
            </button>
            {craftTypes.map((cr) => (
              <button
                key={cr}
                type="button"
                onClick={() => setSelectedCraft(cr)}
                className={`py-1 px-3 rounded-lg font-black whitespace-nowrap transition-all cursor-pointer ${
                  selectedCraft === cr
                    ? "bg-orange-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cr}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body: Craftsmen Cards Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {filteredCraftsmen.length === 0 ? (
            <div className="text-center py-12 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
                <Wrench className="w-6 h-6" />
              </div>
              <p className="font-extrabold text-slate-800 text-sm">
                لم نجد أي حرفي مطابق للبحث
              </p>
              <p className="text-xs text-slate-400">
                جرب تغيير كلمة البحث أو اختيار مهنة أخرى من الأزرار بالأعلى
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCraftsmen.map((craftsman) => {
                const isAvailable = craftsman.availability !== "offline" && craftsman.availability !== "busy";
                return (
                  <div
                    key={craftsman.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-orange-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 text-right"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-600 flex items-center justify-center font-black text-lg shrink-0">
                            🛠️
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate">
                              {craftsman.name}
                            </h4>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200/70 text-orange-800 text-[11px] font-black">
                              {craftsman.craft}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 border ${
                            isAvailable
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}
                        >
                          {isAvailable ? "🟢 متاح للعمل" : "🟡 غير متاح حالياً"}
                        </span>
                      </div>

                      {craftsman.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {craftsman.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium">
                        {craftsman.neighborhood && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{craftsman.neighborhood}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200/60 font-bold">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>
                            {craftsman.rating !== undefined && craftsman.rating !== null
                              ? craftsman.rating === 0
                                ? "جديد"
                                : craftsman.rating
                              : "جديد"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <ContactActions
                        phone={craftsman.phone}
                        name={craftsman.name}
                        defaultMessage={`مرحباً ${craftsman.name} (${craftsman.craft})، أود الاستفسار عن خدمة مهنية.`}
                        variant="full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="p-3 bg-slate-50 border-t border-slate-200/80 text-center text-xs text-slate-500 font-medium shrink-0 flex items-center justify-center gap-1.5">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span>خدمات مهنية مباشرة وحرفيون معتمدون في البلدة والقرى المجاورة</span>
        </div>
      </div>
    </div>
  );
};
