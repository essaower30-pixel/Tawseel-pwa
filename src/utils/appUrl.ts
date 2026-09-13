import { AppSettings } from "../types";

/**
 * Normalizes and returns the 100% working live URL of the application.
 * Priority:
 * 1. Custom URL explicitly configured by Admin in AppSettings (if non-empty & valid http/https)
 * 2. Current live browser URL (window.location.origin + clean pathname)
 * 3. Fallback production URL
 */
export function getAppUrl(appSettings?: Partial<AppSettings> | null): string {
  // 1. Check if Admin saved a custom official URL
  let settings = appSettings;
  if (!settings && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("tw_app_settings");
      if (raw) settings = JSON.parse(raw);
    } catch (e) {}
  }

  if (settings?.officialAppUrl && typeof settings.officialAppUrl === "string") {
    const trimmed = settings.officialAppUrl.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
    }
  }

  // 2. Browser Environment: dynamically resolve active URL
  if (typeof window !== "undefined" && window.location) {
    try {
      const origin = window.location.origin;
      let pathname = window.location.pathname || "/";
      
      // Clean index.html or query parts
      if (pathname.endsWith("/index.html")) {
        pathname = pathname.replace(/\/index\.html$/, "/");
      }
      
      let cleanUrl = `${origin}${pathname}`;
      if (!cleanUrl.endsWith("/")) {
        cleanUrl += "/";
      }
      return cleanUrl;
    } catch (e) {
      console.warn("Could not determine window.location:", e);
    }
  }

  // 3. Fallback
  return "https://essaower30-pixel.github.io/Tawseel-app/";
}

/**
 * Returns formatted announcement texts with the live working app URL
 */
export function getShareTemplates(appName: string, appUrl: string) {
  const cleanUrl = appUrl.trim();

  return {
    general: `🛍️ *إعلان رسمي من إدارة تطبيق (${appName})*\n\nأهالينا الكرام، أصبح بإمكانكم الآن تصفح كافة مطاعم، بقاليات، صيدليات، وحرفيي المنطقة والطلب أونلاين مع خدمة التوصيل السريع إلى باب بيوتكم!\n\n📲 *رابط التطبيق الرسمي المباشر:*\n${cleanUrl}\n\n(يمكنكم فتح الرابط وتثبيت التطبيق على الشاشة الرئيسية فوراً)`,
    
    merchants: `🏪 *دعوة رسمية لأصحاب المتاجر والمطاعم والصيدليات للانضمام لمنصة (${appName})*\n\nسجل متجرك الآن واعرض منتجاتك لأهالي المحافظة مع إدارة متكاملة للطلبات وفريق كباتن توصيل جاهز لنقل طلباتك.\n\n🌐 *رابط الانضمام والتسجيل:*\n${cleanUrl}`,
    
    drivers: `🛵 *فرصة عمل: انضم لفريق كباتن التوصيل في منصة (${appName})*\n\nنبحث عن شباب نشيطين للانضمام لأسطول التوصيل مع عوائد ممتازة وحرية في أوقات العمل.\n\n📍 *رابط التسجيل وبدء العمل:*\n${cleanUrl}`,
    
    headerQuickShare: `السلام عليكم ورحمة الله وبركاته 🛍️ تصفح واطلب من تطبيق "${appName}" للقرية - توصيل سريع للمأكولات، التموينات، والصيدلية إلى عتبة بيتك!\n\nرابط التطبيق الرسمي المباشر:\n${cleanUrl}`
  };
}
