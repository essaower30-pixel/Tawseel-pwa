/**
 * Sound & System Notification Manager
 * Provides Web Audio API synthesized ringtones and Web Notification API integration.
 */

export type SoundType = "chime" | "ringtone" | "cashier" | "urgent";

const STORAGE_SOUND_ENABLED = "tw_sound_notifications_enabled";
const STORAGE_SOUND_TYPE = "tw_sound_notification_type";
const STORAGE_SOUND_VOLUME = "tw_sound_notification_volume";

// Shared AudioContext
let audioCtx: AudioContext | null = null;

// Preloaded HTML5 Audio elements for instant, high-volume mobile audio playback
const audioElementsCache: Record<string, HTMLAudioElement> = {};

function getPreloadedAudio(soundType: SoundType): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  const fileName = soundType === "chime" ? "chime.wav" : (soundType === "cashier" ? "cashier.wav" : "ringtone.wav");
  const path = `/sounds/${fileName}`;
  if (!audioElementsCache[soundType]) {
    try {
      const audio = new Audio(path);
      audio.preload = "auto";
      (audio as any).playsInline = true;
      audioElementsCache[soundType] = audio;
    } catch {
      return null;
    }
  }
  return audioElementsCache[soundType];
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Unlock audio on first touch/click
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    // Prime all HTML5 audio elements on first interaction
    ["ringtone", "chime", "cashier"].forEach((t) => {
      try {
        const audio = getPreloadedAudio(t as SoundType);
        if (audio) {
          audio.load();
        }
      } catch {}
    });

    // Remove listeners once unlocked
    window.removeEventListener("click", unlockAudio);
    window.removeEventListener("touchstart", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
  };
  window.addEventListener("click", unlockAudio, { passive: true });
  window.addEventListener("touchstart", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio, { passive: true });
}

/**
 * Check if sound notifications are enabled
 */
export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(STORAGE_SOUND_ENABLED);
  return stored === null ? true : stored === "true";
}

/**
 * Toggle or set sound notifications enabled
 */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_SOUND_ENABLED, String(enabled));
  // Unlock audio if enabling
  if (enabled) {
    getAudioContext();
  }
}

/**
 * Get configured sound type
 */
export function getSoundType(): SoundType {
  if (typeof window === "undefined") return "chime";
  return (localStorage.getItem(STORAGE_SOUND_TYPE) as SoundType) || "chime";
}

/**
 * Set sound type
 */
export function setSoundType(type: SoundType): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_SOUND_TYPE, type);
}

/**
 * Play synthesized Web Audio oscillators as instant fallback
 */
function playSynthesizedAudio(type: SoundType): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.85, now);
    masterGain.connect(ctx.destination);

    if (type === "cashier") {
      // Crisp "Cha-Ching" cashier bell
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(987.77, now); // B5
      gain1.gain.setValueAtTime(0.6, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.5);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.8, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.08);
      osc2.stop(now + 1.2);

    } else if (type === "ringtone") {
      // Authentic dual-tone phone/terminal ringing chime (صوت رنين هاتف وطلبات مميز)
      const playRingBurst = (startTime: number) => {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(853, startTime);
        gain1.gain.setValueAtTime(0.55, startTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, startTime + 0.38);
        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.start(startTime);
        osc1.stop(startTime + 0.38);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(960, startTime);
        gain2.gain.setValueAtTime(0.55, startTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, startTime + 0.38);
        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start(startTime);
        osc2.stop(startTime + 0.38);

        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = "triangle";
        osc3.frequency.setValueAtTime(1209, startTime);
        gain3.gain.setValueAtTime(0.35, startTime);
        gain3.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
        osc3.connect(gain3);
        gain3.connect(masterGain);
        osc3.start(startTime);
        osc3.stop(startTime + 0.35);
      };

      playRingBurst(now);
      playRingBurst(now + 0.22);
      playRingBurst(now + 0.65);
      playRingBurst(now + 0.87);

    } else if (type === "urgent") {
      [0, 0.14, 0.28, 0.5, 0.64].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        const freq = idx >= 3 ? 1046.5 : 880;
        osc.frequency.setValueAtTime(freq, now + offset);
        gain.gain.setValueAtTime(0.4, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + offset);
        osc.stop(now + offset + 0.1);
      });

    } else {
      // Chime
      const notes = [
        { freq: 523.25, time: 0, dur: 0.3 },
        { freq: 659.25, time: 0.12, dur: 0.3 },
        { freq: 783.99, time: 0.24, dur: 0.4 },
        { freq: 1046.50, time: 0.38, dur: 0.9 },
      ];

      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(n.freq, now + n.time);
        gain.gain.setValueAtTime(0, now + n.time);
        gain.gain.linearRampToValueAtTime(0.7, now + n.time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.dur);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur);
      });
    }
  } catch (err) {
    console.warn("Could not play synthesized order alert:", err);
  }
}

