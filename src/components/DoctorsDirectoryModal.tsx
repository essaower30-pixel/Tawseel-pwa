import React, { useState } from "react";
import { 
  Stethoscope, 
  Search, 
  MapPin, 
  Clock, 
  X,
  FileText
} from "lucide-react";
import { Doctor } from "../types";
import { ContactActions } from "./ContactActions";

interface DoctorsDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
}

export const DoctorsDirectoryModal: React.FC<DoctorsDirectoryModalProps> = ({
  isOpen,
  onClose,
  doctors
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");

  if (!isOpen) return null;

  // Distinct specialties
  const specialties = Array.from(
    new Set(doctors.map((d) => d.specialty.trim()).filter(Boolean))
  );

  const filteredDoctors = doctors.filter((doc) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      doc.name.toLowerCase().includes(q) ||
      doc.specialty.toLowerCase().includes(q) ||
      doc.phone.includes(q) ||
      (doc.clinicAddress && doc.clinicAddress.toLowerCase().includes(q));

    const matchesSpecialty =
      selectedSpecialty === "all" || doc.specialty.trim() === selectedSpecialty;

    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl w-full max-w-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto text-right font-sans animate-scale-up" 
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-teal-800 via-cyan-900 to-slate-900 text-white shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl -ml-20 -mt-20 pointer-events-none" />
          
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black flex items-center gap-2">
                  <span>دليل الأطباء والاستشارات الطبية 🩺</span>
                </h2>
                <p className="text-xs text-teal-200/90 font-medium">
                  بطاقات تعريفية للتواصل المباشر مع الأطباء والعيادات لحجز موعد أو استشارة طبية
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-teal-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Specialty Filter */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200/80 shrink-0 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الطبيب، الاختصاص، العيادة..."
              className="w-full py-2 pr-10 pl-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-teal-500 transition-colors"
            />
          </div>

          {/* Specialty Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedSpecialty("all")}
              className={`py-1 px-3 rounded-lg font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedSpecialty === "all"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              الكل ({doctors.length})
            </button>
            {specialties.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => setSelectedSpecialty(spec)}
                className={`py-1 px-3 rounded-lg font-black whitespace-nowrap transition-all cursor-pointer ${
                  selectedSpecialty === spec
                    ? "bg-teal-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Doctor Cards Body */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {filteredDoctors.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-xl">
                🩺
              </div>
              <p className="text-xs font-bold text-slate-500">
                لا توجد نتائج مطابقة لبحثك في دليل الأطباء
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredDoctors.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-teal-400/60 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center text-xl shrink-0">
                        🩺
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-slate-900 text-sm sm:text-base leading-snug">
                          {doc.name}
                        </h3>
                        <div className="mt-0.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-black">
                            {doc.specialty}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Clinic & Times */}
                    <div className="space-y-1.5 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {doc.clinicAddress && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className="font-bold text-slate-700 truncate">{doc.clinicAddress}</span>
                        </div>
                      )}
                      {doc.workingHours && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-bold text-slate-700">{doc.workingHours}</span>
                        </div>
                      )}
                      {doc.notes && (
                        <div className="flex items-start gap-1.5 pt-1 border-t border-slate-200/50 text-[10px] text-slate-500">
                          <FileText className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          <span>{doc.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Direct Contact Button */}
                  <div className="pt-1 border-t border-slate-100">
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
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200/80 text-center shrink-0">
          <p className="text-[11px] text-slate-500 font-bold">
            💡 للحجز أو الاستشارة الطبية، يرجى الاتصال المباشر أو المراسلة عبر الواتساب.
          </p>
        </div>
      </div>
    </div>
  );
};
