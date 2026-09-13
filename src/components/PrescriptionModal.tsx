import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Pill, Stethoscope, Camera, Image as ImageIcon, CheckCircle2, AlertCircle, RefreshCw, Trash2, MapPin, Sparkles, Send, Phone, MessageSquare } from "lucide-react";
import { Store, UserProfile } from "../types";
import { openWhatsApp } from "../utils/whatsapp";

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: Store[];
  defaultStoreId?: string;
  defaultStoreCategory?: "pharmacies" | "doctors" | string;
  userProfile: UserProfile | null;
  landmarks: string[];
  currentLandmark: string;
  onSubmit: (data: {
    storeId: string;
    storeName: string;
    customerName: string;
    customerPhone: string;
    addressLandmark: string;
    addressDetails?: string;
    prescriptionImage?: string;
    prescriptionNotes?: string;
    isPharmacyOrder?: boolean;
    isDoctorOrder?: boolean;
  }) => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  stores,
  defaultStoreId,
  defaultStoreCategory,
  userProfile,
  landmarks,
  currentLandmark,
  onSubmit
}) => {
  // Filter pharmacies and doctors
  const medicalStores = stores.filter(
    (s) =>
      s.category === "pharmacies" ||
      s.category === "doctors" ||
      s.id === "store_shifa" ||
      s.name.includes("صيدل") ||
      s.name.includes("طبيب") ||
      s.name.includes("دكتور") ||
      s.name.includes("عيادة")
  );

  const initialStore =
    medicalStores.find((s) => s.id === defaultStoreId) ||
    medicalStores[0] ||
    stores.find((s) => s.category === "pharmacies") ||
    stores[0];

  const [selectedStoreId, setSelectedStoreId] = useState<string>(initialStore?.id || "");
  const [customerName, setCustomerName] = useState(userProfile?.name || "");
  const [customerPhone, setCustomerPhone] = useState(userProfile?.phone || "");
  const [landmark, setLandmark] = useState(currentLandmark || landmarks[0] || "وسط البلد");
  const [addressDetails, setAddressDetails] = useState("");
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [prescriptionImage, setPrescriptionImage] = useState<string>("");
  const [fileSizeKb, setFileSizeKb] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [activeTab, setActiveTab] = useState<"pharmacy" | "doctor">(
    defaultStoreCategory === "doctors" ? "doctor" : "pharmacy"
  );

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

  // Filter stores according to active tab
  const filteredStores = medicalStores.filter((s) => {
    if (activeTab === "pharmacy") {
      return s.category === "pharmacies" || s.name.includes("صيدل") || s.id === "store_shifa";
    } else {
      return (
        s.category === "doctors" ||
        s.name.includes("طبيب") ||
        s.name.includes("دكتور") ||
        s.name.includes("عيادة")
      );
    }
  });

  const activeStore =
    medicalStores.find((s) => s.id === selectedStoreId) ||
    filteredStores[0] ||
    initialStore;

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
          // Use high max dimension for prescriptions so small doctor handwriting is crystal clear
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
            setPrescriptionImage(src);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          // Clear JPEG quality for medical texts
          const compressed = canvas.toDataURL("image/jpeg", 0.86);
          const kb = Math.round((compressed.length * 3) / 4 / 1024);

          setFileSizeKb(kb);
          setPrescriptionImage(compressed);
        } catch (err) {
          console.warn("Prescription compression fallback:", err);
          setPrescriptionImage(src);
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
    setPrescriptionImage("");
    setFileSizeKb(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert("يرجى إدخال اسم المريض / صاحب الطلب.");
      return;
    }

    if (!customerPhone.trim()) {
      alert("يرجى إدخال رقم هاتف صالح للتواصل.");
      return;
    }

    if (!prescriptionImage && !prescriptionNotes.trim()) {
      alert("يرجى إرفاق صورة الراشيتة الطبية (بالكاميرا أو الاستديو) أو كتابة أسماء الأدوية المطلوبة.");
      return;
    }

    const currentTargetStore = activeStore || {
      id: "store_shifa",
      name: activeTab === "pharmacy" ? "صيدلية الشفاء المركزية" : "العيادة الطبية"
    };

    onSubmit({
      storeId: currentTargetStore.id,
      storeName: currentTargetStore.name,
      customerName,
      customerPhone,
      addressLandmark: landmark,
      addressDetails,
      prescriptionImage: prescriptionImage || undefined,
      prescriptionNotes: prescriptionNotes.trim() || undefined,
      isPharmacyOrder: activeTab === "pharmacy",
      isDoctorOrder: activeTab === "doctor"
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
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
        className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl space-y-4 text-right my-auto max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xl">
              💊
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg">
                طلب راشيتة أدوية واستشارة طبية
              </h3>
              <p className="text-slate-400 text-xs font-semibold">
                التقط صورة الراشيتة بالكاميرا أو اخترها من المعرض
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

        {/* Pharmacy vs Doctor Category Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab("pharmacy");
              const pStore = medicalStores.find((s) => s.category === "pharmacies" || s.name.includes("صيدل"));
              if (pStore) setSelectedStoreId(pStore.id);
            }}
            className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "pharmacy"
                ? "bg-white text-emerald-800 shadow-xs border border-emerald-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Pill className="w-4 h-4 text-emerald-600" />
            <span>صيدلية (صرف أدوية)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("doctor");
              const dStore = medicalStores.find(
                (s) => s.category === "doctors" || s.name.includes("طبيب") || s.name.includes("دكتور")
              );
              if (dStore) setSelectedStoreId(dStore.id);
            }}
            className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "doctor"
                ? "bg-white text-blue-800 shadow-xs border border-blue-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Stethoscope className="w-4 h-4 text-blue-600" />
            <span>طبيب / عيادة فحص</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
          {/* Target Store Selector */}
          <div>
            <label className="font-extrabold text-slate-700 block mb-1">
              {activeTab === "pharmacy" ? "اختر الصيدلية المطلوبة:" : "اختر الطبيب أو العيادة:"}
            </label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-emerald-500 transition-all text-xs"
            >
              {filteredStores.length > 0 ? (
                filteredStores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.neighborhood || "المركز"})
                  </option>
                ))
              ) : (
                <option value={initialStore?.id || "store_shifa"}>
                  {initialStore?.name || "صيدلية الشفاء المركزية"}
                </option>
              )}
            </select>
          </div>

          {/* PRESCRIPTION IMAGE UPLOADER CARD (Camera + Studio) */}
          <div className="bg-emerald-50/60 border-2 border-dashed border-emerald-300 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-black text-xs text-emerald-950 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>إرفاق صورة الراشيتة الطبية (استيراد أو تصوير)</span>
              </label>
              {fileSizeKb !== null && prescriptionImage && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>تم التقاط الصورة بدقة: {fileSizeKb} KB</span>
                </span>
              )}
            </div>

            {prescriptionImage ? (
              /* Image Preview Box */
              <div className="relative group rounded-2xl overflow-hidden bg-slate-900 border border-emerald-300 shadow-md">
                <img
                  src={prescriptionImage}
                  alt="معاينة الراشيتة الطبية"
                  className="w-full h-44 sm:h-52 object-contain bg-slate-950/80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3">
                  <div className="text-white text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>صورة الراشيتة جاهزة للإرسال</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-2 bg-white/90 hover:bg-white text-slate-800 rounded-xl font-bold text-[11px] shadow-md transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      title="إعادة التصوير بالكاميرا"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <span>إعادة تصوير</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-[11px] shadow-md transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      title="حذف الصورة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty State Prompt with Camera & Studio Buttons */
              <div className="space-y-3">
                <p className="text-emerald-800 text-[11px] font-semibold leading-relaxed">
                  التقط صورة واضحة لراشيتة الطبيب أو علبة الدواء بالكاميرا مباشرة، أو اخترها من استديو الصور في هاتفك ليقوم الصيدلاني / الطبيب بقراءتها وتجهيزها بدقة.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Direct Camera Capture */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isCompressing}
                    className="py-3 px-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4 text-emerald-200 shrink-0" />
                    <span>{isCompressing ? "جاري المعالجة..." : "التقاط فوري بالكاميرا 📸"}</span>
                  </button>

                  {/* Import from Studio / Gallery */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isCompressing}
                    className="py-3 px-3 rounded-2xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 font-black text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isCompressing ? "جاري المعالجة..." : "استيراد من الاستديو 🖼️"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Patient Details: Name + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-extrabold text-slate-700 block mb-1">اسم المريض / المستلم: *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="الاسم الثلاثي"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold outline-none focus:border-emerald-500"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold outline-none focus:border-emerald-500 text-left font-mono"
                dir="ltr"
              />
            </div>
          </div>

          {/* Address & Landmark */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-extrabold text-slate-700 block mb-1">الحي / المعلم القريب: *</label>
              <select
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold outline-none focus:border-emerald-500"
              >
                {landmarks.map((lm, idx) => (
                  <option key={idx} value={lm}>
                    {lm}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-extrabold text-slate-700 block mb-1">تفاصيل المنزل (اختياري):</label>
              <input
                type="text"
                value={addressDetails}
                onChange={(e) => setAddressDetails(e.target.value)}
                placeholder="مثال: الطابق الثاني، بجانب المسجد"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Prescription Notes / Additional Details */}
          <div>
            <label className="font-extrabold text-slate-700 block mb-1">
              تفاصيل الأدوية، الأعراض، أو بدائل (اختياري في حال إرفاق صورة):
            </label>
            <textarea
              rows={2}
              value={prescriptionNotes}
              onChange={(e) => setPrescriptionNotes(e.target.value)}
              placeholder="اكتب أسماء الأدوية المطلوبة، أو شرح الحالة والأعراض..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold outline-none focus:border-emerald-500"
            />
          </div>

          {/* WhatsApp Direct Option Note */}
          {activeStore?.contactPhone && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-[11px] font-black text-slate-800 block">
                  أو يمكنك مراسلة {activeStore.name} مباشرة عبر الواتساب:
                </span>
                <span className="text-[10px] text-slate-500 block">
                  لإرسال استشارة عاجلة أو تسجيل صوتي عبر واتساب العادي أو الأعمال
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    openWhatsApp({
                      phone: activeStore.contactPhone || "0944111222",
                      message: `السلام عليكم، أنا ${customerName || "الزبون"}، أود إرسال وصفة طبية / استشارة لـ (${activeStore.name}).`,
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
                      phone: activeStore.contactPhone || "0944111222",
                      message: `السلام عليكم، أنا ${customerName || "الزبون"}، أود إرسال وصفة طبية / استشارة لـ (${activeStore.name}).`,
                      type: "business"
                    })
                  }
                  className="py-1.5 px-2 bg-[#075E54]/15 hover:bg-[#075E54]/25 text-[#075E54] font-bold rounded-xl text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <span>أعمال</span>
                </button>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isCompressing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-3.5 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>إرسال طلب الراشيتة والأدوية فوراً 📋</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
