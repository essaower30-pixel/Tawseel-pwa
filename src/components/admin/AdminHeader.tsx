import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  Store as StoreIcon, 
  Utensils, 
  Users, 
  Bike, 
  MapPin, 
  Tag, 
  Wrench, 
  KeyRound, 
  FileText, 
  Settings, 
  Clock, 
  Share2, 
  AlertTriangle, 
  CheckCircle2, 
  LogOut,
  ShieldCheck,
  Archive,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  UserCheck,
  Shield,
  Volume2,
  VolumeX,
  Sparkles,
  ShoppingBag,
  Bell,
  Stethoscope
} from "lucide-react";
import { StaffMember, StaffPermission } from "../../types";
import { playOrderAlertSound, isSoundEnabled, setSoundEnabled, requestNotificationPermission, showSystemNotification } from "../../utils/soundNotifications";
import { subscribeToPushNotifications } from "../../utils/pushManager";

export type AdminTab = 
  | "platform_features"
  | "share"
  | "stats" 
  | "archive_reports"
  | "vault"
  | "stores" 
  | "products" 
  | "orders" 
  | "staff" 
  | "drivers" 
  | "landmarks" 
  | "coupons" 
  | "craftsmen" 
  | "doctors"
  | "customers" 
  | "logs" 
  | "settings";

