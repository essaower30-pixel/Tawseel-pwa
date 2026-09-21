import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Phone, 
  Lock, 
  Key, 
  ShieldCheck, 
  Store as StoreIcon, 
  Bike, 
  CheckCircle2, 
  X, 
  Save, 
  LogOut, 
  Eye, 
  EyeOff, 
  Sparkles,
  MapPin,
  Clock,
  Shield,
  Smartphone,
  RefreshCw,
  Check,
  Scale,
  FileText,
  Camera,
  Trash2,
  Image as ImageIcon
} from "lucide-react";
import { UserProfile, Store, DriverMember, StaffMember, AppSettings } from "../types";
import { TermsAgreementModal } from "./TermsAgreementModal";
import { ImageUploader } from "./ImageUploader";

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: "customer" | "store_owner" | "driver" | "admin" | "guest";
  userProfile: UserProfile | null;
  onUpdateProfile: (updatedProfile: UserProfile, extraData?: any) => Promise<boolean | void> | boolean | void;
  onLogout: () => void;
  currentStore?: Store | null;
  currentDriver?: DriverMember | null;
  currentStaff?: StaffMember | null;
  appSettings?: AppSettings | null;
  onGoToAdmin?: () => void;
  onGoToStore?: () => void;
  onGoToDriver?: () => void;
  isStoreOwnerBrowsingAsCustomer?: boolean;
  onToggleStoreOwnerCustomerBrowsing?: (force?: boolean) => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  userRole,
  userProfile,
  onUpdateProfile,
  onLogout,
  currentStore,
  currentDriver,
  currentStaff,
  appSettings,
  onGoToAdmin,
  onGoToStore,
  onGoToDriver,
  isStoreOwnerBrowsingAsCustomer,
  onToggleStoreOwnerCustomerBrowsing
}) => {
  const [name, setName] = useState(userProfile?.name || "");
  const [phone, setPhone] = useState(userProfile?.phone || "");
  const [pin, setPin] = useState(userProfile?.pin || "");
  const [showPin, setShowPin] = useState(false);
  const [staffPassword, setStaffPassword] = useState("");
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  // Specific extra role states
  const [storeName, setStoreName] = useState(currentStore?.name || "");
  const [storeHours, setStoreHours] = useState(currentStore?.workingHours || "9:00 ص - 11:00 م");
  const [storeDeliveryFee, setStoreDeliveryFee] = useState<string | number>(
    currentStore?.deliveryFee !== undefined && currentStore?.deliveryFee !== null ? currentStore.deliveryFee : 0
  );
  const [storeImage, setStoreImage] = useState(currentStore?.image || "");
  const [avatar, setAvatar] = useState(userProfile?.avatar || currentStaff?.avatar || currentDriver?.avatar || "");
  const [driverVehicle, setDriverVehicle] = useState(currentDriver?.vehicle || "دراجة نارية");
  const [customerAddress, setCustomerAddress] = useState(
    () => localStorage.getItem("tw_saved_customer_address") || "وسط البلد - بجانب المسجد الكبير"
  );

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Sync state whenever modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      if (userRole === "admin" && currentStaff) {
        setName(currentStaff.name || userProfile?.name || "");
        setPhone(currentStaff.phone || userProfile?.phone || "");
        setPin(currentStaff.pin || userProfile?.pin || "1234");
        setStaffPassword(currentStaff.password || "Admin@Tawseel2026#");
        setAvatar(currentStaff.avatar || userProfile?.avatar || "");
      } else if (userRole === "admin") {
        setName(userProfile?.name || "المدير العام");
        setPhone(userProfile?.phone || "0991234567");
        setPin(userProfile?.pin || "1234");
        const masterPass = localStorage.getItem("tw_admin_secure_password") || "Admin@Tawseel2026#";
        setStaffPassword(masterPass);
        setAvatar(userProfile?.avatar || "");
      } else if (userRole === "store_owner" && currentStore) {
        setName(currentStore.ownerName || userProfile?.name || "");
        setPhone(currentStore.ownerPhone || currentStore.contactPhone || userProfile?.phone || "");
        setPin(currentStore.ownerPin || userProfile?.pin || "1234");
        setStoreImage(currentStore.image || "");
        setAvatar(userProfile?.avatar || "");
      } else if (userRole === "driver" && currentDriver) {
        setName(currentDriver.name || userProfile?.name || "");
        setPhone(currentDriver.phone || userProfile?.phone || "");
        setPin(currentDriver.pin || userProfile?.pin || "1234");
        setAvatar(currentDriver.avatar || userProfile?.avatar || "");
      } else {
        setName(userProfile?.name || "");
        setPhone(userProfile?.phone || "");
        setPin(userProfile?.pin || "1234");
        setAvatar(userProfile?.avatar || "");
      }

      if (currentStore) {
        setStoreName(currentStore.name || "");
        setStoreHours(currentStore.workingHours || "9:00 ص - 11:00 م");
        setStoreDeliveryFee(currentStore.deliveryFee !== undefined && currentStore.deliveryFee !== null ? currentStore.deliveryFee : 0);
        setStoreImage(currentStore.image || "");
      }
      if (currentDriver) {
        setDriverVehicle(currentDriver.vehicle || "دراجة نارية");
        setAvatar(currentDriver.avatar || userProfile?.avatar || "");
      }
      setSaveSuccess(false);
      setErrorMessage("");
    }
  }, [isOpen, userProfile, userRole, currentStore, currentDriver, currentStaff]);

  if (!isOpen) return null;

  const handleGeneratePin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(randomPin);
    setShowPin(true);
  };

  const handleGenerateStaffPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setStaffPassword(pass);
    setShowStaffPassword(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("الرجاء إدخال الاسم الكريم.");
      return;
    }
    if (!phone.trim() || phone.length < 8) {
      setErrorMessage("الرجاء إدخال رقم هاتف صحيح (8 أرقام على الأقل).");
      return;
    }
    if (!pin.trim()) {
      setErrorMessage("الرجاء إدخال رمز المرور أو الـ PIN.");
      return;
    }

    if (userRole === "admin") {
      if (!/^\d{3,6}$/.test(pin.trim())) {
        setErrorMessage("يجب أن يتكون رمز الـ PIN للكادر من 3 إلى 6 أرقام فقط.");
        return;
      }
      if (!staffPassword.trim() || staffPassword.trim().length <= 4) {
        setErrorMessage("يجب أن تتكون كلمة المرور المشفرة من أكثر من 4 خانات.");
        return;
      }
      if (!/[a-zA-Z]/.test(staffPassword.trim()) || !/[0-9]/.test(staffPassword.trim())) {
        setErrorMessage("يجب أن تحتوي كلمة المرور على أحرف وأرقام معاً لضمان حماية الحساب من الاختراق.");
        return;
      }
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const updatedProfile: UserProfile = {
        ...(userProfile || { name: "", phone: "", pin: "" }),
        name: name.trim(),
        phone: phone.trim(),
        pin: pin.trim(),
        role: userRole,
        // Captain profile picture cannot be changed by the driver directly:
        avatar: userRole === "driver"
          ? (currentDriver?.avatar || userProfile?.avatar || "")
          : avatar.trim() || undefined
      };

      // Delivery fee is optional and handles 0: if left empty or 0, accepted as 0
      const rawFee = typeof storeDeliveryFee === "string" ? storeDeliveryFee.trim() : storeDeliveryFee;
      const parsedFee = (rawFee === "" || rawFee === null || rawFee === undefined) ? 0 : Number(rawFee);
      const finalDeliveryFee = isNaN(parsedFee) ? 0 : Math.max(0, parsedFee);

      const extraData: any = {
        storeName: storeName.trim(),
        storeHours: storeHours.trim(),
        storeImage: storeImage.trim(),
        deliveryFee: finalDeliveryFee,
        driverVehicle: driverVehicle.trim(),
        customerAddress: customerAddress.trim()
      };

      if (userRole === "customer") {
        localStorage.setItem("tw_saved_customer_address", customerAddress.trim());
      }

      // Sync staff members in localStorage if staff/admin
      if (userRole === "admin") {
        try {
          const raw = localStorage.getItem("tw_staff_members");
          let staffList = raw ? JSON.parse(raw) : [];
          if (currentStaff) {
            staffList = staffList.map((s: any) => 
              s.id === currentStaff.id 
                ? { ...s, name: name.trim(), phone: phone.trim(), pin: pin.trim(), password: staffPassword.trim(), avatar: avatar.trim() || s.avatar }
                : s
            );
          } else {
            // Update admin staff_1
            staffList = staffList.map((s: any) => 
              s.id === "staff_1" || s.role === "manager"
                ? { ...s, name: name.trim(), phone: phone.trim(), pin: pin.trim(), password: staffPassword.trim(), avatar: avatar.trim() || s.avatar }
                : s
            );
            localStorage.setItem("tw_admin_secure_password", staffPassword.trim());
          }
          localStorage.setItem("tw_staff_members", JSON.stringify(staffList));
        } catch (e) {
          console.error("Error updating staff member state:", e);
        }
      }

      await onUpdateProfile(updatedProfile, extraData);

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error("Save profile error:", err);
      setErrorMessage("حدث خطأ أثناء حفظ التعديلات. الرجاء المحاولة مجدداً.");
    } finally {
      setIsSaving(false);
    }
  };

  // Role Badge Display Helper
  const getRoleDetails = () => {
    switch (userRole) {
      case "admin": {
        if (currentStaff) {
          if (currentStaff.role === "accountant") {
            return {
              title: `حساب المحاسب المالي (${currentStaff.name})`,
              badge: "محاسب مالي 📊",
              bg: "from-blue-950 to-slate-900",
              accentColor: "border-blue-500/30 text-blue-600 bg-blue-50",
              icon: <ShieldCheck className="w-6 h-6 text-blue-400" />
            };
          }
          if (currentStaff.role === "orders_clerk") {
            return {
              title: `حساب مسؤول الطلبات (${currentStaff.name})`,
              badge: "معالجة الطلبات 📦",
              bg: "from-purple-950 to-slate-900",
              accentColor: "border-purple-500/30 text-purple-600 bg-purple-50",
              icon: <ShieldCheck className="w-6 h-6 text-purple-400" />
            };
          }
          if (currentStaff.role === "support") {
            return {
              title: `حساب خدمة العملاء (${currentStaff.name})`,
              badge: "دعم فني 🎧",
              bg: "from-cyan-950 to-slate-900",
              accentColor: "border-cyan-500/30 text-cyan-600 bg-cyan-50",
              icon: <ShieldCheck className="w-6 h-6 text-cyan-400" />
            };
          }
        }
        return {
          title: "حساب الإدارة والمدير العام",
          badge: "مدير النظام 🛡️",
          bg: "from-slate-900 to-slate-800",
          accentColor: "border-purple-500/30 text-purple-600 bg-purple-50",
          icon: <ShieldCheck className="w-6 h-6 text-purple-400" />
        };
      }
      case "store_owner":
        return {
          title: "حساب صاحب المتجر / المطعم",
          badge: `تاجر معتمد 🏪 (${currentStore?.name || "متجر القرية"})`,
          bg: "from-orange-950 to-slate-900",
          accentColor: "border-orange-500/30 text-orange-600 bg-orange-50",
          icon: <StoreIcon className="w-6 h-6 text-orange-400" />
        };
      case "driver":
        return {
          title: "حساب كابتن التوصيل",
          badge: "كابتن أسطول التوصيل 🛵",
          bg: "from-emerald-950 to-slate-900",
          accentColor: "border-emerald-500/30 text-emerald-600 bg-emerald-50",
          icon: <Bike className="w-6 h-6 text-emerald-400" />
        };
      case "customer":
      default:
        return {
          title: "حساب الزبون / المشتري",
          badge: "زبون مميز 🛍️",
          bg: "from-orange-900 to-slate-900",
          accentColor: "border-orange-500/30 text-orange-600 bg-orange-50",
          icon: <User className="w-6 h-6 text-orange-400" />
        };
    }
  };

  const roleInfo = getRoleDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-right my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header with Dark Premium Gradient */}
        <div className={`bg-gradient-to-r ${roleInfo.bg} p-5 text-white flex items-center justify-between shrink-0 relative overflow-hidden`}>
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner overflow-hidden">
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                roleInfo.icon
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-white">
                  إعدادات حسابي وملفي الشخصي
                </h3>
                <span className="text-[10px] font-black bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/20">
                  {roleInfo.badge}
                </span>
              </div>
              <p className="text-white/70 text-xs mt-0.5 font-medium">
                تحديث الاسم، رقم الهاتف، والرمز السري الخاص بك ومزامنتها فوراً
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-black cursor-pointer transition-all shrink-0 z-10"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-black shadow-xs"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>تم حفظ وتحديث بيانات حسابك ومزامنتها بنجاح مع النظام! ✅</span>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold"
            >
              {errorMessage}
            </motion.div>
          )}

          {/* Quick Return to Role Portal Banner / Action Card at Top of Account Modal */}
          {userRole === "admin" && onGoToAdmin && (
            <div className="p-3.5 bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 border border-purple-500/50 rounded-2xl shadow-md text-white">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-white">
                      صفحة مهامك الإدارية ({currentStaff?.name || "الإدارة"})
                    </h4>
                    <p className="text-[11px] text-purple-200/80">
                      أنت تتصفح حالياً كزبون. يمكنك العودة المباشرة لمتابعة مهامك وصلاحياتك.
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToAdmin();
                }}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 border border-purple-400/40"
              >
                <ShieldCheck className="w-4 h-4 text-purple-200" />
                <span>العودة المباشرة إلى لوحة مهامي 🛡️</span>
              </button>
            </div>
          )}

          {userRole === "driver" && onGoToDriver && (
            <div className="p-3.5 bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 border border-blue-500/50 rounded-2xl shadow-md text-white">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    <Bike className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-white">
                      لوحة الكابتن ({userProfile?.name || "الكابتن"})
                    </h4>
                    <p className="text-[11px] text-blue-200/80">
                      حساب الكابتن نشط. يمكنك العودة المباشرة لمتابعة واستلام وتوصيل الطلبات.
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToDriver();
                }}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-600 hover:from-blue-500 hover:to-emerald-500 text-white rounded-xl text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 border border-blue-400/40"
              >
                <Bike className="w-4 h-4 text-blue-200" />
                <span>العودة المباشرة إلى لوحة الكابتن 🚴</span>
              </button>
            </div>
          )}

          {userRole === "store_owner" && (
            <div className="p-3.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/50 rounded-2xl shadow-md text-white">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <StoreIcon className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-white">
                      لوحة إدارة المتجر / المهنة ({currentStore?.name || userProfile?.name || "متجري"})
                    </h4>
                    <p className="text-[11px] text-emerald-200/80">
                      {isStoreOwnerBrowsingAsCustomer ? "أنت تتصفح حالياً كزبون متسوق. متجرك نشط في الخلفية." : "لوحة التحكم بمتجرك وقائمة المنتجات والطلبات."}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onToggleStoreOwnerCustomerBrowsing) {
                    onToggleStoreOwnerCustomerBrowsing(false);
                  } else if (onGoToStore) {
                    onGoToStore();
                  }
                }}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 border border-emerald-400/40"
              >
                <StoreIcon className="w-4 h-4 text-emerald-200" />
                <span>العودة المباشرة إلى لوحة إدارة متجري 🏪</span>
              </button>
            </div>
          )}

          {/* User Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-orange-500" />
              <span>الاسم الكامل / اسم الحساب:</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: أحمد العلي أو مطعم البركة"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          {/* User Phone Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-orange-500" />
              <span>رقم الهاتف المعتمد (المستخدم لتسجيل الدخول والواتساب):</span>
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                dir="ltr"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09XXXXXXXX"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono font-black text-left text-slate-900 focus:bg-white focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">
                📱
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              * يُستخدم هذا الرقم لتسجيل الدخول السريع وتلقي تنبيهات وإشعارات الطلبات.
            </p>
          </div>

          {/* PIN / Quick Access Code */}
          <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-orange-500" />
                <span>{userRole === "admin" ? "رمز الـ PIN السريع (متاح محاولتان):" : "الرمز السري (PIN):"}</span>
                <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleGeneratePin}
                className="text-[10px] text-orange-600 hover:text-orange-700 font-bold bg-orange-100/70 hover:bg-orange-100 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-all"
              >
                <Sparkles className="w-3 h-3 text-orange-500" />
                <span>توليد PIN</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                required
                maxLength={userRole === "admin" ? 6 : 8}
                value={pin}
                onChange={(e) => {
                  const val = e.target.value;
                  if (userRole === "admin") setPin(val.replace(/\D/g, ""));
                  else setPin(val);
                }}
                placeholder="رمز المرور (PIN)"
                className="w-full p-3 pl-10 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-black text-left tracking-wider text-slate-900 focus:outline-hidden focus:border-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold">
              {userRole === "admin"
                ? "⚡ للدخول السريع اليومي. يُسمح بمحاولتين فقط للدخول عبر هذا الرمز، وفي الثالثة يُلزم النظام كلمة المرور المشفرة."
                : "🔒 احفظ هذا الرمز جيداً حيث ستحتاجه في المرات القادمة لتأكيد الدخول إلى حسابك."}
            </p>
          </div>

          {/* Admin / Staff Encrypted Strong Password Field */}
          {userRole === "admin" && (
            <div className="space-y-1.5 p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>كلمة المرور المشفرة الكاملة (أحرف + أرقام):</span>
                  <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateStaffPassword}
                  className="text-[10px] text-amber-800 hover:text-amber-900 font-bold bg-amber-200/70 hover:bg-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Sparkles className="w-3 h-3 text-amber-700" />
                  <span>توليد باسوورد قوي</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showStaffPassword ? "text" : "password"}
                  required
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="كلمة المرور (أكثر من 4 خانات مع أحرف وأرقام)"
                  className="w-full p-3 pl-10 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm font-mono font-black text-left tracking-wider text-slate-900 focus:outline-hidden focus:border-amber-600"
                />
                <button
                  type="button"
                  onClick={() => setShowStaffPassword(!showStaffPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-amber-800 font-semibold">
                🛡️ مطلوبة للدخول المشفر أو عند استنفاد محاولتي الـ PIN. يجب أن تتجاوز 4 خانات وتحتوي على أحرف وأرقام.
              </p>
            </div>
          )}

          {/* Role-Specific Fields & Profile Media */}
          {/* Customer Avatar (Optional) */}
          {userRole === "customer" && (
            <div className="p-3.5 bg-orange-50/50 border border-orange-200/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-orange-500" />
                  <span>صورة البروفايل الشخصية</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">
                    (اختياري)
                  </span>
                </label>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar("")}
                    className="text-[10px] text-red-500 hover:text-red-700 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>حذف الصورة</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-orange-300 shadow-xs overflow-hidden flex items-center justify-center shrink-0">
                  {avatar ? (
                    <img src={avatar} alt="صورة البروفايل" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-1">
                      <User className="w-7 h-7 text-orange-400 mx-auto" />
                      <span className="text-[9px] text-slate-400 font-bold block">بدون صورة</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    إضافة صورة لحسابك اختياري وتساعد مندوب التوصيل والمتجر في التعرف عليك بسهولة.
                  </p>
                  <ImageUploader
                    value={avatar}
                    onChange={(img) => setAvatar(img)}
                    label=""
                    helperText="اختر صورة من استديو جهازك أو التقطها بالكاميرا"
                    aspectRatio="square"
                    maxDimension={400}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Admin Staff Avatar (Optional) */}
          {userRole === "admin" && (
            <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>الصورة الشخصية لموظف الإدارة</span>
                  <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-2 py-0.5 rounded-full">
                    (اختياري)
                  </span>
                </label>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar("")}
                    className="text-[10px] text-red-500 hover:text-red-700 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>إزالة الصورة</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-amber-300 shadow-xs overflow-hidden flex items-center justify-center shrink-0">
                  {avatar ? (
                    <img src={avatar} alt="صورة الموظف" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-1">
                      <Shield className="w-7 h-7 text-amber-500 mx-auto" />
                      <span className="text-[9px] text-slate-400 font-bold block">إداري</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <p className="text-[11px] text-slate-600 font-medium">
                    يمكنك تغيير أو إضافة صورتك الشخصية لكادر الإدارة من استديو الصور أو الكاميرا.
                  </p>
                  <ImageUploader
                    value={avatar}
                    onChange={(img) => setAvatar(img)}
                    label=""
                    helperText="اختر صورة من الاستديو أو التقط صورة"
                    aspectRatio="square"
                    maxDimension={400}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Store Owner / Craftsman Personal Avatar (Optional) */}
          {userRole === "store_owner" && (
            <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-amber-600" />
                  <span>الصورة الشخصية لصاحب المتجر / المهنة</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">
                    (اختياري)
                  </span>
                </label>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar("")}
                    className="text-[10px] text-red-500 hover:text-red-700 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>حذف الصورة</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-amber-300 shadow-xs overflow-hidden flex items-center justify-center shrink-0">
                  {avatar ? (
                    <img src={avatar} alt="صورة صاحب المتجر" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-1">
                      <User className="w-7 h-7 text-amber-500 mx-auto" />
                      <span className="text-[9px] text-slate-400 font-bold block">صاحب المتجر</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    إضافة صورتك الشخصية كصاحب متجر أو مهني اختياري، وتظهر في بيانات حسابك والشريط السفلي.
                  </p>
                  <ImageUploader
                    value={avatar}
                    onChange={(img) => setAvatar(img)}
                    label=""
                    helperText="اختر صورتك الشخصية من استديو جهازك أو التقطها بالكاميرا"
                    aspectRatio="square"
                    maxDimension={400}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Store Owner Fields & Store Image from Studio */}
          {userRole === "store_owner" && (
            <div className="p-3.5 bg-orange-50/50 border border-orange-200/60 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-orange-950 flex items-center gap-1.5">
                <StoreIcon className="w-3.5 h-3.5 text-orange-600" />
                <span>بيانات المتجر التابع للحساب</span>
              </h4>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">اسم المتجر / المحل التجاري:</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="اسم المحل أو المطعم"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              {/* Store Cover / Logo from Studio */}
              <div className="p-3 bg-white border border-orange-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-orange-950 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-orange-600" />
                    <span>صورة واجهة وشعار المتجر من الاستديو</span>
                    <span className="text-[10px] text-orange-600 bg-orange-50 font-bold px-2 py-0.5 rounded-full">
                      تظهر للزبائن 🏪
                    </span>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  تغيير صورة متجرك المعروضة في قائمة المتاجر وصفحة متجرك. يمكنك استيرادها مباشرة من استديو جهازك.
                </p>
                <ImageUploader
                  value={storeImage}
                  onChange={(img) => setStoreImage(img)}
                  label="صورة المتجر"
                  helperText="اختر صورة المتجر من الاستديو أو التقط صورة بالكاميرا"
                  aspectRatio="wide"
                  maxDimension={700}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-orange-500" />
                  <span>ساعات الدوام اليومي:</span>
                </label>
                <input
                  type="text"
                  value={storeHours}
                  onChange={(e) => setStoreHours(e.target.value)}
                  placeholder="مثال: 9:00 ص - 11:30 م"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                  <span>أجرة التوصيل للزبائن:</span>
                  <span className="text-[10px] text-emerald-600 font-normal">(اختياري - 0 أو فارغ = مجاني)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={storeDeliveryFee}
                  onChange={(e) => setStoreDeliveryFee(e.target.value)}
                  placeholder="0 أو فارغ (توصيل مجاني)"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          )}

          {/* Driver: Locked profile avatar and vehicle details */}
          {userRole === "driver" && (
            <>
              {/* Driver Profile Picture (Locked - Admin Controlled) */}
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-300/80 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-white border-2 border-emerald-400 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                    {currentDriver?.avatar || userProfile?.avatar ? (
                      <img
                        src={currentDriver?.avatar || userProfile?.avatar}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-1">
                        <Bike className="w-7 h-7 text-emerald-600 mx-auto" />
                        <span className="text-[9px] text-slate-500 font-bold block">كابتن معتمد</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>صورة بروفايل الكابتن (معتمدة من الإدارة)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed font-medium">
                      🔒 <strong>تغيير الصورة تابع لإدارة المنصة:</strong> لضمان الأمان والتحقق من شخصية الكباتن أمام الزبائن والمتاجر، لا يمكن تعديل الصورة من حساب الكابتن، بل يتم التعديل والاعتماد حصراً عبر لوحة إدارة المنصة.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/60 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5 text-emerald-600" />
                  <span>بيانات مركبة كابتن التوصيل</span>
                </h4>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">نوع المركبة:</label>
                  <select
                    value={driverVehicle}
                    onChange={(e) => setDriverVehicle(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="دراجة نارية">دراجة نارية (موتور) 🛵</option>
                    <option value="سيارة">سيارة توصيل 🚗</option>
                    <option value="بسكليت">دراجة هوائية 🚲</option>
                    <option value="شاحنة صغيرة">شاحنة نقل وبضائع 🚚</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {userRole === "customer" && (
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                <span>العنوان والمعلم الأقرب لبيتك (لتسهيل استلام الطلبات):</span>
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="مثال: بجانب المدرسة الثانوية - شارع السوق"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
            </div>
          )}

          {/* Legal Terms & Agreements Button according to role */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-600" />
              <div>
                <span className="text-xs font-black text-slate-800 block">
                  وثيقة الشروط والمسؤوليات القانونية ⚖️
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  {userRole === "store_owner"
                    ? "شروط التاجر وإخلاء مسؤولية المنصة"
                    : userRole === "driver"
                    ? "قواعد الكابتن والعمل الحر والسلامة"
                    : "اتفاقية الاستخدام وإخلاء المسؤولية للزبائن"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs"
            >
              عرض البنود 📄
            </button>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2.5">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جارٍ الحفظ والمزامنة...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>حفظ التعديلات ومزامنة الحساب 💾</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("هل ترغب بتسجيل الخروج من الحساب الحالي؟")) {
                    onClose();
                    onLogout();
                  }
                }}
                className="w-full sm:w-auto py-3 px-4 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 shrink-0"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>تسجيل الخروج</span>
              </button>
            </div>

            {/* Direct button to enter Admin Dashboard under Logout button */}
            {(userRole === "admin" || currentStaff?.role === "manager") && onGoToAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToAdmin();
                }}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:to-slate-700 active:scale-98 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-slate-900/25 flex items-center justify-center gap-2.5 cursor-pointer transition-all border border-slate-700"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>الدخول إلى لوحة الإدارة 🛡️</span>
              </button>
            )}

            {/* Direct button for Store Owner: Toggle between Store Management & Customer Shopping */}
            {userRole === "store_owner" && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onToggleStoreOwnerCustomerBrowsing) {
                    onToggleStoreOwnerCustomerBrowsing();
                  } else if (onGoToStore) {
                    onGoToStore();
                  }
                }}
                className={`w-full py-3.5 px-4 active:scale-98 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg flex items-center justify-center gap-2.5 cursor-pointer transition-all border ${
                  isStoreOwnerBrowsingAsCustomer
                    ? "bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 hover:from-emerald-800 hover:to-emerald-700 shadow-emerald-900/20 border-emerald-700"
                    : "bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-500 hover:to-amber-500 shadow-orange-900/20 border-orange-500"
                }`}
              >
                {isStoreOwnerBrowsingAsCustomer ? (
                  <>
                    <StoreIcon className="w-4 h-4 text-emerald-300" />
                    <span>العودة إلى لوحة إدارة متجري 🏪</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>التسوق كزبون متسوق في المنصة 🛍️</span>
                  </>
                )}
              </button>
            )}

            {/* Direct button to enter Driver Dashboard under Logout */}
            {userRole === "driver" && onGoToDriver && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToDriver();
                }}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 hover:from-blue-800 hover:to-blue-700 active:scale-98 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2.5 cursor-pointer transition-all border border-blue-700"
              >
                <Bike className="w-4 h-4 text-blue-300" />
                <span>الدخول إلى لوحة الكابتن 🚴</span>
              </button>
            )}
          </div>
        </form>

        {/* Footer info banner */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 font-bold shrink-0">
          💡 يتم حفظ التعديلات سحابياً ومحلياً على الفور لتنعكس على جميع الطلبات ولوحات التحكم.
        </div>
      </motion.div>

      {/* Terms Agreement Viewer Modal */}
      {showTermsModal && (
        <TermsAgreementModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          role={userRole}
          showAcceptButton={false}
        />
      )}
    </div>
  );
};
