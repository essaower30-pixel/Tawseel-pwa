/**
 * Web Push Notification Manager
 * Handles VAPID key retrieval, Service Worker Push subscription,
 * and dispatching background alerts that wake up devices even when the app/screen is closed.
 */

import { requestNotificationPermission } from "./soundNotifications";

export interface PushSubscriptionData {
  role: "admin" | "store" | "driver" | "customer";
  identifier?: string;
  name?: string;
  orderId?: string;
  orderIds?: string[];
  customerPhone?: string;
}

export interface PushPayload {
  targetRole?: "admin" | "store" | "driver" | "customer" | "all";
  targetId?: string;
  title: string;
  body: string;
  sound?: "ringtone" | "chime";
  url?: string;
  orderId?: string;
}

/**
 * Check if the current browser environment supports Push Notifications
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Convert a base64 string to a Uint8Array for applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Fetch the VAPID Public Key from the server
 */
export async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch("/api/push/public-key");
    if (!res.ok) return null;
    const data = await res.json();
    return data.publicKey || null;
  } catch (err) {
    console.warn("Failed to fetch VAPID public key:", err);
    return null;
  }
}

/**
 * Subscribe the current device to Web Push notifications.
 * Works even if the phone screen is locked or browser is closed!
 */
export async function subscribeToPushNotifications(
  options: PushSubscriptionData
): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn("Web Push is not supported in this browser.");
    return false;
  }

  try {
    // 1. Ensure notification permission is granted
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
      console.warn("Notification permission was not granted.");
      return false;
    }

    // 2. Wait for Service Worker registration
    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      console.warn("Service Worker registration not ready for push.");
      return false;
    }

    // 3. Get VAPID Public Key
    const publicKey = await getVapidPublicKey();
    if (!publicKey) {
      console.warn("VAPID public key not available from server.");
      return false;
    }

    const convertedKey = urlBase64ToUint8Array(publicKey);

    // 4. Check existing subscription or subscribe new
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Verify that the existing subscription was created with the current VAPID key
      try {
        const rawKey = subscription.options.applicationServerKey;
        if (rawKey) {
          const keyArray = new Uint8Array(rawKey);
          let match = keyArray.length === convertedKey.length;
          if (match) {
            for (let i = 0; i < keyArray.length; i++) {
              if (keyArray[i] !== convertedKey[i]) {
                match = false;
                break;
              }
            }
          }
          if (!match) {
            console.log("VAPID key changed, refreshing push subscription...");
            await subscription.unsubscribe();
            subscription = null;
          }
        }
      } catch (keyCheckErr) {
        console.warn("Could not verify key match:", keyCheckErr);
      }
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey as unknown as BufferSource,
      });
    }

    // 5. Send subscription to backend
    const subJSON = subscription.toJSON();
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: subJSON,
        role: options.role,
        identifier: options.identifier || "",
        name: options.name || "",
        orderId: options.orderId || "",
        orderIds: options.orderIds || (options.orderId ? [options.orderId] : []),
        customerPhone: options.customerPhone || options.identifier || "",
      }),
    });

    if (res.ok) {
      localStorage.setItem("tw_push_registered", "true");
      localStorage.setItem("tw_push_role", options.role);
      if (options.identifier) {
        localStorage.setItem("tw_push_identifier", options.identifier);
      }
      return true;
    }

    return false;
  } catch (err) {
    console.error("Error subscribing to Web Push:", err);
    return false;
  }
}

/**
 * Dispatch a background push notification from client
 */
export async function sendPushNotification(payload: PushPayload): Promise<boolean> {
  try {
    const res = await fetch("/api/push/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn("Failed to dispatch push notification:", err);
    return false;
  }
}

/**
 * Send a test background push notification to the current device
 */
export async function sendTestPushNotification(
  role?: string,
  identifier?: string
): Promise<boolean> {
  try {
    const res = await fetch("/api/push/send-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, identifier }),
    });
    return res.ok;
  } catch (err) {
    console.warn("Failed to send test push:", err);
    return false;
  }
}
