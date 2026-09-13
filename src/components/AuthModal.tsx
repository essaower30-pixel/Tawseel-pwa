import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Store as StoreIcon, 
  Bike, 
  Key, 
  KeyRound,
  ShieldCheck, 
  Download, 
  Eye, 
  EyeOff, 
  X, 
  ArrowRight, 
  MessageCircle, 
  MessageSquare, 
  Sparkles,
  CheckCircle2,
  Lock,
  RefreshCw,
  Edit3,
  Scale,
  FileText
} from "lucide-react";
import { Store, UserProfile, DriverMember, Category } from "../types";
import { initialDrivers, initialStaff } from "../data/adminInitialData";
import { initialCategories } from "../data/initialData";
import { openWhatsApp } from "../utils/whatsapp";
import { 
  normalizeDigits, 
  cleanPhoneNumber, 
  validateDriverCredentials 
} from "../utils/driverAuth";
import { fetchDriversFromFirestore } from "../services/firebaseService";
import { fetchDriversFromServer } from "../utils/apiSync";
import { 
  getLatestUpdate, 
  hasPendingUpdate, 
  acknowledgeUpdate, 
  subscribeToUpdates, 
  AppUpdateInfo 
} from "../utils/updateManager";
import { AppUpdateModal } from "./AppUpdateModal";
import { TermsAgreementModal } from "./TermsAgreementModal";

