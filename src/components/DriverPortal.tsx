import React, { useState, useEffect } from "react";
import { 
  Bike, 
  MapPin, 
  Phone, 
  Package, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Award, 
  Store as StoreIcon, 
  User, 
  ShieldCheck, 
  LogOut, 
  Send,
  Navigation,
  ArrowRight,
  AlertCircle,
  Volume2,
  VolumeX,
  Pill,
  ShoppingBag,
  Camera,
  ZoomIn,
  X,
  Wallet
} from "lucide-react";
import { DriverMember, Order, Store, UserProfile } from "../types";
import { ContactActions } from "./ContactActions";
import { playOrderAlertSound, isSoundEnabled, setSoundEnabled } from "../utils/soundNotifications";
import { BottomNavigation } from "./BottomNavigation";
import { AccountSettingsModal } from "./AccountSettingsModal";
import { CaptainWallet } from "./driver/CaptainWallet";

interface DriverPortalProps {
  userProfile: UserProfile;
  orders: Order[];
  stores: Store[];
  driversList: DriverMember[];
  onUpdateOrderStatus: (orderId: string, status: any) => void;
  onAssignDriver: (orderId: string, driver: DriverMember | null) => void;
  onUpdateDriverProfile?: (driver: DriverMember) => void;
  onLogout: () => void;
  onBackToCustomerView?: () => void;
  currency?: string;
}

