import React, { useState, useEffect } from "react";
import { 
  Home, 
  Package, 
  Store as StoreIcon, 
  User, 
  Clock, 
  ShoppingBag, 
  Archive, 
  Wallet, 
  Bike, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  RotateCcw, 
  Check, 
  X, 
  SlidersHorizontal,
  ChevronRight,
  Eye,
  BarChart3,
  Utensils,
  Tag,
  Users,
  Settings,
  ShieldCheck
} from "lucide-react";

export interface NavItemConfig {
  id: string;
  label: string;
  iconName: string;
  description: string;
  badge?: string;
}

interface ToolbarReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: "customer" | "store_owner" | "driver" | "admin" | "guest";
  onSave?: (newOrder: string[]) => void;
  initialTab?: "bottom_nav" | "admin_tabs";
}

// Default items per role for Bottom Navigation
export const DEFAULT_BOTTOM_NAV_ITEMS: Record<string, NavItemConfig[]> = {
  admin: [
    { id: "home", label: "الرئيسية", iconName: "Home", description: "لوحة التحكم المركزية والإحصائيات والأرباح" },
    { id: "orders", label: "الطلبات", iconName: "Package", description: "إدارة الطلبات النشطة وتوجيه الكباتن" },
    { id: "stores", label: "المتاجر", iconName: "StoreIcon", description: "قائمة المحلات والمتاجر واعتمادها" },
    { id: "account", label: "حسابي", iconName: "User", description: "ملف الإدارة الشخصي وتخصيص الصلاحيات" },
  ],
  customer: [
    { id: "home", label: "الرئيسية", iconName: "Home", description: "الصفحة الرئيسية والمتاجر والأقسام" },
    { id: "archive", label: "طلباتي", iconName: "Clock", description: "أرشيف الطلبات الحالية والسابقة" },
    { id: "cart", label: "السلة", iconName: "ShoppingBag", description: "سلة المشتريات ومتابعة الدفع" },
    { id: "account", label: "حسابي", iconName: "User", description: "الملف الشخصي والعناوين المحفوظة" },
  ],
  guest: [
    { id: "home", label: "الرئيسية", iconName: "Home", description: "الصفحة الرئيسية والمتاجر والأقسام" },
    { id: "archive", label: "طلباتي", iconName: "Clock", description: "أرشيف الطلبات الحالية والسابقة" },
    { id: "cart", label: "السلة", iconName: "ShoppingBag", description: "سلة المشتريات ومتابعة الدفع" },
    { id: "account", label: "حسابي", iconName: "User", description: "تسجيل الدخول وإنشاء حساب" },
  ],
  store_owner: [
    { id: "orders", label: "الرئيسية", iconName: "Home", description: "الطلبات الواردة والتحضير الفوري" },
    { id: "products", label: "المنتجات", iconName: "Package", description: "إدارة الأصناف والأسعار والتوافر" },
    { id: "archive", label: "الأرشيف", iconName: "Archive", description: "سجل الطلبات المسلمة والملغاة" },
    { id: "account", label: "حسابي", iconName: "User", description: "بيانات المحل وساعات العمل" },
  ],
  driver: [
    { id: "my_orders", label: "الرئيسية", iconName: "Home", description: "الطلبات المعينة لك وقيد التوصيل" },
    { id: "available_orders", label: "طلبات متاحة", iconName: "Package", description: "الطلبات الجاهزة للاستلام بالقرية" },
    { id: "wallet", label: "محفظتي", iconName: "Wallet", description: "الأرباح والمستحقات المالية" },
    { id: "history", label: "السجل", iconName: "Clock", description: "أرشيف التوصيلات المكتملة" },
    { id: "account", label: "حسابي", iconName: "User", description: "ملف الكابتن وبيانات المركبة" },
  ]
};

