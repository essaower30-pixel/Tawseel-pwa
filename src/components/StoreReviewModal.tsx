import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Star, 
  Sparkles, 
  CheckCircle2, 
  MessageSquare, 
  X, 
  Wrench,
  Store as StoreIcon, 
  Car,
  Stethoscope
} from "lucide-react";
import { StoreReview } from "../types";

interface StoreReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
  storeId: string;
  storeName: string;
  storeCategory?: string;
  isService?: boolean;
  customerName?: string;
  customerPhone?: string;
  existingReview?: StoreReview;
  onSubmitReview?: (review: Omit<StoreReview, "id" | "createdAt">) => void;
  onSubmit?: (review: any) => void;
}

const RATING_DESCRIPTIONS: Record<number, { text: string; emoji: string; color: string; bg: string }> = {
  0: { text: "بدون تقييم محدد (اختياري)", emoji: "⚪", color: "text-slate-600", bg: "bg-slate-100 border-slate-200" },
  1: { text: "سيء جداً وغير راضٍ", emoji: "😞", color: "text-red-600", bg: "bg-red-50 border-red-200" },
  2: { text: "مقبول ودون التوقعات", emoji: "😐", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  3: { text: "جيد ومناسب", emoji: "🙂", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
  4: { text: "ممتاز وخدمة رائعة", emoji: "😃", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  5: { text: "استثنائي ومثالي جداً!", emoji: "🌟", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
};

const CRAFT_SERVICE_TAGS = [
  "شغل نظيف ومتقن 🛠️",
  "دقة في المواعيد ⏱️",
  "أمانة وأخلاق عالية 🤝",
  "أسعار مناسبة ومعقولة 💰",
  "خبرة واحترافية عالية 💎",
  "سرعة في الإنجاز ⚡",
  "أدوات ومعدات حديثة 🧰",
  "ضمان وجودة العمل ✓"
];

const STORE_PRODUCT_TAGS = [
  "توصيل سريع ⚡",
  "طعام ساخن ولذيذ 🍲",
  "تغليف محكم ونظيف 📦",
  "خدمة ممتازة وتعامل راقي 🤝",
  "جودة عالية ونظافة 💎",
  "أسعار ممتازة وتوفير 🏷️",
  "مطابق للطلب تماماً ✓",
  "منتجات طازجة 🥬"
];

export const StoreReviewModal: React.FC<StoreReviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  storeId,
  storeName,
  storeCategory,
  isService = false,
  customerName = "زبون معتمد",
  customerPhone,
  existingReview,
  onSubmitReview,
  onSubmit
}) => {
  const isCraftsmanOrService = isService || storeCategory === "crafts" || storeCategory === "drivers" || storeCategory === "doctors";
  const popularTags = isCraftsmanOrService ? CRAFT_SERVICE_TAGS : STORE_PRODUCT_TAGS;

  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>(existingReview?.comment || "");
  const [name, setName] = useState<string>(existingReview?.customerName || customerName || "زبون المنصة");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    existingReview?.tags || (isCraftsmanOrService ? ["شغل نظيف ومتقن 🛠️", "أمانة وأخلاق عالية 🤝"] : ["توصيل سريع ⚡", "جودة عالية ونظافة 💎"])
  );
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Sync customer name if changed
  useEffect(() => {
    if (customerName && !existingReview?.customerName) {
      setName(customerName);
    }
  }, [customerName, existingReview]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeRating = hoverRating !== null ? hoverRating : (rating !== undefined && rating !== null ? rating : 0);
  const ratingInfo = RATING_DESCRIPTIONS[activeRating] || RATING_DESCRIPTIONS[0];

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) => 
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Rating is optional and handles 0: if 0 or empty, accepted as 0
      const rawR = Number(rating);
      const finalRating = (rating === 0 || isNaN(rawR)) ? 0 : Math.max(0, Math.min(5, Math.round(rawR)));
      const payload: Omit<StoreReview, "id" | "createdAt"> = {
        storeId: storeId || "unknown_store",
        storeName: storeName || "صاحب المهنة",
        orderId: orderId || `direct_review_${Date.now()}`,
        customerName: name.trim() || customerName || "زبون معتمد",
        customerPhone: customerPhone || "",
        rating: finalRating,
        comment: comment.trim(),
        tags: selectedTags
      };

      if (onSubmitReview) {
        onSubmitReview(payload);
      } else if (onSubmit) {
        onSubmit(payload);
      }

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 1300);
    } catch (err) {
      console.error("Error in StoreReviewModal handleSubmit:", err);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" 
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-right overflow-hidden my-6"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 left-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer z-10 active:scale-95"
          title="إغلاق النافذة"
        >
          <X className="w-4 h-4" />
        </button>

        {isSubmitted ? (
          <div className="py-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-black text-slate-900">شكراً جزيلاً لتقييمك! 🌟</h3>
            <p className="text-sm text-slate-600 max-w-xs mx-auto">
              تم إرسال تقييمك بنجاح وحفظه لخدمة أهالي وزبائن القرية.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="space-y-1 pr-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-black">
                {isCraftsmanOrService ? (
                  <>
                    <Wrench className="w-3.5 h-3.5 text-amber-600" />
                    <span>تقييم صاحب المهنة والخدمة</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>تقييم تجربة الطلب والمشتريات</span>
                  </>
                )}
              </div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 pt-1 flex-wrap">
                <span>كيف كانت تجربتك مع</span>
                <span className="text-orange-600 underline decoration-orange-300 underline-offset-4">{storeName}</span>
                <span>؟</span>
              </h3>
              <p className="text-xs text-slate-500">
                {isCraftsmanOrService
                  ? "تقييمك يسهم في إبراز أصحاب الحرف والمهن المتميزة والأمينة في بلدتنا."
                  : "رأيك يهمنا ويسهم في تحسين جودة الخدمة وتكريم المتاجر المتميزة."}
              </p>
            </div>

            {/* Star Rating Interactive Selector */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 text-center space-y-3">
              <div className="flex items-center justify-between text-xs font-black text-slate-700">
                <span>اختر التقييم بالنجوم (اختياري):</span>
                <button
                  type="button"
                  onClick={() => setRating(0)}
                  className={`text-[11px] px-2.5 py-1 rounded-xl border font-bold transition-all cursor-pointer ${
                    rating === 0
                      ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  بدون تقييم / تخطي (0)
                </button>
              </div>
              
              <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= activeRating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating((prev) => (prev === star ? 0 : star))}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 sm:p-2 rounded-2xl hover:bg-white hover:scale-115 transition-all cursor-pointer active:scale-95 focus:outline-hidden"
                      title={`${star} نجوم (انقر مجدداً لجعله 0)`}
                    >
                      <Star 
                        className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors ${
                          isFilled 
                            ? "text-amber-400 fill-amber-400 drop-shadow-xs" 
                            : "text-slate-300 stroke-[1.5]"
                        }`} 
                      />
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Emotional Feedback Badge */}
              <motion.div 
                key={activeRating}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-black ${ratingInfo.bg} ${ratingInfo.color}`}
              >
                <span className="text-base">{ratingInfo.emoji}</span>
                <span>{ratingInfo.text} {activeRating > 0 ? `(${activeRating} من 5 نجوم)` : "(0)"}</span>
              </motion.div>
            </div>

            {/* Quick Tag Chips */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                {isCraftsmanOrService ? "ما الذي ميز عمل صاحب المهنة؟ (اختر ما ينطبق):" : "ما الذي أعجبك في المتجر أو الطلب؟ (اختر ما ينطبق):"}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {popularTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                        isSelected 
                          ? "bg-orange-500 text-white border-orange-500 shadow-xs" 
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text Comment */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                  <span>تعليقك ورأيك التفصيلي (اختياري):</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">{comment.length}/300</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 300))}
                placeholder={isCraftsmanOrService ? "اكتب ملاحظاتك حول إتقان العمل، المواعيد، الأمانة، أو كلمة شكر لصاحب المهنة..." : "اكتب ملاحظاتك حول الطعم، الجودة، سرعة التوصيل، التغليف، أو أي كلمة شكر لصاحب المتجر..."}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-hidden transition-all resize-none"
              />
            </div>

            {/* Customer Display Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                اسم كاتب التقييم (سيظهر مع المراجعة):
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسمك أو لقبك (مثال: أبو أحمد، زبون مميز)"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="flex-1 py-3 px-5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <Star className="w-4 h-4 text-amber-200 fill-amber-200" />
                <span>إرسال التقييم ⭐</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer active:scale-95"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
