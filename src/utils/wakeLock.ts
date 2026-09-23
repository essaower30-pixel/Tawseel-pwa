/**
 * Wake Lock Manager
 * Keeps the screen awake for store owners, admins, and drivers to ensure
 * instantaneous order ringing alerts without device sleep.
 */

let wakeLockSentinel: any = null;

export const isWakeLockSupported = (): boolean => {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
};

export const requestWakeLock = async (): Promise<boolean> => {
  if (!isWakeLockSupported()) return false;
  try {
    wakeLockSentinel = await (navigator as any).wakeLock.request("screen");
    wakeLockSentinel.addEventListener("release", () => {
      wakeLockSentinel = null;
    });
    return true;
  } catch (err) {
    console.warn("WakeLock request failed:", err);
    return false;
  }
};

export const releaseWakeLock = async (): Promise<void> => {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch {}
    wakeLockSentinel = null;
  }
};

export const isWakeLockActive = (): boolean => {
  return wakeLockSentinel !== null && wakeLockSentinel.released === false;
};
