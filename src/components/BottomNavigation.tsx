import React from "react";
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
  Layers, 
  BarChart3, 
  ShieldCheck, 
  Users,
  Settings,
  Flame,
  CheckCircle2,
  FileText,
  Wallet
} from "lucide-react";

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
  userName = ""
}) => {
  // Render tabs depending on role
  const renderNavButtons = () => {
    if (userRole === "store_owner") {
      return (
        <>
          {/* 1. Home / Active Orders */}
          <button
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

          {/* 2. Products */}
          <button
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

          {/* 3. Archive */}
          <button
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

          {/* 4. My Account */}
          <button
            type="button"
            onClick={onOpenAccount}
            className="relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl text-slate-700 hover:text-orange-600 font-bold transition-all cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <User className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black truncate max-w-[65px]">حسابي</span>
          </button>
        </>
      );
    }

    if (userRole === "driver") {
      return (
        <>
          {/* 1. Home / My Assigned Orders */}
          <button
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

          {/* 2. Available Orders */}
          <button
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

          {/* 3. Captain Financial Wallet */}
          <button
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

          {/* 4. History */}
          <button
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

          {/* 5. My Account */}
          <button
            type="button"
            onClick={onOpenAccount}
            className="relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl text-slate-700 hover:text-emerald-600 font-bold transition-all cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <User className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black truncate max-w-[65px]">حسابي</span>
          </button>
        </>
      );
    }

    if (userRole === "admin") {
      return (
        <>
          {/* 1. Home / Stats */}
          <button
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

          {/* 2. Orders */}
          <button
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

          {/* 3. Stores */}
          <button
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

          {/* 4. My Account / Admin Profile */}
          <button
            type="button"
            onClick={onOpenAccount}
            className="relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl text-slate-700 hover:text-purple-600 font-bold transition-all cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <User className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black truncate max-w-[65px]">حسابي</span>
          </button>
        </>
      );
    }

    // Default: Customer View
    return (
      <>
        {/* 1. Home */}
        <button
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

        {/* 2. My Orders Archive */}
        <button
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

        {/* 3. Shopping Cart */}
        <button
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

        {/* 4. My Account */}
        <button
          type="button"
          onClick={onOpenAccount}
          className="relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl text-slate-700 hover:text-orange-600 font-bold transition-all cursor-pointer group"
        >
          <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
            <User className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black truncate max-w-[65px]">حسابي</span>
        </button>
      </>
    );
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      dir="rtl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <nav className="max-w-md mx-auto px-2 py-1.5 sm:py-2 flex items-center justify-around">
        {renderNavButtons()}
      </nav>
    </div>
  );
};