/**
 * Play a high-volume sound alert for incoming orders
 * Uses preloaded HTML5 Audio with fallback to Web Audio API synthesis
 */
export function playOrderAlertSound(typeOverride?: SoundType): void {
  if (!isSoundEnabled()) return;

  const type = typeOverride || getSoundType();

  // 1. Try HTML5 Audio element first (works better in mobile browsers and background tabs)
  try {
    const audio = getPreloadedAudio(type);
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // If browser policy throttled HTML5 Audio, trigger Web Audio synthesis
          playSynthesizedAudio(type);
        });
      }
      return;
    }
  } catch (e) {
    // Fallback
  }

  // 2. Fallback to Web Audio synthesis
  playSynthesizedAudio(type);
}

/**
 * Request Notification permission from browser with user gesture
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  try {
    if (Notification.permission === "granted") {
      return true;
    }
    if (Notification.permission !== "denied") {
      const result = await Notification.requestPermission();
      return result === "granted";
    }
    return false;
  } catch (e) {
    console.warn("Notification permission request failed:", e);
    return false;
  }
}

export interface CustomNotificationOptions extends NotificationOptions {
  soundType?: SoundType;
  playSound?: boolean;
  vibrate?: number | number[];
  vibratePattern?: number[];
  requireInteraction?: boolean;
  dedupKey?: string;
  dedupCooldownMs?: number;
}

// Global in-memory + localStorage deduplication registry
const deliveredNotificationTimestamps = new Map<string, number>();

export function shouldDeliverNotification(key: string, cooldownMs: number = 600000): boolean {
  if (!key) return true;
  const now = Date.now();
  const lastTime = deliveredNotificationTimestamps.get(key);
  if (lastTime && now - lastTime < cooldownMs) {
    return false;
  }

  // Cross-tab check via localStorage
  try {
    const storageKey = "tw_notif_seen_" + key;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const storedTime = Number(stored);
      if (now - storedTime < cooldownMs) {
        deliveredNotificationTimestamps.set(key, storedTime);
        return false;
      }
    }
    localStorage.setItem(storageKey, String(now));
  } catch {}

  deliveredNotificationTimestamps.set(key, now);
  return true;
}

export function markNotificationDelivered(key: string): void {
  if (!key) return;
  const now = Date.now();
  deliveredNotificationTimestamps.set(key, now);
  try {
    localStorage.setItem("tw_notif_seen_" + key, String(now));
  } catch {}
}

/**
 * Show system / browser notification with App Icon in Android status bar, 
 * audible sound chime/ringtone, vibration, and title alert.
 * Works across mobile PWA and desktop.
 */
export async function showSystemNotification(
  title: string, 
  options?: CustomNotificationOptions
): Promise<void> {
  if (typeof window === "undefined") return;

  // 0. Deduplication check: Do not deliver duplicate notifications for the same event key
  if (options?.dedupKey) {
    const shouldDeliver = shouldDeliverNotification(options.dedupKey, options.dedupCooldownMs || 600000);
    if (!shouldDeliver) {
      return;
    }
  }

  // 1. Play sound chime/ringtone
  if (options?.playSound !== false && isSoundEnabled()) {
    try {
      playOrderAlertSound(options?.soundType || "ringtone");
    } catch (soundErr) {
      console.warn("Sound play error in notification:", soundErr);
    }
  }

  // 2. Hardware vibration for mobile phones
  try {
    triggerOrderVibration();
  } catch {}

  // 3. Alternate title so background tabs alert the user
  try {
    flashTabTitle(`🔔 ${title}`);
  } catch {}

  // 4. Check notification permission
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  try {
    // Resolve absolute URLs for icon and badge so Android status bar and drawer always render them
    const origin = window.location.origin;
    let pathname = window.location.pathname.replace(/\/index\.html$/, "");
    if (!pathname.endsWith("/")) {
      const lastSlash = pathname.lastIndexOf("/");
      pathname = lastSlash >= 0 ? pathname.substring(0, lastSlash + 1) : "/";
    }
    const basePath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
    
    // Both icon (notification card) and badge (Android status bar icon at top of screen)
    const iconUrl = options?.icon || `${origin}${basePath}/icon-192.png`;
    const badgeUrl = options?.badge || `${origin}${basePath}/icon-192.png`;

    const soundType = options?.soundType || "ringtone";
    const soundFileName = soundType === "chime" ? "chime.wav" : (soundType === "cashier" ? "cashier.wav" : "ringtone.wav");
    const soundUrl = `${origin}${basePath}/sounds/${soundFileName}`;

    const fullOptions: any = {
      icon: iconUrl,
      badge: badgeUrl,
      sound: soundUrl,
      vibrate: options?.vibratePattern || options?.vibrate || [600, 200, 600, 200, 1000],
      renotify: true,
      tag: options?.tag || options?.dedupKey || (options?.data?.orderId ? `tw-order-${options.data.orderId}` : `tw-notif-app`),
      dir: "rtl",
      lang: "ar",
      silent: false,
      requireInteraction: options?.requireInteraction ?? true,
      ...options,
      data: {
        url: window.location.href,
        sound: soundType,
        timestamp: Date.now(),
        ...(options?.data || {}),
      },
    };

    // Primary Mobile Path (Android Chrome / PWA): Must use ServiceWorkerRegistration.showNotification
    // This is what puts the app icon in the Android status bar (top notification tray) like WhatsApp!
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && typeof registration.showNotification === "function") {
          await registration.showNotification(title, fullOptions);
          return;
        }
      } catch (swErr) {
        console.warn("ServiceWorker showNotification failed, trying fallback:", swErr);
      }

      // If active controller exists, also send message to Service Worker
      if (navigator.serviceWorker.controller) {
        try {
          navigator.serviceWorker.controller.postMessage({
            type: "SHOW_NOTIFICATION",
            title,
            options: fullOptions
          });
          return;
        } catch {}
      }
    }

    // Secondary Desktop Fallback (for browsers allowing new Notification constructor)
    try {
      const n = new Notification(title, fullOptions);
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (notifErr) {
      console.warn("Desktop Notification constructor error:", notifErr);
    }
  } catch (err) {
    console.warn("Failed to display system notification:", err);
  }
}

