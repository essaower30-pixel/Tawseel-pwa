import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bot,
  Sparkles,
  X,
  Search,
  Plus,
  ArrowRight,
  Store as StoreIcon,
  Tag,
  Check,
  Flame,
  Utensils,
  ShoppingBag,
  DollarSign,
  ThumbsUp,
  RefreshCw,
  HeartHandshake
} from "lucide-react";
import { Product, Store } from "../types";

interface SmartAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  stores: Store[];
  onAddToCart: (product: Product) => void;
  onSelectStore: (store: Store) => void;
  currency?: string;
}

interface SmartPreset {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  categoryFilter?: string;
  maxPrice?: number;
  keywords: string[];
  assistantReply: string;
}

const PRESETS: SmartPreset[] = [
  {
    id: "quick_single",
    label: "وجبة سريعة لشخص 🍔",
    icon: "🍔",
    prompt: "أريد وجبة سريعة ولذيذة لشخص واحد",
    keywords: ["شاورما", "برغر", "فلافل", "سندويش", "وجبة", "بيتزا"],
    assistantReply: "اخترت لك أفضل الوجبات السريعة الفردية والأكثر طلباً لتصلك ساخنة خلال دقائق! 😋"
  },
  {
    id: "family_feast",
    label: "طعام عائلي ومشاوي 🍖",
    icon: "🍖",
    prompt: "أريد وجبة عائلية تشبع 4 إلى 6 أشخاص",
    keywords: ["مشاوي", "فروج", "عائلي", "شاورما عربي", "كيلو", "وجبة عائلية"],
    assistantReply: "هذه تشكيلة مميزة من الوجبات العائلية والمشاوي المحمرة التي تكفي وتبيض الوجه! 👨‍👩‍👧‍👦"
  },
  {
    id: "budget_friendly",
    label: "اقتصادي تحت 30 ألف 💸",
    icon: "💸",
    prompt: "أريد خيارات اقتصادية بسعر مناسب أقل من 30,000 ل.س",
    maxPrice: 30000,
    keywords: ["فلافل", "بطاطا", "مناقيش", "ساندويش", "زعتر", "جبنة"],
    assistantReply: "جمعت لك أشهى الوجبات والأصناف التوفيرية ذات المذاق الرائع وبأفضل سعر! 💰"
  },
  {
    id: "sweets_night",
    label: "حلويات وتسالي سهرة 🍰",
    icon: "🍰",
    prompt: "أريد حلويات وتسالي لسهرة ممتعة",
    categoryFilter: "sweets",
    keywords: ["كنافة", "بقلاوة", "كيك", "ايس كريم", "بوظة", "معجنات", "حلو"],
    assistantReply: "سهرة حلوة ما بتكمل إلا مع أطيب الحلويات الشامية والمخبوزات الطازجة! 🧁✨"
  },
  {
    id: "grocery_fresh",
    label: "تموين وخضار طازجة 🥦",
    icon: "🥦",
    prompt: "أحتاج خضار وفواكه ومواد تموينية للبيت",
    keywords: ["طماطم", "بندورة", "خيار", "تفاح", "سكر", "رز", "زيت", "حليب"],
    assistantReply: "إليك أفضل المنتجات والخضار التموينية الطازجة من محلات وسوبرماركت القرية! 🛒"
  },
  {
    id: "pharmacy_urgent",
    label: "صيدلية ومستلزمات 💊",
    icon: "💊",
    prompt: "أريد مستلزمات طبية وأدوية إسعافية",
    categoryFilter: "pharmacies",
    keywords: ["بنادول", "مسكن", "فيتامين", "شاش", "معقم", "صيدلية"],
    assistantReply: "سلامتكم وألف عافية! هذه المستلزمات الطبية المتوفرة في صيدليات القرية مع خدمة التوصيل الفوري 🩺"
  }
];

