import React, { useState } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Power, 
  Phone, 
  Search, 
  Store as StoreIcon, 
  MapPin, 
  Star, 
  Clock, 
  DollarSign, 
  Check, 
  ExternalLink,
  Tag,
  Key,
  HeartHandshake,
  UserCheck,
  MessageSquare,
  MessageCircle,
  Printer,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CheckCheck,
  Megaphone,
  Radio,
  Eye,
  EyeOff
} from "lucide-react";
import { Category, Product, Store, StoreBroadcast } from "../../types";
import { ContactActions } from "../ContactActions";
import { openWhatsApp } from "../../utils/whatsapp";
import { getAppUrl } from "../../utils/appUrl";
import { ImageUploader } from "../ImageUploader";
import { approveStoreOnServer } from "../../utils/apiSync";
import { CategoryManagerModal, detectIconFromName, POPULAR_CATEGORY_PRESETS } from "./CategoryManagerModal";
import { AVAILABLE_CATEGORY_ICONS, CategoryIcon } from "../CategoryIcon";
import { StoreBroadcastModal } from "./StoreBroadcastModal";

interface StoresTabProps {
  stores: Store[];
  categories: Category[];
  products: Product[];
  broadcasts?: StoreBroadcast[];
  onAddStore: (store: Store) => void;
  onUpdateStore: (store: Store) => void;
  onDeleteStore: (storeId: string) => void;
  onAddCategory: (category: Category) => void;
  onUpdateCategory?: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onReorderCategories?: (categories: Category[]) => void;
  onSendBroadcast?: (broadcast: StoreBroadcast) => void;
  onDeleteBroadcast?: (id: string) => void;
  onResendBroadcast?: (broadcast: StoreBroadcast) => void;
  currency: string;
}

