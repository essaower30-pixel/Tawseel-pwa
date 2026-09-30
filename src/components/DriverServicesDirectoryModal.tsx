import React, { useState } from "react";
import { 
  Car, 
  Search, 
  X,
  Truck,
  Bike
} from "lucide-react";
import { DriverService } from "../types";
import { matchesArabicSearch } from "../utils/arabicSearch";
import { DriverIDCard } from "./DriverIDCard";

interface DriverServicesDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverServices: DriverService[];
}

export const DriverServicesDirectoryModal: React.FC<DriverServicesDirectoryModalProps> = ({
  isOpen,
  onClose,
  driverServices
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("all");

  if (!isOpen) return null;

  // Distinct vehicles
  const vehicleTypes = Array.from(
    new Set(driverServices.map((d) => d.vehicle.trim()).filter(Boolean))
  );

  const filteredDrivers = driverServices.filter((d) => {
    const driverFullText = `${d.name} ${d.vehicle} ${d.phone} ${d.serviceArea || ""} ${d.workingHours || ""} ${d.notes || ""} سائق تكسي كابتن`;
    const matchesSearch = matchesArabicSearch(driverFullText, searchQuery);
    const matchesVehicle = selectedVehicle === "all" || d.vehicle.trim() === selectedVehicle;
    return matchesSearch && matchesVehicle;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl w-full max-w-4xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto text-right font-sans animate-scale-up" 
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-2xl -ml-20 -mt-20 pointer-events-none" />
          
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black flex items-center gap-2">
                  <span>دليل وبطاقات خدمات السائقين والتكاسي 🚗</span>
                </h2>
                <p className="text-xs text-blue-200/90 font-medium">
                  بطاقات تعريفية مباشرة للتواصل مع سائقي التكاسي، سيارات نقل البضائع، والمشاوير الخاصة
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Vehicle Filter */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200/80 shrink-0 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم السائق، نوع المركبة (تكسي، سوزوكي، سرفيس)، المنطقة..."
              className="w-full py-2.5 pr-10 pl-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-blue-500 transition-colors text-right"
            />
          </div>

          {/* Vehicle Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedVehicle("all")}
              className={`py-1.5 px-3 rounded-xl font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedVehicle === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              كافة السائقين ({driverServices.length})
            </button>
            {vehicleTypes.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setSelectedVehicle(v)}
                className={`py-1.5 px-3 rounded-xl font-black whitespace-nowrap transition-all cursor-pointer ${
                  selectedVehicle === v
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body: Cards Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {filteredDrivers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
              <p className="text-slate-800 font-extrabold text-sm sm:text-base">
                لم نجد أي سائق مطابق للبحث
              </p>
              <p className="text-slate-400 text-xs">
                جرب كتابة "تكسي" أو اختيار تصنيف آخر من القائمة أعلاه
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDrivers.map((driver) => (
                <DriverIDCard key={driver.id} driver={driver} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
