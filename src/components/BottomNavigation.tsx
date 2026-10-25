import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { 
  Home, 
  User, 
  ShoppingBag, 
  Clock, 
  Store as StoreIcon, 
  Package, 
  Archive, 
  Bike, 
  ShieldCheck, 
  Wallet,
  SlidersHorizontal
} from "lucide-react";
import { ToolbarReorderModal, DEFAULT_BOTTOM_NAV_ITEMS } from "./ToolbarReorderModal";

interface BottomNavigationProps {
  userRole: "customer" | "store_owner" | "driver" | "admin" | "guest";
  activeTab?: string;
  onNavigateHome: () => void;
  onOpenAccount: () => void;
  onOpenOrdersArchive?: () => void;
  onOpenCart?: () => void;
  onSelectRoleTab?: (tab: string) => void;
  cartCount?: number;
  activeOrdersCount?: number;
  userName?: string;
  userAvatar?: string;
  isBrowsingAsCustomer?: boolean;
  portalRole?: "admin" | "driver" | "store_owner";
  portalLabel?: string;
  onReturnToPortal?: () => void;
  onOpenToolbarReorder?: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  userRole,
  activeTab = "home",
  onNavigateHome,
  onOpenAccount,
  onOpenOrdersArchive,
  onOpenCart,
  onSelectRoleTab,
  cartCount = 0,
  activeOrdersCount = 0,
  userName,
  userAvatar,
  isBrowsingAsCustomer = false,
  portalRole,
  portalLabel,
  onReturnToPortal,
  onOpenToolbarReorder,
}) => {
  const [showReorderModal, setShowReorderModal] = useState(false);

  // Load custom order of navigation item IDs
  const [navOrder, setNavOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`tw_bottom_nav_order_${userRole}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem(`tw_bottom_nav_order_${userRole}`);
        if (saved) {
          setNavOrder(JSON.parse(saved));
        } else {
          setNavOrder([]);
        }
      } catch {}
    };
    window.addEventListener("tw_bottom_nav_order_updated", handleUpdate);
    return () => window.removeEventListener("tw_bottom_nav_order_updated", handleUpdate);
  }, [userRole]);

  // Helper to order a dictionary of elements according to navOrder
  const sortNavElements = (elementsMap: Record<string, React.ReactNode>, defaultOrder: string[]) => {
    const effectiveOrder = navOrder.length > 0 ? navOrder : defaultOrder;
    const ordered: React.ReactNode[] = [];
    const used = new Set<string>();

    // 1. Add matching items in user's preferred order
    effectiveOrder.forEach((id) => {
      if (elementsMap[id]) {
        ordered.push(elementsMap[id]);
        used.add(id);
      }
    });

    // 2. Append any remaining default items not in navOrder
    defaultOrder.forEach((id) => {
      if (!used.has(id) && elementsMap[id]) {
        ordered.push(elementsMap[id]);
        used.add(id);
      }
    });

    return ordered;
  };

  // Render navigation buttons based on user role and customized order
  const renderNavButtons = () => {
    // -------------------------------------------------------------------------
    // 1. STORE OWNER
    // -------------------------------------------------------------------------
    if (userRole === "store_owner") {
      const defaultOrder = ["orders", "products", "archive", "account"];
      const elementsMap: Record<string, React.ReactNode> = {
        orders: (
          <button
            key="orders"
            type="button"
            onClick={() => {
              if (onSelectRoleTab) onSelectRoleTab("orders");
              onNavigateHome();
            }}
            className={`relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "orders" || activeTab === "home"
                ? "text-orange-600 font-black"
                : "text-slate-500 hover:text-slate-800 font-bold"
            }`}
          >
            <div className="relative">
              <Home className={`w-5 h-5 ${activeTab === "orders" || activeTab === "home" ? "text-orange-600 scale-110" : "text-slate-500"}`} />
              {activeOrdersCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.85)] ring-2 ring-white">
                  {activeOrdersCount}
                </span>
              )}
            </div>
            <span className="text-[10px] truncate max-w-[65px]">الرئيسية</span>
            {(activeTab === "orders" || activeTab === "home") && (
              <motion.div layoutId="nav_dot" className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-0.5" />
            )}
          </button>
        ),
        products: (
          <button
            key="products"
            type="button"
            onClick={() => onSelectRoleTab && onSelectRoleTab("products")}
            className={`relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "products"
                ? "text-orange-600 font-black"
                : "text-slate-500 hover:text-slate-800 font-bold"
            }`}
          >
            <Package className={`w-5 h-5 ${activeTab === "products" ? "text-orange-600 scale-110" : "text-slate-500"}`} />
            <span className="text-[10px] truncate max-w-[65px]">المنتجات</span>
            {activeTab === "products" && (
              <motion.div layoutId="nav_dot" className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-0.5" />
            )}
          </button>
        ),
        archive: (
          <button
            key="archive"
            type="button"
            onClick={() => onSelectRoleTab && onSelectRoleTab("archive")}
            className={`relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "archive"
                ? "text-orange-600 font-black"
                : "text-slate-500 hover:text-slate-800 font-bold"
            }`}
          >
            <Archive className={`w-5 h-5 ${activeTab === "archive" ? "text-orange-600 scale-110" : "text-slate-500"}`} />
            <span className="text-[10px] truncate max-w-[65px]">الأرشيف</span>
            {activeTab === "archive" && (
              <motion.div layoutId="nav_dot" className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-0.5" />
            )}
          </button>
        ),
        account: (
          <button
            key="account"
            type="button"
            onClick={onOpenAccount}
            className="relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl text-slate-700 hover:text-orange-600 font-bold transition-all cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors overflow-hidden border border-orange-200">
              {userAvatar ? (
                <img src={userAvatar} alt={userName || "حسابي"} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <span className="text-[10px] font-black truncate max-w-[65px]">حسابي</span>
          </button>
        )
      };

      return sortNavElements(elementsMap, defaultOrder);
    }

    // -------------------------------------------------------------------------
    // 2. DELIVERY DRIVER / CAPTAIN
    // -------------------------------------------------------------------------
    if (userRole === "driver") {
      const defaultOrder = ["my_orders", "available_orders", "wallet", "history", "account"];
      const elementsMap: Record<string, React.ReactNode> = {
        my_orders: (
          <button
            key="my_orders"
            type="button"
            onClick={() => {
              if (onSelectRoleTab) onSelectRoleTab("my_orders");
              onNavigateHome();
            }}
            className={`relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "my_orders" || activeTab === "home"
                ? "text-emerald-600 font-black"
                : "text-slate-500 hover:text-slate-800 font-bold"
            }`}
          >
            <div className="relative">
              <Home className={`w-5 h-5 ${activeTab === "my_orders" || activeTab === "home" ? "text-emerald-600 scale-110" : "text-slate-500"}`} />
              {activeOrdersCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-xs">
                  {activeOrdersCount}
                </span>
              )}
            </div>
            <span className="text-[10px] truncate max-w-[65px]">الرئيسية</span>
            {(activeTab === "my_orders" || activeTab === "home") && (
              <motion.div layoutId="nav_dot_driver" className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5" />
            )}
          </button>
        ),
        available_orders: (
          <button
            key="available_orders"
            type="button"
            onClick={() => onSelectRoleTab && onSelectRoleTab("available_orders")}
            className={`relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "available_orders"
                ? "text-emerald-600 font-black"
                : "text-slate-500 hover:text-slate-800 font-bold"
            }`}
          >
            <Package className={`w-5 h-5 ${activeTab === "available_orders" ? "text-emerald-600 scale-110" : "text-slate-500"}`} />
            <span className="text-[10px] truncate max-w-[65px]">طلبات متاحة</span>
            {activeTab === "available_orders" && (
              <motion.div layoutId="nav_dot_driver" className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5" />
            )}
          </button>
        ),
        wallet: (
          <button
            key="wallet"
            type="button"
            onClick={() => onSelectRoleTab && onSelectRoleTab("wallet")}
            className={`relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "wallet"
                ? "text-emerald-600 font-black"
                : "text-slate-500 hover:text-slate-800 font-bold"
            }`}
          >
            <Wallet className={`w-5 h-5 ${activeTab === "wallet" ? "text-emerald-600 scale-110" : "text-slate-500"}`} />
            <span className="text-[10px] truncate max-w-[65px]">محفظتي</span>
            {activeTab === "wallet" && (
              <motion.div layoutId="nav_dot_driver" className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5" />
            )}
          </button>
        ),
        history: (
          <button
            key="history"
            type="button"
            onClick={() => onSelectRoleTab && onSelectRoleTab("history")}
            className={`relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "history"
                ? "text-emerald-600 font-black"
                : "text-slate-500 hover:text-slate-800 font-bold"
            }`}
          >
            <Clock className={`w-5 h-5 ${activeTab === "history" ? "text-emerald-600 scale-110" : "text-slate-500"}`} />
            <span className="text-[10px] truncate max-w-[65px]">السجل</span>
            {activeTab === "history" && (
              <motion.div layoutId="nav_dot_driver" className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5" />
            )}
          </button>
        ),
        account: (
          <button
            key="account"
            type="button"
            onClick={onOpenAccount}
            className="relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl text-slate-700 hover:text-emerald-600 font-bold transition-all cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors overflow-hidden border border-emerald-200">
              {userAvatar ? (
                <img src={userAvatar} alt={userName || "حسابي"} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <span className="text-[10px] font-black truncate max-w-[65px]">حسابي</span>
          </button>
        )
      };

      return sortNavElements(elementsMap, defaultOrder);
    }

    // -------------------------------------------------------------------------
    // 3. ADMIN / MANAGEMENT (المدير العام وكادر الإدارة)
    // -------------------------------------------------------------------------
    if (userRole === "admin") {
      const defaultOrder = ["home", "orders", "stores", "account"];
      const elementsMap: Record<string, React.ReactNode> = {
        home: (
          <button
            key="home"
            type="button"
            onClick={() => {
              if (onSelectRoleTab) onSelectRoleTab("stats");
              onNavigateHome();
            }}
            className={`relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "stats" || activeTab === "home"
                ? "text-purple-600 font-black"
                : "text-slate-500 hover:text-slate-800 font-bold"
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === "stats" || activeTab === "home" ? "text-purple-600 scale-110" : "text-slate-500"}`} />
            <span className="text-[10px] truncate max-w-[65px]">الرئيسية</span>
            {(activeTab === "stats" || activeTab === "home") && (
              <motion.div layoutId="nav_dot_admin" className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-0.5" />
            )}
          </button>
        ),
        orders: (
          <button
            key="orders"
            type="button"
            onClick={() => onSelectRoleTab && onSelectRoleTab("orders")}
            className={`relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "orders"
                ? "text-purple-600 font-black"
                : "text-slate-500 hover:text-slate-800 font-bold"
            }`}
          >
            <div className="relative">
              <Package className={`w-5 h-5 ${activeTab === "orders" ? "text-purple-600 scale-110" : "text-slate-500"}`} />
              {activeOrdersCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_12px_rgba(168,85,247,0.9)] ring-2 ring-white">
                  {activeOrdersCount}
                </span>
              )}
            </div>
            <span className="text-[10px] truncate max-w-[65px]">الطلبات</span>
            {activeTab === "orders" && (
              <motion.div layoutId="nav_dot_admin" className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-0.5" />
            )}
          </button>
        ),
        stores: (
          <button
            key="stores"
            type="button"
            onClick={() => onSelectRoleTab && onSelectRoleTab("stores")}
            className={`relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "stores"
                ? "text-purple-600 font-black"
                : "text-slate-500 hover:text-slate-800 font-bold"
            }`}
          >
            <StoreIcon className={`w-5 h-5 ${activeTab === "stores" ? "text-purple-600 scale-110" : "text-slate-500"}`} />
            <span className="text-[10px] truncate max-w-[65px]">المتاجر</span>
            {activeTab === "stores" && (
              <motion.div layoutId="nav_dot_admin" className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-0.5" />
            )}
          </button>
        ),
        account: (
          <button
            key="account"
            type="button"
            onClick={onOpenAccount}
            className="relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl text-slate-700 hover:text-purple-600 font-bold transition-all cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors overflow-hidden border border-purple-200">
              {userAvatar ? (
                <img src={userAvatar} alt={userName || "حسابي"} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <span className="text-[10px] font-black truncate max-w-[65px]">حسابي</span>
          </button>
        )
      };

      return sortNavElements(elementsMap, defaultOrder);
    }

    // -------------------------------------------------------------------------
    // 4. CUSTOMER VIEW & GUEST (الزبائن والمتسوقين)
    // -------------------------------------------------------------------------
    const defaultOrder = ["home", "archive", "cart", "account"];
    const elementsMap: Record<string, React.ReactNode> = {
      home: (
        <button
          key="home"
          type="button"
          onClick={() => {
            if (onNavigateHome) onNavigateHome();
            if (onSelectRoleTab) onSelectRoleTab("home");
          }}
          className={`relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "home"
              ? "text-orange-600 font-black"
              : "text-slate-500 hover:text-slate-800 font-bold"
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === "home" ? "text-orange-600 scale-110" : "text-slate-500"}`} />
          <span className="text-[10px] truncate max-w-[65px]">الرئيسية</span>
          {activeTab === "home" && (
            <motion.div layoutId="nav_dot_cust" className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-0.5" />
          )}
        </button>
      ),
      archive: (
        <button
          key="archive"
          type="button"
          onClick={() => {
            if (onOpenOrdersArchive) {
              onOpenOrdersArchive();
            } else if (onSelectRoleTab) {
              onSelectRoleTab("orders");
            }
          }}
          className={`relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "archive" || activeTab === "orders"
              ? "text-orange-600 font-black"
              : "text-slate-500 hover:text-slate-800 font-bold"
          }`}
        >
          <div className="relative">
            <Clock className={`w-5 h-5 ${activeTab === "archive" || activeTab === "orders" ? "text-orange-600 scale-110" : "text-slate-500"}`} />
            {activeOrdersCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.85)] ring-2 ring-white">
                {activeOrdersCount}
              </span>
            )}
          </div>
          <span className="text-[10px] truncate max-w-[65px]">طلباتي</span>
          {(activeTab === "archive" || activeTab === "orders") && (
            <motion.div layoutId="nav_dot_cust" className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-0.5" />
          )}
        </button>
      ),
      cart: (
        <button
          key="cart"
          type="button"
          onClick={() => {
            if (onOpenCart) {
              onOpenCart();
            } else if (onSelectRoleTab) {
              onSelectRoleTab("cart");
            }
          }}
          className={`relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "cart"
              ? "text-orange-600 font-black"
              : "text-slate-500 hover:text-slate-800 font-bold"
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 ${activeTab === "cart" ? "text-orange-600 scale-110" : "text-slate-500"}`} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] truncate max-w-[65px]">السلة</span>
          {activeTab === "cart" && (
            <motion.div layoutId="nav_dot_cust" className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-0.5" />
          )}
        </button>
      ),
      account: (
        <button
          key="account"
          type="button"
          onClick={onOpenAccount}
          className="relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl text-slate-700 hover:text-orange-600 font-bold transition-all cursor-pointer group"
        >
          <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors overflow-hidden border border-orange-200">
            {userAvatar ? (
              <img src={userAvatar} alt={userName || "حسابي"} className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <span className="text-[10px] font-black truncate max-w-[65px]">حسابي</span>
        </button>
      )
    };

    // If browsing as customer from a management portal, insert return portal button
    if (isBrowsingAsCustomer && onReturnToPortal) {
      elementsMap["return_portal"] = (
        <button
          key="return_portal"
          type="button"
          onClick={onReturnToPortal}
          className={`relative flex-1 py-1.5 px-1 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all cursor-pointer group active:scale-95 border ${
            portalRole === "admin"
              ? "bg-gradient-to-b from-purple-50 to-indigo-50/70 border-purple-300 text-purple-800 shadow-xs"
              : portalRole === "driver"
              ? "bg-gradient-to-b from-blue-50 to-emerald-50/70 border-blue-300 text-blue-800 shadow-xs"
              : "bg-gradient-to-b from-emerald-50 to-teal-50/70 border-emerald-300 text-emerald-800 shadow-xs"
          }`}
          title={portalLabel || "العودة المباشرة إلى لوحة العمل"}
        >
          <div className="relative">
            {portalRole === "admin" ? (
              <ShieldCheck className="w-5 h-5 text-purple-600 animate-pulse" />
            ) : portalRole === "driver" ? (
              <Bike className="w-5 h-5 text-blue-600 animate-pulse" />
            ) : (
              <StoreIcon className="w-5 h-5 text-emerald-600 animate-pulse" />
            )}
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </div>
          <span className="text-[9.5px] font-black truncate max-w-[70px] text-center leading-tight">
            {portalLabel || (portalRole === "admin" ? "لوحة مهامي 🛡️" : portalRole === "driver" ? "لوحة الكابتن 🚴" : "إدارة متجري 🏪")}
          </span>
        </button>
      );
      defaultOrder.splice(2, 0, "return_portal");
    }

    return sortNavElements(elementsMap, defaultOrder);
  };

  const handleOpenReorder = () => {
    if (onOpenToolbarReorder) {
      onOpenToolbarReorder();
    } else {
      setShowReorderModal(true);
    }
  };

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
        dir="rtl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <nav className="max-w-md mx-auto px-1.5 sm:px-2 py-1.5 sm:py-2 flex items-center justify-around relative">
          {renderNavButtons()}

          {/* Quick Customization Button: Allows user to reorder toolbar icons on the fly */}
          <button
            type="button"
            onClick={handleOpenReorder}
            className="p-1 sm:p-1.5 rounded-xl text-slate-400 hover:text-orange-600 hover:bg-orange-50 active:scale-90 transition-all cursor-pointer shrink-0 ml-0.5 border border-transparent hover:border-orange-200 flex items-center justify-center"
            title="تخصيص وترتيب شريط الأدوات (ضع الأيقونة الأهم في البداية 🎛️)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </nav>
      </div>

      {/* Internal Toolbar Customizer Modal */}
      {showReorderModal && (
        <ToolbarReorderModal
          isOpen={showReorderModal}
          onClose={() => setShowReorderModal(false)}
          userRole={userRole}
          initialTab="bottom_nav"
        />
      )}
    </>
  );
};
