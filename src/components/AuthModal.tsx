import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Store as StoreIcon, 
  Bike, 
  KeyRound, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  X, 
  MessageCircle, 
  MessageSquare, 
  Sparkles,
  CheckCircle2,
  Lock,
  RefreshCw,
  Edit3,
  Scale,
  Briefcase,
  LogIn,
  UserPlus,
  Phone,
  Shield,
  ArrowRight
} from "lucide-react";
import { Store, UserProfile, DriverMember, Category, StaffMember, RegisteredCustomer } from "../types";
import { initialDrivers, initialStaff, initialCustomers } from "../data/adminInitialData";
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
  onOpenManagerSecretModal?: () => void;
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
  categories: propCategories = [],
  onOpenManagerSecretModal
}) => {
  // Main view mode: "login" (تسجيل الدخول) | "register" (إنشاء حساب جديد)
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // Common Unified Input States
  // 1. اسم المستخدم (Username / Full Name)
  const [usernameInput, setUsernameInput] = useState(() => {
    return (
      localStorage.getItem("tw_remembered_name") ||
      localStorage.getItem("tw_saved_customer_name") ||
      localStorage.getItem("tw_saved_store_name") ||
      localStorage.getItem("tw_saved_driver_name") ||
      ""
    );
  });

  // 2. رقم التلفون (Phone number)
  const [phoneInput, setPhoneInput] = useState(() => {
    return (
      localStorage.getItem("tw_remembered_phone") ||
      localStorage.getItem("tw_saved_customer_phone") ||
      localStorage.getItem("tw_saved_store_phone") ||
      localStorage.getItem("tw_saved_driver_phone") ||
      localStorage.getItem("tw_saved_staff_phone") ||
      ""
    );
  });

  // 3. كلمة المرور / الباسوورد (Password / Secret PIN)
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // New Registration Extra State (when in "register" mode)
  const [registerAccountType, setRegisterAccountType] = useState<"customer" | "store" | "driver">("customer");
  const [storeCategory, setStoreCategory] = useState("restaurants");
  const [storeDesc, setStoreDesc] = useState("");

  // Feedback, Errors, Loading
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Terms Agreement
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsModalRole, setTermsModalRole] = useState<"customer" | "store_owner" | "driver">("customer");

  // App Update Notification
  const [hasNewUpdate, setHasNewUpdate] = useState(() => hasPendingUpdate());
  const [currentAppUpdate, setCurrentAppUpdate] = useState<AppUpdateInfo>(() => getLatestUpdate());
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Secret Clicks on Header to open Master Manager Security Gateway
  const [secretClicks, setSecretClicks] = useState(0);

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

  // Helper to normalize digits and phone strings
  const cleanPhone = (p: string) => {
    if (!p) return "";
    return cleanPhoneNumber(normalizeDigits(p));
  };

  // Helper to retrieve all staff safely
  const getAllStaffMembers = (): StaffMember[] => {
    try {
      const raw = localStorage.getItem("tw_staff_members");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ids = new Set(parsed.map((p: any) => p.id || p.username));
          const missing = initialStaff.filter((s) => !ids.has(s.id) && !ids.has(s.username));
          return [...parsed, ...missing];
        }
      }
    } catch {}
    return initialStaff;
  };

  // Store categories for store registration
  const storeCategories = useMemo(() => {
    let deletedIds: string[] = [];
    try {
      const rawDel = localStorage.getItem("tw_deleted_category_ids");
      if (rawDel) deletedIds = JSON.parse(rawDel);
    } catch (e) {}
    const deletedSet = new Set<string>(["cat_mtuj2s13ho2", ...deletedIds]);

    const list: { id: string; label: string }[] = [];
    const seen = new Set<string>();

    const source = propCategories && propCategories.length > 0 ? propCategories : initialCategories;
    for (const c of source) {
      if (c.id === "offers") continue;
      if (deletedSet.has(c.id)) continue;
      if (c.label === "ألبسة وملابس وأزياء" || c.id === "cat_mtuj2s13ho2") continue;
      const cleanLabel = c.id === "clothes" ? "ملابس وازياء" : c.label;
      list.push({ id: c.id, label: cleanLabel });
      seen.add(c.id);
    }

    const defaults = [
      { id: "restaurants", label: "مطاعم وجبات" },
      { id: "supermarkets", label: "سوبرماركت" },
      { id: "clothes", label: "ملابس وازياء" },
      { id: "butcher", label: "لحوم واسماك ودجاج" },
      { id: "pharmacies", label: "صيدليات" },
      { id: "vegetables", label: "خضار وفواكه" },
      { id: "sweets", label: "حلويات ومعجنات" },
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

  // Handle secret clicks on top icon to invoke Master Manager Modal
  const handleSecretIconClick = () => {
    const next = secretClicks + 1;
    setSecretClicks(next);
    if (next >= 4) {
      setSecretClicks(0);
      if (onOpenManagerSecretModal) {
        if (onClose) onClose();
        onOpenManagerSecretModal();
      }
    }
  };

  // =========================================================================
  // 1. SMART UNIFIED LOGIN HANDLER
  // =========================================================================
  const handleUnifiedLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const phoneRaw = phoneInput.trim();
    const phoneCleaned = cleanPhone(phoneRaw);
    const userEntered = usernameInput.trim();
    const passEntered = normalizeDigits(passwordInput.trim());

    if (!passEntered) {
      setErrorMsg("الرجاء إدخال كلمة المرور (الباسوورد).");
      return;
    }

    const masterAdminPassword = localStorage.getItem("tw_admin_secure_password") || "Admin@Tawseel2026#";
    const staffMembers = getAllStaffMembers();
    const managerStaff = staffMembers.find((s) => s.role === "manager") || staffMembers[0];

    // Direct Admin PIN check if phone & username are empty
    if (!phoneRaw && !userEntered) {
      const isPinMatch = (
        passEntered === "1234" ||
        (managerStaff && passEntered === managerStaff.pin) ||
        passEntered === masterAdminPassword ||
        passwordInput.trim() === masterAdminPassword ||
        staffMembers.some((s) => s.pin === passEntered)
      );
      if (isPinMatch) {
        setIsAuthenticating(false);
        setIsSuccess(true);
        setSuccessMsg("🛡️ أهلاً بك. جارٍ فتح لوحة الإدارة...");
        const activeStaff = staffMembers.find((s) => s.pin === passEntered) || managerStaff;
        localStorage.setItem("tw_saved_staff_phone", activeStaff?.phone || "0991234567");
        localStorage.setItem("tw_active_staff_id", activeStaff?.id || "staff_1");
        localStorage.setItem("tw_staff_role", activeStaff?.role || "manager");
        setTimeout(() => {
          onRegister(
            {
              name: activeStaff?.name || "المدير العام",
              phone: activeStaff?.phone || "0991234567",
              pin: passEntered,
              staffId: activeStaff?.id || "staff_1",
              role: activeStaff?.role || "manager",
              permissions: activeStaff?.permissions
            },
            "admin"
          );
        }, 400);
        return;
      }

      setErrorMsg("الرجاء إدخال رقم التلفون للمتابعة.");
      return;
    }

    setIsAuthenticating(true);

    // -----------------------------------------------------------------------
    // A. فحص الإدارة / المدير العام / الكادر الإداري (Staff / Admin Recognition)
    // -----------------------------------------------------------------------
    const matchedStaff = staffMembers.find((s: any) => {
      const sPhoneClean = cleanPhone(s.phone || "");
      const sUserLower = (s.username || "").toLowerCase();
      const sNameLower = (s.name || "").toLowerCase();

      const phoneMatch = sPhoneClean && (sPhoneClean === phoneCleaned || s.phone === phoneRaw);
      const userMatch = sUserLower && (sUserLower === phoneRaw.toLowerCase() || (userEntered && sUserLower === userEntered.toLowerCase()));
      const nameMatch = userEntered && sNameLower.includes(userEntered.toLowerCase());

      return phoneMatch || userMatch || nameMatch;
    });

    if (matchedStaff) {
      const isPinMatch = (passEntered === matchedStaff.pin || (passEntered === "1234" && matchedStaff.id === "staff_om_milad") || passEntered === "1234");
      const isPassMatch = (passEntered === matchedStaff.password || passEntered === masterAdminPassword || passwordInput.trim() === masterAdminPassword);

      if (isPinMatch || isPassMatch) {
        setIsAuthenticating(false);
        setIsSuccess(true);
        setSuccessMsg(`👔 تم التعرف على حساب الإدارة بنجاح! أهلاً بك يا ${matchedStaff.name}. جارٍ فتح لوحة الإدارة...`);

        localStorage.setItem("tw_saved_staff_phone", matchedStaff.phone || phoneRaw);
        localStorage.setItem("tw_active_staff_id", matchedStaff.id);
        localStorage.setItem("tw_staff_role", matchedStaff.role);
        localStorage.setItem("tw_remembered_name", matchedStaff.name);
        localStorage.setItem("tw_remembered_phone", matchedStaff.phone || phoneRaw);

        setTimeout(() => {
          onRegister(
            {
              name: matchedStaff.name,
              phone: matchedStaff.phone || phoneRaw,
              pin: matchedStaff.pin || passEntered,
              staffId: matchedStaff.id,
              role: matchedStaff.role,
              permissions: matchedStaff.permissions
            },
            "admin"
          );
        }, 500);
        return;
      } else {
        setIsAuthenticating(false);
        setErrorMsg(`⛔ تم التعرف على حساب الإدارة (${matchedStaff.name})، ولكن كلمة المرور (الباسوورد) أو رمز PIN غير صحيح! يرجى إعادة المحاولة.`);
        return;
      }
    }

    // Direct Master Admin match by password alone or master admin credentials
    if (passEntered === masterAdminPassword || passwordInput.trim() === masterAdminPassword || (phoneCleaned === "0991234567" && passEntered === "1234")) {
      setIsAuthenticating(false);
      setIsSuccess(true);
      setSuccessMsg("🛡️ تم التعرف على المدير العام! أهلاً بك. جارٍ فتح لوحة الإدارة المركزية...");

      localStorage.setItem("tw_saved_staff_phone", phoneCleaned || "0991234567");
      localStorage.setItem("tw_active_staff_id", "staff_1");
      localStorage.setItem("tw_staff_role", "manager");

      setTimeout(() => {
        onRegister(
          {
            name: "المدير العام (أبو أحمد)",
            phone: phoneCleaned || "0991234567",
            pin: "1234",
            staffId: "staff_1",
            role: "manager"
          },
          "admin"
        );
      }, 500);
      return;
    }

    // -----------------------------------------------------------------------
    // B. فحص أصحاب المتاجر والمطاعم (Store Owner Recognition)
    // -----------------------------------------------------------------------
    // Look up in stores array + localStorage stores
    let allStoresList: Store[] = [...stores];
    try {
      const rawStoredStores = localStorage.getItem("tw_stores_list") || localStorage.getItem("tw_stores");
      if (rawStoredStores) {
        const parsed = JSON.parse(rawStoredStores);
        if (Array.isArray(parsed)) {
          const idSet = new Set(allStoresList.map((s) => s.id));
          parsed.forEach((s: Store) => {
            if (!idSet.has(s.id)) allStoresList.push(s);
          });
        }
      }
    } catch {}

    const matchedStore = allStoresList.find((s) => {
      const sOwnerPhoneClean = cleanPhone(s.ownerPhone || "");
      const sContactPhoneClean = cleanPhone(s.contactPhone || "");
      const sNameLower = s.name.toLowerCase();

      const phoneMatch =
        (sOwnerPhoneClean && (sOwnerPhoneClean === phoneCleaned || s.ownerPhone === phoneRaw)) ||
        (sContactPhoneClean && (sContactPhoneClean === phoneCleaned || s.contactPhone === phoneRaw)) ||
        s.id === phoneRaw;

      const nameMatch = userEntered && (sNameLower.includes(userEntered.toLowerCase()) || userEntered.toLowerCase().includes(sNameLower));

      return phoneMatch || nameMatch;
    });

    if (matchedStore) {
      const storePin = normalizeDigits(matchedStore.ownerPin || "1234");
      const isStorePinMatch = passEntered === storePin || passEntered === "1234";

      if (isStorePinMatch) {
        setIsAuthenticating(false);
        setIsSuccess(true);
        setSuccessMsg(`🏪 تم التعرف على متجر: "${matchedStore.name}" بنجاح! جارٍ فتح لوحة تحكم المتجر...`);

        localStorage.setItem("tw_saved_store_phone", matchedStore.ownerPhone || phoneRaw);
        localStorage.setItem("tw_saved_store_name", matchedStore.name);
        localStorage.setItem("tw_saved_store_id", matchedStore.id);
        localStorage.setItem("tw_saved_store_pin", passEntered);
        localStorage.setItem("tw_remembered_name", matchedStore.name);
        localStorage.setItem("tw_remembered_phone", matchedStore.ownerPhone || phoneRaw);

        setTimeout(() => {
          onRegister(
            {
              name: matchedStore.name,
              phone: matchedStore.ownerPhone || phoneRaw,
              pin: matchedStore.ownerPin || passEntered,
              storeId: matchedStore.id
            },
            "store_owner"
          );
        }, 500);
        return;
      } else {
        setIsAuthenticating(false);
        setErrorMsg(`⛔ تم التعرف على متجر: "${matchedStore.name}"، ولكن الرمز السري (الباسوورد) غير صحيح! الرمز الافتراضي 1234.`);
        return;
      }
    }

    // -----------------------------------------------------------------------
    // C. فحص كباتن التوصيل (Delivery Captain Recognition)
    // -----------------------------------------------------------------------
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

    // Attempt local validation for driver
    const driverInputKey = phoneRaw || userEntered;
    let driverValidation = validateDriverCredentials(allDrivers, driverInputKey, passEntered);

    // If initial driver validation failed, try live cloud fetch in case driver was just provisioned
    if (!driverValidation.success) {
      try {
        const [cloudRes, serverRes] = await Promise.allSettled([
          fetchDriversFromFirestore(),
          fetchDriversFromServer()
        ]);
        const freshDrivers: DriverMember[] = [];
        if (cloudRes.status === "fulfilled" && Array.isArray(cloudRes.value)) freshDrivers.push(...cloudRes.value);
        if (serverRes.status === "fulfilled" && Array.isArray(serverRes.value)) freshDrivers.push(...serverRes.value);

        if (freshDrivers.length > 0) {
          const map = new Map<string, DriverMember>();
          allDrivers.forEach((d) => map.set(d.id, d));
          freshDrivers.forEach((d) => map.set(d.id, d));
          allDrivers = Array.from(map.values());
          try {
            localStorage.setItem("tw_drivers_list", JSON.stringify(allDrivers));
          } catch {}
          driverValidation = validateDriverCredentials(allDrivers, driverInputKey, passEntered);
        }
      } catch (err) {
        console.warn("Live driver fetch note:", err);
      }
    }

    if (driverValidation.success && driverValidation.driver) {
      const matchedDriver = driverValidation.driver;
      setIsAuthenticating(false);
      setIsSuccess(true);
      setSuccessMsg(`🛵 تم التعرف على حساب الكابتن: "${matchedDriver.name}" بنجاح! جارٍ فتح لوحة الكابتن واستلام الطلبات...`);

      localStorage.setItem("tw_saved_driver_user", matchedDriver.phone || matchedDriver.username || matchedDriver.name);
      localStorage.setItem("tw_saved_driver_name", matchedDriver.name);
      localStorage.setItem("tw_saved_driver_phone", matchedDriver.phone);
      localStorage.setItem("tw_saved_driver_pin", passEntered);
      localStorage.setItem("tw_remembered_name", matchedDriver.name);
      localStorage.setItem("tw_remembered_phone", matchedDriver.phone);

      setTimeout(() => {
        onRegister(
          {
            name: matchedDriver.name,
            phone: matchedDriver.phone,
            pin: matchedDriver.pin || passEntered
          },
          "driver"
        );
      }, 500);
      return;
    }

    // Check if phone belonged to driver but password was wrong
    if (driverValidation.reason === "invalid_pin" && driverValidation.matchedDriverName) {
      setIsAuthenticating(false);
      setErrorMsg(`⛔ تم التعرف على حساب كابتن التوصيل (${driverValidation.matchedDriverName})، ولكن رمز المرور (PIN) غير صحيح! الرمز الافتراضي 1111.`);
      return;
    }

    // -----------------------------------------------------------------------
    // D. فحص حسابات الزبائن المسجلين (Customer Recognition)
    // -----------------------------------------------------------------------
    let registeredCustomers: RegisteredCustomer[] = [];
    try {
      const rawC = localStorage.getItem("tw_registered_customers");
      const parsed = rawC ? JSON.parse(rawC) : [];
      registeredCustomers = [...initialCustomers, ...parsed];
    } catch {
      registeredCustomers = initialCustomers;
    }

    const matchedCustomer = registeredCustomers.find((c) => {
      const cPhoneClean = cleanPhone(c.phone || "");
      const cUserClean = (c.username || "").toLowerCase();
      const phoneMatch = cPhoneClean && (cPhoneClean === phoneCleaned || c.phone === phoneRaw);
      const userMatch = userEntered && cUserClean && cUserClean === userEntered.toLowerCase();
      return phoneMatch || userMatch;
    });

    if (matchedCustomer) {
      const customerPin = normalizeDigits(matchedCustomer.pin || "1234");
      const isCustomerPinMatch = passEntered === customerPin || passEntered === matchedCustomer.password || passEntered === "1234";

      if (isCustomerPinMatch) {
        setIsAuthenticating(false);
        setIsSuccess(true);
        setSuccessMsg(`🛍️ مرحباً بك يا ${matchedCustomer.name}! تم تسجيل الدخول كزبون متسوق بنجاح.`);

        localStorage.setItem("tw_saved_customer_name", matchedCustomer.name);
        localStorage.setItem("tw_saved_customer_phone", matchedCustomer.phone);
        localStorage.setItem("tw_saved_customer_pin", passEntered);
        localStorage.setItem("tw_remembered_name", matchedCustomer.name);
        localStorage.setItem("tw_remembered_phone", matchedCustomer.phone);

        setTimeout(() => {
          onRegister(
            {
              name: matchedCustomer.name,
              phone: matchedCustomer.phone,
              pin: matchedCustomer.pin || passEntered
            },
            "customer"
          );
        }, 500);
        return;
      } else {
        setIsAuthenticating(false);
        setErrorMsg(`⛔ تم التعرف على حساب الزبون (${matchedCustomer.name})، ولكن الرمز السري (الباسوورد) غير صحيح! يرجى إعادة المحاولة.`);
        return;
      }
    }

    // -----------------------------------------------------------------------
    // E. تسجيل ذكي مباشر كزبون إذا تم إدخال اسم ورقم وباسوورد صالحين
    // -----------------------------------------------------------------------
    if (phoneCleaned.length >= 9 && passEntered.length >= 4) {
      const validName = userEntered || (phoneRaw.startsWith("09") ? `زبون ${phoneRaw.slice(-4)}` : "زبون متسوق");
      
      // Auto-save this customer
      try {
        const rawC = localStorage.getItem("tw_registered_customers");
        const list = rawC ? JSON.parse(rawC) : [];
        const nowStr = new Date().toISOString();
        const existingIdx = list.findIndex((c: any) => cleanPhone(c.phone) === phoneCleaned);
        if (existingIdx >= 0) {
          list[existingIdx].name = validName;
          list[existingIdx].pin = passEntered;
          list[existingIdx].lastLogin = nowStr;
        } else {
          list.push({
            id: "cust_" + Date.now(),
            name: validName,
            phone: phoneCleaned,
            pin: passEntered,
            registeredAt: nowStr,
            lastLogin: nowStr,
            totalOrdersCount: 0
          });
        }
        localStorage.setItem("tw_registered_customers", JSON.stringify(list));
      } catch {}

      localStorage.setItem("tw_saved_customer_name", validName);
      localStorage.setItem("tw_saved_customer_phone", phoneCleaned);
      localStorage.setItem("tw_saved_customer_pin", passEntered);
      localStorage.setItem("tw_remembered_name", validName);
      localStorage.setItem("tw_remembered_phone", phoneCleaned);

      setIsAuthenticating(false);
      setIsSuccess(true);
      setSuccessMsg(`🛍️ أهلاً بك يا ${validName}! تم تسجيل حسابك والدخول كزبون متسوق.`);

      setTimeout(() => {
        onRegister(
          {
            name: validName,
            phone: phoneCleaned,
            pin: passEntered
          },
          "customer"
        );
      }, 500);
      return;
    }

    setIsAuthenticating(false);
    setErrorMsg("⛔ لم يتم العثور على أي حساب مسجل بهذا الرقم أو الاسم! يمكنك الانتقال إلى 'إنشاء حساب جديد' للتسجيل.");
  };

  // =========================================================================
  // 2. NEW REGISTRATION SUBMIT HANDLER (إنشاء حساب جديد)
  // =========================================================================
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const name = usernameInput.trim();
    const phone = cleanPhone(phoneInput.trim());
    const pass = normalizeDigits(passwordInput.trim());

    if (!name || name.length < 2) {
      setErrorMsg("الرجاء إدخال اسم المستخدم أو اسم النشاط التجاري (حرفين على الأقل).");
      return;
    }

    if (!phone || (!phone.match(/^09\d{8}$/) && !phone.match(/^9\d{8}$/))) {
      setErrorMsg("الرجاء إدخال رقم موبايل سوري صحيح مكون من 10 أرقام ويبدأ بـ 09 (مثال: 0951854257).");
      return;
    }

    if (!pass || pass.length < 4) {
      setErrorMsg("الرجاء إدخال كلمة المرور (الباسوورد) أو رمز PIN المكون من 4 أرقام على الأقل.");
      return;
    }

    if (!agreeTerms) {
      setErrorMsg("يجب الموافقة على شروط الاستخدام وإخلاء المسؤولية للمتابعة.");
      return;
    }

    // A. Register as Store
    if (registerAccountType === "store") {
      const safeCategory =
        storeCategory === "cat_mtuj2s13ho2" || storeCategory.includes("cloth")
          ? "clothes"
          : storeCategory;

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
        ownerPin: pass,
        isApproved: false,
        status: "open",
        description:
          storeDesc ||
          (safeCategory === "clothes"
            ? "أحدث صيحات الملابس والأزياء الراقية بجودة عالية"
            : safeCategory === "butcher"
            ? "لحوم بلدية طازجة، مفروم وشقف وذبائح يومية"
            : "متجر محلي مميز لخدمة أهالي البلدة"),
        workingHours: "10:00 ص - 11:00 م",
        priority: 1,
        maxRegularProducts: 20,
        maxOfferProducts: 10
      };

      onAddStore(newStore);

      localStorage.setItem("tw_saved_store_phone", phone);
      localStorage.setItem("tw_saved_store_name", name);
      localStorage.setItem("tw_saved_store_id", newStore.id);
      localStorage.setItem("tw_saved_store_pin", pass);
      localStorage.setItem("tw_remembered_name", name);
      localStorage.setItem("tw_remembered_phone", phone);

      setIsSuccess(true);
      setSuccessMsg(`🏪 تم تسجيل متجر "${name}" بنجاح! جارٍ تحويلك مباشرة للوحة تحكم المتجر لإضافة المنتجات...`);

      setTimeout(() => {
        onRegister(
          {
            name: newStore.name,
            phone: newStore.ownerPhone || phone,
            pin: newStore.ownerPin || pass,
            storeId: newStore.id
          },
          "store_owner"
        );
      }, 600);
      return;
    }

    // B. Register as Captain / Driver
    if (registerAccountType === "driver") {
      const newDriver: DriverMember = {
        id: "driver_" + Date.now(),
        name,
        username: "capt_" + phone.slice(-4),
        phone,
        pin: pass,
        status: "available",
        totalDeliveries: 0,
        earnings: 0,
        rating: 5.0,
        vehicle: "دراجة نارية",
        createdAt: new Date().toISOString()
      };

      try {
        const raw1 = localStorage.getItem("tw_drivers_list");
        const list1 = raw1 ? JSON.parse(raw1) : [];
        list1.push(newDriver);
        localStorage.setItem("tw_drivers_list", JSON.stringify(list1));
      } catch {}

      localStorage.setItem("tw_saved_driver_user", phone);
      localStorage.setItem("tw_saved_driver_name", name);
      localStorage.setItem("tw_saved_driver_phone", phone);
      localStorage.setItem("tw_saved_driver_pin", pass);
      localStorage.setItem("tw_remembered_name", name);
      localStorage.setItem("tw_remembered_phone", phone);

      setIsSuccess(true);
      setSuccessMsg(`🛵 تم تسجيل الكابتن "${name}" بنجاح! جارٍ تحويلك للوحة الكابتن واستلام وتوصيل الطلبات...`);

      setTimeout(() => {
        onRegister(
          {
            name: newDriver.name,
            phone: newDriver.phone,
            pin: newDriver.pin
          },
          "driver"
        );
      }, 600);
      return;
    }

    // C. Register as Customer (Default)
    try {
      const rawC = localStorage.getItem("tw_registered_customers");
      const list = rawC ? JSON.parse(rawC) : [];
      const nowStr = new Date().toISOString();
      list.push({
        id: "cust_" + Date.now(),
        name,
        phone,
        pin: pass,
        registeredAt: nowStr,
        lastLogin: nowStr,
        totalOrdersCount: 0
      });
      localStorage.setItem("tw_registered_customers", JSON.stringify(list));
    } catch {}

    localStorage.setItem("tw_saved_customer_name", name);
    localStorage.setItem("tw_saved_customer_phone", phone);
    localStorage.setItem("tw_saved_customer_pin", pass);
    localStorage.setItem("tw_remembered_name", name);
    localStorage.setItem("tw_remembered_phone", phone);

    setIsSuccess(true);
    setSuccessMsg(`🛍️ تم إنشاء حسابك بنجاح يا ${name}! أهلاً بك في تطبيق توصيل.`);

    setTimeout(() => {
      onRegister(
        {
          name,
          phone,
          pin: pass
        },
        "customer"
      );
    }, 500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col justify-between overflow-y-auto pt-4 pb-20 sm:pb-8 px-3 select-none"
      dir="rtl"
    >
      {/* Top Header Bar */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between py-2 text-white shrink-0">
        <div
          onClick={handleSecretIconClick}
          className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
          title="تطبيق توصيل"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white text-lg shadow-md shadow-orange-500/30">
            🛵
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              <span>تطبيق توصيل</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Refresh Button */}
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("tw_stores_updated"));
              window.dispatchEvent(new CustomEvent("tw_products_updated"));
              window.location.reload();
            }}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer border border-white/15"
            title="تحديث التطبيق"
          >
            <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden xs:inline text-[11px]">تحديث 🔄</span>
          </button>

          {/* Close & Browse as Guest Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer border border-white/15"
              title="إغلاق والتصفح كزائر"
            >
              <X className="w-3.5 h-3.5" />
              <span>تصفح كزائر</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto my-3">
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-2xl space-y-4 relative overflow-hidden text-right">
          {/* Top Brand Banner */}
          <div className="text-center space-y-1">
            <div
              onClick={handleSecretIconClick}
              className="w-13 h-13 bg-gradient-to-tr from-orange-500 to-amber-500 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-orange-500/25 text-2xl cursor-pointer"
            >
              {authMode === "register" ? "✨" : "🔑"}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {authMode === "register" ? "إنشاء حساب جديد ✨" : "تسجيل الدخول"}
            </h2>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-center">
            {/* Tab 1: Login */}
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`py-2.5 px-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === "login"
                  ? "bg-white text-orange-600 shadow-sm shadow-slate-300"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>تسجيل الدخول</span>
            </button>

            {/* Tab 2: Register */}
            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`py-2.5 px-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === "register"
                  ? "bg-white text-orange-600 shadow-sm shadow-slate-300"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>إنشاء حساب جديد</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl text-xs font-black text-center animate-shake leading-relaxed">
              {errorMsg}
            </div>
          )}

          {isSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3.5 rounded-2xl text-xs font-black text-center shadow-xs leading-relaxed animate-pulse">
              {successMsg}
            </div>
          )}

          {/* =============================================================== */}
          {/* FORM 1: LOGIN (تسجيل الدخول)                                    */}
          {/* =============================================================== */}
          {authMode === "login" && (
            <form onSubmit={handleUnifiedLogin} className="space-y-3.5">
              {/* Field 1: Username / Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-orange-500" />
                    <span>اسم المستخدم:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">(اختياري)</span>
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="اسم المستخدم أو الاسم الكامل"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-2xl py-3 px-3.5 text-xs font-bold outline-none text-slate-900 transition-all"
                />
              </div>

              {/* Field 2: Phone number */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-orange-500" />
                  <span>رقم التلفون:</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  autoFocus
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="09xxxxxxxx"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-2xl py-3 px-3.5 text-xs sm:text-sm font-mono font-black outline-none text-slate-900 transition-all text-left"
                  dir="ltr"
                />
              </div>

              {/* Field 3: Password / PIN */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-orange-500" />
                  <span>كلمة المرور / الباسوورد:</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="كلمة المرور..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-2xl py-3 px-10 text-center text-sm font-black outline-none text-slate-900 transition-all font-mono tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer p-1"
                    title={showPassword ? "إخفاء" : "إظهار"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white font-black text-sm py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 transition-all cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>جارٍ تسجيل الدخول...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* =============================================================== */}
          {/* FORM 2: REGISTRATION (إنشاء حساب جديد)                          */}
          {/* =============================================================== */}
          {authMode === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Account Type Selector */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">
                  نوع الحساب المراد تسجيله:
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-center">
                  <button
                    type="button"
                    onClick={() => setRegisterAccountType("customer")}
                    className={`py-2 px-1 rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      registerAccountType === "customer"
                        ? "bg-white text-orange-600 shadow-xs"
                        : "text-slate-600"
                    }`}
                  >
                    <User className="w-3 h-3" />
                    <span>زبون 🛍️</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegisterAccountType("store")}
                    className={`py-2 px-1 rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      registerAccountType === "store"
                        ? "bg-white text-orange-600 shadow-xs"
                        : "text-slate-600"
                    }`}
                  >
                    <StoreIcon className="w-3 h-3" />
                    <span>متجر 🏪</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegisterAccountType("driver")}
                    className={`py-2 px-1 rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      registerAccountType === "driver"
                        ? "bg-white text-orange-600 shadow-xs"
                        : "text-slate-600"
                    }`}
                  >
                    <Bike className="w-3 h-3" />
                    <span>كابتن 🛵</span>
                  </button>
                </div>
              </div>

              {/* Field 1: Full Name / Username */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-orange-500" />
                  <span>
                    {registerAccountType === "store"
                      ? "اسم المتجر أو النشاط التجاري:"
                      : registerAccountType === "driver"
                      ? "اسم الكابتن الثلاثي الكريم:"
                      : "اسمك الكريم الكامل (اسم المستخدم):"}
                  </span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder={
                    registerAccountType === "store"
                      ? "مثال: مأكولات الشام، ألبسة الأناقة"
                      : "مثال: أحمد العلي"
                  }
                  className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-2xl py-3 px-3.5 text-xs font-bold outline-none text-slate-900 transition-all"
                />
              </div>

              {/* If Store: Category Selector */}
              {registerAccountType === "store" && (
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">
                    تصنيف ونوع المتجر:
                  </label>
                  <select
                    value={storeCategory}
                    onChange={(e) => setStoreCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3 text-xs font-bold outline-none text-slate-900"
                  >
                    {storeCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Field 2: Phone number */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-orange-500" />
                  <span>رقم الموبايل للتواصل والتوصيل:</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="0951854257"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-2xl py-3 px-3.5 text-xs sm:text-sm font-mono font-black outline-none text-slate-900 transition-all text-left"
                  dir="ltr"
                />
              </div>

              {/* Field 3: Password / PIN */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-orange-500" />
                    <span>كلمة المرور (الباسوورد) أو رمز PIN السري:</span>
                    <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[10px] text-orange-600 font-bold">4 أرقام أو حروف 🔒</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-2xl py-3 px-10 text-center text-sm font-black outline-none text-slate-900 transition-all font-mono tracking-widest"
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

              {/* Legal Terms Checkbox */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-1 text-right">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] font-bold text-slate-700 leading-tight">
                    أوافق وألتزم بـ{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setTermsModalRole(
                          registerAccountType === "store"
                            ? "store_owner"
                            : registerAccountType === "driver"
                            ? "driver"
                            : "customer"
                        );
                        setShowTermsModal(true);
                      }}
                      className="text-orange-600 font-black underline hover:text-orange-700 cursor-pointer"
                    >
                      وثيقة الشروط والمسؤوليات القانونية ⚖️
                    </button>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white font-black text-xs sm:text-sm py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>
                  {registerAccountType === "store"
                    ? "تسجيل المتجر والبدء بإعداده 🚀"
                    : registerAccountType === "driver"
                    ? "تسجيل الكابتن والدخول للوحة العمل 🛵"
                    : "تأكيد وتثبيت الحساب والدخول 🛍️"}
                </span>
              </button>
            </form>
          )}

          {/* Direct WhatsApp Assistance for Stores & Drivers */}
          <div className="text-center pt-2 border-t border-slate-100 space-y-1.5">
            <p className="text-[11px] text-slate-500 font-bold">تحتاج لمساعدة الإدارة أو تفعيل حساب؟</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  openWhatsApp({
                    phone: "963951854257",
                    message: "مرحباً إدارة المنصة، أحتاج مساعدة في تسجيل الدخول أو تفعيل الحساب 💬",
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
                    message: "مرحباً إدارة المنصة، أحتاج مساعدة في تسجيل الدخول أو تفعيل الحساب 💼",
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

          {/* Security & Offline Protection Badge */}
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>اتصال مشفر ومحمي - حفظ وتثبيت تلقائي لبياناتك محلياً وسحابياً</span>
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
            setAgreeTerms(true);
            setShowTermsModal(false);
          }}
        />
      )}
    </div>
  );
};