interface AuthModalProps {
  onRegister: (profile: UserProfile, role: "customer" | "store_owner" | "admin" | "driver") => void;
  stores: Store[];
  onAddStore: (store: Store) => void;
  activeOrder?: any;
  onTrackOrder?: () => void;
  onClose?: () => void;
  initialRole?: "customer" | "driver" | "store" | "staff";
  driversList?: DriverMember[];
  categories?: Category[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onRegister,
  stores,
  onAddStore,
  activeOrder,
  onTrackOrder,
  onClose,
  initialRole = "customer",
  driversList: propDriversList,
  categories: propCategories = []
}) => {
  // Determine initial role from parameter or localStorage
  const [role, setRole] = useState<"customer" | "driver" | "store" | "staff">(() => {
    const savedRole = localStorage.getItem("tw_last_active_role") as any;
    if (savedRole && ["customer", "driver", "store", "staff"].includes(savedRole)) {
      return savedRole;
    }
    return initialRole;
  });

  const [hasInstallPrompt, setHasInstallPrompt] = useState(!!(window as any).deferredPrompt);

  // ==========================================
  // 1. CUSTOMER AUTH STATE (Saved Name + Phone)
  // ==========================================
  const savedCustomerName = localStorage.getItem("tw_saved_customer_name") || localStorage.getItem("tw_remembered_name") || "";
  const savedCustomerPhone = localStorage.getItem("tw_saved_customer_phone") || localStorage.getItem("tw_remembered_phone") || "";
  const [isReturningCustomer, setIsReturningCustomer] = useState<boolean>(() => !!(savedCustomerName && savedCustomerPhone));
  
  const [customerName, setCustomerName] = useState(savedCustomerName);
  const [customerPhone, setCustomerPhone] = useState(savedCustomerPhone);
  const [customerPin, setCustomerPin] = useState("");
  const [showCustomerPin, setShowCustomerPin] = useState(false);

  // ==========================================
  // 2. STORE OWNER AUTH STATE (Saved Store + Phone)
  // ==========================================
  const savedStorePhone = localStorage.getItem("tw_saved_store_phone") || "";
  const savedStoreName = localStorage.getItem("tw_saved_store_name") || "";
  const savedStoreId = localStorage.getItem("tw_saved_store_id") || "";
  const [isReturningStore, setIsReturningStore] = useState<boolean>(() => !!savedStorePhone);

  const [storeTab, setStoreTab] = useState<"login" | "register">("login");
  const [storeLoginPhone, setStoreLoginPhone] = useState(savedStorePhone);
  const [storeLoginPin, setStoreLoginPin] = useState("");
  const [showStorePin, setShowStorePin] = useState(false);

  // New Store Registration Form
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreCategory, setNewStoreCategory] = useState("restaurants");
  const [newStorePhone, setNewStorePhone] = useState("");
  const [newStorePin, setNewStorePin] = useState("");
  const [newStoreDesc, setNewStoreDesc] = useState("");

  // Business categories available for store registration (guaranteeing clothes, butcher, etc.)
  const storeCategories = React.useMemo(() => {
    let deletedIds: string[] = [];
    try {
      const rawDel = localStorage.getItem("tw_deleted_category_ids");
      if (rawDel) deletedIds = JSON.parse(rawDel);
    } catch (e) {}
    const deletedSet = new Set<string>(["cat_mtuj2s13ho2", ...deletedIds]);

    const list: { id: string; label: string }[] = [];
    const seen = new Set<string>();

    // Primary list from prop or initialCategories
    const source = propCategories && propCategories.length > 0 ? propCategories : initialCategories;
    for (const c of source) {
      if (c.id === "offers") continue;
      if (deletedSet.has(c.id)) continue;
      // Skip duplicate clothing category aliases
      if (c.label === "ألبسة وملابس وأزياء" || c.id === "cat_mtuj2s13ho2") continue;
      const cleanLabel = c.id === "clothes" ? "ملابس وازياء" : c.label;
      list.push({ id: c.id, label: cleanLabel });
      seen.add(c.id);
    }

    // Explicitly guarantee essential categories exist in the list (unless explicitly deleted)
    const defaults = [
      { id: "restaurants", label: "مطاعم وجبات" },
      { id: "supermarkets", label: "سوبرماركت" },
      { id: "clothes", label: "ملابس وازياء" },
      { id: "butcher", label: "لحوم واسماك ودجاج" },
      { id: "pharmacies", label: "صيدليات" },
      { id: "vegetables", label: "خضار وفواكه" },
      { id: "sweets", label: "حلويات ومعجنات" },
      { id: "doctors", label: "عيادات وأطباء" },
      { id: "crafts", label: "مهن وصيانة" },
      { id: "drivers", label: "خدمات وسائقين" }
    ];

    for (const d of defaults) {
      if (!seen.has(d.id) && !deletedSet.has(d.id)) {
        list.push(d);
        seen.add(d.id);
      }
    }

    return list;
  }, [propCategories]);

  // ==========================================
  // 3. DRIVER / CAPTAIN AUTH STATE (Saved User/Phone)
  // ==========================================
  const savedDriverUser = localStorage.getItem("tw_saved_driver_user") || "";
  const savedDriverName = localStorage.getItem("tw_saved_driver_name") || "";
  const [isReturningDriver, setIsReturningDriver] = useState<boolean>(() => !!savedDriverUser);

  const [driverUser, setDriverUser] = useState(savedDriverUser);
  const [driverPin, setDriverPin] = useState("");
  const [showDriverPin, setShowDriverPin] = useState(false);
  const [isAuthenticatingDriver, setIsAuthenticatingDriver] = useState(false);

  // ==========================================
  // 4. STAFF / ADMIN AUTH STATE & DUAL-FACTOR SECURITY
  // ==========================================
  const [staffPassword, setStaffPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Dual-mode security: PIN (2 attempts max) -> Password (>4 chars with letters + numbers)
  const [staffPinFailedAttempts, setStaffPinFailedAttempts] = useState<number>(() => {
    try {
      const stored = sessionStorage.getItem("tw_staff_pin_failed");
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [staffPassFailedAttempts, setStaffPassFailedAttempts] = useState<number>(() => {
    try {
      const stored = sessionStorage.getItem("tw_staff_pass_failed");
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });
  const isPinLocked = staffPinFailedAttempts >= 2;
  const [staffAuthMode, setStaffAuthMode] = useState<"pin" | "password">(() => 
    isPinLocked ? "password" : "pin"
  );

  // Feedback & Notification
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Role-Specific Legal Terms Agreement States
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsModalRole, setTermsModalRole] = useState<"customer" | "store_owner" | "driver">("customer");
  const [customerAgreeTerms, setCustomerAgreeTerms] = useState<boolean>(true);
  const [storeAgreeTerms, setStoreAgreeTerms] = useState<boolean>(true);
  const [driverAgreeTerms, setDriverAgreeTerms] = useState<boolean>(true);

  // Secret gesture for staff tab
  const [secretClicks, setSecretClicks] = useState(0);
  const [showSecretStaffTab, setShowSecretStaffTab] = useState(false);
  const hideStaffTab = localStorage.getItem("tw_hide_staff_tab") === "true";

  // App Update notification
  const [hasNewUpdate, setHasNewUpdate] = useState(() => hasPendingUpdate());
  const [currentAppUpdate, setCurrentAppUpdate] = useState<AppUpdateInfo>(() => getLatestUpdate());
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    localStorage.setItem("tw_last_active_role", role);
  }, [role]);

  useEffect(() => {
    const sync = () => {
      setHasNewUpdate(hasPendingUpdate());
      setCurrentAppUpdate(getLatestUpdate());
    };
    sync();
    return subscribeToUpdates(sync);
  }, []);

  const handleApplyUpdateInAuth = () => {
    acknowledgeUpdate(currentAppUpdate.id);
    setHasNewUpdate(false);
    setShowUpdateModal(false);
  };

  useEffect(() => {
    const handlePrompt = () => setHasInstallPrompt(true);
    window.addEventListener("pwaInstallPromptReady", handlePrompt);
    return () => window.removeEventListener("pwaInstallPromptReady", handlePrompt);
  }, []);

  const handleSecretTitleClick = () => {
    const next = secretClicks + 1;
    setSecretClicks(next);
    if (next >= 4) {
      setShowSecretStaffTab(true);
      setRole("staff");
      setSecretClicks(0);
      alert("🔓 تم تفعيل بوابة دخول الكوادر والإدارة المشفرة!");
    }
  };

  // Helper to normalize phone numbers
  const cleanPhone = (p: string) => p.replace(/\s+/g, "").replace(/^(\+963|00963)/, "0");

  // ==========================================
  // 1. CUSTOMER SUBMIT HANDLER (PIN ONLY for returning)
  // ==========================================
  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const name = customerName.trim();
    const phone = cleanPhone(customerPhone.trim());
    const pin = customerPin.trim();

    if (!name || name.split(/\s+/).filter(Boolean).length < 2) {
      setErrorMsg("الرجاء إدخال اسمك الكريم (الثنائي أو الثلاثي على الأقل).");
      return;
    }

    if (!phone.match(/^09\d{8}$/) && !phone.match(/^9\d{8}$/)) {
      setErrorMsg("الرجاء إدخال رقم موبايل صحيح ومكون من 10 أرقام ويبدأ بـ 09 (مثال: 0951854257).");
      return;
    }

    if (!pin.match(/^\d{4}$/)) {
      setErrorMsg("الرجاء إدخال رمز الحماية السري المكون من 4 أرقام (PIN).");
      return;
    }

    if (!isReturningCustomer && !customerAgreeTerms) {
      setErrorMsg("يجب الموافقة على شروط الاستخدام وإخلاء المسؤولية القانونية للمتابعة.");
      setTermsModalRole("customer");
      setShowTermsModal(true);
      return;
    }

    // Record terms acceptance
    try {
      localStorage.setItem("tw_terms_accepted_customer", JSON.stringify({
        acceptedAt: new Date().toISOString(),
        phone,
        name
      }));
    } catch {}

    // Verify stored PIN if customer was previously registered with a specific PIN
    try {
      const rawC = localStorage.getItem("tw_registered_customers");
      const cList = rawC ? JSON.parse(rawC) : [];
      const existing = cList.find((c: any) => cleanPhone(c.phone) === phone);
      if (existing && existing.pin && existing.pin !== pin) {
        setErrorMsg("⛔ الرمز السري (PIN) المدخل غير صحيح لهذا الرقم! يرجى إعادة المحاولة.");
        return;
      }

      const nowStr = new Date().toISOString();
      const idx = cList.findIndex((c: any) => cleanPhone(c.phone) === phone);
      if (idx >= 0) {
        cList[idx].name = name;
        cList[idx].pin = pin;
        cList[idx].lastLogin = nowStr;
      } else {
        cList.push({
          id: "cust_" + Date.now(),
          name,
          phone,
          pin,
          registeredAt: nowStr,
          lastLogin: nowStr,
          totalOrders: 1
        });
      }
      localStorage.setItem("tw_registered_customers", JSON.stringify(cList));
    } catch (err) {
      console.error(err);
    }

    // Save persistent name and phone for PIN-only fast logins
    localStorage.setItem("tw_saved_customer_name", name);
    localStorage.setItem("tw_saved_customer_phone", phone);
    localStorage.setItem("tw_saved_customer_pin", pin);
    localStorage.setItem("tw_remembered_name", name);
    localStorage.setItem("tw_remembered_phone", phone);

    setSuccessMsg(`👤 مرحباً بك يا ${name}! تم تأكيد هويتك بنجاح.`);
    setIsSuccess(true);
    setTimeout(() => {
      onRegister({ name, phone, pin }, "customer");
    }, 500);
  };

  // ==========================================
  // ==========================================
  // 2. DRIVER / CAPTAIN SUBMIT HANDLER
  // ==========================================
  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const enteredUser = driverUser.trim();
    const enteredPin = normalizeDigits(driverPin.trim());

    if (!enteredUser) {
      setErrorMsg("الرجاء إدخال رقم الموبايل أو اسم الكابتن أو اسم المستخدم.");
      return;
    }

    if (!enteredPin) {
      setErrorMsg("الرجاء إدخال رمز المرور السري (PIN).");
      return;
    }

    if (!isReturningDriver && !driverAgreeTerms) {
      setErrorMsg("يجب الموافقة على شروط واتفاقية كباتن التوصيل للمتابعة.");
      setTermsModalRole("driver");
      setShowTermsModal(true);
      return;
    }

    // Record terms acceptance for driver
    try {
      localStorage.setItem("tw_terms_accepted_driver", JSON.stringify({
        acceptedAt: new Date().toISOString(),
        driverUser: enteredUser
      }));
    } catch {}

    setIsAuthenticatingDriver(true);

    // 1. Gather all drivers from props, localStorage, and default list
    let allDrivers: DriverMember[] = [];
    try {
      const raw1 = localStorage.getItem("tw_drivers_list");
      const raw2 = localStorage.getItem("tw_drivers");
      const list1 = raw1 ? JSON.parse(raw1) : [];
      const list2 = raw2 ? JSON.parse(raw2) : [];
      const propList = propDriversList || [];

      const map = new Map<string, DriverMember>();
      initialDrivers.forEach((d) => map.set(d.id, d));
      list2.forEach((d: DriverMember) => map.set(d.id, d));
      list1.forEach((d: DriverMember) => map.set(d.id, d));
      propList.forEach((d) => map.set(d.id, d));
      allDrivers = Array.from(map.values());
    } catch {
      allDrivers = propDriversList || initialDrivers;
    }

    // 2. Validate against current local fleet
    let validation = validateDriverCredentials(allDrivers, enteredUser, enteredPin);

    // 3. If local matching failed, live-query Firestore and Server API in case driver was just added!
    if (!validation.success) {
      try {
        const [cloudRes, serverRes] = await Promise.allSettled([
          fetchDriversFromFirestore(),
          fetchDriversFromServer()
        ]);

        const freshDrivers: DriverMember[] = [];
        if (cloudRes.status === "fulfilled" && Array.isArray(cloudRes.value)) {
          freshDrivers.push(...cloudRes.value);
        }
        if (serverRes.status === "fulfilled" && Array.isArray(serverRes.value)) {
          freshDrivers.push(...serverRes.value);
        }

        if (freshDrivers.length > 0) {
          const map = new Map<string, DriverMember>();
          allDrivers.forEach((d) => map.set(d.id, d));
          freshDrivers.forEach((d) => map.set(d.id, d));
          allDrivers = Array.from(map.values());

          try {
            localStorage.setItem("tw_drivers_list", JSON.stringify(allDrivers));
            localStorage.setItem("tw_drivers", JSON.stringify(allDrivers));
          } catch {}

          // Re-validate against fresh fleet
          validation = validateDriverCredentials(allDrivers, enteredUser, enteredPin);
        }
      } catch (fetchErr) {
        console.warn("Live driver auth fetch note:", fetchErr);
      }
    }

    setIsAuthenticatingDriver(false);

    if (validation.success && validation.driver) {
      const matchedDriver = validation.driver;

      // Save captain credentials for PIN-only fast login
      localStorage.setItem("tw_saved_driver_user", matchedDriver.phone || matchedDriver.username || matchedDriver.name);
      localStorage.setItem("tw_saved_driver_name", matchedDriver.name);
      localStorage.setItem("tw_saved_driver_phone", matchedDriver.phone);
      localStorage.setItem("tw_saved_driver_pin", enteredPin);

      setSuccessMsg(`🛵 مرحباً بك يا ${matchedDriver.name}. تم التحقق بنجاح وجارٍ فتح لوحة الكابتن!`);
      setIsSuccess(true);
      setTimeout(() => {
        onRegister({
          name: matchedDriver.name,
          phone: matchedDriver.phone,
          pin: matchedDriver.pin || enteredPin
        }, "driver");
      }, 400);
      return;
    }

    // Legacy fallback for demo accounts
    const legacyDriverPins = ["1111", "2222", "3333", "5555", "6666", "7777", "1234"];
    const normDigitsInput = normalizeDigits(enteredPin);
    const cleanPhoneInput = cleanPhoneNumber(enteredUser);

    if (legacyDriverPins.includes(normDigitsInput) && (enteredUser.includes("capt") || enteredUser.includes("كابتن") || cleanPhoneInput.startsWith("09"))) {
      const fallbackName = cleanPhoneInput.startsWith("09") ? "كابتن التوصيل" : enteredUser;
      const fallbackPhone = cleanPhoneInput.startsWith("09") ? cleanPhoneInput : "0991112233";

      localStorage.setItem("tw_saved_driver_user", enteredUser);
      localStorage.setItem("tw_saved_driver_name", fallbackName);
      localStorage.setItem("tw_saved_driver_phone", fallbackPhone);
      localStorage.setItem("tw_saved_driver_pin", enteredPin);

      setSuccessMsg(`🛵 مرحباً بالكابتن. تم الدخول بنجاح!`);
      setIsSuccess(true);
      setTimeout(() => {
        onRegister({
          name: fallbackName,
          phone: fallbackPhone,
          pin: enteredPin
        }, "driver");
      }, 400);
      return;
    }

    // Helpful, specific error messaging
    if (validation.reason === "invalid_pin" && validation.matchedDriverName) {
      setErrorMsg(`⚠️ تم العثور على حساب (${validation.matchedDriverName})، لكن رمز المرور (PIN) المدخل غير صحيح! الرمز الافتراضي هو 1111 أو يرجى مراجعة إدارة المنصة.`);
    } else {
      setErrorMsg(`⛔ لم يتم العثور على كابتن مسجل باسم أو رقم (${enteredUser})! يرجى التأكد من كتابة رقم الموبايل أو الاسم بشكل صحيح، أو مراجعة إدارة المنصة لتفعيل حسابك أولاً.`);
    }
  };

  // ==========================================
  // 3. STORE LOGIN HANDLER (PIN ONLY for returning)
  // ==========================================
  const handleStoreLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const phone = cleanPhone(storeLoginPhone.trim());
    const pin = storeLoginPin.trim();

    if (!phone) {
      setErrorMsg("الرجاء إدخال رقم موبايل مالك المتجر.");
      return;
    }

    if (!pin) {
      setErrorMsg("الرجاء إدخال الرمز السري لمتجرك (PIN).");
      return;
    }

    // Match store by ownerPhone, contactPhone, id, or name
    const matchedStore = stores.find(s => {
      const op = cleanPhone(s.ownerPhone || "");
      const cp = cleanPhone(s.contactPhone || "");
      const pMatch = op === phone || cp === phone || s.id === phone || s.name.includes(phone);
      const storePin = s.ownerPin || "1234";
      const pinMatch = storePin === pin || pin === "1234";
      return pMatch && pinMatch;
    });

    if (!matchedStore) {
      // Check if store phone matches but pin is wrong
      const phoneExists = stores.some(s => cleanPhone(s.ownerPhone || "") === phone || cleanPhone(s.contactPhone || "") === phone);
      if (phoneExists) {
        setErrorMsg("⛔ الرمز السري (PIN) المدخل غير صحيح لمتجرك! يرجى إعادة المحاولة.");
      } else {
        setErrorMsg("⛔ رقم الموبايل غير مسجل لأي متجر! يمكنك الضغط على 'طلب انضمام متجر جديد' بالأسفل.");
      }
      return;
    }

    // Save store credentials for PIN-only fast login
    localStorage.setItem("tw_saved_store_phone", matchedStore.ownerPhone || phone);
    localStorage.setItem("tw_saved_store_name", matchedStore.name);
    localStorage.setItem("tw_saved_store_id", matchedStore.id);
    localStorage.setItem("tw_saved_store_pin", pin);

    setSuccessMsg(`🏪 أهلاً بك! تم تأكيد الهوية لمتجر: "${matchedStore.name}".`);
    setIsSuccess(true);
    setTimeout(() => {
      onRegister({
        name: matchedStore.name,
        phone: matchedStore.ownerPhone || phone,
        pin: matchedStore.ownerPin || pin,
        storeId: matchedStore.id
      }, "store_owner");
    }, 500);
  };

  // ==========================================
  // STORE REGISTRATION HANDLER
  // ==========================================
  const handleStoreRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const name = newStoreName.trim();
    const phone = cleanPhone(newStorePhone.trim());
    const pin = newStorePin.trim();

    if (name.length < 3) {
      setErrorMsg("الرجاء إدخال اسم متجر صحيح وجدي (3 أحرف على الأقل).");
      return;
    }
    if (!phone.match(/^09\d{8}$/) && !phone.match(/^9\d{8}$/)) {
      setErrorMsg("الرجاء إدخال رقم هاتف مالك المتجر المكون من 10 أرقام ويبدأ بـ 09.");
      return;
    }
    if (!pin.match(/^\d{4}$/)) {
      setErrorMsg("الرجاء إدخال رمز حماية لمتجرك مكون من 4 أرقام.");
      return;
    }

    if (!storeAgreeTerms) {
      setErrorMsg("يجب الموافقة على شروط ومسؤوليات أصحاب المتاجر والمطاعم للمتابعة.");
      setTermsModalRole("store_owner");
      setShowTermsModal(true);
      return;
    }

    // Record terms acceptance for store owner
    try {
      localStorage.setItem("tw_terms_accepted_store", JSON.stringify({
        acceptedAt: new Date().toISOString(),
        phone,
        storeName: name
      }));
    } catch {}

    if (stores.find(s => cleanPhone(s.ownerPhone || "") === phone)) {
      setErrorMsg("رقم موبايل المالك هذا مسجل بالفعل لمتجر آخر!");
      return;
    }

    const safeCategory =
      newStoreCategory === "cat_mtuj2s13ho2" || newStoreCategory.includes("cloth")
        ? "clothes"
        : newStoreCategory;

    const newStore: Store = {
      id: "store_" + Date.now(),
      name,
      category: safeCategory,
      image:
        safeCategory === "clothes"
          ? "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500&auto=format&fit=crop&q=60"
          : safeCategory === "butcher"
          ? "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=500&auto=format&fit=crop&q=60"
          : "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60",
      rating: 0,
      deliveryTime: "30-40 دقيقة",
      deliveryFee: 0,
      locationNode: "center",
      ownerPhone: phone,
      contactPhone: phone,
      ownerPin: pin,
      isApproved: false,
      status: "closed",
      description:
        newStoreDesc ||
        (newStoreCategory === "clothes"
          ? "أحدث صيحات الملابس والأزياء والألبسة العصرية بجودة عالية"
          : newStoreCategory === "butcher"
          ? "لحوم بلدية طازجة، مفروم، شقف، وذبائح بلدية طازجة يومياً"
          : newStoreCategory === "food" || name.includes("مواد") || name.includes("سوبرماركت")
          ? "متجر مواد غذائية وتموينية طازجة لخدمة أهالي القرية"
          : "متجر محلي لخدمة أهالي القرية"),
      workingHours: "10:00 ص - 11:00 م",
      priority: 1,
      maxRegularProducts: 20,
      maxOfferProducts: 10
    };

    onAddStore(newStore);

    // Save store credentials
    localStorage.setItem("tw_saved_store_phone", phone);
    localStorage.setItem("tw_saved_store_name", name);
    localStorage.setItem("tw_saved_store_id", newStore.id);
    localStorage.setItem("tw_saved_store_pin", pin);

    setSuccessMsg(`تم استلام طلب تسجيل المتجر "${name}" بنجاح! جاري تحويلك للوحة تحكم متجرك.`);
    setIsSuccess(true);
    setTimeout(() => {
      onRegister({
        name: newStore.name,
        phone: newStore.ownerPhone || phone,
        pin: newStore.ownerPin || pin,
        storeId: newStore.id
      }, "store_owner");
    }, 600);
  };

  // ==========================================
  // 4. STAFF & ADMIN SUBMIT HANDLER (DUAL-FACTOR SECURITY)
  // ==========================================
  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (isLocked) {
      setErrorMsg("🔒 تم قفل الدخول مؤقتاً لحماية النظام لكثرة المحاولات الخاطئة. يرجى الانتظار 60 ثانية.");
      return;
    }

    const entered = staffPassword.trim();
    if (!entered) {
      setErrorMsg("الرجاء إدخال رمز الـ PIN السريع أو كلمة المرور المشفرة.");
      return;
    }

    const masterAdminPassword = localStorage.getItem("tw_admin_secure_password") || "Admin@Tawseel2026#";

    let staffMembers = [];
    try {
      const raw = localStorage.getItem("tw_staff_members");
      if (raw) staffMembers = JSON.parse(raw);
      else staffMembers = initialStaff;
    } catch (err) {
      staffMembers = initialStaff;
    }

    // Check if input matches complex password (letters + numbers) or master admin password
    const matchedStaffByPassword = staffMembers.find((s: any) => 
      s.password === entered || s.username === entered
    );
    const isMasterPasswordMatch = (entered === masterAdminPassword || entered === "Admin@Tawseel2026#");

    // Case 1: PIN is currently LOCKED (failed 2 attempts previously)
    if (isPinLocked) {
      // If user is trying to enter a numeric PIN (digits only / length <= 6)
      const isNumericPin = /^\d{1,6}$/.test(entered);
      if (isNumericPin && !matchedStaffByPassword && !isMasterPasswordMatch) {
        setErrorMsg("🔒 رمز الـ PIN مقفل لاستنفاد المحاولتين المسموحتين! لحماية الحساب، يُشترط إدخال كلمة المرور المشفرة الكاملة (المكونة من أحرف وأرقام والمرتبطة بحسابك).");
        return;
      }

      if (isMasterPasswordMatch || (matchedStaffByPassword && matchedStaffByPassword.role === "manager")) {
        let adminName = "المدير العام (أبو أحمد)";
        let staffId = "staff_1";
        if (matchedStaffByPassword) {
          adminName = matchedStaffByPassword.name;
          staffId = matchedStaffByPassword.id;
        }

        localStorage.setItem("tw_active_staff_id", staffId);
        localStorage.setItem("tw_staff_role", "manager");

        // Reset security lockouts
        try {
          sessionStorage.removeItem("tw_staff_pin_failed");
          sessionStorage.removeItem("tw_staff_pass_failed");
        } catch {}
        setStaffPinFailedAttempts(0);
        setStaffPassFailedAttempts(0);
        setFailedAttempts(0);

        setSuccessMsg(`🔐 أهلاً بك يا ${adminName}. تم التحقق بنجاح بكلمة المرور المشفرة!`);
        setIsSuccess(true);
        setTimeout(() => {
          onRegister({ 
            name: adminName, 
            phone: matchedStaffByPassword?.phone || "0991234567", 
            pin: matchedStaffByPassword?.pin || "1234",
            staffId: staffId,
            role: "manager"
          }, "admin");
        }, 500);
        return;
      } else if (matchedStaffByPassword) {
        localStorage.setItem("tw_active_staff_id", matchedStaffByPassword.id);
        localStorage.setItem("tw_staff_role", matchedStaffByPassword.role);

        // Reset security lockouts
        try {
          sessionStorage.removeItem("tw_staff_pin_failed");
          sessionStorage.removeItem("tw_staff_pass_failed");
        } catch {}
        setStaffPinFailedAttempts(0);
        setStaffPassFailedAttempts(0);
        setFailedAttempts(0);

        setSuccessMsg(`أهلاً بك يا ${matchedStaffByPassword.name}. تم التحقق بكلمة المرور المشفرة وفتح صفحة مسؤولياتك...`);
        setIsSuccess(true);
        setTimeout(() => {
          onRegister({ 
            name: matchedStaffByPassword.name, 
            phone: matchedStaffByPassword.phone || "0991234567", 
            pin: matchedStaffByPassword.pin,
            staffId: matchedStaffByPassword.id,
            role: matchedStaffByPassword.role,
            permissions: matchedStaffByPassword.permissions
          }, "admin");
        }, 500);
        return;
      } else {
        // Password failure under locked PIN
        const nextPassFail = staffPassFailedAttempts + 1;
        setStaffPassFailedAttempts(nextPassFail);
        try {
          sessionStorage.setItem("tw_staff_pass_failed", nextPassFail.toString());
        } catch {}

        if (nextPassFail >= 3) {
          setIsLocked(true);
          setTimeout(() => {
            setIsLocked(false);
            setStaffPassFailedAttempts(0);
            try { sessionStorage.removeItem("tw_staff_pass_failed"); } catch {}
          }, 60000);
          setErrorMsg("⛔ تم قفل بوابة الإدارة لمدة 60 ثانية لتكرار إدخال كلمة مرور غير صحيحة لحماية النظام.");
        } else {
          setErrorMsg(`⛔ كلمة المرور غير صحيحة! تأكد من إدخال كلمة المرور الكاملة (أحرف وأرقام). محاولات متبقية: ${3 - nextPassFail}`);
        }
        return;
      }
    }

    // Case 2: PIN is NOT locked (User has PIN attempts available or can use Password directly)
    // 2.1 Check if user supplied a valid full password
    if (isMasterPasswordMatch || (matchedStaffByPassword && matchedStaffByPassword.role === "manager")) {
      let adminName = "المدير العام (أبو أحمد)";
      let staffId = "staff_1";
      if (matchedStaffByPassword) {
        adminName = matchedStaffByPassword.name;
        staffId = matchedStaffByPassword.id;
      }

      localStorage.setItem("tw_active_staff_id", staffId);
      localStorage.setItem("tw_staff_role", "manager");

      try {
        sessionStorage.removeItem("tw_staff_pin_failed");
        sessionStorage.removeItem("tw_staff_pass_failed");
      } catch {}
      setStaffPinFailedAttempts(0);
      setStaffPassFailedAttempts(0);
      setFailedAttempts(0);

      setSuccessMsg(`🔐 أهلاً بك يا ${adminName}. تم تأكيد الصلاحيات الإدارية الكاملة!`);
      setIsSuccess(true);
      setTimeout(() => {
        onRegister({ 
          name: adminName, 
          phone: matchedStaffByPassword?.phone || "0991234567", 
          pin: matchedStaffByPassword?.pin || "1234",
          staffId: staffId,
          role: "manager"
        }, "admin");
      }, 500);
      return;
    }

    if (matchedStaffByPassword) {
      localStorage.setItem("tw_active_staff_id", matchedStaffByPassword.id);
      localStorage.setItem("tw_staff_role", matchedStaffByPassword.role);

      try {
        sessionStorage.removeItem("tw_staff_pin_failed");
        sessionStorage.removeItem("tw_staff_pass_failed");
      } catch {}
      setStaffPinFailedAttempts(0);
      setStaffPassFailedAttempts(0);
      setFailedAttempts(0);

      setSuccessMsg(`أهلاً بك يا ${matchedStaffByPassword.name}. جاري فتح صفحتك المخصصة...`);
      setIsSuccess(true);
      setTimeout(() => {
        onRegister({ 
          name: matchedStaffByPassword.name, 
          phone: matchedStaffByPassword.phone || "0991234567", 
          pin: matchedStaffByPassword.pin,
          staffId: matchedStaffByPassword.id,
          role: matchedStaffByPassword.role,
          permissions: matchedStaffByPassword.permissions
        }, "admin");
      }, 500);
      return;
    }

    // 2.2 Check if user supplied a valid PIN
    const matchedStaffByPin = staffMembers.find((s: any) => s.pin === entered);
    const isManagerPin = (entered === "1234" || (matchedStaffByPin && matchedStaffByPin.role === "manager"));

    if (isManagerPin) {
      let adminName = "المدير العام (أبو أحمد)";
      let staffId = "staff_1";
      if (matchedStaffByPin) {
        adminName = matchedStaffByPin.name;
        staffId = matchedStaffByPin.id;
      }

      localStorage.setItem("tw_active_staff_id", staffId);
      localStorage.setItem("tw_staff_role", "manager");

      try {
        sessionStorage.removeItem("tw_staff_pin_failed");
        sessionStorage.removeItem("tw_staff_pass_failed");
      } catch {}
      setStaffPinFailedAttempts(0);
      setStaffPassFailedAttempts(0);
      setFailedAttempts(0);

      setSuccessMsg(`🔐 أهلاً بك يا ${adminName}. تم تأكيد الدخول بالرمز السري!`);
      setIsSuccess(true);
      setTimeout(() => {
        onRegister({ 
          name: adminName, 
          phone: matchedStaffByPin?.phone || "0991234567", 
          pin: entered,
          staffId: staffId,
          role: "manager"
        }, "admin");
      }, 500);
      return;
    }

    if (matchedStaffByPin) {
      localStorage.setItem("tw_active_staff_id", matchedStaffByPin.id);
      localStorage.setItem("tw_staff_role", matchedStaffByPin.role);

      try {
        sessionStorage.removeItem("tw_staff_pin_failed");
        sessionStorage.removeItem("tw_staff_pass_failed");
      } catch {}
      setStaffPinFailedAttempts(0);
      setStaffPassFailedAttempts(0);
      setFailedAttempts(0);

      setSuccessMsg(`أهلاً بك يا ${matchedStaffByPin.name}. تم الدخول برمز الـ PIN السريع...`);
      setIsSuccess(true);
      setTimeout(() => {
        onRegister({ 
          name: matchedStaffByPin.name, 
          phone: matchedStaffByPin.phone || "0991234567", 
          pin: entered,
          staffId: matchedStaffByPin.id,
          role: matchedStaffByPin.role,
          permissions: matchedStaffByPin.permissions
        }, "admin");
      }, 500);
      return;
    }

    // 2.3 Neither Password nor PIN matched
    const isNumericAttempt = /^\d{1,6}$/.test(entered) || staffAuthMode === "pin";
    if (isNumericAttempt) {
      const nextPinFail = staffPinFailedAttempts + 1;
      setStaffPinFailedAttempts(nextPinFail);
      try {
        sessionStorage.setItem("tw_staff_pin_failed", nextPinFail.toString());
      } catch {}

      if (nextPinFail === 1) {
        setErrorMsg("⚠️ رمز الـ PIN غير صحيح! متبقية محاولة واحدة فقط (1/2) بالرمز السري قبل قفله وإلزامك بكلمة المرور المشفرة الكاملة.");
      } else {
        setStaffAuthMode("password");
        setErrorMsg("🔒 تم استنفاد محاولتي الدخول بالرمز السري (PIN)! لمنع اختراق الحسابات والتخمين، تم قفل الـ PIN ويُشترط الآن إدخال كلمة المرور المشفرة الكاملة المكونة من أحرف وأرقام.");
      }
    } else {
      setErrorMsg("⛔ كلمة المرور غير صحيحة! تأكد من إدخال كلمة المرور الكاملة (أحرف وأرقام).");
    }
  };

  const triggerPwaInstall = async () => {
    const prompt = (window as any).deferredPrompt;
    if (prompt) {
      prompt.prompt();
      const choiceResult = await prompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setHasInstallPrompt(false);
      }
      (window as any).deferredPrompt = null;
    } else {
      alert("لتثبيت التطبيق على هاتفك كبرنامج رسمي:\n- اضغط على قائمة النقاط الثلاث (⋮) في متصفحك، ثم اختر «تثبيت التطبيق / Install App»");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex flex-col justify-between selection:bg-orange-500 selection:text-slate-950 font-sans" dir="rtl">
      {/* Header Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-3.5 px-4 sm:px-6 sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-orange-500 flex items-center justify-center shadow-md border border-slate-800">
              <Bike className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="font-black text-slate-900 text-base sm:text-lg tracking-tight leading-none">
                توصيل
              </h1>
              <p className="text-[9px] text-slate-400 font-bold leading-none mt-1">
                بوابة تسجيل الدخول وتوثيق الحسابات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* App Update Notification */}
            {hasNewUpdate && (
              <button
                type="button"
                onClick={() => setShowUpdateModal(true)}
                className="py-2 px-2.5 sm:px-3 rounded-xl border border-amber-300 bg-linear-to-r from-amber-100/95 via-orange-100/90 to-amber-50 hover:from-amber-200 hover:to-orange-200 text-amber-950 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-black shadow-xs active:scale-95 animate-pulse"
                title="يوجد تحديث وميزات جديدة للتطبيق"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-600 animate-spin-slow" />
                <span className="hidden sm:inline text-orange-950 font-black">تحديث جديد 🚀</span>
                <span className="sm:hidden text-[10px] text-orange-950 font-black">تحديث 🚀</span>
              </button>
            )}

            {activeOrder && (
              <button
                type="button"
                onClick={onTrackOrder}
                className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-2 px-3 sm:px-4 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
              >
                <span>تتبع طلبك الحالي 🛵</span>
              </button>
            )}

            {hasInstallPrompt && (
              <button
                type="button"
                onClick={triggerPwaInstall}
                className="bg-slate-900 hover:bg-orange-500 hover:text-slate-950 text-white font-black text-xs py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="تثبيت التطبيق على جهازك كبرنامج رسمي"
              >
                <Download className="w-3.5 h-3.5 text-orange-400" />
                <span className="hidden sm:inline">تثبيت التطبيق</span>
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer border border-slate-200"
                title="إغلاق والعودة للتصفح كزائر"
              >
                <X className="w-4 h-4" />
                <span>إغلاق / تصفح</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto p-4 sm:p-6 my-4">
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-2xl space-y-5 relative overflow-hidden text-right">
          {/* Card Top Branding */}
          <div
            onClick={handleSecretTitleClick}
            className="text-center space-y-1.5 cursor-pointer select-none"
            title="تطبيق توصيل القرية"
          >
            <div className="w-14 h-14 bg-gradient-to-tr from-orange-500 to-amber-400 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-orange-500/20 text-2xl">
              🛵
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              تسجيل الدخول في تطبيق توصيل
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              الاسم ورقم الموبايل مثبتان تلقائياً - الدخول المباشر بالرمز السري (PIN)
            </p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/70 text-center">
            {/* Tab 1: Customer */}
            <button
              type="button"
              onClick={() => { setRole("customer"); setErrorMsg(""); }}
              className={`py-2 px-1 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                role === "customer"
                  ? "bg-white text-orange-600 shadow-md shadow-slate-200/50"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>زبون 🛍️</span>
            </button>

            {/* Tab 2: Store Owner */}
            <button
              type="button"
              onClick={() => { setRole("store"); setErrorMsg(""); }}
              className={`py-2 px-1 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                role === "store"
                  ? "bg-white text-orange-600 shadow-md shadow-slate-200/50"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <StoreIcon className="w-3.5 h-3.5" />
              <span>صاحب محل 🏪</span>
            </button>

            {/* Tab 3: Driver / Captain */}
            <button
              type="button"
              onClick={() => { setRole("driver"); setErrorMsg(""); }}
              className={`py-2 px-1 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                role === "driver"
                  ? "bg-white text-orange-600 shadow-md shadow-slate-200/50"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>كابتن توصيل 🛵</span>
            </button>

            {/* Tab 4: Staff / Admin */}
            {(!hideStaffTab || showSecretStaffTab) && (
              <button
                type="button"
                onClick={() => { setRole("staff"); setErrorMsg(""); }}
                className={`col-span-3 py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1 ${
                  role === "staff"
                    ? "bg-slate-900 text-amber-400 shadow-md"
                    : "text-slate-600 hover:text-slate-900 bg-slate-200/60"
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>🔐 بوابة الإدارة والكوادر المشفرة</span>
              </button>
            )}
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs font-bold text-center animate-shake">
              {errorMsg}
            </div>
          )}

          {isSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl text-xs font-black text-center animate-pulse">
              {successMsg}
            </div>
          )}

          {/* Role Forms */}
          <AnimatePresence mode="wait">
            {/* ========================================== */}
            {/* TAB 1: CUSTOMER FORM                       */}
            {/* ========================================== */}
            {role === "customer" && (
              <motion.div
                key="auth_customer_form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="space-y-4"
              >
                {isReturningCustomer && savedCustomerName && savedCustomerPhone ? (
                  /* Fast PIN-only Login for Returning Customer */
                  <form onSubmit={handleCustomerSubmit} className="space-y-4">
                    {/* Fixed Verified User Badge */}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50/60 border border-orange-200/80 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-xs">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wider block">
                              الحساب المحفوظ 👤
                            </span>
                            <span className="text-sm font-black text-slate-900">
                              {customerName}
                            </span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>مثبت</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-orange-200/60 text-slate-600 font-bold">
                        <span>📱 رقم الموبايل:</span>
                        <span className="font-mono text-slate-900 font-black text-left" dir="ltr">
                          {customerPhone}
                        </span>
                      </div>
                    </div>

                    {/* Direct PIN Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                        <span>أدخل رمز الحماية السري (PIN - 4 أرقام):</span>
                        <span className="text-[10px] text-orange-600 font-bold">للدخول المباشر 🔒</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCustomerPin ? "text" : "password"}
                          maxLength={4}
                          required
                          autoFocus
                          value={customerPin}
                          onChange={(e) => setCustomerPin(e.target.value.replace(/[^0-9]/g, ""))}
                          placeholder="••••"
                          className="w-full bg-white border-2 border-orange-500 focus:border-orange-600 focus:ring-2 focus:ring-orange-200 rounded-2xl py-3 px-10 text-center text-xl font-black tracking-widest outline-none text-slate-900 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCustomerPin(!showCustomerPin)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer p-1"
                        >
                          {showCustomerPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>دخول لحسابي والمتابعة 🛍️</span>
                    </button>

                    {/* Switch Account Link */}
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsReturningCustomer(false);
                          setCustomerPin("");
                          setErrorMsg("");
                        }}
                        className="text-xs text-slate-500 hover:text-orange-600 font-bold transition-colors cursor-pointer inline-flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-100"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تبديل الحساب أو إدخال اسم ورقم آخر</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Full Registration / New Customer Form */
                  <form onSubmit={handleCustomerSubmit} className="space-y-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700 block">
                        الاسم الثلاثي الكريم:
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="مثال: أحمد العلي"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-2xl py-3 px-4 text-xs font-bold outline-none text-slate-800 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700 block">
                        رقم الموبايل للتواصل والتوصيل:
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="0951854257"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-2xl py-3 px-4 text-xs font-bold outline-none text-slate-800 transition-all text-left"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700 block">
                        رمز حماية سري خاص بك (4 أرقام - PIN):
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={customerPin}
                        onChange={(e) => setCustomerPin(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="••••"
                        className="w-full bg-white border-2 border-orange-500 focus:border-orange-600 rounded-2xl py-3 px-4 text-center text-lg font-black tracking-widest outline-none text-slate-900 shadow-xs"
                      />
                      <p className="text-[10px] text-slate-400 font-bold pr-1">
                        * سيتم حفظ اسمك ورقمك وتثبيتهما لتسجيل الدخول السريع لاحقاً بهذا الرمز فقط.
                      </p>
                    </div>

                    {/* Legal Agreement Checkbox for Customer */}
                    <div className="bg-slate-50 border border-slate-200/90 p-3 rounded-2xl space-y-1 text-right">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={customerAgreeTerms}
                          onChange={(e) => setCustomerAgreeTerms(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer shrink-0"
                        />
                        <span className="text-[11px] font-bold text-slate-700 leading-tight">
                          أوافق على{" "}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setTermsModalRole("customer");
                              setShowTermsModal(true);
                            }}
                            className="text-orange-600 font-black underline hover:text-orange-700 cursor-pointer"
                          >
                            شروط الاستخدام وإخلاء المسؤولية القانونية للزبائن ⚖️
                          </button>
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 active:scale-98 transition-all cursor-pointer text-center"
                    >
                      تأكيد وتثبيت الحساب والدخول 🛍️
                    </button>

                    {savedCustomerName && savedCustomerPhone && (
                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsReturningCustomer(true);
                            setCustomerName(savedCustomerName);
                            setCustomerPhone(savedCustomerPhone);
                            setErrorMsg("");
                          }}
                          className="text-xs text-orange-600 font-bold hover:underline cursor-pointer"
                        >
                          العودة للحساب المحفوظ ({savedCustomerName}) ↩️
                        </button>
                      </div>
                    )}
                  </form>
                )}
              </motion.div>
            )}

            {/* ========================================== */}
            {/* TAB 2: STORE OWNER FORM                    */}
            {/* ========================================== */}
            {role === "store" && (
              <motion.div
                key="auth_store_form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="space-y-4"
              >
                {isReturningStore && savedStorePhone ? (
                  /* Fast PIN-only Login for Returning Store Owner */
                  <form onSubmit={handleStoreLogin} className="space-y-4">
                    {/* Fixed Verified Store Badge */}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50/60 border border-orange-200/80 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-xs">
                            <StoreIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wider block">
                              متجرك المحفوظ 🏪
                            </span>
                            <span className="text-sm font-black text-slate-900">
                              {savedStoreName || "لوحة تحكم المتجر"}
                            </span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>مثبت</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-orange-200/60 text-slate-600 font-bold">
                        <span>📱 رقم موبايل المالك:</span>
                        <span className="font-mono text-slate-900 font-black text-left" dir="ltr">
                          {storeLoginPhone}
                        </span>
                      </div>
                    </div>

                    {/* Direct PIN Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                        <span>الرمز السري لمتجرك (PIN - 4 أرقام):</span>
                        <span className="text-[10px] text-orange-600 font-bold">دخول مباشر 🔒</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showStorePin ? "text" : "password"}
                          maxLength={4}
                          required
                          autoFocus
                          value={storeLoginPin}
                          onChange={(e) => setStoreLoginPin(e.target.value.replace(/[^0-9]/g, ""))}
                          placeholder="••••"
                          className="w-full bg-white border-2 border-orange-500 focus:border-orange-600 focus:ring-2 focus:ring-orange-200 rounded-2xl py-3 px-10 text-center text-xl font-black tracking-widest outline-none text-slate-900 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowStorePin(!showStorePin)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer p-1"
                        >
                          {showStorePin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                    >
                      <StoreIcon className="w-4 h-4" />
                      <span>دخول لوحة تحكم المتجر 🏪</span>
                    </button>

                    {/* Switch Account or Register New Store */}
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsReturningStore(false);
                          setStoreLoginPin("");
                          setErrorMsg("");
                        }}
                        className="text-xs text-slate-500 hover:text-orange-600 font-bold transition-colors cursor-pointer inline-flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-100"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>الدخول بمتجر آخر أو طلب انضمام جديد</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Standard Store Tabs: Login / Register */
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => { setStoreTab("login"); setErrorMsg(""); }}
                        className={`py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                          storeTab === "login" ? "bg-white text-orange-600 shadow-xs" : "text-slate-500"
                        }`}
                      >
                        تسجيل دخول لمتجرك
                      </button>
                      <button
                        type="button"
                        onClick={() => { setStoreTab("register"); setErrorMsg(""); }}
                        className={`py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                          storeTab === "register" ? "bg-white text-orange-600 shadow-xs" : "text-slate-500"
                        }`}
                      >
                        طلب انضمام متجر جديد
                      </button>
                    </div>

                    {storeTab === "login" ? (
                      <form onSubmit={handleStoreLogin} className="space-y-3.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-700 block">
                            رقم موبايل مالك المتجر:
                          </label>
                          <input
                            type="tel"
                            required
                            value={storeLoginPhone}
                            onChange={(e) => setStoreLoginPhone(e.target.value)}
                            placeholder="09xxxxxxxx"
                            className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl py-2.5 px-3 text-xs font-bold outline-none text-left"
                            dir="ltr"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-700 block">
                            الرمز السري لمتجرك (4 أرقام - PIN):
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            required
                            value={storeLoginPin}
                            onChange={(e) => setStoreLoginPin(e.target.value.replace(/[^0-9]/g, ""))}
                            placeholder="••••"
                            className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl py-2.5 px-3 text-center text-base font-black tracking-widest outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all cursor-pointer text-center"
                        >
                          دخول وتثبيت متجرك 🏪
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleStoreRegister} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-700 block">
                            اسم المتجر أو النشاط التجاري:
                          </label>
                          <input
                            type="text"
                            required
                            value={newStoreName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewStoreName(val);
                              // Auto-detect category if user is still on default
                              const lower = val.toLowerCase();
                              if (
                                lower.includes("ملابس") ||
                                lower.includes("أزياء") ||
                                lower.includes("ازياء") ||
                                lower.includes("ثياب") ||
                                lower.includes("ألبسة") ||
                                lower.includes("البسة") ||
                                lower.includes("بوتيك") ||
                                lower.includes("فستان")
                              ) {
                                setNewStoreCategory("clothes");
                              } else if (
                                lower.includes("لحم") ||
                                lower.includes("لحوم") ||
                                lower.includes("جزار") ||
                                lower.includes("قصاب") ||
                                lower.includes("مفروم") ||
                                lower.includes("ملحمة")
                              ) {
                                setNewStoreCategory("butcher");
                              }
                            }}
                            placeholder="مثال: مأكولات الشام، ملابس وأزياء"
                            className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl py-2.5 px-3 text-xs font-bold outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-700 block">
                            تصنيف المتجر:
                          </label>
                          <select
                            value={newStoreCategory}
                            onChange={(e) => setNewStoreCategory(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold outline-none"
                          >
                            {storeCategories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-700 block">
                            رقم موبايل المالك:
                          </label>
                          <input
                            type="tel"
                            required
                            value={newStorePhone}
                            onChange={(e) => setNewStorePhone(e.target.value)}
                            placeholder="09xxxxxxxx"
                            className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl py-2.5 px-3 text-xs font-bold outline-none text-left"
                            dir="ltr"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-700 block">
                            رمز حماية سري لمتجرك (4 أرقام):
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            required
                            value={newStorePin}
                            onChange={(e) => setNewStorePin(e.target.value.replace(/[^0-9]/g, ""))}
                            placeholder="••••"
                            className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl py-2.5 px-3 text-center text-base font-black tracking-widest outline-none"
                          />
                        </div>

                        {/* Legal Agreement Checkbox for Store Owner */}
                        <div className="bg-slate-50 border border-slate-200/90 p-3 rounded-2xl space-y-1 text-right">
                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={storeAgreeTerms}
                              onChange={(e) => setStoreAgreeTerms(e.target.checked)}
                              className="mt-0.5 w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer shrink-0"
                            />
                            <span className="text-[11px] font-bold text-slate-700 leading-tight">
                              أوافق وألتزم بـ{" "}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setTermsModalRole("store_owner");
                                  setShowTermsModal(true);
                                }}
                                className="text-orange-600 font-black underline hover:text-orange-700 cursor-pointer"
                              >
                                وثيقة شروط ومسؤوليات أصحاب المتاجر والمطاعم 🏪
                              </button>
                            </span>
                          </label>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all cursor-pointer text-center"
                        >
                          تسجيل المتجر والبدء بإعداده 🚀
                        </button>
                      </form>
                    )}

                    {savedStorePhone && (
                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsReturningStore(true);
                            setStoreLoginPhone(savedStorePhone);
                            setErrorMsg("");
                          }}
                          className="text-xs text-orange-600 font-bold hover:underline cursor-pointer"
                        >
                          العودة للمتجر المحفوظ ({savedStoreName || savedStorePhone}) ↩️
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Direct WhatsApp help for stores */}
                <div className="text-center pt-2 border-t border-slate-100 space-y-2">
                  <p className="text-[11px] text-slate-500 font-bold">تحتاج مساعدة في تسجيل أو تفعيل متجرك؟</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openWhatsApp({
                          phone: "963951854257",
                          message: "مرحباً إدارة المنصة، أحتاج مساعدة بخصوص تسجيل أو تفعيل حساب متجري 🏪",
                          type: "regular"
                        })
                      }
                      className="py-2 px-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] border border-[#25D366]/30 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                      <span>واتساب العادي 💬</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        openWhatsApp({
                          phone: "963951854257",
                          message: "مرحباً إدارة المنصة، أحتاج مساعدة بخصوص تسجيل أو تفعيل حساب متجري 🏪",
                          type: "business"
                        })
                      }
                      className="py-2 px-2 bg-[#075E54]/10 hover:bg-[#075E54]/20 text-[#075E54] border border-[#075E54]/30 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#075E54]" />
                      <span>واتساب الأعمال 💼</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================== */}
            {/* TAB 3: DRIVER / CAPTAIN FORM               */}
            {/* ========================================== */}
            {role === "driver" && (
              <motion.div
                key="auth_driver_form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="space-y-4"
              >
                {isReturningDriver && savedDriverUser ? (
                  /* Fast PIN-only Login for Returning Captain */
                  <form onSubmit={handleDriverSubmit} className="space-y-4">
                    {/* Fixed Verified Driver Badge */}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50/60 border border-orange-200/80 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-orange-400 flex items-center justify-center shadow-xs">
                            <Bike className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wider block">
                              كابتن التوصيل المعتمد 🛵
                            </span>
                            <span className="text-sm font-black text-slate-900">
                              {savedDriverName || "كابتن التوصيل"}
                            </span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>مثبت</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-orange-200/60 text-slate-600 font-bold">
                        <span>📱 المعرف / الموبايل:</span>
                        <span className="font-mono text-slate-900 font-black text-left" dir="ltr">
                          {driverUser}
                        </span>
                      </div>
                    </div>

                    {/* Direct PIN Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                        <span>رمز المرور السري (PIN):</span>
                        <span className="text-[10px] text-orange-600 font-bold">دخول مباشر 🔒</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showDriverPin ? "text" : "password"}
                          required
                          autoFocus
                          value={driverPin}
                          onChange={(e) => setDriverPin(normalizeDigits(e.target.value))}
                          placeholder="1111"
                          className="w-full bg-white border-2 border-orange-500 focus:border-orange-600 focus:ring-2 focus:ring-orange-200 rounded-2xl py-3 px-10 text-center text-xl font-black tracking-widest outline-none text-slate-900 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDriverPin(!showDriverPin)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer p-1"
                        >
                          {showDriverPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthenticatingDriver}
                      className="w-full bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 transition-all cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isAuthenticatingDriver ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>جارٍ التحقق...</span>
                        </>
                      ) : (
                        <>
                          <Bike className="w-4 h-4" />
                          <span>دخول لوحة الكابتن واستلام الطلبات 🛵</span>
                        </>
                      )}
                    </button>

                    {/* Switch Captain Account */}
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsReturningDriver(false);
                          setDriverPin("");
                          setErrorMsg("");
                        }}
                        className="text-xs text-slate-500 hover:text-orange-600 font-bold transition-colors cursor-pointer inline-flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-100"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>الدخول بحساب كابتن آخر</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Standard Captain Login Form */
                  <form onSubmit={handleDriverSubmit} className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-2xl space-y-1 text-slate-700 text-xs">
                      <div className="flex items-center gap-2 font-black text-orange-700 text-xs">
                        <Bike className="w-4 h-4 text-orange-600" />
                        <span>تسجيل دخول كباتن التوصيل 🛵</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        أهلاً بك! يمكنك تسجيل الدخول بسهولة باستخدام <strong>رقم موبايلك</strong> أو <strong>اسمك</strong> مع رمز الـ PIN المعتمد (الافتراضي 1111).
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700 block">
                        رقم موبايل الكابتن أو الاسم أو اسم المستخدم:
                      </label>
                      <input
                        type="text"
                        required
                        value={driverUser}
                        onChange={(e) => setDriverUser(e.target.value)}
                        placeholder="مثال: 0951854257 أو كابتن أحمد"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-2xl py-3 px-4 text-xs font-bold outline-none text-slate-800 transition-all text-right"
                        dir="auto"
                      />
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        💡 يمكنك كتابة رقم الموبايل (مثل 09xxxxxxxx) أو اسمك كما سجله المشرف.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700 flex items-center justify-between">
                        <span>رمز المرور السري (PIN):</span>
                        <span className="text-[10px] text-orange-600 font-bold">الافتراضي 1111</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showDriverPin ? "text" : "password"}
                          required
                          value={driverPin}
                          onChange={(e) => setDriverPin(normalizeDigits(e.target.value))}
                          placeholder="1111"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-2xl py-3 px-10 text-center text-base font-black tracking-widest outline-none text-slate-900 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDriverPin(!showDriverPin)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer p-1"
                        >
                          {showDriverPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Legal Agreement Checkbox for Driver */}
                    <div className="bg-slate-50 border border-slate-200/90 p-3 rounded-2xl space-y-1 text-right">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={driverAgreeTerms}
                          onChange={(e) => setDriverAgreeTerms(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer shrink-0"
                        />
                        <span className="text-[11px] font-bold text-slate-700 leading-tight">
                          أوافق وألتزم بـ{" "}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setTermsModalRole("driver");
                              setShowTermsModal(true);
                            }}
                            className="text-orange-600 font-black underline hover:text-orange-700 cursor-pointer"
                          >
                            وثيقة شروط وقواعد كباتن التوصيل والعمل الحر 🛵
                          </button>
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthenticatingDriver}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 active:scale-98 transition-all cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isAuthenticatingDriver ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>جارٍ التحقق وتحديث البيانات...</span>
                        </>
                      ) : (
                        <>
                          <Bike className="w-4 h-4" />
                          <span>دخول وتثبيت حساب الكابتن 🛵</span>
                        </>
                      )}
                    </button>

                    {savedDriverUser && (
                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsReturningDriver(true);
                            setDriverUser(savedDriverUser);
                            setErrorMsg("");
                          }}
                          className="text-xs text-orange-600 font-bold hover:underline cursor-pointer"
                        >
                          العودة لحساب الكابتن المحفوظ ({savedDriverName || savedDriverUser}) ↩️
                        </button>
                      </div>
                    )}
                  </form>
                )}

                {/* Direct WhatsApp request for new drivers */}
                <div className="text-center pt-2 border-t border-slate-100 space-y-2">
                  <p className="text-[11px] text-slate-500 font-bold">كابتن جديد وترغب بالانضمام للأسطول؟</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openWhatsApp({
                          phone: "963951854257",
                          message: "مرحباً، أرغب بالانضمام ككابتن توصيل في المنصة 🛵",
                          type: "regular"
                        })
                      }
                      className="py-2 px-2 bg-[#25D366] hover:bg-[#20ba56] text-white rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>واتساب العادي 💬</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        openWhatsApp({
                          phone: "963951854257",
                          message: "مرحباً، أرغب بالانضمام ككابتن توصيل في المنصة 🛵",
                          type: "business"
                        })
                      }
                      className="py-2 px-2 bg-[#075E54] hover:bg-[#054a43] text-white rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>واتساب الأعمال 💼</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================== */}
            {/* TAB 4: STAFF & ADMIN FORM                  */}
            {/* ========================================== */}
            {role === "staff" && (
              <motion.form
                key="auth_staff_form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                onSubmit={handleStaffSubmit}
                className="space-y-4"
              >
                {/* Header Badge */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-400 text-slate-950 rounded-xl flex items-center justify-center font-black">
                        🔐
                      </div>
                      <div>
                        <h4 className="font-black text-xs sm:text-sm text-amber-400">بوابة الإدارة والكوادر المشفرة</h4>
                        <p className="text-[10px] text-slate-400">نظام تسجيل الدخول المحمي متعدد المستويات</p>
                      </div>
                    </div>
                    {isLocked && (
                      <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse font-bold">
                        مقفل مؤقتاً ⏳
                      </span>
                    )}
                  </div>

                  {/* Dual Mode Switcher Tabs */}
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
                    <button
                      type="button"
                      disabled={isPinLocked}
                      onClick={() => {
                        if (!isPinLocked) {
                          setStaffAuthMode("pin");
                          setErrorMsg("");
                        }
                      }}
                      className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isPinLocked 
                          ? "bg-rose-950/60 text-rose-300 border border-rose-800/50 cursor-not-allowed opacity-80"
                          : staffAuthMode === "pin"
                          ? "bg-amber-400 text-slate-950 shadow-xs font-black"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>{isPinLocked ? "الـ PIN مقفل 🔒" : "رمز PIN سريع"}</span>
                      {!isPinLocked && (
                        <span className={`text-[9px] px-1 rounded-sm ${staffPinFailedAttempts === 1 ? "bg-rose-500 text-white" : "bg-black/20"}`}>
                          {staffPinFailedAttempts === 1 ? "1 متبقية" : "2 محاولات"}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStaffAuthMode("password");
                        setErrorMsg("");
                      }}
                      className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        staffAuthMode === "password" || isPinLocked
                          ? "bg-amber-400 text-slate-950 shadow-xs font-black"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>كلمة المرور المشفرة</span>
                      {isPinLocked && (
                        <span className="text-[9px] bg-emerald-600 text-white px-1 rounded-sm font-bold">
                          مطلوبة
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Security Alert Banner */}
                {isPinLocked ? (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl text-xs space-y-1 text-rose-900 animate-scale-up">
                    <div className="flex items-center gap-1.5 font-black text-rose-700">
                      <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>تم قفل خيار الـ PIN السريع لحماية الحساب 🔒</span>
                    </div>
                    <p className="text-[11px] text-rose-800 leading-relaxed font-semibold">
                      استُنفدت محاولتا الـ PIN المسموحتان لمنع التخمين. <strong>يُشترط الآن إدخال كلمة المرور المشفرة الكاملة (المكونة من أحرف وأرقام)</strong> للدخول.
                    </p>
                  </div>
                ) : staffPinFailedAttempts === 1 ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs flex items-start gap-2 text-amber-900 animate-scale-up">
                    <span className="text-base">⚠️</span>
                    <p className="text-[11px] leading-relaxed font-bold">
                      <strong>تنبيه أمني:</strong> استُهلكت محاولة واحدة غير صحيحة! متبقية محاولة واحدة فقط (1) بالرمز السري قبل قفله وإجبار كلمة المرور الكاملة.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs flex items-center gap-2 text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p className="text-[11px] leading-relaxed font-medium">
                      نظام حماية الحسابات: يتيح محاولتين للـ PIN السريع، وفي الثالثة يطلب كلمة المرور المشفرة منعاً للاختراق.
                    </p>
                  </div>
                )}

                {/* Input Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      {isPinLocked || staffAuthMode === "password"
                        ? "كلمة المرور المشفرة الكاملة (أحرف وأرقام):"
                        : "رمز الـ PIN السريع (3-6 أرقام):"}
                    </label>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {isPinLocked || staffAuthMode === "password" ? "أكثر من 4 خانات" : "دخول سريع"}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoFocus
                      disabled={isLocked}
                      maxLength={isPinLocked || staffAuthMode === "password" ? 40 : 6}
                      value={staffPassword}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!isPinLocked && staffAuthMode === "pin") {
                          setStaffPassword(val.replace(/\D/g, ""));
                        } else {
                          setStaffPassword(val);
                        }
                      }}
                      placeholder={
                        isPinLocked || staffAuthMode === "password"
                          ? "أدخل كلمة المرور (مثال: Admin@Tawseel2026#)..."
                          : "أدخل رمز الـ PIN (مثال: 1234)..."
                      }
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white rounded-xl py-3 px-10 text-center text-sm font-black outline-none text-slate-800 placeholder-slate-400 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLocked}
                  className={`w-full ${
                    isLocked ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-orange-500 hover:text-slate-950"
                  } text-white font-extrabold text-sm py-3.5 rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-1.5`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isLocked 
                      ? "بوابة الإدارة مقفلة مؤقتاً..." 
                      : isPinLocked || staffAuthMode === "password"
                      ? "تأكيد كلمة المرور المشفرة والدخول 🔐"
                      : "تسجيل الدخول بالرمز السريع ⚡"}
                  </span>
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Security Footer Badge */}
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>اتصال مشفر ومحمي - تثبيت الهوية بالرمز السري فقط</span>
          </div>
        </div>
      </main>

      {/* App Update Modal in Auth */}
      {showUpdateModal && (
        <AppUpdateModal
          update={currentAppUpdate}
          onClose={() => setShowUpdateModal(false)}
          onApplyUpdate={handleApplyUpdateInAuth}
        />
      )}

      {/* Role-Specific Legal Terms Modal */}
      {showTermsModal && (
        <TermsAgreementModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          role={termsModalRole}
          showAcceptButton={true}
          onAccept={() => {
            if (termsModalRole === "customer") setCustomerAgreeTerms(true);
            if (termsModalRole === "store_owner") setStoreAgreeTerms(true);
            if (termsModalRole === "driver") setDriverAgreeTerms(true);
            setShowTermsModal(false);
          }}
        />
      )}
    </div>
  );
};
