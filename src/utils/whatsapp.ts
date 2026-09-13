export type WhatsAppType = "regular" | "business";

/**
 * Normalizes phone numbers for Syrian and international WhatsApp numbers
 */
export function formatWhatsAppPhone(phone: string): string {
  if (!phone) return "";
  let clean = phone.replace(/[^0-9]/g, "");
  
  if (clean.startsWith("00")) {
    clean = clean.substring(2);
  }
  
  if (clean.startsWith("0")) {
    clean = "963" + clean.substring(1);
  }
  
  if (clean.length === 9 && clean.startsWith("9")) {
    clean = "963" + clean;
  }
  
  return clean;
}

/**
 * Returns direct URL for anchor links or direct redirection
 */
export function getWhatsAppDirectUrl(options: {
  phone?: string;
  message?: string;
  type?: WhatsAppType;
}): string {
  const { phone = "", message = "", type = "regular" } = options;
  const cleanPhone = formatWhatsAppPhone(phone);
  const encodedMsg = encodeURIComponent(message || "");
  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
  const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isAndroid) {
    const pkg = type === "business" ? "com.whatsapp.w4b" : "com.whatsapp";
    if (cleanPhone) {
      return `intent://send?phone=${cleanPhone}&text=${encodedMsg}#Intent;package=${pkg};scheme=whatsapp;end`;
    } else {
      return `intent://send?text=${encodedMsg}#Intent;package=${pkg};scheme=whatsapp;end`;
    }
  }

  if (isIOS) {
    if (type === "business") {
      return cleanPhone 
        ? `whatsapp-business://send?phone=${cleanPhone}&text=${encodedMsg}`
        : `whatsapp-business://send?text=${encodedMsg}`;
    } else {
      return cleanPhone
        ? `whatsapp://send?phone=${cleanPhone}&text=${encodedMsg}`
        : `whatsapp://send?text=${encodedMsg}`;
    }
  }

  // Web & Desktop fallback
  if (cleanPhone) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedMsg}`;
}

/**
 * Triggers opening WhatsApp or WhatsApp Business directly on mobile / desktop
 */
export function openWhatsApp(options: {
  phone?: string;
  message?: string;
  type?: WhatsAppType;
}) {
  const { phone = "", message = "", type = "regular" } = options;
  const cleanPhone = formatWhatsAppPhone(phone);
  const encodedMsg = encodeURIComponent(message || "");
  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
  const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isAndroid) {
    const pkg = type === "business" ? "com.whatsapp.w4b" : "com.whatsapp";
    const intentUrl = cleanPhone
      ? `intent://send?phone=${cleanPhone}&text=${encodedMsg}#Intent;package=${pkg};scheme=whatsapp;end`
      : `intent://send?text=${encodedMsg}#Intent;package=${pkg};scheme=whatsapp;end`;

    try {
      window.location.href = intentUrl;
    } catch (e) {
      const fallbackUrl = cleanPhone
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`
        : `https://api.whatsapp.com/send?text=${encodedMsg}`;
      window.open(fallbackUrl, "_blank");
    }
    return;
  }

  if (isIOS) {
    const scheme = type === "business" ? "whatsapp-business" : "whatsapp";
    const iosUrl = cleanPhone
      ? `${scheme}://send?phone=${cleanPhone}&text=${encodedMsg}`
      : `${scheme}://send?text=${encodedMsg}`;
    
    window.location.href = iosUrl;
    setTimeout(() => {
      const fallbackUrl = cleanPhone
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`
        : `https://api.whatsapp.com/send?text=${encodedMsg}`;
      window.open(fallbackUrl, "_blank");
    }, 1200);
    return;
  }

  // Desktop / Other browsers
  const webUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`
    : `https://api.whatsapp.com/send?text=${encodedMsg}`;
  window.open(webUrl, "_blank");
}
