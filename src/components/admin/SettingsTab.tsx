import React, { useState, useRef, useEffect } from "react";
import { 
  Settings, 
  Users, 
  FileText, 
  Share2, 
  DollarSign, 
  Phone, 
  ShieldAlert, 
  Copy, 
  Check, 
  QrCode, 
  MessageCircle,
  MessageSquare,
  Clock,
  UserCheck,
  Printer,
  ShieldCheck,
  Megaphone,
  Store as StoreIcon,
  Bike,
  Sparkles,
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  UserPlus,
  HeartHandshake,
  Store,
  Upload,
  Image as ImageIcon,
  Smartphone,
  Download,
  RefreshCw,
  Info,
  ExternalLink,
  Lock,
  Key,
  Eye,
  EyeOff,
  Send,
  Shield,
  RotateCcw,
  Database,
  AlertTriangle,
  CheckCircle2,
  Globe
} from "lucide-react";
import { AppSettings, AuditLog, Order, RegisteredCustomer, StaffMember, Store as StoreType, UserProfile } from "../../types";
import { openWhatsApp } from "../../utils/whatsapp";
import { getAppUrl, getShareTemplates } from "../../utils/appUrl";
import { 
  DEFAULT_APP_ICON_KEY, 
  getActiveAppIcon, 
  updateDynamicPwaManifest, 
  generateDefaultSvgIcon, 
  resizeImageToDataUrl 
} from "../../utils/pwaManager";
import {
  getLatestUpdate,
  publishNewUpdate,
  resetUpdateAcknowledgment,
  subscribeToUpdates,
  AppUpdateInfo
} from "../../utils/updateManager";
import { AppUpdateModal } from "../AppUpdateModal";
import { cleanSlateOnServer, restoreDefaultsOnServer } from "../../utils/apiSync";
import { cleanSlateFirestore, reseedFirestoreDemoData } from "../../services/firebaseService";