export const StoresTab: React.FC<StoresTabProps> = ({
  stores,
  categories,
  products,
  broadcasts = [],
  onAddStore,
  onUpdateStore,
  onDeleteStore,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategories = () => {},
  onSendBroadcast = () => {},
  onDeleteBroadcast = () => {},
  onResendBroadcast = () => {},
  currency
}) => {
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState<"all" | "approved" | "pending">("all");
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  // Store Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("restaurants");
  const [image, setImage] = useState("");
  const [rating, setRating] = useState<string | number>(4.8);
  const [deliveryTime, setDeliveryTime] = useState("20-30 دقيقة");
  const [deliveryFee, setDeliveryFee] = useState<string | number>(5000);
  const [contactPhone, setContactPhone] = useState("");
  const [description, setDescription] = useState("");
  const [workingHours, setWorkingHours] = useState("09:00 ص - 11:00 م");
  const [status, setStatus] = useState<"open" | "closed">("open");
  const [featuredProduct, setFeaturedProduct] = useState("");

  // Owner on behalf of store registration fields
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerPin, setOwnerPin] = useState("1234");
  const [adminAssisted, setAdminAssisted] = useState(true);

  // Merchant Onboarding & WhatsApp Card Modal
  const [onboardingStore, setOnboardingStore] = useState<Store | null>(null);
  const [copiedOnboarding, setCopiedOnboarding] = useState(false);

  // Categories Modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [initialOpenCatAdd, setInitialOpenCatAdd] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("Store");

  // Quick inline category add inside store modal
  const [showQuickAddCatInStore, setShowQuickAddCatInStore] = useState(false);
  const [quickCatName, setQuickCatName] = useState("");
  const [quickCatIcon, setQuickCatIcon] = useState("ShoppingBag");

  const handleQuickAddCategoryInStore = () => {
    const clean = quickCatName.trim();
    if (!clean) return;

    // Generate unique ID
    const newId = "cat_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newCategory: Category = {
      id: newId,
      label: clean,
      icon: quickCatIcon
    };

    onAddCategory(newCategory);
    setCategory(newId);
    setQuickCatName("");
    setShowQuickAddCatInStore(false);
  };

  const handleQuickSelectPresetInStore = (preset: { label: string; icon: string; emoji: string }) => {
    const existing = categories.find((c) => c.label.includes(preset.label) || preset.label.includes(c.label));
    if (existing) {
      setCategory(existing.id);
      setShowQuickAddCatInStore(false);
      return;
    }
    const newId = "cat_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newCategory: Category = {
      id: newId,
      label: preset.label,
      icon: preset.icon
    };
    onAddCategory(newCategory);
    setCategory(newId);
    setShowQuickAddCatInStore(false);
  };

  const openAddModal = (assisted = false) => {
    setEditingStore(null);
    setName("");
    setCategory(categories[0]?.id || "restaurants");
    setImage("https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60");
    setRating("5");
    setDeliveryTime("20-30 دقيقة");
    setDeliveryFee("");
    setContactPhone("0991234567");
    setDescription("");
    setWorkingHours("09:00 ص - 11:00 م");
    setStatus("open");
    setFeaturedProduct("");
    setOwnerName("");
    setOwnerPhone("0991234567");
    // Generate random 4 digit PIN
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setOwnerPin(randomPin);
    setAdminAssisted(assisted);
    setShowStoreModal(true);
  };

  const openEditModal = (st: Store) => {
    setEditingStore(st);
    setName(st.name);
    setCategory(st.category);
    setImage(st.image);
    setRating(st.rating !== undefined && st.rating !== null ? st.rating : 0);
    setDeliveryTime(st.deliveryTime || "20-30 دقيقة");
    setDeliveryFee(st.deliveryFee !== undefined && st.deliveryFee !== null ? st.deliveryFee : 0);
    setContactPhone(st.contactPhone || st.ownerPhone || "");
    const cleanDesc = (st.description && (st.description.includes("بانتظار اعتماد") || st.description.includes("بانتظار الاعتماد")))
      ? (st.category === "food" || st.name.includes("مواد") || st.name.includes("سوبرماركت") ? "متجر مواد غذائية وتموينية طازجة معتمد في المنصة" : "متجر معتمد ونشط في المنصة")
      : (st.description || "");
    setDescription(cleanDesc);
    setWorkingHours(st.workingHours || "09:00 ص - 11:00 م");
    setStatus(st.status || "open");
    setFeaturedProduct(st.featuredProduct || "");
    setOwnerName(st.ownerName || "");
    setOwnerPhone(st.ownerPhone || st.contactPhone || "");
    setOwnerPin(st.ownerPin || "1234");
    setAdminAssisted(st.isApproved ?? true);
    setShowStoreModal(true);
  };

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let finalDesc = description.trim();
    if (!finalDesc || finalDesc.includes("بانتظار اعتماد") || finalDesc.includes("بانتظار الاعتماد")) {
      finalDesc = (category === "food" || name.includes("مواد") || name.includes("سوبرماركت"))
        ? "متجر مواد غذائية وتموينية طازجة معتمد في المنصة"
        : "متجر معتمد ونشط في المنصة";
    }

    // Delivery fee is optional and handles 0: if left empty or 0, accepted as 0 (free delivery)
    const rawFee = typeof deliveryFee === "string" ? deliveryFee.trim() : deliveryFee;
    const parsedFee = (rawFee === "" || rawFee === null || rawFee === undefined) ? 0 : Number(rawFee);
    const finalDeliveryFee = isNaN(parsedFee) ? 0 : Math.max(0, parsedFee);

    // Rating is optional and handles 0: if left empty or 0, accepted as 0
    const rawRating = typeof rating === "string" ? rating.trim() : rating;
    const parsedRating = (rawRating === "" || rawRating === null || rawRating === undefined) ? 0 : Number(rawRating);
    const finalRating = isNaN(parsedRating) ? 0 : Math.max(0, Math.min(5, parsedRating));

    const storePayload: Store = {
      id: editingStore ? editingStore.id : "store_" + Date.now(),
      name: name.trim(),
      category,
      image: image || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60",
      rating: finalRating,
      deliveryTime,
      deliveryFee: finalDeliveryFee,
      locationNode: "center",
      contactPhone: contactPhone || ownerPhone || "0991234567",
      description: finalDesc,
      workingHours,
      status,
      featuredProduct,
      ownerName: ownerName.trim() || undefined,
      ownerPhone: ownerPhone.trim() || contactPhone.trim() || undefined,
      ownerPin: ownerPin.trim() || "1234",
      isApproved: true
    };

    if (editingStore) {
      onUpdateStore(storePayload);
    } else {
      onAddStore(storePayload);
      // Open onboarding modal on new store creation
      setOnboardingStore(storePayload);
    }

    setShowStoreModal(false);
  };

  // Duplicate Store Feature
  const handleDuplicateStore = (st: Store) => {
    const duplicatedStore: Store = {
      ...st,
      id: "store_" + Date.now(),
      name: `${st.name} (نسخة مكررة)`,
    };
    onAddStore(duplicatedStore);
  };

  // Toggle store open/closed
  const handleToggleStoreStatus = (st: Store) => {
    const nextStatus = st.status === "closed" ? "open" : "closed";
    onUpdateStore({
      ...st,
      status: nextStatus
    });
  };

  const pendingStores = stores.filter(st => st.isApproved === false);
  const approvedStores = stores.filter(st => st.isApproved !== false);

  // Approve a pending store (One-click approval)
  const handleApproveStore = async (st: Store) => {
    const isFood = st.category === "food" || st.name.includes("مواد") || st.name.includes("سوبرماركت");
    const updatedDesc = (!st.description || st.description.includes("بانتظار اعتماد") || st.description.includes("بانتظار الاعتماد"))
      ? (isFood ? "متجر مواد غذائية وتموينية طازجة معتمد في المنصة" : "متجر معتمد ونشط في المنصة")
      : st.description;

    const updated: Store = {
      ...st,
      isApproved: true,
      status: "open",
      description: updatedDesc
    };
    onUpdateStore(updated);
    await approveStoreOnServer(st.id);
  };

  // Generate congratulatory approval message for merchant
  const generateApprovalSuccessMessage = (st: Store) => {
    const originUrl = getAppUrl();
    return `أهلاً بك يا معلم ${st.ownerName || "صاحب المتجر"} المحترم! 🏪🎉\n\nيسر إدارة تطبيق توصيل إعلامكم بأنه *تمت الموافقة الرسمية على تفعيل واعتماد متجركم (${st.name})*!\n\n✅ أصبح متجركم الآن ظاهراً ونشطاً لجميع أهالي القرية والزبائن في التطبيق.\n\n🔑 *بيانات دخول لوحة التحكم الخاصة بك:*\n• رقم الهاتف: *${st.ownerPhone || st.contactPhone}*\n• رمز الـ PIN السري: *${st.ownerPin || "1234"}*\n• رابط المنصة المباشر:\n${originUrl}\n\nنبارك لكم الانضمام ونتمنى لكم عملاً موفقاً ومبيعات ممتازة! 🚀`;
  };

  const handleSendApprovalWA = (st: Store, type: "regular" | "business" = "regular") => {
    openWhatsApp({
      phone: st.ownerPhone || st.contactPhone || "",
      message: generateApprovalSuccessMessage(st),
      type
    });
  };

  const filteredStores = stores.filter(st => {
    if (approvalFilter === "pending" && st.isApproved !== false) return false;
    if (approvalFilter === "approved" && st.isApproved === false) return false;

    const matchesSearch = st.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (st.description && st.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (st.ownerName && st.ownerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (st.contactPhone && st.contactPhone.includes(searchQuery)) ||
                          (st.ownerPhone && st.ownerPhone.includes(searchQuery));
    const matchesCat = selectedCat === "all" || st.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatLabel.trim()) return;
    const catId = "cat_" + Date.now();
    onAddCategory({
      id: catId,
      label: newCatLabel.trim(),
      icon: newCatIcon
    });
    setNewCatLabel("");
    setShowCatModal(false);
  };

  // Generate Merchant Onboarding Message for WhatsApp
  const generateStoreOnboardingMessage = (st: Store) => {
    const originUrl = getAppUrl();
    return `أهلاً بك يا معلم ${st.ownerName || "صاحب المحل"} المحترم! 🏪\n\nقامت إدارة تطبيق التوصيل بإنشاء وتفعيل حساب متجرك (*${st.name}*) بنجاح.\n\n🔑 *بيانات الدخول للوحة التحكم الخاصة بك:*\n• رقم الهاتف: ${st.ownerPhone || st.contactPhone || "رقم هاتفك"}\n• رمز الـ PIN السري: *${st.ownerPin || "1234"}*\n• رابط المنصة المباشر:\n${originUrl}\n\n📦 أسطول كباتن التوصيل جاهز لاستلام وتوصيل طلبات زبائنكم فوراً.\nلأي استفسار أو إضافة منتجات، نحن بخدمتكم دائماً!`;
  };

  const handleSendStoreWA = (st: Store, type: "regular" | "business") => {
    const text = generateStoreOnboardingMessage(st);
    openWhatsApp({
      phone: st.ownerPhone || st.contactPhone || "",
      message: text,
      type
    });
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Bar: Search, Category Filter, Add Store & Category Buttons */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <StoreIcon className="w-5 h-5 text-orange-500" />
              <span>إدارة وتسجيل المتاجر والمحلات 🏪</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              إضافة المحلات والمطاعم وتجهيز حساباتها نيابة عن أصحابها مع إرسال بيانات الدخول عبر الواتساب
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex items-center flex-wrap gap-2 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setShowBroadcastModal(true)}
              className="w-full sm:w-auto py-2.5 px-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 border border-orange-400"
            >
              <Megaphone className="w-4 h-4 text-white shrink-0" />
              <span>تنبيه جماعي للمتاجر 📢</span>
              {broadcasts.length > 0 && (
                <span className="text-[10px] bg-white/30 text-white font-black px-1.5 py-0.2 rounded-full">
                  {broadcasts.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setInitialOpenCatAdd(true);
                setShowCatModal(true);
              }}
              className="w-full sm:w-auto py-2.5 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 border border-emerald-500"
              title="إضافة تصنيف عام رئيسي مثل ملابس أو لحوم أو مخابز"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>إضافة تصنيف رئيسي ➕</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setInitialOpenCatAdd(false);
                setShowCatModal(true);
              }}
              className="w-full sm:w-auto py-2.5 px-3.5 bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 text-orange-950 font-black text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-orange-200 shadow-2xs active:scale-95"
            >
              <Tag className="w-4 h-4 text-orange-600 shrink-0" />
              <span>إدارة وترتيب التصنيفات ({categories.length})</span>
            </button>

            <button
              type="button"
              onClick={() => openAddModal(true)}
              className="w-full sm:w-auto py-2.5 px-4 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>تسجيل متجر نيابة عن صاحبه ➕</span>
            </button>
          </div>
        </div>

        {/* Guidance notice */}
        <div className="bg-orange-50/60 border border-orange-200/70 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-orange-900">
          <HeartHandshake className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-orange-800 leading-relaxed">
            <strong className="font-black">مساعدة أصحاب المتاجر التقليدية:</strong> يمكنك كمدير للمنصة تسجيل أي بقالية أو مطعم في القرية وتحديد رمز PIN خاص بصاحب المحل، ثم إرسال بطاقة الاعتماد له بنقرة واحدة عبر الواتساب.
          </p>
        </div>

        {/* Search & Category filter */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن متجر، صاحب المحل، أو رقم الهاتف..."
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
            />
          </div>

          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-hidden"
          >
            <option value="all">كافة التصنيفات ({stores.length})</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Approval Status Filter Pills */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setApprovalFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              approvalFilter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            جميع المتاجر ({stores.length})
          </button>

          <button
            type="button"
            onClick={() => setApprovalFilter("approved")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              approvalFilter === "approved"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60"
            }`}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>المعتمدة والنشطة ({approvedStores.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setApprovalFilter("pending")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              approvalFilter === "pending"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>طلبات بانتظار الاعتماد والموافقة ({pendingStores.length})</span>
            {pendingStores.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
            )}
          </button>
        </div>
      </div>

      {/* High-priority Pending Stores Approval Section */}
      {pendingStores.length > 0 && approvalFilter !== "approved" && (
        <div className="bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl font-black shadow-md shadow-amber-500/20 shrink-0">
                🔔
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-amber-950 flex items-center gap-2">
                  <span>طلبات تسجيل المتاجر الجديدة بانتظار الاعتماد</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-xs font-black">
                    {pendingStores.length} طلب جديد
                  </span>
                </h3>
                <p className="text-xs text-amber-800 mt-0.5 font-medium">
                  المتاجر المسجلة أدناه غير ظاهرة للزبائن في التطبيق حتى تقوم الإدارة بالموافقة وتفعيلها بنقرة واحدة
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingStores.map((st) => (
              <div
                key={st.id}
                className="bg-white border-2 border-amber-300/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3 relative hover:shadow-md transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3">
                    <img
                      src={st.image}
                      alt={st.name}
                      className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-black text-slate-900 text-sm sm:text-base truncate">
                          {st.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black shrink-0 flex items-center gap-1">
                          <span>⏳</span>
                          <span>بانتظار تفعيلك</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {st.description || "طلب تسجيل متجر جديد في القرية"}
                      </p>
                    </div>
                  </div>

                  {/* Owner and Contact Data */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-xs text-slate-700 space-y-1.5 font-semibold">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">رقم الهاتف / الواتساب:</span>
                      <strong className="font-mono text-slate-900 dir-ltr">{st.ownerPhone || st.contactPhone}</strong>
                    </div>
                    {st.ownerPin && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">رمز الـ PIN المخصص:</span>
                        <strong className="font-mono text-orange-600 font-black">{st.ownerPin}</strong>
                      </div>
                    )}
                    {st.ownerName && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">اسم صاحب المتجر:</span>
                        <span className="text-slate-900 font-bold">{st.ownerName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleApproveStore(st)}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>الموافقة وتفعيل المتجر فوراً في التطبيق ✅</span>
                  </button>

                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSendApprovalWA(st, "regular")}
                      className="py-2 px-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                      title="مراسلة التفعيل والبيانات عبر واتساب العادي"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>واتساب</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendApprovalWA(st, "business")}
                      className="py-2 px-1.5 bg-[#075E54]/10 hover:bg-[#075E54]/20 text-[#075E54] border border-[#075E54]/30 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                      title="مراسلة التفعيل والبيانات عبر واتساب الأعمال"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#075E54]" />
                      <span>أعمال</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(st)}
                      className="py-2 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5 text-slate-600" />
                      <span>تعديل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من رفض وحذف طلب متجر "${st.name}" نهائياً؟`)) {
                          onDeleteStore(st.id);
                        }
                      }}
                      className="py-2 px-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span>رفض</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStores.map(st => {
          const storeProductsCount = products.filter(p => p.storeId === st.id).length;
          const isOpen = st.status !== "closed";

          return (
            <div 
              key={st.id} 
              className={`bg-white rounded-3xl border transition-all p-5 shadow-xs flex flex-col justify-between space-y-3.5 relative ${
                isOpen ? "border-slate-200 hover:border-orange-300" : "border-slate-200 bg-slate-50/70 opacity-80"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <img 
                    src={st.image} 
                    alt={st.name}
                    className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-100 shadow-xs" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="font-black text-sm text-slate-900 truncate">{st.name}</h4>
                        {st.isHidden && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black shrink-0 bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                            <EyeOff className="w-2.5 h-2.5 text-amber-800" />
                            <span>مخفي</span>
                          </span>
                        )}
                      </div>
                      {st.isApproved === false ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <span>⏳</span>
                          <span>بانتظار الاعتماد</span>
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                          isOpen ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"
                        }`}>
                          {isOpen ? "مفتوح نشط" : "مغلق حالياً"}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {st.description && !st.description.includes("بانتظار اعتماد") && !st.description.includes("بانتظار الاعتماد")
                        ? st.description
                        : (st.isApproved !== false
                            ? (st.category === "food" || st.name.includes("مواد") || st.name.includes("سوبرماركت")
                                ? "متجر مواد غذائية وتموينية طازجة معتمد في المنصة"
                                : "متجر معتمد ونشط في المنصة")
                            : "متجر محلي مسجل بانتظار اعتماد الإدارة")}
                    </p>

                    {st.isApproved === false && (
                      <div className="mt-2 bg-amber-50/90 border border-amber-300/80 rounded-xl p-2 space-y-1.5">
                        <span className="text-[10px] text-amber-900 font-bold block">
                          ⚠️ غير معتمد - لا يظهر للزبائن حالياً
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApproveStore(st)}
                          className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>الموافقة وتفعيل المتجر ✅</span>
                        </button>
                      </div>
                    )}

                    {st.ownerName && (
                      <p className="text-[10px] font-bold text-slate-500 mt-0.5 flex items-center gap-1">
                        <span>صاحب المحل:</span>
                        <strong className="text-slate-800">{st.ownerName}</strong>
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold mt-1.5 flex-wrap">
                      <span className="flex items-center gap-0.5 text-amber-500">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {st.rating !== undefined && st.rating !== null ? (st.rating === 0 ? "0 (جديد)" : st.rating) : "0 (جديد)"}
                      </span>
                      <span>•</span>
                      <span>{st.deliveryTime || "25 دقيقة"}</span>
                      <span>•</span>
                      <span className="text-orange-600 font-black">
                        {st.deliveryFee === 0 || st.deliveryFee === undefined ? "توصيل مجاني" : `${st.deliveryFee.toLocaleString()} ${currency}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
                  <span className="font-bold text-[11px] text-slate-500">
                    الأصناف: <strong className="text-slate-800 font-black">{storeProductsCount} صنف</strong>
                  </span>
                  
                  {/* WhatsApp Merchant Credentials Button */}
                  <button
                    type="button"
                    onClick={() => setOnboardingStore(st)}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer"
                    title="عرض بيانات الدخول والـ PIN ومراسلتها لصاحب المحل"
                  >
                    <Key className="w-3 h-3 text-amber-600" />
                    <span>بطاقة الدخول والـ PIN</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleStoreStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                      isOpen 
                        ? "bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600" 
                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                    }`}
                    title={isOpen ? "إغلاق المتجر مؤقتاً" : "فتح المتجر للزبائن"}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{isOpen ? "إغلاق" : "فتح"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateStore({
                        ...st,
                        isHidden: !st.isHidden
                      });
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                      st.isHidden
                        ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                    title={st.isHidden ? "المتجر مخفي حالياً - انقر لإظهاره للزبائن" : "إخفاء المتجر مؤقتاً عن الزبائن"}
                  >
                    {st.isHidden ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-amber-800" />
                        <span>إظهار</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                        <span>إخفاء</span>
                      </>
                    )}
                  </button>

                  <ContactActions 
                    phone={st.ownerPhone || st.contactPhone || "0944111222"} 
                    name={st.name} 
                    defaultMessage={`مرحباً متجر (${st.name})، من إدارة منصة توصيل.`} 
                    variant="compact" 
                  />
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDuplicateStore(st)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all cursor-pointer"
                    title="تكرار ونسخ المتجر"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(st)}
                    className="p-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl transition-all cursor-pointer"
                    title="تعديل بيانات المتجر"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من حذف متجر "${st.name}" نهائياً؟`)) {
                        onDeleteStore(st.id);
                      }
                    }}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all cursor-pointer"
                    title="حذف المتجر"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Store Modal */}
      {showStoreModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto pt-6 sm:pt-4 pb-48 sm:pb-6">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-xl w-full border border-slate-200 shadow-2xl space-y-4 text-right my-auto" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <StoreIcon className="w-5 h-5 text-orange-500" />
                <span>{editingStore ? "تعديل بيانات المتجر 🏪" : "تسجيل متجر جديد نيابة عن صاحبه 🏪"}</span>
              </h3>
              <button 
                onClick={() => setShowStoreModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStore} className="space-y-3.5 text-xs text-slate-700">
              {/* Owner Onboarding Assistance Section */}
              <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 space-y-3">
                <span className="font-black text-amber-900 flex items-center gap-1.5 text-xs">
                  <UserCheck className="w-4 h-4 text-amber-700" />
                  <span>بيانات صاحب المحل والدخول (للمساعدة والدعم الفني):</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">اسم صاحب المحل / المعلم:</label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="مثال: المعلم أبو أنس"
                      className="w-full py-2 px-2.5 bg-white border border-amber-200 rounded-xl font-bold focus:outline-hidden focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700">رقم هاتف صاحب المحل: *</label>
                    <input
                      type="tel"
                      required
                      value={ownerPhone}
                      onChange={(e) => {
                        setOwnerPhone(e.target.value);
                        if (!contactPhone) setContactPhone(e.target.value);
                      }}
                      placeholder="0991234567"
                      className="w-full py-2 px-2.5 bg-white border border-amber-200 rounded-xl font-bold font-mono focus:outline-hidden focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700">رمز PIN الدخول الخاص به: *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={ownerPin}
                      onChange={(e) => setOwnerPin(e.target.value)}
                      placeholder="مثال: 5432"
                      className="w-full py-2 px-2.5 bg-white border border-amber-200 rounded-xl font-black font-mono text-center tracking-widest focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Store Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700">اسم المتجر / المحل: *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: مطعم الياسمين الدمشقي"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">التصنيف الرئيسي: *</label>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddCatInStore(!showQuickAddCatInStore)}
                      className="text-[11px] font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      title="إضافة تصنيف عام رئيسي جديد مثل ملابس أو لحوم"
                    >
                      <Plus className="w-3 h-3 text-emerald-600" />
                      <span>+ تصنيف رئيسي جديد (ملابس، لحوم...)</span>
                    </button>
                  </div>
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === "__add_new_category__") {
                        setShowQuickAddCatInStore(true);
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-orange-500 text-slate-900"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                    <option value="__add_new_category__" className="text-emerald-700 font-black">
                      ➕ + إضافة تصنيف رئيسي جديد (ملابس، لحوم...)
                    </option>
                  </select>

                  {/* Inline Quick Category Creator Box */}
                  {showQuickAddCatInStore && (
                    <div className="mt-2 p-3 bg-emerald-50/90 border border-emerald-300 rounded-2xl space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-emerald-700" />
                          <span>إضافة تصنيف رئيسي جديد للمنصة فوراً:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowQuickAddCatInStore(false)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex flex-wrap gap-1">
                        {POPULAR_CATEGORY_PRESETS.slice(0, 8).map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => handleQuickSelectPresetInStore(preset)}
                            className="text-[10px] font-bold bg-white hover:bg-emerald-100 text-emerald-950 border border-emerald-200 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <span>{preset.emoji}</span>
                            <span>{preset.label}</span>
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={quickCatName}
                          onChange={(e) => {
                            setQuickCatName(e.target.value);
                            setQuickCatIcon(detectIconFromName(e.target.value));
                          }}
                          placeholder="اكتب اسم التصنيف (مثال: ملابس جاهزة، جزارة ولحوم)"
                          className="py-1.5 px-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold focus:outline-hidden focus:border-emerald-600 text-slate-800"
                        />

                        <div className="flex items-center gap-1.5">
                          <div className="w-8 h-8 rounded-lg bg-white border border-emerald-300 flex items-center justify-center shrink-0">
                            <CategoryIcon name={quickCatIcon} className="w-4 h-4 text-emerald-600" />
                          </div>
                          <select
                            value={quickCatIcon}
                            onChange={(e) => setQuickCatIcon(e.target.value)}
                            className="w-full py-1.5 px-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold focus:outline-hidden text-slate-800"
                          >
                            {AVAILABLE_CATEGORY_ICONS.map((icon) => (
                              <option key={icon.id} value={icon.id}>
                                {icon.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowQuickAddCatInStore(false)}
                          className="py-1 px-3 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickAddCategoryInStore}
                          disabled={!quickCatName.trim()}
                          className={`py-1 px-4 text-white text-xs font-black rounded-lg cursor-pointer shadow-xs transition-all ${
                            quickCatName.trim()
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "bg-slate-300 cursor-not-allowed"
                          }`}
                        >
                          حفظ التصنيف وتحديده لهذا المتجر ✓
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Store Image Uploader (Studio & Camera, No URL) */}
              <ImageUploader
                value={image}
                onChange={(val) => setImage(val)}
                label="صورة أو واجهة المتجر / الشعار"
                helperText="التقط صورة لافتة المتجر بالكاميرا أو استورد شعاره من الاستديو"
                aspectRatio="wide"
                presets={[
                  { label: "لحوم وملاحم وجزارة", emoji: "🥩", url: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&auto=format&fit=crop&q=60" },
                  { label: "ملابس وأزياء وثياب", emoji: "👕", url: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500&auto=format&fit=crop&q=60" },
                  { label: "مطاعم وشاورما", emoji: "🍔", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60" },
                  { label: "تموينات وسوبرماركت", emoji: "🛒", url: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=60" },
                  { label: "خضار وفواكه طازجة", emoji: "🍎", url: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&auto=format&fit=crop&q=60" },
                  { label: "حلويات ومخبوزات", emoji: "🍰", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60" },
                  { label: "صيدلية وعناية", emoji: "💊", url: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=60" },
                  { label: "قهوة ومشروبات", emoji: "☕", url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=60" }
                ]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700">وقت التوصيل التقديري:</label>
                  <input
                    type="text"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    placeholder="20-30 دقيقة"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">
                    أجرة التوصيل ({currency}) <span className="text-xs font-normal text-emerald-600">(اختياري):</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    placeholder="0 أو فارغ (مجاني)"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-orange-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">إذا تُرِك فارغاً أو 0، يُقبل كتوصيل مجاني تلقائياً.</p>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">
                    التقييم العام <span className="text-xs font-normal text-amber-600">(اختياري):</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    placeholder="0 أو فارغ (0 - 5)"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-orange-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">يقبل 0 أو تركه فارغاً للمتاجر الجديدة دون أي مانع.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700">رقم الهاتف للتواصل واستقبال الطلبات:</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="0991234567"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">أوقات العمل اليومية:</label>
                  <input
                    type="text"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    placeholder="10:00 ص - 11:00 م"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700">نبذة ووصف المتجر:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="أشهى الأطباق والوجبات السريعة..."
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700">حالة فتح المتجر:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status" 
                      checked={status === "open"} 
                      onChange={() => setStatus("open")} 
                    />
                    <span className="font-bold text-emerald-700">مفتوح ويستقبل الطلبات ✅</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status" 
                      checked={status === "closed"} 
                      onChange={() => setStatus("closed")} 
                    />
                    <span className="font-bold text-red-700">مغلق حالياً 🔴</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                >
                  {editingStore ? "حفظ التعديلات ✓" : "تأكيد تسجيل المتجر وتوليد بطاقة الواتساب 🏪"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowStoreModal(false)}
                  className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Merchant Onboarding & WhatsApp Delivery Card Modal */}
      {onboardingStore && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 text-right" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm sm:text-base">
                    بطاقة اعتماد ودخول المتجر 🏪
                  </h4>
                  <p className="text-[11px] text-slate-400">إرسال بيانات الدخول لصاحب المحل عبر الواتساب</p>
                </div>
              </div>
              <button 
                onClick={() => setOnboardingStore(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Store Quick Credentials Badge */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">اسم المتجر:</span>
                <span className="font-black text-slate-900">{onboardingStore.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">صاحب المحل / المعلم:</span>
                <span className="font-black text-slate-900">{onboardingStore.ownerName || "المعلم"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">رقم الهاتف للدخول:</span>
                <span className="font-black text-slate-900 font-mono">{onboardingStore.ownerPhone || onboardingStore.contactPhone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">رمز الـ PIN المخصص:</span>
                <span className="font-black text-orange-600 font-mono text-sm px-2 py-0.5 bg-orange-100 rounded-lg">
                  {onboardingStore.ownerPin || "1234"}
                </span>
              </div>
            </div>

            {/* WhatsApp Message Preview */}
            <div className="space-y-1">
              <span className="text-xs font-black text-slate-700 block">نص رسالة الاعتماد لصاحب المحل:</span>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700 font-medium whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
                {generateStoreOnboardingMessage(onboardingStore)}
              </div>
            </div>

            {/* WhatsApp Regular & Business Share Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleSendStoreWA(onboardingStore, "regular")}
                className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba56] text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>واتساب العادي 💬</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendStoreWA(onboardingStore, "business")}
                className="py-2.5 px-3 bg-[#075E54] hover:bg-[#054a43] text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>واتساب الأعمال 💼</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(generateStoreOnboardingMessage(onboardingStore));
                setCopiedOnboarding(true);
                setTimeout(() => setCopiedOnboarding(false), 2000);
              }}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              {copiedOnboarding ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedOnboarding ? "تم نسخ نص الاعتماد!" : "نسخ نص الاعتماد"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Categories Reordering & Management Modal (Drag and Drop) */}
      <CategoryManagerModal
        isOpen={showCatModal}
        onClose={() => {
          setShowCatModal(false);
          setInitialOpenCatAdd(false);
        }}
        categories={categories}
        stores={stores}
        onReorderCategories={onReorderCategories}
        onAddCategory={onAddCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
        initialOpenAddForm={initialOpenCatAdd}
      />

      {/* Store Broadcasts Management Modal */}
      <StoreBroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        broadcasts={broadcasts}
        stores={stores}
        categories={categories}
        onSendBroadcast={onSendBroadcast}
        onDeleteBroadcast={onDeleteBroadcast}
        onResendBroadcast={onResendBroadcast}
      />
    </div>
  );
};
