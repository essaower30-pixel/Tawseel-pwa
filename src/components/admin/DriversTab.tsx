import React, { useState } from "react";
import { 
  Bike, 
  Plus, 
  Phone, 
  MessageCircle, 
  MessageSquare,
  Star, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Power,
  DollarSign,
  Key,
  User,
  Copy,
  Check,
  Send,
  Edit2,
  Eye,
  EyeOff
} from "lucide-react";
import { DriverMember } from "../../types";
import { ContactActions } from "../ContactActions";
import { openWhatsApp } from "../../utils/whatsapp";
import { getAppUrl } from "../../utils/appUrl";
import { cleanPhoneNumber, normalizeDigits } from "../../utils/driverAuth";

interface DriversTabProps {
  driversList: DriverMember[];
  onAddDriver: (driver: DriverMember) => void;
  onUpdateDriver: (driver: DriverMember) => void;
  onDeleteDriver: (driverId: string) => void;
  currency: string;
}

export const DriversTab: React.FC<DriversTabProps> = ({
  driversList,
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver,
  currency
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverMember | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("دراجة نارية سوزوكي");
  const [pin, setPin] = useState("1111");
  const [rating, setRating] = useState<string | number>("0");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleOpenAddModal = () => {
    setEditingDriver(null);
    setName("");
    setUsername("");
    setPhone("");
    setVehicle("دراجة نارية سوزوكي");
    setPin("1111");
    setRating("0");
    setShowModal(true);
  };

  const handleOpenEditModal = (driver: DriverMember) => {
    setEditingDriver(driver);
    setName(driver.name);
    setUsername(driver.username || "");
    setPhone(driver.phone);
    setVehicle(driver.vehicle || "دراجة نارية سوزوكي");
    setPin(driver.pin || driver.password || "1111");
    setRating(driver.rating !== undefined && driver.rating !== null ? driver.rating : 0);
    setShowModal(true);
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const normalizedPhone = cleanPhoneNumber(phone.trim()) || normalizeDigits(phone.trim());
    const normalizedPin = normalizeDigits(pin.trim()) || "1111";
    const cleanName = name.trim();
    const cleanUsername = username.trim() || normalizedPhone;

    // Rating is optional and handles 0: if left empty or 0, accepted as 0
    const rawRating = typeof rating === "string" ? rating.trim() : rating;
    const parsedRating = (rawRating === "" || rawRating === null || rawRating === undefined) ? 0 : Number(rawRating);
    const finalRating = isNaN(parsedRating) ? 0 : Math.max(0, Math.min(5, parsedRating));

    if (editingDriver) {
      onUpdateDriver({
        ...editingDriver,
        name: cleanName,
        username: cleanUsername,
        phone: normalizedPhone,
        vehicle: vehicle.trim(),
        pin: normalizedPin,
        rating: finalRating
      });
    } else {
      onAddDriver({
        id: "driver_" + Date.now(),
        name: cleanName,
        username: cleanUsername,
        phone: normalizedPhone,
        vehicle: vehicle.trim(),
        pin: normalizedPin,
        status: "available",
        totalDeliveries: 0,
        earnings: 0,
        rating: finalRating,
        createdAt: new Date().toISOString()
      });
    }

    setShowModal(false);
    setEditingDriver(null);
  };

  const handleCopyCredentials = (driver: DriverMember) => {
    const appUrl = getAppUrl();
    const text = `🛵 بيانات حساب كابتن التوصيل (منصة توصيل):\n👤 اسم الكابتن: ${driver.name}\n📱 رقم الموبايل للدخول: ${driver.phone}\n👤 أو الاسم للدخول: ${driver.name}\n🔑 اسم المستخدم: ${driver.username || driver.phone}\n🔒 رمز المرور (PIN): ${driver.pin || "1111"}\n\n🌐 رابط المنصة المباشر:\n${appUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedId(driver.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendCredentialsWhatsApp = (driver: DriverMember, type: "regular" | "business" = "regular") => {
    const appUrl = getAppUrl();
    const text = `مرحباً كابتن ${driver.name} 🛵\nتم إنشاء وتفعيل حسابك في منصة "توصيل".\n\n📌 بيانات الدخول المعتمدة:\n📱 رقم الهاتف: ${driver.phone}\n👤 أو الاسم: ${driver.name}\n🔑 اسم المستخدم: ${driver.username || driver.phone}\n🔒 رمز المرور السري (PIN): ${driver.pin || "1111"}\n\n💡 ملاحظة هامة: يمكنك الدخول بسهولة عبر رقم موبايلك أو اسمك مع الرمز السري أعلاه.\n\n🌐 رابط التطبيق المباشر:\n${appUrl}\n\nبالتوفيق، إدارة منصة توصيل 🚀`;
    openWhatsApp({
      phone: driver.phone,
      message: text,
      type
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return { label: "متاح للطلب الآن 🟢", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "busy":
        return { label: "مشغول في توصيل 🟡", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      default:
        return { label: "غير متصل 🔴", bg: "bg-slate-100 text-slate-600 border-slate-200" };
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <Bike className="w-5 h-5 text-orange-500" />
            <span>إدارة أسطول الكباتن والمناديب 🛵</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            تسجيل الكباتن، تعيين اسم المستخدم ورمز المرور (PIN)، وإرسال بيانات الدخول لهم
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة كابتن جديد 🛵</span>
        </button>
      </div>

      {/* Drivers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {driversList.map((driver) => {
          const statusInfo = getStatusBadge(driver.status);
          const isCopied = copiedId === driver.id;

          return (
            <div 
              key={driver.id}
              className="bg-white rounded-3xl border border-slate-200 hover:border-orange-300 transition-all p-4 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-black text-base shadow-xs">
                      🛵
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900">{driver.name}</h4>
                      <p className="text-[11px] text-slate-400">{driver.vehicle || "دراجة نارية"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {driver.isHidden && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black border bg-amber-100 text-amber-900 border-amber-300 flex items-center gap-1">
                        <EyeOff className="w-3 h-3 text-amber-800" />
                        <span>مخفي</span>
                      </span>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${statusInfo.bg}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Login Credentials Box for Captain */}
                <div className="mt-3 p-2.5 bg-orange-50/60 border border-orange-200/80 rounded-2xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                      <User className="w-3 h-3 text-orange-500" />
                      اسم المستخدم:
                    </span>
                    <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-orange-100">
                      {driver.username || driver.phone}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                      <Key className="w-3 h-3 text-orange-500" />
                      رمز المرور (PIN):
                    </span>
                    <span className="font-mono font-black text-orange-600 bg-white px-2 py-0.5 rounded-lg border border-orange-100 tracking-wider">
                      {driver.pin || "1111"}
                    </span>
                  </div>

                  {/* Actions to send credentials */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-orange-200/50">
                    <button
                      type="button"
                      onClick={() => handleCopyCredentials(driver)}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isCopied
                          ? "bg-green-600 text-white"
                          : "bg-white hover:bg-orange-100/80 text-orange-800 border border-orange-200"
                      }`}
                    >
                      {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? "تم النسخ!" : "نسخ البيانات"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendCredentialsWhatsApp(driver, "regular")}
                      className="py-1.5 px-2 bg-[#25D366] hover:bg-[#20ba56] text-white rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                      title="إرسال بيانات الدخول للكابتن عبر واتساب العادي"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>واتساب</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendCredentialsWhatsApp(driver, "business")}
                      className="py-1.5 px-2 bg-[#075E54] hover:bg-[#054a43] text-white rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                      title="إرسال بيانات الدخول للكابتن عبر واتساب الأعمال"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>أعمال</span>
                    </button>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl border">
                    <span className="text-[10px] text-slate-400 font-bold block">التوصيلات</span>
                    <span className="font-black text-xs text-slate-800">{driver.totalDeliveries || 0} طلب</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border">
                    <span className="text-[10px] text-slate-400 font-bold block">الأرباح</span>
                    <span className="font-black text-xs text-orange-600">{(driver.earnings || 0).toLocaleString()} {currency}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border">
                    <span className="text-[10px] text-slate-400 font-bold block">التقييم</span>
                    <span className="font-black text-xs text-amber-600 flex items-center justify-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {driver.rating !== undefined && driver.rating !== null ? (driver.rating === 0 ? "0 (جديد)" : driver.rating) : "0 (جديد)"}
                    </span>
                  </div>
                </div>

                {/* Phone & Dual WhatsApp Contacts */}
                <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100 flex-wrap gap-2">
                  <span className="text-slate-400 font-bold text-[11px]">اتصال سريع:</span>
                  <ContactActions
                    phone={driver.phone}
                    name={driver.name}
                    defaultMessage={`مرحباً كابتن (${driver.name})، من إدارة منصة توصيل.`}
                    variant="compact"
                  />
                </div>
              </div>

              {/* Status Switcher & Edit/Delete */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onUpdateDriver({ ...driver, status: "available" })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black ${
                      driver.status === "available" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    متاح
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateDriver({ ...driver, status: "busy" })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black ${
                      driver.status === "busy" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    مشغول
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateDriver({ ...driver, status: "offline" })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer ${
                      driver.status === "offline" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    غير متصل
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateDriver({ ...driver, isHidden: !driver.isHidden })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-0.5 cursor-pointer transition-all ${
                      driver.isHidden
                        ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                    title={driver.isHidden ? "الكابتن مخفي حالياً - انقر لإظهاره" : "إخفاء الكابتن عن المنصة والزبائن"}
                  >
                    {driver.isHidden ? (
                      <>
                        <Eye className="w-3 h-3 text-amber-800" />
                        <span>إظهار</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 text-slate-600" />
                        <span>إخفاء</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(driver)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="تعديل بيانات الكابتن"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من حذف الكابتن "${driver.name}"؟`)) {
                        onDeleteDriver(driver.id);
                      }
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="حذف الكابتن"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Driver Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto pt-6 sm:pt-4 pb-48 sm:pb-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-right my-auto" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <Bike className="w-5 h-5 text-orange-500" />
                <span>{editingDriver ? "تعديل بيانات الكابتن" : "إضافة كابتن توصيل جديد"}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-3 text-xs text-slate-700">
              <div>
                <label className="block font-bold mb-1">اسم الكابتن الثلاثي: *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: الكابتن علاء الدين عوير"
                  className="w-full py-2.5 px-3 bg-slate-50 border rounded-xl font-bold focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">معرف أو اسم المستخدم: (اختياري)</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: capt_alaa أو اتركه فارغاً"
                    className="w-full py-2.5 px-3 bg-slate-50 border rounded-xl font-mono font-bold focus:outline-hidden focus:border-orange-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">يمكن للكابتن الدخول برقم موبايله أو اسمه مباشرة</span>
                </div>

                <div>
                  <label className="block font-bold mb-1">رمز المرور (PIN): *</label>
                  <input
                    type="text"
                    required
                    value={pin}
                    onChange={(e) => setPin(normalizeDigits(e.target.value))}
                    placeholder="1111"
                    className="w-full py-2.5 px-3 bg-slate-50 border rounded-xl font-mono text-center tracking-widest text-sm font-black focus:outline-hidden focus:border-orange-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">الرمز الافتراضي: 1111</span>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">رقم الموبايل (للدخول والتواصل): *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(normalizeDigits(e.target.value))}
                  placeholder="0951854257"
                  className="w-full py-2.5 px-3 bg-slate-50 border rounded-xl font-bold focus:outline-hidden focus:border-orange-500 text-left"
                  dir="ltr"
                />
                <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">✓ يستطيع الكابتن الدخول بهذا الرقم مباشرة</span>
              </div>

              <div>
                <label className="block font-bold mb-1">نوع المركبة / وسيلة النقل:</label>
                <input
                  type="text"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  placeholder="دراجة نارية سوزوكي / سكوتر كهربائي / سيارة"
                  className="w-full py-2.5 px-3 bg-slate-50 border rounded-xl focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">التقييم العام <span className="text-xs font-normal text-amber-600">(اختياري - يقبل 0 أو تركه فارغاً):</span></label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  placeholder="0 أو فارغ (0 - 5)"
                  className="w-full py-2.5 px-3 bg-slate-50 border rounded-xl font-bold focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingDriver ? "حفظ التعديلات 💾" : "إضافة الكابتن للأسطول 🛵"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
