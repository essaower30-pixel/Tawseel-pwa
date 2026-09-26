import React, { useState, useEffect, useMemo } from "react";
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
  Wallet,
  KeyRound,
  ShieldAlert,
  Smartphone,
  Sun
} from "lucide-react";
import { DriverMember, Order, Store, UserProfile } from "../types";
import { ContactActions } from "./ContactActions";
import { playOrderAlertSound, isSoundEnabled, setSoundEnabled, requestNotificationPermission, showSystemNotification } from "../utils/soundNotifications";
import { subscribeToPushNotifications } from "../utils/pushManager";
import { requestWakeLock, releaseWakeLock, isWakeLockActive, isWakeLockSupported } from "../utils/wakeLock";
import { AndroidSoundHelpModal } from "./AndroidSoundHelpModal";
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
    totalDeliveries: 0,
    earnings: 0,
    rating: 5.0
  };

  const [driverStatus, setDriverStatus] = useState<"available" | "busy" | "offline">(
    currentDriver.status || "available"
  );
  const [activeTab, setActiveTab] = useState<"my_orders" | "available_orders" | "history" | "wallet">("my_orders");
  const [soundAlerts, setSoundAlerts] = useState<boolean>(() => isSoundEnabled());
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const [showAndroidHelp, setShowAndroidHelp] = useState<boolean>(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);

  // Delivery Verification Modal State (Supports OTP or Customer Phone Verification as a secure fallback)
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<"otp" | "phone">("otp");
  const [enteredOtp, setEnteredOtp] = useState<string>("");
  const [enteredPhone, setEnteredPhone] = useState<string>("");
  const [otpError, setOtpError] = useState<string | null>(null);

  const handleOpenDeliveryVerification = (order: Order) => {
    setVerifyingOrder(order);
    setVerificationMethod("otp");
    setEnteredOtp("");
    setEnteredPhone("");
    setOtpError(null);
  };

  const handleConfirmDeliveryWithOtp = () => {
    if (!verifyingOrder) return;
    setOtpError(null);

    if (verificationMethod === "otp") {
      const cleanEntered = enteredOtp.trim();
      if (!cleanEntered) {
        setOtpError("يرجى إدخال كود التسليم المكون من 4 أرقام من الزبون");
        return;
      }

      const expectedOtp = verifyingOrder.deliveryOtp || (verifyingOrder.id ? verifyingOrder.id.replace(/\D/g, "").slice(-4).padStart(4, "7") : "1234");
      const reversedOtp = expectedOtp.split("").reverse().join("");
      if (cleanEntered !== expectedOtp && cleanEntered !== reversedOtp) {
        setOtpError("كود التسليم غير صحيح! يمكنك إعادة المحاولة أو التبديل للتحقق عبر رقم هاتف الزبون أدناه");
        return;
      }
    } else {
      // Phone verification fallback: accepts full phone or last 4/5 digits of customer phone
      const cleanEnteredPhone = enteredPhone.replace(/\D/g, "");
      const expectedCustomerPhone = (verifyingOrder.customerPhone || "").replace(/\D/g, "");

      if (!cleanEnteredPhone) {
        setOtpError("يرجى إدخال رقم هاتف الزبون أو آخر 4 أرقام منه للتأكيد البديل");
        return;
      }

      // Check match: exact match, or matching last digits, or endsWith
      const isMatch =
        (expectedCustomerPhone.length > 0 && cleanEnteredPhone === expectedCustomerPhone) ||
        (cleanEnteredPhone.length >= 4 && expectedCustomerPhone.endsWith(cleanEnteredPhone)) ||
        (expectedCustomerPhone.length >= 4 && cleanEnteredPhone.endsWith(expectedCustomerPhone.slice(-4)));

      if (!isMatch) {
        setOtpError("رقم الهاتف المدخل لا يتطابق مع رقم هاتف صاحب الطلب المسجل");
        return;
      }
    }

    // Verified successfully! Complete delivery
    const orderIdToDeliver = verifyingOrder.id;
    setVerifyingOrder(null);
    setEnteredOtp("");
    setEnteredPhone("");
    setOtpError(null);
    onUpdateOrderStatus(orderIdToDeliver, "delivered");
  };

  // Prevent mobile back button from exiting app and destroying background notifications
  useEffect(() => {
    // Request browser notifications permission if not already decided
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    // Push initial history state
    window.history.pushState({ tw_portal: "driver" }, "");

    const handlePopState = () => {
      // Keep state in history to trap subsequent back presses
      window.history.pushState({ tw_portal: "driver" }, "");

      if (verifyingOrder) {
        setVerifyingOrder(null);
        setEnteredOtp("");
        setEnteredPhone("");
        setOtpError(null);
      } else if (zoomedImage) {
        setZoomedImage(null);
      } else if (showAccountModal) {
        setShowAccountModal(false);
      } else {
        setShowExitWarning(true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [verifyingOrder, zoomedImage, showAccountModal]);

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

  const handleToggleSound = async () => {
    const next = !soundAlerts;
    setSoundAlerts(next);
    setSoundEnabled(next);
    if (next) {
      playOrderAlertSound("chime");
      const granted = await requestNotificationPermission();
      if (granted) {
        subscribeToPushNotifications({
          role: "driver",
          identifier: currentDriver.phone,
          name: currentDriver.name,
        }).catch(console.warn);

        showSystemNotification(`كابتن ${currentDriver.name} 🛵`, {
          body: "تم تفعيل التنبيهات وظهور أيقونة التطبيق في شريط الإشعارات العلوي! ستصلك تنبيهات فورية بالطلبات المسندة حتى لو كان الموبايل مقفلاً.",
          soundType: "chime",
        });
      }
    }
  };

  const handleStatusChange = (newStatus: "available" | "busy" | "offline") => {
    setDriverStatus(newStatus);
    if (onUpdateDriverProfile) {
      onUpdateDriverProfile({ ...currentDriver, status: newStatus });
    }
  };

  const handleToggleWakeLock = async () => {
    if (wakeLockActive) {
      await releaseWakeLock();
      setWakeLockActive(false);
    } else {
      const ok = await requestWakeLock();
      setWakeLockActive(ok);
      if (ok) {
        showSystemNotification("وضع الشاشة المتيقظة للكابتن ☀️", {
          body: "ستبقى الشاشة مضاءة أثناء القيادة ولن تنطفئ لضمان استلام كل طلب فوري!",
          soundType: "chime"
        });
      }
    }
  };

  const cleanDriverPhone = (p?: string) => {
    if (!p) return "";
    let s = String(p).trim();
    s = s.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
    s = s.replace(/[^0-9]/g, "");
    if (s.startsWith("00963")) s = "0" + s.slice(5);
    else if (s.startsWith("963")) s = "0" + s.slice(3);
    if (s.length === 9 && s.startsWith("9")) s = "0" + s;
    return s;
  };

  const isOrderAssignedToMe = (o: Order) => {
    const driverP = cleanDriverPhone(currentDriver.phone);
    const orderP = cleanDriverPhone(o.driverPhone);
    return Boolean(
      (driverP && orderP && driverP === orderP) ||
      (o.driverId && o.driverId === currentDriver.id) ||
      (o.driverName && currentDriver.name && (o.driverName.includes(currentDriver.name) || currentDriver.name.includes(o.driverName)))
    );
  };

  // 1. My Assigned Orders (assigned by admin or accepted by driver)
  const myOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        isOrderAssignedToMe(o) &&
        o.status !== "delivered" &&
        o.status !== "cancelled"
    );
  }, [orders, currentDriver]);

  // 2. Available Orders (unassigned orders pending captain dispatch)
  const availableOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        (!o.driverId && !o.driverName && !o.driverPhone) &&
        (o.status === "pending" || o.status === "accepted" || o.status === "preparing" || o.status === "ready_for_pickup")
    );
  }, [orders]);

  // 3. Completed Orders History
  const completedOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        isOrderAssignedToMe(o) &&
        o.status === "delivered"
    );
  }, [orders, currentDriver]);

  return (
    <div className="max-w-5xl mx-auto space-y-3 sm:space-y-4 text-right font-sans pb-28" dir="rtl">
      {/* Sleek Compact Driver Header Panel */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 text-white shadow-lg space-y-2.5">
        {/* Top Row: Driver Profile & Quick Controls */}
        <div className="flex items-center justify-between gap-2.5">
          {/* Driver identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 p-0.5 shadow-md shadow-orange-500/20 shrink-0">
              {currentDriver.avatar ? (
                <img
                  src={currentDriver.avatar}
                  alt={currentDriver.name}
                  className="w-full h-full object-cover rounded-[10px]"
                />
              ) : (
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-orange-400 font-black text-lg">
                  🛵
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-white truncate leading-tight">
                  {currentDriver.name}
                </h2>
                <span className="text-amber-400 text-xs font-black shrink-0">
                  ⭐ {currentDriver.rating !== undefined && currentDriver.rating !== null ? (currentDriver.rating === 0 ? "جديد" : currentDriver.rating) : "جديد"}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] font-semibold flex items-center gap-1.5 flex-wrap truncate mt-0.5">
                <span>{currentDriver.vehicle || "دراجة نارية"}</span>
                <span>•</span>
                <span className="font-mono text-slate-300">{currentDriver.phone}</span>
              </p>
            </div>
          </div>

          {/* Quick utility icons: Sound & WakeLock & Android Sound */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Sound alert toggle */}
            <button
              type="button"
              onClick={handleToggleSound}
              className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                soundAlerts
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
              }`}
              title={soundAlerts ? "تنبيه الرنين مفعل (انقر للكتم)" : "الصوت مكتوم (انقر للتفعيل)"}
            >
              {soundAlerts ? (
                <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className="hidden sm:inline text-[11px] font-bold">
                {soundAlerts ? "رنين 🔔" : "كتم"}
              </span>
            </button>

            {/* Screen WakeLock button */}
            {isWakeLockSupported() && (
              <button
                type="button"
                onClick={handleToggleWakeLock}
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  wakeLockActive
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                }`}
                title={wakeLockActive ? "الشاشة متيقظة (انقر للتعطيل)" : "إبقاء الشاشة مضاءة أثناء القيادة"}
              >
                <Sun className={`w-4 h-4 shrink-0 ${wakeLockActive ? "text-amber-400" : "text-slate-400"}`} />
                <span className="hidden sm:inline text-[11px] font-bold">
                  {wakeLockActive ? "يقظة ☀️" : "شاشة"}
                </span>
              </button>
            )}

            {/* Android Sound Troubleshooting */}
            <button
              type="button"
              onClick={() => setShowAndroidHelp(true)}
              className="p-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center"
              title="طريقة ضبط رنين أندرويد عند قفل الهاتف"
            >
              <Smartphone className="w-4 h-4 text-orange-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Bottom Row: Work Status & Quick Counters in 1 compact line */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          {/* Work Status Toggle (Segmented Control) */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 px-1 hidden xs:inline">الحالة:</span>
            <button
              type="button"
              onClick={() => handleStatusChange("available")}
              className={`py-1 px-2.5 text-center text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                driverStatus === "available"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
              <span>متاح</span>
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange("busy")}
              className={`py-1 px-2.5 text-center text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                driverStatus === "busy"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-200"></span>
              <span>مشغول</span>
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange("offline")}
              className={`py-1 px-2.5 text-center text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                driverStatus === "offline"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>غير متصل</span>
            </button>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("my_orders")}
              className={`flex-1 sm:flex-none flex items-center justify-between sm:justify-start gap-2 px-3 py-1 rounded-xl border cursor-pointer transition-colors ${
                activeTab === "my_orders"
                  ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                  : "bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300"
              }`}
            >
              <span className="text-[11px] text-slate-400 font-bold">النشطة:</span>
              <span className="text-sm font-black text-orange-400">{myOrders.length} طلب</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`flex-1 sm:flex-none flex items-center justify-between sm:justify-start gap-2 px-3 py-1 rounded-xl border cursor-pointer transition-colors ${
                activeTab === "history"
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                  : "bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300"
              }`}
            >
              <span className="text-[11px] text-slate-400 font-bold">المكتملة:</span>
              <span className="text-sm font-black text-emerald-400">{completedOrders.length} رحلة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation - Prominent & Highly Visible */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto scrollbar-none sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm pt-1">
        <button
          type="button"
          onClick={() => setActiveTab("my_orders")}
          className={`py-2 px-3 sm:px-4 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === "my_orders"
              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>طلباتي المكلف بها</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === "my_orders" ? "bg-white/25 text-white" : "bg-orange-100 text-orange-700"
          }`}>
            {myOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("available_orders")}
          className={`py-2 px-3 sm:px-4 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === "available_orders"
              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>طلبات متاحة للاستلام</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === "available_orders"
              ? "bg-white/25 text-white"
              : availableOrders.length > 0
                ? "bg-amber-500 text-white animate-pulse"
                : "bg-slate-100 text-slate-600"
          }`}>
            {availableOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("wallet")}
          className={`py-2 px-3 sm:px-4 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === "wallet"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
          }`}
        >
          <Wallet className="w-4 h-4 text-emerald-500" />
          <span>محفظتي وأرباحي 💰</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`py-2 px-3 sm:px-4 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === "history"
              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>سجل التوصيلات</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === "history" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            {completedOrders.length}
          </span>
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
                              <span>{it.quantity}x {it.product?.name || "صنف"} {it.selectedSize ? `(${it.selectedSize.name})` : ""}</span>
                              <span className="font-mono font-bold">
                                {it.totalItemPrice !== undefined
                                  ? it.totalItemPrice.toLocaleString()
                                  : ((it.product?.price || 0) * (it.quantity || 1)).toLocaleString()}{" "}
                                {currency}
                              </span>
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
                          onClick={() => handleOpenDeliveryVerification(order)}
                          className="flex-1 sm:flex-none py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                        >
                          <KeyRound className="w-4 h-4 text-amber-300" />
                          <span>إدخال كود التسليم وتأكيد الاستلام 🔑</span>
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
        userAvatar={currentDriver.avatar || userProfile.avatar}
      />

      {/* Delivery Handover OTP Verification Dialog for Captain */}
      {verifyingOrder && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          dir="rtl"
          onClick={() => {
            setVerifyingOrder(null);
            setEnteredOtp("");
            setOtpError(null);
          }}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-250 space-y-5 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                  <KeyRound className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    تأكيد تسليم الطلبية للزبون 🔐
                  </h3>
                  <p className="text-slate-500 text-xs font-bold mt-0.5">
                    الطلب #{verifyingOrder.id.slice(-6)} • {verifyingOrder.storeName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVerifyingOrder(null);
                  setEnteredOtp("");
                  setOtpError(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Verification Method Tabs (كود التسليم أو هاتف الزبون كبديل) */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setVerificationMethod("otp");
                  setOtpError(null);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  verificationMethod === "otp"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                <span>كود التسليم (OTP)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setVerificationMethod("phone");
                  setOtpError(null);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  verificationMethod === "phone"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>بديل: هاتف الزبون</span>
              </button>
            </div>

            {/* Instruction Notice */}
            {verificationMethod === "otp" ? (
              <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>اطلب كود الاستلام من الزبون مباشرة:</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
                  يقوم الزبون بإعطائك كود الأمان المكون من 4 أرقام الظاهر على شاشة هاتفه في صفحة متابعة الطلب.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-xs">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>التحقق الاحتياطي عبر رقم هاتف الزبون:</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-semibold">
                  إذا تعذر الوصول للكود أو أُدخل خطأً، أدخل رقم هاتف الزبون (أو آخر 4 أرقام منه) المسجل بالطلب لتأكيد التسليم.
                </p>
              </div>
            )}

            {/* Customer & Order Recap */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between text-xs font-bold">
              <div>
                <span className="text-slate-400 block text-[11px]">الزبون والموقع:</span>
                <span className="text-slate-800">{verifyingOrder.customerName} ({verifyingOrder.addressLandmark})</span>
              </div>
              <div className="text-left">
                <span className="text-slate-400 block text-[11px]">المبلغ المطلوب:</span>
                <span className="text-emerald-700 font-black text-sm">{verifyingOrder.total.toLocaleString()} {currency}</span>
              </div>
            </div>

            {/* Input Form based on selected method */}
            {verificationMethod === "otp" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-800">
                    أدخل كود التسليم (4 أرقام):
                  </label>
                  {enteredOtp.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setEnteredOtp("");
                        setOtpError(null);
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                    >
                      مسح وتصحيح
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    autoFocus
                    placeholder="مثال: 4829"
                    value={enteredOtp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setEnteredOtp(val);
                      if (otpError) setOtpError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && enteredOtp.length === 4) {
                        handleConfirmDeliveryWithOtp();
                      }
                    }}
                    className={`w-full py-3.5 px-4 text-center font-mono font-black text-2xl tracking-widest text-slate-900 bg-slate-100 border-2 rounded-2xl focus:bg-white focus:outline-hidden transition-all placeholder:text-slate-400 placeholder:text-base placeholder:tracking-normal ${
                      otpError ? "border-rose-400 bg-rose-50/50" : "border-slate-300 focus:border-amber-500"
                    }`}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-800">
                    أدخل رقم هاتف الزبون (أو آخر 4 أرقام):
                  </label>
                  {enteredPhone.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setEnteredPhone("");
                        setOtpError(null);
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                    >
                      مسح وتصحيح
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="tel"
                    inputMode="tel"
                    autoFocus
                    placeholder="مثال: 09xxxxxxxx أو آخر 4 أرقام"
                    value={enteredPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d+]/g, "");
                      setEnteredPhone(val);
                      if (otpError) setOtpError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && enteredPhone.length >= 4) {
                        handleConfirmDeliveryWithOtp();
                      }
                    }}
                    className={`w-full py-3.5 px-4 text-center font-mono font-black text-lg text-slate-900 bg-slate-100 border-2 rounded-2xl focus:bg-white focus:outline-hidden transition-all placeholder:text-slate-400 placeholder:text-xs ${
                      otpError ? "border-rose-400 bg-rose-50/50" : "border-slate-300 focus:border-emerald-500"
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Error & Fast Fallback Action */}
            {otpError && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-rose-600 text-xs font-black p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{otpError}</span>
                </div>

                {verificationMethod === "otp" && (
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationMethod("phone");
                      setOtpError(null);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>الكود غير متاح أو به خطأ؟ التحقق برقم هاتف الزبون 📲</span>
                  </button>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmDeliveryWithOtp}
                disabled={verificationMethod === "otp" ? enteredOtp.length < 4 : enteredPhone.trim().length < 4}
                className={`flex-1 py-3.5 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md ${
                  (verificationMethod === "otp" ? enteredOtp.length >= 4 : enteredPhone.trim().length >= 4)
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95 shadow-emerald-600/20"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تأكيد التسليم وإنهاء الطلب ✅</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setVerifyingOrder(null);
                  setEnteredOtp("");
                  setEnteredPhone("");
                  setOtpError(null);
                }}
                className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-2xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Captain Exit / Background Warning Modal */}
      {showExitWarning && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl text-center space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
              🛵
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                تنبيه هام للكابتن ({currentDriver.name})
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm font-semibold mt-2 leading-relaxed">
                للبقاء متصلاً واستلام رنين وتنبيهات طلبات الإدارة والتوصيل لحظة بلحظة، يُرجى تصغير التطبيق بزر الشاشة الرئيسية (Home) بدلاً من الخروج بزر الرجوع.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-right space-y-1 text-xs text-amber-950 font-bold">
              <div className="flex items-center gap-1.5 font-black text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>نصائح لضمان استلام التنبيهات:</span>
              </div>
              <p className="text-[11px] text-amber-800">1. تصغير التطبيق يبقيه نشطاً لتلقي الإشعارات الصوتية والرنين.</p>
              <p className="text-[11px] text-amber-800">2. زر الرجوع يغلق الصفحة في المتصفح مما قد يوقف التنبيهات.</p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExitWarning(false)}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>البقاء متصلاً ومتابعة العمل 🛵</span>
              </button>

              {onBackToCustomerView && (
                <button
                  type="button"
                  onClick={() => {
                    setShowExitWarning(false);
                    onBackToCustomerView();
                  }}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer"
                >
                  التبديل إلى تصفح المنصة كزبون 🛍️
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Android Sound Troubleshooting Modal */}
      <AndroidSoundHelpModal
        isOpen={showAndroidHelp}
        onClose={() => setShowAndroidHelp(false)}
      />
    </div>
  );
};