/**
 * Triggers a test notification with sound, vibration, and app icon in status bar
 */
export async function triggerTestNotification(): Promise<void> {
  const granted = await requestNotificationPermission();
  if (granted) {
    await showSystemNotification("تطبيق توصيل 🛵", {
      body: "تم تفعيل التنبيهات بنجاح! ستظهر أيقونة التطبيق في شريط الإشعارات أعلى الشاشة مع صوت الرنين عند وصول أي طلب أو تحديث.",
      soundType: "ringtone",
      requireInteraction: true
    });
  }
}

/**
 * Cross-tab and Background Broadcast Channel for Real-time events
 */
let broadcastChannel: BroadcastChannel | null = null;

export function getOrderBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return null;
  if (!broadcastChannel) {
    try {
      broadcastChannel = new BroadcastChannel("tw_live_orders_channel");
    } catch (e) {
      console.warn("BroadcastChannel not supported:", e);
    }
  }
  return broadcastChannel;
}

export function broadcastNewOrder(order: any): void {
  const channel = getOrderBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage({ type: "NEW_ORDER", order, timestamp: Date.now() });
    } catch {}
  }
  // Also store in localStorage to guarantee cross-tab detection across all browsers
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("tw_last_broadcast_order", JSON.stringify({ order, timestamp: Date.now() }));
    } catch {}
    window.dispatchEvent(
      new CustomEvent("tw_new_order_event", { detail: { order, timestamp: Date.now() } })
    );
  }
}

/**
 * Broadcast when Admin forwards an order to a Store
 */
export function broadcastOrderForwardedToStore(order: any): void {
  const channel = getOrderBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage({ type: "ORDER_FORWARDED_TO_STORE", order, timestamp: Date.now() });
    } catch {}
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("tw_last_forwarded_order", JSON.stringify({ order, timestamp: Date.now() }));
    } catch {}
    window.dispatchEvent(
      new CustomEvent("tw_order_forwarded_event", { detail: { order, timestamp: Date.now() } })
    );
  }
}

/**
 * Trigger physical device vibration for incoming order alerts
 */
export function triggerOrderVibration(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate([350, 150, 350, 150, 600]);
    } catch {}
  }
}

/**
 * Alternate document title to alert user if window/tab is in the background
 */
let titleFlashTimer: any = null;
let originalDocumentTitle = "";

export function flashTabTitle(alertTitle: string = "🔔 (طلب جديد وارد!)"): void {
  if (typeof document === "undefined") return;
  if (!originalDocumentTitle) {
    originalDocumentTitle = document.title || "توصيل - خدمة التوصيل السريع بالقرية";
  }
  if (titleFlashTimer) {
    clearInterval(titleFlashTimer);
  }
  let toggle = false;
  titleFlashTimer = setInterval(() => {
    document.title = toggle ? alertTitle : originalDocumentTitle;
    toggle = !toggle;
  }, 1000);

  const stopFlash = () => {
    if (titleFlashTimer) {
      clearInterval(titleFlashTimer);
      titleFlashTimer = null;
    }
    if (originalDocumentTitle) {
      document.title = originalDocumentTitle;
    }
    window.removeEventListener("focus", stopFlash);
    window.removeEventListener("click", stopFlash);
    window.removeEventListener("touchstart", stopFlash);
  };

  window.addEventListener("focus", stopFlash);
  window.addEventListener("click", stopFlash);
  window.addEventListener("touchstart", stopFlash);
}