// Default Admin Navigation Tabs matching AdminHeader order
export const DEFAULT_ADMIN_TABS = [
  { id: "platform_features", label: "ميزات واستطاعة المنصة والترويج", emoji: "💎", description: "استطاعة المنصة ومميزات النظام المتقدمة" },
  { id: "share", label: "نشر وتوزيع التطبيق (الإدارة)", emoji: "📢", description: "رابط ومشاركة التطبيق وكود التحميل" },
  { id: "stats", label: "الإحصائيات والأرباح", emoji: "📊", description: "التقارير اليومية والأرباح والعمولات المالية" },
  { id: "orders", label: "الطلبات النشطة والجدولة", emoji: "🕒", description: "متابعة الطلبات المباشرة وتوجيه الكباتن" },
  { id: "stores", label: "إدارة المحلات والمتاجر", emoji: "🏪", description: "اعتماد المتاجر ومتابعة قوائمها وتراخيصها" },
  { id: "products", label: "إدارة الأصناف والخيارات", emoji: "🍽️", description: "مراجعة واعتماد منتجات المتاجر" },
  { id: "archive_reports", label: "أرشيف الطلبات والتقارير المالية", emoji: "📦", description: "تصفية وسحب تقارير المبيعات الشاملة" },
  { id: "vault", label: "أرشيف بيانات الدخول (سري للإدارة)", emoji: "🔒", description: "أرشيف الباسووردات ورموز PIN الإدارية" },
  { id: "customers", label: "سجل الزبائن والمهن", emoji: "👥", description: "بيانات الزبائن المسجلين وأرقامهم وأدوارهم" },
  { id: "drivers", label: "إدارة الكباتن والمناديب", emoji: "🛵", description: "توجيه الكباتن وحسابات التوصيل الميداني" },
  { id: "driver_services", label: "خدمات السائقين والتكاسي", emoji: "🚗", description: "دليل التكاسي والسيارات الخاصة بالقرية" },
  { id: "landmarks", label: "إدارة المعالم الجغرافية", emoji: "📍", description: "المناطق والحارات ومسارات التوصيل" },
  { id: "craftsmen", label: "دليل الحرفيين وأصحاب المهن", emoji: "🛠️", description: "سباكة، كهرباء، نجارة، حدادة وصيانة" },
  { id: "doctors", label: "دليل وسجل الأطباء والعيادات", emoji: "🩺", description: "دليل العيادات والمراكز الطبية والصيدليات" },
  { id: "staff", label: "طاقم العمل وتخصيص الصلاحيات", emoji: "🔑", description: "إدارة حسابات موظفي الإدارة وصلاحياتهم" },
  { id: "logs", label: "سجل عمليات الموظفين", emoji: "📑", description: "تتبع كل تعديل أو إجراء بنظام الإدارة" },
  { id: "coupons", label: "كوبونات الخصم والترويج", emoji: "🏷️", description: "إدارة قسائم الخصم والعروض الترويجية" },
  { id: "settings", label: "الإعدادات والرسوم وباسوورد الإدارة", emoji: "⚙️", description: "تخصيص أسعار التوصيل وإعدادات التطبيق" },
];

