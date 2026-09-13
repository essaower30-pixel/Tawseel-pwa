import React, { useState } from "react";
import { 
  Radio, 
  Send, 
  Tag, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  X, 
  MessageSquare, 
  Share2, 
  Trash2, 
  Users, 
  Store as StoreIcon,
  HelpCircle,
  Megaphone,
  BellRing,
  RotateCcw,
  ExternalLink,
  Layers
} from "lucide-react";
import { StoreBroadcast, BroadcastType, BroadcastPriority, Store, Category } from "../../types";
import { openWhatsApp } from "../../utils/whatsapp";

interface StoreBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  broadcasts: StoreBroadcast[];
  stores: Store[];
  categories: Category[];
  onSendBroadcast: (broadcast: StoreBroadcast) => void;
  onDeleteBroadcast: (id: string) => void;
  onResendBroadcast: (broadcast: StoreBroadcast) => void;
}

const TEMPLATES: { label: string; type: BroadcastType; priority: BroadcastPriority; title: string; message: string }[] = [
  {
    label: "🏷️ حملة خصومات وتخفيضات",
    type: "discount",
    priority: "important",
    title: "إطلاق حملة تخفيضات خاصة برعاية الإدارة 🎉",
    message: "أعزاءنا أصحاب المتاجر، يرجى تفعيل العروض الترويجية وتجهيز تخفيضات مميزة للمنتجات الأكثر طلباً. ستقوم المنصة بتكثيف الإعلانات والإشعارات المباشرة للزبائن في عموم القرية."
  },
  {
    label: "📢 تحديث أوقات الذروة والتجهيز",
    type: "timing",
    priority: "normal",
    title: "تنبيه بأوقات الذروة وتسريع تسليم الطلبات ⏱️",
    message: "يرجى من جميع المحلات الحرص على متابعة الإشعارات والبدء الفوري بتحضير الطلبات عند الاستلام لتفادي انتظار كباتن التوصيل وضمان وصول الطلب ساخناً وطازجاً."
  },
  {
    label: "⚠️ تنبيه إداري عاجل بخصوص الجودة والتغليف",
    type: "alert",
    priority: "urgent",
    title: "تعليمات إدارية ملزمة بشأن سلامة التغليف والنظافة ⚠️",
    message: "تؤكد إدارة التطبيق على ضرورة إحكام إغلاق أكياس وعلب الطعام والمنتجات بملصق المتجر أو تدبيس محكم لحماية طلبات الأهالي، ومطابقة الفاتورة الورقية المرفقة مع الطلب."
  },
  {
    label: "💰 تسوية الحسابات وصرف المستحقات",
    type: "update",
    priority: "important",
    title: "إشعار بمواعيد تسوية الأرصدة والمستحقات المالية 💳",
    message: "نحيطكم علماً بأنه سيتم تسوية مبيعات الأسبوع وتحويل المستحقات أو تسليمها نقداً يوم الجمعة. يرجى مراجعة صفحة الأرشيف في لوحتكم للتأكد من مطابقة الأرقام."
  },
  {
    label: "🛠️ صيانة وتحديث مجدول للتطبيق",
    type: "system",
    priority: "normal",
    title: "إشعار بتحديث تقني لأنظمة الإشعارات والتوصيل ⚙️",
    message: "سيتم إجراء تحديث تقني دوري لتحسين سرعة الإشعارات وربط المناديب. التطبيق سيعمل بشكل طبيعي دون أي انقطاع في استقبال الطلبات."
  }
];

