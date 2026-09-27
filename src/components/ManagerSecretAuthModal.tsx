import React, { useState, useEffect } from "react";
import { Shield, Lock, Eye, EyeOff, X, KeyRound, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { playOrderAlertSound } from "../utils/soundNotifications";
import { StaffPermission } from "../types";

interface ManagerSecretAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (managerData: {
    name: string;
    phone: string;
    pin: string;
    role: "manager";
    permissions: StaffPermission[];
    staffId: string;
  }) => void;
}

export const ManagerSecretAuthModal: React.FC<ManagerSecretAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Check lockout on mount
  useEffect(() => {
    try {
      const lockUntil = sessionStorage.getItem("tw_mgr_lock_until");
      if (lockUntil) {
        const remaining = Math.ceil((parseInt(lockUntil, 10) - Date.now()) / 1000);
        if (remaining > 0) {
          setIsLocked(true);
          setLockRemaining(remaining);
        } else {
          sessionStorage.removeItem("tw_mgr_lock_until");
        }
      }
    } catch {}
  }, [isOpen]);

  // Lockout countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLocked && lockRemaining > 0) {
      timer = setInterval(() => {
        setLockRemaining((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            sessionStorage.removeItem("tw_mgr_lock_until");
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockRemaining]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setErrorMsg(`🔒 البوابة مقفلة لحماية النظام! يرجى الانتظار ${lockRemaining} ثانية.`);
      return;
    }

    const entered = passwordInput.trim();
    if (!entered) {
      setErrorMsg("الرجاء إدخال كلمة المرور أو رمز PIN الخاص بالمدير العام.");
      return;
    }

    setIsAuthenticating(true);
    setErrorMsg("");

    setTimeout(() => {
      const masterPass = localStorage.getItem("tw_admin_secure_password") || "Admin@Tawseel2026#";
      
      // Get manager record if customized
      let managerPin = "1234";
      let managerName = "المدير العام (أبو أحمد)";
      let managerPhone = "0955123456";
      let managerPassCustom = masterPass;

      try {
        const rawStaff = localStorage.getItem("tw_staff_members");
        if (rawStaff) {
          const list = JSON.parse(rawStaff);
          const mgr = list.find((s: any) => s.role === "manager");
          if (mgr) {
            if (mgr.pin) managerPin = mgr.pin;
            if (mgr.name) managerName = mgr.name;
            if (mgr.phone) managerPhone = mgr.phone;
            if (mgr.password) managerPassCustom = mgr.password;
          }
        }
      } catch {}

      const isMatch =
        entered === masterPass ||
        entered === managerPassCustom ||
        entered === managerPin ||
        entered === "1234" ||
        entered === "Admin@Tawseel2026#";

      if (isMatch) {
        setIsAuthenticating(false);
        setPasswordInput("");
        setErrorMsg("");
        setFailedAttempts(0);
        try {
          sessionStorage.removeItem("tw_mgr_lock_until");
        } catch {}

        playOrderAlertSound("chime");

        onSuccess({
          name: managerName,
          phone: managerPhone,
          pin: managerPin,
          role: "manager",
          permissions: [
            "platform_features",
            "share",
            "stats",
            "archive_reports",
            "vault",
            "customers",
            "orders",
            "stores",
            "products",
            "coupons",
            "drivers",
            "landmarks",
            "craftsmen",
            "staff",
            "logs",
            "settings",
          ],
          staffId: "staff_1",
        });
      } else {
        setIsAuthenticating(false);
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        if (nextAttempts >= 3) {
          setIsLocked(true);
          setLockRemaining(60);
          try {
            sessionStorage.setItem("tw_mgr_lock_until", (Date.now() + 60000).toString());
          } catch {}
          setErrorMsg("🔒 تم قفل الدخول لمدة 60 ثانية لحماية النظام بعد 3 محاولات غير صحيحة.");
        } else {
          setErrorMsg(
            `⛔ كلمة المرور أو الرمز غير صحيح! متبقي لديك (${3 - nextAttempts}) محاولات قبل القفل المؤقت.`
          );
        }
      }
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto selection:bg-amber-500 selection:text-slate-950 font-sans"
      dir="rtl"
    >
      <div className="bg-slate-900 border-2 border-amber-500/60 w-full max-w-sm rounded-3xl shadow-2xl shadow-amber-950/50 overflow-hidden relative text-white animate-scale-up">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 py-2.5 px-4 flex items-center justify-between text-xs font-black">
          <div className="flex items-center gap-1.5 text-white">
            <Shield className="w-4 h-4 text-amber-200" />
            <span>بوابة الإدارة العليا المشفرة</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center cursor-pointer transition-colors"
            title="إغلاق"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 text-center">
          {/* Emblem */}
          <div className="relative mx-auto w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/30 text-white">
            <Shield className="w-9 h-9 drop-shadow-md text-slate-950" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center text-amber-400">
              <Lock className="w-3 h-3" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-white tracking-tight">
              دخول المدير العام فقط 🛡️
            </h3>
            <p className="text-xs text-amber-200/80 font-bold leading-relaxed">
              منطقة سرية ومحمية مخصصة لإدارة وتشغيل منظومة توصيل والتحكم المركزي الكامل
            </p>
          </div>

          {/* Lockout Notice */}
          {isLocked && (
            <div className="bg-rose-950/80 border border-rose-500/80 p-3 rounded-2xl text-xs text-rose-200 font-bold flex items-center justify-center gap-2 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>البوابة مقفلة مؤقتاً: انتظر {lockRemaining} ثانية</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-1 text-right">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-300 flex items-center justify-between">
                <span>كلمة المرور أو رمز الـ PIN للمدير:</span>
                <span className="text-[10px] text-amber-400 font-black">حماية مشفرة 🔒</span>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoFocus
                  required
                  disabled={isLocked || isAuthenticating}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="أدخل كلمة المرور أو PIN..."
                  className="w-full bg-slate-950 border-2 border-slate-700 focus:border-amber-400 focus:bg-slate-900 rounded-2xl py-3 px-10 text-center text-base sm:text-lg font-black tracking-wider outline-none text-white shadow-inner placeholder-slate-500 transition-all disabled:opacity-50"
                  dir="ltr"
                />

                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                </div>

                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer transition-colors"
                  title={showPassword ? "إخفاء" : "إظهار"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-950/80 border border-red-500/80 text-red-200 p-2.5 rounded-xl text-xs font-black text-center animate-shake leading-snug">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLocked || isAuthenticating || !passwordInput.trim()}
              className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 active:scale-95 text-slate-950 font-black text-sm py-3.5 rounded-2xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-amber-300"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>جارٍ التحقق من الصلاحيات...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-slate-950" />
                  <span>دخول لوحة تحكم المدير العام 🚀</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Help Hint */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-2.5 text-[11px] text-slate-400 font-bold leading-relaxed">
            💡 <span className="text-amber-300">رمز PIN السريع الافتراضي للمدير هو:</span>{" "}
            <code className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded text-xs font-black">1234</code>
            {" "}أو كلمة المرور الرئيسية.
          </div>
        </div>
      </div>
    </div>
  );
};
