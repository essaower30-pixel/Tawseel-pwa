import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ShoppingBag,
  Store as StoreIcon,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Send,
  MessageSquare,
  MessageCircle,
  Phone,
  Sparkles,
  DollarSign,
  MapPin,
  Search,
  ZoomIn,
  AlertCircle,
  Pill,
  FileText,
  Plus
} from "lucide-react";
import { Store, UserProfile } from "../types";
import { openWhatsApp } from "../utils/whatsapp";
import { matchesArabicSearch } from "../utils/arabicSearch";

interface CustomStoreOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: Store[];
  defaultStoreId?: string;
  userProfile: UserProfile | null;
  landmarks: string[];
  currentLandmark: string;
  currency?: string;
  isEmergencyRush?: boolean;
  onSubmit: (data: {
    storeId: string;
    storeName: string;
    customerName: string;
    customerPhone: string;
    addressLandmark: string;
    addressDetails?: string;
    customOrderText: string;
    customOrderImage?: string;
    estimatedBudget?: number;
    notes?: string;
    isCustomStoreOrder: boolean;
    deliveryFee: number;
  }) => void;
}

export const CustomStoreOrderModal: React.FC<CustomStoreOrderModalProps> = ({
  isOpen,
  onClose,
  stores,
  defaultStoreId,
  userProfile,
  landmarks,
  currentLandmark,
  currency = "ل.س",
  isEmergencyRush,
  onSubmit
}) => {
  // Available stores (excluding closed or hidden if desired, but displaying open status)
  const [selectedStoreId, setSelectedStoreId] = useState<string>(defaultStoreId || stores[0]?.id || "");
  const [storeSearchQuery, setStoreSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [customerName, setCustomerName] = useState(userProfile?.name || "");
  const [customerPhone, setCustomerPhone] = useState(userProfile?.phone || "");
  const [landmark, setLandmark] = useState(currentLandmark || landmarks[0] || "وسط البلد");
  const [addressDetails, setAddressDetails] = useState("");
  const [customOrderText, setCustomOrderText] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState<string>("");
  const [notes, setNotes] = useState("");
  
  const [customOrderImage, setCustomOrderImage] = useState<string>("");
  const [fileSizeKb, setFileSizeKb] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync default store when modal opens
  useEffect(() => {
    if (defaultStoreId) {
      setSelectedStoreId(defaultStoreId);
    } else if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [defaultStoreId, stores, isOpen]);

  // Sync user profile when available
  useEffect(() => {
    if (userProfile?.name && !customerName) {
      setCustomerName(userProfile.name);
    }
    if (userProfile?.phone && !customerPhone) {
      setCustomerPhone(userProfile.phone);
    }
  }, [userProfile]);

  // Sync landmark with active landmark / dynamic landmarks list
  useEffect(() => {
    if (currentLandmark && landmarks.includes(currentLandmark)) {
      setLandmark(currentLandmark);
    } else if (landmarks && landmarks.length > 0) {
      setLandmark(landmarks[0]);
    }
  }, [currentLandmark, landmarks, isOpen]);

  const selectedStore = stores.find((s) => s.id === selectedStoreId) || stores[0];

  const isPharmacy = Boolean(
    selectedStore?.category === "pharmacies" ||
    selectedStore?.name?.includes("صيدل") ||
    selectedStore?.id?.includes("pharmacy") ||
    selectedStore?.id === "store_shifa"
  );

  const isRestaurant = Boolean(
    selectedStore?.category === "restaurants" ||
    selectedStore?.category === "food" ||
    selectedStore?.name?.includes("مطعم") ||
    selectedStore?.name?.includes("شاورما") ||
    selectedStore?.name?.includes("سناك") ||
    selectedStore?.name?.includes("برغر") ||
    selectedStore?.name?.includes("مشاوي")
  );

  const isSweetsOrBakery = Boolean(
    selectedStore?.category === "sweets" ||
    selectedStore?.name?.includes("حلويات") ||
    selectedStore?.name?.includes("مخبز") ||
    selectedStore?.name?.includes("معجنات") ||
    selectedStore?.name?.includes("باتيسري")
  );

  const isVegetables = Boolean(
    selectedStore?.category === "vegetables" ||
    selectedStore?.name?.includes("خضار") ||
    selectedStore?.name?.includes("فواكه")
  );

  // Dynamic placeholder tailored to store type (especially pharmacy)
  const getPlaceholderText = () => {
    if (isPharmacy) {
      return `مثال لطلب أدوية ومستلزمات من الصيدلية:
1. بنادول إكسترا (أو باراسيتامول 500 ملغ) - علبة واحدة
2. شراب بروسبان أو كافوسيد للسعال للأطفال
3. حليب أطفال نان أو بيبلاك رقم 1 (أو حفاضات مقاس 3)
4. فيتامين سي فوار 1000 ملغ ومكمل زنك
5. شاش معقم، قطن طبي، كحول طبي ولاصق جروح
(أو يمكنك تصوير الوصفة الطبية / الروشتة أو كرتونة الدواء أدناه وسيقوم الصيدلي بصرفها بدقة)`;
    }
    if (isRestaurant) {
      return `مثال لطلب وجبات من المطعم:
1. 2 وجبة شاورما عربي دجاج إكسترا ثوم ومخلل
2. 1 ساندويش برغر لحم دبل جبنة
3. وجبة بطاطا مقلية عائلية ومقبلات
4. 2 عبوة كولا باردة...`;
    }
    if (isSweetsOrBakery) {
      return `مثال لطلب حلويات ومخبوزات:
1. نصف كيلو بقلاوة مشكلة بالفستق
2. قالب كيك شوكولا صغير (4-6 أشخاص)
3. 2 ربطة كعك بسمسم طازج أو معجنات جبنة...`;
    }
    if (isVegetables) {
      return `مثال لطلب خضار وفواكه طازجة:
1. 2 كيلو بندورة بلدي حمراء
2. 1 كيلو خيار بلدي
3. 2 كيلو بطاطا للطبخ
4. باقة نعناع وبقدونس طازجة...`;
    }
    return `مثال لمقاضي ومواد تموينية:
1. 2 علبة حليب مبستر 1 لتر
2. كيس سكر 2 كغ وعلبة شاي أحمر
3. كيس رز تايلندي طويل الحبة 2 كغ
4. علبة زيت دوار الشمس 1 لتر...`;
  };

  // Quick suggestions based on store category
  const pharmacyQuickSuggestions = [
    { label: "💊 بنادول / مسكن ألم", text: "• بنادول إكسترا (أو باراسيتامول 500 ملغ) - علبة واحدة" },
    { label: "🩺 شراب سعال وخافض حرارة", text: "• شراب خافض حرارة وسعال للأطفال" },
    { label: "👶 حليب أطفال رقم 1", text: "• حليب أطفال رقم 1" },
    { label: "🍼 حفاضات مقاس وسط", text: "• كيس حفاضات أطفال مقاس وسط" },
    { label: "🍊 فيتامين سي فوار", text: "• فيتامين سي فوار 1000 ملغ" },
    { label: "🩹 شاش ومعقم ولاصق", text: "• شاش معقم، قطن طبي، معقم كحول ولاصق جروح" },
    { label: "📋 صرف روشتة مرفقة", text: "• يرجى صرف الأدوية المذكورة في صورة الروشتة المرفقة بدقة" }
  ];

  const groceryQuickSuggestions = [
    { label: "🍞 ربطة خبز طازج", text: "• ربطة خبز طازج" },
    { label: "🥛 حليب ولبن رائب", text: "• علبة حليب ولبن رائب" },
    { label: "🌻 زيت نباتي 1 لتر", text: "• علبة زيت نباتي 1 لتر" },
    { label: "☕ سكر وشاي أحمر", text: "• كيلو سكر وعلبة شاي أحمر" }
  ];

  const restaurantQuickSuggestions = [
    { label: "🌯 شاورما عربي", text: "• وجبة شاورما عربي دجاج إكسترا ثوم" },
    { label: "🍔 برغر مع بطاطا", text: "• ساندويش برغر لحم مع بطاطا مقلية" },
    { label: "🥤 عبوة كولا باردة", text: "• عبوة كولا باردة" }
  ];

  const handleAddSuggestion = (suggestionText: string) => {
    setCustomOrderText((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return suggestionText;
      }
      return `${trimmed}\n${suggestionText}`;
    });
  };

  // Filtered stores for picker
  const filteredStores = stores.filter((s) => {
    const storeFullText = `${s.name} ${s.description || ""} ${s.neighborhood || ""} متجر محل`;
    const matchesSearch = matchesArabicSearch(storeFullText, storeSearchQuery);
    const matchesCategory = categoryFilter === "all" || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: "all", label: "جميع المتاجر" },
    { id: "restaurants", label: "مطاعم ووجبات" },
    { id: "supermarket", label: "بقاليات وماركت" },
    { id: "vegetables", label: "خضار وفواكه" },
    { id: "pharmacies", label: "صيدليات" },
    { id: "sweets", label: "حلويات ومخابز" },
    { id: "cafes", label: "كافيهات وعصائر" }
  ];

  const processImageFile = (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP).");
      return;
    }

    setIsCompressing(true);
    const reader = new FileReader();

    reader.onerror = () => {
      setIsCompressing(false);
      alert("حدث خطأ أثناء قراءة الصورة، يرجى المحاولة ثانية.");
    };

    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();

      img.onerror = () => {
        setIsCompressing(false);
        alert("تعذر قراءة ملف الصورة.");
      };

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            setCustomOrderImage(src);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          const kb = Math.round((compressed.length * 3) / 4 / 1024);

          setFileSizeKb(kb);
          setCustomOrderImage(compressed);
        } catch (err) {
          console.warn("Custom order image fallback:", err);
          setCustomOrderImage(src);
        } finally {
          setIsCompressing(false);
        }
      };

      img.src = src;
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleRemoveImage = () => {
    setCustomOrderImage("");
    setFileSizeKb(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEmergencyRush) {
      alert("عذراً، استقبال الطلبات مجمّد حالياً في التطبيق بسبب ضغط العمل العالي. يرجى المحاولة لاحقاً بعد انتهاء الضغط واستئناف الخدمة.");
      return;
    }

    if (!selectedStore) {
      alert("يرجى اختيار المتجر المطلوب أولاً.");
      return;
    }

    if (!customerName.trim()) {
      alert("يرجى إدخال اسم المستلم / الزبون.");
      return;
    }

    if (!customerPhone.trim()) {
      alert("يرجى إدخال رقم هاتف صالح للتواصل والتنسيق.");
      return;
    }

    if (!customOrderText.trim() && !customOrderImage) {
      alert(
        isPharmacy
          ? "يرجى كتابة أسماء الأدوية المطلوبة أو إرفاق صورة الروشتة الطبية / علبة الدواء (تصوير أو استديو)."
          : "يرجى كتابة قائمة المنتجات المطلوبة أو إرفاق صورة للأغراض (تصوير أو استديو)."
      );
      return;
    }

    const budgetVal = estimatedBudget ? parseFloat(estimatedBudget) : undefined;
    const storeDeliveryFee = selectedStore && selectedStore.deliveryFee !== undefined && selectedStore.deliveryFee !== null
      ? Number(selectedStore.deliveryFee)
      : 0;

    onSubmit({
      storeId: selectedStore.id,
      storeName: selectedStore.name,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      addressLandmark: landmark,
      addressDetails: addressDetails.trim() || undefined,
      customOrderText: customOrderText.trim(),
      customOrderImage: customOrderImage || undefined,
      estimatedBudget: budgetVal && !isNaN(budgetVal) ? budgetVal : undefined,
      notes: notes.trim() || undefined,
      isCustomStoreOrder: true,
      deliveryFee: storeDeliveryFee
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
      {/* Hidden File Inputs for Camera & Gallery */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 text-right my-auto max-h-[94vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl ${isPharmacy ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-600"} flex items-center justify-center font-black text-xl shadow-xs transition-colors`}>
              {isPharmacy ? "💊" : "🛍️"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base sm:text-lg">
                  {isPharmacy ? "طلب خاص من الصيدلية / أدوية وروشتات" : "طلب خاص / منتجات غير معروضة في القائمة"}
                </h3>
                {isPharmacy && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                    صيدلية معتمدة 🩺
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs font-semibold">
                {isPharmacy
                  ? "اكتب أسماء الأدوية والمستلزمات أو صوّر الروشتة وسيقوم الصيدلي بصرفها بدقة وتجهيزها لك"
                  : "اكتب ما تحتاجه أو أرفق صورة وسيقوم المتجر بتجهيزها وإرسالها لك"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold cursor-pointer transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
          {/* Emergency Rush Freeze Notice Banner */}
          {isEmergencyRush && (
            <div
              className="bg-red-600 text-white p-3.5 sm:p-4 rounded-2xl shadow-md flex items-center justify-between gap-3 border border-red-500 text-right animate-pulse"
              dir="rtl"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl shrink-0">🚨</span>
                <div>
                  <h4 className="font-black text-xs sm:text-sm">
                    تنبيه: تم تجميد استقبال الطلبات مؤقتاً
                  </h4>
                  <p className="text-[11px] text-red-100 mt-0.5 leading-tight">
                    إرسال الطلبات المخصصة معطّل حالياً للسيطرة على ضغط العمل وسنعاود الخدمة قريباً.
                  </p>
                </div>
              </div>
              <span className="bg-white/20 text-white text-[10px] font-black px-2 py-1 rounded-lg shrink-0 whitespace-nowrap">
                وضع الضغط
              </span>
            </div>
          )}

          {/* STORE SELECTOR & PREVIEW */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <StoreIcon className="w-4 h-4 text-orange-600" />
                <span>اختر المتجر المطلوب الشراء منه: *</span>
              </label>
              {selectedStore && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${selectedStore.deliveryFee === 0 ? "bg-emerald-100 text-emerald-800" : "text-orange-700 bg-orange-100"}`}>
                  أجرة التوصيل: {selectedStore.deliveryFee === 0 || selectedStore.deliveryFee === undefined ? "مجاني (0)" : `${selectedStore.deliveryFee.toLocaleString()} ${currency}`}
                </span>
              )}
            </div>

            {/* Store Select Dropdown */}
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 outline-none focus:border-orange-500 transition-all text-xs"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.neighborhood || "المركز"}) - {s.status === "closed" ? "مغلق حالياً" : "متاح للطلب ✅"}
                </option>
              ))}
            </select>

            {/* Store Quick Info Pill */}
            {selectedStore && (
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-600 bg-white/70 p-2 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-800">{selectedStore.name}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">{selectedStore.neighborhood || "المنطقة الرئيسية"}</span>
                </div>
                {selectedStore.status === "closed" && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                    مغلق مؤقتاً (سيتم تحضيره عند الفتح)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* CUSTOM ORDER ITEMS TEXTAREA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-0.5">
              <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
                {isPharmacy ? (
                  <Pill className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                )}
                <span>
                  {isPharmacy
                    ? "قائمة الأدوية والمستلزمات الطبية المطلوبة: *"
                    : "قائمة الأغراض والمنتجات المطلوبة: *"}
                </span>
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">
                {isPharmacy ? "اكتب اسم الدواء والعيار أو اختر من الأمثلة" : "اكتب كل صنف بالكمية"}
              </span>
            </div>

            {/* Quick Suggestion Pills */}
            <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-2 space-y-1.5">
              <span className="text-[10px] font-black text-slate-500 block">
                {isPharmacy ? "أمثلة صيدلانية شائعة (انقر للإضافة السريعة ⚡):" : "أمثلة شائعة (انقر للإضافة ⚡):"}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(isPharmacy
                  ? pharmacyQuickSuggestions
                  : isRestaurant
                  ? restaurantQuickSuggestions
                  : groceryQuickSuggestions
                ).map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddSuggestion(chip.text)}
                    className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer active:scale-95 flex items-center gap-1 shadow-2xs ${
                      isPharmacy
                        ? "bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                        : "bg-white text-orange-800 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                    }`}
                  >
                    <Plus className="w-2.5 h-2.5 shrink-0" />
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={4}
              required={!customOrderImage}
              value={customOrderText}
              onChange={(e) => setCustomOrderText(e.target.value)}
              placeholder={getPlaceholderText()}
              className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-slate-800 outline-none leading-relaxed text-xs placeholder:text-slate-400 transition-all ${
                isPharmacy ? "focus:border-emerald-500" : "focus:border-orange-500"
              }`}
            />
          </div>

          {/* IMAGE UPLOADER CARD (Camera + Studio / Gallery) */}
          <div className={`${isPharmacy ? "bg-emerald-50/50 border-emerald-200" : "bg-orange-50/50 border-orange-200"} border-2 border-dashed rounded-2xl p-3.5 space-y-2.5 transition-colors`}>
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
                {isPharmacy ? (
                  <FileText className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Camera className="w-4 h-4 text-orange-600" />
                )}
                <span>
                  {isPharmacy
                    ? "إرفاق صورة الوصفة الطبية (الروشتة) 📑 أو علبة الدواء 💊"
                    : "إرفاق صورة للطلب (ورقة مكتوبة أو صورة منتج)"}
                </span>
              </label>
              {fileSizeKb !== null && customOrderImage && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>
                    {isPharmacy ? `تم التقاط صورة الروشتة: ${fileSizeKb} KB` : `تم التقاط الصورة: ${fileSizeKb} KB`}
                  </span>
                </span>
              )}
            </div>

            {customOrderImage ? (
              /* Image Preview Box */
              <div className={`relative group rounded-xl overflow-hidden bg-slate-900 border ${isPharmacy ? "border-emerald-300" : "border-orange-300"} shadow-sm`}>
                <img
                  src={customOrderImage}
                  alt={isPharmacy ? "معاينة صورة الروشتة الطبية" : "معاينة صورة الطلب الخاص"}
                  className="w-full h-36 sm:h-44 object-contain bg-slate-950/80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-2.5">
                  <button
                    type="button"
                    onClick={() => setZoomedImage(customOrderImage)}
                    className="text-white text-[11px] font-bold flex items-center gap-1 bg-black/50 hover:bg-black/70 px-2 py-1 rounded-lg backdrop-blur-xs cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>{isPharmacy ? "تكبير وقراءة الروشتة" : "تكبير الصورة"}</span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg font-bold text-[10px] shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Camera className={`w-3 h-3 ${isPharmacy ? "text-emerald-600" : "text-orange-600"}`} />
                      <span>إعادة تصوير</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[10px] shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Camera & Studio Buttons */
              <div className="space-y-2">
                <p className="text-slate-600 text-[11px] font-medium leading-relaxed">
                  {isPharmacy
                    ? "يمكنك تصوير الوصفة الطبية (الروشتة) المكتوبة بخط الطبيب بالكاميرا فوراً، أو تصوير علبة الدواء المطلوبة، وسيقوم الصيدلاني بقراءتها وتأمينها فوراً."
                    : "يمكنك تصوير ورقة مكتوب فيها طلباتك باليد، أو تصوير منتج معين تريده ليحضره لك المتجر بدقة."}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isCompressing}
                    className={`py-2.5 px-3 rounded-xl ${
                      isPharmacy
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-orange-600 hover:bg-orange-700 text-white"
                    } font-black text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50`}
                  >
                    <Camera className="w-4 h-4 shrink-0" />
                    <span>
                      {isCompressing
                        ? "جاري المعالجة..."
                        : isPharmacy
                        ? "تصوير الروشتة بالكاميرا 📸"
                        : "التقاط بالكاميرا 📸"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isCompressing}
                    className={`py-2.5 px-3 rounded-xl bg-white ${
                      isPharmacy
                        ? "hover:bg-emerald-50 border-emerald-300 text-emerald-900"
                        : "hover:bg-orange-50 border-orange-200 text-orange-900"
                    } border font-black text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50`}
                  >
                    <ImageIcon className={`w-4 h-4 ${isPharmacy ? "text-emerald-600" : "text-orange-600"} shrink-0`} />
                    <span>{isCompressing ? "جاري المعالجة..." : "استيراد من الاستديو 🖼️"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ESTIMATED BUDGET & NOTES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-extrabold text-slate-700 block mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>الميزانية التقريبية / سقف التكلفة (اختياري):</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={estimatedBudget}
                  onChange={(e) => setEstimatedBudget(e.target.value)}
                  placeholder="مثال: 50000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold outline-none focus:border-orange-500 text-left font-mono"
                  dir="ltr"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold pointer-events-none">
                  {currency}
                </span>
              </div>
            </div>

            <div>
              <label className="font-extrabold text-slate-700 block mb-1">
                {isPharmacy ? "ملاحظات إضافية للصيدلي والكابتن (اختياري):" : "ملاحظات إضافية للمتجر والكابتن (اختياري):"}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  isPharmacy
                    ? "مثال: تأمين بديل مناسب من شركة موثوقة في حال عدم توفر نفس الشركة..."
                    : "مثال: الاتصال قبل الشراء للتأكيد على الأسعار..."
                }
                className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold outline-none ${
                  isPharmacy ? "focus:border-emerald-500" : "focus:border-orange-500"
                }`}
              />
            </div>
          </div>

          {/* CUSTOMER DETAILS: NAME & PHONE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-extrabold text-slate-700 block mb-1">اسم الزبون / المستلم: *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="الاسم الكامل"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="font-extrabold text-slate-700 block mb-1">رقم الهاتف للتنسيق: *</label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="09xxxxxxxx"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold outline-none focus:border-orange-500 text-left font-mono"
                dir="ltr"
              />
            </div>
          </div>

          {/* ADDRESS & LANDMARK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-extrabold text-slate-700 block mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>الحي / المعلم القريب: *</span>
              </label>
              <select
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold outline-none focus:border-orange-500"
              >
                {landmarks.map((lm, idx) => (
                  <option key={idx} value={lm}>
                    {lm}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-extrabold text-slate-700 block mb-1">تفاصيل المنزل / الشارع:</label>
              <input
                type="text"
                value={addressDetails}
                onChange={(e) => setAddressDetails(e.target.value)}
                placeholder="مثال: الطابق الثاني، مقابل الصيدلية..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* DIRECT WHATSAPP OPTION WITH STORE */}
          {selectedStore?.contactPhone && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-[11px] font-black text-emerald-950 block">
                  أو يمكنك مراسلة ({selectedStore.name}) مباشرة عبر الواتساب:
                </span>
                <span className="text-[10px] text-emerald-700 block">
                  لإرسال تسجيل صوتي أو استفسار عاجل عبر واتساب العادي أو الأعمال
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    openWhatsApp({
                      phone: selectedStore.contactPhone || selectedStore.ownerPhone || "0944111222",
                      message: isPharmacy
                        ? `السلام عليكم دكتور، أنا ${customerName || "الزبون"}، أود إرسال طلب أدوية/روشتة طبية لصيدلية (${selectedStore.name}):\n${customOrderText || "(مرفق صورة الروشتة/الدواء)"}`
                        : `السلام عليكم، أنا ${customerName || "الزبون"}، أود إرسال طلب خاص لمتجر (${selectedStore.name}):\n${customOrderText}`,
                      type: "regular"
                    })
                  }
                  className="py-1.5 px-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-xl text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3 text-emerald-700" />
                  <span>واتساب</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openWhatsApp({
                      phone: selectedStore.contactPhone || selectedStore.ownerPhone || "0944111222",
                      message: isPharmacy
                        ? `السلام عليكم دكتور، أنا ${customerName || "الزبون"}، أود إرسال طلب أدوية/روشتة طبية لصيدلية (${selectedStore.name}):\n${customOrderText || "(مرفق صورة الروشتة/الدواء)"}`
                        : `السلام عليكم، أنا ${customerName || "الزبون"}، أود إرسال طلب خاص لمتجر (${selectedStore.name}):\n${customOrderText}`,
                      type: "business"
                    })
                  }
                  className="py-1.5 px-2 bg-[#075E54]/15 hover:bg-[#075E54]/25 text-[#075E54] font-bold rounded-xl text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <MessageCircle className="w-3 h-3 text-[#075E54]" />
                  <span>أعمال</span>
                </button>
              </div>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isCompressing || Boolean(isEmergencyRush)}
              className={`w-full font-black text-sm py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                isEmergencyRush
                  ? "bg-red-600/90 text-white cursor-not-allowed shadow-red-500/20 border border-red-700"
                  : isPharmacy
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 cursor-pointer active:scale-98 disabled:opacity-50"
                  : "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/25 cursor-pointer active:scale-98 disabled:opacity-50"
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {isEmergencyRush
                  ? "🚨 استقبال الطلبات مجمّد حالياً (وضع الضغط)"
                  : isPharmacy
                  ? "إرسال طلب الأدوية والروشتة للصيدلية فوراً 💊"
                  : "إرسال الطلب الخاص للمتجر فوراً 🛍️"}
              </span>
            </button>
          </div>
        </form>
      </motion.div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          dir="rtl"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full max-h-[90vh] bg-slate-950 rounded-3xl p-3 flex flex-col items-center justify-center shadow-2xl border border-slate-800 cursor-default"
          >
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold cursor-pointer transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full flex items-center justify-between px-3 py-2 text-white border-b border-slate-800 mb-2">
              <span className="font-black text-xs sm:text-sm flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-orange-400" />
                <span>معاينة صورة الطلب الخاص المكبرة</span>
              </span>
              <span className="text-[11px] text-slate-400">انقر خارج الإطار للإغلاق</span>
            </div>
            <div className="w-full overflow-auto flex items-center justify-center max-h-[75vh]">
              <img
                src={zoomedImage}
                alt="طلب خاص مكبر"
                className="max-w-full max-h-[75vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