export const ToolbarReorderModal: React.FC<ToolbarReorderModalProps> = ({
  isOpen,
  onClose,
  userRole,
  onSave,
  initialTab = "bottom_nav"
}) => {
  const [activeSection, setActiveSection] = useState<"bottom_nav" | "admin_tabs">(
    userRole === "admin" ? initialTab : "bottom_nav"
  );

  // Bottom Navigation state
  const [bottomNavItems, setBottomNavItems] = useState<NavItemConfig[]>([]);
  // Admin Tabs state
  const [adminTabs, setAdminTabs] = useState<typeof DEFAULT_ADMIN_TABS>([]);
  const [hasSaved, setHasSaved] = useState(false);

  // Load stored orders or defaults
  useEffect(() => {
    if (!isOpen) return;
    setHasSaved(false);

    // 1. Bottom Nav Items
    const defaults = DEFAULT_BOTTOM_NAV_ITEMS[userRole] || DEFAULT_BOTTOM_NAV_ITEMS.customer;
    const storedNavOrder = localStorage.getItem(`tw_bottom_nav_order_${userRole}`);
    if (storedNavOrder) {
      try {
        const orderIds: string[] = JSON.parse(storedNavOrder);
        const map = new Map(defaults.map(item => [item.id, item]));
        const ordered: NavItemConfig[] = [];
        
        // Add by saved order
        orderIds.forEach(id => {
          if (map.has(id)) {
            ordered.push(map.get(id)!);
            map.delete(id);
          }
        });
        // Append any remaining
        map.forEach(item => ordered.push(item));
        setBottomNavItems(ordered);
      } catch {
        setBottomNavItems([...defaults]);
      }
    } else {
      setBottomNavItems([...defaults]);
    }

    // 2. Admin Tabs (if admin)
    if (userRole === "admin") {
      const storedTabsOrder = localStorage.getItem("tw_admin_tabs_order");
      if (storedTabsOrder) {
        try {
          const tabIds: string[] = JSON.parse(storedTabsOrder);
          const map = new Map(DEFAULT_ADMIN_TABS.map(t => [t.id, t]));
          const ordered: typeof DEFAULT_ADMIN_TABS = [];
          tabIds.forEach(id => {
            if (map.has(id)) {
              ordered.push(map.get(id)!);
              map.delete(id);
            }
          });
          map.forEach(t => ordered.push(t));
          setAdminTabs(ordered);
        } catch {
          setAdminTabs([...DEFAULT_ADMIN_TABS]);
        }
      } else {
        setAdminTabs([...DEFAULT_ADMIN_TABS]);
      }
    }
  }, [isOpen, userRole]);

  if (!isOpen) return null;

  // Move helpers for Bottom Nav
  const moveBottomNavItem = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === bottomNavItems.length - 1)) {
      return;
    }
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...bottomNavItems];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setBottomNavItems(updated);
  };

  const makeFirstBottomNavItem = (index: number) => {
    if (index === 0) return;
    const updated = [...bottomNavItems];
    const [moved] = updated.splice(index, 1);
    updated.unshift(moved);
    setBottomNavItems(updated);
  };

  // Move helpers for Admin Tabs
  const moveAdminTab = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === adminTabs.length - 1)) {
      return;
    }
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...adminTabs];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setAdminTabs(updated);
  };

  const makeFirstAdminTab = (index: number) => {
    if (index === 0) return;
    const updated = [...adminTabs];
    const [moved] = updated.splice(index, 1);
    updated.unshift(moved);
    setAdminTabs(updated);
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (activeSection === "bottom_nav") {
      const defaults = DEFAULT_BOTTOM_NAV_ITEMS[userRole] || DEFAULT_BOTTOM_NAV_ITEMS.customer;
      setBottomNavItems([...defaults]);
      localStorage.removeItem(`tw_bottom_nav_order_${userRole}`);
      window.dispatchEvent(new CustomEvent("tw_bottom_nav_order_updated"));
    } else {
      setAdminTabs([...DEFAULT_ADMIN_TABS]);
      localStorage.removeItem("tw_admin_tabs_order");
      window.dispatchEvent(new CustomEvent("tw_admin_tabs_order_updated"));
    }
    setHasSaved(true);
    setTimeout(() => setHasSaved(false), 2000);
  };

  // Save changes
  const handleSave = () => {
    if (activeSection === "bottom_nav") {
      const orderIds = bottomNavItems.map(i => i.id);
      localStorage.setItem(`tw_bottom_nav_order_${userRole}`, JSON.stringify(orderIds));
      window.dispatchEvent(new CustomEvent("tw_bottom_nav_order_updated", { detail: { order: orderIds } }));
      if (onSave) onSave(orderIds);
    } else {
      const tabIds = adminTabs.map(t => t.id);
      localStorage.setItem("tw_admin_tabs_order", JSON.stringify(tabIds));
      window.dispatchEvent(new CustomEvent("tw_admin_tabs_order_updated", { detail: { order: tabIds } }));
    }
    setHasSaved(true);
    setTimeout(() => {
      setHasSaved(false);
      onClose();
    }, 600);
  };

  const renderIcon = (name: string, className = "w-5 h-5") => {
    switch (name) {
      case "Home": return <Home className={className} />;
      case "Package": return <Package className={className} />;
      case "StoreIcon": return <StoreIcon className={className} />;
      case "User": return <User className={className} />;
      case "Clock": return <Clock className={className} />;
      case "ShoppingBag": return <ShoppingBag className={className} />;
      case "Archive": return <Archive className={className} />;
      case "Wallet": return <Wallet className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      dir="rtl"
    >
      <div 
        className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                تخصيص وترتيب شريط الأدوات 🎛️
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                ضع الأيقونة الأكثر أهمية لك في البداية لتصل إليها بنقرة واحدة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Switcher Tabs (If Admin) */}
        {userRole === "admin" && (
          <div className="p-2.5 bg-slate-100 border-b border-slate-200 grid grid-cols-2 gap-1.5 text-xs font-black">
            <button
              type="button"
              onClick={() => setActiveSection("bottom_nav")}
              className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSection === "bottom_nav"
                  ? "bg-white text-orange-600 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>شريط الأدوات السفلي 📱</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("admin_tabs")}
              className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSection === "admin_tabs"
                  ? "bg-white text-purple-700 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>شريط تبويبات الإدارة 📊</span>
            </button>
          </div>
        )}

        {/* Notice Banner */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2 text-[11px] font-bold text-amber-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              {activeSection === "bottom_nav"
                ? "الأيقونة برقم (1) ستظهر في البداية (أقصى اليمين) بشريط التنقل السفلي."
                : "الأيقونة برقم (1) ستظهر أولاً على اليمين بشريط التبويبات تحت تجميد الطلبات."}
            </span>
          </div>
          <span className="text-[10px] bg-amber-200/80 px-2 py-0.5 rounded-full font-black text-amber-900 shrink-0">
            {activeSection === "bottom_nav" ? `${bottomNavItems.length} أيقونات` : `${adminTabs.length} تبويب`}
          </span>
        </div>

        {/* Quick 1-Click Presets for Admin Tabs */}
        {activeSection === "admin_tabs" && (
          <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none touch-pan-x">
            <span className="text-[10px] font-black text-slate-500 shrink-0">تقديم بنقرة واحدة:</span>
            <button
              type="button"
              onClick={() => {
                const idx = adminTabs.findIndex(t => t.id === "platform_features");
                if (idx > -1) makeFirstAdminTab(idx);
              }}
              className="px-2 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-[10px] font-black shrink-0 transition-all cursor-pointer active:scale-95"
            >
              💎 ميزات التطبيق أولاً
            </button>
            <button
              type="button"
              onClick={() => {
                const idx = adminTabs.findIndex(t => t.id === "share");
                if (idx > -1) makeFirstAdminTab(idx);
              }}
              className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-[10px] font-black shrink-0 transition-all cursor-pointer active:scale-95"
            >
              📢 نشر التطبيق أولاً
            </button>
            <button
              type="button"
              onClick={() => {
                const idx = adminTabs.findIndex(t => t.id === "stats");
                if (idx > -1) makeFirstAdminTab(idx);
              }}
              className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-[10px] font-black shrink-0 transition-all cursor-pointer active:scale-95"
            >
              📊 الإحصائيات أولاً
            </button>
            <button
              type="button"
              onClick={() => {
                const idx = adminTabs.findIndex(t => t.id === "orders");
                if (idx > -1) makeFirstAdminTab(idx);
              }}
              className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-black shrink-0 transition-all cursor-pointer active:scale-95"
            >
              🕒 الطلبات أولاً
            </button>
            <button
              type="button"
              onClick={() => {
                const idx = adminTabs.findIndex(t => t.id === "stores");
                if (idx > -1) makeFirstAdminTab(idx);
              }}
              className="px-2 py-1 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-[10px] font-black shrink-0 transition-all cursor-pointer active:scale-95"
            >
              🏪 المتاجر أولاً
            </button>
          </div>
        )}

        {/* Items List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 divide-y divide-slate-100">
          {activeSection === "bottom_nav" ? (
            bottomNavItems.map((item, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === bottomNavItems.length - 1;

              return (
                <div
                  key={item.id}
                  className={`pt-2.5 first:pt-0 flex items-center justify-between gap-2.5 p-3 rounded-2xl border transition-all ${
                    isFirst 
                      ? "bg-gradient-to-r from-orange-50 via-amber-50/50 to-white border-orange-300 shadow-xs ring-1 ring-orange-400/20"
                      : "bg-slate-50/80 hover:bg-slate-100/80 border-slate-200"
                  }`}
                >
                  {/* Left: Position & Icon & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Position Number */}
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      isFirst 
                        ? "bg-orange-600 text-white shadow-sm shadow-orange-600/30" 
                        : "bg-slate-200 text-slate-700"
                    }`}>
                      {idx + 1}
                    </div>

                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isFirst 
                        ? "bg-orange-100 text-orange-600" 
                        : "bg-white text-slate-600 border border-slate-200"
                    }`}>
                      {renderIcon(item.iconName)}
                    </div>

                    {/* Labels */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {item.label}
                        </span>
                        {isFirst && (
                          <span className="px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[9px] font-black shrink-0">
                            الأول في البداية ⭐
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Reorder Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!isFirst && (
                      <button
                        type="button"
                        onClick={() => makeFirstBottomNavItem(idx)}
                        className="py-1 px-2 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-700 text-[10px] font-black cursor-pointer transition-all active:scale-95 border border-orange-200"
                        title="جعل هذه الأيقونة في البداية أولاً"
                      >
                        الأول 🔝
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => moveBottomNavItem(idx, "up")}
                      className="w-8 h-8 rounded-xl bg-white hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-white text-slate-700 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed border border-slate-200 shadow-xs transition-all active:scale-90"
                      title="تقديم للأمام (نحو البداية)"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => moveBottomNavItem(idx, "down")}
                      className="w-8 h-8 rounded-xl bg-white hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-white text-slate-700 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed border border-slate-200 shadow-xs transition-all active:scale-90"
                      title="تأخير للخلف"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            adminTabs.map((tab, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === adminTabs.length - 1;

              return (
                <div
                  key={tab.id}
                  className={`pt-2.5 first:pt-0 flex items-center justify-between gap-2.5 p-3 rounded-2xl border transition-all ${
                    isFirst 
                      ? "bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white border-purple-300 shadow-xs ring-1 ring-purple-400/20"
                      : "bg-slate-50/80 hover:bg-slate-100/80 border-slate-200"
                  }`}
                >
                  {/* Left: Position & Emoji & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      isFirst 
                        ? "bg-purple-600 text-white shadow-sm shadow-purple-600/30" 
                        : "bg-slate-200 text-slate-700"
                    }`}>
                      {idx + 1}
                    </div>

                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                      isFirst 
                        ? "bg-purple-100 text-purple-700" 
                        : "bg-white border border-slate-200"
                    }`}>
                      <span>{tab.emoji}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {tab.label}
                        </span>
                        {isFirst && (
                          <span className="px-1.5 py-0.5 rounded-full bg-purple-600 text-white text-[9px] font-black shrink-0">
                            القسم الأول 🌟
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                        {tab.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!isFirst && (
                      <button
                        type="button"
                        onClick={() => makeFirstAdminTab(idx)}
                        className="py-1 px-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 text-[10px] font-black cursor-pointer transition-all active:scale-95 border border-purple-200"
                        title="جعل هذا القسم في بداية لوحة الإدارة"
                      >
                        الأول 🔝
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => moveAdminTab(idx, "up")}
                      className="w-8 h-8 rounded-xl bg-white hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-white text-slate-700 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed border border-slate-200 shadow-xs transition-all active:scale-90"
                      title="تقديم للأمام"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => moveAdminTab(idx, "down")}
                      className="w-8 h-8 rounded-xl bg-white hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-white text-slate-700 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed border border-slate-200 shadow-xs transition-all active:scale-90"
                      title="تأخير للخلف"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Live Preview Box */}
        {activeSection === "bottom_nav" ? (
          <div className="bg-slate-100/90 border-t border-slate-200 p-3 select-none">
            <div className="flex items-center justify-between text-[11px] font-black text-slate-650 mb-1.5 px-1">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-orange-500" />
                <span>معاينة حية لشريط الأدوات كما سيظهر أسفل الشاشة:</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">(من اليمين لليسار)</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-300/80 p-1.5 flex items-center justify-around shadow-sm">
              {bottomNavItems.map((item, i) => (
                <div 
                  key={item.id} 
                  className={`flex flex-col items-center justify-center p-1 rounded-xl min-w-[50px] transition-all ${
                    i === 0 ? "text-orange-600 font-black scale-105" : "text-slate-500 font-bold"
                  }`}
                >
                  <div className="relative">
                    {renderIcon(item.iconName, "w-4 h-4")}
                    {i === 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-600 animate-ping" />
                    )}
                  </div>
                  <span className="text-[9px] mt-0.5 leading-tight truncate max-w-[55px]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-100/90 border-t border-slate-200 p-3 select-none">
            <div className="flex items-center justify-between text-[11px] font-black text-slate-750 mb-1.5 px-1">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-purple-600" />
                <span>معاينة حية لشريط الإدارة (الأيقونة #1 ستكون في البداية على اليمين):</span>
              </span>
              <span className="text-[10px] text-slate-500 font-bold">اسحب أفقيًا للمعاينة ➔</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-300/80 p-2 flex items-center gap-1.5 overflow-x-auto shadow-sm scrollbar-none touch-pan-x">
              {adminTabs.map((tab, i) => (
                <div
                  key={tab.id}
                  className={`whitespace-nowrap px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 transition-all ${
                    i === 0
                      ? "bg-purple-600 text-white shadow-sm ring-2 ring-purple-400/40"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span className="text-[11px] truncate max-w-[140px]">{tab.label}</span>
                  {i === 0 && (
                    <span className="text-[9px] bg-purple-700/80 text-purple-100 px-1 py-0.2 rounded font-mono">
                      #1 الأول
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-200 p-3 sm:p-4 flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 border border-slate-200"
            title="إعادة الترتيب إلى الإعدادات الافتراضية"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden xs:inline">الافتراضي</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all active:scale-95"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/25 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4 text-white" />
              <span>{hasSaved ? "تم الحفظ بنجاح! ✓" : "حفظ وتطبيق الترتيب"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
