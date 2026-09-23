import React, { useState } from "react";
import { Volume2, Bell, Smartphone, CheckCircle2, X, AlertTriangle, ArrowRight, ShieldCheck, Play } from "lucide-react";
import { playOrderAlertSound, showSystemNotification, triggerOrderVibration } from "../utils/soundNotifications";

interface AndroidSoundHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidSoundHelpModal: React.FC<AndroidSoundHelpModalProps> = ({
  isOpen,
  onClose
}) => {
  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTestSoundAndNotification = async () => {
    setTesting(true);
    setTestSuccess(false);

    try {
      // 1. Play loud ringing alert immediately
      playOrderAlertSound("ringtone");
      triggerOrderVibration();

      // 2. Dispatch system notification with sound & badge to Android status bar
      await showSystemNotification("🔔 رنين تجريبي لتطبيق توصيل", {
        body: "إذا سمعت صوت الرنين واهتز هاتفك مع ظهور الأيقونة أعلى الشاشة، فهاتفك مضبوط بشكل ممتاز!",
        soundType: "ringtone",
        requireInteraction: true
      });

      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 5000);
    } catch (e) {
      console.warn("Test notification error:", e);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="bg-slate-900 border-2 border-orange-500 text-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl shadow-orange-950/60 max-h-[90vh] overflow-y-auto relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-800 transition"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400 shrink-0 shadow-lg shadow-orange-500/20">
            <Volume2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              تفعيل صوت الرنين عند قفل الهاتف 🔊
            </h3>
            <p className="text-xs text-slate-300">
              حل مشكلة ظهور الإشعار كشاشة صامتة أو رقم فقط على أيقونة التطبيق
            </p>
          </div>
        </div>

        {/* Why this happens explanation */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 mb-4 text-xs text-amber-200 flex items-start gap-2.5 leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-300 mb-1">لماذا يظهر رقم على الأيقونة بدون صوت أحياناً؟</p>
            <p>
              يقوم نظام أندرويد (أجهزة سامسونغ، شاومي، هواوي، أوبو) تلقائياً بضبط إشعارات التطبيقات على وضع <strong>"صامت / التسليم الهادئ"</strong> لحفظ البطارية. لتسمع صوت الرنين العالي حتى عند قفل الشاشة، اتبع الخطوات التالية البسيطة لمرة واحدة فقط:
            </p>
          </div>
        </div>

        {/* 3 Step Guide */}
        <div className="space-y-3 mb-5">
          {/* Step 1 */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-orange-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div className="text-xs leading-relaxed">
              <p className="font-bold text-white mb-0.5">افتح معلومات تطبيق توصيل (App Info)</p>
              <p className="text-slate-300">
                اضغط مطولاً على أيقونة تطبيق <strong>توصيل 🛵</strong> في شاشتك الرئيسية واختر <strong>(معلومات التطبيق ℹ️)</strong>، أو من ضبط الهاتف: <strong>الضبط ⚙️ &larr; التطبيقات &larr; توصيل</strong>.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-orange-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div className="text-xs leading-relaxed">
              <p className="font-bold text-white mb-0.5">ادخل إلى قسم الإشعارات (Notifications)</p>
              <p className="text-slate-300">
                اضغط على خيار <strong>الإشعارات</strong> &larr; ثم <strong>فئات الإشعارات (Notification categories)</strong> أو اسم الموقع.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div className="text-xs leading-relaxed">
              <p className="font-bold text-emerald-300 mb-0.5">غيّر الوضع من صامت إلى رنين مسموع</p>
              <p className="text-slate-300">
                حوّل الإشعار من <strong>"صامت (Silent)"</strong> إلى <strong>"تنبيه بالصوت والاهتزاز (Alert / Sound)"</strong>، وفعّل خيار <strong>"إظهار كإشعار منبثق أعلى الشاشة"</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Test Button */}
        <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row gap-3 items-center">
          <button
            onClick={handleTestSoundAndNotification}
            disabled={testing}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition"
          >
            <Play className="w-4 h-4 fill-current" />
            {testing ? "جاري تشغيل الرنين التجريبي..." : "اختبار صوت الرنين والإشعار الآن 🔔"}
          </button>
          
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm transition"
          >
            فهمت ذلك
          </button>
        </div>

        {/* Success confirmation */}
        {testSuccess && (
          <div className="mt-3 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-center text-xs text-emerald-300 flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            تم إطلاق نغمة الرنين وإرسال الإشعار لشريط هاتفك بنجاح!
          </div>
        )}

      </div>
    </div>
  );
};
