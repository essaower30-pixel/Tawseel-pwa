import { Store, Order, Product, Category, DriverMember } from "../types";
import { initialStores, initialProducts, initialCategories, initialMapNodes } from "../data/initialData";
import { initialOrders, initialDrivers } from "../data/adminInitialData";

export interface ServerNotification {
  id: string;
  type: "STORE_REGISTERED" | "STORE_APPROVED" | "NEW_ORDER" | "ORDER_UPDATED";
  title: string;
  message: string;
  targetStoreId?: string;
  order?: Order;
  timestamp: number;
}

export interface ServerSyncData {
  stores: Store[];
  products: Product[];
  orders: Order[];
  drivers?: DriverMember[];
  notifications?: ServerNotification[];
  categories?: Category[];
  lastUpdated: number;
}

const API_BASE = "";

// Ensure stores are preserved without duplicating driver service cards and respecting deletions
export function ensureInitialStoresPreserved(currentStores: Store[]): Store[] {
  if (typeof window !== "undefined" && localStorage.getItem("tw_clean_slate_active") === "true") {
    return currentStores;
  }

  let deletedIds: string[] = [];
  try {
    deletedIds = JSON.parse(localStorage.getItem("tw_deleted_store_ids") || "[]");
  } catch {}

  const cleanP = (p?: string) => (p || "").replace(/[^0-9]/g, "");

  if (!currentStores || currentStores.length === 0) {
    return initialStores.filter(s => !deletedIds.includes(s.id));
  }

  // Deduplicate and filter deleted stores
  const seenIds = new Set<string>();
  const seenDriverPhones = new Set<string>();
  const result: Store[] = [];

  for (const rawS of currentStores) {
    if (deletedIds.includes(rawS.id)) continue;
    if (seenIds.has(rawS.id)) continue;
    // Fleet captains should never appear as marketplace stores in driver services
    if (rawS.id.startsWith("service_driver_") || rawS.id === "service_hamza_oweir") continue;

    // For driver services, prevent multiple store cards with the same phone number
    if (rawS.category === "drivers" && rawS.contactPhone) {
      const p = cleanP(rawS.contactPhone);
      if (p && seenDriverPhones.has(p)) {
        continue;
      }
      if (p) seenDriverPhones.add(p);
    }

    // Auto-clean description if store is approved but description still has pending note
    let s = rawS;
    if (s.isApproved !== false && s.description && (s.description.includes("بانتظار اعتماد") || s.description.includes("بانتظار الاعتماد"))) {
      const isFood = s.category === "food" || s.name.includes("مواد") || s.name.includes("سوبرماركت");
      s = {
        ...s,
        description: isFood ? "متجر مواد غذائية وتموينية طازجة معتمد في المنصة" : "متجر معتمد ونشط في المنصة"
      };
    }

    seenIds.add(s.id);
    result.push(s);
  }

  // Ensure ALL initial stores are preserved if not deleted and not already in list
  for (const initStore of initialStores) {
    if (deletedIds.includes(initStore.id)) continue;
    if (seenIds.has(initStore.id)) continue;

    if (initStore.category === "drivers" && initStore.contactPhone) {
      const p = cleanP(initStore.contactPhone);
      if (p && seenDriverPhones.has(p)) continue;
      if (p) seenDriverPhones.add(p);
    }

    seenIds.add(initStore.id);
    result.push(initStore);
  }

  return result;
}

// Ensure products are preserved without resurrecting deleted products
export function ensureInitialProductsPreserved(currentProducts: Product[]): Product[] {
  if (typeof window !== "undefined" && localStorage.getItem("tw_clean_slate_active") === "true") {
    return currentProducts;
  }

  let deletedIds: string[] = [];
  try {
    deletedIds = JSON.parse(localStorage.getItem("tw_deleted_product_ids") || "[]");
  } catch {}

  const seenIds = new Set<string>();
  const result: Product[] = [];

  for (const p of (currentProducts || [])) {
    if (deletedIds.includes(p.id)) continue;
    if (seenIds.has(p.id)) continue;
    seenIds.add(p.id);
    result.push(p);
  }

  // Ensure all initial products for village stores exist offline and online
  for (const initProd of initialProducts) {
    if (deletedIds.includes(initProd.id)) continue;
    if (seenIds.has(initProd.id)) continue;
    seenIds.add(initProd.id);
    result.push(initProd);
  }

  return result;
}

// Ensure fleet drivers are preserved without resurrecting deleted drivers
export function ensureInitialDriversPreserved(currentDrivers: DriverMember[]): DriverMember[] {
  if (typeof window !== "undefined" && localStorage.getItem("tw_clean_slate_active") === "true") {
    return currentDrivers;
  }

  let deletedIds: string[] = [];
  try {
    deletedIds = JSON.parse(localStorage.getItem("tw_deleted_driver_ids") || "[]");
  } catch {}

  const cleanP = (p?: string) => (p || "").replace(/[^0-9]/g, "");

  if (!currentDrivers || currentDrivers.length === 0) {
    return initialDrivers.filter(d => !deletedIds.includes(d.id));
  }

  const seenIds = new Set<string>();
  const seenPhones = new Set<string>();
  const result: DriverMember[] = [];

  for (const d of currentDrivers) {
    if (deletedIds.includes(d.id)) continue;
    if (seenIds.has(d.id)) continue;

    const p = cleanP(d.phone);
    if (p && seenPhones.has(p)) continue;
    if (p) seenPhones.add(p);

    seenIds.add(d.id);
    result.push(d);
  }

  return result;
}

