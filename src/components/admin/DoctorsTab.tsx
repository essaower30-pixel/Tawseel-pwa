import React, { useState } from "react";
import { 
  Stethoscope, 
  Plus, 
  Search, 
  MapPin, 
  Clock, 
  Trash2, 
  Edit, 
  FileText,
  UserCheck
} from "lucide-react";
import { Doctor } from "../../types";
import { ContactActions } from "../ContactActions";
import { matchesArabicSearch } from "../../utils/arabicSearch";

interface DoctorsTabProps {
  doctorsList: Doctor[];
  onAddDoctor: (doctor: Doctor) => void;
  onUpdateDoctor: (doctor: Doctor) => void;
  onDeleteDoctor: (id: string) => void;
}

export const DoctorsTab: React.FC<DoctorsTabProps> = ({
  doctorsList,
  onAddDoctor,
  onUpdateDoctor,
  onDeleteDoctor
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  // Form State (strictly: name, specialty, phone + optional clinic/hours)
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  // Preset medical specialties for quick 1-click select
  const commonSpecialties = [
    "طب أطفال وحديثي ولادة",
    "طب وجراحة الأسنان",
    "أمراض باطنية وقلبية",
    "أمراض نسائية وتوليد",
    "جراحة عظمية ومفاصل",
    "طب عام وإسعافات",
    "طب وجراحة العيون",
    "أمراض جلدية وتناسلية",
    "أنف وأذن وحنجرة",
    "جراحة عامة وتنظيرية",
    "طب نفسي وعصبي"
  ];

  const openAddModal = () => {
    setEditingDoctor(null);
    setName("");
    setSpecialty("");
    setPhone("");
    setClinicAddress("");
    setWorkingHours("");
    setNotes("");
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (doc: Doctor) => {
    setEditingDoctor(doc);
    setName(doc.name);
    setSpecialty(doc.specialty);
    setPhone(doc.phone);
    setClinicAddress(doc.clinicAddress || "");
    setWorkingHours(doc.workingHours || "");
    setNotes(doc.notes || "");
    setFormError("");
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("الرجاء إدخال اسم الطبيب.");
      return;
    }
    if (!specialty.trim()) {
      setFormError("الرجاء إدخال أو اختيار الاختصاص الطبي.");
      return;
    }
    if (!phone.trim()) {
      setFormError("الرجاء إدخال رقم هاتف التواصل الخاص بالطبيب.");
      return;
    }

    if (editingDoctor) {
      onUpdateDoctor({
        ...editingDoctor,
        name: name.trim(),
        specialty: specialty.trim(),
        phone: phone.trim(),
        clinicAddress: clinicAddress.trim() || undefined,
        workingHours: workingHours.trim() || undefined,
        notes: notes.trim() || undefined
      });
    } else {
      const newDoc: Doctor = {
        id: `doc_${Date.now()}`,
        name: name.trim(),
        specialty: specialty.trim(),
        phone: phone.trim(),
        clinicAddress: clinicAddress.trim() || undefined,
        workingHours: workingHours.trim() || undefined,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      onAddDoctor(newDoc);
    }

    setShowModal(false);
  };

  const handleDelete = (id: string, docName: string) => {
    if (window.confirm(`هل أنت متأكد من حذف بطاقة الطبيب (${docName}) من الدليل الطبي؟`)) {
      onDeleteDoctor(id);
    }
  };

  // Distinct specialties in list
  const availableSpecialties = Array.from(
    new Set(doctorsList.map((d) => d.specialty.trim()).filter(Boolean))
  );

  // Filtered doctors
  const filteredDoctors = doctorsList.filter((doc) => {
    const docFullText = `${doc.name} ${doc.specialty} ${doc.phone} ${doc.clinicAddress || ""} ${doc.workingHours || ""} ${doc.notes || ""} طبيب دكتور عيادة`;
    const matchesSearch = matchesArabicSearch(docFullText, searchQuery);

    const matchesSpecialty =
      selectedSpecialty === "all" || doc.specialty.trim() === selectedSpecialty;

    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner / Concept Explainer */}
      <div className="bg-gradient-to-r from-teal-900 via-cyan-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black">دليل وسجل الأطباء والعيادات 🩺</h2>
                <p className="text-xs sm:text-sm text-teal-200/90 font-medium">
                  بطاقات تعريفية مباشرة (الاسم، الاختصاص، ورقم التواصل المباشر) بدون أصناف أو طلبات تجارية
                </p>
              </div>
            </div>
            <div className="p-2.5 bg-black/20 rounded-xl border border-teal-500/20 text-teal-100 text-xs flex items-center gap-2 max-w-2xl">
              <span className="text-base shrink-0">💡</span>
              <span>
                الأطباء لا يندرجون ضمن فئات المتاجر ولا أصحاب المهن؛ لأن الطبيب لا يبيع أصنافاً وليس لديه سلة تسوق، بل يتواصل معه المريض مباشرة عبر بطاقته التعريفية.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="py-3 px-5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>إضافة طبيب جديد 🩺</span>
          </button>
        </div>
      </div>

      {/* Stats Counter & Filters Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
            <span className="text-xs font-black text-slate-800">
              إجمالي الأطباء بالدليل: ({doctorsList.length} طبيب)
            </span>
          </div>

          {/* Quick Specialty Pill Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              type="button"
              onClick={() => setSelectedSpecialty("all")}
              className={`py-1.5 px-3 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedSpecialty === "all"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              كافة الاختصاصات ({doctorsList.length})
            </button>
            {availableSpecialties.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => setSelectedSpecialty(spec)}
                className={`py-1.5 px-3 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  selectedSpecialty === spec
                    ? "bg-teal-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم الطبيب، الاختصاص الطبي، رقم الهاتف..."
            className="w-full py-2.5 pr-10 pl-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-teal-500 transition-colors"
          />
        </div>
      </div>

      {/* Doctors Grid / Profile Cards */}
      {filteredDoctors.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 mx-auto flex items-center justify-center text-3xl">
            🩺
          </div>
          <h3 className="font-black text-slate-800 text-base">لا توجد بطاقات أطباء تطابق البحث</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            يمكنك إضافة بطاقة طبيب جديدة بالاسم والاختصاص ورقم التواصل لتظهر فوراً للمرضى.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة طبيب الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/90 hover:border-teal-400/60 shadow-xs hover:shadow-md transition-all space-y-4 relative group"
            >
              {/* Doctor Header & Specialty */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center text-2xl shrink-0">
                    🩺
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base leading-snug">
                      {doc.name}
                    </h3>
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-black">
                        {doc.specialty}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit & Delete Quick Actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(doc)}
                    className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                    title="تعديل بيانات الطبيب"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id, doc.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="حذف من الدليل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Clinic & Hours Details (If Available) */}
              <div className="space-y-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                {doc.clinicAddress ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="font-bold text-slate-700 truncate">{doc.clinicAddress}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0 opacity-40" />
                    <span>العيادة: غير محدد</span>
                  </div>
                )}

                {doc.workingHours ? (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="font-bold text-slate-700">{doc.workingHours}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-3.5 h-3.5 shrink-0 opacity-40" />
                    <span>أوقات الاستشارة: اتصال وتنسيق مباشر</span>
                  </div>
                )}

                {doc.notes && (
                  <div className="flex items-start gap-2 pt-1 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                    <FileText className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                    <span>{doc.notes}</span>
                  </div>
                )}
              </div>

              {/* Direct Contact Actions (Call & WhatsApp) */}
              <div className="pt-1">
                <ContactActions
                  phone={doc.phone}
                  name={doc.name}
                  defaultMessage={`مرحباً ${doc.name}، أود الاستفسار وحجز موعد استشارة طبية (${doc.specialty}).`}
                  variant="full"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Doctor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 animate-scale-up text-right my-auto" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-black">
                  🩺
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base">
                    {editingDoctor ? "تعديل بطاقة الطبيب 🩺" : "إضافة بطاقة طبيب جديدة 🩺"}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">
                    بطاقة تعريفية مباشرة للمريض (اسم، اختصاص، رقم تواصل)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-black text-rose-700">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Doctor Name */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  اسم الطبيب الكامل: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFormError("");
                  }}
                  placeholder="مثال: د. سمير كنعان أو د. ميساء العلي"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-teal-500"
                  autoFocus
                />
              </div>

              {/* Specialty & Common Presets */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black text-slate-700">
                    الاختصاص الطبي: <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-teal-700 font-bold">انقر لاختيار سريع أو اكتب اختصاصاً مخصصاً:</span>
                </div>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => {
                    setSpecialty(e.target.value);
                    setFormError("");
                  }}
                  placeholder="مثال: طب أطفال وحديثي ولادة، طب وجراحة الأسنان..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-teal-500"
                />

                {/* Specialty Quick Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {commonSpecialties.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => {
                        setSpecialty(spec);
                        setFormError("");
                      }}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                        specialty === spec
                          ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                          : "bg-slate-100 hover:bg-teal-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  رقم هاتف التواصل (مكالمات + واتساب): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setFormError("");
                  }}
                  placeholder="مثال: 0933445566 أو 099112233"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-teal-500 text-left font-mono"
                  dir="ltr"
                />
              </div>

              {/* Clinic Address (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    عنوان أو مكان العيادة (اختياري):
                  </label>
                  <input
                    type="text"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    placeholder="مثال: مجمع الياسمين - ط2"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    أوقات الدوام / الاستشارة (اختياري):
                  </label>
                  <input
                    type="text"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    placeholder="مثال: 4:00 م - 8:30 م"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Notes (Optional) */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  ملاحظات إضافية في البطاقة التعريفية (اختياري):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: استشارات هاتفية طارئة، كشفية رمزية، حجز مسبق..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{editingDoctor ? "حفظ التعديلات" : "إضافة بطاقة الطبيب الآن"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-2xl transition-all cursor-pointer"
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
