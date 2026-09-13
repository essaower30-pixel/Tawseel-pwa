/**
 * PWA Dynamic Manager
 * Safe, lightweight icon & install manager that prevents memory leaks and Android WebView freezes.
 */

export const DEFAULT_APP_ICON_KEY = "tw_app_custom_icon";

/**
 * Retrieves the currently configured icon from storage or returns default PNG
 */
export function generateDefaultSvgIcon(size: number = 512, _bgColor = "#f97316", text = "توصيل"): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff781f" />
        <stop offset="50%" stop-color="#f97316" />
        <stop offset="100%" stop-color="#ea580c" />
      </linearGradient>
      <linearGradient id="boxGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#fef08a" />
      </linearGradient>
      <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#7c2d12" flood-opacity="0.3"/>
      </filter>
    </defs>
    
    <rect width="512" height="512" rx="115" fill="url(#bgGrad)"/>
    <rect x="16" y="16" width="480" height="480" rx="98" fill="none" stroke="#ffffff" stroke-width="8" stroke-opacity="0.3"/>

    <g filter="url(#dropShadow)" transform="translate(18, -10)">
      <rect x="75" y="160" width="125" height="115" rx="20" fill="url(#boxGrad)" stroke="#ffffff" stroke-width="6"/>
      <path d="M 95 200 L 180 200 M 138 160 L 138 275" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>

      <circle cx="120" cy="340" r="50" fill="#1e293b" stroke="#ffffff" stroke-width="14"/>
      <circle cx="120" cy="340" r="22" fill="#f8fafc"/>
      
      <circle cx="370" cy="340" r="50" fill="#1e293b" stroke="#ffffff" stroke-width="14"/>
      <circle cx="370" cy="340" r="22" fill="#f8fafc"/>

      <path d="M 120 340 L 210 330 L 285 240 L 370 240 L 370 340" fill="none" stroke="#ffffff" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 210 330 L 255 180 L 340 180" fill="none" stroke="#ffffff" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>

      <path d="M 320 150 L 360 140 L 375 160" fill="none" stroke="#ffffff" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="385" cy="220" r="16" fill="#fef08a"/>
      <path d="M 395 210 L 440 195 L 440 245 Z" fill="#fef08a" opacity="0.6"/>
    </g>

    <text x="50%" y="465" font-family="'Cairo', 'Tajawal', system-ui, -apple-system, sans-serif" font-weight="900" font-size="76px" fill="#ffffff" text-anchor="middle" letter-spacing="1">
      ${text}
    </text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Retrieves the currently configured icon from storage or returns default
 */
export function getActiveAppIcon(_themeColor = "#f97316", appName = "توصيل"): string {
  try {
    const custom = localStorage.getItem(DEFAULT_APP_ICON_KEY);
    if (custom && custom.startsWith("data:image")) {
      return custom;
    }
  } catch {}
  return generateDefaultSvgIcon(512, _themeColor, appName);
}

/**
 * Resizes any uploaded image file safely with Canvas
 */
export async function resizeImageToDataUrl(dataUrl: string, width: number, height: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        console.warn("Canvas conversion fallback:", e);
        resolve(dataUrl);
      }
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}

/**
 * Updates UI icons (favicon, apple-touch-icon) without tampering with manifest blob URLs
 */
export async function updateDynamicPwaManifest(options?: {
  appName?: string;
  iconDataUrl?: string;
  themeColor?: string;
}) {
  if (typeof document === "undefined") return;

  const appName = options?.appName || "توصيل - التوصيل المحلي";
  const icon = options?.iconDataUrl || getActiveAppIcon();

  try {
    // 1. Update Document Title
    document.title = appName;

    // 2. Update Favicon safely
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon) {
      favicon.href = icon;
    }

    // 3. Update Apple Touch Icon safely
    let appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (appleIcon) {
      appleIcon.href = icon;
    }

    // 4. Update Apple Web App Title
    let appleTitle = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]');
    if (appleTitle) {
      appleTitle.content = appName.split(" ")[0] || "توصيل";
    }
  } catch (err) {
    console.warn("PWA UI update minor notice:", err);
  }
}
