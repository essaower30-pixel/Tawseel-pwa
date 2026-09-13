import React, { useState } from "react";
import { 
  Wrench, 
  Plus, 
  Phone, 
  MessageCircle, 
  Search, 
  MapPin, 
  Star, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  UserCheck 
} from "lucide-react";
import { Craftsman } from "../../types";
import { ContactActions } from "../ContactActions";

interface CraftsmenTabProps {
  craftsmenList: Craftsman[];
  onAddCraftsman: (craftsman: Craftsman) => void;
  onUpdateCraftsman: (craftsman: Craftsman) => void;
  onDeleteCraftsman: (id: string) => void;
}

export const CraftsmenTab: React.FC<CraftsmenTabProps> = ({
  craftsmenList,
  onAddCraftsman,
  onUpdateCraftsman,
  onDeleteCraftsman
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCraft, setSelectedCraft] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingCraftsman, setEditingCraftsman] = useState<Craftsman | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [craft, setCraft] = useState("سباك وتمديدات صحية");
  const [phone, setPhone] = useState("");
  const [neighborhood, setNeighborhood] = useState("وسط البلد");
  const [description, setDescription] = useState("");
  const [availability, setAvailability] = useState<"available" | "busy" | "offline">("available");
  const [rating, setRating] = useState<string | number>("0");

  const craftTypes = [
    "سباك وتمديدات صحية",
    "كهربائي وطاقة شمسية",
    "نجارة وموبيليا وألمنيوم",
    "حدادة وأبواب فولاذية",
    "طبيب بيطري وأدوية زراعية",
    "ميكانيك سيارات ودراجات",
    "دهان وديكورات داخلية",
    "فني تكييف وتبريد وغسالات",
    "طبيب بشري وصيدلي",
    "بناء وإكساء وترميم",
    "خياط وتنجيد",
    "حلاق رجالي / كوافير"
  ];

  const openAddModal = () => {
    setEditingCraftsman(null);
    setName("");
    setCraft("سباك وتمديدات صحية");
    setPhone("");
    setNeighborhood("وسط البلد");
    setDescription("");
    setAvailability("available");
    setRating("0");
    setShowModal(true);
  };

  const openEditModal = (c: Craftsman) => {
    setEditingCraftsman(c);
    setName(c.name);
    setCraft(c.craft);
    setPhone(c.phone);
    setNeighborhood(c.neighborhood);
    setDescription(c.description || "");
    setAvailability(c.availability || "available");
    setRating(c.rating !== undefined && c.rating !== null ? c.rating : 0);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    // Rating is optional and handles 0: if left empty or 0, accepted as 0
    const rawRating = typeof rating === "string" ? rating.trim() : rating;
    const parsedRating = (rawRating === "" || rawRating === null || rawRating === undefined) ? 0 : Number(rawRating);
    const finalRating = isNaN(parsedRating) ? 0 : Math.max(0, Math.min(5, parsedRating));

    if (editingCraftsman) {
      onUpdateCraftsman({
        ...editingCraftsman,
        name: name.trim(),
        craft,
        phone: phone.trim(),
        neighborhood: neighborhood.trim(),
        description: description.trim(),
        availability,
        rating: finalRating
      });
    } else {
      onAddCraftsman({
        id: "craft_" + Date.now(),
        name: name.trim(),
        craft,
        phone: phone.trim(),
        neighborhood: neighborhood.trim(),
        description: description.trim(),
        availability,
        rating: finalRating
      });
    }

    setShowModal(false);
  };

  const filtered = craftsmenList.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.craft.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCraft = selectedCraft === "all" || c.craft.includes(selectedCraft);
    return matchesSearch && matchesCraft;
  });

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-500" />
            <span>دليل الحرفيين وأصحاب المهن والخدمات 🛠️</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">قاعدة بيانات شاملة لكافة الحرفيين والمهن المعتمدة في القرية لخدمة الأهالي</p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة حرفي / صاحب مهنة 🛠️</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم أو المهنة أو المنطقة..."
            className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
          />
        </div>

        <select
          value={selectedCraft}
          onChange={(e) => setSelectedCraft(e.target.value)}
          className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
        >
          <option value="all">كافة المهن والحرف ({craftsmenList.length})</option>
          {craftTypes.map((ct, idx) => (
            <option key={idx} value={ct}>{ct}</option>
          ))}
        </select>
      </div>

      {/* Craftsmen Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((craftsman) => {
          const isAvailable = craftsman.availability !== "offline" && craftsman.availability !== "busy";

          return (
            <div 
              key={craftsman.id}
              className="bg-white rounded-3xl border border-slate-200 hover:border-orange-300 transition-all p-4 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-black text-base">
                      🛠️
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900">{craftsman.name}</h4>
                      <span className="inline-block text-[11px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100 mt-0.5">
                        {craftsman.craft}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                    isAvailable ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>
                    {isAvailable ? "متاح للخدمة 🟢" : "غير متاح حالياً"}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
                  {craftsman.description || "لا يوجد وصف مدخل للحرفي"}
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 text-[11px]">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{craftsman.neighborhood || "وسط البلد"}</span>
                  </span>
                  <span className="flex items-center gap-1 font-bold text-amber-500 text-[11px]">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {craftsman.rating !== undefined && craftsman.rating !== null ? (craftsman.rating === 0 ? "0 (جديد)" : craftsman.rating) : "0 (جديد)"}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Dual WhatsApp, Phone, Edit, Delete */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                <ContactActions
                  phone={craftsman.phone}
                  name={craftsman.name}
                  defaultMessage={`مرحباً ${craftsman.name} (${craftsman.craft})، أود الاستفسار عن خدمة مهنية.`}
                  variant="compact"
                />

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(craftsman)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                    title="تعديل"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`حذف صاحب المهنة "${craftsman.name}"؟`)) {
                        onDeleteCraftsman(craftsman.id);
                      }
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Craftsman Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto pt-6 sm:pt-4 pb-48 sm:pb-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-right my-auto" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-500" />
                <span>{editingCraftsman ? "تعديل بيانات الحرفي 🛠️" : "إضافة حرفي جديد لدليل القرية 🛠️"}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs text-slate-700">
              <div>
                <label className="block font-bold mb-1">الاسم الكامل: *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: المعلم أبو النور"
                  className="w-full py-2 px-3 bg-slate-50 border rounded-xl font-bold focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">المهنة أو الحرفة: *</label>
                <select
                  value={craft}
                  onChange={(e) => setCraft(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border rounded-xl font-bold focus:outline-hidden focus:border-orange-500"
                >
                  {craftTypes.map((ct, idx) => (
                    <option key={idx} value={ct}>{ct}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">رقم الموبايل / واتساب: *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0991234567"
                  className="w-full py-2 px-3 bg-slate-50 border rounded-xl font-bold focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">المنطقة أو الحي:</label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="الحارة الشرقية، جانب المسجد..."
                  className="w-full py-2 px-3 bg-slate-50 border rounded-xl focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">وصف الخدمات التي يقدمها:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="تصليح وصيانة كافة الأعطال المنزلية والورشات..."
                  className="w-full py-2 px-3 bg-slate-50 border rounded-xl focus:outline-hidden focus:border-orange-500"
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
                  className="w-full py-2 px-3 bg-slate-50 border rounded-xl font-bold focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingCraftsman ? "حفظ التعديلات ✓" : "إضافة الحرفي للدليل 🛠️"}
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