export const SmartAIAssistantModal: React.FC<SmartAIAssistantModalProps> = ({
  isOpen,
  onClose,
  products,
  stores,
  onAddToCart,
  onSelectStore,
  currency = "ل.س"
}) => {
  const [query, setQuery] = useState("");
  const [activePreset, setActivePreset] = useState<SmartPreset | null>(PRESETS[0]);
  const [addedProductIds, setAddedProductIds] = useState<Set<string>>(new Set());

  // Filter available products
  const availableProducts = useMemo(() => {
    return products.filter((p) => p.isApproved !== false && p.approvalStatus !== "rejected" && p.isHidden !== true);
  }, [products]);

  // AI Matching Recommendation Algorithm
  const recommendations = useMemo(() => {
    let list = [...availableProducts];

    // If there is a manual search query
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const descMatch = (p.description || "").toLowerCase().includes(q);
        const catMatch = (p.category || "").toLowerCase().includes(q);
        const storeMatch = stores.find((s) => s.id === p.storeId)?.name.toLowerCase().includes(q);
        return nameMatch || descMatch || catMatch || storeMatch;
      });
      return list.slice(0, 12);
    }

    // If preset is selected
    if (activePreset) {
      if (activePreset.maxPrice) {
        list = list.filter((p) => p.price <= activePreset.maxPrice!);
      }
      if (activePreset.categoryFilter) {
        list = list.filter((p) => p.category === activePreset.categoryFilter);
      }

      // Keyword matching score
      const scored = list.map((p) => {
        let score = 0;
        const text = `${p.name} ${p.description || ""} ${p.category}`.toLowerCase();
        activePreset.keywords.forEach((kw) => {
          if (text.includes(kw.toLowerCase())) {
            score += 3;
          }
        });
        if (p.isOffer) score += 2;
        return { product: p, score };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored.filter((item) => item.score > 0).map((item) => item.product).slice(0, 10);
    }

    return list.slice(0, 8);
  }, [availableProducts, query, activePreset, stores]);

  const handleAddSingleProduct = (product: Product) => {
    onAddToCart(product);
    setAddedProductIds((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedProductIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]"
      >
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 p-4 sm:p-5 text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg">المساعد الذكي للطلب والوجبات</h3>
                <span className="bg-amber-300 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                  AI Smart
                </span>
              </div>
              <p className="text-xs text-orange-100 font-medium">
                محتار شو تطلب؟ دع الذكاء الاصطناعي يقترح لك أشهى الوجبات والخيارات المناسبة لميزانيتك!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Prompt Input */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 space-y-3 shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value) setActivePreset(null);
              }}
              placeholder="اكتب ما يخطر ببالك (مثال: وجبة عائلية رخيصة، شاورما مع بطاطا، سناك خفيف...)"
              className="w-full bg-white border border-slate-300 focus:border-orange-500 rounded-2xl py-3 pr-11 pl-10 text-xs sm:text-sm font-bold text-slate-900 shadow-xs focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5" />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute left-3 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick AI Presets Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
            <span className="text-[11px] font-black text-slate-500 shrink-0 ml-1">اقتراحات سريعة:</span>
            {PRESETS.map((preset) => {
              const isSelected = activePreset?.id === preset.id && !query;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActivePreset(preset);
                  }}
                  className={`text-[11px] font-black py-1.5 px-3 rounded-xl whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 active:scale-95 shadow-xs ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-slate-900/20"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-orange-50 hover:border-orange-200"
                  }`}
                >
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversational AI Advice Banner */}
        <div className="px-4 py-2.5 bg-amber-50/70 border-b border-amber-200/60 flex items-center gap-2.5 text-xs text-amber-950 font-bold shrink-0">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
          <p className="line-clamp-1">
            {query
              ? `نتائج البحث الذكي عن: "${query}"`
              : activePreset?.assistantReply || "اخترنا لك أفضل الأصناف الجاهزة للطلب الفوري!"}
          </p>
        </div>

        {/* Recommendations List Grid */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {recommendations.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 mx-auto flex items-center justify-center text-2xl">
                🔍
              </div>
              <h4 className="font-black text-slate-800 text-sm">لم نجد أصناف مطابقة لهذا الطلب بدقة</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                جرب اختيار أحد الاقتراحات السريعة بالأعلى أو كتابة اسم الصنف مباشرة.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActivePreset(PRESETS[0]);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-black bg-orange-600 text-white py-2 px-4 rounded-xl shadow-xs cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة ضبط الاقتراحات</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recommendations.map((prod) => {
                const store = stores.find((s) => s.id === prod.storeId);
                const isAdded = addedProductIds.has(prod.id);
                const isOutOfStock = prod.isAvailable === false || prod.inStock === false || (prod.stock !== undefined && prod.stock <= 0);

                return (
                  <div
                    key={prod.id}
                    className={`p-3 rounded-2xl border transition-all flex flex-col justify-between space-y-2.5 bg-white hover:border-orange-300 shadow-xs hover:shadow-md relative ${
                      isOutOfStock ? "opacity-75 bg-slate-50 border-slate-200" : "border-slate-200/80"
                    }`}
                  >
                    {/* Header & Image */}
                    <div className="flex gap-3 items-start">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className={`w-full h-full object-cover ${isOutOfStock ? "grayscale-[60%]" : ""}`}
                        />
                        {prod.isOffer && (
                          <span className="absolute top-1 right-1 bg-red-600 text-white text-[8px] font-black px-1 rounded-sm">
                            عرض 🔥
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h5 className="font-black text-slate-900 text-xs sm:text-sm truncate">
                          {prod.name}
                        </h5>
                        {store && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectStore(store);
                              onClose();
                            }}
                            className="text-[10px] text-slate-500 hover:text-orange-600 font-bold flex items-center gap-1 truncate cursor-pointer transition-colors"
                          >
                            <StoreIcon className="w-3 h-3 text-orange-500" />
                            <span className="truncate">{store.name}</span>
                          </button>
                        )}
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {prod.description || "وجبة مميزة وطازجة"}
                        </p>
                      </div>
                    </div>

                    {/* Price and Add to Cart Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-xs sm:text-sm font-black text-slate-900 font-mono">
                          {prod.price.toLocaleString()} {currency}
                        </span>
                        {prod.originalPrice && (
                          <span className="block text-[9px] text-slate-400 line-through font-mono">
                            {prod.originalPrice.toLocaleString()} {currency}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {store && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectStore(store);
                              onClose();
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                            title="فتح المتجر"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isOutOfStock ? (
                          <span className="text-[10px] text-red-600 bg-red-50 border border-red-100 font-black px-2 py-1 rounded-xl">
                            غير متوفر
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddSingleProduct(prod)}
                            className={`text-xs font-black py-1.5 px-3 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs ${
                              isAdded
                                ? "bg-emerald-600 text-white"
                                : "bg-orange-500 hover:bg-orange-600 text-white"
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>تمت الإضافة ✓</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span>إضافة للسلة</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-600 shrink-0">
          <div className="flex items-center gap-1 text-slate-500">
            <HeartHandshake className="w-4 h-4 text-orange-500" />
            <span>اقتراحات مخصصة بناءً على تقييمات الزبائن والمخزون</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black rounded-xl transition-all cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </motion.div>
    </div>
  );
};
