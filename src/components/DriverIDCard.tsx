import React, { useState } from "react";
import { 
  Car, 
  Truck, 
  Bike, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Clock, 
  Star, 
  ShieldCheck, 
  Share2, 
  Check, 
  Sparkles,
  Info
} from "lucide-react";
import { DriverService } from "../types";
import { ContactActions } from "./ContactActions";

interface DriverIDCardProps {
  driver: DriverService;
  onEdit?: (driver: DriverService) => void;
  onDelete?: (id: string) => void;
  showAdminControls?: boolean;
}

export const DriverIDCard: React.FC<DriverIDCardProps> = ({
  driver,
  onEdit,
  onDelete,
  showAdminControls = false
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [shared, setShared] = useState(false);

  const getVehicleIcon = (vehicleText: string) => {
    const v = (vehicleText || "").toLowerCase();
    if (v.includes("سوزوكي") || v.includes("بضائع") || v.includes("بيك أب") || v.includes("شاحنة") || v.includes("نقل")) {
      return <Truck className="w-5 h-5 text-blue-600" />;
    }
    if (v.includes("دراجة") || v.includes("موتور") || v.includes("سكوتر")) {
      return <Bike className="w-5 h-5 text-orange-600" />;
    }
    return <Car className="w-5 h-5 text-emerald-600" />;
  };

  const getVehicleEmoji = (vehicleText: string) => {
    const v = (vehicleText || "").toLowerCase();
    if (v.includes("تكسي") || v.includes("أجرة")) return "🚕";
    if (v.includes("سوزوكي") || v.includes("بضائع") || v.includes("بيك أب")) return "🛻";
    if (v.includes("فان") || v.includes("سرفيس")) return "🚐";
    if (v.includes("دراجة") || v.includes("موتور")) return "🛵";
    return "🚗";
  };

  const isAvailable = driver.availability !== "offline" && driver.availability !== "busy";

  const handleShare = async () => {
    const shareText = `🚗 بطاقة السائق المعتمد:\n👤 الاسم: ${driver.name}\n🚘 نوع الخدمة: ${driver.vehicle}\n📱 رقم الهاتف: ${driver.phone}\n📍 منطقة التغطية: ${driver.serviceArea || "داخل البلدة والمحافظات"}\n⏰ التوافر: ${driver.workingHours || "متاح للطلب"}\n⭐ التقييم: ${driver.rating || 5.0}/5`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `بطاقة السائق - ${driver.name}`,
          text: shareText,
          url: window.location.href
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch (e) {
      console.warn("Share clipboard copy error", e);
    }
  };

  const handleCopyPhone = () => {
    if (!driver.phone) return;
    navigator.clipboard.writeText(driver.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <div 
      className="bg-white rounded-3xl border border-slate-200/90 hover:border-blue-400 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden text-right font-sans group relative"
      dir="rtl"
    >
      {/* Top Header Strip: Card Identity & Category */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white px-4 py-2.5 flex items-center justify-between gap-2 border-b border-blue-900/40">
        <div className="flex items-center gap-1.5 text-[11px] font-black tracking-wide text-blue-200">
          <span className="text-sm">{getVehicleEmoji(driver.vehicle)}</span>
          <span>بطاقة سائق معتمدة</span>
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        </div>

        <div className="flex items-center gap-2">
          {/* Availability Status Badge */}
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 border ${
            isAvailable 
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30" 
              : "bg-amber-500/20 text-amber-300 border-amber-400/30"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            <span>{isAvailable ? "متاح للطلب الآن" : "مشغول حالياً"}</span>
          </span>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
            title="مشاركة البطاقة التعريفية"
          >
            {shared ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Driver Profile Bar: Avatar + Name + Vehicle + Rating */}
        <div className="flex items-start gap-3.5 border-b border-slate-100 pb-3.5">
          {/* Avatar or Vehicle Emblem */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100/70 border-2 border-blue-200/80 text-blue-700 flex items-center justify-center font-black text-2xl shadow-xs overflow-hidden shrink-0 relative group-hover:scale-105 transition-transform">
            {driver.avatar ? (
              <img 
                src={driver.avatar} 
                alt={driver.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-3xl select-none">{getVehicleEmoji(driver.vehicle)}</span>
            )}
            <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-[9px] px-1 py-0.2 rounded-tl-md font-black">
              كابتن
            </div>
          </div>

          {/* Driver Title & Vehicle Info */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-1.5">
              <h4 className="font-black text-slate-900 text-sm sm:text-base leading-snug group-hover:text-blue-700 transition-colors truncate">
                {driver.name}
              </h4>
              <div className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-lg text-xs font-black shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{driver.rating ? Number(driver.rating).toFixed(1) : "5.0"}</span>
              </div>
            </div>

            {/* Vehicle Pill */}
            <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-900 px-2.5 py-0.5 rounded-xl text-xs font-black">
              {getVehicleIcon(driver.vehicle)}
              <span className="truncate">{driver.vehicle}</span>
            </div>

            <div className="text-[11px] text-slate-400 font-medium">
              كابتن موثق في المنصة • خدمة آمنة وسريعة
            </div>
          </div>
        </div>

        {/* Driver Service Specifics */}
        <div className="space-y-2 text-xs">
          {driver.serviceArea && (
            <div className="flex items-start gap-2 text-slate-700 bg-slate-50/70 p-2.5 rounded-2xl border border-slate-100">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-slate-500 text-[10px] block">منطقة التغطية وخطوط السير:</span>
                <span className="font-black text-slate-800">{driver.serviceArea}</span>
              </div>
            </div>
          )}

          {driver.workingHours && (
            <div className="flex items-center gap-2 text-slate-700 px-1">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="font-medium text-[11px] text-slate-600">
                <span className="font-bold text-slate-800">أوقات العمل والتوافر: </span>
                {driver.workingHours}
              </span>
            </div>
          )}

          {driver.notes && (
            <div className="bg-amber-50/60 border border-amber-200/70 p-2.5 rounded-2xl text-[11px] text-amber-900 leading-relaxed font-medium">
              💡 <b>ملاحظات ومميزات:</b> {driver.notes}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Contact Actions */}
      <div className="p-4 pt-1 bg-slate-50/50 border-t border-slate-100 space-y-2">
        <ContactActions
          phone={driver.phone}
          name={driver.name}
          defaultMessage={`مرحباً كابتن ${driver.name}، أود الاستفسار وطلب خدمة توصيل / مشوار (${driver.vehicle}).`}
          variant="full"
        />

        {/* Quick Phone Copy & Verification Seal */}
        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
          <button
            type="button"
            onClick={handleCopyPhone}
            className="text-slate-500 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1 font-bold"
          >
            <span>{copiedPhone ? "تم نسخ الرقم ✅" : `نسخ الرقم: ${driver.phone}`}</span>
          </button>
          
          <span className="flex items-center gap-1 text-emerald-600 font-bold">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>معتمد وموثق رسمياً</span>
          </span>
        </div>

        {/* Admin Controls (if displayed in admin) */}
        {showAdminControls && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(driver)}
                className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                تعديل البطاقة
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`هل أنت متأكد من حذف السائق "${driver.name}"؟`)) {
                    onDelete(driver.id);
                  }
                }}
                className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                حذف
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
