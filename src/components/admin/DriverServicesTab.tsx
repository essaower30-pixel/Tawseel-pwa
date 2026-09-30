import React, { useState } from "react";
import { 
  Car, 
  Plus, 
  Phone, 
  MessageCircle, 
  Search, 
  MapPin, 
  Star, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  Clock, 
  Info,
  Truck,
  Bike
} from "lucide-react";
import { DriverService } from "../../types";
import { ContactActions } from "../ContactActions";
import { matchesArabicSearch } from "../../utils/arabicSearch";
import { ImageUploader } from "../ImageUploader";

interface DriverServicesTabProps {
  driverServicesList: DriverService[];
  onAddDriverService: (driver: DriverService) => void;
  onUpdateDriverService: (driver: DriverService) => void;
  onDeleteDriverService: (id: string) => void;
}

export const DriverServicesTab: React.FC<DriverServicesTabProps> = ({
  driverServicesList,
  onAddDriverService,
  onUpdateDriverService,
  onDeleteDriverService
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverService | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [vehicle, setVehicle] = useState("تكسي أجرة وسياحي");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [serviceArea, setServiceArea] = useState("داخل البلدة وكافة القرى المجاورة والمحافظات");
  const [workingHours, setWorkingHours] = useState("متاح على مدار 24 ساعة");
  const [notes, setNotes] = useState("");
  const [availability, setAvailability] = useState<"available" | "busy" | "offline">("available");
  const [rating, setRating] = useState<string | number>("5.0");
  const [avatar, setAvatar] = useState("");

  const popularVehicles = [
    "تكسي أجرة وسياحي",
    "سوزوكي نقل بضائع وأثاث",
    "سيارة سياحية خاصة للمشاوير",
    "فان ركاب عائلي",
    "سرفيس ركاب داخلي ومحافظات",
    "دراجة نارية مشاوير سريعة",
    "شاحنة نقل خفيفة (بيك أب)"
  ];

  const openAddModal = () => {
    setEditingDriver(null);
    setName("");
    setVehicle("تكسي أجرة وسياحي");
    setPhone("");
    setWhatsapp("");
    setServiceArea("داخل البلدة وكافة القرى المجاورة والمحافظات");
    setWorkingHours("متاح على مدار 24 ساعة");
    setNotes("سيارة حديثة ومكيفة، التزام تام بالمواعيد، أسعار مناسبة");
    setAvailability("available");
    setRating("5.0");
    setAvatar("");
    setShowModal(true);
  };

  const openEditModal = (driver: DriverService) => {
    setEditingDriver(driver);
    setName(driver.name);
    setVehicle(driver.vehicle);
    setPhone(driver.phone);
    setWhatsapp(driver.whatsapp || "");
    setServiceArea(driver.serviceArea || "داخل البلدة");
    setWorkingHours(driver.workingHours || "24 ساعة");
    setNotes(driver.notes || "");
    setAvailability(driver.availability || "available");
    setRating(driver.rating !== undefined && driver.rating !== null ? driver.rating : 5.0);
    setAvatar(driver.avatar || "");
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const rawRating = typeof rating === "string" ? rating.trim() : rating;
    const parsedRating = (rawRating === "" || rawRating === null || rawRating === undefined) ? 5.0 : Number(rawRating);
    const finalRating = isNaN(parsedRating) ? 5.0 : Math.max(0, Math.min(5, parsedRating));

    if (editingDriver) {
      onUpdateDriverService({
        ...editingDriver,
        name: name.trim(),
        vehicle: vehicle.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || undefined,
        serviceArea: serviceArea.trim(),
        workingHours: workingHours.trim(),
        notes: notes.trim(),
        availability,
        rating: finalRating,
        avatar: avatar || undefined
      });
    } else {
      onAddDriverService({
        id: "drv_srv_" + Date.now(),
        name: name.trim(),
        vehicle: vehicle.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || undefined,
        serviceArea: serviceArea.trim(),
        workingHours: workingHours.trim(),
        notes: notes.trim(),
        availability,
        rating: finalRating,
        avatar: avatar || undefined,
        createdAt: new Date().toISOString()
      });
    }

    setShowModal(false);
  };

  const toggleAvailability = (driver: DriverService) => {
    const nextStatus = driver.availability === "available" ? "busy" : "available";
    onUpdateDriverService({
      ...driver,
      availability: nextStatus
    });
  };

  // Distinct vehicles
  const vehicleTypes = Array.from(
    new Set(driverServicesList.map((d) => d.vehicle.trim()).filter(Boolean))
  );

  const filteredDrivers = driverServicesList.filter((driver) => {
    const driverFullText = `${driver.name} ${driver.vehicle} ${driver.phone} ${driver.serviceArea || ""} ${driver.workingHours || ""} ${driver.notes || ""} سائق كابتن تكسي توصيل نقل`;
    const matchesSearch = matchesArabicSearch(driverFullText, searchQuery);
    const matchesVehicle = selectedVehicleFilter === "all" || driver.vehicle.trim() === selectedVehicleFilter;
    return matchesSearch && matchesVehicle;
  });

  const getVehicleIcon = (veh: string) => {
    if (veh.includes("سوزوكي") || veh.includes("بضائع") || veh.includes("بيك أب") || veh.includes("شاحنة")) {
      return <Truck className="w-5 h-5 text-blue-600" />;
    }
    if (veh.includes("دراجة") || veh.includes("موتور")) {
      return <Bike className="w-5 h-5 text-orange-600" />;
    }
    return <Car className="w-5 h-5 text-emerald-600" />;
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Header and Add Button */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-blue-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-black">
              دليل وبطاقات خدمات السائقين والتكاسي 🚗
            </h2>
            <p className="text-xs text-blue-200/90 font-medium mt-0.5">
              إضافة وإدارة السائقين العموميين، التكاسي، وسيارات نقل البضائع (تظهر كبطاقات تعريفية مباشرة للزبائن مع اتصال وواتساب)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 border border-blue-400/40 active:scale-95"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>+ إضافة سائق / تكسي جديد</span>
        </button>
      </div>

      {/* Info Notice about difference from fleet delivery drivers */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
        <Info className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <b>ملاحظة تنظيمية:</b> هذا القسم مخصص لـ <b>خدمات النقل والتكاسي العامة</b> (مثل: تكسي البلدة، سوزوكي نقل بضائع وأثاث، مشاوير محافظات). السائق هنا يظهر للزبون في شاشة <b>"خدمات وسائقين"</b> كبطاقة تواصل مباشر عبر الاتصال والواتساب، بدون الحاجة لإنشاء متجر منتجات أو سلة تسوق.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم السائق، نوع المركبة (تكسي، سوزوكي)، خط السير، أو رقم الهاتف..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl py-2.5 pr-10 pl-4 text-xs sm:text-sm outline-none text-slate-800 transition-all text-right"
          />
          <Search className="w-4.5 h-4.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Vehicle filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedVehicleFilter("all")}
            className={`py-1.5 px-3 rounded-xl font-black whitespace-nowrap transition-all cursor-pointer ${
              selectedVehicleFilter === "all"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            كافة الخدمات ({driverServicesList.length})
          </button>
          {vehicleTypes.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setSelectedVehicleFilter(v)}
              className={`py-1.5 px-3 rounded-xl font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedVehicleFilter === v
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Drivers Cards Grid */}
      {filteredDrivers.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
            <Car className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">
            لا يوجد سائقين أو خدمات نقل مطابقة
          </h4>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            يمكنك إضافة سائق تكسي أو خدمة نقل جديدة بالضغط على زر "إضافة سائق / تكسي جديد" بالأعلى.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrivers.map((driver) => {
            const isAvailable = driver.availability !== "offline" && driver.availability !== "busy";
            return (
              <div
                key={driver.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 text-right relative overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Top Bar: Name, Vehicle Badge, and Availability Toggle */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        {getVehicleIcon(driver.vehicle)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 text-sm truncate">
                          {driver.name}
                        </h4>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-black truncate max-w-[170px]">
                          {driver.vehicle}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleAvailability(driver)}
                      title="انقر لتغيير حالة التوافر"
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full border transition-all cursor-pointer shrink-0 ${
                        isAvailable
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      {isAvailable ? "🟢 متاح للعمل" : "🟡 مشغول حالياً"}
                    </button>
                  </div>

                  {/* Details List */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    {driver.serviceArea && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span className="font-bold text-slate-700">{driver.serviceArea}</span>
                      </div>
                    )}
                    {driver.workingHours && (
                      <div className="flex items-center gap-1.5 text-amber-800">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-medium">{driver.workingHours}</span>
                      </div>
                    )}
                    {driver.notes && (
                      <p className="text-[11px] text-slate-500 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                        💡 {driver.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Actions: Contact & Manage */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <ContactActions
                    phone={driver.phone}
                    name={driver.name}
                    defaultMessage={`مرحباً كابتن ${driver.name}، أود الاستفسار وطلب خدمة توصيل / مشوار (${driver.vehicle}).`}
                    variant="full"
                  />

                  <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                    <div className="flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{driver.rating || 5.0}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(driver)}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                        title="تعديل بيانات السائق"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف السائق "${driver.name}" من الدليل؟`)) {
                            onDeleteDriverService(driver.id);
                          }
                        }}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
                        title="حذف من الدليل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Driver Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 my-auto text-right space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                <span>{editingDriver ? "تعديل بطاقة السائق / التكسي" : "إضافة بطاقة سائق / تكسي جديد"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs sm:text-sm">
              {/* Driver Name */}
              <div>
                <label className="block text-slate-700 font-black mb-1">
                  اسم السائق أو الشهرة *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: الكابتن أحمد عوير - تكسي الأمانة"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs sm:text-sm outline-none font-bold"
                />
              </div>

              {/* Vehicle & Service Type */}
              <div>
                <label className="block text-slate-700 font-black mb-1">
                  نوع المركبة والخدمة *
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    required
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    placeholder="مثال: تكسي أجرة سياحي / سوزوكي نقل أثاث"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs sm:text-sm outline-none font-bold"
                  />
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    {popularVehicles.map((pv) => (
                      <button
                        key={pv}
                        type="button"
                        onClick={() => setVehicle(pv)}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold border border-slate-200 transition-colors cursor-pointer"
                      >
                        {pv}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Phone & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-black mb-1">
                    رقم الهاتف للاتصال المباشر *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xxxxxxxx"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs sm:text-sm outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-black mb-1">
                    رقم الواتساب (اختياري)
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="نفس رقم الهاتف إذا ترك فارغاً"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs sm:text-sm outline-none"
                  />
                </div>
              </div>

              {/* Service Area & Route */}
              <div>
                <label className="block text-slate-700 font-black mb-1">
                  منطقة الخدمة وخط السير
                </label>
                <input
                  type="text"
                  value={serviceArea}
                  onChange={(e) => setServiceArea(e.target.value)}
                  placeholder="مثال: داخل البلدة، ريف دمشق، وكافة المحافظات"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs sm:text-sm outline-none"
                />
              </div>

              {/* Working Hours & Availability */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-black mb-1">
                    أوقات الدوام والتوافر
                  </label>
                  <input
                    type="text"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    placeholder="مثال: متاح على مدار 24 ساعة"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs sm:text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-black mb-1">
                    حالة التوافر الحالية
                  </label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs sm:text-sm outline-none font-bold"
                  >
                    <option value="available">🟢 متاح للعمل الآن</option>
                    <option value="busy">🟡 مشغول بمشوار حالياً</option>
                    <option value="offline">⚪ غير متاح مؤقتاً</option>
                  </select>
                </div>
              </div>

              {/* Notes & Features */}
              <div>
                <label className="block text-slate-700 font-black mb-1">
                  ملاحظات ومميزات الخدمة (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: سيارة حديثة مكيفة، توصيل طلبات عائلية، نقل أثاث، أسعار مناسبة..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs sm:text-sm outline-none"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-slate-700 font-black mb-1">
                  التقييم (من 0 إلى 5)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs sm:text-sm outline-none font-bold"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  {editingDriver ? "حفظ التعديلات ✅" : "إضافة السائق الآن 🚗"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
