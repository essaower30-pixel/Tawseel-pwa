/**
 * History & Back Button Manager
 * Prevents accidental app closure on Android/browser back button taps,
 * protects role-specific portals (Admin, Driver, Store Owner) so users stay in their page,
 * and ensures modals, store views, and portals close gracefully.
 */

export interface BackHandlerState {
  hasOpenModal: boolean;
  closeModal: () => void;
  isViewingCart: boolean;
  closeCart: () => void;
  hasSelectedStore: boolean;
  closeStore: () => void;
  hasActiveOrder?: boolean;
  closeActiveOrder?: () => void;
  isAdminMode: boolean;
  exitAdmin?: () => void;
  isDriverMode: boolean;
  exitDriver?: () => void;
  currentStoreOwnerId: string | null;
  exitStoreOwner?: () => void;
  selectedCategory?: string;
  resetCategory?: () => void;
}

let lastBackPressTime = 0;

/**
 * Ensures a safety history state exists
 */
export function initHistoryProtection(): void {
  if (typeof window === "undefined" || !window.history) return;
  try {
    // If state is not already tagged, replace state
    if (!window.history.state || !window.history.state.twApp) {
      window.history.replaceState({ twApp: true, depth: 1 }, "");
      window.history.pushState({ twApp: true, depth: 2 }, "");
    }
  } catch (e) {
    console.warn("History pushState error:", e);
  }
}

/**
 * Handle popstate when user presses physical or browser back button
 */
export function handleAppBackButton(
  state: BackHandlerState,
  onStayActiveNotice?: (msg: string) => void
): boolean {
  if (typeof window === "undefined") return false;

  // 1. If an App-level modal is open, close the modal first
  if (state.hasOpenModal) {
    state.closeModal();
    window.history.pushState({ twApp: true, depth: 2 }, "");
    return true;
  }

  // 2. Allow active portal components (Dashboard, Driver, Merchant) to intercept and close internal modals/dialogs
  const backEvent = new CustomEvent("tw_back_button_pressed", { cancelable: true });
  window.dispatchEvent(backEvent);
  if (backEvent.defaultPrevented) {
    window.history.pushState({ twApp: true, depth: 2 }, "");
    return true;
  }

  // 3. User Role Portals Protection:
  // Strict rule: Admins, Drivers, and Store Owners must STAY in their page even if they tap the back button!
  // They only return to the main shopping page if they explicitly tap the designated exit/switch button in the UI.

  // 3a. If in Admin Dashboard, stay in Admin Dashboard
  if (state.isAdminMode) {
    const now = Date.now();
    if (now - lastBackPressTime > 2500) {
      lastBackPressTime = now;
      if (onStayActiveNotice) {
        onStayActiveNotice("أنت في لوحة تحكم الإدارة 🛡️ اضغط زر (خروج) في الأعلى إذا أردت الانتقال لواجهة الزبائن.");
      }
    }
    window.history.pushState({ twApp: true, depth: 2 }, "");
    return true;
  }

  // 3b. If in Driver Portal, stay in Driver Portal
  if (state.isDriverMode) {
    const now = Date.now();
    if (now - lastBackPressTime > 2500) {
      lastBackPressTime = now;
      if (onStayActiveNotice) {
        onStayActiveNotice("أنت في بوابة الكابتن 🛵 للعودة لواجهة الزبون استخدم زر (واجهة الزبون) في الأعلى.");
      }
    }
    window.history.pushState({ twApp: true, depth: 2 }, "");
    return true;
  }

  // 3c. If in Store Owner Portal, stay in Store Owner Portal
  if (state.currentStoreOwnerId) {
    const now = Date.now();
    if (now - lastBackPressTime > 2500) {
      lastBackPressTime = now;
      if (onStayActiveNotice) {
        onStayActiveNotice("أنت في بوابة المتجر 🏪 للعودة لواجهة الزبائن استخدم زر (تصفح كزبون) في الأعلى.");
      }
    }
    window.history.pushState({ twApp: true, depth: 2 }, "");
    return true;
  }

  // 4. Customer Shopping Views Navigation:
  // 4a. If viewing cart, go back to main shopping screen
  if (state.isViewingCart) {
    state.closeCart();
    window.history.pushState({ twApp: true, depth: 2 }, "");
    return true;
  }

  // 4b. If viewing a store's details, go back to store list
  if (state.hasSelectedStore) {
    state.closeStore();
    window.history.pushState({ twApp: true, depth: 2 }, "");
    return true;
  }

  // 4c. If viewing active order tracker, go back to store list
  if (state.hasActiveOrder && state.closeActiveOrder) {
    state.closeActiveOrder();
    window.history.pushState({ twApp: true, depth: 2 }, "");
    return true;
  }

  // 4d. If on a filtered category (e.g. crafts or restaurants), go back to "all" stores
  if (state.selectedCategory && state.selectedCategory !== "all" && state.resetCategory) {
    state.resetCategory();
    window.history.pushState({ twApp: true, depth: 2 }, "");
    return true;
  }

  // 5. At the root customer screen, prevent accidental app termination and reassure the user
  const now = Date.now();
  if (now - lastBackPressTime > 2500) {
    lastBackPressTime = now;
    if (onStayActiveNotice) {
      onStayActiveNotice("التطبيق يستمر في العمل واستقبال تنبيهات ورنين الطلبات الجديدة 🔔");
    }
  } else {
    // If tapped rapidly again, reassure the user that the app is active in background
    if (onStayActiveNotice) {
      onStayActiveNotice("تطبيق التوصيل نشط في الخلفية 🛵 الإشعارات والرنين يعملان باستمرار.");
    }
  }
  window.history.pushState({ twApp: true, depth: 2 }, "");
  return true;
}

