/**
 * App Update & Feature Release Manager (نظام إدارة ونشر تحديثات وميزات المنصة)
 * Allows management to release updates, announce new features, and displays
 * an update icon to users until they apply/acknowledge the update.
 */

export interface AppUpdateInfo {
  id: string;
  version: string;
  title: string;
  releaseDate: string;
  features: string[];
  notes?: string;
  publishedAt: number;
  publishedBy?: string;
}

const UPDATE_STORAGE_KEY = "tw_latest_app_update";
const ACKNOWLEDGED_UPDATE_KEY = "tw_acknowledged_update_id";
const BROADCAST_CHANNEL_NAME = "tw_app_update_channel";

/**
 * Default update representing the latest comprehensive platform enhancements
 */
export const DEFAULT_INITIAL_UPDATE: AppUpdateInfo = {
  id: "update_v3_9_3_universal_services_live_search",
  version: "v3.9.3",
  title: "محرك البحث الشامل لكافة خدمات المنصة: أطباء، عيادات، حرفيين، وسائقين 🔍",
  releaseDate: "29 سبتمبر 2026",
  features: [
    "تعميم نتائج البحث الفوري على كافة الخدمات: البحث بـ 'اسنان' أو 'اطفال' أو 'طبيب' يظهر بطاقات الأطباء والعيادات فوراً",
    "دمج أصحاب المهن والحرفيين: البحث بـ 'حداد' أو 'سباك' أو 'كهربائي' يظهر الحرفيين المعتمدين مع أزرار الاتصال والواتساب",
    "دمج خدمات التوصيل والنقل: البحث بـ 'تكسي' أو 'سائق' أو 'سيارة' يظهر بطاقات السائقين المتاحة بالمنطقة",
    "دمج الأصناف والمنتجات: البحث عن أي سلعة يظهر بطاقات الأصناف مع أسعارها وزر الإضافة للسلة مباشرة",
    "إلغاء رسالة 'لم نجد أي متجر' عند وجود خدمات أو أطباء أو مهنيين مطابقين للبحث",
    "ترقية محرك PWA وتطهير الكاش (v68) للعمل المباشر على جميع أجهزة الهواتف"
  ],
  notes: "تحديث رئيسي يجعل شريط البحث بالصفحة الرئيسية دليلاً شاملاً يربط الزبون بكافة خدمات البلدة والمنطقة.",
  publishedAt: Date.now(),
  publishedBy: "الإدارة العامة"
};

/**
 * Get current published update info from storage or default
 */
export function getLatestUpdate(): AppUpdateInfo {
  if (typeof window === "undefined") return DEFAULT_INITIAL_UPDATE;
  try {
    const stored = localStorage.getItem(UPDATE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.id && parsed.version) {
        // Auto-upgrade if stored version is older than latest system release
        if (parsed.version === "v3.7.0" || parsed.version === "v3.8.0" || parsed.version === "v3.9.0" || parsed.version === "v3.9.1" || parsed.version === "v3.9.2" || parsed.version < "v3.9.3") {
          localStorage.setItem(UPDATE_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_UPDATE));
          return DEFAULT_INITIAL_UPDATE;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to parse latest update from storage:", e);
  }
  return DEFAULT_INITIAL_UPDATE;
}

/**
 * Get the update ID acknowledged by this user / browser
 */
export function getAcknowledgedUpdateId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACKNOWLEDGED_UPDATE_KEY);
  } catch {
    return null;
  }
}

/**
 * Check if the user has a pending update that hasn't been acknowledged yet
 */
export function hasPendingUpdate(): boolean {
  const latest = getLatestUpdate();
  const ackId = getAcknowledgedUpdateId();
  return ackId !== latest.id;
}

/**
 * Mark the current update as acknowledged/applied by the user.
 * This makes the update icon disappear!
 */
export function acknowledgeUpdate(updateId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACKNOWLEDGED_UPDATE_KEY, updateId);
  } catch (e) {
    console.warn("Failed to store acknowledged update ID:", e);
  }

  // Dispatch custom event to notify all components in current window
  window.dispatchEvent(
    new CustomEvent("tw_update_acknowledged", { detail: { updateId } })
  );

  // Broadcast across tabs
  if ("BroadcastChannel" in window) {
    try {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({ type: "UPDATE_ACKNOWLEDGED", updateId });
      channel.close();
    } catch {}
  }
}

/**
 * Reset acknowledgment (for Admin testing or previewing the icon)
 */
export function resetUpdateAcknowledgment(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ACKNOWLEDGED_UPDATE_KEY);
  } catch {}
  window.dispatchEvent(new CustomEvent("tw_app_update_event"));
}

/**
 * Publish a new update by the Admin.
 * Broadcasts to all users and tabs, showing the update icon immediately!
 */
export function publishNewUpdate(data: {
  version: string;
  title: string;
  releaseDate?: string;
  features: string[];
  notes?: string;
  publishedBy?: string;
}): AppUpdateInfo {
  const newUpdate: AppUpdateInfo = {
    id: `update_${Date.now()}`,
    version: data.version.trim() || `v3.8.${Math.floor(Math.random() * 9 + 1)}`,
    title: data.title.trim() || "تحديث جديد للمنصة والخدمات 🚀",
    releaseDate: data.releaseDate || new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }),
    features: data.features.length > 0 ? data.features : ["تحسينات في الأداء وسرعة الاستجابة", "إضافة ميزات جديدة لتجربة المستخدم"],
    notes: data.notes?.trim(),
    publishedAt: Date.now(),
    publishedBy: data.publishedBy || "الإدارة العامة"
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(UPDATE_STORAGE_KEY, JSON.stringify(newUpdate));
      localStorage.setItem("tw_last_broadcast_update", JSON.stringify(newUpdate));
    } catch (e) {
      console.warn("Failed to persist new update:", e);
    }

    // Broadcast across windows
    if ("BroadcastChannel" in window) {
      try {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channel.postMessage({ type: "NEW_APP_UPDATE", update: newUpdate });
        channel.close();
      } catch {}
    }

    // Dispatch window event
    window.dispatchEvent(
      new CustomEvent("tw_app_update_event", { detail: newUpdate })
    );
  }

  return newUpdate;
}

/**
 * Subscribe to update changes (both new updates published and updates acknowledged)
 */
export function subscribeToUpdates(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleUpdate = () => {
    callback();
  };

  window.addEventListener("tw_app_update_event", handleUpdate);
  window.addEventListener("tw_update_acknowledged", handleUpdate);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === UPDATE_STORAGE_KEY || e.key === ACKNOWLEDGED_UPDATE_KEY || e.key === "tw_last_broadcast_update") {
      callback();
    }
  };
  window.addEventListener("storage", handleStorage);

  let channel: BroadcastChannel | null = null;
  if ("BroadcastChannel" in window) {
    try {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = () => {
        callback();
      };
    } catch {}
  }

  return () => {
    window.removeEventListener("tw_app_update_event", handleUpdate);
    window.removeEventListener("tw_update_acknowledged", handleUpdate);
    window.removeEventListener("storage", handleStorage);
    if (channel) {
      channel.close();
    }
  };
}
