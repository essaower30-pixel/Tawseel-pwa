import React, { useState } from "react";
import { 
  FileText, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Copy, 
  Check, 
  Share2, 
  Smartphone, 
  Store, 
  Bike, 
  Users, 
  ShieldCheck, 
  Zap, 
  Database, 
  Scale, 
  Download, 
  MessageSquare,
  Printer,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { openWhatsApp } from "../../utils/whatsapp";
import { getAppUrl } from "../../utils/appUrl";
import { AppSettings } from "../../types";

interface PlatformFeaturesTabProps {
  appSettings: AppSettings;
  currency?: string;
}

export const PlatformFeaturesTab: React.FC<PlatformFeaturesTabProps> = ({
  appSettings,
  currency = "ل.س"
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeAudience, setActiveAudience] = useState<"all" | "merchants" | "drivers" | "customers" | "tech">("all");

  const appUrl = getAppUrl(appSettings);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const marketingPitch = `🚀 *منصة (${appSettings.appName}) الذكية للتسوق والتوصيل المحلي* 🛍️

أقوى منظومة تجارية متكاملة لربط أهالي البلدة بالمحلات والمطاعم والكباتن:

✨ *لماذا تختار منصتنا؟*
1️⃣ *للزبائن:* تصفح منيو كافة المتاجر، طلب خاص وتصوير ورقة المقاضي بالكاميرا، روشتات أدوية، وتتبع الطلب لحظة بلحظة.
2️⃣ *لأصحاب المحلات:* لوحة تحكم فورية، تنبيهات رنين بالطلبات، خيارات الأحجام والإضافات، وبث العروض لأهالي البلدة.
3️⃣ *لكباتن التوصيل:* رادار ذكي للطلبات القريبة، نظام ملاحة دقيق، ومحفظة مالية لحسابات الكاش والأجور.
4️⃣ *استقرار وسرعة فائقة:* تعمل بسيرفرات Google Cloud فائقة السعة ومحمية بقواعد بيانات سحابية وتخزين ذكي دون انقطاع.

🌐 جرب المنصة الآن واطلب بكل سهولة:
${appUrl}`;

  const merchantPitch = `🏪 *عرض خاص لأصحاب المحلات والمطاعم للانضمام لمنصة (${appSettings.appName})*

ضاعف مبيعاتك واستقبل طلبات أهالي البلدة مباشرة على هاتفك:
✅ متجر إلكتروني متكامل باسم محلك ومنيو أصنافك وأسعارك.
✅ تنبيهات صوتية ورنين عند كل طلب جديد مع خيار قبول/رفض وتحديد وقت التجهيز.
✅ استقبال طلبات المنتجات غير المعروضة أو المصورة بالكاميرا من الزبائن.
✅ إرسال إشعارات وعروض ترويجية لجميع مستخدمي التطبيق بضغطة زر.
✅ تقارير مبيعات وحسابات دقيقة لحجم دخلك اليومي والشهري.

📞 تواصل معنا لتفعيل متجرك فوراً: ${appSettings.contactPhone || "0991234567"}
🌐 رابط المنصة: ${appUrl}`;

  const driverPitch = `🛵 *فرصة عمل: انضم لكباتن التوصيل في منصة (${appSettings.appName})*

حقق دخلاً ممتازاً بأوقات عمل مرنة:
✅ استقبال الطلبات القريبة منك فوراً بإشعارات ورنين مميز.
✅ نظام ملاحة وتوجيه دقيق لموقع المتجر وموقع الزبون.
✅ محفظة مالية واضحة لحساب أجور التوصيل والطلبات المحصلة كاش.
✅ زر للتبديل بين (متاح للعمل / غير متاح) بحرية تامة.

📞 للتسجيل والانضمام: ${appSettings.contactPhone || "0991234567"}`;

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-800/40 rounded-3xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-orange-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-purple-500/25 shrink-0">
              💎
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  ملف ميزات واستطاعة المنصة والترويج التسويقي
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 text-[10px] font-black border border-purple-400/30">
                  سلاح الإدارة للتسويق 📢
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-1">
                دليل شامل لإمكانيات واستطاعة النظام، وجاهزية نصوص التسويق لإقناع التجار، الكباتن، والزبائن بالانضمام.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(marketingPitch, "general")}
              className="py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {copiedSection === "general" ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSection === "general" ? "تم نسخ المنشور التسويقي!" : "نسخ المنشور العام 📋"}</span>
            </button>
            <button
              type="button"
              onClick={() => openWhatsApp({ message: marketingPitch })}
              className="py-2.5 px-3.5 bg-[#25D366] hover:bg-[#20ba56] text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>مشاركة واتساب 💬</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Audience Switcher */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none p-1.5 bg-white rounded-2xl border border-slate-200">
        {[
          { id: "all", label: "جميع الميزات الشاملة", icon: Sparkles },
          { id: "merchants", label: "ميزات أصحاب المحلات والمطاعم", icon: Store },
          { id: "drivers", label: "ميزات كباتن التوصيل", icon: Bike },
          { id: "customers", label: "ميزات الزبائن والمجتمع", icon: Users },
          { id: "tech", label: "استطاعة السيرفرات والأمان التقني", icon: Database }
        ].map((item) => {
          const isActive = activeAudience === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveAudience(item.id as any)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. TECHNICAL INFRASTRUCTURE & CAPACITY (استطاعة التطبيق التقنية) */}
      {(activeAudience === "all" || activeAudience === "tech") && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  1. استطاعة التطبيق وقوة التحمل تحت الضغط (Infrastructure & Scalability) ⚡
                </h3>
                <p className="text-slate-400 text-xs">قوة الخوادم السحابية والأمان ومقاومة الانهيار</p>
              </div>
            </div>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-1 rounded-full">
              مدعوم بسحابة Google ☁️
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1.5">
              <span className="text-xl">👥</span>
              <h4 className="font-black text-slate-900 text-xs">المستخدمين المتصلين معاً</h4>
              <p className="text-blue-700 font-black text-sm">مئات الآلاف إلى ملايين الزبائن</p>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                توسع تلقائي فوري (Auto-scaling) لخوادم Google لامتصاص أي ضغط مفاجئ في أوقات الذروة.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1.5">
              <span className="text-xl">🏪</span>
              <h4 className="font-black text-slate-900 text-xs">المتاجر والمنتجات</h4>
              <p className="text-emerald-700 font-black text-sm">غير محدود عملياً (سعة لا نهائية)</p>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                قاعدة بيانات Firestore مصممة للتعامل مع مليارات السجلات والمنتجات دون أي تباطؤ.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1.5">
              <span className="text-xl">📦</span>
              <h4 className="font-black text-slate-900 text-xs">سجل الطلبات والأرشيف</h4>
              <p className="text-purple-700 font-black text-sm">ملايين الطلبات والتقارير</p>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                حفظ وأرشفة العمليات المالية وسجلات المحاسبة لسنوات طويلة مع سرعة بحث فورية.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-1.5">
              <span className="text-xl">📶</span>
              <h4 className="font-black text-slate-900 text-xs">العمل دون انقطاع (Offline)</h4>
              <p className="text-amber-700 font-black text-sm">تخزين مؤقت ذكي ومحمي</p>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                عند ضعف الإنترنت، يحفظ التطبيق السلة والبيانات محلياً ويعيد المزامنة فور عودة الاتصال.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. MERCHANT FEATURES & PITCH (ميزات أصحاب المحلات والمطاعم) */}
      {(activeAudience === "all" || activeAudience === "merchants") && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  2. ميزات المحلات والمطاعم (كتاب التسويق للتجار) 🏪
                </h3>
                <p className="text-slate-400 text-xs">نقاط القوة لإقناع أصحاب المحلات بالانضمام للمنصة</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(merchantPitch, "merchant")}
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
              >
                {copiedSection === "merchant" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>نسخ منشور إقناع التجار 📋</span>
              </button>
              <button
                type="button"
                onClick={() => openWhatsApp({ message: merchantPitch })}
                className="py-1.5 px-3 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>إرسال لتاجر واتساب</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                <span className="text-orange-500">✓</span>
                <span>رنين وتنبيهات صوتية فورية:</span>
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                لا يفوت المحل أي طلب؛ يصدر التطبيق صوتاً مميزاً عند وصول طلب جديد حتى قبول التجهيز.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                <span className="text-orange-500">✓</span>
                <span>تخصيص الأحجام والإضافات:</span>
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                إمكانية بيع الوجبات والمنتجات بأحجام متعددة (صغير، وسط، كبير) وإضافات مدفوعة (جبنة، صوصات...).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                <span className="text-orange-500">✓</span>
                <span>استقبال الطلب الخاص المصور:</span>
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                يستقبل المتجر قوائم المقاضي المكتوبة بخط اليد أو المصورة بكاميرا الزبون للأصناف غير المعروضة.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                <span className="text-orange-500">✓</span>
                <span>بث الإعلانات والعروض (Broadcast):</span>
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                يمكن لصاحب المتجر إرسال عروض وتخفيضات تصل كإشعار بارز لجميع زبائن التطبيق بالقرية.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                <span className="text-orange-500">✓</span>
                <span>التحكم بأوقات العمل والاستقبال:</span>
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                زر سريع لفتح وإغلاق المتجر أو جدولة استقبال الطلبات حتى في أوقات الإغلاق.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                <span className="text-orange-500">✓</span>
                <span>تقارير الأرباح والمبيعات:</span>
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                إحصائيات يومية وشهرية توضح للمتجر عدد الطلبات ومجموع مبيعاته دون الحاجة لدفاتر ورقية.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. DRIVER FEATURES & PITCH (ميزات كباتن التوصيل) */}
      {(activeAudience === "all" || activeAudience === "drivers") && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  3. ميزات كباتن التوصيل والمناديب 🛵
                </h3>
                <p className="text-slate-400 text-xs">محفزات جذب السائقين والمناديب للعمل مع المنصة</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(driverPitch, "driver")}
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
              >
                {copiedSection === "driver" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>نسخ إعلان كباتن التوصيل 📋</span>
              </button>
              <button
                type="button"
                onClick={() => openWhatsApp({ message: driverPitch })}
                className="py-1.5 px-3 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>إرسال لكابتن واتساب</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                <span className="text-amber-500">✓</span>
                <span>رادار الطلبات القريبة:</span>
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                يظهر للكابتن فوراً أي طلب جاهز للاستلام مع تنبيه صوتي ورنين يلفت انتباهه.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                <span className="text-amber-500">✓</span>
                <span>توجيه وملاحة دقيقة:</span>
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                زر اتصال وموقع مباشر للمتجر والزبون لتوفير الوقت والوقود وسرعة الوصول.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                <span className="text-amber-500">✓</span>
                <span>محفظة الكاش والعمولات:</span>
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                حساب آلي دقيق للمبالغ النقدية المحصلة من الزبائن وأجور التوصيل المستحقة للكابتن.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. CUSTOMER & COMMUNITY FEATURES (ميزات الزبائن وتجربة المستخدم) */}
      {(activeAudience === "all" || activeAudience === "customers") && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  4. ميزات الزبائن وخدمة المجتمع 🛍️
                </h3>
                <p className="text-slate-400 text-xs">تجربة تسوق مريحة وشاملة لأهالي البلدة والقرى المجاورة</p>
              </div>
            </div>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2.5 py-1 rounded-full">
              سهل وسريع جداً ⚡
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                <span className="text-purple-600">✓</span>
                <span>الطلب الخاص من المتجر (Custom Order):</span>
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                كتابة طلبات حرة أو التقاط صورة ورقة المقاضي بالكاميرا ليحضرها المتجر والكابتن فوراً.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                <span className="text-purple-600">✓</span>
                <span>روشتات ووصفات الصيدليات:</span>
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                تصوير الوصفة الطبية وإرسالها للصيدلي لتحضير الدواء وتوصيله بسرية وسرعة.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                <span className="text-purple-600">✓</span>
                <span>دليل أصحاب المهن والحرفيين:</span>
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                دليل هواتف لمهنيي البلدة (كهربائي، سباك، نجار، حداد...) لخدمة الأهالي في أي وقت.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                <span className="text-purple-600">✓</span>
                <span>كوبونات الخصم والعروض الأسبوعية:</span>
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                تطبيق أكواد الخصم الترويجية مباشرة في السلة للاستفادة من تخفيضات المتاجر.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                <span className="text-purple-600">✓</span>
                <span>تثبيت كتطبيق هاتف (PWA):</span>
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                يعمل كتطبيق جوال أصيل بدون الحاجة لتنزيله من متجر التطبيقات مع أيقونة على الشاشة الرئيسية.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                <span className="text-purple-600">✓</span>
                <span>تسجيل كبار السن بمساعدة الإدارة:</span>
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                إمكانية تسجيل بيانات وعناوين من لا يجيد التطبيق عبر الهاتف لتسهيل طلباتهم هاتفياً.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. LEGAL & PROTECTION (المنظومة القانونية وإخلاء المسؤولية) */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
          <Scale className="w-4 h-4 text-purple-600" />
          <span>المنظومة القانونية وحماية إدارة المنصة (Legal Safety & Compliance) ⚖️</span>
        </div>
        <p className="text-slate-600 text-xs leading-relaxed">
          تم تزويد المنصة باتفاقيات شروط استخدام وإخلاء مسؤولية قانونية دقيقة لكل طرف (الزبائن، أصحاب المتاجر لضمان جودة الأغذية وصلاحيتها، وكباتن التوصيل للسلامة المرورية والأمانة)، مع إلزامية الموافقة والتوثيق عند أول استخدام.
        </p>
      </div>
    </div>
  );
};
