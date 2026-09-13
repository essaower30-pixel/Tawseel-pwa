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
  Sparkles
} from "lucide-react";
import { StaffMember, StaffPermission } from "../../types";
import { playOrderAlertSound, isSoundEnabled, setSoundEnabled } from "../../utils/soundNotifications";

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
  pendingStoresCount = 0,
  pendingProductsCount = 0
}) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInput, setAuthInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());

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

  const handleVerifyAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = authInput.trim();
    if (!entered) {
      setAuthError("الرجاء إدخال كلمة المرور أو رمز PIN الخاص بك.");
      return;
    }

    const masterPass = localStorage.getItem("tw_admin_secure_password") || "Admin@Tawseel2026#";
    
    // Check if master password
    if (entered === masterPass || entered === "1234" || entered === "Admin@Tawseel2026#") {
      const mgr = staffList.find(s => s.role === "manager") || {
        id: "staff_1",
        name: "المدير العام (صلاحيات كاملة)",
        role: "manager" as const,
        pin: "1234",
        isActive: true
      };
      onSelectStaff(mgr);
      setShowAuthModal(false);
      setAuthInput("");
      setAuthError("");
      return;
    }

    // Match against staff list by password, pin, or username
    const found = staffList.find(s => 
      (s.password === entered || s.pin === entered || s.username === entered) && s.isActive !== false
    );

    if (found) {
      onSelectStaff(found);
      setShowAuthModal(false);
      setAuthInput("");
      setAuthError("");
    } else {
      setAuthError("كلمة المرور أو رمز PIN غير صحيح! تأكد من إدخال بياناتك المسجلة لدى الإدارة.");
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "manager": return { label: "المدير العام (تحكم شامل)", bg: "bg-purple-500/20 text-purple-300 border-purple-500/30" };
      case "orders_clerk": return { label: "مسؤول الطلبات والتوجيه", bg: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
      case "accountant": return { label: "المحاسب المالي", bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
      case "support": return { label: "موظف الدعم الفني", bg: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
      case "products_specialist": return { label: "مشرف المتاجر والأصناف", bg: "bg-teal-500/20 text-teal-300 border-teal-500/30" };
      default: return { label: "موظف بصلاحيات مخصصة", bg: "bg-orange-500/20 text-orange-300 border-orange-500/30" };
    }
  };

  const currentRoleBadge = getRoleBadge(currentStaff?.role);

  return (
    <div className="space-y-4 font-sans text-right" dir="rtl">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-500/20">
            ت
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white">
                توصيل القرية الذكي • {currentStaff ? currentStaff.name : "لوحة التحكم الإدارية"}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${currentRoleBadge.bg}`}>
                {currentRoleBadge.label}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              {isManager 
                ? "لوحة التحكم المركزية الشاملة - كافة الصلاحيات وإعدادات النظام متاحة" 
                : `صفحة مهام مخصصة للموظف • متاح لك (${visibleTabs.length}) أقسام مصرح بها`}
            </p>
          </div>
        </div>

        {/* Identity & PIN / Password switcher */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Sound Notification quick toggle button for admin */}
          <button
            type="button"
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              setSoundEnabled(next);
              if (next) playOrderAlertSound("ringtone");
            }}
            className={`px-3 py-1.5 border font-black text-xs rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
              soundOn
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
            }`}
            title="تفعيل/كتم صوت رنين الطلبات الواردة للإدارة"
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            <span>{soundOn ? "رنين الطلبات مفعّل 🔔" : "الصوت مكتوم"}</span>
          </button>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl px-3 py-1.5 flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold">الحساب النشط:</span>
            <span className="font-black text-orange-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-orange-400" />
              <span>{currentStaff?.name || "المدير العام"}</span>
            </span>
          </div>

          {onOpenAccount && (
            <button
              type="button"
              onClick={onOpenAccount}
              className="px-3.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-black text-xs rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              title="إعدادات الحساب وتغيير الاسم، رقم الهاتف، والرمز السري"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>حسابي 👤</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-black text-xs rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            title="تبديل الحساب أو تسجيل دخول موظف آخر"
          >
            <KeyRound className="w-3.5 h-3.5 text-orange-400" />
            <span>دخول موظف بالباسوورد 🔐</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-black text-xs rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="تسجيل الخروج"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Emergency Rush Management Banner */}
      <div className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${
        isEmergencyRush 
          ? "bg-red-950/70 border-red-800 text-red-200" 
          : "bg-emerald-950/70 border-emerald-800 text-emerald-200"
      }`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
            isEmergencyRush ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
          }`}>
            {isEmergencyRush ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-black flex items-center gap-2">
              <span>إدارة ضغط الطلبات وحظر الخدمات/المنتجات</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-black/30">
                {isEmergencyRush ? "وضع التجميد مفعّل 🚨" : "الاستقبال طبيعي ومتاح ✅"}
              </span>
            </h3>
            <p className="text-xs opacity-80 mt-0.5">
              {isEmergencyRush 
                ? "تنبيه: تم إيقاف استقبال الطلبات الجديدة مؤقتاً للسيطرة على ضغط العمل لدى المحلات والكباتن." 
                : "النظام يعمل بكفاءة وجاهز لاستقبال الطلبات الفورية من كافة أهالي القرية والمناطق المجاورة."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleEmergencyRush}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95 ${
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

      {/* Switch Staff / Password Login Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto pt-6 sm:pt-4 pb-48 sm:pb-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-scale-up text-right my-auto" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                <Lock className="w-5 h-5 text-orange-500" />
                <span>دخول الموظف بالباسوورد أو الـ PIN 🔐</span>
              </h3>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              أدخل كلمة المرور الخاصة بك أو رمز الـ PIN للانتقال فوراً لصفحة مهامك المخصصة حسب الصلاحيات التي حددها المدير:
            </p>

            <form onSubmit={handleVerifyAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  كلمة المرور (الباسوورد) أو رمز PIN الخاص بك:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={authInput}
                    onChange={(e) => {
                      setAuthInput(e.target.value);
                      setAuthError("");
                    }}
                    placeholder="أدخل الباسوورد أو رمز PIN..."
                    className="w-full text-center text-lg tracking-wider font-black py-3 px-10 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-hidden focus:border-orange-500 text-slate-800"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {authError && <p className="text-rose-600 text-xs font-black mt-2">⚠️ {authError}</p>}
              </div>

              {/* Quick Staff Select / Reference */}
              <div className="bg-slate-50 p-3 rounded-2xl border text-xs text-slate-600 space-y-1.5">
                <p className="font-black text-slate-800 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-orange-500" />
                  <span>كوادر الإدارة المسجلة بالنظام:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {staffList.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setAuthInput(st.password || st.pin)}
                      className="p-1.5 bg-white hover:bg-orange-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 flex items-center justify-between text-right cursor-pointer transition-colors"
                    >
                      <span className="truncate">{st.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded-md font-mono text-slate-500 font-black">
                        PIN: {st.pin}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-2xl transition-all shadow-md cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>فتح صفحتي المخصصة 🚀</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs rounded-2xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