// Fetch unified data from central server
export async function fetchServerSync(): Promise<ServerSyncData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/sync`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store"
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (err) {
    // Graceful offline fallback
    return null;
  }
}

// Register or Add a new Store on the central server (so all devices see it immediately)
export async function registerStoreOnServer(store: Store): Promise<Store> {
  try {
    const res = await fetch(`${API_BASE}/api/stores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(store)
    });
    if (res.ok) {
      const data = await res.json();
      return data.store || store;
    }
  } catch (err) {
    console.warn("Failed to reach server, saved locally:", err);
  }
  return store;
}

// Approve and activate a store (Sets isApproved: true, status: 'open')
export async function approveStoreOnServer(storeId: string): Promise<Store | null> {
  try {
    const res = await fetch(`${API_BASE}/api/stores/${storeId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      return data.store || null;
    }
  } catch (err) {
    console.warn("Failed to approve store on server:", err);
  }
  return null;
}

// Update store details on central server
export async function updateStoreOnServer(store: Store): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/stores/${store.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(store)
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// Delete store from central server
export async function deleteStoreOnServer(storeId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/stores/${storeId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// Add/save order on central server
export async function saveOrderOnServer(order: Order): Promise<Order> {
  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
    if (res.ok) {
      const data = await res.json();
      return data.order || order;
    }
  } catch (err) {
    console.warn("Failed to send order to server:", err);
  }
  return order;
}

// Update order status on central server
export async function updateOrderOnServer(orderId: string, updates: Partial<Order>): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// Save product on central server
export async function saveProductOnServer(product: Product): Promise<Product> {
  try {
    const res = await fetch(`${API_BASE}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product)
    });
    if (res.ok) {
      const data = await res.json();
      return data.product || product;
    }
  } catch (err) {
    console.warn("Failed to send product to server:", err);
  }
  return product;
}

// Update product on central server
export async function updateProductOnServer(product: Product): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product)
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// Delete product on central server
export async function deleteProductOnServer(productId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/products/${productId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// Fetch drivers fleet from central server
export async function fetchDriversFromServer(): Promise<DriverMember[]> {
  try {
    const res = await fetch(`${API_BASE}/api/drivers`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store"
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.warn("Failed to fetch drivers from server:", err);
  }
  return [];
}

// Register or Add a new Driver on central server
export async function saveDriverOnServer(driver: DriverMember): Promise<DriverMember> {
  try {
    const res = await fetch(`${API_BASE}/api/drivers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(driver)
    });
    if (res.ok) {
      const data = await res.json();
      return data.driver || driver;
    }
  } catch (err) {
    console.warn("Failed to save driver on server:", err);
  }
  return driver;
}

// Update driver on central server
export async function updateDriverOnServer(driver: DriverMember): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/drivers/${driver.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(driver)
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// Delete driver on central server
export async function deleteDriverOnServer(driverId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/drivers/${driverId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// Clean Slate: Zero out demo/sample data on central server
export async function cleanSlateOnServer(target?: "all" | "orders_only" | "zero_transactions"): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/clean-slate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target })
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// Restore default demo dataset on server
export async function restoreDefaultsOnServer(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/restore-defaults`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// Fetch categories from central server
export async function fetchCategoriesFromServer(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/api/categories`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store"
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.warn("Failed to fetch categories from server:", err);
  }
  return [];
}

// Add or save category on central server
export async function saveCategoryOnServer(category: Category): Promise<Category> {
  try {
    const res = await fetch(`${API_BASE}/api/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category)
    });
    if (res.ok) {
      const data = await res.json();
      return data.category || category;
    }
  } catch (err) {
    console.warn("Failed to save category on server:", err);
  }
  return category;
}

// Reorder / update all categories on central server
export async function reorderCategoriesOnServer(categories: Category[]): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/categories`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories })
    });
    return res.ok;
  } catch (err) {
    console.warn("Failed to update categories on server:", err);
    return false;
  }
}

// Delete category on central server
export async function deleteCategoryOnServer(categoryId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/categories/${categoryId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
    return res.ok;
  } catch (err) {
    console.warn("Failed to delete category on server:", err);
    return false;
  }
}

// -------------------------------------------------------------
// Emergency Rush / Freeze Status API Helpers
// -------------------------------------------------------------
export async function saveSystemStatusOnServer(emergencyRush: boolean): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/system-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emergencyRush })
    });
    return res.ok;
  } catch (err) {
    console.warn("Failed to save system status on server:", err);
    return false;
  }
}

export async function fetchSystemStatusFromServer(): Promise<{ emergencyRush: boolean } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/system-status`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Failed to fetch system status from server:", err);
  }
  return null;
}