export const DriverPortal: React.FC<DriverPortalProps> = ({
  userProfile,
  orders,
  stores,
  driversList,
  onUpdateOrderStatus,
  onAssignDriver,
  onUpdateDriverProfile,
  onLogout,
  onBackToCustomerView,
  currency = "ل.س"
}) => {
  // Find current driver profile
  const currentDriver = driversList.find(
    (d) => d.phone === userProfile.phone || d.username?.toLowerCase() === userProfile.name.toLowerCase() || d.name === userProfile.name
  ) || {
    id: "curr_driver",
    name: userProfile.name || "كابتن التوصيل",
    phone: userProfile.phone || "0991112233",
    status: "available" as const,
    vehicle: "دراجة نارية",
    totalDeliveries: 12,
    earnings: 60000,
    rating: 4.9
  };

  const [driverStatus, setDriverStatus] = useState<"available" | "busy" | "offline">(
    currentDriver.status || "available"
  );
  const [activeTab, setActiveTab] = useState<"my_orders" | "available_orders" | "history" | "wallet">("my_orders");
  const [soundAlerts, setSoundAlerts] = useState<boolean>(() => isSoundEnabled());
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Close internal modal or zoomed image on mobile back button tap without leaving driver portal
  useEffect(() => {
    const handleBack = (e: Event) => {
      if (zoomedImage) {
        setZoomedImage(null);
        e.preventDefault();
      } else if (showAccountModal) {
        setShowAccountModal(false);
        e.preventDefault();
      }
    };
    window.addEventListener("tw_back_button_pressed", handleBack);
    return () => window.removeEventListener("tw_back_button_pressed", handleBack);
  }, [zoomedImage, showAccountModal]);

  const handleProfileUpdate = async (updatedProfile: UserProfile, extraData?: any) => {
    const updatedDriver: DriverMember = {
      ...currentDriver,
      name: updatedProfile.name,
      phone: updatedProfile.phone,
      pin: updatedProfile.pin,
      vehicle: extraData?.driverVehicle || currentDriver.vehicle
    };
    if (onUpdateDriverProfile) {
      onUpdateDriverProfile(updatedDriver);
    }
    localStorage.setItem("tw_user_profile", JSON.stringify(updatedProfile));
    localStorage.setItem("tw_customer_user", JSON.stringify(updatedProfile));
    localStorage.setItem("tw_saved_driver_name", updatedProfile.name);
    localStorage.setItem("tw_saved_driver_phone", updatedProfile.phone);
    localStorage.setItem("tw_saved_driver_pin", updatedProfile.pin);
    localStorage.setItem("tw_saved_driver_user", updatedProfile.phone);
  };

  const handleToggleSound = () => {
    const next = !soundAlerts;
    setSoundAlerts(next);
    setSoundEnabled(next);
    if (next) {
      playOrderAlertSound("chime");
    }
  };

  const handleStatusChange = (newStatus: "available" | "busy" | "offline") => {
    setDriverStatus(newStatus);
    if (onUpdateDriverProfile) {
      onUpdateDriverProfile({ ...currentDriver, status: newStatus });
    }
  };

  // 1. My Assigned Orders (assigned by admin or accepted by driver)
  const myOrders = orders.filter(
    (o) =>
      (o.driverPhone === currentDriver.phone ||
        o.driverName === currentDriver.name ||
        o.driverId === currentDriver.id) &&
      o.status !== "delivered" &&
      o.status !== "cancelled"
  );

  // 2. Available Orders (unassigned orders pending captain dispatch)
  const availableOrders = orders.filter(
    (o) =>
      (!o.driverId && !o.driverName && !o.driverPhone) &&
      (o.status === "pending" || o.status === "accepted" || o.status === "preparing")
  );

  // 3. Completed Orders History
  const completedOrders = orders.filter(
    (o) =>
      (o.driverPhone === currentDriver.phone ||
        o.driverName === currentDriver.name ||
        o.driverId === currentDriver.id) &&
      o.status === "delivered"
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-right font-sans pb-28" dir="rtl">
      {/* Top Banner: Captain Identity & Stats */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-7 text-white shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-orange-500/25 shrink-0">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">{currentDriver.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  كابتن أسطول التوصيل
                </span>
              </div>
              <p className="text-slate-400 text-xs font-semibold mt-0.5 flex items-center gap-2">
                <span>{currentDriver.vehicle || "دراجة نارية سريعة"}</span>
                <span>•</span>
                <span className="font-mono text-slate-300">{currentDriver.phone}</span>
                <span>•</span>
                <span className="text-amber-400 font-black">
                  ⭐ {currentDriver.rating !== undefined && currentDriver.rating !== null ? (currentDriver.rating === 0 ? "0 (جديد)" : currentDriver.rating) : "0 (جديد)"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sound alert toggle button for driver */}
            <button
              type="button"
              onClick={handleToggleSound}
              className={`py-2 px-3.5 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                soundAlerts
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
              }`}
              title="تفعيل/كتم صوت رنين الطلبات الجديدة المتاحة للتوصيل"
            >
              {soundAlerts ? <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span>{soundAlerts ? "تنبيه الرنين مفعّل 🔔" : "الصوت مكتوم"}</span>
            </button>

            {/* Account Settings Button */}
            <button
              type="button"
              onClick={() => setShowAccountModal(true)}
              className="py-2 px-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-black text-emerald-400 transition-all cursor-pointer flex items-center gap-1.5"
              title="إعدادات الحساب وتعديل بيانات الكابتن"
            >
              <User className="w-4 h-4 text-emerald-400" />
              <span>حسابي</span>
            </button>

            {onBackToCustomerView && (
              <button
                type="button"
                onClick={onBackToCustomerView}
                className="py-2 px-3.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4 text-orange-400" />
                <span>واجهة الزبون</span>
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="py-2 px-3.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل خروج</span>
            </button>
          </div>
        </div>

        {/* Status Switcher & KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
          {/* Status Mode Box */}
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-2">
            <span className="text-xs text-slate-400 font-bold block">حالة العمل الحالية:</span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleStatusChange("available")}
                className={`py-1.5 text-center text-xs font-black rounded-xl transition-all cursor-pointer ${
                  driverStatus === "available"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200"
                }`}
              >
                متاح 🟢
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange("busy")}
                className={`py-1.5 text-center text-xs font-black rounded-xl transition-all cursor-pointer ${
                  driverStatus === "busy"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200"
                }`}
              >
                مشغول 🟡
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange("offline")}
                className={`py-1.5 text-center text-xs font-black rounded-xl transition-all cursor-pointer ${
                  driverStatus === "offline"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200"
                }`}
              >
                غير متصل ⚫
              </button>
            </div>
          </div>

          {/* Active / Earnings */}
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-bold block">الطلبات النشطة المكلف بها</span>
              <span className="text-2xl font-black text-orange-400">{myOrders.length} طلب</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Bike className="w-5 h-5" />
            </div>
          </div>

          {/* Completed Trips */}
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-bold block">مجموع التوصيلات المكتملة</span>
              <span className="text-2xl font-black text-emerald-400">{completedOrders.length + (currentDriver.totalDeliveries || 0)} رحلة</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("my_orders")}
          className={`py-2.5 px-4 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "my_orders"
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>طلباتي الموجهة لي والمكلف بها ({myOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("available_orders")}
          className={`py-2.5 px-4 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "available_orders"
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>طلبات متاحة للاستلام من الإدارة ({availableOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`py-2.5 px-4 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "history"
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>سجل التوصيلات ({completedOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("wallet")}
          className={`py-2.5 px-4 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "wallet"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
          }`}
        >
          <Wallet className="w-4 h-4 text-emerald-500" />
          <span>محفظتي وأرباحي 💰</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === "my_orders" && (
        <div className="space-y-4">
          {myOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 mx-auto flex items-center justify-center">
                <Bike className="w-8 h-8" />
              </div>
              <h3 className="font-black text-base text-slate-800">لا توجد طلبات موجهة إليك حالياً</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                عند قيام الإدارة بتوجيه وتعيين أي طلب جديد لك، سيظهر هنا فوراً مع تفاصيل المتجر والزبون وخيارات التواصل.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map((order) => {
                const matchedStore = stores.find((s) => s.id === order.storeId || s.name === order.storeName);
                const storePhone = matchedStore?.contactPhone || matchedStore?.ownerPhone || "0944111222";

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border-2 border-orange-200 hover:border-orange-400 p-5 sm:p-6 shadow-md transition-all space-y-4"
                  >
                    {/* Header: Order ID + Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 font-black text-sm flex items-center justify-center">
                          #{order.id.slice(-4)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-base text-slate-900">{order.storeName}</h4>
                            <span className="text-xs font-mono text-slate-400">
                              {new Date(order.createdAt).toLocaleTimeString("ar-SY", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            مبلغ التحصيل من الزبون: <strong className="font-black text-orange-600 text-sm">{order.total.toLocaleString()} {currency}</strong> (شامل التوصيل)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1.5 rounded-xl text-xs font-black border ${
                            order.status === "picked_up"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {order.status === "picked_up" ? "معك بالطريق للتسليم 🛵" : "جاهز أو قيد التجهيز بالمحل 🍳"}
                        </span>
                      </div>
                    </div>

                    {/* Stores & Customer Communication Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Step A: Store Pickup Box */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                              <StoreIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block">نقطة الاستلام (المتجر):</span>
                              <h5 className="font-black text-xs sm:text-sm text-slate-800">{order.storeName}</h5>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200 space-y-2">
                          <span className="text-[10px] font-bold text-slate-500 block">تواصل مع إدارة المتجر للاستلام:</span>
                          <ContactActions
                            phone={storePhone}
                            name={order.storeName}
                            defaultMessage={`مرحباً متجر (${order.storeName})، أنا الكابتن (${currentDriver.name}) بخصوص استلام الطلب #${order.id.slice(-4)}.`}
                            variant="pills"
                          />
                        </div>
                      </div>

                      {/* Step B: Customer Delivery Destination Box */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block">نقطة التسليم (الزبون):</span>
                              <h5 className="font-black text-xs sm:text-sm text-slate-800">{order.customerName}</h5>
                              <p className="text-[11px] text-orange-600 font-bold">
                                المعلم: {order.addressLandmark} {order.addressDetails ? `(${order.addressDetails})` : ""}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200 space-y-2">
                          <span className="text-[10px] font-bold text-slate-500 block">تواصل مع الزبون للتسليم:</span>
                          <ContactActions
                            phone={order.customerPhone}
                            name={order.customerName}
                            defaultMessage={`مرحباً ${order.customerName}، أنا الكابتن (${currentDriver.name}) بخصوص توصيل طلبك #${order.id.slice(-4)} من (${order.storeName}).`}
                            variant="pills"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Items List Summary */}
                    <div className="bg-slate-50/70 p-3 rounded-2xl border text-xs space-y-2">
                      <span className="font-black text-slate-700 block">محتويات وأغراض الطلب:</span>
                      {order.items && order.items.length > 0 && (
                        <div className="divide-y divide-slate-200 text-slate-700">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="py-1 flex items-center justify-between">
                              <span>{it.quantity}x {it.product.name} {it.selectedSize ? `(${it.selectedSize.name})` : ""}</span>
                              <span className="font-mono font-bold">{it.totalItemPrice.toLocaleString()} {currency}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Prescription info for driver */}
                      {(order.prescriptionImage || order.prescriptionNotes) && (
                        <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl space-y-1.5 text-xs text-emerald-950">
                          <div className="flex items-center justify-between font-black">
                            <span className="flex items-center gap-1">
                              <Pill className="w-3.5 h-3.5 text-emerald-600" />
                              <span>راشيتة أدوية / استشارة</span>
                            </span>
                            {order.prescriptionImage && (
                              <button
                                type="button"
                                onClick={() => setZoomedImage(order.prescriptionImage || null)}
                                className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-md hover:bg-emerald-700 cursor-pointer flex items-center gap-1"
                              >
                                <ZoomIn className="w-3 h-3" />
                                <span>تكبير</span>
                              </button>
                            )}
                          </div>
                          {order.prescriptionNotes && (
                            <p className="text-[11px] text-slate-700 bg-white p-1.5 rounded-lg border border-emerald-100 font-medium">
                              {order.prescriptionNotes}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Custom store order info for driver */}
                      {(order.isCustomStoreOrder || (order.customOrderText && !order.prescriptionNotes) || order.customOrderImage) && (
                        <div className="bg-orange-50 border border-orange-200 p-2.5 rounded-xl space-y-1.5 text-xs text-orange-950">
                          <div className="flex items-center justify-between font-black">
                            <span className="flex items-center gap-1">
                              <ShoppingBag className="w-3.5 h-3.5 text-orange-600" />
                              <span>طلب خاص / مقاضي خارجية</span>
                            </span>
                            {order.customOrderImage && (
                              <button
                                type="button"
                                onClick={() => setZoomedImage(order.customOrderImage || null)}
                                className="text-[10px] bg-orange-600 text-white px-2 py-0.5 rounded-md hover:bg-orange-700 cursor-pointer flex items-center gap-1"
                              >
                                <ZoomIn className="w-3 h-3" />
                                <span>تكبير الورقة</span>
                              </button>
                            )}
                          </div>
                          {order.customOrderText && (
                            <div className="text-[11px] text-slate-800 bg-white p-2 rounded-lg border border-orange-100 font-semibold whitespace-pre-line">
                              {order.customOrderText}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Driver Action Buttons: Stepper Progression */}
                    <div className="pt-2 flex flex-wrap items-center gap-2 justify-end border-t border-slate-100">
                      {order.status !== "picked_up" ? (
                        <button
                          type="button"
                          onClick={() => onUpdateOrderStatus(order.id, "picked_up")}
                          className="flex-1 sm:flex-none py-3 px-6 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                        >
                          <Bike className="w-4 h-4" />
                          <span>استلمت الطلب من المحل وبدأت التوصيل 🛵</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onUpdateOrderStatus(order.id, "delivered")}
                          className="flex-1 sm:flex-none py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>تم تسليم الطلب للزبون بنجاح واستلام الحساب ✅</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Available Pool of Orders */}
      {activeTab === "available_orders" && (
        <div className="space-y-4">
          {availableOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
              <Clock className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-black text-sm text-slate-700">لا توجد طلبات جديدة غير معينة حالياً</h4>
              <p className="text-xs text-slate-400">ستظهر الطلبات الجديدة هنا إذا كان هناك طلب بحاجة لكابتن.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900">#{order.id.slice(-4)} • {order.storeName}</span>
                      <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                        بانتظار كابتن
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      الزبون: <strong>{order.customerName}</strong> | المعلم: <strong className="text-orange-600">{order.addressLandmark}</strong>
                    </p>
                    <p className="text-xs text-slate-600 font-bold">
                      قيمة الطلب: {order.total.toLocaleString()} {currency} (أجرة التوصيل: {order.deliveryFee === 0 || order.deliveryFee === undefined ? "مجاناً" : `${order.deliveryFee.toLocaleString()} ${currency}`})
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAssignDriver(order.id, currentDriver)}
                    className="py-2.5 px-5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Bike className="w-4 h-4" />
                    <span>قبول وتولي توصيل الطلب 🛵</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {completedOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-black text-sm text-slate-700">لم تكتمل أي طلبات بعد في هذه الجلسة</h4>
            </div>
          ) : (
            <div className="space-y-3">
              {completedOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-black text-slate-900 block">طلب #{order.id.slice(-4)} • {order.storeName}</span>
                    <span className="text-slate-400 text-[11px]">الزبون: {order.customerName} ({order.addressLandmark})</span>
                  </div>
                  <div className="text-left">
                    <span className="font-black text-emerald-600 block">{order.total.toLocaleString()} {currency}</span>
                    <span className="text-[10px] text-slate-400">تم التسليم بنجاح ✅</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Captain's Financial Wallet */}
      {activeTab === "wallet" && (
        <CaptainWallet
          currentDriver={currentDriver}
          orders={orders}
          currency={currency}
        />
      )}

      {/* Image Zoom Modal for Driver */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          dir="rtl"
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-2 left-2 z-10 bg-black/60 hover:bg-black text-white p-2.5 rounded-full backdrop-blur-xs transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={zoomedImage}
              alt="معاينة الصورة"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-white/80 text-xs font-bold mt-3 bg-black/50 px-4 py-1.5 rounded-full">
              اضغط في أي مكان للإغلاق
            </p>
          </div>
        </div>
      )}
      {/* Universal Bottom Navigation for Driver */}
      <BottomNavigation
        userRole="driver"
        activeTab={activeTab}
        onNavigateHome={() => setActiveTab("my_orders")}
        onSelectRoleTab={(tab) => setActiveTab(tab as any)}
        onOpenAccount={() => setShowAccountModal(true)}
        activeOrdersCount={myOrders.length}
        userName={currentDriver.name}
      />

      {/* Account Settings Modal */}
      {showAccountModal && (
        <AccountSettingsModal
          isOpen={showAccountModal}
          onClose={() => setShowAccountModal(false)}
          userRole="driver"
          userProfile={userProfile}
          currentDriver={currentDriver}
          onUpdateProfile={handleProfileUpdate}
          onLogout={onLogout}
        />
      )}
    </div>
  );
};