export const StoreBroadcastModal: React.FC<StoreBroadcastModalProps> = ({
  isOpen,
  onClose,
  broadcasts,
  stores,
  categories,
  onSendBroadcast,
  onDeleteBroadcast,
  onResendBroadcast
}) => {
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<BroadcastType>("discount");
  const [priority, setPriority] = useState<BroadcastPriority>("important");
  const [targetType, setTargetType] = useState<"all" | "category" | "specific">("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [successNotice, setSuccessNotice] = useState(false);

  if (!isOpen) return null;

  const handleApplyTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setTitle(tmpl.title);
    setMessage(tmpl.message);
    setType(tmpl.type);
    setPriority(tmpl.priority);
  };

  const handleToggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter(c => c !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleToggleStore = (storeId: string) => {
    if (selectedStoreIds.includes(storeId)) {
      setSelectedStoreIds(selectedStoreIds.filter(s => s !== storeId));
    } else {
      setSelectedStoreIds([...selectedStoreIds, storeId]);
    }
  };

  // Determine recipient stores count
  const targetStores = stores.filter(s => {
    if (targetType === "all") return true;
    if (targetType === "category") return selectedCategories.includes(s.category);
    if (targetType === "specific") return selectedStoreIds.includes(s.id);
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    const targetIds = targetType === "category" ? selectedCategories : targetType === "specific" ? selectedStoreIds : undefined;

    const newBroadcast: StoreBroadcast = {
      id: `bc_${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      type,
      priority,
      targetType,
      targetIds,
      senderName: "إدارة التطبيق المركزية",
      createdAt: new Date().toISOString(),
      readBy: []
    };

    onSendBroadcast(newBroadcast);
    setSuccessNotice(true);
    setTimeout(() => {
      setSuccessNotice(false);
      setTitle("");
      setMessage("");
      setActiveTab("history");
    }, 1200);
  };

  const handleShareToWhatsAppBroadcast = (bc: StoreBroadcast) => {
    const typeLabel = 
      bc.type === "discount" ? "🏷️ عروض وخصومات" :
      bc.type === "alert" ? "⚠️ تنبيه إداري عاجل" :
      bc.type === "timing" ? "⏱️ تحديث أوقات العمل" :
      bc.type === "system" ? "🛠️ إشعار تقني" : "📢 تعميم إداري";

    const text = `📢 *تعميم رسمي من إدارة المنصة لأصحاب المتاجر* 📢\n\n📌 *الموضوع:* ${bc.title}\n🔖 *النوع:* ${typeLabel}\n\n📝 *نص البيان:* \n${bc.message}\n\n⏰ *التاريخ:* ${new Date(bc.createdAt).toLocaleDateString("ar-SY")}\nيرجى الاطلاع والمتابعة من خلال لوحة تحكم متجركم في التطبيق.\nشكراً لتعاونكم الدائم! 🌟`;

    openWhatsApp({
      phone: "0944000000",
      message: text,
      type: "regular"
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-sans text-right animate-fadeIn" dir="rtl">
      <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-l from-orange-600 to-amber-500 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-inner">
              <Megaphone className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                مركز التنبيهات والتعاميم الجماعية للمتاجر (Broadcast)
              </h2>
              <p className="text-xs text-orange-100 font-medium">
                إرسال إشعارات فورية وتنبيهات خصومات وتحديثات إدارية إلى لوحات تحكم أصحاب المتاجر
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-4 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("compose")}
            className={`py-2.5 px-4 font-black text-xs rounded-t-2xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "compose"
                ? "bg-white text-orange-600 shadow-xs border-t-2 border-orange-500 border-x border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>إنشاء تعميم وتنبيه جديد</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`py-2.5 px-4 font-black text-xs rounded-t-2xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-white text-orange-600 shadow-xs border-t-2 border-orange-500 border-x border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>سجل التعاميم المرسلة ({broadcasts.length})</span>
            {broadcasts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === "compose" ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Quick Template Picker */}
              <div className="bg-orange-50/70 border border-orange-200/80 p-3.5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-orange-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    قوالب جاهزة سريعة (بنقرة واحدة):
                  </span>
                  <span className="text-[11px] text-orange-700 font-bold">تعبئة تلقائية للبيان</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="text-[11px] font-bold py-1.5 px-2.5 bg-white hover:bg-orange-100 border border-orange-200 text-slate-800 rounded-xl transition-all shadow-2xs hover:border-orange-400 active:scale-95 cursor-pointer"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 block">
                  عنوان التنبيه أو التعميم <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: خصومات نهاية الأسبوع، أو تنبيه بخصوص سرعة التجهيز..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>

              {/* Type and Priority Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 block">نوع التنبيه</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "discount", label: "🏷️ عروض وخصومات", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
                      { id: "update", label: "📢 تحديث إداري", color: "bg-blue-50 text-blue-800 border-blue-200" },
                      { id: "alert", label: "⚠️ تنبيه وتحذير", color: "bg-rose-50 text-rose-800 border-rose-200" },
                      { id: "timing", label: "⏱️ أوقات العمل", color: "bg-amber-50 text-amber-800 border-amber-200" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setType(t.id as BroadcastType)}
                        className={`p-2 rounded-xl text-xs font-black border transition-all text-center cursor-pointer ${
                          type === t.id
                            ? `${t.color} ring-2 ring-orange-500 shadow-xs font-extrabold`
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority Level */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 block">درجة الأهمية والظهور</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "normal", label: "عادي 🟢", desc: "إشعار في القائمة" },
                      { id: "important", label: "مهم 🟡", desc: "شريط بارز أعلى اللوحة" },
                      { id: "urgent", label: "عاجل 🔴", desc: "نافذة منبثقة عند الدخول" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id as BroadcastPriority)}
                        className={`p-2 rounded-xl text-xs font-black border transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                          priority === p.id
                            ? "bg-orange-50 text-orange-900 border-orange-400 ring-2 ring-orange-500 shadow-xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span>{p.label}</span>
                        <span className="text-[9px] text-slate-400 font-normal">{p.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Target Selection */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="text-xs font-black text-slate-800 block flex items-center justify-between">
                  <span>المحلات المستهدفة بالإشعار ({targetStores.length} متجر)</span>
                  <span className="text-[11px] text-slate-500 font-bold">
                    {targetType === "all" ? "جميع المحلات المشتركة" : targetType === "category" ? "حسب القطاع" : "تحديد يدوي"}
                  </span>
                </label>

                <div className="flex gap-2">
                  {[
                    { id: "all", label: "🌐 كافة المتاجر بالقرية (الكل)" },
                    { id: "category", label: "📂 قطاع أو تصنيف محدد" },
                    { id: "specific", label: "🎯 اختيار متاجر معينة" },
                  ].map((tg) => (
                    <button
                      key={tg.id}
                      type="button"
                      onClick={() => setTargetType(tg.id as any)}
                      className={`flex-1 py-2 px-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                        targetType === tg.id
                          ? "bg-white text-orange-600 border-orange-500 shadow-xs font-bold"
                          : "bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200"
                      }`}
                    >
                      {tg.label}
                    </button>
                  ))}
                </div>

                {/* Categories Multiselect */}
                {targetType === "category" && (
                  <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600 block">حدد القطاعات المطلوبة:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {categories.map((cat) => {
                        const isSelected = selectedCategories.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleToggleCategory(cat.id)}
                            className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-orange-500 text-white border-orange-600 shadow-xs"
                                : "bg-white text-slate-700 border-slate-200 hover:border-orange-300"
                            }`}
                          >
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Specific Stores Multiselect */}
                {targetType === "specific" && (
                  <div className="pt-2 border-t border-slate-200/70 space-y-1.5 max-h-36 overflow-y-auto">
                    <span className="text-[11px] font-bold text-slate-600 block">اختر المتاجر:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {stores.map((st) => {
                        const isSelected = selectedStoreIds.includes(st.id);
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => handleToggleStore(st.id)}
                            className={`p-2 rounded-xl text-xs font-bold border text-right truncate transition-all cursor-pointer ${
                              isSelected
                                ? "bg-orange-50 text-orange-900 border-orange-400 font-extrabold"
                                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            {isSelected ? "✓ " : ""}{st.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Message Body */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 block">
                  نص التنبيه والبيان الإداري <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب التوجيهات، تفاصيل العرض، التعليمات الإدارية، أو نسب الخصم بالتفصيل..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all leading-relaxed"
                />
              </div>

              {/* Success Notification */}
              {successNotice && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-emerald-800 font-black text-xs flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>تم بث التنبيه الجماعي بنجاح وتوجيهه لـ {targetStores.length} متجر في القرية! 🚀</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={!title.trim() || !message.trim()}
                  className="py-3 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>بث التنبيه لـ ({targetStores.length}) متجر الآن 📢</span>
                </button>
              </div>
            </form>
          ) : (
            /* History Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-black text-xs text-slate-700 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-orange-500" />
                  <span>سجل التعاميم الإدارية الموجهة للمتاجر</span>
                </h4>
                <span className="text-[11px] font-bold text-slate-400">
                  {broadcasts.length} تنبيهات سابقة
                </span>
              </div>

              {broadcasts.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-2">
                  <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-black text-slate-600">لا توجد تعاميم مرسلة حتى الآن</p>
                  <p className="text-[11px] text-slate-400">قم بإنشاء أول تنبيه لإشعار أصحاب المحلات بالعروض والتحديثات</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {broadcasts.map((bc) => {
                    const readCount = bc.readBy ? bc.readBy.length : 0;
                    const isUrgent = bc.priority === "urgent";
                    const isImportant = bc.priority === "important";

                    return (
                      <div
                        key={bc.id}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          isUrgent
                            ? "bg-rose-50/60 border-rose-200"
                            : isImportant
                            ? "bg-amber-50/50 border-amber-200"
                            : "bg-white border-slate-200 shadow-2xs"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                                  bc.type === "discount"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : bc.type === "alert"
                                    ? "bg-rose-100 text-rose-800 border-rose-300"
                                    : bc.type === "timing"
                                    ? "bg-amber-100 text-amber-800 border-amber-300"
                                    : "bg-blue-100 text-blue-800 border-blue-300"
                                }`}
                              >
                                {bc.type === "discount"
                                  ? "🏷️ خصومات وعروض"
                                  : bc.type === "alert"
                                  ? "⚠️ تنبيه عاجل"
                                  : bc.type === "timing"
                                  ? "⏱️ أوقات عمل"
                                  : "📢 تعميم إداري"}
                              </span>

                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                                  isUrgent
                                    ? "bg-rose-500 text-white"
                                    : isImportant
                                    ? "bg-amber-500 text-white"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {isUrgent ? "🔴 عاجل وفوري" : isImportant ? "🟡 هام" : "🟢 عادي"}
                              </span>

                              <span className="text-[10px] text-slate-400 font-bold">
                                📅 {new Date(bc.createdAt).toLocaleString("ar-SY")}
                              </span>
                            </div>

                            <h4 className="text-sm font-black text-slate-900 mt-1">{bc.title}</h4>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleShareToWhatsAppBroadcast(bc)}
                              title="إرسال عبر الواتساب"
                              className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onResendBroadcast(bc)}
                              title="إعادة البث والتنبيه"
                              className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("هل أنت متأكد من حذف هذا التعميم؟")) {
                                  onDeleteBroadcast(bc.id);
                                }
                              }}
                              title="حذف التعميم"
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Message Text */}
                        <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white/80 p-3 rounded-xl border border-slate-100">
                          {bc.message}
                        </p>

                        {/* Read Receipts & Target Footer */}
                        <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 font-bold">
                          <div className="flex items-center gap-1.5">
                            <StoreIcon className="w-3.5 h-3.5 text-orange-500" />
                            <span>
                              الهدف:{" "}
                              {bc.targetType === "all"
                                ? "كافة المحلات"
                                : bc.targetType === "category"
                                ? `قطاعات (${bc.targetIds?.length || 0})`
                                : `متاجر محددة (${bc.targetIds?.length || 0})`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>تم الاطلاع والتأكيد من: <strong>{readCount}</strong> متجر</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
