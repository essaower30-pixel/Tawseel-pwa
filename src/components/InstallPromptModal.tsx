import React, { useState, useEffect } from "react";
import { 
  Smartphone, 
  Download, 
  X, 
  CheckCircle2, 
  Zap, 
  Share, 
  PlusSquare, 
  ShieldCheck, 
  Sparkles,
  Monitor,
  ExternalLink,
  Layers
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
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [activeGuideTab, setActiveGuideTab] = useState<"android" | "ios" | "desktop">("android");
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

    // Check device type
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isDesktopDevice = !/android|iphone|ipad|ipod|mobile/.test(userAgent);
    setIsIos(isIosDevice);

    if (isIosDevice) {
      setActiveGuideTab("ios");
    } else if (isDesktopDevice) {
      setActiveGuideTab("desktop");
    } else {
      setActiveGuideTab("android");
    }

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

    // If not installed and not dismissed in this session, show after a smooth delay
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
    } else {
      // Show step-by-step installation guide
      setShowGuide(true);
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
            <span>تشغيل مستقل عن قوقل كروم</span>
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
              فتح تطبيق {appName} كنافذة مستقلة 📱
            </h3>
            <p className="text-xs text-slate-600 font-bold max-w-xs mx-auto leading-relaxed">
              اجعل التطبيق يفتح مستقلاً تماماً عن متصفح قوقل كروم: شاشة كاملة، بدون شريط العناوين، وسريع مثل التطبيقات الأصلية!
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 border border-slate-100 text-xs font-bold text-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span>نافذة مستقلة خالية من أشرطة وأزرار متصفح كروم</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <span>زر ريفرش داخلي وسحب الشاشة للتحديث من داخل التطبيق</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span>يفتح فوراً ويعمل في وضع الأوفلاين عند انقطاع الإنترنت</span>
          </div>
        </div>

        {/* Operating System / Device Tabs for Guidance */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveGuideTab("android");
                setShowGuide(true);
              }}
              className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeGuideTab === "android"
                  ? "bg-white text-orange-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>أندرويد</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveGuideTab("ios");
                setShowGuide(true);
              }}
              className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeGuideTab === "ios"
                  ? "bg-white text-orange-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>آيفون / آيباد</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveGuideTab("desktop");
                setShowGuide(true);
              }}
              className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeGuideTab === "desktop"
                  ? "bg-white text-orange-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>كمبيوتر</span>
            </button>
          </div>

          {/* Guide Steps */}
          {showGuide && (
            <div className="bg-orange-50/95 border border-orange-200 rounded-2xl p-4 space-y-3 animate-fade-in text-xs text-slate-800">
              <h4 className="font-black text-orange-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span>
                  {activeGuideTab === "android" && "خطوات التشغيل المستقل على أندرويد:"}
                  {activeGuideTab === "ios" && "خطوات التشغيل المستقل على آيفون (Safari):"}
                  {activeGuideTab === "desktop" && "خطوات التشغيل المستقل على الكمبيوتر:"}
                </span>
              </h4>

              {activeGuideTab === "android" && (
                <ol className="space-y-2 text-slate-700 font-bold pr-4 list-decimal">
                  <li>اضغط على زر <strong className="text-orange-600">«تثبيت التطبيق الآن»</strong> أدناه أو قائمة خيارات كروم <span className="font-mono text-slate-900">⋮</span>.</li>
                  <li>اختر <strong className="text-orange-600">«تثبيت التطبيق / Install App»</strong> أو «إضافة إلى الشاشة الرئيسية».</li>
                  <li>اضغط على <strong>«تثبيت»</strong> وسينزل التطبيق فوراً.</li>
                  <li className="text-emerald-700">افتح التطبيق من شاشة هاتفك وسيعمل <strong>مستقلاً تماماً وبدون شريط قوقل كروم</strong>!</li>
                </ol>
              )}

              {activeGuideTab === "ios" && (
                <ol className="space-y-2 text-slate-700 font-bold pr-4 list-decimal">
                  <li className="flex items-center gap-1.5 flex-wrap">
                    <span>اضغط على زر المشاركة</span>
                    <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-black text-slate-900">
                      <Share className="w-3.5 h-3.5 text-blue-600" /> مشاركة (Share)
                    </span>
                    <span>في أسفل المتصفح.</span>
                  </li>
                  <li className="flex items-center gap-1.5 flex-wrap">
                    <span>مرر للأسفل واختر</span>
                    <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-black text-slate-900">
                      <PlusSquare className="w-3.5 h-3.5 text-slate-700" /> إضافة إلى الصفحة الرئيسية
                    </span>
                  </li>
                  <li>اضغط على <strong>«إضافة / Add»</strong> في أعلى الشاشة.</li>
                  <li className="text-emerald-700">افتح أيقونة التطبيق الجديدة من شاشة الآيفون وسيفتح <strong>مستقلاً بدون سفاري أو كروم</strong>!</li>
                </ol>
              )}

              {activeGuideTab === "desktop" && (
                <ol className="space-y-2 text-slate-700 font-bold pr-4 list-decimal">
                  <li>في متصفح كروم أو إيدج على الكمبيوتر، اضغط على أيقونة التثبيت <span className="font-mono text-orange-600">⊕</span> في شريط العنوان أعلى اليسار.</li>
                  <li>أو اضغط زر <strong className="text-orange-600">«تثبيت التطبيق الآن»</strong> أدناه.</li>
                  <li>اضغط على <strong>«تثبيت / Install»</strong> وسيفتح التطبيق فوراً في <strong>نافذة مستقلة خاصة به</strong> كبرنامج كمبيوتر!</li>
                </ol>
              )}
            </div>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Download className="w-4 h-4 animate-bounce" />
            <span>تثبيت وتشغيل مستقل عن كروم 📲</span>
          </button>

          {!showGuide && (
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="w-full py-2 px-3 text-orange-700 hover:text-orange-800 font-black text-xs rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1"
            >
              <span>عرض خطوات التثبيت بالتفصيل</span>
            </button>
          )}

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
