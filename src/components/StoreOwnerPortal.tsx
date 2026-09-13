import React, { useState, useMemo, useEffect } from "react";
import { 
  Store as StoreIcon, 
  Package, 
  Utensils, 
  Clock, 
  CheckCircle2, 
  Bike, 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  LogOut, 
  ArrowRight,
  User,
  Power,
  Archive,
  FileText,
  Send,
  Printer,
  Calendar,
  DollarSign,
  Volume2,
  VolumeX,
  MessageSquare,
  MessageCircle,
  Pill,
  Camera,
  ZoomIn,
  ShoppingBag,
  Tag,
  AlertCircle,
  Check,
  X,
  Layers,
  Sparkles,
  Info,
  Eye,
  EyeOff,
  Megaphone
} from "lucide-react";
import { Order, Product, Store, UserProfile, Category, StoreBroadcast, StoreSize, StoreAddition } from "../types";
import { ContactActions } from "./ContactActions";
import { openWhatsApp } from "../utils/whatsapp";
import { playOrderAlertSound, isSoundEnabled, setSoundEnabled } from "../utils/soundNotifications";
import { StoreBroadcastViewer } from "./store/StoreBroadcastViewer";
import { ImageUploader } from "./ImageUploader";
import { BottomNavigation } from "./BottomNavigation";
import { AccountSettingsModal } from "./AccountSettingsModal";

interface StoreOwnerPortalProps {
  storeId: string;
  stores: Store[];
  products: Product[];
  orders: Order[];
  categories: Category[];
  userProfile: UserProfile;
  broadcasts?: StoreBroadcast[];
  onUpdateStore: (store: Store) => void;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: any) => void;
  onAcknowledgeBroadcast?: (broadcastId: string) => void;
  onLogout: () => void;
  onBackToCustomerView?: () => void;
  currency?: string;
}

