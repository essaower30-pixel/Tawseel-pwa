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
  id: "update_v2_5_1",
  version: "v2.5.1",
  title: "تحديث خدمات السائقين والمهن الحرفية والتواصل المباشر 🚗🛠️",
  releaseDate: "أغسطس 2026",
  features: [
    "واجهة مخصصة ومباشرة لخدمات السائقين وأصحاب المهن الحرفية دون أي تعقيد أو طلبات خاصة",
    "إبراز رقم الموبايل بوضوح مع إمكانية النسخ بنقرة واحدة",
    "توفير أزرار التواصل المباشر الثلاثة: اتصال عادي، واتساب العادي، وواتساب الأعمال",
    "تحديث تلقائي وتنظيف الكاش لضمان ظهور التعديلات فوراً على كافة الهواتف والمتصفحات"
  ],
  notes: "تم إطلاق هذا التحديث لتسهيل الاتصال المباشر بالسائقين والمهنيين دون الحاجة لأي خطوات إضافية.",
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
    version: data.version.trim() || `v2.5.${Math.floor(Math.random() * 90 + 10)}`,
    title: data.title.trim() || "تحديث جديد للمنصة والخدمات 🚀",
    releaseDate: data.releaseDate || new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }),
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
