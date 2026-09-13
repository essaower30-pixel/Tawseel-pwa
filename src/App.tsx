import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  ShoppingCart,
  Store as StoreIcon,
  Search,
  MapPin,
  Sparkles,
  ArrowLeft,
  LogOut,
  Star,
  Clock,
  Send,
  Flame,
  ShieldCheck,
  Bike,
  LogIn,
  Utensils,
  Pill,
  Leaf,
  CakeSlice,
  Stethoscope,
  Wrench,
  Car,
  QrCode,
  Share2,
  Copy,
  Check,
  Tag,
  MessageSquare,
  AlertTriangle,
  Lock,
  Plus,
  Minus,
  Compass,
  Smartphone,
  Phone,
  Archive,
  Volume2,
  VolumeX,
  Bell,
  CheckCircle2,
  User,
  Bot
} from "lucide-react";
import { CartItem, Category, DriverMember, MapNode, Order, Product, Store, StoreAddition, StoreSize, UserProfile, StoreBroadcast, StoreReview, Coupon } from "./types";
import { initialCategories, initialMapNodes, initialProducts, initialStores, initialStoreBroadcasts, initialStoreReviews } from "./data/initialData";
import { initialDrivers, initialOrders, initialCoupons, initialStaff } from "./data/adminInitialData";
import { AuthModal } from "./components/AuthModal";
import { StoreDetails } from "./components/StoreDetails";
import { CartCheckout } from "./components/CartCheckout";
import { OrderTracker } from "./components/OrderTracker";
const Dashboard = React.lazy(() => import("./components/Dashboards").then((m) => ({ default: m.Dashboard })));
const DriverPortal = React.lazy(() => import("./components/DriverPortal").then((m) => ({ default: m.DriverPortal })));
const StoreOwnerPortal = React.lazy(() => import("./components/StoreOwnerPortal").then((m) => ({ default: m.StoreOwnerPortal })));
import { CustomerOrdersArchiveModal } from "./components/CustomerOrdersArchiveModal";
import { InstallPromptModal } from "./components/InstallPromptModal";
import { CustomStoreOrderModal } from "./components/CustomStoreOrderModal";
import { BottomNavigation } from "./components/BottomNavigation";
import { StoreNewsTicker } from "./components/StoreNewsTicker";
import { AccountSettingsModal } from "./components/AccountSettingsModal";
import { ToastNotification, ToastItem } from "./components/ToastNotification";
import { OfflineBanner } from "./components/OfflineBanner";
import { openWhatsApp } from "./utils/whatsapp";
import {
  playOrderAlertSound,
  isSoundEnabled,
  setSoundEnabled,
  showSystemNotification,
  requestNotificationPermission,
  getOrderBroadcastChannel,
  broadcastNewOrder,
  getSoundType,
  setSoundType,
  triggerOrderVibration,
  flashTabTitle,
  SoundType
} from "./utils/soundNotifications";
import { initHistoryProtection, handleAppBackButton } from "./utils/historyManager";
import { 
  getLatestUpdate, 
  hasPendingUpdate, 
  acknowledgeUpdate, 
  subscribeToUpdates, 
  AppUpdateInfo 
} from "./utils/updateManager";
import { AppUpdateModal } from "./components/AppUpdateModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import {
  ensureInitialStoresPreserved,
  ensureInitialProductsPreserved,
  ensureInitialDriversPreserved,
  fetchServerSync,
  registerStoreOnServer,
  approveStoreOnServer,
  updateStoreOnServer,
  deleteStoreOnServer,
  saveOrderOnServer,
  updateOrderOnServer,
  saveProductOnServer,
  updateProductOnServer,
  deleteProductOnServer,
  saveDriverOnServer,
  updateDriverOnServer,
  deleteDriverOnServer,
  saveCategoryOnServer,
  reorderCategoriesOnServer,
  deleteCategoryOnServer,
  cleanSlateOnServer,
  restoreDefaultsOnServer
} from "./utils/apiSync";
import {
  seedInitialFirestoreData,
  subscribeToOrders,
  subscribeToStores,
  subscribeToProducts,
  subscribeToDrivers,
  subscribeToReviews,
  subscribeToBroadcasts,
  saveOrderToFirestore,
  updateOrderStatusInFirestore,
  saveStoreToFirestore,
  deleteStoreFromFirestore,
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveDriverToFirestore,
  deleteDriverFromFirestore,
  saveCategoryToFirestore,
  syncCategoriesToFirestore,
  subscribeToCategories,
  deleteCategoryFromFirestore,
  saveReviewToFirestore,
  saveBroadcastToFirestore,
  cleanSlateFirestore,
  reseedFirestoreDemoData
} from "./services/firebaseService";
import { testFirestoreConnection } from "./firebase";
import { CategoryIcon } from "./components/CategoryIcon";
import { getAppUrl, getShareTemplates } from "./utils/appUrl";

export { getAppUrl };