export const StoreOwnerPortal: React.FC<StoreOwnerPortalProps> = ({
  storeId,
  stores,
  products,
  orders,
  categories,
  userProfile,
  broadcasts = [],
  onUpdateStore,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onAcknowledgeBroadcast,
  onLogout,
  onBackToCustomerView,
  currency = "ل.س"
}) => {
  const currentStore = stores.find((s) => s.id === storeId) || {
    id: storeId,
    name: userProfile.name || "متجر القرية",
    category: "food",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60",
    rating: 4.9,
    deliveryTime: "20-30 دقيقة",
    deliveryFee: 5000,
    locationNode: "center",
    status: "open" as const,
    contactPhone: userProfile.phone || "0944111222"
  };

  const [activeTab, setActiveTab] = useState<"orders" | "products" | "archive" | "ticker">("orders");
  const [productFilter, setProductFilter] = useState<"all" | "approved" | "pending" | "offers" | "hidden">("all");
  const [archiveDateFilter, setArchiveDateFilter] = useState<"all" | "today" | "yesterday" | "week">("all");
  const [isOpen, setIsOpen] = useState<boolean>(currentStore.status !== "closed");
  const [soundAlerts, setSoundAlerts] = useState<boolean>(() => isSoundEnabled());
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const handleProfileUpdate = async (updatedProfile: UserProfile, extraData?: any) => {
    const updatedStore: Store = {
      ...currentStore,
      name: extraData?.storeName || currentStore.name,
      ownerName: updatedProfile.name,
      ownerPhone: updatedProfile.phone,
      ownerPin: updatedProfile.pin,
      contactPhone: updatedProfile.phone || currentStore.contactPhone,
      workingHours: extraData?.storeHours || currentStore.workingHours,
      deliveryFee: extraData?.deliveryFee !== undefined && extraData?.deliveryFee !== null
        ? Number(extraData.deliveryFee)
        : currentStore.deliveryFee
    };
    onUpdateStore(updatedStore);

    localStorage.setItem("tw_user_profile", JSON.stringify(updatedProfile));
    localStorage.setItem("tw_customer_user", JSON.stringify(updatedProfile));
    localStorage.setItem("tw_saved_store_name", updatedStore.name);
    localStorage.setItem("tw_saved_store_phone", updatedProfile.phone);
    localStorage.setItem("tw_saved_store_pin", updatedProfile.pin);
  };

  // Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Close internal modals or zoomed image on mobile back button tap without leaving store owner portal
  useEffect(() => {
    const handleBack = (e: Event) => {
      if (zoomedImage) {
        setZoomedImage(null);
        e.preventDefault();
      } else if (showProductModal) {
        setShowProductModal(false);
        e.preventDefault();
      } else if (showAccountModal) {
        setShowAccountModal(false);
        e.preventDefault();
      }
    };
    window.addEventListener("tw_back_button_pressed", handleBack);
    return () => window.removeEventListener("tw_back_button_pressed", handleBack);
  }, [zoomedImage, showProductModal, showAccountModal]);

  // Product Form Fields
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productUnit, setProductUnit] = useState("قطعة");
  const [productStock, setProductStock] = useState("50");
  const [productCategory, setProductCategory] = useState(currentStore.category || "restaurants");
  const [productDescription, setProductDescription] = useState("");
  const [productImage, setProductImage] = useState("");
  const [isOffer, setIsOffer] = useState(false);
  const [originalPrice, setOriginalPrice] = useState("");
  const [offerLabel, setOfferLabel] = useState("عرض خاص 🔥");
  const [productIsHidden, setProductIsHidden] = useState(false);

  // Store News Ticker Announcement State
  const [tickerMessage, setTickerMessage] = useState(currentStore.tickerAnnouncement || "");
  const [tickerSavedSuccess, setTickerSavedSuccess] = useState(false);

  const handleSaveTickerMessage = (msgToSave?: string) => {
    const finalMsg = msgToSave !== undefined ? msgToSave : tickerMessage;
    setTickerMessage(finalMsg);
    onUpdateStore({
      ...currentStore,
      tickerAnnouncement: finalMsg.trim()
    });
    setTickerSavedSuccess(true);
    setTimeout(() => setTickerSavedSuccess(false), 3000);
  };

  // Sizes & Additions for Product
  const [sizes, setSizes] = useState<StoreSize[]>([]);
  const [sizeName, setSizeName] = useState("");
  const [sizePrice, setSizePrice] = useState("");

  const [additions, setAdditions] = useState<StoreAddition[]>([]);
  const [additionName, setAdditionName] = useState("");
  const [additionPrice, setAdditionPrice] = useState("");

  const handleToggleSound = () => {
    const next = !soundAlerts;
    setSoundAlerts(next);
    setSoundEnabled(next);
    if (next) {
      playOrderAlertSound("ringtone");
    }
  };

  const handleToggleStoreStatus = () => {
    const nextStatus = isOpen ? "closed" : "open";
    setIsOpen(!isOpen);
    onUpdateStore({ ...currentStore, status: nextStatus });
  };

  // Filter orders for this store
  const storeOrders = orders.filter(
    (o) => o.storeId === currentStore.id || o.storeName === currentStore.name
  );

  // Archive filtered orders
  const archivedStoreOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOfWeek = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    return storeOrders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      if (archiveDateFilter === "today" && t < startOfToday) return false;
      if (archiveDateFilter === "yesterday" && (t < startOfYesterday || t >= startOfToday)) return false;
      if (archiveDateFilter === "week" && t < startOfWeek) return false;
      return true;
    });
  }, [storeOrders, archiveDateFilter]);

  const storeArchiveStats = useMemo(() => {
    let deliveredTotal = 0;
    let deliveredCount = 0;
    archivedStoreOrders.forEach((o) => {
      if (o.status === "delivered") {
        deliveredCount++;
        deliveredTotal += o.subtotal || 0;
      }
    });
    return { deliveredTotal, deliveredCount };
  }, [archivedStoreOrders]);

  const handleSendMerchantReportWhatsApp = (type: "regular" | "business" = "regular") => {
    const periodLabel = archiveDateFilter === "today" ? "اليوم" : archiveDateFilter === "yesterday" ? "الأمس" : archiveDateFilter === "week" ? "آخر 7 أيام" : "كافة الطلبات";
    let msg = `📊 *تقرير مبيعات متجر (${currentStore.name})* 📊\n📅 *الفترة:* ${periodLabel}\n⏱️ *تاريخ الإصدار:* ${new Date().toLocaleString("ar-SY")}\n\n📦 *إجمالي الطلبات:* ${archivedStoreOrders.length} طلب\n✅ *المسلمة بنجاح:* ${storeArchiveStats.deliveredCount} طلب\n💰 *صافي مبيعات المتجر:* ${storeArchiveStats.deliveredTotal.toLocaleString()} ${currency}\n\n───────────────\nتفاصيل الطلبات:\n`;
    archivedStoreOrders.forEach((o) => {
      msg += `• #${o.id.slice(-4)} | ${o.customerName} | ${o.subtotal?.toLocaleString()} ${currency} | ${o.status === "delivered" ? "مسلم ✅" : o.status}\n`;
    });
    msg += `\n───────────────\nتطبيق توصيل - بوابة التاجر 🌟`;
    openWhatsApp({ phone: currentStore.contactPhone || userProfile.phone, message: msg, type });
  };

  // Filter products for this store
  const storeProducts = useMemo(() => {
    return products.filter((p) => p.storeId === currentStore.id);
  }, [products, currentStore.id]);

  const pendingStoreProducts = useMemo(() => {
    return storeProducts.filter((p) => p.isApproved === false || p.approvalStatus === "pending");
  }, [storeProducts]);

  const hiddenStoreProducts = useMemo(() => {
    return storeProducts.filter((p) => Boolean(p.isHidden));
  }, [storeProducts]);

  const approvedStoreProducts = useMemo(() => {
    return storeProducts.filter((p) => p.isApproved !== false && p.approvalStatus !== "pending" && !p.isHidden);
  }, [storeProducts]);

  const offersStoreProducts = useMemo(() => {
    return storeProducts.filter((p) => p.isOffer && !p.isHidden);
  }, [storeProducts]);

  const displayedStoreProducts = useMemo(() => {
    return storeProducts.filter((p) => {
      if (productFilter === "approved") {
        return p.isApproved !== false && p.approvalStatus !== "pending" && !p.isHidden;
      }
      if (productFilter === "pending") {
        return p.isApproved === false || p.approvalStatus === "pending";
      }
      if (productFilter === "offers") {
        return Boolean(p.isOffer) && !p.isHidden;
      }
      if (productFilter === "hidden") {
        return Boolean(p.isHidden);
      }
      return true;
    });
  }, [storeProducts, productFilter]);

  // Product Add / Edit Handlers
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductName("");
    setProductPrice("");
    setProductUnit("قطعة");
    setProductStock("50");
    setProductCategory(currentStore.category || "restaurants");
    setProductDescription("");
    setProductImage("https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60");
    setIsOffer(false);
    setOriginalPrice("");
    setOfferLabel("عرض خاص 🔥");
    setProductIsHidden(false);
    setSizes([]);
    setAdditions([]);
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductName(prod.name);
    setProductPrice(prod.price.toString());
    setProductUnit(prod.unit || "قطعة");
    setProductStock(prod.stock !== undefined ? prod.stock.toString() : "50");
    setProductCategory(prod.category || currentStore.category || "restaurants");
    setProductDescription(prod.description || "");
    setProductImage(prod.image);
    setIsOffer(Boolean(prod.isOffer));
    setOriginalPrice(prod.originalPrice ? prod.originalPrice.toString() : "");
    setOfferLabel(prod.offerLabel || "عرض خاص 🔥");
    setProductIsHidden(Boolean(prod.isHidden));
    setSizes(prod.sizes ? [...prod.sizes] : []);
    setAdditions(prod.additions ? [...prod.additions] : []);
    setShowProductModal(true);
  };

  const handleToggleHideProduct = (prod: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateProduct({
      ...prod,
      isHidden: !prod.isHidden
    });
  };

  const handleAddSize = () => {
    if (!sizeName.trim()) return;
    setSizes([...sizes, { name: sizeName.trim(), price: Number(sizePrice) || 0 }]);
    setSizeName("");
    setSizePrice("");
  };

  const handleRemoveSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const handleAddAddition = () => {
    if (!additionName.trim()) return;
    setAdditions([...additions, { name: additionName.trim(), price: Number(additionPrice) || 0 }]);
    setAdditionName("");
    setAdditionPrice("");
  };

  const handleRemoveAddition = (index: number) => {
    setAdditions(additions.filter((_, i) => i !== index));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(productPrice);
    if (!productName.trim() || isNaN(priceNum)) return;

    const stockNum = productStock.trim() !== "" && !isNaN(Number(productStock)) ? Number(productStock) : undefined;
    const isDepleted = stockNum !== undefined && stockNum <= 0;

    if (editingProduct) {
      // Keep existing approval status or reset to pending if major changes
      const updatedProduct: Product = {
        ...editingProduct,
        name: productName.trim(),
        price: priceNum,
        unit: productUnit.trim() || "قطعة",
        stock: stockNum,
        inStock: !isDepleted,
        isAvailable: !isDepleted,
        category: productCategory,
        description: productDescription,
        image: productImage || editingProduct.image,
        isOffer,
        originalPrice: isOffer && originalPrice ? parseFloat(originalPrice) : undefined,
        offerLabel: isOffer ? offerLabel : undefined,
        isHidden: productIsHidden,
        sizes: sizes.length > 0 ? sizes : undefined,
        additions: additions.length > 0 ? additions : undefined,
        storeId: currentStore.id,
        storeName: currentStore.name
      };
      onUpdateProduct(updatedProduct);
    } else {
      // New product created by store owner -> isApproved: false (pending admin review)
      const newProduct: Product = {
        id: "prod_" + Date.now(),
        name: productName.trim(),
        price: priceNum,
        unit: productUnit.trim() || "قطعة",
        stock: stockNum,
        inStock: !isDepleted,
        isAvailable: !isDepleted,
        soldCount: 0,
        category: productCategory,
        description: productDescription,
        image: productImage || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60",
        isOffer,
        originalPrice: isOffer && originalPrice ? parseFloat(originalPrice) : undefined,
        offerLabel: isOffer ? offerLabel : undefined,
        isHidden: productIsHidden,
        sizes: sizes.length > 0 ? sizes : undefined,
        additions: additions.length > 0 ? additions : undefined,
        storeId: currentStore.id,
        storeName: currentStore.name,
        isApproved: false, // Sent for admin approval
        approvalStatus: "pending",
        createdAt: new Date().toISOString(),
        createdBy: userProfile.phone || userProfile.name || "store_owner"
      };
      onAddProduct(newProduct);
    }

    setShowProductModal(false);
  };

  const handleQuickRestock = (prod: Product) => {
    const current = prod.stock !== undefined ? prod.stock : 0;
    const input = window.prompt(
      `تحديث مخزون "${prod.name}":\nالمخزون المعروض الحالي: ${current} ${prod.unit || "قطعة"}\nإجمالي الكمية المباعة: ${prod.soldCount || 0} ${prod.unit || "قطعة"}\n\nأدخل كمية المخزون المعروضة الجديدة:`,
      (current > 0 ? current + 20 : 50).toString()
    );
    if (input !== null && input.trim() !== "") {
      const newQty = parseInt(input.trim(), 10);
      if (!isNaN(newQty) && newQty >= 0) {
        onUpdateProduct({
          ...prod,
          stock: newQty,
          inStock: newQty > 0,
          isAvailable: newQty > 0
        });
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-right font-sans pb-28" dir="rtl">
      {/* Merchant Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-7 text-white shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-orange-500/25 shrink-0">
              🏪
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">{currentStore.name}</h2>
                {currentStore.isApproved === false ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black border bg-amber-500/20 text-amber-300 border-amber-500/40 flex items-center gap-1">
                    <span>⏳</span>
                    <span>بانتظار موافقة وتفعيل الإدارة</span>
                  </span>
                ) : (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                      isOpen
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}
                  >
                    {isOpen ? "المتجر مفتوح لاستقبال الطلبات 🟢" : "المتجر مغلق حالياً 🔴"}
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs font-semibold mt-0.5 flex items-center gap-2">
                <span>هاتف المتجر: <strong className="font-mono text-slate-200">{currentStore.contactPhone || userProfile.phone}</strong></span>
                <span>•</span>
                <span>أجرة التوصيل: {currentStore.deliveryFee === 0 || currentStore.deliveryFee === undefined ? "توصيل مجاني (0)" : `${currentStore.deliveryFee.toLocaleString()} ${currency}`}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sound alert toggle for store orders */}
            <button
              type="button"
              onClick={handleToggleSound}
              className={`py-2 px-3.5 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                soundAlerts
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
              }`}
              title="تفعيل/كتم صوت رنين الطلبات الواردة للمتجر"
            >
              {soundAlerts ? <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span>{soundAlerts ? "رنين الطلبات مفعّل 🔔" : "الصوت مكتوم"}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleStoreStatus}
              className={`py-2 px-3.5 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                isOpen
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isOpen ? "إغلاق المتجر مؤقتاً" : "فتح المتجر للزبائن"}</span>
            </button>

            {/* Account Settings Button */}
            <button
              type="button"
              onClick={() => setShowAccountModal(true)}
              className="py-2 px-3.5 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-xs font-black text-orange-400 transition-all cursor-pointer flex items-center gap-1.5"
              title="إعدادات الحساب وتعديل بيانات المتجر"
            >
              <User className="w-4 h-4 text-orange-400" />
              <span>حسابي</span>
            </button>

            {onBackToCustomerView && (
              <button
                type="button"
                onClick={onBackToCustomerView}
                className="py-2 px-3.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4 text-orange-400" />
                <span>تصفح كزبون</span>
              </button>
            )}

            <button
              type="button"
              onClick={onLogout}
              className="py-2 px-3.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
            <span className="text-slate-400 text-xs font-bold block">إجمالي طلبات المتجر</span>
            <span className="text-xl font-black text-orange-400">{storeOrders.length} طلب</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
            <span className="text-slate-400 text-xs font-bold block">طلبات نشطة قيد التحضير</span>
            <span className="text-xl font-black text-blue-400">
              {storeOrders.filter((o) => o.status === "pending" || o.status === "accepted" || o.status === "preparing").length} طلب
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 col-span-2 sm:col-span-1">
            <span className="text-slate-400 text-xs font-bold block">أصناف متجري (معتمدة / معلقة)</span>
            <span className="text-xl font-black text-emerald-400">
              {approvedStoreProducts.length} معتمد / {pendingStoreProducts.length} بانتظار الاعتماد
            </span>
          </div>
        </div>
      </div>

      {/* Broadcast Announcements & Admin Directives */}
      <StoreBroadcastViewer
        currentStore={currentStore}
        broadcasts={broadcasts}
        onAcknowledgeBroadcast={onAcknowledgeBroadcast || (() => {})}
      />

      {/* Pending Approval Notice for Store Owner */}
      {currentStore.isApproved === false && (
        <div className="bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-slate-900 border-2 border-amber-500/60 rounded-3xl p-5 text-white shadow-xl space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl font-black text-amber-400 shrink-0">
                ⏳
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-amber-300 text-sm sm:text-base">
                    طلب متجرك قيد المراجعة والاعتماد من قبل الإدارة
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/40 text-[10px] font-black">
                    غير ظاهر للزبائن حالياً
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  أهلاً بك! تم استلام طلب تسجيل متجرك بنجاح. سيقوم فريق الإدارة بمراجعته وتفعيله ليظهر فوراً لجميع أهالي القرية في التطبيق. يمكنك الآن البدء بإضافة منتجاتك وعروضك لتكون جاهزة فور اعتماد المتجر.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                openWhatsApp({
                  phone: "0991234567",
                  message: `مرحباً إدارة تطبيق توصيل، قمت بتسجيل متجري (${currentStore.name}) برقم هاتف (${currentStore.contactPhone || userProfile.phone}) وأرجو التكرم باعتماده وتفعيله ليظهر للزبائن في التطبيق. شكراً لكم!`,
                  type: "regular"
                });
              }}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>مراسلة الإدارة لتسريع الاعتماد بالواتساب</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`py-2.5 px-4 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "orders"
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>طلبات متجري الواردة ({storeOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("archive")}
          className={`py-2.5 px-4 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "archive"
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>أرشيف الطلبات والتقارير ({storeOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("products")}
          className={`py-2.5 px-4 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "products"
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>إدارة منتجات وعروض المتجر ({storeProducts.length})</span>
          {pendingStoreProducts.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
              {pendingStoreProducts.length} معلق
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ticker")}
          className={`py-2.5 px-4 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "ticker"
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>شريط العروض الإخباري 📢</span>
          {currentStore.tickerAnnouncement ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          ) : (
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">جديد</span>
          )}
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {storeOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-black text-sm text-slate-700">لا توجد طلبات مسجلة لهذا المتجر حالياً</h4>
              <p className="text-xs text-slate-400">ستظهر طلبات الزبائن الواردة هنا فور إرسالها.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {storeOrders.map((order) => {
                const hasDriver = Boolean(order.driverName || order.driverPhone);

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border border-slate-200 hover:border-orange-300 p-5 sm:p-6 shadow-xs space-y-4 transition-all"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {order.status === "pending" ? (
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white font-black text-xs flex flex-col items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.7)] ring-2 ring-orange-400/80 animate-pulse">
                              <ShoppingBag className="w-4 h-4 drop-shadow-sm" />
                              <span className="text-[9px] font-mono leading-none mt-0.5">#{order.id.slice(-4)}</span>
                            </div>
                          ) : order.status === "accepted" || order.status === "preparing" ? (
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-600 text-white font-black text-xs flex flex-col items-center justify-center shadow-[0_0_18px_rgba(168,85,247,0.6)] ring-2 ring-purple-300/80">
                              <StoreIcon className="w-4 h-4 drop-shadow-sm" />
                              <span className="text-[9px] font-mono leading-none mt-0.5">#{order.id.slice(-4)}</span>
                            </div>
                          ) : order.status === "picked_up" ? (
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black text-xs flex flex-col items-center justify-center shadow-[0_0_18px_rgba(6,182,212,0.6)] ring-2 ring-cyan-300/80">
                              <Bike className="w-4 h-4 drop-shadow-sm" />
                              <span className="text-[9px] font-mono leading-none mt-0.5">#{order.id.slice(-4)}</span>
                            </div>
                          ) : (
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-xs flex flex-col items-center justify-center shadow-[0_0_18px_rgba(16,185,129,0.6)] ring-2 ring-emerald-300/80">
                              <Check className="w-4 h-4 drop-shadow-sm" />
                              <span className="text-[9px] font-mono leading-none mt-0.5">#{order.id.slice(-4)}</span>
                            </div>
                          )}
                          {order.status === "pending" && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)]"></span>
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm text-slate-900">طلب الزبون: {order.customerName}</h4>
                            <span className="text-xs font-mono text-slate-400">
                              {new Date(order.createdAt).toLocaleTimeString("ar-SY", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            المعلم: <strong className="text-slate-800">{order.addressLandmark}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black border ${
                            order.status === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : order.status === "accepted" || order.status === "preparing"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : order.status === "picked_up"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {order.status === "pending"
                            ? "طلب جديد بانتظار القبول 🟡"
                            : order.status === "accepted" || order.status === "preparing"
                            ? "جاري التجهيز بالمحل 🍳"
                            : order.status === "picked_up"
                            ? "تم الاستلام من الكابتن 🛵"
                            : "تم التسليم بنجاح 🟢"}
                        </span>
                      </div>
                    </div>

                    {/* Dispatch & Driver info Box */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Driver Status for Store */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <Bike className="w-4 h-4 text-orange-500" />
                          <span className="font-black text-slate-800">كابتن التوصيل المكلف من الإدارة:</span>
                        </div>
                        {hasDriver ? (
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-900">{order.driverName}</span>
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                تم التكليف
                              </span>
                            </div>
                            <p className="text-slate-400 text-[11px]">{order.driverVehicle || "دراجة نارية"}</p>
                            <div className="pt-1 border-t border-slate-200">
                              <ContactActions
                                phone={order.driverPhone!}
                                name={order.driverName!}
                                defaultMessage={`مرحباً كابتن (${order.driverName})، من إدارة متجر (${currentStore.name}) بخصوص تجهيز الطلب #${order.id.slice(-4)}.`}
                                variant="pills"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 space-y-1">
                            <p className="font-bold">بانتظار توجيه وتعيين كابتن من الإدارة ⏳</p>
                            <p className="text-[10px] text-amber-700">تقوم إدارة المنصة بتعيين أقرب كابتن لاستلام الطلب فور جهوزيته.</p>
                          </div>
                        )}
                      </div>

                      {/* Items / Prescription */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                        <span className="font-black text-slate-800 block">الأصناف المطلوبة للتحضير:</span>
                        {order.items && order.items.length > 0 ? (
                          <div className="divide-y divide-slate-200 text-slate-700 space-y-1 max-h-28 overflow-y-auto">
                            {order.items.map((it, idx) => (
                              <div key={idx} className="pt-1 flex items-center justify-between font-bold">
                                <span>{it.quantity}x {it.product.name} {it.selectedSize ? `(${it.selectedSize.name})` : ""}</span>
                                <span className="font-mono">{it.totalItemPrice.toLocaleString()} {currency}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 text-xs italic">طلب خاص / راشيتة طبية</p>
                        )}

                        {/* Prescription Info for Pharmacists & Doctors */}
                        {(order.prescriptionImage || order.prescriptionNotes) && (
                          <div className="mt-2 pt-2 border-t border-emerald-200 bg-emerald-50/60 p-2.5 rounded-xl space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-emerald-950 flex items-center gap-1">
                                <Pill className="w-3.5 h-3.5 text-emerald-600" />
                                <span>وصفة / راشيتة أدوية</span>
                              </span>
                              {order.prescriptionImage && (
                                <button
                                  type="button"
                                  onClick={() => setZoomedImage(order.prescriptionImage || null)}
                                  className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-md hover:bg-emerald-700 cursor-pointer flex items-center gap-1"
                                >
                                  <ZoomIn className="w-3 h-3" />
                                  <span>تكبير الراشيتة</span>
                                </button>
                              )}
                            </div>

                            {order.prescriptionNotes && (
                              <p className="text-slate-700 text-[11px] font-medium bg-white p-1.5 rounded-lg border border-emerald-100">
                                {order.prescriptionNotes}
                              </p>
                            )}

                            {order.prescriptionImage && (
                              <div 
                                onClick={() => setZoomedImage(order.prescriptionImage || null)}
                                className="relative rounded-lg overflow-hidden border border-emerald-300 bg-slate-900 h-24 cursor-pointer group"
                              >
                                <img
                                  src={order.prescriptionImage}
                                  alt="راشيتة"
                                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Store Action Button for Order Processing */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      {order.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => onUpdateOrderStatus(order.id, "accepted")}
                          className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs transition-all cursor-pointer"
                        >
                          قبول الطلب وبدء التحضير 🍳
                        </button>
                      )}

                      {(order.status === "accepted" || order.status === "preparing") && (
                        <button
                          type="button"
                          onClick={() => onUpdateOrderStatus(order.id, "picked_up")}
                          className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-xs transition-all cursor-pointer"
                        >
                          تسليم الطلب للكابتن 🛵
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Store Archive & Reports Tab */}
      {activeTab === "archive" && (
        <div className="space-y-4">
          {/* Filter & Summary Header */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-700">الفترة:</span>
              {[
                { id: "all", label: "كافة الطلبات" },
                { id: "today", label: "اليوم" },
                { id: "yesterday", label: "الأمس" },
                { id: "week", label: "آخر 7 أيام" }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setArchiveDateFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    archiveDateFilter === f.id
                      ? "bg-slate-900 text-white font-black shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleSendMerchantReportWhatsApp("regular")}
                className="py-2 px-3.5 bg-[#25D366] hover:bg-[#20ba56] text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                title="إرسال التقرير عبر واتساب العادي"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>واتساب 💬</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendMerchantReportWhatsApp("business")}
                className="py-2 px-3.5 bg-[#075E54] hover:bg-[#054a43] text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                title="إرسال التقرير عبر واتساب الأعمال"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>واتساب أعمال 💼</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة</span>
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-400 font-bold">إجمالي مبيعات المتجر</span>
              <p className="text-lg font-black text-emerald-600">
                {storeArchiveStats.deliveredTotal.toLocaleString()} <span className="text-xs font-bold text-slate-500">{currency}</span>
              </p>
            </div>
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-400 font-bold">الطلبات المسلمة بنجاح</span>
              <p className="text-lg font-black text-slate-900">
                {storeArchiveStats.deliveredCount} <span className="text-xs font-bold text-slate-400">طلب</span>
              </p>
            </div>
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-400 font-bold">إجمالي سجل الأرشيف</span>
              <p className="text-lg font-black text-orange-600">
                {archivedStoreOrders.length} <span className="text-xs font-bold text-slate-400">طلب</span>
              </p>
            </div>
          </div>

          {/* Archived Orders List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {archivedStoreOrders.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Archive className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-black text-slate-700">لا توجد طلبات مؤرشفة في الفترة المحددة</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <th className="py-3 px-4">رقم الطلب</th>
                      <th className="py-3 px-4">التاريخ والوقت</th>
                      <th className="py-3 px-4">الزبون</th>
                      <th className="py-3 px-4">الكابتن</th>
                      <th className="py-3 px-4">قيمة المبيعات</th>
                      <th className="py-3 px-4">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {archivedStoreOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-black font-mono">#{o.id.slice(-4)}</td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(o.createdAt).toLocaleString("ar-SY", {
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold">{o.customerName}</td>
                        <td className="py-3 px-4">
                          {o.driverName ? (
                            <span className="font-bold text-orange-700">🛵 {o.driverName}</span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">بدون كابتن</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900 whitespace-nowrap">
                          {o.subtotal?.toLocaleString()} {currency}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                              o.status === "delivered"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : o.status === "cancelled"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {o.status === "delivered" ? "مسلم 🟢" : o.status === "cancelled" ? "ملغي 🔴" : "نشط 🟡"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products & Offers Management Tab */}
      {activeTab === "products" && (
        <div className="space-y-5">
          {/* Header Bar with Product Creation Button */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-500" />
                <span>قائمة منتجات وأسعار وعروض متجرك</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                يمكنك إضافة منتجاتك وتحديث أسعارها وكميات المخزون وتفعيل العروض الخاصة. تخضع المنتجات الجديدة لموافقة الإدارة قبل العرض.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddProduct}
              className="py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة صنف أو منتج جديد 🍽️</span>
            </button>
          </div>

          {/* Product Filter Sub-tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setProductFilter("all")}
              className={`py-2 px-3.5 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap ${
                productFilter === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              كافة الأصناف ({storeProducts.length})
            </button>

            <button
              type="button"
              onClick={() => setProductFilter("approved")}
              className={`py-2 px-3.5 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                productFilter === "approved"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>معتمدة ومعروضة للزبائن ({approvedStoreProducts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setProductFilter("pending")}
              className={`py-2 px-3.5 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                productFilter === "pending"
                  ? "bg-amber-500 text-white shadow-xs"
                  : pendingStoreProducts.length > 0
                  ? "bg-amber-50 text-amber-800 border-2 border-amber-400 font-black animate-pulse"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>بانتظار موافقة الإدارة ({pendingStoreProducts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setProductFilter("offers")}
              className={`py-2 px-3.5 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                productFilter === "offers"
                  ? "bg-red-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>العروض والتخفيضات ({offersStoreProducts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setProductFilter("hidden")}
              className={`py-2 px-3.5 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                productFilter === "hidden"
                  ? "bg-amber-600 text-white shadow-xs"
                  : hiddenStoreProducts.length > 0
                  ? "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 font-black"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>المخفية لوجود إشكالية ({hiddenStoreProducts.length})</span>
            </button>
          </div>

          {/* Notice for Store Owner on approval policy */}
          {pendingStoreProducts.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-amber-900">
              <Info className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-black block">لديك ({pendingStoreProducts.length}) أصناف قيد مراجعة واعتماد الإدارة:</span>
                <span className="text-amber-800">
                  بمجرد مراجعتها من قبل المدير والموافقة عليها، ستظهر مباشرة لجميع أهالي القرية في قائمة متجرك.
                </span>
              </div>
            </div>
          )}

          {/* Products List Grid */}
          {displayedStoreProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Utensils className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-black text-sm text-slate-700">لا توجد منتجات مسجلة في هذا القسم</h4>
              <p className="text-xs text-slate-400">انقر على زر "إضافة صنف أو منتج جديد" لبدء تجهيز قائمتك وعروضك.</p>
              <button
                type="button"
                onClick={handleOpenAddProduct}
                className="py-2.5 px-5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أول صنف الآن 🍽️</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {displayedStoreProducts.map((prod) => {
                const isPending = prod.isApproved === false || prod.approvalStatus === "pending";
                const isRejected = prod.approvalStatus === "rejected";

                return (
                  <div
                    key={prod.id}
                    className={`bg-white rounded-3xl border p-4 shadow-xs space-y-3 flex flex-col justify-between transition-all ${
                      isPending
                        ? "border-amber-300 bg-amber-50/15"
                        : isRejected
                        ? "border-red-300 bg-red-50/15 opacity-75"
                        : "border-slate-200 hover:border-orange-300"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-100">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />

                        {/* Approval, Hidden, and Offer Status Badges */}
                        {prod.isHidden ? (
                          <span className="absolute top-2 right-2 bg-amber-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-amber-400">
                            <EyeOff className="w-3 h-3" />
                            <span>مخفي لوجود إشكالية 🙈</span>
                          </span>
                        ) : isPending ? (
                          <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3" />
                            <span>بانتظار موافقة الإدارة ⏳</span>
                          </span>
                        ) : isRejected ? (
                          <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                            مرفوض ✕
                          </span>
                        ) : prod.isOffer ? (
                          <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            <span>{prod.offerLabel || "عرض خاص 🔥"}</span>
                          </span>
                        ) : (
                          <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>معتمد وظاهر للزبائن ✓</span>
                          </span>
                        )}

                        {/* Stock badge */}
                        {prod.stock !== undefined && (
                          <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                            المتوفر: {prod.stock} {prod.unit || "قطعة"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-black text-slate-900 text-sm">{prod.name}</h4>
                        <div className="text-left shrink-0">
                          <span className="font-black text-sm text-orange-600 font-mono">
                            {(Number(prod.price) || 0).toLocaleString()} {currency}
                          </span>
                          {prod.isOffer && prod.originalPrice && (
                            <span className="block text-[10px] text-slate-400 line-through font-mono">
                              {(Number(prod.originalPrice) || 0).toLocaleString()} {currency}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2">{prod.description || "لا يوجد وصف"}</p>

                      {/* Rejection message if rejected */}
                      {isRejected && prod.rejectionReason && (
                        <div className="p-2 bg-red-50 rounded-xl border border-red-200 text-[11px] text-red-700 font-bold">
                          سبب الرفض: {prod.rejectionReason}
                        </div>
                      )}

                      {/* Sizes and Additions preview badges */}
                      {(prod.sizes || prod.additions || prod.unit) && (
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold text-slate-500 pt-1">
                          {prod.unit && (
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded-md border text-slate-700">
                              الوحدة: {prod.unit}
                            </span>
                          )}
                          {prod.sizes && (
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded-md border">
                              {prod.sizes.length} أحجام
                            </span>
                          )}
                          {prod.additions && (
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded-md border">
                              {prod.additions.length} إضافات
                            </span>
                          )}
                        </div>
                      )}

                      {/* Hidden Product Alert Banner */}
                      {prod.isHidden && (
                        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-300 text-[11px] text-amber-900 font-bold flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5">
                            <EyeOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>الصنف مخفي عن الزبائن لوجود إشكالية.</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleToggleHideProduct(prod, e)}
                            className="py-1 px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black cursor-pointer whitespace-nowrap shadow-2xs"
                          >
                            إظهار للزبائن 👁️
                          </button>
                        </div>
                      )}

                      {/* Stock & Sales Synchronization Bar */}
                      <div className="flex items-center justify-between text-[11px] font-bold p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`flex items-center gap-1 ${
                            prod.stock !== undefined && prod.stock <= 0 
                              ? "text-red-600 font-black" 
                              : prod.stock !== undefined && prod.stock <= 5 
                              ? "text-amber-600 font-black" 
                              : "text-emerald-700 font-bold"
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${prod.stock !== undefined && prod.stock <= 0 ? "bg-red-500" : prod.stock !== undefined && prod.stock <= 5 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                            المعروض: {prod.stock !== undefined ? `${prod.stock} ${prod.unit || "قطعة"}` : "غير محدد"}
                          </span>
                          {prod.soldCount && prod.soldCount > 0 ? (
                            <span className="text-slate-500 border-r pr-2 border-slate-300">
                              🔥 المباع: {prod.soldCount}
                            </span>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleQuickRestock(prod)}
                          className="text-[10px] text-orange-600 hover:text-orange-700 bg-white border border-orange-200 px-2 py-1 rounded-lg font-black transition-all shadow-2xs hover:bg-orange-50 cursor-pointer"
                        >
                          + تجديد الكمية
                        </button>
                      </div>
                    </div>

                    {/* Product Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditProduct(prod)}
                          className="py-1.5 px-2.5 bg-orange-50 hover:bg-orange-100 text-orange-600 font-black text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleToggleHideProduct(prod, e)}
                          className={`py-1.5 px-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-1 cursor-pointer ${
                            prod.isHidden
                              ? "bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                          title={prod.isHidden ? "الصنف مخفي حالياً - انقر لإظهاره للزبائن بعد تصحيح الإشكالية" : "إخفاء الصنف مؤقتاً عن الزبائن لوجود إشكالية"}
                        >
                          {prod.isHidden ? (
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

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف صنف "${prod.name}" من متجرك؟`)) {
                              onDeleteProduct(prod.id);
                            }
                          }}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all cursor-pointer"
                          title="حذف الصنف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Quick stock status interactive 1-click toggle */}
                      {(() => {
                        const isOutOfStock = prod.isAvailable === false || prod.inStock === false || (prod.stock !== undefined && prod.stock <= 0);
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              const nextAvailability = isOutOfStock;
                              onUpdateProduct({
                                ...prod,
                                isAvailable: nextAvailability,
                                inStock: nextAvailability,
                                stock: nextAvailability ? (prod.stock && prod.stock > 0 ? prod.stock : 50) : 0
                              });
                            }}
                            className={`px-2.5 py-1 rounded-xl font-black text-[11px] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs border ${
                              isOutOfStock
                                ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                            }`}
                            title="انقر لتغيير حالة التوفر الفوري للمنتج"
                          >
                            <span className={`w-2 h-2 rounded-full ${isOutOfStock ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`} />
                            <span>{isOutOfStock ? "نفذت الكمية ❌" : "متوفر للطلب ✅"}</span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Ticker Announcement Management Tab */}
      {activeTab === "ticker" && (
        <div className="space-y-5">
          {/* Header Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
                    <Megaphone className="w-5 h-5" />
                  </span>
                  <h3 className="font-black text-slate-900 text-base">
                    رسالة شريط العروض الإخباري لمتجرك
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  تظهر هذه الرسالة لجميع أهالي القرية والزبائن في الشريط الإخباري المتحرك أعلى الصفحة الرئيسية، مثل: ترقبوا العروض يوم كذا أو ترقبوا العرض الكبير يوم الخميس أو أي صيغة تختارها.
                </p>
              </div>

              {currentStore.tickerAnnouncement ? (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black shrink-0 flex items-center gap-1.5 self-start">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>معروض حالياً بالشريط 🟢</span>
                </span>
              ) : (
                <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-black shrink-0 self-start">
                  غير مفعل حالياً ⚪
                </span>
              )}
            </div>

            {/* Live Preview Box */}
            <div className="bg-slate-950 text-white p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold border-b border-slate-800 pb-2">
                <span>معاينة حية لشكل رسالتك في شريط الأخبار:</span>
                <span className="text-orange-400">شريط عروض التطبيق ⚡</span>
              </div>
              <div className="flex items-center gap-2 py-1 overflow-hidden">
                <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-lg text-xs font-black shrink-0">
                  {currentStore.name}
                </span>
                <span className="text-xs font-bold text-slate-200 truncate">
                  {tickerMessage.trim() || currentStore.tickerAnnouncement || "اكتب نص الإعلان الخاص بمتجرك ليظهر هنا في شريط الأخبار المتحرك..."}
                </span>
              </div>
            </div>

            {/* Input & Action Section */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-black text-slate-800">
                نص رسالة العرض أو الإعلان الترويجي لمتجرك:
              </label>
              <div className="relative">
                <textarea
                  value={tickerMessage}
                  onChange={(e) => setTickerMessage(e.target.value)}
                  placeholder="مثال: ترقبوا العرض الكبير يوم الخميس: اشتري وجبة عائلية واحصل على الثانية مجاناً!"
                  rows={3}
                  maxLength={180}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:bg-white focus:outline-hidden focus:border-orange-500 transition-all text-slate-800 leading-relaxed"
                />
                <span className="absolute bottom-2.5 left-3 text-[10px] text-slate-400 font-mono">
                  {tickerMessage.length}/180
                </span>
              </div>

              {/* Quick Preset Suggestions */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 block">
                  أو اختر نموذجاً سريعاً بنقرة واحدة:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "ترقبوا العرض الكبير يوم الخميس على كافة الأصناف المميزة! 🔥",
                    "ترقبوا العروض والتخفيضات الكبرى نهاية الأسبوع! 💥",
                    "ترقبوا وصول تشكيلة جديدة ومميزة بأسعار خاصة قريباً! ✨",
                    "اشتري 2 واحصل على الثالثة مجاناً لفترة محدودة! 🏷️",
                    "خصم خاص 20% لجميع زبائن التطبيق طيلة يوم الجمعة! 🎁"
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTickerMessage(preset);
                      }}
                      className="text-[11px] py-1.5 px-3 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-slate-200 rounded-xl transition-all cursor-pointer font-bold text-slate-700"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleSaveTickerMessage()}
                  className="py-3 px-6 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>حفظ وتحديث الشريط الإخباري فوراً 💾</span>
                </button>

                {currentStore.tickerAnnouncement && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("هل ترغب بمسح رسالتك من الشريط الإخباري؟")) {
                        handleSaveTickerMessage("");
                      }
                    }}
                    className="py-3 px-4 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 font-black text-xs rounded-xl transition-all cursor-pointer"
                  >
                    مسح الرسالة
                  </button>
                )}

                {tickerSavedSuccess && (
                  <span className="text-xs font-black text-emerald-600 flex items-center gap-1 animate-scale-in">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم حفظ وتحديث الشريط بنجاح! يظهر الآن لجميع الزبائن.</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal for Store Owner */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto pt-6 sm:pt-4 pb-48 sm:pb-6">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-xl w-full border border-slate-200 shadow-2xl space-y-4 text-right my-auto" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm sm:text-base">
                <Utensils className="w-5 h-5 text-orange-500" />
                <span>{editingProduct ? "تعديل صنف المتجر والأسعار 🍽️" : "إضافة صنف أو منتج جديد للمتجر 🍽️"}</span>
              </h3>
              <button 
                type="button"
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Notice to store owner */}
            {!editingProduct && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>ملاحظة هامة:</strong> عند حفظ هذا المنتج الجديد، سيتم إرساله مباشرة إلى إدارة التطبيق لمراجعته والموافقة عليه قبل ظهوره للزبائن في قائمة المتجر.
                </p>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700">اسم الصنف أو المنتج: *</label>
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="مثال: شاورما عربي دبل، كولا، جبنة بلدية..."
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">السعر ({currency}): *</label>
                  <input
                    type="number"
                    required
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="25000"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700">الوحدة:</label>
                  <select
                    value={productUnit}
                    onChange={(e) => setProductUnit(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-orange-500 text-xs"
                  >
                    <option value="قطعة">قطعة</option>
                    <option value="وجبة">وجبة</option>
                    <option value="كيلو">كيلو</option>
                    <option value="علبة">علبة</option>
                    <option value="طبق">طبق</option>
                    <option value="لتر">لتر</option>
                    <option value="كيس">كيس</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">عدد المنتجات / المخزون:</label>
                  <input
                    type="number"
                    value={productStock}
                    onChange={(e) => setProductStock(e.target.value)}
                    placeholder="الكمية المتوفرة (50)"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-orange-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">التصنيف:</label>
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-orange-500 text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Image Uploader */}
              <ImageUploader
                value={productImage}
                onChange={(val) => setProductImage(val)}
                label="صورة الوجبة أو المنتج"
                helperText="التقط صورة للمنتج بالكاميرا أو استورد صورته من المعرض أو اختر نموذجاً"
                aspectRatio="wide"
                presets={[
                  { label: "شاورما عربي", emoji: "🌯", url: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500&auto=format&fit=crop&q=60" },
                  { label: "برغر وبطاطا", emoji: "🍔", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60" },
                  { label: "بيتزا إيطالية", emoji: "🍕", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60" },
                  { label: "فروج مشوي", emoji: "🍗", url: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500&auto=format&fit=crop&q=60" },
                  { label: "مشروبات وعصير", emoji: "🥤", url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=60" },
                  { label: "منتجات بقالية", emoji: "🧀", url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60" }
                ]}
              />

              <div>
                <label className="block font-bold mb-1 text-slate-700">الوصف والمكونات:</label>
                <textarea
                  rows={2}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="اكتب وصفاً أو تفاصيل الصنف والمكونات لزبائنك..."
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500"
                />
              </div>

              {/* Special Offer / Discount Toggle */}
              <div className="bg-orange-50/50 p-3.5 rounded-2xl border border-orange-200 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOffer}
                    onChange={(e) => setIsOffer(e.target.checked)}
                    className="w-4 h-4 text-orange-500 rounded"
                  />
                  <span className="font-black text-orange-950">تفعيل كعرض خاص أو تخفيض مميز 🏷️</span>
                </label>

                {isOffer && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        السعر الأصلي قبل الخصم ({currency}):
                      </label>
                      <input
                        type="number"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        placeholder="مثال: 30000"
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        شارة العرض:
                      </label>
                      <input
                        type="text"
                        value={offerLabel}
                        onChange={(e) => setOfferLabel(e.target.value)}
                        placeholder="خصم 20%، وجبة مع مشروب..."
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Product Visibility / Hide Option for Store Owner */}
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productIsHidden}
                    onChange={(e) => setProductIsHidden(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span className="font-black text-amber-950 flex items-center gap-1.5">
                    <EyeOff className="w-4 h-4 text-amber-700" />
                    <span>إخفاء هذا الصنف مؤقتاً عن الزبائن (لوجود خطأ أو إشكالية)</span>
                  </span>
                </label>
                <p className="text-[11px] text-amber-800 pr-6">
                  عند تحديد هذا الخيار، لن يظهر المنتج في قائمة المتجر للزبائن حتى تقوم بإلغاء التحديد بعد تصحيح الخطأ.
                </p>
              </div>

              {/* Sizes (الأحجام والمقاسات) */}
              <div className="bg-slate-50 p-3 rounded-2xl border space-y-2">
                <h4 className="font-black text-slate-800">الأحجام والمقاسات (اختياري):</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sizeName}
                    onChange={(e) => setSizeName(e.target.value)}
                    placeholder="اسم الحجم (صغير، عائلي..)"
                    className="flex-1 py-1.5 px-3 bg-white border rounded-xl"
                  />
                  <input
                    type="number"
                    value={sizePrice}
                    onChange={(e) => setSizePrice(e.target.value)}
                    placeholder="فارق السعر (+ل.س)"
                    className="w-28 py-1.5 px-3 bg-white border rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleAddSize}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-xl font-black cursor-pointer"
                  >
                    إضافة
                  </button>
                </div>

                {sizes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {sizes.map((sz, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 bg-white border px-2.5 py-1 rounded-xl text-[11px] font-bold"
                      >
                        <span>
                          {sz.name} (+{sz.price} {currency})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(i)}
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Additions (الإضافات والخيارات) */}
              <div className="bg-slate-50 p-3 rounded-2xl border space-y-2">
                <h4 className="font-black text-slate-800">الإضافات والخيارات الإضافية (اختياري):</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={additionName}
                    onChange={(e) => setAdditionName(e.target.value)}
                    placeholder="اسم الإضافة (جبنة إضافية..)"
                    className="flex-1 py-1.5 px-3 bg-white border rounded-xl"
                  />
                  <input
                    type="number"
                    value={additionPrice}
                    onChange={(e) => setAdditionPrice(e.target.value)}
                    placeholder="السعر (+ل.س)"
                    className="w-28 py-1.5 px-3 bg-white border rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleAddAddition}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-xl font-black cursor-pointer"
                  >
                    إضافة
                  </button>
                </div>

                {additions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {additions.map((ad, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 bg-white border px-2.5 py-1 rounded-xl text-[11px] font-bold"
                      >
                        <span>
                          {ad.name} (+{ad.price} {currency})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAddition(i)}
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingProduct ? "حفظ تعديلات الصنف ✓" : "إرسال الصنف للمراجعة والاعتماد 📤"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescription Image Zoom Modal */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
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
                <Pill className="w-4 h-4 text-emerald-400" />
                <span>معاينة صورة الراشيتة الطبية المكبرة</span>
              </span>
              <span className="text-[11px] text-slate-400">انقر خارج الإطار للإغلاق</span>
            </div>
            <div className="w-full overflow-auto flex items-center justify-center max-h-[75vh]">
              <img
                src={zoomedImage}
                alt="راشيتة أدوية مكبرة"
                className="max-w-full max-h-[75vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
      {/* Universal Bottom Navigation for Store Owner */}
      <BottomNavigation
        userRole="store_owner"
        activeTab={activeTab}
        onNavigateHome={() => setActiveTab("orders")}
        onSelectRoleTab={(tab) => setActiveTab(tab as any)}
        onOpenAccount={() => setShowAccountModal(true)}
        activeOrdersCount={storeOrders.filter(
          (o) => o.status === "pending" || o.status === "accepted" || o.status === "preparing"
        ).length}
        userName={userProfile.name}
      />

      {/* Account Settings Modal */}
      {showAccountModal && (
        <AccountSettingsModal
          isOpen={showAccountModal}
          onClose={() => setShowAccountModal(false)}
          userRole="store_owner"
          userProfile={userProfile}
          currentStore={currentStore}
          onUpdateProfile={handleProfileUpdate}
          onLogout={onLogout}
        />
      )}
    </div>
  );
};
