import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { playOrderAlertSound } from "../utils/soundNotifications";

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
  pendingStoresCount?: number;
  pendingProductsCount?: number;
  availableOrdersCount?: number;
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
  pendingStoresCount = 0,
  pendingProductsCount = 0,
  availableOrdersCount = 0,
  userName,
  userAvatar,
  isBrowsingAsCustomer = false,
  portalRole,
  portalLabel,
  onReturnToPortal,
  onOpenToolbarReorder,
}) => {
  const [showReorderModal, setShowReorderModal] = useState(false);

  // Sound Alerts upon activity arrivals (new active order, new available order, cart addition)
  const prevActiveOrdersRef = useRef(activeOrdersCount);
  const prevAvailableOrdersRef = useRef(availableOrdersCount);
  const prevPendingStoresRef = useRef(pendingStoresCount);

  useEffect(() => {
    if (activeOrdersCount > (prevActiveOrdersRef.current || 0)) {
      playOrderAlertSound("ringtone");
    }
    prevActiveOrdersRef.current = activeOrdersCount;
  }, [activeOrdersCount]);

  useEffect(() => {
    if (availableOrdersCount > (prevAvailableOrdersRef.current || 0)) {
      playOrderAlertSound("ringtone");
    }
    prevAvailableOrdersRef.current = availableOrdersCount;
  }, [availableOrdersCount]);

  useEffect(() => {
    if (pendingStoresCount > (prevPendingStoresRef.current || 0)) {
      playOrderAlertSound("chime");
    }
    prevPendingStoresRef.current = pendingStoresCount;
  }, [pendingStoresCount]);

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
      const hasStoreOrdersActivity = (activeOrdersCount || 0) > 0;

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
              activeTab === "orders" || activeTab === "home" || hasStoreOrdersActivity
                ? "text-orange-600 font-black"
                : "text-slate-500 hover:text-slate-800 font-bold"
            }`}
          >
            <div className="relative">
              <div className={`p-1 rounded-xl transition-all ${
                hasStoreOrdersActivity
                  ? "bg-gradient-to-br from-orange-500/20 to-amber-500/25 text-orange-600 ring-2 ring-orange-500/60 shadow-[0_0_14px_rgba(249,115,22,0.45)] animate-pulse"
                  : ""
              }`}>
                <Home className={`w-5 h-5 ${hasStoreOrdersActivity || activeTab === "orders" || activeTab === "home" ? "text-orange-600 scale-110" : "text-slate-500"}`} />
              </div>
              {hasStoreOrdersActivity && (
                <span className="absolute -top-1 -right-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center animate-bounce shadow-md ring-2 ring-white">
                  {activeOrdersCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] truncate max-w-[65px] ${hasStoreOrdersActivity ? "text-orange-700 font-black" : ""}`}>
              الرئيسية {hasStoreOrdersActivity ? "🔔" : ""}
            </span>
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
      const hasMyOrdersActivity = (activeOrdersCount || 0) > 0;
      const hasAvailableActivity = (availableOrdersCount || 0) > 0;

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
              activeTab === "my_orders" || activeTab === "home" || hasMyOrdersActivity
                ? "text-emerald-600 font-black"
                : "text-slate-500 hover:text-slate-800 font-bold"
            }`}
          >
            <div className="relative">
              <div className={`p-1 rounded-xl transition-all ${
                hasMyOrdersActivity
                  ? "bg-gradient-to-br from-teal-500/20 to-emerald-500/25 text-teal-600 ring-2 ring-teal-500/60 shadow-[0_0_14px_rgba(20,184,166,0.45)] animate-pulse"
                  : ""
              }`}>
                <Home className={`w-5 h-5 ${hasMyOrdersActivity || activeTab === "my_orders" || activeTab === "home" ? "text-emerald-600 scale-110" : "text-slate-500"}`} />
              </div>
              {hasMyOrdersActivity && (
                <span className="absolute -top-1 -right-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center animate-bounce shadow-md ring-2 ring-white">
                  {activeOrdersCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] truncate max-w-[65px] ${hasMyOrdersActivity ? "text-teal-700 font-black" : ""}`}>
              مهامي {hasMyOrdersActivity ? "🛵" : ""}
            </span>
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
              activeTab === "available_orders" || hasAvailableActivity
                ? "text-emerald-600 font-black"
                : "text-slate-500 hover:text-slate-800 font-bold"
            }`}
          >
            <div className="relative">
              <div className={`p-1 rounded-xl transition-all ${
                hasAvailableActivity
                  ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/25 text-emerald-600 ring-2 ring-emerald-500/60 shadow-[0_0_14px_rgba(16,185,129,0.45)] animate-pulse"
                  : ""
              }`}>
                <Package className={`w-5 h-5 ${hasAvailableActivity || activeTab === "available_orders" ? "text-emerald-600 scale-110" : "text-slate-500"}`} />
              </div>
              {hasAvailableActivity && (
                <span className="absolute -top-1 -right-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center animate-bounce shadow-md ring-2 ring-white">
                  {availableOrdersCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] truncate max-w-[65px] ${hasAvailableActivity ? "text-emerald-700 font-black" : ""}`}>
              طلبات متاحة {hasAvailableActivity ? "⚡" : ""}
            </span>
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
      const hasAdminOrdersActivity = (activeOrdersCount || 0) > 0;
      const hasStoresPendingActivity = (pendingStoresCount || 0) > 0;

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
              activeTab === "orders" || hasAdminOrdersActivity
                ? "text-emerald-600 font-black"
                : "text-slate-500 hover:text-slate-800 font-bold"
            }`}
          >
            <div className="relative">
              <div className={`p-1 rounded-xl transition-all ${
                hasAdminOrdersActivity
                  ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/25 text-emerald-600 ring-2 ring-emerald-500/60 shadow-[0_0_16px_rgba(16,185,129,0.5)] animate-pulse"
                  : ""
              }`}>
                <Package className={`w-5 h-5 ${hasAdminOrdersActivity || activeTab === "orders" ? "text-emerald-600 scale-110" : "text-slate-500"}`} />
              </div>
              {hasAdminOrdersActivity && (
                <span className="absolute -top-1 -right-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center animate-bounce shadow-md ring-2 ring-white">
                  {activeOrdersCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] truncate max-w-[65px] ${hasAdminOrdersActivity ? "text-emerald-700 font-black" : ""}`}>
              الطلبات {hasAdminOrdersActivity ? "🔔" : ""}
            </span>
            {activeTab === "orders" && (
              <motion.div layoutId="nav_dot_admin" className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5" />
            )}
          </button>
        ),
        stores: (
          <button
            key="stores"
            type="button"
            onClick={() => onSelectRoleTab && onSelectRoleTab("stores")}
            className={`relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "stores" || hasStoresPendingActivity
                ? "text-amber-600 font-black"
                : "text-slate-500 hover:text-slate-800 font-bold"
            }`}
          >
            <div className="relative">
              <div className={`p-1 rounded-xl transition-all ${
                hasStoresPendingActivity
                  ? "bg-gradient-to-br from-amber-500/20 to-orange-500/25 text-amber-600 ring-2 ring-amber-500/60 shadow-[0_0_14px_rgba(245,158,11,0.45)] animate-pulse"
                  : ""
              }`}>
                <StoreIcon className={`w-5 h-5 ${hasStoresPendingActivity || activeTab === "stores" ? "text-amber-600 scale-110" : "text-slate-500"}`} />
              </div>
              {hasStoresPendingActivity && (
                <span className="absolute -top-1 -right-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center animate-pulse shadow-md ring-2 ring-white">
                  {pendingStoresCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] truncate max-w-[65px] ${hasStoresPendingActivity ? "text-amber-700 font-black" : ""}`}>
              المتاجر {hasStoresPendingActivity ? "⏳" : ""}
            </span>
            {activeTab === "stores" && (
              <motion.div layoutId="nav_dot_admin" className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-0.5" />
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
    const hasCustomerOrdersActivity = (activeOrdersCount || 0) > 0;
    const hasCartItemsActivity = (cartCount || 0) > 0;

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
            activeTab === "archive" || activeTab === "orders" || hasCustomerOrdersActivity
              ? "text-emerald-600 font-black"
              : "text-slate-500 hover:text-slate-800 font-bold"
          }`}
        >
          <div className="relative">
            <div className={`p-1 rounded-xl transition-all ${
              hasCustomerOrdersActivity
                ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/25 text-emerald-600 ring-2 ring-emerald-500/60 shadow-[0_0_16px_rgba(16,185,129,0.5)] animate-pulse"
                : ""
            }`}>
              <Clock className={`w-5 h-5 ${hasCustomerOrdersActivity || activeTab === "archive" || activeTab === "orders" ? "text-emerald-600 scale-110" : "text-slate-500"}`} />
            </div>
            {hasCustomerOrdersActivity && (
              <span className="absolute -top-1 -right-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center animate-bounce shadow-md ring-2 ring-white">
                {activeOrdersCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] truncate max-w-[65px] ${hasCustomerOrdersActivity ? "text-emerald-700 font-black" : ""}`}>
            طلباتي {hasCustomerOrdersActivity ? "🛵" : ""}
          </span>
          {(activeTab === "archive" || activeTab === "orders") && (
            <motion.div layoutId="nav_dot_cust" className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5" />
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
            activeTab === "cart" || hasCartItemsActivity
              ? "text-orange-600 font-black"
              : "text-slate-500 hover:text-slate-800 font-bold"
          }`}
        >
          <div className="relative">
            <div className={`p-1 rounded-xl transition-all ${
              hasCartItemsActivity
                ? "bg-gradient-to-br from-orange-500/20 to-amber-500/25 text-orange-600 ring-2 ring-orange-500/60 shadow-[0_0_16px_rgba(249,115,22,0.45)] animate-pulse"
                : ""
            }`}>
              <ShoppingBag className={`w-5 h-5 ${hasCartItemsActivity || activeTab === "cart" ? "text-orange-600 scale-110" : "text-slate-500"}`} />
            </div>
            {hasCartItemsActivity && (
              <span className="absolute -top-1 -right-1.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-[9px] font-black min-w-4.5 h-4.5 px-1 rounded-full flex items-center justify-center animate-bounce shadow-md ring-2 ring-white">
                {cartCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] truncate max-w-[65px] ${hasCartItemsActivity ? "text-orange-700 font-black" : ""}`}>
            السلة {hasCartItemsActivity ? "🛍️" : ""}
          </span>
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