interface AdminHeaderProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isEmergencyRush: boolean;
  onToggleEmergencyRush: () => void;
  staffList: StaffMember[];
  currentStaff: StaffMember | null;
  onSelectStaff: (staff: StaffMember) => void;
  onLogout: () => void;
  onOpenAccount?: () => void;
  onBackToCustomerView?: () => void;
  pendingStoresCount?: number;
  pendingProductsCount?: number;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  setActiveTab,
  isEmergencyRush,
  onToggleEmergencyRush,
  staffList,
  currentStaff,
  onSelectStaff,
  onLogout,
  onOpenAccount,
  onBackToCustomerView,
  pendingStoresCount = 0,
  pendingProductsCount = 0
}) => {
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [notifPermission, setNotifPermission] = useState<string>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "denied"
  );
  const [isPushRegistering, setIsPushRegistering] = useState<boolean>(false);
  const [testSoundPlaying, setTestSoundPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
      if (Notification.permission === "granted") {
        subscribeToPushNotifications({
          role: "admin",
          roles: ["admin", "manager", "store", "driver"],
          receiveAllAlerts: true,
          name: currentStaff?.name || "المدير العام",
        }).catch(console.warn);
      }
    }
  }, [currentStaff]);

  const handleActivatePush = async () => {
    setIsPushRegistering(true);
    try {
      playOrderAlertSound("ringtone");
      const granted = await requestNotificationPermission();
      if (typeof window !== "undefined" && "Notification" in window) {
        setNotifPermission(Notification.permission);
      }
      if (granted) {
        setSoundOn(true);
        setSoundEnabled(true);
        await subscribeToPushNotifications({
          role: "admin",
          roles: ["admin", "manager", "store", "driver"],
          receiveAllAlerts: true,
          name: currentStaff?.name || "المدير العام",
        });
        await showSystemNotification("تطبيق توصيل - رنين الإدارة 🔔", {
          body: "تم تفعيل رنين الطلبات بنجاح! ستسمع الرنين وتصلك التنبيهات حتى عند قفل الهاتف.",
          soundType: "ringtone",
          requireInteraction: true
        });
      }
    } catch (err) {
      console.warn("Failed to activate admin push:", err);
    } finally {
      setIsPushRegistering(false);
    }
  };

  const handleTestAlert = async () => {
    setTestSoundPlaying(true);
    try {
      playOrderAlertSound("ringtone");
      await showSystemNotification("تجربة رنين الإدارة 🔔", {
        body: "الرنين والتنبيهات تعمل بنجاح! إذا قفلت الهاتف الآن ستستلم تنبيهاً بكل طلب جديد.",
        soundType: "ringtone",
        requireInteraction: true
      });
    } finally {
      setTimeout(() => setTestSoundPlaying(false), 2000);
    }
  };

  const allNavTabs = [
    { id: "platform_features", label: "ميزات واستطاعة المنصة والترويج", icon: Sparkles, emoji: "💎" },
    { id: "share", label: "نشر وتوزيع التطبيق (الإدارة)", icon: Share2, emoji: "📢" },
    { id: "stats", label: "الإحصائيات والأرباح", icon: BarChart3, emoji: "📊" },
    { id: "archive_reports", label: "أرشيف الطلبات والتقارير المالية", icon: Archive, emoji: "📦" },
    { id: "vault", label: "أرشيف بيانات الدخول (سري للإدارة)", icon: Lock, emoji: "🔒" },
    { id: "customers", label: "سجل الزبائن والمهن", icon: Users, emoji: "👥" },
    { id: "orders", label: "الطلبات النشطة والجدولة", icon: Clock, emoji: "🕒" },
    { id: "stores", label: "إدارة المحلات والمتاجر", icon: StoreIcon, emoji: "🏪" },
    { id: "products", label: "إدارة الأصناف والخيارات", icon: Utensils, emoji: "🍽️" },
    { id: "coupons", label: "كوبونات الخصم والترويج", icon: Tag, emoji: "🏷️" },
    { id: "drivers", label: "إدارة الكباتن والمناديب", icon: Bike, emoji: "🛵" },
    { id: "landmarks", label: "إدارة المعالم الجغرافية", icon: MapPin, emoji: "📍" },
    { id: "craftsmen", label: "دليل الحرفيين وأصحاب المهن", icon: Wrench, emoji: "🛠️" },
    { id: "doctors", label: "دليل وسجل الأطباء والعيادات", icon: Stethoscope, emoji: "🩺" },
    { id: "staff", label: "طاقم العمل وتخصيص الصلاحيات", icon: KeyRound, emoji: "🔑" },
    { id: "logs", label: "سجل عمليات الموظفين", icon: FileText, emoji: "📑" },
    { id: "settings", label: "الإعدادات والرسوم وباسوورد الإدارة", icon: Settings, emoji: "⚙️" },
  ];

  // Determine allowed permissions for current staff member
  const isManager = !currentStaff || currentStaff.role === "manager";
  const userPermissions: StaffPermission[] = currentStaff?.permissions || (
    isManager 
      ? allNavTabs.map(t => t.id as StaffPermission)
      : (currentStaff?.role === "orders_clerk" ? ["orders", "drivers", "customers", "landmarks", "archive_reports"] : ["orders"])
  );

  // Filter tabs based on assigned permissions
  const visibleTabs = allNavTabs.filter(tab => {
    if (isManager) return true;
    return userPermissions.includes(tab.id as StaffPermission);
  });

  // Ensure active tab is within allowed tabs
  useEffect(() => {
    if (visibleTabs.length > 0) {
      const isAllowed = visibleTabs.some(t => t.id === activeTab);
      if (!isAllowed) {
        setActiveTab(visibleTabs[0].id as AdminTab);
      }
    }
  }, [currentStaff, visibleTabs, activeTab, setActiveTab]);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "manager": return { label: "المدير العام (تحكم شامل)", bg: "bg-purple-500/20 text-purple-300 border-purple-500/30" };
      case "orders_clerk": return { label: "مسؤول الطلبات والتوجيه", bg: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
      case "accountant": return { label: "المحاسب المالي", bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
      case "support": return { label: "خدمة العملاء والدعم الفني", bg: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
      case "products_specialist": return { label: "مشرف المتاجر والأصناف", bg: "bg-teal-500/20 text-teal-300 border-teal-500/30" };
      default: return { label: "موظف بصلاحيات مخصصة", bg: "bg-orange-500/20 text-orange-300 border-orange-500/30" };
    }
  };

  const currentRoleBadge = getRoleBadge(currentStaff?.role);

  return (
    <div className="space-y-4 font-sans text-right" dir="rtl">
      {/* Background Push & Ringtone Activation Warning for Admin */}
      {notifPermission !== "granted" && (
        <div className="w-full bg-gradient-to-r from-amber-950/80 via-orange-950/70 to-slate-900 border-2 border-amber-500/80 rounded-3xl p-4 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3 text-right w-full md:w-auto">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
              <Volume2 className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-white text-xs sm:text-sm font-black">
                  ⚠️ تنبيه هام للمدير: رنين الطلبات عند قفل الهاتف غير مفعّل!
                </p>
                <span className="px-2 py-0.5 bg-amber-500/30 text-amber-300 text-[10px] font-black rounded-lg border border-amber-500/50">
                  ضروري للمدير
                </span>
              </div>
              <p className="text-amber-200/90 text-[11px] sm:text-xs font-bold mt-0.5">
                اضغط الزر لتفعيل الإشعارات والرنين فوراً ليرن هاتفك حتى لو كان الجهاز مقفلاً أو المتصفح مغلقاً.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleActivatePush}
            disabled={isPushRegistering}
            className="w-full md:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0 border border-amber-400"
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span>{isPushRegistering ? "جاري التفعيل..." : "اضغط هنا لتفعيل الرنين الآن 🔔"}</span>
          </button>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3.5 sm:p-5 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-lg shadow-orange-500/20 shrink-0">
            ت
          </div>
          <div className="min-w-0">
            <div className="flex flex-col xs:flex-row xs:items-center gap-1 sm:gap-2">
              <h1 className="text-sm sm:text-xl font-black text-white leading-tight">
                توصيل القرية الذكي • {currentStaff ? currentStaff.name : "لوحة التحكم الإدارية"}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border whitespace-nowrap shrink-0 w-fit ${currentRoleBadge.bg}`}>
                {currentRoleBadge.label}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5 truncate xs:whitespace-normal">
              {isManager 
                ? "لوحة التحكم المركزية الشاملة - كافة الصلاحيات وإعدادات النظام متاحة" 
                : `صفحة مهام مخصصة للموظف • متاح لك (${visibleTabs.length}) أقسام مصرح بها`}
            </p>
          </div>
        </div>

        {/* Sound alerts and Account Identity */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
          {/* Sound Notification quick toggle button for admin */}
          <button
            type="button"
            onClick={async () => {
              const next = !soundOn;
              setSoundOn(next);
              setSoundEnabled(next);
              if (next) {
                playOrderAlertSound("ringtone");
                const granted = await requestNotificationPermission();
                if (typeof window !== "undefined" && "Notification" in window) {
                  setNotifPermission(Notification.permission);
                }
                if (granted) {
                  subscribeToPushNotifications({
                    role: "admin",
                    roles: ["admin", "manager", "store", "driver"],
                    receiveAllAlerts: true,
                    name: currentStaff?.name || "المدير العام",
                  }).catch(console.warn);

                  showSystemNotification("لوحة الإدارة 🔔", {
                    body: "تم تفعيل التنبيهات وظهور أيقونة التطبيق في شريط الإشعارات العلوي! ستصلك تنبيهات فورية بكل طلب وارد حتى لو كان الهاتف مقفلاً.",
                    soundType: "ringtone",
                  });
                }
              }
            }}
            className={`px-2.5 sm:px-3 py-1.5 border font-black text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
              soundOn
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
            }`}
            title="تفعيل/كتم صوت رنين الطلبات الواردة للإدارة"
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            <span className="truncate">{soundOn ? "رنين الطلبات 🔔" : "الصوت مكتوم"}</span>
          </button>

          {/* Test Sound Button for Admin */}
          <button
            type="button"
            onClick={handleTestAlert}
            disabled={testSoundPlaying}
            className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-black text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            title="تجربة صوت الرنين والإشعار على الهاتف"
          >
            <Volume2 className={`w-3.5 h-3.5 ${testSoundPlaying ? "animate-spin text-amber-400" : "text-amber-400"}`} />
            <span>{testSoundPlaying ? "يرن الآن..." : "تجربة الرنين 🔊"}</span>
          </button>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl px-2.5 sm:px-3 py-1.5 flex items-center justify-center gap-1.5 text-xs truncate">
            <span className="text-slate-400 font-bold hidden xs:inline shrink-0">الحساب:</span>
            <span className="font-black text-orange-400 flex items-center gap-1 truncate">
              <Shield className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="truncate">{currentStaff?.name || "المدير العام"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Emergency Rush Management Banner */}
      <div className={`p-3.5 sm:p-4 rounded-3xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${
        isEmergencyRush 
          ? "bg-red-950/70 border-red-800 text-red-200" 
          : "bg-emerald-950/70 border-emerald-800 text-emerald-200"
      }`}>
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-lg sm:text-xl shrink-0 ${
            isEmergencyRush ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
          }`}>
            {isEmergencyRush ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-col xs:flex-row xs:items-center gap-1 sm:gap-2">
              <h3 className="text-xs sm:text-sm font-black text-white">
                إدارة ضغط الطلبات وحظر الخدمات/المنتجات
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-black/30 whitespace-nowrap shrink-0 w-fit">
                {isEmergencyRush ? "وضع التجميد مفعّل 🚨" : "الاستقبال طبيعي ومتاح ✅"}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleEmergencyRush}
          className={`w-full sm:w-auto px-4 py-2 rounded-2xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95 ${
            isEmergencyRush
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/40"
              : "bg-red-600 hover:bg-red-700 text-white shadow-red-900/40"
          }`}
        >
          {isEmergencyRush ? "✅ استئناف استقبال الطلبات الآن" : "🚨 إيقاف وتجميد عام للطلبات (وضع الضغط)"}
        </button>
      </div>

      {/* Authorized Navigation Tabs */}
      <div className="w-full max-w-full bg-white border border-slate-200 rounded-3xl p-2 shadow-xs overflow-x-auto scrollbar-none touch-pan-x flex items-center gap-1.5">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`whitespace-nowrap px-3.5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                isActive
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20 scale-[1.02]"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100"
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
              {tab.id === "stores" && pendingStoresCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse shadow-xs flex items-center gap-1">
                  <span>{pendingStoresCount} متجر جديد</span>
                  <span>🔔</span>
                </span>
              )}
              {tab.id === "products" && pendingProductsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse shadow-xs flex items-center gap-1">
                  <span>{pendingProductsCount} منتج بانتظار الاعتماد</span>
                  <span>⏳</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