export default function App() {
  // Global State with LocalStorage Persistence
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem("tw_cart_items");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isViewingCart, setIsViewingCart] = useState<boolean>(() => {
    return localStorage.getItem("tw_viewing_cart") === "true";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Data State
  const [stores, setStores] = useState<Store[]>(() => {
    const raw = localStorage.getItem("tw_stores");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const cleaned = ensureInitialStoresPreserved(parsed).map((st: Store) => {
          let cat = st.category;
          if (cat === "cat_mtuj2s13ho2" || cat === "ألبسة وملابس وأزياء") {
            cat = "clothes";
          }
          // Clear legacy dummy ticker announcements so only genuine owner-added announcements appear
          if (
            st.tickerAnnouncement &&
            (st.tickerAnnouncement.includes("وجبة شاورما دبل مجانية") ||
             st.tickerAnnouncement.includes("اشتري 2 بيتزا حجم كبير") ||
             st.tickerAnnouncement.includes("المواد التموينية والزيوت") ||
             st.tickerAnnouncement.includes("مستحضرات العناية الطبيعية") ||
             st.tickerAnnouncement.includes("سلات فواكه الموسم") ||
             st.tickerAnnouncement.includes("مهرجان الكنافة النابلسية"))
          ) {
            const { tickerAnnouncement, ...rest } = st;
            return { ...rest, category: cat } as Store;
          }
          return { ...st, category: cat };
        });
        return cleaned;
      } catch (e) {}
    }
    return ensureInitialStoresPreserved([]);
  });

  // Always start with null so fresh app launches show all stores in the marketplace
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const [products, setProducts] = useState<Product[]>(() => {
    const raw = localStorage.getItem("tw_products");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return ensureInitialProductsPreserved(parsed);
      } catch (e) {}
    }
    return ensureInitialProductsPreserved([]);
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const raw = localStorage.getItem("tw_categories");
    const rawDeleted = localStorage.getItem("tw_deleted_category_ids");
    let deletedIds: string[] = ["cat_mtuj2s13ho2"];
    if (rawDeleted) {
      try {
        const parsed = JSON.parse(rawDeleted);
        if (Array.isArray(parsed)) {
          deletedIds = Array.from(new Set([...deletedIds, ...parsed]));
        }
      } catch (e) {}
    }

    let baseList = initialCategories.filter((c) => !deletedIds.includes(c.id));
    if (raw) {
      try {
        const parsed: Category[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((c) => c.id));
          const missingDefaults = initialCategories.filter((ic) => !existingIds.has(ic.id) && !deletedIds.includes(ic.id));
          baseList = [...parsed, ...missingDefaults].filter((c) => !deletedIds.includes(c.id));
        }
      } catch (e) {}
    }

    // Filter out obsolete alias "ألبسة وملابس وأزياء" if "clothes" (ملابس وازياء) is present
    baseList = baseList.filter((c) => c.id !== "cat_mtuj2s13ho2" && c.label !== "ألبسة وملابس وأزياء");

    // Automatically migrate any stale "ألبسة وأزياء" in cached local storage to "ملابس وازياء"
    baseList = baseList.map((c) =>
      c.id === "clothes" && (c.label === "ألبسة وأزياء" || c.label === "ألبسة وازياء")
        ? { ...c, label: "ملابس وازياء" }
        : c
    );
    const hasOffers = baseList.some((c) => c.id === "offers");
    return hasOffers ? baseList : [{ id: "offers", label: "العروض الحالية", icon: "Flame" }, ...baseList];
  });

  useEffect(() => {
    localStorage.setItem("tw_categories", JSON.stringify(categories));
  }, [categories]);

  const [mapNodes, setMapNodes] = useState<MapNode[]>(() => {
    const raw = localStorage.getItem("tw_map_nodes");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize nodes to guarantee clear Arabic titles
          return parsed.map((n: MapNode) => {
            const match = initialMapNodes.find((im) => im.id === n.id);
            const arabicName = n.arabicName || (match ? match.arabicName : n.name);
            return {
              ...n,
              name: arabicName,
              arabicName: arabicName
            };
          });
        }
      } catch (e) {
        console.error("Failed to parse map nodes", e);
      }
    }
    return initialMapNodes;
  });

  // User & Role State
  const [userRole, setUserRole] = useState<"guest" | "customer" | "store_owner" | "admin" | "driver">(() => {
    try {
      return (localStorage.getItem("tw_user_role") as any) || "customer";
    } catch {
      return "customer";
    }
  });

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showCustomerArchiveModal, setShowCustomerArchiveModal] = useState<boolean>(false);

  const [currentStoreId, setCurrentStoreId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("tw_current_store_id") || null;
    } catch {
      return null;
    }
  });

  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("tw_viewing_admin");
      const role = localStorage.getItem("tw_user_role");
      return role === "admin" && raw === "true";
    } catch {
      return false;
    }
  });

  const [isDriverMode, setIsDriverMode] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("tw_viewing_driver");
      const role = localStorage.getItem("tw_user_role");
      return role === "driver" && raw === "true";
    } catch {
      return false;
    }
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem("tw_customer_user") || localStorage.getItem("tw_user_profile");
      return raw ? JSON.parse(raw) : { name: "زائر متسوق", phone: "09xxxxxxxx", pin: "1234" };
    } catch {
      return { name: "زائر متسوق", phone: "09xxxxxxxx", pin: "1234" };
    }
  });

  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);

  // Global Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const saved = localStorage.getItem("tw_coupons");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialCoupons;
  });

  useEffect(() => {
    localStorage.setItem("tw_coupons", JSON.stringify(coupons));
  }, [coupons]);

  const handleUpdateUserProfile = async (updatedProfile: UserProfile, extraData?: any) => {
    setUserProfile(updatedProfile);
    localStorage.setItem("tw_user_profile", JSON.stringify(updatedProfile));
    localStorage.setItem("tw_customer_user", JSON.stringify(updatedProfile));

    if (userRole === "driver" || extraData?.driverVehicle) {
      setDriversList((prev) => {
        const next = prev.map((d) =>
          d.phone === updatedProfile.phone || d.name === updatedProfile.name
            ? {
                ...d,
                name: updatedProfile.name,
                phone: updatedProfile.phone,
                pin: updatedProfile.pin,
                vehicle: extraData?.driverVehicle || d.vehicle
              }
            : d
        );
        localStorage.setItem("tw_drivers_list", JSON.stringify(next));
        localStorage.setItem("tw_drivers", JSON.stringify(next));
        return next;
      });
    }

    if (userRole === "store_owner" || extraData?.storeName) {
      setStores((prev) => {
        const next = prev.map((s) =>
          s.id === currentStoreId || s.ownerPhone === updatedProfile.phone
            ? {
                ...s,
                name: extraData?.storeName || s.name,
                ownerName: updatedProfile.name,
                ownerPhone: updatedProfile.phone,
                ownerPin: updatedProfile.pin,
                contactPhone: updatedProfile.phone || s.contactPhone,
                workingHours: extraData?.storeHours || s.workingHours
              }
            : s
        );
        localStorage.setItem("tw_stores", JSON.stringify(next));
        return next;
      });
    }

    addToastNotification({
      title: "تم حفظ وتحديث بيانات حسابك بنجاح ✅",
      message: `الاسم: ${updatedProfile.name} • الهاتف: ${updatedProfile.phone} • تم مزامنة البيانات عبر الحسابات`,
      type: "success"
    });
  };

  // Admin PIN Gate Modal
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");
  const [adminPinError, setAdminPinError] = useState("");
  const ADMIN_SECRET_PIN = "1234";

  // Drivers Fleet State
  const [driversList, setDriversList] = useState<DriverMember[]>(() => {
    try {
      const raw = localStorage.getItem("tw_drivers_list") || localStorage.getItem("tw_drivers");
      const parsed = raw ? JSON.parse(raw) : initialDrivers;
      return ensureInitialDriversPreserved(parsed);
    } catch {
      return initialDrivers;
    }
  });

  // Active Order State
  const [activeOrder, setActiveOrder] = useState<Order | null>(() => {
    try {
      const raw = localStorage.getItem("tw_active_order");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  const [allOrders, setAllOrders] = useState<Order[]>(() => {
    try {
      const raw = localStorage.getItem("tw_orders_list") || localStorage.getItem("tw_all_orders");
      return raw ? JSON.parse(raw) : initialOrders;
    } catch {
      return initialOrders;
    }
  });

  const [selectedLandmark, setSelectedLandmark] = useState<string>(() => {
    return "دوار الساعة (وسط البلد)";
  });
  const [emergencyRush, setEmergencyRush] = useState<boolean>(() => {
    return localStorage.getItem("tw_emergency_rush") === "true";
  });

  // Keep navigation & active view state in sync with localStorage across page refreshes
  useEffect(() => {
    if (selectedCategory) {
      localStorage.setItem("tw_selected_category", selectedCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedStore) {
      localStorage.setItem("tw_selected_store_id", selectedStore.id);
    } else {
      localStorage.removeItem("tw_selected_store_id");
    }
  }, [selectedStore]);

  useEffect(() => {
    localStorage.setItem("tw_viewing_cart", String(isViewingCart));
  }, [isViewingCart]);

  useEffect(() => {
    localStorage.setItem("tw_viewing_admin", String(isAdminMode));
  }, [isAdminMode]);

  useEffect(() => {
    localStorage.setItem("tw_viewing_driver", String(isDriverMode));
  }, [isDriverMode]);

  useEffect(() => {
    if (currentStoreId) {
      localStorage.setItem("tw_current_store_id", currentStoreId);
    } else {
      localStorage.removeItem("tw_current_store_id");
    }
  }, [currentStoreId]);

  // Sound & Toast Notifications State
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    try {
      return isSoundEnabled();
    } catch {
      return true;
    }
  });
  const [soundChoice, setSoundChoice] = useState<SoundType>(() => {
    try {
      return getSoundType();
    } catch {
      return "chime";
    }
  });
  const [showSoundModal, setShowSoundModal] = useState<boolean>(false);
  const [hasNotifPermission, setHasNotifPermission] = useState<boolean>(() => {
    try {
      return typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted";
    } catch {
      return false;
    }
  });

  // Notification deduplication tracking refs to prevent re-alerting or looping
  const notifiedPendingStoresRef = useRef<Set<string>>(
    (() => {
      try {
        const raw = typeof window !== "undefined" ? localStorage.getItem("tw_notified_pending_store_ids") : null;
        const list = raw ? JSON.parse(raw) : [];
        return new Set<string>(["store-gypsum-board", "store_gypsum_decor", ...list]);
      } catch {
        return new Set<string>(["store-gypsum-board", "store_gypsum_decor"]);
      }
    })()
  );
  const notifiedOrdersRef = useRef<Set<string>>(new Set(initialOrders.map((o) => o.id)));
  const isInitialLoadDoneRef = useRef<boolean>(false);

  const addToastNotification = useCallback((toast: Omit<ToastItem, "id" | "createdAt">) => {
    setToasts((prev) => {
      // Prevent duplicate notification stacking if one with same title & message already exists
      const isAlreadyShowing = prev.some(
        (t) => t.title === toast.title && t.message === toast.message
      );
      if (isAlreadyShowing) {
        return prev;
      }
      const newToast: ToastItem = {
        ...toast,
        id: "toast-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
        createdAt: Date.now(),
      };
      
      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts((curr) => curr.filter((t) => t.id !== newToast.id));
      }, 6000);

      // Keep maximum 2 toasts on screen simultaneously to prevent layout clutter
      return [newToast, ...prev.slice(0, 1)];
    });
  }, []);

  const handleDismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleDismissAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Store Broadcasts State (تنبيهات الإدارة الجماعية لأصحاب المتاجر)
  const [storeBroadcasts, setStoreBroadcasts] = useState<StoreBroadcast[]>(() => {
    const raw = localStorage.getItem("tw_store_broadcasts");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialStoreBroadcasts;
  });

  useEffect(() => {
    localStorage.setItem("tw_store_broadcasts", JSON.stringify(storeBroadcasts));
  }, [storeBroadcasts]);

  const handleSendBroadcast = (broadcast: StoreBroadcast) => {
    setStoreBroadcasts((prev) => [broadcast, ...prev]);
    saveBroadcastToFirestore(broadcast);
    addToastNotification({
      title: "تم بث التنبيه الجماعي للمتاجر 📢",
      message: `تم إرسال: "${broadcast.title}" بنجاح`,
      type: "success"
    });
  };

  const handleDeleteBroadcast = (id: string) => {
    setStoreBroadcasts((prev) => prev.filter((b) => b.id !== id));
    addToastNotification({
      title: "تم حذف التعميم",
      message: "تمت إزالة التنبيه من سجل المتاجر",
      type: "info"
    });
  };

  const handleResendBroadcast = (broadcast: StoreBroadcast) => {
    const updated: StoreBroadcast = {
      ...broadcast,
      id: `bc_${Date.now()}`,
      createdAt: new Date().toISOString(),
      readBy: []
    };
    setStoreBroadcasts((prev) => [updated, ...prev]);
    saveBroadcastToFirestore(updated);
    addToastNotification({
      title: "تمت إعادة بث التنبيه 🔄",
      message: `تم إرسال إشعار فوري جديد للمتاجر المستهدفة`,
      type: "success"
    });
  };

  const handleAcknowledgeBroadcast = (broadcastId: string) => {
    const targetStoreId = currentStoreId || userProfile?.storeId;
    if (!targetStoreId) return;

    setStoreBroadcasts((prev) =>
      prev.map((bc) => {
        if (bc.id === broadcastId) {
          const currentRead = bc.readBy || [];
          if (!currentRead.includes(targetStoreId)) {
            const updated = { ...bc, readBy: [...currentRead, targetStoreId] };
            saveBroadcastToFirestore(updated);
            return updated;
          }
        }
        return bc;
      })
    );
    addToastNotification({
      title: "تم تأكيد استلام التعميم ✓",
      message: "تم حفظ تأكيد القراءة لدى إدارة التطبيق",
      type: "success"
    });
  };

  // Store Reviews & Ratings State (نظام تقييم المتاجر وآراء الزبائن)
  const [reviews, setReviews] = useState<StoreReview[]>(() => {
    const raw = localStorage.getItem("tw_store_reviews");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialStoreReviews;
  });

  useEffect(() => {
    localStorage.setItem("tw_store_reviews", JSON.stringify(reviews));
  }, [reviews]);

  const handleAddReview = (newRev: Omit<StoreReview, "id" | "createdAt">) => {
    try {
      // Rating is optional and handles 0: if empty or 0, accepted as 0
      const rawR = Number(newRev.rating);
      const finalRating = (newRev.rating === 0 || isNaN(rawR)) ? 0 : Math.max(0, Math.min(5, Math.round(rawR)));
      const review: StoreReview = {
        ...newRev,
        id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        orderId: newRev.orderId || `direct_review_${Date.now()}`,
        rating: finalRating,
        createdAt: new Date().toISOString()
      };

      setReviews((prev) => [review, ...(prev || []).filter((r) => r && r.id !== review.id)]);
      saveReviewToFirestore(review).catch((err) => console.warn("Firestore saveReview error:", err));

      // Dynamically calculate and update the store's average rating and count
      setStores((prevStores) => {
        return (prevStores || []).map((st) => {
          if (!st) return st;
          if (st.id === review.storeId || (st.name && review.storeName && st.name === review.storeName)) {
            const currentStoreReviews = (reviews || []).filter(
              (r) => r && (r.storeId === st.id || (st.name && r.storeName === st.name))
            );
            const storeReviews = [...currentStoreReviews, review];
            const ratedReviews = storeReviews.filter((r) => r && typeof r.rating === "number" && r.rating > 0);
            let newAvg = 0;
            if (ratedReviews.length > 0) {
              const sum = ratedReviews.reduce((acc, curr) => acc + Number(curr.rating), 0);
              newAvg = Number((sum / ratedReviews.length).toFixed(1));
            } else {
              newAvg = 0;
            }
            const updatedStore: Store = {
              ...st,
              rating: newAvg,
              ratingCount: storeReviews.length
            };
            saveStoreToFirestore(updatedStore).catch((err) => console.warn("Firestore saveStore error:", err));
            return updatedStore;
          }
          return st;
        });
      });

      addToastNotification({
        title: "شكراً لتقييمك! ⭐",
        message: `تم إضافة تقييمك لـ (${review.storeName || "صاحب المهنة/المتجر"}) بنجاح.`,
        type: "success"
      });
    } catch (err) {
      console.error("Error in handleAddReview:", err);
    }
  };

  // App Update & Feature Releases State (إشعار التحديث الجديد للمستخدمين)
  const [hasNewUpdate, setHasNewUpdate] = useState<boolean>(() => hasPendingUpdate());
  const [currentAppUpdate, setCurrentAppUpdate] = useState<AppUpdateInfo>(() => getLatestUpdate());
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [showHomeCustomOrderModal, setShowHomeCustomOrderModal] = useState<boolean>(false);

  useEffect(() => {
    const checkUpdates = () => {
      setHasNewUpdate(hasPendingUpdate());
      setCurrentAppUpdate(getLatestUpdate());
    };
    checkUpdates();
    const unsubscribe = subscribeToUpdates(checkUpdates);
    return () => unsubscribe();
  }, []);

  const handleApplyUpdate = async () => {
    acknowledgeUpdate(currentAppUpdate.id);
    setHasNewUpdate(false);
    setShowUpdateModal(false);
    if (typeof window !== "undefined") {
      if ("caches" in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        } catch (e) {
          console.warn("Cache delete:", e);
        }
      }
      if ("serviceWorker" in navigator) {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const reg of regs) {
            await reg.unregister();
          }
        } catch (e) {
          console.warn("SW unregister:", e);
        }
      }
      window.location.reload();
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    setSoundEnabled(next);
    if (next) {
      playOrderAlertSound(soundChoice);
    }
  };

  const handleSelectSoundType = (type: SoundType) => {
    setSoundChoice(type);
    setSoundType(type);
    playOrderAlertSound(type);
  };

  const handleRequestNotifPermission = async () => {
    const granted = await requestNotificationPermission();
    setHasNotifPermission(granted);
    if (granted) {
      showSystemNotification("تم تفعيل تنبيهات الطلبات 🔔", {
        body: "ستتلقى إشعارات فورية عند وصول أي طلب جديد حتى عند إغلاق أو تصغير الشاشة."
      });
    }
  };

  const handleViewToastOrder = useCallback((order: Order) => {
    if (isAdminMode || userRole === "admin") {
      setIsAdminMode(true);
      setIsDriverMode(false);
      setSelectedStore(null);
      setIsViewingCart(false);
    } else if (isDriverMode || userRole === "driver") {
      setIsDriverMode(true);
      setIsAdminMode(false);
      setSelectedStore(null);
      setIsViewingCart(false);
    } else if (currentStoreId) {
      // already in merchant view
    } else {
      setActiveOrder(order);
      setSelectedStore(null);
      setIsViewingCart(false);
    }
  }, [isAdminMode, isDriverMode, userRole, currentStoreId]);

  // Setup Back Button & PopState Protection to keep app running and handle navigation
  useEffect(() => {
    initHistoryProtection();

    const onPopState = () => {
      const hasOpenModal = 
        showAuthModal || 
        showCustomerArchiveModal || 
        showAdminPinModal || 
        showSoundModal || 
        showUpdateModal ||
        showHomeCustomOrderModal;

      const closeModal = () => {
        setShowAuthModal(false);
        setShowCustomerArchiveModal(false);
        setShowAdminPinModal(false);
        setShowSoundModal(false);
        setShowUpdateModal(false);
        setShowHomeCustomOrderModal(false);
      };

      handleAppBackButton({
        hasOpenModal,
        closeModal,
        isViewingCart,
        closeCart: () => setIsViewingCart(false),
        hasSelectedStore: !!selectedStore,
        closeStore: () => setSelectedStore(null),
        hasActiveOrder: !!activeOrder,
        closeActiveOrder: () => setActiveOrder(null),
        isAdminMode,
        isDriverMode,
        currentStoreOwnerId: currentStoreId,
        selectedCategory,
        resetCategory: () => setSelectedCategory("all"),
      }, (msg) => {
        addToastNotification({
          order: { id: "tw-live", storeId: "", storeName: "توصيل القرية", items: [], subtotal: 0, deliveryFee: 0, total: 0, status: "pending", createdAt: new Date().toISOString(), customerName: "", customerPhone: "", addressLandmark: "" },
          title: "تطبيق توصيل القرية 🛵",
          message: msg,
          type: "info"
        });
      });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [
    showAuthModal,
    showCustomerArchiveModal,
    showAdminPinModal,
    showSoundModal,
    showUpdateModal,
    showHomeCustomOrderModal,
    activeOrder,
    isViewingCart,
    selectedStore,
    selectedCategory,
    isAdminMode,
    isDriverMode,
    currentStoreId,
    addToastNotification
  ]);

  // Real-time Cross-Window & Same-Window Order Broadcast Listener
  useEffect(() => {
    const recentHandledOrders = new Set<string>();

    const handleOrderEvent = (order: Order) => {
      // Prevent duplicate sounds/toasts for the same order within 3 seconds
      if (recentHandledOrders.has(order.id)) return;
      recentHandledOrders.add(order.id);
      setTimeout(() => recentHandledOrders.delete(order.id), 4000);

      // Play ringing alert sound for incoming orders
      playOrderAlertSound("ringtone");
      triggerOrderVibration();
      flashTabTitle(`🔔 (طلب جديد #${order.id})`);

      // Determine role-tailored title & message
      let toastTitle = "وصول طلب جديد إلى النظام! 🛍️";
      let toastMessage = `طلب #${order.id} وارد إلى (${order.storeName}) من الزبون ${order.customerName} بقيمة ${order.total.toLocaleString()} ل.س`;

      if (isAdminMode || userRole === "admin") {
        toastTitle = "🔔 طلب جديد وارد للإدارة!";
        toastMessage = `طلب #${order.id} من الزبون ${order.customerName} إلى (${order.storeName}) - الإجمالي: ${order.total.toLocaleString()} ل.س`;
      } else if (currentStoreId && order.storeId === currentStoreId) {
        toastTitle = "🏪 طلب جديد وارد لمتجرك!";
        toastMessage = `طلب جديد #${order.id} بقيمة ${order.total.toLocaleString()} ل.س من الزبون ${order.customerName}`;
      } else if (isDriverMode || userRole === "driver") {
        toastTitle = "🛵 طلب توصيل جديد متاح للكابتن!";
        toastMessage = `طلب #${order.id} من (${order.storeName}) جاهز للاستلام والتوصيل إلى (${order.addressLandmark || "القرية"})`;
      }

      // Show system notification if browser is in background
      showSystemNotification(toastTitle, {
        body: `متجر: ${order.storeName} | الزبون: ${order.customerName} | الإجمالي: ${order.total} ل.س`,
      });

      // Show in-app Toast
      addToastNotification({
        order,
        title: toastTitle,
        message: toastMessage,
        type: "new_order",
        targetRole: "all"
      });

      // Update allOrders state if not already included
      setAllOrders((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });
    };

    // 1. Same-window custom event listener
    const onCustomOrderEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.order) {
        handleOrderEvent(customEvent.detail.order);
      }
    };
    window.addEventListener("tw_new_order_event", onCustomOrderEvent);

    // 2. Cross-tab BroadcastChannel listener
    const channel = getOrderBroadcastChannel();
    if (channel) {
      channel.onmessage = (event) => {
        if (event.data && event.data.type === "NEW_ORDER" && event.data.order) {
          handleOrderEvent(event.data.order);
        }
      };
    }

    // 3. Storage event listener (universal fallback across all browser tabs)
    const onStorageEvent = (e: StorageEvent) => {
      if (e.key === "tw_last_broadcast_order" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.order) {
            handleOrderEvent(parsed.order);
          }
        } catch {}
      }
    };
    window.addEventListener("storage", onStorageEvent);

    return () => {
      window.removeEventListener("tw_new_order_event", onCustomOrderEvent);
      window.removeEventListener("storage", onStorageEvent);
      if (channel) {
        channel.onmessage = null;
      }
    };
  }, [addToastNotification, isAdminMode, isDriverMode, userRole, currentStoreId]);

  // Auto-scroll to top on view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedStore, isViewingCart, activeOrder, isAdminMode, isDriverMode]);

  // Synchronize Storage
  useEffect(() => {
    localStorage.setItem("tw_stores", JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    localStorage.setItem("tw_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("tw_categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("tw_map_nodes", JSON.stringify(mapNodes));
  }, [mapNodes]);

  useEffect(() => {
    localStorage.setItem("tw_cart_items", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem("tw_drivers_list", JSON.stringify(driversList));
      localStorage.setItem("tw_drivers", JSON.stringify(driversList));
    } catch {}
  }, [driversList]);

  useEffect(() => {
    localStorage.setItem("tw_viewing_admin", String(isAdminMode));
  }, [isAdminMode]);

  useEffect(() => {
    localStorage.setItem("tw_viewing_driver", String(isDriverMode));
  }, [isDriverMode]);

  useEffect(() => {
    if (currentStoreId) {
      localStorage.setItem("tw_current_store_id", currentStoreId);
    } else {
      localStorage.removeItem("tw_current_store_id");
    }
  }, [currentStoreId]);

  useEffect(() => {
    if (activeOrder) {
      localStorage.setItem("tw_active_order", JSON.stringify(activeOrder));
    } else {
      localStorage.removeItem("tw_active_order");
    }
  }, [activeOrder]);

  useEffect(() => {
    localStorage.setItem("tw_orders_list", JSON.stringify(allOrders));
  }, [allOrders]);

  // Dynamic Live Sync: Keep active customer order updated with assigned driver & status in real-time
  useEffect(() => {
    if (activeOrder) {
      const fresh = allOrders.find((o) => o.id === activeOrder.id);
      if (
        fresh &&
        (fresh.status !== activeOrder.status ||
          fresh.driverName !== activeOrder.driverName ||
          fresh.driverPhone !== activeOrder.driverPhone ||
          fresh.driverVehicle !== activeOrder.driverVehicle)
      ) {
        setActiveOrder(fresh);
      }
    }
  }, [allOrders]);

  // Handlers for store registration and management with instant local update + Firebase & server persistence
  const handleAddNewStore = async (newStore: Store) => {
    setStores((prev) => {
      const filtered = prev.filter((s) => s.id !== newStore.id && (!s.ownerPhone || s.ownerPhone !== newStore.ownerPhone));
      return [newStore, ...filtered];
    });
    addToastNotification({
      title: "تم إرسال طلب تسجيل المتجر 🏪",
      message: `طلب تسجيل متجر "${newStore.name}" قيد مراجعة واعتماد الإدارة!`,
      type: "info"
    });
    await Promise.allSettled([
      saveStoreToFirestore(newStore),
      registerStoreOnServer(newStore)
    ]);
  };

  const handleUpdateStore = async (updatedStore: Store) => {
    const prevStore = stores.find((item) => item.id === updatedStore.id);
    let sanitizedStore = { ...updatedStore };
    if (sanitizedStore.isApproved !== false && sanitizedStore.description && (sanitizedStore.description.includes("بانتظار اعتماد") || sanitizedStore.description.includes("بانتظار الاعتماد"))) {
      const isFood = sanitizedStore.category === "food" || (sanitizedStore.name && (sanitizedStore.name.includes("مواد") || sanitizedStore.name.includes("سوبرماركت")));
      sanitizedStore.description = isFood ? "متجر مواد غذائية وتموينية طازجة معتمد في المنصة" : "متجر معتمد ونشط في المنصة";
    }
    setStores((prev) => prev.map((item) => (item.id === sanitizedStore.id ? sanitizedStore : item)));

    // Accurate contextual notifications for store actions:
    if (sanitizedStore.isHidden === true && (!prevStore || !prevStore.isHidden)) {
      addToastNotification({
        title: "تم إخفاء المتجر عن الزبائن 🔒",
        message: `تم إخفاء متجر "${sanitizedStore.name}" بنجاح ولن يظهر للزبائن في التطبيق حتى تقوم بإظهاره.`,
        type: "warning"
      });
    } else if (!sanitizedStore.isHidden && prevStore?.isHidden === true) {
      addToastNotification({
        title: "تم إظهار المتجر للزبائن 👁️",
        message: `تم إظهار متجر "${sanitizedStore.name}" بنجاح وأصبح مرئياً ونشطاً لجميع الزبائن.`,
        type: "info"
      });
    } else if (sanitizedStore.status === "closed" && prevStore?.status !== "closed") {
      addToastNotification({
        title: "تم إغلاق المتجر مؤقتاً 🔴",
        message: `تم إغلاق متجر "${sanitizedStore.name}" مؤقتاً ولن يستقبل طلبات جديدة من الزبائن.`,
        type: "warning"
      });
    } else if (sanitizedStore.status === "open" && prevStore?.status === "closed") {
      addToastNotification({
        title: "تم فتح المتجر بنجاح 🟢",
        message: `تم فتح متجر "${sanitizedStore.name}" وهو متاح وجاهز لاستقبال طلبات الزبائن.`,
        type: "info"
      });
    } else if (sanitizedStore.isApproved === true && prevStore?.isApproved === false) {
      notifiedPendingStoresRef.current.add(sanitizedStore.id);
      try {
        localStorage.setItem(
          "tw_notified_pending_store_ids",
          JSON.stringify(Array.from(notifiedPendingStoresRef.current))
        );
      } catch {}
      addToastNotification({
        title: "تم اعتماد المتجر بنجاح ✅",
        message: `تمت الموافقة على اعتماد متجر "${sanitizedStore.name}" وأصبح مرئياً لجميع الزبائن.`,
        type: "info"
      });
    } else if (sanitizedStore.isApproved === false && prevStore?.isApproved !== false) {
      addToastNotification({
        title: "تم تعليق اعتماد المتجر ⏳",
        message: `تم إلغاء تفعيل متجر "${sanitizedStore.name}" وإخفاؤه عن الزبائن لحين المراجعة.`,
        type: "warning"
      });
    } else if (prevStore && JSON.stringify(prevStore) !== JSON.stringify(sanitizedStore)) {
      addToastNotification({
        title: "تم تحديث بيانات المتجر 🏪",
        message: `تم حفظ التعديلات على متجر "${sanitizedStore.name}" بنجاح.`,
        type: "info"
      });
    }

    await Promise.allSettled([
      saveStoreToFirestore(sanitizedStore),
      updateStoreOnServer(sanitizedStore)
    ]);
  };

  const handleDeleteStore = async (storeId: string) => {
    try {
      const raw = localStorage.getItem("tw_deleted_store_ids");
      const currentDeleted: string[] = raw ? JSON.parse(raw) : [];
      if (!currentDeleted.includes(storeId)) {
        currentDeleted.push(storeId);
        localStorage.setItem("tw_deleted_store_ids", JSON.stringify(currentDeleted));
      }
    } catch (e) {}

    // Never re-alert about deleted stores
    notifiedPendingStoresRef.current.add(storeId);
    try {
      localStorage.setItem(
        "tw_notified_pending_store_ids",
        JSON.stringify(Array.from(notifiedPendingStoresRef.current))
      );
    } catch {}

    setStores((prev) => prev.filter((item) => item.id !== storeId));
    if (selectedStore?.id === storeId) {
      setSelectedStore(null);
    }

    await Promise.allSettled([
      deleteStoreFromFirestore(storeId),
      deleteStoreOnServer(storeId)
    ]);
  };

  // Product management handlers
  const handleAddNewProduct = async (product: Product) => {
    setProducts((prev) => [...prev, product]);
    if (product.isApproved === false || product.approvalStatus === "pending") {
      addToastNotification({
        title: "تم إرسال الصنف للاعتماد ⏳",
        message: `تم رفع الصنف "${product.name}" بنجاح وهو بانتظار مراجعة واعتماد الإدارة ليظهر للزبائن.`,
        type: "info"
      });
    } else {
      addToastNotification({
        title: "تمت إضافة الصنف بنجاح 🍽️",
        message: `الصنف "${product.name}" متاح ومعروض الآن للزبائن.`,
        type: "info"
      });
    }
    await Promise.allSettled([
      saveProductToFirestore(product),
      saveProductOnServer(product)
    ]);
  };

  const handleUpdateProduct = async (product: Product) => {
    const prevProduct = products.find((item) => item.id === product.id);
    setProducts((prev) => prev.map((item) => (item.id === product.id ? product : item)));

    // Accurate contextual notifications for product actions:
    // 1. Check if hiding the product
    if (product.isHidden === true && (!prevProduct || !prevProduct.isHidden)) {
      addToastNotification({
        title: "تم إخفاء الصنف بنجاح 🔒",
        message: `تم إخفاء صنف "${product.name}" عن الزبائن ولن يظهر في المتجر حتى تقوم بإظهاره مجدداً.`,
        type: "warning"
      });
    }
    // 2. Check if showing a previously hidden product
    else if (!product.isHidden && prevProduct?.isHidden === true) {
      addToastNotification({
        title: "تم إظهار الصنف للزبائن 👁️",
        message: `تم إظهار صنف "${product.name}" بنجاح وأصبح معروضاً للزبائن الآن.`,
        type: "info"
      });
    }
    // 3. Check if approving a pending or unapproved product
    else if (
      product.approvalStatus === "approved" &&
      product.isApproved === true &&
      (!prevProduct || prevProduct.isApproved === false || prevProduct.approvalStatus !== "approved")
    ) {
      addToastNotification({
        title: "تم اعتماد الصنف بنجاح ✅",
        message: `تمت الموافقة على عرض "${product.name}" وأصبح مرئياً لجميع الزبائن.`,
        type: "info"
      });
    }
    // 4. Check if rejected
    else if (product.approvalStatus === "rejected" && (!prevProduct || prevProduct.approvalStatus !== "rejected")) {
      addToastNotification({
        title: "تم رفض الصنف ❌",
        message: `تم رفض صنف "${product.name}" (${product.rejectionReason || "يرجى تعديل البيانات"}).`,
        type: "warning"
      });
    }
    // 5. Normal product details update (name, price, image, description, sizes...)
    else {
      addToastNotification({
        title: "تم تحديث الصنف بنجاح ✏️",
        message: `تم حفظ التعديلات على صنف "${product.name}".`,
        type: "info"
      });
    }

    await Promise.allSettled([
      saveProductToFirestore(product),
      updateProductOnServer(product)
    ]);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const raw = localStorage.getItem("tw_deleted_product_ids");
      const currentDeleted: string[] = raw ? JSON.parse(raw) : [];
      if (!currentDeleted.includes(productId)) {
        currentDeleted.push(productId);
        localStorage.setItem("tw_deleted_product_ids", JSON.stringify(currentDeleted));
      }
    } catch (e) {}

    setProducts((prev) => prev.filter((item) => item.id !== productId));
    await Promise.allSettled([
      deleteProductFromFirestore(productId),
      deleteProductOnServer(productId)
    ]);
  };

  // Driver Fleet Management Handlers
  const handleAddNewDriver = async (driver: DriverMember) => {
    // Unmark from deleted list if previously deleted
    try {
      const deletedDrivers: string[] = JSON.parse(localStorage.getItem("tw_deleted_driver_ids") || "[]");
      localStorage.setItem("tw_deleted_driver_ids", JSON.stringify(deletedDrivers.filter(id => id !== driver.id)));
    } catch {}

    setDriversList((prev) => {
      const updated = [...prev.filter((d) => d.id !== driver.id), driver];
      try {
        localStorage.setItem("tw_drivers_list", JSON.stringify(updated));
        localStorage.setItem("tw_drivers", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    addToastNotification({
      title: "تمت إضافة وتفعيل الكابتن بنجاح 🛵",
      message: `تم تسجيل الكابتن "${driver.name}" في الأسطول وتفعيله فوراً لتسجيل الدخول واستقبال الطلبات.`,
      type: "success"
    });

    // Also automatically create/update a corresponding service card in stores under category 'drivers'
    const driverStoreId = driver.id === "driver_hamza" ? "service_hamza_oweir" : "service_driver_" + driver.id.replace(/[^a-zA-Z0-9_]/g, "_");
    try {
      const deletedStores: string[] = JSON.parse(localStorage.getItem("tw_deleted_store_ids") || "[]");
      localStorage.setItem("tw_deleted_store_ids", JSON.stringify(deletedStores.filter(id => id !== driverStoreId && id !== "service_hamza_oweir")));
    } catch {}

    const driverServiceStore: Store = {
      id: driverStoreId,
      name: driver.name.startsWith("الكابتن") || driver.name.startsWith("كابتن") ? driver.name : `الكابتن ${driver.name}`,
      category: "drivers",
      image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format&fit=crop&q=60",
      rating: driver.rating !== undefined && driver.rating !== null ? driver.rating : 0,
      deliveryTime: "طلب فوري",
      deliveryFee: 0,
      locationNode: "center",
      featuredProduct: driver.vehicle ? `توصيل سريع (${driver.vehicle})` : "توصيل طلبات ومشاوير فورية",
      contactPhone: driver.phone,
      ownerPhone: driver.phone,
      ownerName: driver.name,
      ownerPin: driver.pin || "1111",
      status: "open",
      isApproved: true,
      isService: true,
      description: `كابتن توصيل سريع معتمد في القرية (${driver.vehicle || "دراجة نارية"}). متاح لتوصيل الطلبات والمشاوير الخاصة.`,
      priority: 1
    };

    setStores((prev) => {
      const cleanP = (p?: string) => (p || "").replace(/[^0-9]/g, "");
      const targetPhone = cleanP(driver.phone);
      // Remove any existing duplicate store for this driver/phone
      const filtered = prev.filter(s => {
        if (s.id === driverStoreId) return false;
        if (driver.id === "driver_hamza" && s.id === "service_hamza_oweir") return false;
        if (s.category === "drivers" && targetPhone && cleanP(s.contactPhone) === targetPhone) return false;
        return true;
      });
      const updatedStores = [driverServiceStore, ...filtered];
      try {
        localStorage.setItem("tw_stores", JSON.stringify(updatedStores));
      } catch {}
      return updatedStores;
    });

    await Promise.allSettled([
      saveDriverToFirestore(driver),
      saveDriverOnServer(driver),
      saveStoreToFirestore(driverServiceStore),
      registerStoreOnServer(driverServiceStore)
    ]);
  };

  const handleUpdateDriver = async (driver: DriverMember) => {
    const prevDriver = driversList.find((d) => d.id === driver.id);

    setDriversList((prev) => {
      const updated = prev.map((d) => (d.id === driver.id ? driver : d));
      try {
        localStorage.setItem("tw_drivers_list", JSON.stringify(updated));
        localStorage.setItem("tw_drivers", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Also update and deduplicate corresponding service store
    const cleanP = (p?: string) => (p || "").replace(/[^0-9]/g, "");
    const targetPhone = cleanP(driver.phone);
    const driverStoreId = driver.id === "driver_hamza" ? "service_hamza_oweir" : "service_driver_" + driver.id.replace(/[^a-zA-Z0-9_]/g, "_");
    const storeName = driver.name.startsWith("الكابتن") || driver.name.startsWith("كابتن") ? driver.name : `الكابتن ${driver.name}`;

    let storeToSave: Store | null = null;
    setStores((prev) => {
      const matchingStore = prev.find(s =>
        s.id === driverStoreId ||
        (driver.id === "driver_hamza" && s.id === "service_hamza_oweir") ||
        s.id === `service_driver_${driver.id}` ||
        (s.category === "drivers" && ((targetPhone && cleanP(s.contactPhone) === targetPhone) || (s.name && s.name.includes(driver.name))))
      );

      const isDriverOffline = driver.status === "offline";
      const isDriverHidden = Boolean(driver.isHidden);

      if (matchingStore) {
        storeToSave = {
          ...matchingStore,
          name: storeName,
          contactPhone: driver.phone,
          ownerPhone: driver.phone,
          ownerName: driver.name,
          ownerPin: driver.pin || matchingStore.ownerPin || "1111",
          status: isDriverOffline ? "closed" : "open",
          isHidden: isDriverHidden,
          featuredProduct: driver.vehicle ? `توصيل سريع (${driver.vehicle})` : matchingStore.featuredProduct,
          description: `كابتن توصيل سريع معتمد في القرية (${driver.vehicle || "دراجة نارية"}). متاح لتوصيل الطلبات والمشاوير الخاصة.`
        };
      } else {
        storeToSave = {
          id: driverStoreId,
          name: storeName,
          category: "drivers",
          image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format&fit=crop&q=60",
          rating: driver.rating !== undefined && driver.rating !== null ? driver.rating : 0,
          deliveryTime: "طلب فوري",
          deliveryFee: 0,
          locationNode: "center",
          featuredProduct: driver.vehicle ? `توصيل سريع (${driver.vehicle})` : "توصيل طلبات ومشاوير فورية",
          contactPhone: driver.phone,
          ownerPhone: driver.phone,
          ownerName: driver.name,
          ownerPin: driver.pin || "1111",
          status: isDriverOffline ? "closed" : "open",
          isHidden: isDriverHidden,
          isApproved: true,
          isService: true,
          description: `كابتن توصيل سريع معتمد في القرية (${driver.vehicle || "دراجة نارية"}). متاح لتوصيل الطلبات والمشاوير الخاصة.`,
          priority: 1
        };
      }

      // Filter out all previous instances of this driver's store to eliminate duplicates
      const nextStores = prev.filter(s => {
        if (s.id === driverStoreId || (driver.id === "driver_hamza" && s.id === "service_hamza_oweir")) return false;
        if (s.id === `service_driver_${driver.id}`) return false;
        if (s.category === "drivers" && targetPhone && cleanP(s.contactPhone) === targetPhone) return false;
        return true;
      });

      const finalStores = [storeToSave, ...nextStores];
      try {
        localStorage.setItem("tw_stores", JSON.stringify(finalStores));
      } catch {}
      return finalStores;
    });

    // Contextual toast notifications for driver changes:
    if (driver.isHidden === true && (!prevDriver || !prevDriver.isHidden)) {
      addToastNotification({
        title: "تم إخفاء الكابتن 🔒",
        message: `تم إخفاء الكابتن "${driver.name}" عن المنصة والزبائن ولن يستقبل طلبات جديدة.`,
        type: "warning"
      });
    } else if (!driver.isHidden && prevDriver?.isHidden === true) {
      addToastNotification({
        title: "تم إظهار الكابتن للزبائن 👁️",
        message: `تم إظهار الكابتن "${driver.name}" وأصبح مرئياً ومتاحاً في أسطول التوصيل.`,
        type: "info"
      });
    } else if (driver.status === "offline" && prevDriver?.status !== "offline") {
      addToastNotification({
        title: "تم ضبط الكابتن: غير متصل ⛔",
        message: `الكابتن "${driver.name}" غير متصل حالياً وتم إيقاف استقبال الطلبات له مؤقتاً.`,
        type: "warning"
      });
    } else if (driver.status === "available" && prevDriver?.status !== "available") {
      addToastNotification({
        title: "تم تفعيل جاهزية الكابتن 🛵",
        message: `الكابتن "${driver.name}" متاح الآن وجاهز لاستقبال وتوصيل الطلبات.`,
        type: "info"
      });
    } else if (driver.status === "busy" && prevDriver?.status !== "busy") {
      addToastNotification({
        title: "تم ضبط الكابتن: مشغول ⏳",
        message: `الكابتن "${driver.name}" قيد توصيل طلب حالياً (مشغول).`,
        type: "info"
      });
    } else {
      addToastNotification({
        title: "تم حفظ بيانات الكابتن ✅",
        message: `تم حفظ تعديلات بيانات الكابتن "${driver.name}" بنجاح.`,
        type: "info"
      });
    }

    const tasks: Promise<any>[] = [
      saveDriverToFirestore(driver),
      updateDriverOnServer(driver)
    ];
    if (storeToSave) {
      tasks.push(saveStoreToFirestore(storeToSave));
      tasks.push(registerStoreOnServer(storeToSave));
    }
    await Promise.allSettled(tasks);
  };

  const handleDeleteDriver = async (driverId: string) => {
    // 1. Mark driverId as deleted
    try {
      const deletedDrivers: string[] = JSON.parse(localStorage.getItem("tw_deleted_driver_ids") || "[]");
      if (!deletedDrivers.includes(driverId)) {
        deletedDrivers.push(driverId);
        localStorage.setItem("tw_deleted_driver_ids", JSON.stringify(deletedDrivers));
      }
    } catch {}

    // 2. Remove from driversList
    setDriversList((prev) => {
      const updated = prev.filter((d) => d.id !== driverId);
      try {
        localStorage.setItem("tw_drivers_list", JSON.stringify(updated));
        localStorage.setItem("tw_drivers", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 3. Remove associated store from stores state and localStorage
    const removedStoreIds: string[] = [];
    setStores((prev) => {
      const nextStores = prev.filter((s) => {
        const isMatch =
          s.id === `service_driver_${driverId}` ||
          (driverId === "driver_hamza" && s.id === "service_hamza_oweir") ||
          (s.category === "drivers" && s.id.includes(driverId));
        if (isMatch) {
          removedStoreIds.push(s.id);
          return false;
        }
        return true;
      });

      try {
        localStorage.setItem("tw_stores", JSON.stringify(nextStores));
      } catch {}
      return nextStores;
    });

    // 4. Mark removed store IDs as deleted
    try {
      const deletedStores: string[] = JSON.parse(localStorage.getItem("tw_deleted_store_ids") || "[]");
      removedStoreIds.forEach(id => {
        if (!deletedStores.includes(id)) deletedStores.push(id);
      });
      if (driverId === "driver_hamza" && !deletedStores.includes("service_hamza_oweir")) {
        deletedStores.push("service_hamza_oweir");
      }
      localStorage.setItem("tw_deleted_store_ids", JSON.stringify(deletedStores));
    } catch {}

    addToastNotification({
      title: "تم حذف الكابتن بنجاح 🗑️",
      message: "تم حذف الكابتن نهائياً وإزالة بطاقة خدمته من المنصة.",
      type: "info"
    });

    const tasks: Promise<any>[] = [
      deleteDriverFromFirestore(driverId),
      deleteDriverOnServer(driverId)
    ];
    removedStoreIds.forEach(id => {
      tasks.push(deleteStoreFromFirestore(id));
      tasks.push(deleteStoreOnServer(id));
    });
    if (driverId === "driver_hamza") {
      tasks.push(deleteStoreFromFirestore("service_hamza_oweir"));
      tasks.push(deleteStoreOnServer("service_hamza_oweir"));
    }
    await Promise.allSettled(tasks);
  };

  // Category Management Handlers (Admin dynamic categories: meat, clothes, etc.)
  const handleAddNewCategory = async (category: Category) => {
    // Clear from deleted category IDs if re-added
    try {
      const rawDeleted = localStorage.getItem("tw_deleted_category_ids");
      if (rawDeleted) {
        const deletedIds: string[] = JSON.parse(rawDeleted);
        const filtered = deletedIds.filter((id) => id !== category.id);
        localStorage.setItem("tw_deleted_category_ids", JSON.stringify(filtered));
      }
    } catch (e) {}

    let updatedList: Category[] = [];
    setCategories((prev) => {
      if (prev.some((c) => c.id === category.id)) {
        updatedList = prev.map((c) => (c.id === category.id ? category : c));
      } else {
        updatedList = [...prev, category];
      }
      try {
        localStorage.setItem("tw_categories", JSON.stringify(updatedList));
      } catch (e) {}
      return updatedList;
    });

    addToastNotification({
      title: "تمت إضافة التصنيف الرئيسي بنجاح 🏷️",
      message: `أصبح تصنيف "${category.label}" متاحاً الآن في شريط تصفح القرية والمتاجر.`,
      type: "success"
    });

    const finalList = updatedList.length > 0 ? updatedList : [...categories, category];
    await Promise.allSettled([
      saveCategoryToFirestore(category),
      syncCategoriesToFirestore(finalList),
      saveCategoryOnServer(category),
      reorderCategoriesOnServer(finalList)
    ]);
  };

  const handleUpdateCategory = async (category: Category) => {
    const prevCat = categories.find((c) => c.id === category.id);
    let updatedList: Category[] = [];
    setCategories((prev) => {
      updatedList = prev.map((c) => (c.id === category.id ? category : c));
      try {
        localStorage.setItem("tw_categories", JSON.stringify(updatedList));
      } catch (e) {}
      return updatedList;
    });

    if (category.isHidden === true && (!prevCat || !prevCat.isHidden)) {
      addToastNotification({
        title: "تم إخفاء التصنيف بنجاح 🔒",
        message: `تم إخفاء تصنيف "${category.label}" عن شريط الصفحة الرئيسية للزبائن.`,
        type: "warning"
      });
    } else if (!category.isHidden && prevCat?.isHidden === true) {
      addToastNotification({
        title: "تم إظهار التصنيف للزبائن 👁️",
        message: `تم إظهار تصنيف "${category.label}" وأصبح معروضاً في شريط الصفحة الرئيسية.`,
        type: "info"
      });
    } else {
      addToastNotification({
        title: "تم تحديث التصنيف ✅",
        message: `تم حفظ تعديلات تصنيف "${category.label}".`,
        type: "info"
      });
    }

    const finalList = updatedList.length > 0 ? updatedList : categories.map((c) => (c.id === category.id ? category : c));
    await Promise.allSettled([
      saveCategoryToFirestore(category),
      syncCategoriesToFirestore(finalList),
      saveCategoryOnServer(category),
      reorderCategoriesOnServer(finalList)
    ]);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    // 1. Mark as permanently deleted in local cache
    let deletedIds: string[] = ["cat_mtuj2s13ho2"];
    try {
      const rawDeleted = localStorage.getItem("tw_deleted_category_ids");
      if (rawDeleted) {
        const parsed = JSON.parse(rawDeleted);
        if (Array.isArray(parsed)) deletedIds = Array.from(new Set([...deletedIds, ...parsed]));
      }
    } catch (e) {}
    if (!deletedIds.includes(categoryId)) {
      deletedIds.push(categoryId);
    }
    try {
      localStorage.setItem("tw_deleted_category_ids", JSON.stringify(deletedIds));
    } catch (e) {}

    // 2. Synchronously filter state
    const nextList = categories.filter((c) => c.id !== categoryId && c.id !== "cat_mtuj2s13ho2");
    setCategories(nextList);
    try {
      localStorage.setItem("tw_categories", JSON.stringify(nextList));
    } catch (e) {}

    // 3. Store Safety: Reassign any stores assigned to this category so they never become orphaned or invisible
    const fallbackCategory = (categoryId.includes("cloth") || categoryId.includes("mtuj2s13ho2")) ? "clothes" : "supermarkets";
    const affectedStores = stores.filter((s) => s.category === categoryId);
    if (affectedStores.length > 0) {
      const updatedStores = stores.map((s) => (s.category === categoryId ? { ...s, category: fallbackCategory } : s));
      setStores(updatedStores);
      try {
        localStorage.setItem("tw_stores", JSON.stringify(updatedStores));
      } catch (e) {}
      // Sync each affected store to backend and firestore
      for (const st of affectedStores) {
        handleUpdateStore({ ...st, category: fallbackCategory });
      }
    }

    addToastNotification({
      title: "تم حذف التصنيف 🗑️",
      message: affectedStores.length > 0
        ? `تم حذف التصنيف، ونقل ${affectedStores.length} متجر مرتبط تلقائياً لتصنيف نشط لحمايتها من الاختفاء.`
        : "تم حذف التصنيف بنجاح من شريط المنصة والمتاجر.",
      type: "info"
    });

    // 4. Persist deletion across Firestore and Node server
    await Promise.allSettled([
      deleteCategoryFromFirestore(categoryId),
      syncCategoriesToFirestore(nextList),
      deleteCategoryOnServer(categoryId),
      reorderCategoriesOnServer(nextList)
    ]);
  };

  const handleReorderCategories = async (newCategories: Category[]) => {
    setCategories(newCategories);
    try {
      localStorage.setItem("tw_categories", JSON.stringify(newCategories));
    } catch (e) {}

    addToastNotification({
      title: "تم حفظ ترتيب التصنيفات ↕️",
      message: "تم تحديث ترتيب ظهور التصنيفات في شريط تصفح القرية.",
      type: "info"
    });

    await Promise.allSettled([
      syncCategoriesToFirestore(newCategories),
      reorderCategoriesOnServer(newCategories)
    ]);
  };

  // Firebase Firestore Real-Time Subscriptions (Synchronize Orders, Stores, Products, Drivers, Reviews across all users)
  useEffect(() => {
    // 0. Test connection safely according to Firebase skill
    testFirestoreConnection().catch(() => {});

    // 1. Seed initial sample data to Firestore if not already present
    seedInitialFirestoreData().catch((err) => console.warn("Firestore seed notice:", err));

    // 2. Real-time orders listener
    const unsubOrders = subscribeToOrders((cloudOrders) => {
      if (!cloudOrders || cloudOrders.length === 0) return;

      // On first load, mark all existing orders as notified so no alert storm occurs
      if (!isInitialLoadDoneRef.current) {
        cloudOrders.forEach((o) => notifiedOrdersRef.current.add(o.id));
        isInitialLoadDoneRef.current = true;
      }

      setAllOrders((prev) => {
        const prevMap = new Map(prev.map((o) => [o.id, o]));
        let hasChanges = false;
        const newOrders: Order[] = [];

        for (const co of cloudOrders) {
          const existing = prevMap.get(co.id);
          if (!existing) {
            hasChanges = true;
            if (!notifiedOrdersRef.current.has(co.id)) {
              newOrders.push(co);
              notifiedOrdersRef.current.add(co.id);
            }
          } else if (
            existing.status !== co.status ||
            existing.driverId !== co.driverId ||
            existing.driverName !== co.driverName
          ) {
            hasChanges = true;
          }
        }

        if (!hasChanges && prev.length === cloudOrders.length) {
          return prev;
        }

        // Process newly incoming orders notifications
        if (newOrders.length > 0) {
          newOrders.forEach((newOrd) => {
            const cleanPhone = (p?: string) => (p || "").replace(/[^0-9]/g, "");
            const uPhone = cleanPhone(userProfile?.phone);

            if (userRole === "store_owner") {
              const isMyStoreOrder =
                newOrd.storeId === currentStoreId ||
                (userProfile?.name && newOrd.storeName?.includes(userProfile.name));

              if (isMyStoreOrder) {
                playOrderAlertSound("ringtone");
                triggerOrderVibration();
                addToastNotification({
                  order: newOrd,
                  title: "🏪 طلب جديد وارد لمتجرك! 🛍️",
                  message: `طلب جديد #${newOrd.id} بقيمة ${newOrd.total.toLocaleString()} ل.س من الزبون ${newOrd.customerName}`,
                  type: "new_order"
                });
              }
            } else if (isAdminMode || userRole === "admin") {
              playOrderAlertSound("ringtone");
              addToastNotification({
                order: newOrd,
                title: "🔔 طلب جديد وارد للإدارة! 🛍️",
                message: `طلب #${newOrd.id} إلى (${newOrd.storeName}) من الزبون ${newOrd.customerName}`,
                type: "new_order"
              });
            } else if (isDriverMode || userRole === "driver") {
              playOrderAlertSound("chime");
              addToastNotification({
                order: newOrd,
                title: "🛵 طلب توصيل جديد متاح للكابتن!",
                message: `طلب #${newOrd.id} جاهز للتوصيل من (${newOrd.storeName})`,
                type: "new_order"
              });
            }
          });
        }

        return cloudOrders;
      });
    });

    // 3. Real-time stores listener
    const unsubStores = subscribeToStores((cloudStores) => {
      if (!cloudStores || cloudStores.length === 0) return;
      
      // Check if there is a newly registered store waiting for approval
      cloudStores.forEach((st) => {
        if (st.isApproved === false && !notifiedPendingStoresRef.current.has(st.id)) {
          notifiedPendingStoresRef.current.add(st.id);
          try {
            localStorage.setItem(
              "tw_notified_pending_store_ids",
              JSON.stringify(Array.from(notifiedPendingStoresRef.current))
            );
          } catch {}
          if (isAdminMode || userRole === "admin") {
            addToastNotification({
              title: "🔔 طلب تسجيل متجر جديد",
              message: `قام متجر "${st.name}" بالتسجيل وينتظر موافقة واعتماد الإدارة!`,
              type: "info"
            });
            playOrderAlertSound("chime");
          }
        }
      });

      setStores((prev) => {
        const merged = ensureInitialStoresPreserved(cloudStores);
        if (merged.length !== prev.length || JSON.stringify(merged) !== JSON.stringify(prev)) {
          return merged;
        }
        return prev;
      });
    });

    // 4. Real-time products listener
    const unsubProducts = subscribeToProducts((cloudProducts) => {
      if (!cloudProducts || cloudProducts.length === 0) return;
      setProducts(ensureInitialProductsPreserved(cloudProducts));
    });

    // 5. Real-time drivers listener
    const unsubDrivers = subscribeToDrivers((cloudDrivers) => {
      setDriversList((prev) => {
        const merged = ensureInitialDriversPreserved(cloudDrivers || []);
        if (merged.length !== prev.length || JSON.stringify(merged) !== JSON.stringify(prev)) {
          return merged;
        }
        return prev;
      });
    });

    // 6. Real-time reviews listener
    const unsubReviews = subscribeToReviews((cloudReviews) => {
      if (!cloudReviews || cloudReviews.length === 0) return;
      setReviews(cloudReviews);
    });

    // 7. Real-time broadcasts listener
    const unsubBroadcasts = subscribeToBroadcasts((cloudBroadcasts) => {
      if (!cloudBroadcasts || cloudBroadcasts.length === 0) return;
      setStoreBroadcasts(cloudBroadcasts);
    });

    // 8. Real-time categories listener
    const unsubCategories = subscribeToCategories((cloudCategories) => {
      if (!cloudCategories || !Array.isArray(cloudCategories) || cloudCategories.length === 0) return;
      let deletedIds: string[] = ["cat_mtuj2s13ho2"];
      try {
        const rawDel = localStorage.getItem("tw_deleted_category_ids");
        if (rawDel) {
          const parsed = JSON.parse(rawDel);
          if (Array.isArray(parsed)) deletedIds = Array.from(new Set([...deletedIds, ...parsed]));
        }
      } catch (e) {}
      const deletedSet = new Set<string>(deletedIds);

      setCategories((currentLocal) => {
        const cloudMap = new Map(cloudCategories.map((c) => [c.id, c]));
        const merged: Category[] = [];
        const seen = new Set<string>();
        // Preserve local categories, update if present in cloud (skip deleted & aliases)
        for (const local of currentLocal) {
          if (deletedSet.has(local.id) || local.id === "cat_mtuj2s13ho2" || local.label === "ألبسة وملابس وأزياء") continue;
          const item = cloudMap.get(local.id) || local;
          if (item.id === "clothes" && (item.label === "ألبسة وأزياء" || item.label === "ألبسة وازياء")) {
            merged.push({ ...item, label: "ملابس وازياء" });
          } else {
            merged.push(item);
          }
          seen.add(local.id);
        }
        // Add new cloud categories if not deleted
        for (const cloud of cloudCategories) {
          if (!seen.has(cloud.id) && !deletedSet.has(cloud.id) && cloud.id !== "cat_mtuj2s13ho2" && cloud.label !== "ألبسة وملابس وأزياء") {
            if (cloud.id === "clothes" && (cloud.label === "ألبسة وأزياء" || cloud.label === "ألبسة وازياء")) {
              merged.push({ ...cloud, label: "ملابس وازياء" });
            } else {
              merged.push(cloud);
            }
            seen.add(cloud.id);
          }
        }
        // Add default categories only if not explicitly deleted
        for (const def of initialCategories) {
          if (!seen.has(def.id) && !deletedSet.has(def.id)) {
            merged.push(def);
            seen.add(def.id);
          }
        }
        if (currentLocal.length !== merged.length || JSON.stringify(currentLocal) !== JSON.stringify(merged)) {
          return merged;
        }
        return currentLocal;
      });
    });

    return () => {
      unsubOrders();
      unsubStores();
      unsubProducts();
      unsubDrivers();
      unsubReviews();
      unsubBroadcasts();
      unsubCategories();
    };
  }, [isAdminMode, isDriverMode, userRole, userProfile?.phone, userProfile?.name, currentStoreId, addToastNotification]);

  // Background server sync: continuous sync across all devices, portals, and browsers
  useEffect(() => {
    let isMounted = true;
    const cleanPhone = (p?: string) => (p || "").replace(/[^0-9]/g, "");

    const performSync = async () => {
      const serverData = await fetchServerSync();
      if (!serverData || !isMounted) return;

      // 1. Sync Stores
      if (serverData.stores && Array.isArray(serverData.stores)) {
        setStores((currentLocal) => {
          const currentMap = new Map<string, Store>(currentLocal.map((s) => [s.id, s]));
          let hasDiff = false;

          for (const sStore of serverData.stores) {
            const localStore = currentMap.get(sStore.id);
            if (!localStore || localStore.isApproved !== sStore.isApproved || localStore.status !== sStore.status || localStore.name !== sStore.name) {
              hasDiff = true;
              break;
            }
          }

          if (hasDiff || currentLocal.length !== serverData.stores.length) {
            // Check if there's a new pending store waiting for Admin approval
            const newPending = serverData.stores.find(
              (s) => s.isApproved === false && !notifiedPendingStoresRef.current.has(s.id)
            );
            if (newPending) {
              notifiedPendingStoresRef.current.add(newPending.id);
              try {
                localStorage.setItem(
                  "tw_notified_pending_store_ids",
                  JSON.stringify(Array.from(notifiedPendingStoresRef.current))
                );
              } catch {}
              if (isAdminMode || userRole === "admin") {
                addToastNotification({
                  title: "🔔 طلب تسجيل متجر جديد",
                  message: `قام متجر "${newPending.name}" بالتسجيل وينتظر موافقة واعتماد الإدارة!`,
                  type: "info"
                });
                playOrderAlertSound("chime");
              }
            }

            // Check if Store Owner's store was just approved by Admin!
            if (userRole === "store_owner" && userProfile) {
              const uPhone = cleanPhone(userProfile.phone);
              const myServerStore = serverData.stores.find((s) => 
                (currentStoreId && s.id === currentStoreId) || 
                (uPhone && cleanPhone(s.ownerPhone) === uPhone) ||
                (uPhone && cleanPhone(s.contactPhone) === uPhone)
              );
              const myLocalStore = currentLocal.find((s) => 
                (currentStoreId && s.id === currentStoreId) || 
                (uPhone && cleanPhone(s.ownerPhone) === uPhone) ||
                (uPhone && cleanPhone(s.contactPhone) === uPhone)
              );

              if (myServerStore && myServerStore.isApproved === true && myLocalStore && myLocalStore.isApproved === false) {
                addToastNotification({
                  title: "🎉 مبارك! تم اعتماد وتفعيل متجرك!",
                  message: `تمت موافقة الإدارة على تفعيل متجر "${myServerStore.name}". متجرك الآن معتمد وظاهر لجميع زبائن القرية!`,
                  type: "info"
                });
                playOrderAlertSound("chime");
              }
            }

            return ensureInitialStoresPreserved(serverData.stores);
          }
          return currentLocal;
        });
      }

      // 2. Sync Orders
      if (serverData.orders && Array.isArray(serverData.orders)) {
        setAllOrders((currentLocal) => {
          const currentMap = new Map<string, Order>(currentLocal.map((o) => [o.id, o]));
          let hasDiff = false;
          const newlyArrivedOrders: Order[] = [];

          for (const sOrder of serverData.orders) {
            const localOrder = currentMap.get(sOrder.id);
            if (!localOrder) {
              hasDiff = true;
              if (!notifiedOrdersRef.current.has(sOrder.id)) {
                newlyArrivedOrders.push(sOrder);
                notifiedOrdersRef.current.add(sOrder.id);
              }
            } else if (
              localOrder.status !== sOrder.status || 
              localOrder.driverId !== sOrder.driverId || 
              localOrder.driverName !== sOrder.driverName
            ) {
              hasDiff = true;
            }
          }

          if (hasDiff) {
            // Process newly arrived incoming orders alerts
            if (newlyArrivedOrders.length > 0) {
              newlyArrivedOrders.forEach((newOrd) => {
                // If Store Owner:
                if (userRole === "store_owner") {
                  const uPhone = cleanPhone(userProfile?.phone);
                  const isMyStoreOrder = 
                    newOrd.storeId === currentStoreId || 
                    (userProfile?.name && newOrd.storeName?.includes(userProfile.name));

                  if (isMyStoreOrder) {
                    playOrderAlertSound("ringtone");
                    triggerOrderVibration();
                    addToastNotification({
                      order: newOrd,
                      title: "🏪 طلب جديد وارد لمتجرك! 🛍️",
                      message: `طلب جديد #${newOrd.id} بقيمة ${newOrd.total.toLocaleString()} ل.س من الزبون ${newOrd.customerName}`,
                      type: "new_order"
                    });
                  }
                }

                // If Admin:
                if (isAdminMode || userRole === "admin") {
                  playOrderAlertSound("ringtone");
                  addToastNotification({
                    order: newOrd,
                    title: "🔔 طلب جديد وارد للإدارة! 🛍️",
                    message: `طلب #${newOrd.id} إلى (${newOrd.storeName}) من الزبون ${newOrd.customerName}`,
                    type: "new_order"
                  });
                }

                // If Driver:
                if (isDriverMode || userRole === "driver") {
                  playOrderAlertSound("chime");
                  addToastNotification({
                    order: newOrd,
                    title: "🛵 طلب توصيل جديد متاح للكابتن!",
                    message: `طلب #${newOrd.id} جاهز للتوصيل من (${newOrd.storeName})`,
                    type: "new_order"
                  });
                }
              });
            }

            return serverData.orders;
          }
          return currentLocal;
        });
      }

      // 3. Sync Products
      if (serverData.products && Array.isArray(serverData.products) && serverData.products.length > 0) {
        setProducts((currentLocal) => {
          const remoteMap = new Map(serverData.products.map((p: any) => [p.id, p]));
          let hasDiff = false;
          if (serverData.products.length !== currentLocal.length) {
            hasDiff = true;
          } else {
            for (const local of currentLocal) {
              const remote = remoteMap.get(local.id);
              if (!remote || remote.stock !== local.stock || remote.soldCount !== local.soldCount || remote.inStock !== local.inStock || remote.isAvailable !== local.isAvailable) {
                hasDiff = true;
                break;
              }
            }
          }
          if (hasDiff) {
            return ensureInitialProductsPreserved(serverData.products);
          }
          return currentLocal;
        });
      }

      // 4. Sync Drivers Fleet
      if (serverData.drivers && Array.isArray(serverData.drivers) && serverData.drivers.length > 0) {
        setDriversList((currentLocal) => {
          const merged = ensureInitialDriversPreserved(serverData.drivers!);
          if (merged.length !== currentLocal.length || JSON.stringify(merged) !== JSON.stringify(currentLocal)) {
            return merged;
          }
          return currentLocal;
        });
      }

      // 5. Sync Categories (meat, clothes, dynamic categories)
      if (serverData.categories && Array.isArray(serverData.categories) && serverData.categories.length > 0) {
        let deletedIds: string[] = ["cat_mtuj2s13ho2"];
        try {
          const rawDel = localStorage.getItem("tw_deleted_category_ids");
          if (rawDel) {
            const parsed = JSON.parse(rawDel);
            if (Array.isArray(parsed)) deletedIds = Array.from(new Set([...deletedIds, ...parsed]));
          }
        } catch (e) {}
        const deletedSet = new Set<string>(deletedIds);

        setCategories((currentLocal) => {
          const serverMap = new Map(serverData.categories!.map((c) => [c.id, c]));
          const merged: Category[] = [];
          const seen = new Set<string>();
          // Preserve all current local categories, updating any edited server properties (skip deleted & aliases)
          for (const local of currentLocal) {
            if (deletedSet.has(local.id) || local.id === "cat_mtuj2s13ho2" || local.label === "ألبسة وملابس وأزياء") continue;
            const item = serverMap.get(local.id) || local;
            if (item.id === "clothes" && (item.label === "ألبسة وأزياء" || item.label === "ألبسة وازياء")) {
              merged.push({ ...item, label: "ملابس وازياء" });
            } else {
              merged.push(item);
            }
            seen.add(local.id);
          }
          // Include any server categories not currently in local and not deleted
          for (const sCat of serverData.categories!) {
            if (!seen.has(sCat.id) && !deletedSet.has(sCat.id) && sCat.id !== "cat_mtuj2s13ho2" && sCat.label !== "ألبسة وملابس وأزياء") {
              if (sCat.id === "clothes" && (sCat.label === "ألبسة وأزياء" || sCat.label === "ألبسة وازياء")) {
                merged.push({ ...sCat, label: "ملابس وازياء" });
              } else {
                merged.push(sCat);
              }
              seen.add(sCat.id);
            }
          }
          // Only add initial default categories if not explicitly deleted
          for (const def of initialCategories) {
            if (!seen.has(def.id) && !deletedSet.has(def.id)) {
              merged.push(def);
              seen.add(def.id);
            }
          }
          if (
            currentLocal.length !== merged.length ||
            JSON.stringify(currentLocal) !== JSON.stringify(merged)
          ) {
            return merged;
          }
          return currentLocal;
        });
      }
    };

    performSync();
    const interval = setInterval(performSync, 5000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        performSync();
      }
    };
    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", performSync);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", performSync);
    };
  }, [isAdminMode, isDriverMode, userRole, userProfile?.phone, userProfile?.name, currentStoreId, addToastNotification]);

  // Automatic inventory & stock reconciliation effect:
  // Detects any customer orders whose purchased products have not yet had their stock deducted,
  // deducts the exact purchased quantities (e.g. 5kg sugar from Abu Muhammad) from product stock,
  // increments soldCount, marks the order with stockDeducted: true, and persists to Firestore, localStorage, and server!
  const reconciledOrderIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Find un-deducted non-cancelled orders that are not sample initial orders
    const pendingDeductionOrders = allOrders.filter(
      (o) =>
        !o.stockDeducted &&
        o.status !== "cancelled" &&
        o.items &&
        o.items.length > 0 &&
        !initialOrders.some((init) => init.id === o.id) &&
        !reconciledOrderIdsRef.current.has(o.id)
    );

    if (pendingDeductionOrders.length === 0) return;

    // Mark as being reconciled
    pendingDeductionOrders.forEach((o) => reconciledOrderIdsRef.current.add(o.id));

    const qtyToDeductByProdId = new Map<string, number>();
    const qtyToDeductByNameAndStore = new Map<string, number>();

    for (const ord of pendingDeductionOrders) {
      for (const it of ord.items) {
        if (it.product) {
          const qty = Number(it.quantity) || 1;
          if (it.product.id) {
            qtyToDeductByProdId.set(it.product.id, (qtyToDeductByProdId.get(it.product.id) || 0) + qty);
          }
          if (it.product.name) {
            const key = `${ord.storeId || it.product.storeId}_${it.product.name.trim().toLowerCase()}`;
            qtyToDeductByNameAndStore.set(key, (qtyToDeductByNameAndStore.get(key) || 0) + qty);
          }
        }
      }
    }

    const updatedProducts: Product[] = [];
    const nextProducts = products.map((p) => {
      let deductQty = qtyToDeductByProdId.get(p.id);
      if (!deductQty && p.name) {
        const key = `${p.storeId}_${p.name.trim().toLowerCase()}`;
        deductQty = qtyToDeductByNameAndStore.get(key);
      }

      if (deductQty && deductQty > 0) {
        const currentStock = p.stock !== undefined ? p.stock : 50;
        const newStock = Math.max(0, currentStock - deductQty);
        const currentSold = p.soldCount || 0;
        const newSold = currentSold + deductQty;
        const isDepleted = newStock <= 0;

        const updated: Product = {
          ...p,
          stock: newStock,
          soldCount: newSold,
          inStock: !isDepleted,
          isAvailable: !isDepleted
        };
        updatedProducts.push(updated);
        return updated;
      }
      return p;
    });

    const reconciledIds = new Set(pendingDeductionOrders.map((o) => o.id));
    const nextOrders = allOrders.map((o) => {
      if (reconciledIds.has(o.id)) {
        return { ...o, stockDeducted: true };
      }
      return o;
    });

    if (updatedProducts.length > 0) {
      setProducts(nextProducts);
      try {
        localStorage.setItem("tw_products", JSON.stringify(nextProducts));
      } catch (err) {}
    }

    setAllOrders(nextOrders);
    try {
      localStorage.setItem("tw_orders_list", JSON.stringify(nextOrders));
    } catch (err) {}

    // Persist to Firestore & Server
    Promise.allSettled([
      ...updatedProducts.flatMap((prod) => [
        saveProductToFirestore(prod),
        updateProductOnServer(prod)
      ]),
      ...pendingDeductionOrders.map((ord) => {
        const updatedOrd = { ...ord, stockDeducted: true };
        return Promise.allSettled([
          saveOrderToFirestore(updatedOrd),
          saveOrderOnServer(updatedOrd)
        ]);
      })
    ]).catch((err) => console.warn("Error reconciling inventory with orders:", err));
  }, [allOrders, products]);

  const handleUpdateOrderStatus = async (orderId: string, status: any) => {
    setAllOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated = { ...o, status };
          if (activeOrder && activeOrder.id === orderId) {
            setActiveOrder(updated);
          }
          const statusLabels: Record<string, string> = {
            accepted: "تم قبول الطلب وجارٍ التجهيز",
            preparing: "الطلب قيد التجهيز الآن",
            picked_up: "الكابتن استلم الطلب وهو في الطريق إليك 🛵",
            delivered: "تم توصيل الطلب بنجاح ✅",
            cancelled: "تم إلغاء الطلب ❌"
          };
          playOrderAlertSound("chime");
          addToastNotification({
            order: updated,
            title: "تحديث حالة الطلب 📦",
            message: `الطلب #${orderId}: ${statusLabels[status] || status}`,
            type: "status_change",
            targetRole: "all"
          });
          return updated;
        }
        return o;
      })
    );
    await Promise.allSettled([
      updateOrderStatusInFirestore(orderId, { status }),
      updateOrderOnServer(orderId, { status })
    ]);

    // If order is cancelled, restore reserved stock and reduce soldCount
    if (status === "cancelled") {
      const targetOrder = allOrders.find((o) => o.id === orderId);
      if (targetOrder && targetOrder.status !== "cancelled" && targetOrder.items && targetOrder.items.length > 0) {
        const itemsMap = new Map<string, number>();
        const itemsByNameMap = new Map<string, number>();
        for (const item of targetOrder.items) {
          if (item.product) {
            const qty = Number(item.quantity) || 1;
            if (item.product.id) {
              itemsMap.set(item.product.id, (itemsMap.get(item.product.id) || 0) + qty);
            }
            if (item.product.name) {
              const key = `${targetOrder.storeId || item.product.storeId}_${item.product.name.trim().toLowerCase()}`;
              itemsByNameMap.set(key, (itemsByNameMap.get(key) || 0) + qty);
            }
          }
        }

        if (itemsMap.size > 0 || itemsByNameMap.size > 0) {
          const restoredProductsToSync: Product[] = [];
          const nextProducts = products.map((p) => {
            let qtyToRestore = itemsMap.get(p.id);
            if (!qtyToRestore && p.name) {
              const key = `${p.storeId}_${p.name.trim().toLowerCase()}`;
              qtyToRestore = itemsByNameMap.get(key);
            }
            if (qtyToRestore && qtyToRestore > 0) {
              const currentStock = p.stock !== undefined ? p.stock : 0;
              const newStock = currentStock + qtyToRestore;
              const currentSold = p.soldCount || 0;
              const newSold = Math.max(0, currentSold - qtyToRestore);

              const restoredProd: Product = {
                ...p,
                stock: newStock,
                soldCount: newSold,
                inStock: newStock > 0,
                isAvailable: newStock > 0
              };
              restoredProductsToSync.push(restoredProd);
              return restoredProd;
            }
            return p;
          });

          if (restoredProductsToSync.length > 0) {
            setProducts(nextProducts);
            setAllOrders((prev) =>
              prev.map((o) => (o.id === orderId ? { ...o, stockDeducted: false } : o))
            );
            try {
              localStorage.setItem("tw_products", JSON.stringify(nextProducts));
            } catch (err) {}

            Promise.allSettled([
              updateOrderStatusInFirestore(orderId, { status: "cancelled", stockDeducted: false } as any),
              updateOrderOnServer(orderId, { status: "cancelled", stockDeducted: false }),
              ...restoredProductsToSync.flatMap((prod) => [
                saveProductToFirestore(prod),
                updateProductOnServer(prod)
              ])
            ]).catch(() => {});
          }
        }
      }
    }

    // If order is delivered or completed, ensure stock was deducted
    if (status === "delivered") {
      const targetOrder = allOrders.find((o) => o.id === orderId);
      if (targetOrder && !targetOrder.stockDeducted && targetOrder.items && targetOrder.items.length > 0) {
        const itemsMap = new Map<string, number>();
        const itemsByNameMap = new Map<string, number>();
        for (const item of targetOrder.items) {
          if (item.product) {
            const qty = Number(item.quantity) || 1;
            if (item.product.id) {
              itemsMap.set(item.product.id, (itemsMap.get(item.product.id) || 0) + qty);
            }
            if (item.product.name) {
              const key = `${targetOrder.storeId || item.product.storeId}_${item.product.name.trim().toLowerCase()}`;
              itemsByNameMap.set(key, (itemsByNameMap.get(key) || 0) + qty);
            }
          }
        }

        if (itemsMap.size > 0 || itemsByNameMap.size > 0) {
          const deductedProductsToSync: Product[] = [];
          const nextProducts = products.map((p) => {
            let qtyToDeduct = itemsMap.get(p.id);
            if (!qtyToDeduct && p.name) {
              const key = `${p.storeId}_${p.name.trim().toLowerCase()}`;
              qtyToDeduct = itemsByNameMap.get(key);
            }
            if (qtyToDeduct && qtyToDeduct > 0) {
              const currentStock = p.stock !== undefined ? p.stock : 50;
              const newStock = Math.max(0, currentStock - qtyToDeduct);
              const currentSold = p.soldCount || 0;
              const newSold = currentSold + qtyToDeduct;
              const isDepleted = newStock <= 0;

              const updatedProd: Product = {
                ...p,
                stock: newStock,
                soldCount: newSold,
                inStock: !isDepleted,
                isAvailable: !isDepleted
              };
              deductedProductsToSync.push(updatedProd);
              return updatedProd;
            }
            return p;
          });

          if (deductedProductsToSync.length > 0) {
            setProducts(nextProducts);
            setAllOrders((prev) =>
              prev.map((o) => (o.id === orderId ? { ...o, stockDeducted: true } : o))
            );
            try {
              localStorage.setItem("tw_products", JSON.stringify(nextProducts));
            } catch (err) {}

            Promise.allSettled([
              updateOrderStatusInFirestore(orderId, { status: "delivered", stockDeducted: true } as any),
              updateOrderOnServer(orderId, { status: "delivered", stockDeducted: true }),
              ...deductedProductsToSync.flatMap((prod) => [
                saveProductToFirestore(prod),
                updateProductOnServer(prod)
              ])
            ]).catch(() => {});
          }
        }
      }
    }
  };

  const handleAssignDriverToOrder = async (orderId: string, driver: DriverMember | null) => {
    const driverUpdates: Partial<Order> = {
      driverId: driver ? driver.id : undefined,
      driverName: driver ? driver.name : undefined,
      driverPhone: driver ? driver.phone : undefined,
      driverVehicle: driver ? (driver.vehicle || "دراجة نارية") : undefined,
      assignedAt: driver ? new Date().toISOString() : undefined,
      status: driver ? "accepted" : undefined
    };

    setAllOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated: Order = {
            ...o,
            ...driverUpdates,
            status: o.status === "pending" && driver ? "accepted" : o.status
          };
          if (activeOrder && activeOrder.id === orderId) {
            setActiveOrder(updated);
          }
          if (driver) {
            playOrderAlertSound("chime");
            addToastNotification({
              order: updated,
              title: "تم توجيه وتعيين كابتن للطلب 🛵",
              message: `تم إسناد الطلب #${orderId} إلى الكابتن (${driver.name}) بنجاح`,
              type: "driver_assigned",
              targetRole: "all"
            });
            showSystemNotification(`تعيين كابتن للطلب #${orderId}`, {
              body: `الكابتن ${driver.name} سيتولى توصيل الطلب إلى الزبون.`
            });
          }
          return updated;
        }
        return o;
      })
    );
    await Promise.allSettled([
      updateOrderStatusInFirestore(orderId, driverUpdates),
      updateOrderOnServer(orderId, driverUpdates)
    ]);
  };

  useEffect(() => {
    if (userRole) {
      localStorage.setItem("tw_user_role", userRole);
    }
    if (userProfile) {
      localStorage.setItem("tw_customer_user", JSON.stringify(userProfile));
      localStorage.setItem("tw_user_profile", JSON.stringify(userProfile));
    }
  }, [userRole, userProfile]);

  // Handlers for Cart
  const handleAddToCart = (product: Product, selectedSize?: StoreSize, selectedAdditions: StoreAddition[] = []) => {
    // 1. Check if product is out of stock
    const isOutOfStock = product.isAvailable === false || product.inStock === false || (product.stock !== undefined && product.stock <= 0);
    if (isOutOfStock) {
      addToastNotification({
        title: "عذراً، نفذت الكمية ❌",
        message: `الصنف "${product.name}" غير متوفر حالياً في المخزون حتى يتم تجديده.`,
        type: "warning"
      });
      return;
    }

    // 2. Check if user already reached maximum available stock in cart
    const currentQtyInCart = cartItems
      .filter((item) => item.product.id === product.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    if (product.stock !== undefined && currentQtyInCart >= product.stock) {
      addToastNotification({
        title: "وصلت للحد الأقصى المتوفر ⚠️",
        message: `المخزون المتوفر من "${product.name}" هو ${product.stock} ${product.unit || "قطعة"} فقط.`,
        type: "warning"
      });
      return;
    }

    if (cartItems.length > 0 && cartItems[0].product.storeId !== product.storeId) {
      const confirmClear = window.confirm(
        "لقد قمت بإضافة منتج من متجر مختلف. هل تود إفراغ السلة وتحديثها بمنتجات المتجر الجديد؟"
      );
      if (!confirmClear) return;
      const basePrice = selectedSize ? selectedSize.price : product.price;
      const additionsTotal = selectedAdditions.reduce((sum, a) => sum + a.price, 0);
      setCartItems([
        {
          product,
          quantity: 1,
          selectedSize,
          selectedAdditions,
          totalItemPrice: basePrice + additionsTotal
        }
      ]);
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => {
        if (item.product.id !== product.id) return false;
        const sameSize = (item.selectedSize?.name || "") === (selectedSize?.name || "");
        const itemAdditions = item.selectedAdditions?.map((a) => a.name).sort().join(",") || "";
        const targetAdditions = selectedAdditions.map((a) => a.name).sort().join(",") || "";
        return sameSize && itemAdditions === targetAdditions;
      });

      if (existing) {
        return prev.map((item) => {
          if (item === existing) {
            return { ...item, quantity: item.quantity + 1 };
          }
          return item;
        });
      }

      const basePrice = selectedSize ? selectedSize.price : product.price;
      const additionsTotal = selectedAdditions.reduce((sum, a) => sum + a.price, 0);
      return [
        ...prev,
        {
          product,
          quantity: 1,
          selectedSize,
          selectedAdditions,
          totalItemPrice: basePrice + additionsTotal
        }
      ];
    });
  };

  const handleRemoveFromCart = (product: Product, selectedSize?: StoreSize, selectedAdditions: StoreAddition[] = []) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => {
        if (item.product.id !== product.id) return false;
        const sameSize = (item.selectedSize?.name || "") === (selectedSize?.name || "");
        const itemAdditions = item.selectedAdditions?.map((a) => a.name).sort().join(",") || "";
        const targetAdditions = selectedAdditions.map((a) => a.name).sort().join(",") || "";
        return sameSize && itemAdditions === targetAdditions;
      });

      if (!existing) return prev;

      if (existing.quantity === 1) {
        return prev.filter((item) => item !== existing);
      } else {
        return prev.map((item) => (item === existing ? { ...item, quantity: item.quantity - 1 } : item));
      }
    });
  };

  const handleCheckout = async (orderData: any) => {
    const store = stores.find((s) => s.id === orderData.storeId);
    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const deliveryFee = orderData.deliveryFee !== undefined && orderData.deliveryFee !== null
      ? Number(orderData.deliveryFee)
      : (store && store.deliveryFee !== undefined && store.deliveryFee !== null ? Number(store.deliveryFee) : 0);
    const total = orderData.total !== undefined ? Number(orderData.total) : (subtotal + deliveryFee);
    const orderId = orderData.id || "tw-" + Math.floor(Math.random() * 90000 + 10000);

    const newOrder: Order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      status: "pending",
      subtotal,
      deliveryFee,
      total,
      storeName: store ? store.name : "متجر القرية",
      stockDeducted: true,
      ...orderData
    };

    setActiveOrder(newOrder);
    setAllOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
    setCartItems([]);
    setIsViewingCart(false);

    // Synchronize sold quantities with displayed stock synchronously:
    // With every sale, decrease the displayed quantity and increase soldCount until out of stock
    const itemsMap = new Map<string, number>();
    const itemsByNameMap = new Map<string, number>();
    for (const item of newOrder.items || []) {
      if (item.product) {
        const qty = Number(item.quantity) || 1;
        if (item.product.id) {
          itemsMap.set(item.product.id, (itemsMap.get(item.product.id) || 0) + qty);
        }
        if (item.product.name) {
          const key = `${newOrder.storeId || item.product.storeId}_${item.product.name.trim().toLowerCase()}`;
          itemsByNameMap.set(key, (itemsByNameMap.get(key) || 0) + qty);
        }
      }
    }

    const updatedProductsToSync: Product[] = [];
    let nextProducts = products;
    if (itemsMap.size > 0 || itemsByNameMap.size > 0) {
      nextProducts = products.map((p) => {
        let qtySold = itemsMap.get(p.id);
        if (!qtySold && p.name) {
          const key = `${p.storeId}_${p.name.trim().toLowerCase()}`;
          qtySold = itemsByNameMap.get(key);
        }

        if (qtySold && qtySold > 0) {
          const currentStock = p.stock !== undefined ? p.stock : 50;
          const newStock = Math.max(0, currentStock - qtySold);
          const currentSold = p.soldCount || 0;
          const newSold = currentSold + qtySold;
          const isDepleted = newStock <= 0;

          const updatedProd: Product = {
            ...p,
            stock: newStock,
            soldCount: newSold,
            inStock: !isDepleted,
            isAvailable: !isDepleted
          };
          updatedProductsToSync.push(updatedProd);
          return updatedProd;
        }
        return p;
      });

      if (updatedProductsToSync.length > 0) {
        setProducts(nextProducts);
        try {
          localStorage.setItem("tw_products", JSON.stringify(nextProducts));
        } catch (err) {
          console.warn("Failed saving products to localStorage:", err);
        }
      }
    }

    // Save order & updated products to Firebase Firestore & server storage for multi-device sync
    await Promise.allSettled([
      saveOrderToFirestore(newOrder),
      saveOrderOnServer(newOrder),
      ...updatedProductsToSync.flatMap((prod) => [
        saveProductToFirestore(prod),
        updateProductOnServer(prod)
      ])
    ]);

    // Play ringing alert sound & dispatch real-time notifications to Admin & Store
    playOrderAlertSound("ringtone");
    triggerOrderVibration();
    broadcastNewOrder(newOrder);
    showSystemNotification(`طلب جديد #${newOrder.id} 🛍️`, {
      body: `متجر: ${newOrder.storeName} | الزبون: ${newOrder.customerName} | الإجمالي: ${newOrder.total} ل.س`
    });
    addToastNotification({
      order: newOrder,
      title: "تم إرسال طلبكم بنجاح! 🛍️",
      message: `طلب رقم #${newOrder.id} إلى (${newOrder.storeName}) بقيمة ${newOrder.total.toLocaleString()} ل.س`,
      type: "new_order"
    });
  };

  const handleCustomOrder = async (customData: any) => {
    const orderId = "tw-" + Math.floor(Math.random() * 90000 + 10000);
    const newOrder: Order = {
      id: orderId,
      status: "pending",
      createdAt: new Date().toISOString(),
      items: [],
      subtotal: 0,
      deliveryFee: customData.deliveryFee !== undefined && customData.deliveryFee !== null ? Number(customData.deliveryFee) : 0,
      total: customData.total !== undefined ? Number(customData.total) : (customData.deliveryFee !== undefined && customData.deliveryFee !== null ? Number(customData.deliveryFee) : 0),
      storeId: customData.storeId || "custom_order",
      storeName: customData.storeName || "طلب مخصص",
      customerName: customData.customerName || userProfile?.name || "زبون القرية",
      customerPhone: customData.customerPhone || userProfile?.phone || "09xxxxxxxx",
      addressLandmark: selectedLandmark,
      ...customData
    };

    setActiveOrder(newOrder);
    setAllOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);

    // Save custom order to Firebase Firestore & server storage
    await Promise.allSettled([
      saveOrderToFirestore(newOrder),
      saveOrderOnServer(newOrder)
    ]);

    // Play ringing alert sound & dispatch real-time notifications
    playOrderAlertSound("ringtone");
    triggerOrderVibration();
    broadcastNewOrder(newOrder);
    showSystemNotification(`طلب خاص جديد #${newOrder.id} 🔔`, {
      body: `المرسل: ${newOrder.customerName} | ${newOrder.storeName}`
    });
    addToastNotification({
      order: newOrder,
      title: "تم إرسال الطلب المخصص بنجاح 📋",
      message: `طلب #${newOrder.id} من الزبون ${newOrder.customerName}`,
      type: "new_order"
    });
  };

  const handleAuthSuccess = (profile: UserProfile, role: "customer" | "store_owner" | "admin" | "driver") => {
    localStorage.setItem("tw_customer_user", JSON.stringify(profile));
    localStorage.setItem("tw_user_role", role);
    
    // Save last active role for the AuthModal tab selection
    if (role === "store_owner") {
      localStorage.setItem("tw_last_active_role", "store");
    } else if (role === "driver") {
      localStorage.setItem("tw_last_active_role", "driver");
    } else if (role === "admin") {
      localStorage.setItem("tw_last_active_role", "staff");
    } else {
      localStorage.setItem("tw_last_active_role", "customer");
    }

    setUserProfile(profile);
    setUserRole(role);
    setShowAuthModal(false);
    if (role === "driver") {
      setIsDriverMode(true);
      setIsAdminMode(false);
      setSelectedStore(null);
      setIsViewingCart(false);
      localStorage.setItem("tw_viewing_driver", "true");
      localStorage.setItem("tw_viewing_admin", "false");
    } else if (role === "admin") {
      setIsAdminMode(true);
      setIsDriverMode(false);
      setSelectedStore(null);
      setIsViewingCart(false);
      localStorage.setItem("tw_viewing_admin", "true");
      localStorage.setItem("tw_viewing_driver", "false");
    } else if (role === "store_owner") {
      const cleanPhone = (p?: string) => (p || "").replace(/[^0-9]/g, "");
      const matchedStore = stores.find(s => 
        (profile.storeId && s.id === profile.storeId) ||
        (profile.phone && cleanPhone(s.ownerPhone) === cleanPhone(profile.phone)) ||
        (profile.phone && cleanPhone(s.contactPhone) === cleanPhone(profile.phone)) ||
        (profile.name && s.name.includes(profile.name))
      );
      const sId = profile.storeId || matchedStore?.id || "store_" + Date.now();
      setCurrentStoreId(sId);
      localStorage.setItem("tw_current_store_id", sId);
      setIsAdminMode(false);
      setIsDriverMode(false);
      setSelectedStore(null);
      setIsViewingCart(false);
    } else {
      setIsAdminMode(false);
      setIsDriverMode(false);
    }
  };

  const handleLogout = () => {
    // Preserve tw_last_active_role and tw_saved_* credentials for fast PIN-only subsequent login
    if (userRole === "store_owner") {
      localStorage.setItem("tw_last_active_role", "store");
    } else if (userRole === "driver") {
      localStorage.setItem("tw_last_active_role", "driver");
    } else if (userRole === "admin") {
      localStorage.setItem("tw_last_active_role", "staff");
    } else {
      localStorage.setItem("tw_last_active_role", "customer");
    }

    localStorage.removeItem("tw_customer_user");
    localStorage.removeItem("tw_user_role");
    localStorage.removeItem("tw_current_store_id");
    localStorage.removeItem("tw_viewing_admin");
    localStorage.removeItem("tw_viewing_driver");
    setUserProfile(null);
    setUserRole("guest");
    setCurrentStoreId(null);
    setCartItems([]);
    setActiveOrder(null);
    setSelectedStore(null);
    setIsViewingCart(false);
    setIsAdminMode(false);
    setIsDriverMode(false);
    setShowAuthModal(true);
  };

  const handleCleanSlateData = async (options: { target: "all" | "orders_only" | "restore_defaults" }) => {
    if (options.target === "restore_defaults") {
      localStorage.removeItem("tw_clean_slate_active");
      localStorage.removeItem("tw_stores");
      localStorage.removeItem("tw_products");
      localStorage.removeItem("tw_orders");
      setStores(initialStores);
      setProducts(initialProducts);
      setAllOrders(initialOrders);
      await Promise.allSettled([
        restoreDefaultsOnServer(),
        reseedFirestoreDemoData()
      ]);
      addToastNotification({
        order: {
          id: "tw-reset",
          storeId: "",
          storeName: "توصيل القرية",
          items: [],
          subtotal: 0,
          deliveryFee: 0,
          total: 0,
          status: "pending",
          createdAt: new Date().toISOString(),
          customerName: "",
          customerPhone: "",
          addressLandmark: ""
        },
        title: "تمت استعادة البيانات التوضيحية الافتراضية بنجاح 🔄",
        message: "تمت استعادة قائمة المتاجر والمنتجات والطلبات التوضيحية للتجربة.",
        type: "info"
      });
    } else if (options.target === "orders_only") {
      setAllOrders([]);
      localStorage.setItem("tw_orders", JSON.stringify([]));
      await Promise.allSettled([
        cleanSlateOnServer("orders_only"),
        cleanSlateFirestore("orders_only")
      ]);
      addToastNotification({
        order: {
          id: "tw-reset",
          storeId: "",
          storeName: "توصيل القرية",
          items: [],
          subtotal: 0,
          deliveryFee: 0,
          total: 0,
          status: "pending",
          createdAt: new Date().toISOString(),
          customerName: "",
          customerPhone: "",
          addressLandmark: ""
        },
        title: "تم تفريغ وتصفير سجل الطلبات التجريبية 📦✨",
        message: "تم مسح جميع الطلبات التجريبية مع بقاء المتاجر والمنتجات والإعدادات كاملة.",
        type: "info"
      });
    } else {
      // target === "all" (Clean Slate)
      localStorage.setItem("tw_clean_slate_active", "true");
      setStores([]);
      setProducts([]);
      setAllOrders([]);
      localStorage.setItem("tw_stores", JSON.stringify([]));
      localStorage.setItem("tw_products", JSON.stringify([]));
      localStorage.setItem("tw_orders", JSON.stringify([]));
      await Promise.allSettled([
        cleanSlateOnServer("all"),
        cleanSlateFirestore("all")
      ]);
      addToastNotification({
        order: {
          id: "tw-reset",
          storeId: "",
          storeName: "توصيل القرية",
          items: [],
          subtotal: 0,
          deliveryFee: 0,
          total: 0,
          status: "pending",
          createdAt: new Date().toISOString(),
          customerName: "",
          customerPhone: "",
          addressLandmark: ""
        },
        title: "تم تصفير الأمثلة والبدء على نظافة 🧹✨",
        message: "أصبح التطبيق الآن جاهزاً على نظافة مع الحفاظ التام على كامل إعدادات وحسابات البرنامج.",
        type: "info"
      });
    }
  };

  const handleShareWhatsApp = (type: "regular" | "business") => {
    const liveAppUrl = getAppUrl();
    const templates = getShareTemplates("توصيل", liveAppUrl);
    openWhatsApp({
      message: templates.headerQuickShare,
      type
    });
  };

  const handleCopyLink = () => {
    const liveAppUrl = getAppUrl();
    navigator.clipboard.writeText(liveAppUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Filtered Stores
  const visibleStores = stores.filter((store) => {
    if (!store || store.isApproved === false || store.isHidden === true) return false;
    const matchesCategory =
      selectedCategory === "all" ||
      store.category === selectedCategory ||
      (selectedCategory === "clothes" && (store.category === "cat_mtuj2s13ho2" || store.category === "ألبسة وملابس وأزياء" || store.category?.includes("cloth")));
    const sName = (store.name || "").toLowerCase();
    const sDesc = (store.description || "").toLowerCase();
    const sFeat = (store.featuredProduct || "").toLowerCase();
    const q = (searchQuery || "").toLowerCase();
    const matchesSearch = sName.includes(q) || sDesc.includes(q) || sFeat.includes(q);
    return matchesCategory && matchesSearch;
  });

  const offerProducts = products.filter(
    (p) =>
      p.isOffer &&
      !p.isHidden &&
      p.isApproved !== false &&
      p.approvalStatus !== "pending" &&
      p.approvalStatus !== "rejected"
  );
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // If user is guest and no profile exists
  if (userRole === "guest" && !userProfile) {
    return (
      <AuthModal
        onRegister={handleAuthSuccess}
        stores={stores}
        onAddStore={handleAddNewStore}
        categories={categories}
        activeOrder={activeOrder}
        onTrackOrder={() => {
          if (activeOrder) {
            setUserRole("customer");
          }
        }}
        onClose={() => {
          const guestProfile: UserProfile = { name: "زائر متسوق", phone: "09xxxxxxxx", pin: "1234" };
          setUserProfile(guestProfile);
          setUserRole("customer");
        }}
        driversList={driversList}
      />
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-800 flex flex-col items-center font-sans selection:bg-orange-500 selection:text-slate-950 pb-12" dir="rtl">
      {/* Offline Connectivity Status Banner */}
      <OfflineBanner />

      {/* Top Application Header */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 py-3 px-3 sm:px-6 sticky top-0 z-50 shadow-xs select-none">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Branding */}
          <div
            onClick={() => {
              if (!activeOrder) {
                setSelectedStore(null);
                setIsViewingCart(false);
                setIsAdminMode(false);
                setIsDriverMode(false);
              }
            }}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer shrink-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-900 text-orange-500 flex items-center justify-center shadow-md border border-slate-800 shrink-0">
              <Bike className="w-5 h-5 sm:w-5.5 sm:h-5.5 animate-bounce-slow" />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-sm sm:text-xl tracking-tight leading-none">
                توصيل
              </h1>
              <p className="text-[9px] text-slate-400 font-bold leading-none mt-1 hidden xs:block">
                توصيل المتاجر والقرية
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center flex-wrap justify-end gap-1.5 sm:gap-3">
            {/* App Update Notification Icon & Button (الايقونة تختفي بعد التحديث) */}
            {hasNewUpdate && (
              <button
                type="button"
                onClick={() => setShowUpdateModal(true)}
                className="py-2 px-2.5 sm:px-3 rounded-xl border border-amber-300 bg-linear-to-r from-amber-100/95 via-orange-100/90 to-amber-50 hover:from-amber-200 hover:to-orange-200 text-amber-950 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-black shadow-xs active:scale-95 animate-pulse shrink-0"
                title="يوجد تحديث وميزات جديدة للتطبيق - اضغط للتحديث"
              >
                <div className="relative flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-orange-600 animate-spin-slow shrink-0" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-600 ring-2 ring-white animate-ping" />
                </div>
                <span className="hidden xs:inline text-orange-950 font-black">تحديث جديد 🚀</span>
                <span className="xs:hidden text-[10px] text-orange-950 font-black">تحديث 🚀</span>
              </button>
            )}

            {/* Sound Notification quick toggle & settings button */}
            <button
              type="button"
              onClick={() => setShowSoundModal(true)}
              className={`py-2 px-2.5 sm:px-3 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-black shadow-xs active:scale-95 whitespace-nowrap ${
                soundEnabled
                  ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
                  : "border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-500"
              }`}
              title="إعدادات وتخصيص رنين وتنبيهات الطلبات"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
              <span className="hidden md:inline">
                {soundEnabled ? "صوت التنبيه مفعّل" : "الصوت مكتوم"}
              </span>
            </button>

            {activeOrder && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStore(null);
                  setIsViewingCart(false);
                  setIsAdminMode(false);
                }}
                className="bg-orange-500 text-white hover:bg-orange-600 font-extrabold text-xs py-2 px-3.5 sm:px-4 rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
                title="متابعة وتتبع طلبك الحالي"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-ping inline-block" />
                <span>تتبع طلبك الحالي</span>
              </button>
            )}

            {/* User Login & Account Switch Button in Header */}
            {!userProfile || userRole === "guest" ? (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="py-2 px-3 sm:px-4 rounded-xl border border-orange-400/80 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-black shadow-md shadow-orange-500/20 active:scale-95 whitespace-nowrap"
                title="تسجيل الدخول / تبديل الحساب"
              >
                <LogIn className="w-4 h-4 text-white shrink-0" />
                <span>تسجيل الدخول</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                {/* Direct quick button to go to Admin Panel if logged in as Admin and browsing as customer */}
                {userRole === "admin" && !isAdminMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStore(null);
                      setIsViewingCart(false);
                      setIsAdminMode(true);
                      setIsDriverMode(false);
                      localStorage.setItem("tw_viewing_admin", "true");
                      localStorage.setItem("tw_viewing_driver", "false");
                    }}
                    className="py-1.5 px-2.5 sm:px-3.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-black shadow-sm active:scale-95 whitespace-nowrap animate-fade-in"
                    title="العودة المباشرة إلى لوحة الإدارة"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="hidden sm:inline">لوحة الإدارة 🛡️</span>
                    <span className="sm:hidden">الإدارة 🛡️</span>
                  </button>
                )}

                {/* Direct quick button for driver if on home view */}
                {userRole === "driver" && !isDriverMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStore(null);
                      setIsViewingCart(false);
                      setIsDriverMode(true);
                      setIsAdminMode(false);
                      localStorage.setItem("tw_viewing_driver", "true");
                      localStorage.setItem("tw_viewing_admin", "false");
                    }}
                    className="py-1.5 px-2.5 sm:px-3.5 rounded-xl border border-blue-700 bg-blue-900 hover:bg-blue-800 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-black shadow-sm active:scale-95 whitespace-nowrap animate-fade-in"
                    title="العودة المباشرة إلى لوحة الكابتن"
                  >
                    <Bike className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                    <span>الكابتن 🚴</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowAccountModal(true)}
                  className="py-1.5 px-2.5 sm:px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-black shadow-xs active:scale-95 whitespace-nowrap"
                  title="إعدادات الحساب والملف الشخصي وتبديل الحساب"
                >
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="max-w-[85px] sm:max-w-[130px] truncate">{userProfile.name}</span>
                </button>
              </div>
            )}

            {/* Back to Home Button */}
            {(isAdminMode || isDriverMode || selectedStore || isViewingCart) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStore(null);
                  setIsViewingCart(false);
                  setIsAdminMode(false);
                  setIsDriverMode(false);
                  setActiveOrder(null);
                }}
                className="py-2 px-3 sm:px-4 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-600 transition-all cursor-pointer flex items-center gap-1.5 font-black text-xs sm:text-sm shadow-xs animate-fade-in"
                title="الرجوع للقائمة الرئيسية"
              >
                <ArrowLeft className="w-4 h-4 text-orange-600" />
                <span>الرئيسية / عودة</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-28 flex-1 w-full relative min-h-[500px]">
        {/* Router Views with Smooth Transition */}
        <AnimatePresence mode="wait">
          {userRole === "store_owner" ? (
            <motion.div
              key={`store_owner_${currentStoreId || userProfile?.storeId || "owner"}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <ErrorBoundary fallbackTitle="تنبيه في لوحة تحكم المتجر 🛠️">
                <React.Suspense fallback={<div className="flex items-center justify-center min-h-[300px] text-slate-500 font-bold">جاري تحميل لوحة المتجر...</div>}>
                  <StoreOwnerPortal
                    storeId={
                      currentStoreId ||
                      userProfile?.storeId ||
                      (userProfile?.phone
                        ? stores.find((s) => {
                            const uPhone = (userProfile.phone || "").replace(/[^0-9]/g, "");
                            return (
                              (s.ownerPhone && s.ownerPhone.replace(/[^0-9]/g, "") === uPhone) ||
                              (s.contactPhone && s.contactPhone.replace(/[^0-9]/g, "") === uPhone) ||
                              (userProfile.name && s.name.includes(userProfile.name))
                            );
                          })?.id
                        : null) ||
                      stores[0]?.id ||
                      "store_owner"
                    }
                    stores={stores}
                    products={products}
                    orders={allOrders}
                    categories={categories}
                    userProfile={userProfile!}
                    broadcasts={storeBroadcasts}
                    onUpdateStore={handleUpdateStore}
                    onAddProduct={handleAddNewProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProduct}
                    onUpdateOrderStatus={handleUpdateOrderStatus}
                    onAcknowledgeBroadcast={handleAcknowledgeBroadcast}
                    onLogout={handleLogout}
                    onBackToCustomerView={() => {
                      setUserRole("customer");
                      setCurrentStoreId(null);
                    }}
                    currency="ل.س"
                  />
                </React.Suspense>
              </ErrorBoundary>
            </motion.div>
          ) : isAdminMode && userRole === "admin" ? (
            <motion.div
              key="admin_dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <React.Suspense fallback={<div className="flex items-center justify-center min-h-[300px] text-slate-500 font-bold">جاري تحميل لوحة الإدارة...</div>}>
                <Dashboard
                  userRole="admin"
                  userProfile={userProfile!}
                  stores={stores}
                  products={products}
                  orders={allOrders}
                  categories={categories}
                  mapNodes={mapNodes}
                  broadcasts={storeBroadcasts}
                  driversList={driversList}
                  onAddDriver={handleAddNewDriver}
                  onUpdateDriver={handleUpdateDriver}
                  onDeleteDriver={handleDeleteDriver}
                  onAddStore={handleAddNewStore}
                  onUpdateStore={handleUpdateStore}
                  onDeleteStore={handleDeleteStore}
                  onAddProduct={handleAddNewProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onAddCategory={handleAddNewCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onReorderCategories={handleReorderCategories}
                  onAddMapNode={(node) => setMapNodes((prev) => [...prev, node])}
                  onUpdateMapNode={(node) => setMapNodes((prev) => prev.map((n) => (n.id === node.id ? node : n)))}
                  onDeleteMapNode={(nodeId) => setMapNodes((prev) => prev.filter((n) => n.id !== nodeId))}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onAssignDriver={handleAssignDriverToOrder}
                  onSendBroadcast={handleSendBroadcast}
                  onDeleteBroadcast={handleDeleteBroadcast}
                  onResendBroadcast={handleResendBroadcast}
                  onCleanSlateData={handleCleanSlateData}
                  onLogout={handleLogout}
                />
              </React.Suspense>
            </motion.div>
          ) : (userRole === "driver" && isDriverMode) || (userRole === "admin" && isDriverMode) ? (
            <motion.div
              key="driver_dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <React.Suspense fallback={<div className="flex items-center justify-center min-h-[300px] text-slate-500 font-bold">جاري تحميل لوحة الكابتن...</div>}>
                <DriverPortal
                  userProfile={userProfile!}
                  orders={allOrders}
                  stores={stores}
                  driversList={driversList}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onAssignDriver={handleAssignDriverToOrder}
                  onLogout={handleLogout}
                  onBackToCustomerView={() => {
                    setIsDriverMode(false);
                    setUserRole("customer");
                  }}
                  currency="ل.س"
                />
              </React.Suspense>
            </motion.div>
          ) : activeOrder ? (
            <motion.div
              key={`order_tracker_${activeOrder.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <OrderTracker
                order={activeOrder}
                onBack={() => setActiveOrder(null)}
                mapNodes={mapNodes}
                stores={stores}
                onCancelOrder={(orderId) => handleUpdateOrderStatus(orderId, "cancelled")}
              />
            </motion.div>
          ) : isViewingCart ? (
            <motion.div
              key="cart_checkout"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <CartCheckout
                cartItems={cartItems}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                onClearCart={() => setCartItems([])}
                onCheckout={handleCheckout}
                onBackToShopping={() => setIsViewingCart(false)}
                selectedLandmark={selectedLandmark}
                onSelectLandmark={setSelectedLandmark}
                customerUser={userProfile}
                mapNodes={mapNodes}
                stores={stores}
                coupons={coupons}
              />
            </motion.div>
          ) : selectedStore ? (
            <motion.div
              key={`store_details_${selectedStore.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <ErrorBoundary 
                fallbackTitle={`تنبيه في عرض تفاصيل (${selectedStore.name || "المتجر"}) 🛠️`}
                onReset={() => setSelectedStore(null)}
              >
                <StoreDetails
                  store={stores.find((st) => st.id === selectedStore.id) || selectedStore}
                  onBack={() => setSelectedStore(null)}
                  cartItems={cartItems}
                  onAddToCart={handleAddToCart}
                  onRemoveFromCart={handleRemoveFromCart}
                  onViewCart={() => setIsViewingCart(true)}
                  products={products}
                  onSubmitCustomOrder={handleCustomOrder}
                  customerUser={userProfile}
                  landmarks={mapNodes.map((n) => n.arabicName || n.name)}
                  currentLandmark={selectedLandmark}
                  reviews={reviews}
                  onAddReview={handleAddReview}
                  userOrders={allOrders.filter((o) => {
                    if (!userProfile) return true;
                    return o.customerPhone === userProfile.phone || o.customerName === userProfile.name;
                  })}
                />
              </ErrorBoundary>
            </motion.div>
          ) : (
            /* ========================================================================= */
            /* THE COMPLETE MAIN HOME VIEW (الواجهة الأولى / الرئيسية للتطبيق)             */
            /* ========================================================================= */
            <motion.div
              key="main_home_view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-8"
            >
              {/* 1. Emergency High Rush Alert Banner (Conditional) */}
            {emergencyRush && (
              <div
                className="bg-red-600 text-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl flex items-center justify-between gap-4 border border-red-500 text-right animate-pulse"
                dir="rtl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl shrink-0">🚨</span>
                  <div>
                    <h4 className="font-black text-sm sm:text-base">
                      تنبيه: تم تجميد استقبال الطلبات مؤقتاً بسبب ضغط العمل العالي
                    </h4>
                    <p className="text-xs text-red-100 mt-0.5">
                      نعمل بكامل طاقتنا لتجهيز وتوصيل الطلبات الحالية. سنعاود فتح واستقبال الطلبات قريباً!
                    </p>
                  </div>
                </div>
                <span className="bg-white/20 text-white text-[11px] font-black px-3 py-1.5 rounded-xl shrink-0 whitespace-nowrap">
                  وضع الضغط
                </span>
              </div>
            )}

            {/* 2. Main Hero Banner Card - Compact & Elevated */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-3.5 sm:p-5 border border-slate-700/80 shadow-md relative overflow-hidden select-none -mt-3">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-10"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800')"
                }}
              />
              <div className="absolute -top-6 -right-6 w-36 h-36 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />

              <div className="relative flex items-center justify-between gap-3 text-right" dir="rtl">
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-orange-400 font-extrabold text-[10px] sm:text-xs">
                    <Sparkles className="w-3.5 h-3.5 animate-spin-slow shrink-0" />
                    <span>توصيل المحافظة والقرى المجاورة ⚡</span>
                  </div>
                  <h2 className="text-sm sm:text-lg font-black tracking-tight leading-snug">
                    اطلب ما تحتاجه وسنصلك فوراً!
                  </h2>
                  <p className="text-slate-300 text-[11px] sm:text-xs leading-relaxed truncate">
                    مأكولات، تموين، صيدليات، خضار فريش بأسرع خدمة وتوصيل.
                  </p>
                </div>

                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0 text-orange-400 shadow-inner">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </div>

            {/* 3. Scrolling News Ticker for Store Owner Announcements */}
            <StoreNewsTicker
              stores={stores}
              onSelectStore={(store) => {
                setSelectedStore(store);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />

            {/* 4. Categories Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-right">
                <h3 className="text-sm sm:text-lg font-extrabold text-slate-900">
                  تصنيفات ومجالات التسوق
                </h3>
                <span className="text-[10px] text-slate-400 font-bold block sm:hidden">
                  اسحب لليسار 🫲
                </span>
              </div>

              <div className="flex overflow-x-auto pb-3 gap-2.5 select-none scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:pb-0">
                {/* All Stores Tab */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`snap-center shrink-0 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border text-right transition-all flex items-center gap-2 sm:gap-3 cursor-pointer min-w-[115px] sm:min-w-0 ${
                    selectedCategory === "all"
                      ? "border-slate-900 bg-slate-900 text-white shadow-md"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center ${
                      selectedCategory === "all" ? "bg-orange-500 text-slate-950" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <StoreIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold whitespace-nowrap">
                    جميع المحلات
                  </span>
                </button>

                {/* Categories List (Including Offers according to sorted order) */}
                {categories.filter((cat) => !cat.isHidden).map((cat) => {
                  const isOffers = cat.id === "offers";
                  const isSelected = selectedCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`snap-center shrink-0 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border text-right transition-all flex items-center gap-2 sm:gap-3 cursor-pointer min-w-[115px] sm:min-w-0 ${
                        isSelected
                          ? isOffers
                            ? "border-red-600 bg-red-600 text-white shadow-md"
                            : "border-slate-900 bg-slate-900 text-white shadow-md"
                          : isOffers
                          ? "border-red-200 bg-red-50/70 text-red-800 hover:bg-red-100/80"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center ${
                          isSelected
                            ? isOffers
                              ? "bg-white text-red-600"
                              : "bg-orange-500 text-slate-950"
                            : isOffers
                            ? "bg-red-100 text-red-600"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <CategoryIcon name={cat.icon} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-xs sm:text-sm font-extrabold whitespace-nowrap">
                          {cat.label}
                        </span>
                        {isOffers && !isSelected && (
                          <span className="text-[10px] hidden xs:inline text-red-500">🔥</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Dynamic Content: Offers View OR Stores View */}
            {selectedCategory === "offers" ? (
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-right">
                  <Flame className="w-5.5 h-5.5 text-red-500 fill-red-500" />
                  <h3 className="text-lg font-extrabold text-slate-900">
                    قائمة العروض الحصرية الحالية
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {offerProducts.map((offer) => {
                    const storeOfProduct = stores.find((s) => s.id === offer.storeId);
                    const inCart = cartItems.find((ci) => ci.product.id === offer.id);
                    const qty = inCart ? inCart.quantity : 0;
                    const isOutOfStock = offer.isAvailable === false || offer.inStock === false || (offer.stock !== undefined && offer.stock <= 0);
                    const isMaxStock = offer.stock !== undefined && qty >= offer.stock;

                    return (
                      <div
                        key={offer.id}
                        className={`bg-white rounded-3xl p-4 border shadow-xs flex gap-4 relative overflow-hidden hover:shadow-md transition-all text-right ${
                          isOutOfStock ? "border-slate-200 bg-slate-50/70 opacity-80" : "border-slate-200"
                        }`}
                      >
                        <div className="absolute top-3 left-3 flex flex-col gap-1 items-end z-10">
                          {isOutOfStock ? (
                            <span className="bg-red-600 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-xs">
                              نفذت الكمية ❌
                            </span>
                          ) : (
                            <div className="bg-red-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                              <Flame className="w-3 h-3 fill-white" />
                              <span>{offer.offerLabel || "تخفيض خاص"}</span>
                            </div>
                          )}
                        </div>

                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100 relative">
                          <img
                            src={offer.image}
                            alt={offer.name}
                            className={`w-full h-full object-cover ${isOutOfStock ? "grayscale-[60%]" : ""}`}
                            referrerPolicy="no-referrer"
                          />
                          {offer.stock !== undefined && (
                            <span className={`absolute bottom-1 right-1 text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                              isOutOfStock 
                                ? "bg-red-600 text-white" 
                                : offer.stock <= 5 
                                ? "bg-amber-500 text-white animate-pulse" 
                                : "bg-slate-900/80 text-white backdrop-blur-xs"
                            }`}>
                              {isOutOfStock ? "نفذ" : `باقي ${offer.stock}`}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              {storeOfProduct && (
                                <span className="text-[10px] text-slate-400 font-extrabold block">
                                  متوفر في: {storeOfProduct.name}
                                </span>
                              )}
                              {offer.soldCount && offer.soldCount > 0 ? (
                                <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-sm">
                                  🔥 بِيع {offer.soldCount}
                                </span>
                              ) : null}
                            </div>
                            <h4 className="font-extrabold text-slate-800 text-sm leading-tight">
                              {offer.name}
                            </h4>
                            <p className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">
                              {offer.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-2.5">
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="font-extrabold text-base text-orange-600">
                                {offer.price} ل.س
                              </span>
                              {offer.originalPrice && (
                                <span className="text-slate-300 line-through text-xs font-semibold">
                                  {offer.originalPrice} ل.س
                                </span>
                              )}
                            </div>

                            {isOutOfStock ? (
                              <span className="bg-slate-100 text-slate-400 border border-slate-200 font-bold text-xs py-1.5 px-3 rounded-xl cursor-not-allowed">
                                غير متوفر
                              </span>
                            ) : qty === 0 ? (
                              <button
                                type="button"
                                onClick={() => handleAddToCart(offer)}
                                className="bg-slate-900 text-white hover:bg-orange-500 hover:text-slate-950 font-bold text-xs py-2 px-3.5 rounded-xl transition-all shadow-xs cursor-pointer whitespace-nowrap"
                              >
                                إضافة للسلة
                              </button>
                            ) : (
                              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-1 shadow-xs select-none">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFromCart(offer)}
                                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="w-6 text-center text-xs font-extrabold text-slate-800">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  disabled={isMaxStock}
                                  onClick={() => handleAddToCart(offer)}
                                  className={`w-6 h-6 flex items-center justify-center rounded-lg font-bold text-xs ${
                                    isMaxStock
                                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                      : "bg-slate-900 text-white cursor-pointer"
                                  }`}
                                  title={isMaxStock ? "وصلت للحد الأقصى المتوفر بالمخزون" : "زيادة الكمية"}
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Search and Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 text-right">
                  <div className="flex items-center gap-2 select-none">
                    <StoreIcon className="w-5.5 h-5.5 text-slate-800" />
                    <h3 className="text-lg font-extrabold text-slate-800">
                      المتاجر والمحلات المتوفرة بالمنطقة
                    </h3>
                  </div>

                  <div className="relative w-full sm:max-w-xs">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث عن متجر بالاسم..."
                      className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-xl py-2.5 pr-10 pl-4 text-xs sm:text-sm outline-none text-slate-800 transition-all shadow-xs"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Stores Listing Grid */}
                {visibleStores.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-100 shadow-xs space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 mx-auto flex items-center justify-center shadow-xs">
                      <StoreIcon className="w-6 h-6" />
                    </div>
                    <p className="text-slate-800 font-extrabold text-sm sm:text-base">
                      {selectedCategory !== "all"
                        ? `لا توجد محلات مسجلة حالياً في قسم "${categories.find(c => c.id === selectedCategory)?.label || ''}"`
                        : "عذراً، لم نجد أي متجر مطابق للبحث!"}
                    </p>
                    <p className="text-slate-400 text-xs max-w-md mx-auto">
                      {selectedCategory !== "all"
                        ? "القسم مفعل ومتاح في المنصة. يمكنك تسجيل المتاجر فيه وتفعيلها لتظهر هنا للزبائن."
                        : "جرب تصنيفات أخرى في الأعلى لتكتشف محلات جديدة."}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory("all");
                          setSearchQuery("");
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs"
                      >
                        عرض كافة المحلات المتاحة
                      </button>
                      {isAdminMode && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAdminMode(true);
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs"
                        >
                          + إضافة متجر جديد من لوحة التحكم
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                    {visibleStores.map((store) => {
                      const categoryObj = categories.find((c) => c.id === store.category);
                      return (
                        <div
                          key={store.id}
                          onClick={() => setSelectedStore(store)}
                          className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-orange-500/25 transition-all duration-300 cursor-pointer flex flex-col group h-full text-right"
                        >
                          <div className="h-28 xs:h-36 sm:h-44 bg-slate-100 relative overflow-hidden">
                            <img
                              src={store.image}
                              alt={store.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-slate-900/85 backdrop-blur-md text-white font-extrabold text-[8px] sm:text-[10px] py-0.5 px-1.5 sm:py-1 sm:px-2.5 rounded-full flex items-center gap-1 shadow">
                              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-400 fill-current" />
                              <span>{store.rating !== undefined && store.rating !== null ? (store.rating === 0 ? "0 (جديد)" : store.rating) : "0 (جديد)"}</span>
                            </div>
                          </div>

                          <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-4">
                            <div className="space-y-1 sm:space-y-1.5 min-w-0">
                              <span className="text-[8px] sm:text-[10px] font-extrabold text-orange-600 bg-orange-500/10 py-0.5 px-1.5 sm:py-1 sm:px-2.5 rounded-full inline-block">
                                {categoryObj?.label || store.category}
                              </span>
                              <h4 className="font-extrabold text-slate-800 text-xs sm:text-base group-hover:text-orange-600 transition-colors truncate">
                                {store.name}
                              </h4>
                              {store.featuredProduct && (
                                <p className="text-slate-400 text-[9px] sm:text-xs font-medium truncate">
                                  سلعة مميزة: <b className="text-slate-500">{store.featuredProduct}</b>
                                </p>
                              )}
                              {store.workingHours && (
                                <p className="text-slate-400 text-[9px] sm:text-xs font-medium flex items-center gap-1 mt-0.5 truncate">
                                  <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                                  <span className="truncate">
                                    الدوام: <b className="text-slate-600 font-bold">{store.workingHours}</b>
                                  </span>
                                </p>
                              )}
                            </div>

                            <div className="border-t border-slate-100 pt-2 sm:pt-3 flex flex-col xs:flex-row xs:items-center justify-between text-[8px] sm:text-xs text-slate-500 gap-1">
                              <div className="flex items-center gap-1 shrink-0">
                                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                                <span>{store.deliveryTime}</span>
                              </div>
                              <div className="flex items-center gap-0.5 sm:gap-1 font-bold text-slate-700 truncate">
                                <Bike className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500 shrink-0" />
                                <span className={`truncate ${store.deliveryFee === 0 ? "text-emerald-600 font-black" : ""}`}>
                                  {store.isService ? "خدمة فورية" : (store.deliveryFee === 0 || store.deliveryFee === undefined ? "توصيل مجاني" : `${store.deliveryFee.toLocaleString()} ل.س`)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

              {/* 7. Village Map Landmark Guidance Footer Card */}
              <div className="bg-slate-900/5 border border-slate-200/60 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-5 select-none text-right">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
                    <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">
                      استكشف القرية وخارطتها
                    </h4>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    تضم قريتنا العديد من المعالم والمدارس والمساجد والمستوصفات الطبية. قمنا بتسجيل كافة المعالم الرئيسية لتسهيل وصف العنوان للمندوب بمجرد اختيار معلم على الخريطة!
                  </p>
                </div>

                <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-extrabold flex items-center gap-1 shrink-0">
                  <MapPin className="w-4 h-4 text-emerald-500 animate-bounce" />
                  <span>شاهد خريطة التوصيل عند تحديد السلة</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Admin PIN Gate Modal with Smooth Animation */}
      <AnimatePresence>
        {showAdminPinModal && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto pt-6 sm:pt-4 pb-48 sm:pb-6" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-xl border border-slate-100 overflow-hidden my-auto"
            >
              <div className="p-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100 text-orange-500">
                  <Lock className="w-6 h-6 animate-bounce" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-slate-800">
                    منطقة الإدارة الآمنة
                  </h3>
                  <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                    الرجاء إدخال الرمز السري للمدير للمتابعة والتحكم في المتاجر والمنتجات.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (adminPinInput === ADMIN_SECRET_PIN) {
                      setIsAdminMode(true);
                      setShowAdminPinModal(false);
                      setAdminPinInput("");
                      setAdminPinError("");
                    } else {
                      setAdminPinError("الرمز السري غير صحيح! الرجاء المحاولة مرة أخرى.");
                      setAdminPinInput("");
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <input
                      type="password"
                      autoFocus
                      required
                      maxLength={4}
                      value={adminPinInput}
                      onChange={(e) => {
                        setAdminPinError("");
                        const cleaned = e.target.value.replace(/[^0-9]/g, "");
                        setAdminPinInput(cleaned);
                      }}
                      placeholder="••••"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-2xl py-3 px-4 text-center text-xl font-black tracking-[0.5em] outline-none text-slate-800 placeholder-slate-300"
                    />
                  </div>

                  {adminPinError && (
                    <p className="text-[10px] text-red-500 font-extrabold animate-fade-in">
                      {adminPinError}
                    </p>
                  )}

                  <div className="bg-orange-50/60 border border-orange-100/50 rounded-xl p-2.5 text-[10px] text-orange-800 font-semibold leading-relaxed">
                    💡 الرمز السري الافتراضي للنظام للتجربة هو:{" "}
                    <strong className="text-orange-900 font-extrabold">1234</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAdminPinModal(false);
                        setAdminPinInput("");
                        setAdminPinError("");
                      }}
                      className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                    >
                      إلغاء
                    </button>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-extrabold shadow-xs shadow-orange-500/15 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>دخول آمن</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Standalone Elegant PWA Installation Modal on Entry */}
      <InstallPromptModal />

      {/* Customer Orders Archive Modal */}
      {showCustomerArchiveModal && (
        <CustomerOrdersArchiveModal
          isOpen={showCustomerArchiveModal}
          orders={allOrders}
          customerPhone={userProfile?.phone}
          customerName={userProfile?.name}
          reviews={reviews}
          onAddReview={handleAddReview}
          onClose={() => setShowCustomerArchiveModal(false)}
          onSelectOrderToTrack={(order) => {
            setActiveOrder(order);
            setShowCustomerArchiveModal(false);
            setSelectedStore(null);
            setIsViewingCart(false);
            setIsAdminMode(false);
            setIsDriverMode(false);
          }}
          onReorder={(items) => {
            if (items && items.length > 0) {
              setCartItems(items);
              setShowCustomerArchiveModal(false);
              setIsViewingCart(true);
              setSelectedStore(null);
            }
          }}
        />
      )}

      {/* Auth Modal Overlay when opened from Header */}
      {showAuthModal && (
        <AuthModal
          onRegister={handleAuthSuccess}
          stores={stores}
          onAddStore={handleAddNewStore}
          categories={categories}
          activeOrder={activeOrder}
          onTrackOrder={() => {
            setShowAuthModal(false);
          }}
          onClose={() => setShowAuthModal(false)}
          driversList={driversList}
        />
      )}

      {/* Sound Settings & Notification Modal */}
      {showSoundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-right"
          >
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    إعدادات رنين وتنبيهات الطلبات
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    تنبيهات فورية للمدير والمتاجر والكباتن
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSoundModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-black cursor-pointer transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${soundEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                    {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">تشغيل الصوت عند الطلبات الجديدة</h4>
                    <p className="text-[11px] text-slate-500">رنين فوري عند وصول طلب جديد</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`w-12 h-6.5 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                    soundEnabled ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <motion.div
                    layout
                    className="bg-white w-4.5 h-4.5 rounded-full shadow-md"
                  />
                </button>
              </div>

              {/* Sound Type Selection */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 block">
                  اختر نغمة الرنين المناسبة:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "ringtone", name: "رنين متجر كلاسيكي", icon: "🔔" },
                    { id: "chime", name: "نغمة هادئة (Chime)", icon: "✨" },
                    { id: "cashier", name: "جرس كاشير ومبيعات", icon: "💰" },
                    { id: "urgent", name: "تنبيه سريع ومكرر", icon: "🚨" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectSoundType(s.id as SoundType)}
                      className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between text-xs font-black ${
                        soundChoice === s.id
                          ? "bg-orange-50 border-orange-400 text-orange-950 shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{s.icon}</span>
                        <span>{s.name}</span>
                      </span>
                      {soundChoice === s.id && <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Test Audio Button */}
              <button
                type="button"
                onClick={() => playOrderAlertSound(soundChoice)}
                className="w-full py-2.5 px-4 bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-300/60 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Volume2 className="w-4 h-4" />
                <span>تجربة صوت الرنين الآن 🔊</span>
              </button>

              {/* Browser Notification Permission */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black text-blue-900">إشعارات النظام المنبثقة</h4>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    hasNotifPermission ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {hasNotifPermission ? "مفعّلة ✅" : "غير مفعّلة"}
                  </span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed font-semibold">
                  تفعيل الإشعارات يضمن وصول تنبيه برقم وتفاصيل الطلب حتى إذا تم تصغير المتصفح أو كان الهاتف مقفلاً.
                </p>
                {!hasNotifPermission && (
                  <button
                    type="button"
                    onClick={handleRequestNotifPermission}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>تفعيل إشعارات المتصفح الآن</span>
                  </button>
                )}
              </div>

              {/* Persistent Background note */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-[11px] text-slate-600 font-semibold leading-relaxed">
                💡 <strong>استمرارية التنبيه:</strong> تم ضبط التطبيق بحيث يحافظ على استقبال الطلبات وتشغيل التنبيهات في الخلفية مع منع الإغلاق المفاجئ عند الضغط على زر الرجوع.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSoundModal(false)}
                className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                حفظ وإغلاق
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* App Update Modal (نافذة ميزات وتطبيق التحديث - تختفي الأيقونة بعد التحديث) */}
      {showUpdateModal && (
        <AppUpdateModal
          update={currentAppUpdate}
          onClose={() => setShowUpdateModal(false)}
          onApplyUpdate={handleApplyUpdate}
        />
      )}

      {/* Global Custom Store Order Modal (من الصفحة الرئيسية) */}
      <CustomStoreOrderModal
        isOpen={showHomeCustomOrderModal}
        onClose={() => setShowHomeCustomOrderModal(false)}
        stores={stores}
        userProfile={userProfile}
        landmarks={mapNodes.map((n) => n.arabicName || n.name)}
        currentLandmark={selectedLandmark}
        onSubmit={handleCustomOrder}
      />

      {/* Floating Toast Notification Stack */}
      <ToastNotification
        toasts={toasts}
        onDismiss={handleDismissToast}
        onDismissAll={handleDismissAllToasts}
        onViewOrder={handleViewToastOrder}
        currentRole={userRole}
      />

      {/* Universal Bottom Navigation for Customer & Guest View */}
      {(userRole === "customer" || userRole === "guest") && !isAdminMode && !isDriverMode && (
        <BottomNavigation
          userRole={userRole === "guest" ? "customer" : "customer"}
          activeTab={
            isViewingCart
              ? "cart"
              : showCustomerArchiveModal
              ? "archive"
              : activeOrder
              ? "orders"
              : "home"
          }
          onNavigateHome={() => {
            setSelectedStore(null);
            setIsViewingCart(false);
            setActiveOrder(null);
            setShowCustomerArchiveModal(false);
          }}
          onOpenOrdersArchive={() => {
            if (userRole === "guest" || !userProfile) {
              setShowAuthModal(true);
            } else {
              setShowCustomerArchiveModal(true);
            }
          }}
          onOpenCart={() => {
            setSelectedStore(null);
            setIsViewingCart(true);
            setActiveOrder(null);
            setShowCustomerArchiveModal(false);
          }}
          onSelectRoleTab={(tab) => {
            if (tab === "home") {
              setSelectedStore(null);
              setIsViewingCart(false);
              setActiveOrder(null);
              setShowCustomerArchiveModal(false);
            } else if (tab === "orders" || tab === "archive") {
              if (userRole === "guest" || !userProfile) {
                setShowAuthModal(true);
              } else {
                setShowCustomerArchiveModal(true);
              }
            } else if (tab === "cart") {
              setSelectedStore(null);
              setIsViewingCart(true);
              setActiveOrder(null);
              setShowCustomerArchiveModal(false);
            }
          }}
          onOpenAccount={() => {
            if (userRole === "guest" || !userProfile) {
              setShowAuthModal(true);
            } else {
              setShowAccountModal(true);
            }
          }}
          activeOrdersCount={
            allOrders.filter(
              (o) =>
                userProfile?.phone &&
                o.customerPhone === userProfile.phone &&
                o.status !== "delivered" &&
                o.status !== "cancelled"
            ).length
          }
          cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          userName={userProfile?.name}
        />
      )}

      {/* Global Account Settings Modal */}
      {showAccountModal && (
        <AccountSettingsModal
          isOpen={showAccountModal}
          onClose={() => setShowAccountModal(false)}
          userRole={userRole}
          userProfile={userProfile}
          currentStaff={(() => {
            if (userRole !== "admin") return undefined;
            const activeStaffId = localStorage.getItem("tw_active_staff_id") || userProfile?.staffId;
            let list = initialStaff;
            try {
              const raw = localStorage.getItem("tw_staff_members");
              if (raw) list = JSON.parse(raw);
            } catch {}
            if (activeStaffId) {
              const found = list.find((s: any) => s.id === activeStaffId);
              if (found) return found;
            }
            if (userProfile?.name) {
              const foundByName = list.find((s: any) => s.name === userProfile.name || s.pin === userProfile.pin);
              if (foundByName) return foundByName;
            }
            return list.find((s: any) => s.role === "manager") || list[0];
          })()}
          currentStore={stores.find(
            (s) => s.id === currentStoreId || (userProfile?.phone && s.ownerPhone === userProfile.phone)
          )}
          currentDriver={driversList.find(
            (d) =>
              (userProfile?.phone && d.phone === userProfile.phone) ||
              (userProfile?.name && d.name === userProfile.name)
          )}
          onUpdateProfile={handleUpdateUserProfile}
          onLogout={handleLogout}
          onGoToAdmin={() => {
            setSelectedStore(null);
            setIsViewingCart(false);
            setIsAdminMode(true);
            setIsDriverMode(false);
            localStorage.setItem("tw_viewing_admin", "true");
            localStorage.setItem("tw_viewing_driver", "false");
          }}
          onGoToStore={() => {
            if (currentStoreId) {
              const matched = stores.find(s => s.id === currentStoreId);
              if (matched) setSelectedStore(matched);
            }
          }}
          onGoToDriver={() => {
            setSelectedStore(null);
            setIsViewingCart(false);
            setIsDriverMode(true);
            setIsAdminMode(false);
            localStorage.setItem("tw_viewing_driver", "true");
            localStorage.setItem("tw_viewing_admin", "false");
          }}
        />
      )}
    </div>
  );
}