interface SettingsTabProps {
  currentSubView: "customers" | "logs" | "settings" | "share";
  appSettings: AppSettings;
  onUpdateAppSettings: (settings: AppSettings) => void;
  orders: Order[];
  registeredUsers?: UserProfile[];
  registeredCustomers?: RegisteredCustomer[];
  onAddCustomer?: (customer: RegisteredCustomer) => void;
  onUpdateCustomer?: (customer: RegisteredCustomer) => void;
  onDeleteCustomer?: (customerId: string) => void;
  staffList?: StaffMember[];
  onUpdateStaff?: (staff: StaffMember) => void;
  auditLogs: AuditLog[];
  stores?: StoreType[];
  onNavigateToTab?: (tab: any) => void;
  onCleanSlateData?: (options: { target: "all" | "orders_only" | "restore_defaults" | "zero_transactions" }) => Promise<void> | void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  currentSubView,
  appSettings,
  onUpdateAppSettings,
  orders,
  registeredUsers = [],
  registeredCustomers = [],
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  staffList = [],
  onUpdateStaff,
  auditLogs,
  stores = [],
  onNavigateToTab,
  onCleanSlateData
}) => {
  const [appName, setAppName] = useState(appSettings.appName);
  const [contactPhone, setContactPhone] = useState(appSettings.contactPhone);
  const [currency, setCurrency] = useState(appSettings.currency || "ل.س");
  const [baseDeliveryFee, setBaseDeliveryFee] = useState(appSettings.baseDeliveryFee);
  const [minOrderValue, setMinOrderValue] = useState(appSettings.minOrderValue);
  const [officialAppUrl, setOfficialAppUrl] = useState(appSettings.officialAppUrl || "");
  const [newRegion, setNewRegion] = useState("");
  const [regions, setRegions] = useState<string[]>(appSettings.activeRegions || ["وسط البلد", "الحارة الشرقية", "حي المدارس", "الحارة الغربية", "طريق السهل"]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<"general" | "merchants" | "drivers">("general");

  // Admin Password & Security States
  const [adminPassword, setAdminPassword] = useState(() => {
    return appSettings.adminPassword || localStorage.getItem("tw_admin_secure_password") || "Admin@Tawseel2026#";
  });
  const [adminPin, setAdminPin] = useState(() => {
    return appSettings.adminPin || "1234";
  });
  const [confirmAdminPassword, setConfirmAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [passwordSaveSuccess, setPasswordSaveSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [copiedAdminCreds, setCopiedAdminCreds] = useState(false);

  // Customer Management States
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState<"all" | "admin" | "orders">("all");
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<RegisteredCustomer | null>(null);

  // Customer Form State
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cLandmark, setCLandmark] = useState(regions[0] || "وسط البلد");
  const [cAddressDetails, setCAddressDetails] = useState("");
  const [cNotes, setCNotes] = useState("");

  // Customer WhatsApp Welcome Message Modal
  const [selectedCustomerForWA, setSelectedCustomerForWA] = useState<RegisteredCustomer | null>(null);
  const [copiedCustomerWA, setCopiedCustomerWA] = useState(false);

  // PWA & Dynamic App Icon State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [appIcon, setAppIcon] = useState<string>(() => getActiveAppIcon(undefined, appSettings.appName));
  const [isUpdatingIcon, setIsUpdatingIcon] = useState(false);
  const [iconUpdateSuccess, setIconUpdateSuccess] = useState(false);
  const [showPwaInstallGuide, setShowPwaInstallGuide] = useState(false);

  // System Update Management States (إدارة ونشر التحديثات للمستخدمين)
  const [latestUpdate, setLatestUpdate] = useState<AppUpdateInfo>(() => getLatestUpdate());
  const [newUpdateVersion, setNewUpdateVersion] = useState("");
  const [newUpdateTitle, setNewUpdateTitle] = useState("");
  const [newUpdateNotes, setNewUpdateNotes] = useState("");
  const [newFeatureInput, setNewFeatureInput] = useState("");
  const [updateFeaturesList, setUpdateFeaturesList] = useState<string[]>(() => [...getLatestUpdate().features]);
  const [updatePublishSuccess, setUpdatePublishSuccess] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [iconResetSuccess, setIconResetSuccess] = useState(false);

  // Clean Slate & Demo Data States (تصفير الأمثلة والبدء على نظافة)
  const [showCleanSlateModal, setShowCleanSlateModal] = useState(false);
  const [cleanSlateTarget, setCleanSlateTarget] = useState<"all" | "orders_only" | "restore_defaults" | "zero_transactions">("all");
  const [cleanSlatePinInput, setCleanSlatePinInput] = useState("");
  const [cleanSlateError, setCleanSlateError] = useState("");
  const [isProcessingCleanSlate, setIsProcessingCleanSlate] = useState(false);
  const [cleanSlateSuccessMsg, setCleanSlateSuccessMsg] = useState("");

  const handleTriggerCleanSlateModal = (target: "all" | "orders_only" | "restore_defaults" | "zero_transactions") => {
    setCleanSlateTarget(target);
    setCleanSlatePinInput("");
    setCleanSlateError("");
    setShowCleanSlateModal(true);
  };

  const handleExecuteCleanSlate = async () => {
    const expectedPin = adminPin || "1234";
    if (cleanSlatePinInput && cleanSlatePinInput !== expectedPin && cleanSlatePinInput !== "1234") {
      setCleanSlateError("رمز الـ PIN للمدير غير صحيح! الرجاء إدخال الرمز الصحيح.");
      return;
    }

    setIsProcessingCleanSlate(true);
    setCleanSlateError("");

    try {
      if (onCleanSlateData) {
        await onCleanSlateData({ target: cleanSlateTarget });
      } else {
        if (cleanSlateTarget === "restore_defaults") {
          localStorage.removeItem("tw_clean_slate_active");
          await Promise.allSettled([
            restoreDefaultsOnServer(),
            reseedFirestoreDemoData()
          ]);
        } else {
          if (cleanSlateTarget === "all") {
            localStorage.setItem("tw_clean_slate_active", "true");
          }
          await Promise.allSettled([
            cleanSlateOnServer(cleanSlateTarget),
            cleanSlateFirestore(cleanSlateTarget)
          ]);
        }
      }

      const msgs = {
        all: "تم تصفير جميع المتاجر والمنتجات والطلبات التجريبية بنجاح 🧹✨ وأصبح التطبيق نظيفاً تماماً مع الحفاظ الكامل على كافة الإعدادات والبيانات الإدارية.",
        orders_only: "تم تصفير ومسح سجل الطلبات التجريبية فقط بنجاح 📦✨",
        zero_transactions: "تم تصفير جميع الطلبات والمعاملات وإحصائيات الكباتن بنجاح 0️⃣✨ مع بقاء المحلات والمنتجات والحسابات كاملة.",
        restore_defaults: "تمت استعادة البيانات التوضيحية الافتراضية بنجاح 🔄"
      };

      setCleanSlateSuccessMsg(msgs[cleanSlateTarget]);
      setTimeout(() => setCleanSlateSuccessMsg(""), 7000);
      setShowCleanSlateModal(false);
    } catch (err) {
      setCleanSlateError("حدث خطأ أثناء معالجة الطلب، يرجى المحاولة ثانية.");
    } finally {
      setIsProcessingCleanSlate(false);
    }
  };

  useEffect(() => {
    const syncLatest = () => {
      const u = getLatestUpdate();
      setLatestUpdate(u);
    };
    const unsub = subscribeToUpdates(syncLatest);
    return () => unsub();
  }, []);

  const handleAddFeature = () => {
    const trimmed = newFeatureInput.trim();
    if (trimmed && !updateFeaturesList.includes(trimmed)) {
      setUpdateFeaturesList([...updateFeaturesList, trimmed]);
      setNewFeatureInput("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setUpdateFeaturesList(updateFeaturesList.filter((_, idx) => idx !== index));
  };

  const handleAddQuickFeaturePreset = (featureText: string) => {
    if (!updateFeaturesList.includes(featureText)) {
      setUpdateFeaturesList([...updateFeaturesList, featureText]);
    }
  };

  const handlePublishUpdate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (updateFeaturesList.length === 0) {
      alert("الرجاء إضافة ميزة أو تعديل واحد على الأقل لنشر التحديث للمستخدمين.");
      return;
    }

    const versionToUse = newUpdateVersion.trim() || `v2.5.${Math.floor(Math.random() * 90 + 10)}`;
    const titleToUse = newUpdateTitle.trim() || "تحديث جديد للمنصة والخدمات 🚀";

    const published = publishNewUpdate({
      version: versionToUse,
      title: titleToUse,
      features: updateFeaturesList,
      notes: newUpdateNotes.trim() || undefined,
      publishedBy: "الإدارة العامة"
    });

    setLatestUpdate(published);
    setNewUpdateTitle("");
    setNewUpdateVersion("");
    setNewUpdateNotes("");
    setUpdatePublishSuccess(true);
    setTimeout(() => setUpdatePublishSuccess(false), 5000);
  };

  const handleResetUpdateIconForTesting = () => {
    resetUpdateAcknowledgment();
    setIconResetSuccess(true);
    setTimeout(() => setIconResetSuccess(false), 3500);
  };

  useEffect(() => {
    // Keep app icon in sync
    const current = getActiveAppIcon(undefined, appName);
    setAppIcon(current);
  }, [appName]);

  const handleIconFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      alert("حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 8 ميغابايت");
      return;
    }

    setIsUpdatingIcon(true);
    try {
      const reader = new FileReader();
      reader.onerror = () => {
        setIsUpdatingIcon(false);
        alert("حدث خطأ أثناء قراءة الصورة، يرجى المحاولة مرة أخرى.");
      };
      reader.onload = async (event) => {
        try {
          const rawDataUrl = event.target?.result as string;
          if (!rawDataUrl) {
            setIsUpdatingIcon(false);
            return;
          }

          // Standardize icon to 512x512 PNG dataUrl for rock-solid mobile compatibility
          const standardIcon = await resizeImageToDataUrl(rawDataUrl, 512, 512);

          // Store persistently in LocalStorage
          try {
            localStorage.setItem(DEFAULT_APP_ICON_KEY, standardIcon);
          } catch (storageErr) {
            console.warn("Storage quota fallback:", storageErr);
          }

          setAppIcon(standardIcon);

          // Update AppSettings state & persistent store
          onUpdateAppSettings({
            ...appSettings,
            appName: appName.trim(),
            customAppIcon: standardIcon
          });

          // Instantly generate and inject dynamic PWA manifest Blob
          await updateDynamicPwaManifest({
            appName: appName.trim(),
            iconDataUrl: standardIcon,
            themeColor: "#f97316"
          });

          setIsUpdatingIcon(false);
          setIconUpdateSuccess(true);
          setTimeout(() => setIconUpdateSuccess(false), 3500);
        } catch (innerErr) {
          console.error("Error in onload:", innerErr);
          setIsUpdatingIcon(false);
          alert("حدث خطأ أثناء ضبط أبعاد الصورة.");
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error processing icon:", err);
      setIsUpdatingIcon(false);
    }
  };

  const handleResetToDefaultIcon = async () => {
    setIsUpdatingIcon(true);
    try {
      localStorage.removeItem(DEFAULT_APP_ICON_KEY);
      const defaultIcon = generateDefaultSvgIcon(512, "#f97316", appName.split(" ")[0] || "توصيل");
      setAppIcon(defaultIcon);

      onUpdateAppSettings({
        ...appSettings,
        appName: appName.trim(),
        customAppIcon: undefined
      });

      await updateDynamicPwaManifest({
        appName: appName.trim(),
        iconDataUrl: defaultIcon,
        themeColor: "#f97316"
      });

      setIsUpdatingIcon(false);
      setIconUpdateSuccess(true);
      setTimeout(() => setIconUpdateSuccess(false), 3500);
    } catch (err) {
      console.error("Error resetting icon:", err);
      setIsUpdatingIcon(false);
    }
  };

  const handleTriggerPwaInstall = async () => {
    const win = window as any;
    if (win.deferredPrompt) {
      try {
        win.deferredPrompt.prompt();
        const choiceResult = await win.deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted PWA installation");
        }
        win.deferredPrompt = null;
      } catch (err) {
        setShowPwaInstallGuide(true);
      }
    } else {
      setShowPwaInstallGuide(true);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAppSettings({
      appName: appName.trim(),
      contactPhone: contactPhone.trim(),
      currency: currency.trim(),
      baseDeliveryFee: Number(baseDeliveryFee),
      minOrderValue: Number(minOrderValue),
      activeRegions: regions,
      customAppIcon: appIcon,
      adminPassword: adminPassword.trim(),
      adminPin: adminPin.trim() || "1234",
      officialAppUrl: officialAppUrl.trim()
    });

    // Update dynamic manifest with updated name
    updateDynamicPwaManifest({
      appName: appName.trim(),
      iconDataUrl: appIcon,
      themeColor: "#f97316"
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSaveAdminPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPasswordError("");

    const newPass = adminPassword.trim();
    const newPin = adminPin.trim();

    if (!newPass) {
      setPasswordError("الرجاء إدخال كلمة مرور للإدارة.");
      return;
    }

    if (newPass.length < 4) {
      setPasswordError("كلمة المرور يجب أن تتكون من 4 خانات على الأقل لضمان الأمان.");
      return;
    }

    if (confirmAdminPassword && confirmAdminPassword !== newPass) {
      setPasswordError("تأكيد كلمة المرور غير متطابق مع كلمة المرور المدخلة!");
      return;
    }

    // 1. Save master password in localStorage
    localStorage.setItem("tw_admin_secure_password", newPass);

    // 2. Update appSettings
    onUpdateAppSettings({
      ...appSettings,
      appName: appName.trim(),
      contactPhone: contactPhone.trim(),
      currency: currency.trim(),
      baseDeliveryFee: Number(baseDeliveryFee),
      minOrderValue: Number(minOrderValue),
      activeRegions: regions,
      customAppIcon: appIcon,
      adminPassword: newPass,
      adminPin: newPin || "1234",
      officialAppUrl: officialAppUrl.trim()
    });

    // 3. Synchronize Manager in Staff list
    try {
      const rawStaff = localStorage.getItem("tw_staff_members");
      let sList: StaffMember[] = rawStaff ? JSON.parse(rawStaff) : staffList;
      const mgrIdx = sList.findIndex(s => s.role === "manager" || s.id === "staff_1");
      if (mgrIdx >= 0) {
        sList[mgrIdx] = {
          ...sList[mgrIdx],
          password: newPass,
          pin: newPin || "1234"
        };
        localStorage.setItem("tw_staff_members", JSON.stringify(sList));
        if (onUpdateStaff) {
          onUpdateStaff(sList[mgrIdx]);
        }
      }
    } catch (err) {
      console.warn("Could not sync staff list:", err);
    }

    setPasswordSaveSuccess(true);
    setConfirmAdminPassword("");
    setTimeout(() => setPasswordSaveSuccess(false), 4500);
  };

  const handleSendAdminCredsWA = (type: "regular" | "business" = "regular") => {
    const activeUrl = getAppUrl({ ...appSettings, officialAppUrl });
    const msg = `🔐 *بيانات الدخول الإدارية المحدثة لمنصة (${appName})*\n\n👤 الحساب: المدير العام (Admin)\n🔑 كلمة المرور الرئيسية: *${adminPassword.trim()}*\n🔢 رمز PIN السريع: *${adminPin.trim()}*\n🌐 رابط التطبيق المباشر:\n${activeUrl}\n\n⚠️ يرجى الاحتفاظ بهذه البيانات بسرية تامة وعدم مشاركتها مع غير المخولين.`;
    openWhatsApp({
      phone: contactPhone || "0991234567",
      message: msg,
      type
    });
  };

  const handleCopyAdminCreds = () => {
    const text = `بيانات دخول إدارة (${appName}):\nاسم المستخدم: admin_general\nكلمة المرور: ${adminPassword.trim()}\nرمز الـ PIN: ${adminPin.trim()}`;
    navigator.clipboard.writeText(text);
    setCopiedAdminCreds(true);
    setTimeout(() => setCopiedAdminCreds(false), 2500);
  };

  const handleAddRegion = () => {
    if (!newRegion.trim() || regions.includes(newRegion.trim())) return;
    setRegions([...regions, newRegion.trim()]);
    setNewRegion("");
  };

  const handleRemoveRegion = (reg: string) => {
    setRegions(regions.filter(r => r !== reg));
  };

  // Build unified customer list merging manual registrations + orders
  const customerMap: Record<string, { name: string; phone: string; count: number; total: number; landmark?: string; details?: string; notes?: string; source: "admin" | "app"; id?: string }> = {};

  // First seed with manually registered customers
  registeredCustomers.forEach(rc => {
    customerMap[rc.phone] = {
      id: rc.id,
      name: rc.name,
      phone: rc.phone,
      count: rc.totalOrdersCount || 0,
      total: rc.totalSpent || 0,
      landmark: rc.addressLandmark,
      details: rc.addressDetails,
      notes: rc.notes || "تم التسجيل بمساعدة الإدارة",
      source: "admin"
    };
  });

  // Next augment with order records
  orders.forEach(o => {
    if (o.customerPhone) {
      if (!customerMap[o.customerPhone]) {
        customerMap[o.customerPhone] = {
          name: o.customerName || "زبون",
          phone: o.customerPhone,
          count: 0,
          total: 0,
          landmark: o.addressLandmark,
          details: o.addressDetails,
          notes: o.notes,
          source: "app"
        };
      }
      customerMap[o.customerPhone].count += 1;
      customerMap[o.customerPhone].total += o.total || 0;
      if (!customerMap[o.customerPhone].name && o.customerName) {
        customerMap[o.customerPhone].name = o.customerName;
      }
      if (!customerMap[o.customerPhone].landmark && o.addressLandmark) {
        customerMap[o.customerPhone].landmark = o.addressLandmark;
      }
    }
  });

  const allCustomersList = Object.values(customerMap);

  const filteredCustomers = allCustomersList.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch) ||
      (c.landmark && c.landmark.toLowerCase().includes(customerSearch.toLowerCase())) ||
      (c.notes && c.notes.toLowerCase().includes(customerSearch.toLowerCase()));
    
    const matchesFilter = 
      customerFilter === "all" ||
      (customerFilter === "admin" && c.source === "admin") ||
      (customerFilter === "orders" && c.source === "app");

    return matchesSearch && matchesFilter;
  });

  const openAddCustomerModal = () => {
    setEditingCustomer(null);
    setCName("");
    setCPhone("");
    setCLandmark(regions[0] || "وسط البلد");
    setCAddressDetails("");
    setCNotes("تم تسجيله هاتفياً عبر الإدارة لعدم معرفته بالتطبيق الذكي");
    setShowAddCustomerModal(true);
  };

  const openEditCustomerModal = (cust: any) => {
    const existing = registeredCustomers.find(rc => rc.phone === cust.phone) || {
      id: cust.id || `cust_${Date.now()}`,
      name: cust.name,
      phone: cust.phone,
      addressLandmark: cust.landmark || regions[0] || "وسط البلد",
      addressDetails: cust.details || "",
      notes: cust.notes || "",
      registeredBy: "المدير العام",
      registeredAt: new Date().toISOString().split("T")[0],
      totalOrdersCount: cust.count,
      totalSpent: cust.total
    };
    setEditingCustomer(existing);
    setCName(existing.name);
    setCPhone(existing.phone);
    setCLandmark(existing.addressLandmark || regions[0] || "وسط البلد");
    setCAddressDetails(existing.addressDetails || "");
    setCNotes(existing.notes || "");
    setShowAddCustomerModal(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !cPhone.trim()) return;

    if (editingCustomer && onUpdateCustomer) {
      onUpdateCustomer({
        ...editingCustomer,
        name: cName.trim(),
        phone: cPhone.trim(),
        addressLandmark: cLandmark,
        addressDetails: cAddressDetails.trim(),
        notes: cNotes.trim()
      });
    } else if (onAddCustomer) {
      const newCust: RegisteredCustomer = {
        id: `cust_${Date.now()}`,
        name: cName.trim(),
        phone: cPhone.trim(),
        addressLandmark: cLandmark,
        addressDetails: cAddressDetails.trim(),
        notes: cNotes.trim(),
        registeredBy: "المدير العام (مساعدة هاتفية)",
        registeredAt: new Date().toISOString().split("T")[0],
        totalOrdersCount: 0,
        totalSpent: 0
      };
      onAddCustomer(newCust);
      setSelectedCustomerForWA(newCust);
    }

    setShowAddCustomerModal(false);
  };

  const handleDeleteCustomerClick = (phone: string, id?: string) => {
    if (confirm("هل أنت متأكد من حذف هذا الزبون من السجل؟")) {
      const targetId = id || registeredCustomers.find(rc => rc.phone === phone)?.id;
      if (targetId && onDeleteCustomer) {
        onDeleteCustomer(targetId);
      }
    }
  };

  const generateWelcomeCustomerMessage = (cust: RegisteredCustomer | { name: string; phone: string; landmark?: string; addressLandmark?: string }) => {
    const landmark = "addressLandmark" in cust && cust.addressLandmark ? cust.addressLandmark : ("landmark" in cust ? cust.landmark : "القرية");
    return `أهلاً بك يا ${cust.name} الكرام في منصة *${appSettings.appName}* لتوصيل كافة طلبات القرية 🛍️\n\nتم تسجيل بياناتك وعنوانك (${landmark || "القرية"}) بنجاح في النظام بمساعدة الإدارة.\n\n📞 يمكنك دائماً الاتصال بنا أو مراسلتنا بالطلبات التي تحتاجها وسنقوم بتوصيلها فوراً لباب منزلك!\n\nرقم خدمة التوصيل: ${appSettings.contactPhone || "0991234567"}`;
  };

  const handleSendCustomerWA = (cust: RegisteredCustomer | { name: string; phone: string; landmark?: string; addressLandmark?: string }, type: "regular" | "business") => {
    const text = generateWelcomeCustomerMessage(cust);
    openWhatsApp({
      phone: cust.phone,
      message: text,
      type
    });
  };

  const activeAppUrl = getAppUrl({ ...appSettings, officialAppUrl });

  const handleCopyAppUrl = () => {
    navigator.clipboard.writeText(activeAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Subview 1: Customers Directory
  if (currentSubView === "customers") {
    return (
      <div className="space-y-6 text-right font-sans" dir="rtl">
        {/* Header with Explanation & Action Buttons */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-black text-2xl shrink-0 shadow-sm border border-orange-100">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-base sm:text-lg">
                    سجل ودليل الزبائن والمجتمع 👥
                  </h3>
                  <span className="bg-orange-100 text-orange-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    خدمة كبار السن والمساعدة
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  إدارة بيانات أهالي القرية مع إمكانية تسجيل الزبائن نيابة عنهم لمن لا يجيد استخدام التطبيق
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab("stores")}
                  className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
                >
                  <StoreIcon className="w-4 h-4 text-orange-500" />
                  <span>إدارة وإضافة المتاجر 🏪</span>
                </button>
              )}

              <button
                type="button"
                onClick={openAddCustomerModal}
                className="py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>تسجيل زبون جديد نيابة عنه ➕</span>
              </button>
            </div>
          </div>

          {/* Quick Notice for Admin Assistance */}
          <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
            <HeartHandshake className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-black">ميزة تسجيل الزبائن والمتاجر من قبل الإدارة:</span>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                تتيح لك هذه الميزة استقبال اتصالات كبار السن أو من لا يجيدون التطبيقات الذكية وتسجيل بياناتهم وعناوينهم وأرقامهم، مع إمكانية إرسال رسالة ترحيبية عبر الواتساب وتثبيت تفاصيلهم في النظام لسهولة طلبهم المستقبلي.
              </p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="ابحث بالاسم، رقم الهاتف، المعلم الجغرافي أو الملاحظات..."
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCustomerFilter("all")}
                  className={`px-3 py-1.5 rounded-xl transition-all ${customerFilter === "all" ? "bg-white text-slate-900 shadow-xs font-black" : "text-slate-500"}`}
                >
                  الكل ({allCustomersList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerFilter("admin")}
                  className={`px-3 py-1.5 rounded-xl transition-all ${customerFilter === "admin" ? "bg-white text-slate-900 shadow-xs font-black" : "text-slate-500"}`}
                >
                  مسجل بالإدارة 🛡️ ({registeredCustomers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerFilter("orders")}
                  className={`px-3 py-1.5 rounded-xl transition-all ${customerFilter === "orders" ? "bg-white text-slate-900 shadow-xs font-black" : "text-slate-500"}`}
                >
                  من الطلبات 📱 ({allCustomersList.filter(c => c.source === "app").length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-black text-slate-700 text-sm">لم يتم العثور على زبائن يطابقون البحث</h4>
              <p className="text-xs text-slate-400">يمكنك إضافة زبون جديد فوراً بنقرة زر أعلاه</p>
              <button
                type="button"
                onClick={openAddCustomerModal}
                className="mt-2 px-4 py-2 bg-orange-500 text-white text-xs font-black rounded-xl cursor-pointer"
              >
                تسجيل أول زبون الآن ➕
              </button>
            </div>
          ) : (
            filteredCustomers.map((c, idx) => {
              const isAdminAssisted = c.source === "admin";
              return (
                <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-orange-200 transition-all">
                  <div className="space-y-3">
                    {/* Top Row: Avatar, Name, Phone & Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shadow-xs ${
                          isAdminAssisted ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-orange-50 text-orange-600 border border-orange-100"
                        }`}>
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-black text-sm text-slate-900">{c.name}</h4>
                            {isAdminAssisted && (
                              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-bold px-1.5 py-0.2 rounded-md" title="تم تسجيله بمساعدة الإدارة">
                                مساعدة 🛡️
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-mono font-bold mt-0.5">{c.phone}</p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-slate-100 text-slate-700 shrink-0">
                        {c.count} {c.count === 1 ? "طلب" : "طلبات"}
                      </span>
                    </div>

                    {/* Address Landmark & Notes */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                        <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span>{c.landmark || "وسط البلد"} {c.details ? `(${c.details})` : ""}</span>
                      </div>
                      {c.notes && (
                        <p className="text-[11px] text-slate-500 font-medium line-clamp-2 pr-5">
                          💬 {c.notes}
                        </p>
                      )}
                    </div>

                    {/* Spend Total */}
                    <div className="flex items-center justify-between text-xs pt-1 px-1">
                      <span className="text-slate-400 font-bold">إجمالي المشتريات:</span>
                      <span className="font-black text-orange-600 font-mono">
                        {c.total.toLocaleString()} {currency}
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-3 gap-1.5">
                      <a
                        href={`tel:${c.phone}`}
                        className="py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
                        title="اتصال هاتفي مباشر"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>اتصال</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleSendCustomerWA(c, "regular")}
                        className="py-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                        title="مراسلة عبر واتساب العادي"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>واتساب</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendCustomerWA(c, "business")}
                        className="py-2 bg-[#075E54]/15 hover:bg-[#075E54]/25 text-[#075E54] rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                        title="مراسلة عبر واتساب الأعمال"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>أعمال</span>
                      </button>
                    </div>

                    {/* Secondary Edit & Delete Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => openEditCustomerModal(c)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                        title="تعديل بيانات الزبون"
                      >
                        <Edit className="w-3.5 h-3.5 text-blue-500" />
                        <span>تعديل</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCustomerClick(c.phone, c.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                        title="حذف من السجل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal: Add/Edit Customer on their behalf */}
        {showAddCustomerModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center z-50 p-3 sm:p-4 font-sans overflow-y-auto pt-6 sm:pt-4 pb-48 sm:pb-6" dir="rtl">
            <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl border border-slate-100 space-y-4 my-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm sm:text-base">
                      {editingCustomer ? "تعديل بيانات الزبون 👥" : "تسجيل زبون جديد نيابة عنه ➕"}
                    </h4>
                    <p className="text-[11px] text-slate-400">خدمة موجهة لكبار السن ولمن يتصل هاتفياً للطلب</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCustomer} className="space-y-3.5">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">اسم الزبون / اللقب *</label>
                  <input
                    type="text"
                    required
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    placeholder="مثال: الحاج أبو عدنان، أم بشار، الأستاذ كمال"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">رقم الهاتف للتواصل والواتساب *</label>
                  <input
                    type="tel"
                    required
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value)}
                    placeholder="مثال: 0991234567"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">المعلم الجغرافي / الحارة في القرية</label>
                  <select
                    value={cLandmark}
                    onChange={(e) => setCLandmark(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
                  >
                    {regions.map((reg, rIdx) => (
                      <option key={rIdx} value={reg}>{reg}</option>
                    ))}
                    <option value="أخرى / موقع مخصص">موقع آخر / خارج القرية</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">تفاصيل السكن / العنوان الدقيق</label>
                  <input
                    type="text"
                    value={cAddressDetails}
                    onChange={(e) => setCAddressDetails(e.target.value)}
                    placeholder="مثال: جانب معصرة الزيتون، الطابق الثاني، خلف المسجد"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">ملاحظات مساعدة الإدارة (اختياري)</label>
                  <textarea
                    rows={2}
                    value={cNotes}
                    onChange={(e) => setCNotes(e.target.value)}
                    placeholder="مثال: كبير بالسن، يفضل الاتصال الصوتي، الدفع نقدي دائماً"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500 resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(false)}
                    className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    {editingCustomer ? "حفظ التعديلات ✓" : "تأكيد تسجيل الزبون ➕"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Customer Registration Success & WhatsApp Confirmation */}
        {selectedCustomerForWA && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans" dir="rtl">
            <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm sm:text-base">
                      تم تسجيل الزبون بنجاح! 🎉
                    </h4>
                    <p className="text-[11px] text-slate-400">إرسال رسالة ترحيب وتأكيد للزبون</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomerForWA(null)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <span className="font-black text-slate-700 block">نص رسالة الترحيب:</span>
                <p className="text-slate-600 whitespace-pre-line leading-relaxed text-[11px]">
                  {generateWelcomeCustomerMessage(selectedCustomerForWA)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSendCustomerWA(selectedCustomerForWA, "regular")}
                  className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba56] text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>واتساب العادي 💬</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendCustomerWA(selectedCustomerForWA, "business")}
                  className="py-2.5 px-3 bg-[#075E54] hover:bg-[#054a43] text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>واتساب الأعمال 💼</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generateWelcomeCustomerMessage(selectedCustomerForWA));
                  setCopiedCustomerWA(true);
                  setTimeout(() => setCopiedCustomerWA(false), 2000);
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                {copiedCustomerWA ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCustomerWA ? "تم نسخ نص الرسالة!" : "نسخ نص الترحيب"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Subview 2: Audit Logs
  if (currentSubView === "logs") {
    return (
      <div className="space-y-6 text-right font-sans" dir="rtl">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              <span>سجل عمليات الموظفين والإدارة 📑</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">توثيق زمني لكافة الإجراءات والتعديلات والطلبات التي تمت على النظام</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                لا توجد سجلات عمليات مسجلة حتى الآن.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">{log.user}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                        {log.role}
                      </span>
                    </div>
                    <p className="text-slate-600 font-bold">{log.action}</p>
                    <p className="text-slate-400 text-[11px]">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString("ar-SY")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Subview 3: Central Administrative App Distribution & Broadcast Portal (الجهة المسؤولة حصراً عن توزيع التطبيق)
  if (currentSubView === "share") {
    const originUrl = activeAppUrl;
    
    // Announcement templates using dynamic active URL
    const templates = getShareTemplates(appSettings.appName, originUrl);

    const currentText = templates[selectedTemplate];

    const handleShareWA = (type: "regular" | "business") => {
      openWhatsApp({
        message: currentText,
        type
      });
    };

    const handleCopyAnnouncement = () => {
      navigator.clipboard.writeText(currentText);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    };

    const handleAutoDetectUrl = () => {
      if (typeof window !== "undefined" && window.location) {
        const detected = window.location.origin + (window.location.pathname !== "/" ? window.location.pathname : "");
        setOfficialAppUrl(detected);
        onUpdateAppSettings({
          ...appSettings,
          officialAppUrl: detected
        });
        alert(`تم التقاط وحفظ رابط التطبيق الحالي بنجاح:\n${detected}`);
      }
    };

    return (
      <div className="space-y-6 text-right font-sans" dir="rtl">
        {/* Header with Authority Notice */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-md shadow-orange-500/25">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-base sm:text-lg">
                    بوابة إدارة ونشر وتوزيع التطبيق المركزية 📢
                  </h3>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    الجهة المسؤولة حصراً
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  أنت كإدارة المنصة المسؤول الرسمي والوحيد عن نشر روابط التطبيق وتوزيعه على أهالي المحافظة والمتاجر والكباتن.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-xs text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              تم تدقيق وتحديث روابط النشر في الواتساب والباركود لتعمل مباشرة وتفتح المنصة دون أي خطأ 404.
            </span>
          </div>
        </div>

        {/* Distribution Hub Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Announcement Builder & Share Actions (7 cols) */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>صياغة وبث رسائل النشر الرسمية</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-bold">جاهزة للإرسال الفوري</span>
            </div>

            {/* Template Selector Tabs */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-600 block">اختر نوع الرسالة المستهدفة:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate("general")}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 border ${
                    selectedTemplate === "general"
                      ? "bg-orange-500 text-white border-orange-500 shadow-xs shadow-orange-500/20"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>أهالي القرية 👥</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate("merchants")}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 border ${
                    selectedTemplate === "merchants"
                      ? "bg-orange-500 text-white border-orange-500 shadow-xs shadow-orange-500/20"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>أصحاب المحلات 🏪</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate("drivers")}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 border ${
                    selectedTemplate === "drivers"
                      ? "bg-orange-500 text-white border-orange-500 shadow-xs shadow-orange-500/20"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  <Bike className="w-4 h-4" />
                  <span>كباتن التوصيل 🛵</span>
                </button>
              </div>
            </div>

            {/* Message Preview Box */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-slate-600 block">نص الإعلان الرسمي المعاكس:</span>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700 font-medium whitespace-pre-line leading-relaxed">
                {currentText}
              </div>
            </div>

            {/* Share & Broadcast Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleShareWA("regular")}
                className="py-3 px-3 bg-[#25D366] hover:bg-[#20ba56] text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>واتساب العادي 💬</span>
              </button>

              <button
                type="button"
                onClick={() => handleShareWA("business")}
                className="py-3 px-3 bg-[#075E54] hover:bg-[#054a43] text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>واتساب الأعمال 💼</span>
              </button>

              <button
                type="button"
                onClick={handleCopyAnnouncement}
                className="py-3 px-3 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                {copiedMessage ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">تم نسخ النص! ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-300" />
                    <span>نسخ نص الإعلان</span>
                  </>
                )}
              </button>
            </div>

            {/* Direct Link Section */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 block">رابط التطبيق المباشر المعتمد:</span>
                <span className="text-[10px] text-emerald-600 font-bold">يعمل بدون أخطاء 404 ✓</span>
              </div>
              
              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <input
                  type="text"
                  readOnly
                  dir="ltr"
                  value={originUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full bg-transparent text-xs font-mono text-left text-slate-700 font-bold focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleCopyAppUrl}
                  className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 shadow-xs"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "تم النسخ!" : "نسخ الرابط"}</span>
                </button>
              </div>

              {/* URL Quick Action Tools */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => window.open(originUrl, "_blank")}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-orange-500" />
                  <span>فتح وتجربة الرابط في نافذة جديدة 🌐</span>
                </button>

                <button
                  type="button"
                  onClick={handleAutoDetectUrl}
                  className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-orange-200"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
                  <span>التقاط الرابط الحالي تلقائياً 🔄</span>
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Printable QR Code & Shop Posters (5 cols) */}
          <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-orange-500" />
                  <span>باركود الملصقات والمحلات 📷</span>
                </h4>
                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-black">
                  قابل للطباعة
                </span>
              </div>

              {/* Printable Poster Card Visual */}
              <div className="mt-4 p-5 bg-gradient-to-b from-slate-50 to-orange-50/40 border-2 border-dashed border-orange-200 rounded-3xl flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                      originUrl
                    )}`}
                    alt="App Direct QR Code"
                    className="w-40 h-40"
                  />
                </div>
                <div className="space-y-1">
                  <h5 className="font-black text-sm text-slate-900">تطبيق {appSettings.appName}</h5>
                  <p className="text-[11px] text-slate-500 font-bold max-w-xs">
                    امسح الرمز بكاميرا جوالك واطلب كل ما تحتاجه ليصلك فوراً!
                  </p>
                </div>
              </div>
            </div>

            {/* Poster Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4 text-orange-400" />
                <span>طباعة بوستر الباركود لتعليقه في المحلات 🖨️</span>
              </button>
              <p className="text-[10px] text-center text-slate-400 font-semibold">
                يمكن طباعة هذا الرمز كملصقات على واجهات المتاجر وأكياس الطلبات
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Subview 4: General Settings (Default)
  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
          <Settings className="w-5 h-5 text-orange-500" />
          <span>الإعدادات العامة ورسوم الخدمة ⚙️</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">تعديل اسم التطبيق، أجور التوصيل الافتراضية، المناطق الجغرافية، والعملة</p>
      </div>

      <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-black text-slate-700 block mb-1">اسم المنصة / التطبيق</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1">رقم هاتف الإدارة والدعم</label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-black text-slate-700 block">رسوم التوصيل الأساسية الافتراضية ({currency})</label>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                يحددها المدير • لا يوجد سقف أدنى أو أعلى
              </span>
            </div>
            <input
              type="number"
              min={0}
              step={1}
              value={baseDeliveryFee}
              onChange={(e) => setBaseDeliveryFee(Math.max(0, Number(e.target.value)))}
              placeholder="مثال: 0 (توصيل مجاني) أو 3000، 5000، 25000..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
            />
            <p className="text-[10px] text-slate-400 font-bold mt-1">
              * تحكم كامل ومطلق للإدارة: يمكنك كتابة أي مبلغ رسوم توصيل تحدده، أو 0 ليكون التوصيل مجانياً بالكامل بدون أي قيود برمجية.
            </p>
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1">الحد الأدنى لقيمة الطلب ({currency})</label>
            <input
              type="number"
              min={0}
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(Math.max(0, Number(e.target.value)))}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1">رمز العملة</label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-orange-500" />
                <span>رابط التطبيق الرسمي المباشر (المستخدم في الواتساب والباركود)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined" && window.location) {
                    const detected = window.location.origin + (window.location.pathname !== "/" ? window.location.pathname : "");
                    setOfficialAppUrl(detected);
                  }
                }}
                className="text-[10px] text-orange-600 hover:text-orange-700 font-bold bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded-md border border-orange-200 cursor-pointer"
              >
                التقاط الرابط الحالي تلقائياً 🔄
              </button>
            </div>
            <input
              type="text"
              dir="ltr"
              value={officialAppUrl}
              onChange={(e) => setOfficialAppUrl(e.target.value)}
              placeholder="اتركه فارغاً للاعتماد التلقائي على رابط المتصفح الحالي النشط"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
            />
            <p className="text-[10px] text-slate-400 font-bold mt-1">
              * يُستخدم هذا الرابط في جميع رسائل الواتساب، بوسترات الباركود، وبيانات الدخول لضمان فتح التطبيق مباشرة دون خطأ 404.
            </p>
          </div>
        </div>

        {/* Admin Password & Security Management Section */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-orange-500" />
                <span>أمان وحماية لوحة الإدارة وتغيير كلمة المرور 🔐</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                تغيير كلمة المرور الرئيسية ورمز PIN السريع لحساب المدير العام، وتحديثها فوراً لتسجيل الدخول والتحكم
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-black">
                <Shield className="w-3 h-3 text-orange-500" />
                <span>حساب الإدارة الرئيسية</span>
              </span>
            </div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Master Password Input */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-orange-500" />
                    <span>كلمة المرور الرئيسية الجديدة</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">4 خانات فأكثر</span>
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                    placeholder="أدخل كلمة المرور الجديدة..."
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    title={showAdminPassword ? "إخفاء" : "إظهار"}
                  >
                    {showAdminPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Quick PIN Input */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-orange-500" />
                    <span>رمز PIN السريع للإدارة</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">4 أرقام سريعة</span>
                </label>
                <div className="relative">
                  <input
                    type={showAdminPin ? "text" : "password"}
                    value={adminPin}
                    maxLength={8}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="مثال: 1234"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPin(!showAdminPin)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    title={showAdminPin ? "إخفاء" : "إظهار"}
                  >
                    {showAdminPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                  <span>تأكيد كلمة المرور الجديدة</span>
                  {confirmAdminPassword && (
                    <span className={`text-[10px] font-black ${confirmAdminPassword === adminPassword ? "text-emerald-600" : "text-rose-500"}`}>
                      {confirmAdminPassword === adminPassword ? "✓ متطابقة" : "✕ غير متطابقة"}
                    </span>
                  )}
                </label>
                <input
                  type={showAdminPassword ? "text" : "password"}
                  value={confirmAdminPassword}
                  onChange={(e) => {
                    setConfirmAdminPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  placeholder="أعد كتابة كلمة المرور..."
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>

            {/* Error and Success Feedback */}
            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-black text-rose-700 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSaveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-black text-emerald-700 flex items-center gap-2 animate-fade-in">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>تم تغيير وتحديث كلمة مرور ورمز دخول الإدارة فوراً في كافة أجزاء النظام بنجاح! 🔒✓</span>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-200/60">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAdminPassword}
                  className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5 text-orange-400" />
                  <span>تحديث وحفظ كلمة المرور للإدارة 🔒</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyAdminCreds}
                  className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {copiedAdminCreds ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedAdminCreds ? "تم النسخ ✓" : "نسخ بيانات الدخول"}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 mr-auto sm:mr-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSendAdminCredsWA("regular")}
                  className="py-2 px-3 bg-[#25D366] hover:bg-[#20ba56] text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="إرسال بيانات الدخول عبر واتساب العادي"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>واتساب 💬</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendAdminCredsWA("business")}
                  className="py-2 px-3 bg-[#075E54] hover:bg-[#054a43] text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="إرسال بيانات الدخول عبر واتساب الأعمال"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>واتساب أعمال 💼</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PWA App Icon & Mobile Install Management Section */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-orange-500" />
                <span>أيقونة التطبيق وتثبيت الهاتف (PWA App Icon) 📱</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                تخصيص أيقونة التثبيت للشاشات الرئيسية على هواتف أندرويد وآيفون، ويتم حقنها ديناميكياً في ملف الـ Manifest لمنع أي تلف في الصورة.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>PWA Standalone جاهز</span>
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center gap-6 justify-between">
            {/* Live Mobile Icon Preview Box */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-lg border-2 border-white bg-slate-900 flex items-center justify-center transition-transform group-hover:scale-105">
                  <img
                    src={appIcon}
                    alt="App Icon Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                  512×512
                </div>
              </div>

              <div className="space-y-1 text-right">
                <span className="text-xs font-black text-slate-800 block">معاينة الأيقونة على الشاشة الرئيسية</span>
                <p className="text-[11px] text-slate-500">
                  الأيقونة الحالية: {appSettings.customAppIcon ? "صورة مخصصة مرفوعة من المدير" : "أيقونة متجهة برمجية فائقة الدقة"}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">
                    192x192 & 512x512
                  </span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">
                    Maskable + Any
                  </span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">
                    حقن ديناميكي Blob
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/svg+xml"
                onChange={handleIconFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUpdatingIcon}
                className="flex-1 md:flex-none py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{isUpdatingIcon ? "جاري معالجة الصورة..." : "تغيير أيقونة التطبيق 📷"}</span>
              </button>

              {appSettings.customAppIcon && (
                <button
                  type="button"
                  onClick={handleResetToDefaultIcon}
                  disabled={isUpdatingIcon}
                  className="py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                  title="استعادة الأيقونة الافتراضية"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>الأيقونة الافتراضية</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleTriggerPwaInstall}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-orange-400" />
                <span>تجربة التثبيت على الهاتف 📲</span>
              </button>
            </div>
          </div>

          {iconUpdateSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-black text-emerald-700 flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>تم تحديث أيقونة التطبيق ومستند التثبيت (Manifest & Favicon) فوراً وديناميكياً بنجاح! 🎉</span>
            </div>
          )}
        </div>

        {/* App Updates & Feature Releases Management Section (نشر وإدارة التحديثات والميزات الجديدة) */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>إدارة ونشر تحديثات التطبيق والميزات الجديدة للمستخدمين 🚀</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                عند إضافة ميزات جديدة أو إجراء تعديلات على التطبيق، يمكنك نشر إشعار التحديث من هنا ليظهر فوراً كأيقونة منبهة لجميع المستخدمين وتختفي تلقائياً فور قيامهم بالتحديث
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>
                <span>الإصدار المنشور: {latestUpdate.version}</span>
              </span>
            </div>
          </div>

          <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
            {/* Current Active Update Summary Box */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">
                    🚀
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">{latestUpdate.title}</span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      الإصدار الحالي: {latestUpdate.version} • تاريخ النشر: {latestUpdate.releaseDate} • {latestUpdate.features.length} ميزات وتعديلات
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    title="معاينة النافذة المنبثقة كما تظهر للمستخدمين"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>معاينة نافذة التحديث للمستخدمين 👁️</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetUpdateIconForTesting}
                    className="py-1.5 px-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 font-black text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    title="إعادة إظهار أيقونة التحديث في الشريط العلوي لتجربتها"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-orange-600" />
                    <span>إظهار الأيقونة للتجربة 🔄</span>
                  </button>
                </div>
              </div>

              {iconResetSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-black text-emerald-700 flex items-center gap-2 animate-fade-in">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>تمت إعادة تعيين حالة التحديث! ستظهر أيقونة التحديث الآن في أعلى الشاشة لتجربتها واختبار اختفائها بعد النقر عليها.</span>
                </div>
              )}

              {/* Display current features */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-black text-slate-700 block">الميزات والتعديلات النشطة في هذا التحديث:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {latestUpdate.features.map((feat, fIdx) => (
                    <div key={fIdx} className="p-2 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] text-slate-700 font-bold flex items-start gap-2">
                      <span className="text-emerald-600 shrink-0 mt-0.5">✓</span>
                      <span className="flex-1">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Form to publish a brand new update */}
            <div className="pt-2 space-y-3">
              <span className="text-xs font-black text-slate-900 block">
                نشر تحديث جديد أو تعديل وإضافة ميزات جديدة للنظام:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black text-slate-700 block mb-1">
                    عنوان التحديث الرئيسي
                  </label>
                  <input
                    type="text"
                    value={newUpdateTitle}
                    onChange={(e) => setNewUpdateTitle(e.target.value)}
                    placeholder="مثال: تحديث سرعة التوصيل وإضافة خدمات وحرفيين جدد 🚀"
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-700 block mb-1">
                    رقم أو كود الإصدار
                  </label>
                  <input
                    type="text"
                    value={newUpdateVersion}
                    onChange={(e) => setNewUpdateVersion(e.target.value)}
                    placeholder="مثال: v2.5.1 أو v2.6.0"
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Features Builder */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-700 block">
                  بنود الميزات والتعديلات الجديدة التي قامت الإدارة بإضافتها:
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newFeatureInput}
                    onChange={(e) => setNewFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder="اكتب ميزة أو تعديل جديد هنا ثم اضغط إضافة (مثال: إضافة قسم الصيدلية والتموينات)..."
                    className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة للبند</span>
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold ml-1">إضافة ميزات سريعة جاهزة:</span>
                  {[
                    "⚡ تسريع استجابة الطلبات والتوصيل",
                    "🏪 إضافة متاجر وتصنيفات جديدة",
                    "🛵 تحسين تعيين الكباتن والتتبع الميداني",
                    "🏷️ دعم كوبونات خصم وعروض حصرية",
                    "📱 دعم تثبيت الشاشة الرئيسية PWA"
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => handleAddQuickFeaturePreset(preset)}
                      className="px-2 py-1 bg-white hover:bg-orange-50 border border-slate-200 text-slate-700 hover:text-orange-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                {/* Current features list for publishing */}
                <div className="space-y-1.5 pt-1">
                  {updateFeaturesList.map((feat, fIdx) => (
                    <div key={fIdx} className="p-2 bg-white rounded-xl border border-slate-200/90 text-xs text-slate-800 font-bold flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-black flex items-center justify-center shrink-0">
                          {fIdx + 1}
                        </span>
                        <span>{feat}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(fIdx)}
                        className="text-slate-400 hover:text-red-600 font-bold text-xs p-1"
                        title="حذف هذا البند"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Admin Notes */}
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">
                  ملاحظة أو رسالة إضافية من الإدارة للمستخدمين (اختياري)
                </label>
                <input
                  type="text"
                  value={newUpdateNotes}
                  onChange={(e) => setNewUpdateNotes(e.target.value)}
                  placeholder="مثال: نشكركم على ثقتكم بتطبيق توصيل ونسعى دائماً لتقديم الأفضل لكم."
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              {/* Publish Action Button */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handlePublishUpdate}
                  className="py-3 px-5 bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-white animate-spin-slow" />
                  <span>🚀 نشر التحديث لجميع المستخدمين فوراً</span>
                </button>

                <p className="text-[10px] text-slate-400 font-bold">
                  * سيظهر إشعار وأيقونة التحديث مباشرة لجميع المتصفحين، وستختفي تلقائياً بعد قيام كل مستخدم بالضغط على زر التحديث.
                </p>
              </div>

              {updatePublishSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-black text-emerald-700 flex items-center gap-2 animate-fade-in">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>تم نشر التحديث الجديد وإرسال إشعار الأيقونة لجميع المستخدمين والتبويبات فوراً بنجاح! 🎉</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Regions */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <label className="text-xs font-black text-slate-700 block">الأحياء والمناطق النشطة للتوصيل في القرية</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newRegion}
              onChange={(e) => setNewRegion(e.target.value)}
              placeholder="أدخل اسم حارة أو منطقة جديدة..."
              className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleAddRegion}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl"
            >
              إضافة حي
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {regions.map((reg, rIdx) => (
              <span
                key={rIdx}
                className="px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl text-xs font-black flex items-center gap-2"
              >
                <span>{reg}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRegion(reg)}
                  className="text-orange-400 hover:text-red-600 font-bold"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Clean Slate & Demo Data Management Section (إدارة البيانات وتصفير الأمثلة للبدء على نظافة) */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-orange-500" />
                <span>إدارة البيانات وتصفير الأمثلة (البدء على نظافة) 🧹✨</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                تفريغ وتصفير المتاجر والمنتجات والطلبات التجريبية للبدء في تشغيل التطبيق في القرية بقاعدة بيانات حقيقية ونظيفة تماماً، مع الحفاظ الكامل على كافة إعدادات وأمان وهيكلية البرنامج
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>أمان وحفظ دائم للإعدادات</span>
              </span>
            </div>
          </div>

          <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            {/* Info Cards / Guarantees */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>ما الذي يتم المحافظة عليه دائماً؟ (بيانات البرنامج الآمنة)</span>
                </div>
                <ul className="text-slate-600 space-y-0.5 pr-3 list-disc text-[10.5px]">
                  <li>إعدادات التطبيق العامة، الاسم، أرقام الدعم، ورسوم التوصيل.</li>
                  <li>حسابات وكلمات مرور الإدارة والـ PIN وصلاحيات الطاقم.</li>
                  <li>التصنيفات، معالم القرية والأحياء الجغرافية، والكوبونات.</li>
                  <li>ملف التثبيت PWA والأيقونات البرمجية وكامل أمان النظام.</li>
                </ul>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span>ما الذي سيتم تصفيره عند البدء على نظافة؟</span>
                </div>
                <ul className="text-slate-600 space-y-0.5 pr-3 list-disc text-[10.5px]">
                  <li>المتاجر والمحلات التوضيحية الافتراضية.</li>
                  <li>المنتجات والأصناف والعروض التجريبية المسبقة.</li>
                  <li>سجل الطلبات التجريبية والتقييمات السابقة.</li>
                  <li>تصبح المنصة جاهزة فوراً لإضافة محلات القرية الحقيقية فقط.</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleTriggerCleanSlateModal("all")}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تصفير الأمثلة والبدء على نظافة (قاعدة بيانات نظيفة) 🧹</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerCleanSlateModal("zero_transactions")}
                className="py-2.5 px-3.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-200" />
                <span>تصفير النشاط والإحصائيات فقط (0️⃣ طلبات)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerCleanSlateModal("orders_only")}
                className="py-2.5 px-3.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                <span>تفريغ وتصفير سجل الطلبات التجريبية فقط 📦</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerCleanSlateModal("restore_defaults")}
                className="py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95 mr-auto sm:mr-0"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>استعادة الأمثلة التوضيحية الافتراضية 🔄</span>
              </button>
            </div>

            {cleanSlateSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-black text-emerald-700 flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{cleanSlateSuccessMsg}</span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="submit"
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <span>حفظ كافة الإعدادات</span>
            {savedSuccess && <Check className="w-4 h-4 text-white" />}
          </button>
          {savedSuccess && (
            <span className="text-xs font-black text-emerald-600">تم حفظ الإعدادات بنجاح ✓</span>
          )}
        </div>
      </form>

      {/* Modal: PWA Installation Step-by-Step Guide */}
      {showPwaInstallGuide && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans overflow-y-auto" 
          dir="rtl"
          onClick={() => setShowPwaInstallGuide(false)}
        >
          <div 
            className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4 my-auto relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm sm:text-base">
                    طريقة تثبيت التطبيق على الموبايل 📲
                  </h4>
                  <p className="text-[11px] text-slate-400">ليعمل كتطبيق مستقل (Standalone App) بكامل الشاشة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPwaInstallGuide(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black text-xs cursor-pointer border border-slate-200"
              >
                إغلاق ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Note about AI Studio Frame */}
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-1.5 font-black text-amber-900">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>ملاحظة هامة حول تثبيت التطبيق:</span>
                </div>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  إذا كنت تتصفح من داخل نافذة منصة <strong>Google AI Studio</strong>، فإن المتصفح سيحاول تثبيت منصة AI Studio. لتثبيت تطبيقك الخاص باسم <strong>({appSettings.appName})</strong> وأيقونته البرمجية، افتح الرابط المباشر في متصفحك:
                </p>
                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      window.open(activeAppUrl, "_blank");
                    }}
                    className="flex-1 py-2.5 px-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>فتح التطبيق في نافذة مستقلة 🚀</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeAppUrl);
                      alert("تم نسخ رابط التطبيق المباشر! يمكنك فتحه في متصفح كروم وتثبيته فوراً.");
                    }}
                    className="py-2.5 px-3 bg-white border border-amber-300 text-amber-900 font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>نسخ الرابط</span>
                  </button>
                </div>
              </div>

              {/* Android Box */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">1</span>
                  <span>على هواتف أندرويد (Google Chrome / Samsung):</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed pr-7">
                  افتح الرابط المباشر للتطبيق، ثم اضغط على قائمة النقاط الثلاث <span className="font-mono font-black">⋮</span> في أعلى المتصفح، واختر <strong className="text-orange-600">"تثبيت التطبيق"</strong> أو <strong className="text-orange-600">"Install app"</strong>. ستظهر أيقونة التطبيق المخصصة فوراً على شاشة هاتفك الرئيسية.
                </p>
              </div>

              {/* iOS Box */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px]">2</span>
                  <span>على هواتف آيفون (Safari):</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed pr-7">
                  افتح الرابط المباشر في Safari، ثم اضغط على زر المشاركة <span className="font-black text-sky-600">Share ⎋</span> في أسفل الشاشة، واختر <strong className="text-orange-600">"إضافة إلى الصفحة الرئيسية (Add to Home Screen)"</strong>.
                </p>
              </div>

              {/* Dynamic Manifest Status */}
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-orange-800 font-black text-[11px]">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ملف التثبيت مفعل ومحقون ديناميكياً بالأيقونة والمقاسات الصحيحة (192x192 & 512x512)</span>
                </div>
                <p className="text-[10px] text-orange-700">
                  تم ضبط وضع التشغيل المستقل Display: standalone ليعمل التطبيق بدون أشرطة متصفح كأنه تطبيق جوال حقيقي.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPwaInstallGuide(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer text-center"
              >
                إغلاق والعودة للتطبيق ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Update Preview Modal */}
      {showPreviewModal && (
        <AppUpdateModal
          update={latestUpdate}
          onClose={() => setShowPreviewModal(false)}
          onApplyUpdate={() => setShowPreviewModal(false)}
          isPreview={true}
        />
      )}

      {/* Modal: Clean Slate & Demo Data Reset Confirmation (تأكيد تصفير الأمثلة أو الطلبات) */}
      {showCleanSlateModal && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans overflow-y-auto" 
          dir="rtl"
          onClick={() => !isProcessingCleanSlate && setShowCleanSlateModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4 my-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${
                  cleanSlateTarget === "all"
                    ? "bg-red-100 text-red-600"
                    : cleanSlateTarget === "orders_only"
                    ? "bg-slate-100 text-slate-800"
                    : cleanSlateTarget === "zero_transactions"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-blue-100 text-blue-600"
                }`}>
                  {cleanSlateTarget === "all" ? (
                    <Trash2 className="w-5 h-5" />
                  ) : cleanSlateTarget === "zero_transactions" ? (
                    <RotateCcw className="w-5 h-5" />
                  ) : cleanSlateTarget === "orders_only" ? (
                    <RotateCcw className="w-5 h-5" />
                  ) : (
                    <RefreshCw className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm sm:text-base">
                    {cleanSlateTarget === "all" && "تأكيد تصفير الأمثلة والبدء على نظافة 🧹"}
                    {cleanSlateTarget === "zero_transactions" && "تأكيد تصفير النشاط والإحصائيات 0️⃣"}
                    {cleanSlateTarget === "orders_only" && "تأكيد تفريغ سجل الطلبات التجريبية 📦"}
                    {cleanSlateTarget === "restore_defaults" && "تأكيد استعادة الأمثلة الافتراضية 🔄"}
                  </h4>
                  <p className="text-[11px] text-slate-400">إجراء إداري لتهيئة قاعدة البيانات</p>
                </div>
              </div>
              {!isProcessingCleanSlate && (
                <button
                  type="button"
                  onClick={() => setShowCleanSlateModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="space-y-3 text-xs">
              {cleanSlateTarget === "all" && (
                <div className="p-3.5 bg-red-50 rounded-2xl border border-red-200 space-y-2">
                  <div className="flex items-center gap-1.5 font-black text-red-800">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>تنبيه هام ومطمئن للمدير:</span>
                  </div>
                  <p className="text-red-900 text-[11.5px] leading-relaxed">
                    سيتم مسح المتاجر والمنتجات والطلبات التجريبية المسبقة لتبدأ بإدخال محلات القرية الحقيقية فقط.
                  </p>
                  <div className="p-2.5 bg-white/80 rounded-xl text-[10.5px] text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>نضمن لك بقاء اسم التطبيق، الإعدادات، كلمات المرور، والـ PIN، والمناطق محفوظة بنسبة 100%.</span>
                  </div>
                </div>
              )}

              {cleanSlateTarget === "zero_transactions" && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-center gap-1.5 font-black text-amber-900">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>تصفير الطلبات والعمليات وإحصائيات النشاط:</span>
                  </div>
                  <p className="text-amber-800 text-[11.5px] leading-relaxed">
                    سيتم مسح كافة الطلبات والنشاط وإعادة إحصائيات التوصيل للكباتن إلى الصفر، مع بقاء كافة المتاجر، المنتجات، الكباتن، والزبائن، والإعدادات الإدارية محفوظة تماماً.
                  </p>
                  <div className="p-2 bg-white/80 rounded-xl text-[10.5px] text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>تظل المحلات والوجبات والأسعار وحسابات الدخول كما هي 100%.</span>
                  </div>
                </div>
              )}

              {cleanSlateTarget === "orders_only" && (
                <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-1.5 font-black text-slate-800">
                    <Info className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>تفريغ أرشيف وسجل الطلبات فقط:</span>
                  </div>
                  <p className="text-slate-700 text-[11.5px] leading-relaxed">
                    سيتم مسح كافة الطلبات التجريبية القديمة ليكون سجل الطلبات نظيفاً وجديداً، مع بقاء كافة المتاجر والمنتجات والإعدادات كما هي.
                  </p>
                </div>
              )}

              {cleanSlateTarget === "restore_defaults" && (
                <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200 space-y-2">
                  <div className="flex items-center gap-1.5 font-black text-blue-900">
                    <RefreshCw className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>استعادة مجموعة الأمثلة التوضيحية:</span>
                  </div>
                  <p className="text-blue-800 text-[11.5px] leading-relaxed">
                    سيتم إعادة تعبئة المتاجر والوجبات والمنتجات والسائقين التجريبيين الافتراضيين للتجربة والتدريب.
                  </p>
                </div>
              )}

              {/* PIN Verification Input */}
              <div className="space-y-1.5 pt-1">
                <label className="font-extrabold text-slate-700 block text-xs">
                  أدخل رمز الـ PIN للمدير للتأكيد (الافتراضي: {adminPin || "1234"}):
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={8}
                    value={cleanSlatePinInput}
                    onChange={(e) => {
                      setCleanSlatePinInput(e.target.value);
                      setCleanSlateError("");
                    }}
                    placeholder="أدخل رمز الـ PIN هنا..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-center tracking-widest text-sm font-black outline-none focus:border-orange-500"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
                {cleanSlateError && (
                  <p className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{cleanSlateError}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isProcessingCleanSlate}
                onClick={handleExecuteCleanSlate}
                className={`flex-1 py-3 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  cleanSlateTarget === "all"
                    ? "bg-red-600 hover:bg-red-700 active:bg-red-800"
                    : cleanSlateTarget === "zero_transactions"
                    ? "bg-amber-600 hover:bg-amber-700 active:bg-amber-800"
                    : cleanSlateTarget === "orders_only"
                    ? "bg-slate-800 hover:bg-slate-900"
                    : "bg-blue-600 hover:bg-blue-700"
                } ${isProcessingCleanSlate ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {isProcessingCleanSlate ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري التنفيذ والتحديث...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>تأكيد وتنفيذ الإجراء الآن</span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isProcessingCleanSlate}
                onClick={() => setShowCleanSlateModal(false)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
