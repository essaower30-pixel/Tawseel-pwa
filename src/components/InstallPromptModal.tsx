import React, { useState, useEffect } from "react";
import { 
  Smartphone, 
  Download, 
  X, 
  CheckCircle2, 
  Zap, 
  Share, 
  PlusSquare, 
  ArrowDown, 
  ShieldCheck, 
  Sparkles 
} from "lucide-react";
import { getActiveAppIcon, generateDefaultSvgIcon } from "../utils/pwaManager";

interface InstallPromptModalProps {
  appName?: string;
  onClose?: () => void;
  isOpenManual?: boolean;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  appName = "توصيل",
  onClose,
  isOpenManual = false
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [appIcon, setAppIcon] = useState<string>(() => getActiveAppIcon());

  useEffect(() => {
    // Check if already in standalone mode (already installed & opened as PWA)
    const checkStandalone = () => {
      const isStandalone = 
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone === true ||
        document.referrer.includes("android-app://");
      setIsInstalled(isStandalone);
      return isStandalone;
    };

    const standalone = checkStandalone();

    // Check iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Refresh icon from current configuration
    setAppIcon(getActiveAppIcon());

    // Listen for beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setDeferredPrompt(e);
    };

    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // If manual trigger requested, show immediately
    if (isOpenManual) {
      setIsVisible(true);
      return;
    }

    // If not installed and not dismissed in this session, show after a smooth 1-second delay
    if (!standalone) {
      const dismissed = sessionStorage.getItem("tw_install_prompt_dismissed");
      if (!dismissed) {
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, [isOpenManual]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("tw_install_prompt_dismissed", "true");
    if (onClose) onClose();
  };

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredPrompt;

    if (promptEvent) {
      try {
        promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult.outcome === "accepted") {
          setIsVisible(false);
          sessionStorage.setItem("tw_install_prompt_dismissed", "true");
          (window as any).deferredPrompt = null;
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error("Install prompt error:", err);
      }
    } else if (isIos) {
      // Toggle iOS specific guide
      setShowIosGuide(true);
    } else {
      // General guidance for Chrome / Android fallback
      setShowIosGuide(true);
    }
  };

  // If already installed or not visible, don't render modal
  if (isInstalled && !isOpenManual) return null;
  if (!isVisible && !isOpenManual) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs font-sans animate-fade-in"
      dir="rtl"
      onClick={handleDismiss}
    >
      <div 
        className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 text-slate-800 text-right space-y-4 max-h-[92vh] overflow-y-auto relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar with Close Button */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>تطبيق الهاتف الرسمي</span>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-black transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center: App Icon & Name */}
        <div className="flex flex-col items-center text-center pt-1 space-y-3">
          <div className="relative group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden shadow-xl border-2 border-orange-100 bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center p-1">
              <img
                src={appIcon}
                alt={appName}
                className="w-full h-full object-cover rounded-2xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = generateDefaultSvgIcon(512, "#f97316", appName);
                }}
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              تثبيت تطبيق {appName} 📱
            </h3>
            <p className="text-xs text-slate-500 font-semibold max-w-xs mx-auto leading-relaxed">
              احصل على تجربة تسوق وطلب سريعة ومباشرة من شاشة هاتفك الرئيسية كبرنامج مستقل.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 border border-slate-100 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span>شاشة كاملة وبدون شريط عنوان المتصفح</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <span>وصول فوري وتتبع مباشر لمندوب التوصيل</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span>توفير استهلاك الإنترنت وسرعة فتح فائقة</span>
          </div>
        </div>

        {/* iOS / Safari Step-by-Step Guide if activated */}
        {showIosGuide && (
          <div className="bg-orange-50/90 border border-orange-200 rounded-2xl p-4 space-y-3 animate-fade-in text-xs">
            <h4 className="font-black text-orange-950 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-orange-600" />
              <span>خطوات التثبيت السريعة:</span>
            </h4>
            
            {isIos ? (
              <ol className="space-y-2 text-slate-700 font-semibold pr-4 list-decimal">
                <li className="flex items-center gap-2">
                  <span>اضغط على زر المشاركة</span>
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-bold text-slate-900">
                    <Share className="w-3.5 h-3.5 text-blue-600" /> مشاركة (Share)
                  </span>
                  <span>أسفل متصفح Safari.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>مرر للأسفل واختر</span>
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-bold text-slate-900">
                    <PlusSquare className="w-3.5 h-3.5 text-slate-700" /> إضافة إلى الصفحة الرئيسية
                  </span>
                </li>
                <li>اضغط على <strong>«إضافة / Add»</strong> في أعلى اليمين.</li>
              </ol>
            ) : (
              <ol className="space-y-2 text-slate-700 font-semibold pr-4 list-decimal">
                <li>اضغط على قائمة النقاط الثلاث <strong className="font-mono font-black text-slate-900">⋮</strong> في أعلى متصفح Chrome.</li>
                <li>اختر <strong className="text-orange-600">«تثبيت التطبيق / Install app»</strong> أو «إضافة إلى الشاشة الرئيسية».</li>
                <li>اضغط على <strong>«تثبيت»</strong> وسينزل التطبيق فوراً بشعاره على هاتفك!</li>
              </ol>
            )}
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Download className="w-4 h-4 animate-bounce" />
            <span>تثبيت التطبيق على الهاتف 📲</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-600 font-black text-xs rounded-xl transition-all cursor-pointer text-center"
          >
            لاحقاً (المتابعة عبر المتصفح)
          </button>
        </div>
      </div>
    </div>
  );
};
