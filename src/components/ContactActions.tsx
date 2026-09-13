import React from "react";
import { Phone, MessageSquare, MessageCircle } from "lucide-react";
import { getWhatsAppDirectUrl, openWhatsApp, formatWhatsAppPhone } from "../utils/whatsapp";

interface ContactActionsProps {
  phone: string;
  name?: string;
  defaultMessage?: string;
  variant?: "full" | "compact" | "pills" | "grid";
  className?: string;
  showPhone?: boolean;
}

export const ContactActions: React.FC<ContactActionsProps> = ({
  phone,
  name,
  defaultMessage = "مرحباً، بخصوص طلب التوصيل...",
  variant = "full",
  className = "",
  showPhone = true
}) => {
  if (!phone) return null;

  const cleanPhone = formatWhatsAppPhone(phone);
  const regularWhatsAppUrl = getWhatsAppDirectUrl({ phone: cleanPhone, message: defaultMessage, type: "regular" });
  const businessWhatsAppUrl = getWhatsAppDirectUrl({ phone: cleanPhone, message: defaultMessage, type: "business" });

  const handleOpenWA = (e: React.MouseEvent, type: "regular" | "business") => {
    e.preventDefault();
    openWhatsApp({
      phone: cleanPhone,
      message: defaultMessage,
      type
    });
  };

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {showPhone && (
          <a
            href={`tel:${phone}`}
            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all shadow-xs flex items-center justify-center"
            title={`اتصال هاتفي: ${phone}`}
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
        )}
        <a
          href={regularWhatsAppUrl}
          onClick={(e) => handleOpenWA(e, "regular")}
          target="_blank"
          rel="noreferrer"
          className="p-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] rounded-xl transition-all shadow-xs flex items-center justify-center cursor-pointer"
          title="واتساب العادي (WhatsApp)"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </a>
        <a
          href={businessWhatsAppUrl}
          onClick={(e) => handleOpenWA(e, "business")}
          target="_blank"
          rel="noreferrer"
          className="p-2 bg-[#075E54]/15 hover:bg-[#075E54]/25 text-[#075E54] rounded-xl transition-all shadow-xs flex items-center justify-center cursor-pointer"
          title="واتساب للأعمال (WhatsApp Business)"
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  if (variant === "pills") {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        {showPhone && (
          <a
            href={`tel:${phone}`}
            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all"
          >
            <Phone className="w-3 h-3" />
            <span>اتصال</span>
          </a>
        )}
        <a
          href={regularWhatsAppUrl}
          onClick={(e) => handleOpenWA(e, "regular")}
          target="_blank"
          rel="noreferrer"
          className="px-2.5 py-1 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
        >
          <MessageSquare className="w-3 h-3 text-[#25D366]" />
          <span>واتساب العادي</span>
        </a>
        <a
          href={businessWhatsAppUrl}
          onClick={(e) => handleOpenWA(e, "business")}
          target="_blank"
          rel="noreferrer"
          className="px-2.5 py-1 bg-[#075E54]/15 hover:bg-[#075E54]/25 text-[#075E54] rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
        >
          <MessageCircle className="w-3 h-3 text-[#075E54]" />
          <span>واتساب أعمال</span>
        </a>
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 ${className}`}>
        {showPhone && (
          <a
            href={`tel:${phone}`}
            className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>اتصال هاتفي</span>
          </a>
        )}
        <a
          href={regularWhatsAppUrl}
          onClick={(e) => handleOpenWA(e, "regular")}
          target="_blank"
          rel="noreferrer"
          className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba56] text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>واتساب العادي 💬</span>
        </a>
        <a
          href={businessWhatsAppUrl}
          onClick={(e) => handleOpenWA(e, "business")}
          target="_blank"
          rel="noreferrer"
          className="py-2.5 px-3 bg-[#075E54] hover:bg-[#054a43] text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>واتساب الأعمال 💼</span>
        </a>
      </div>
    );
  }

  // Default "full" variant
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {showPhone && (
        <a
          href={`tel:${phone}`}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>اتصال هاتفي</span>
        </a>
      )}
      <a
        href={regularWhatsAppUrl}
        onClick={(e) => handleOpenWA(e, "regular")}
        target="_blank"
        rel="noreferrer"
        className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba56] text-white rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        <span>واتساب العادي 💬</span>
      </a>
      <a
        href={businessWhatsAppUrl}
        onClick={(e) => handleOpenWA(e, "business")}
        target="_blank"
        rel="noreferrer"
        className="px-3.5 py-2 bg-[#075E54] hover:bg-[#054a43] text-white rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        <span>واتساب أعمال 💼</span>
      </a>
    </div>
  );
};
