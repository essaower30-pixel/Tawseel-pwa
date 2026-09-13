import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Order,
  Store,
  Product,
  DriverMember,
  RegisteredCustomer,
  StoreReview,
  StoreBroadcast,
  Coupon,
  AppSettings,
  Category
} from "../types";
import {
  initialStores,
  initialProducts,
  initialCategories,
  initialMapNodes
} from "../data/initialData";
import { initialOrders, initialDrivers, initialCoupons } from "../data/adminInitialData";

// Helper to remove undefined values before Firestore writes
function sanitizeForFirestore<T>(data: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as any)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        clean[key] = value.map(item => (typeof item === "object" && item !== null ? sanitizeForFirestore(item) : item));
      } else if (typeof value === "object" && value !== null) {
        clean[key] = sanitizeForFirestore(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean;
}

// -------------------------------------------------------------
// SEED INITIAL DATA (Runs safely once if collections are empty)
// -------------------------------------------------------------
export async function seedInitialFirestoreData(): Promise<void> {
  try {
    let deletedStoreIds: string[] = [];
    let deletedDriverIds: string[] = [];
    try {
      if (typeof window !== "undefined") {
        deletedStoreIds = JSON.parse(localStorage.getItem("tw_deleted_store_ids") || "[]");
        deletedDriverIds = JSON.parse(localStorage.getItem("tw_deleted_driver_ids") || "[]");
      }
    } catch {}

    // 1. Check if stores exist
    const storesSnap = await getDocs(collection(db, "stores"));
    if (storesSnap.empty) {
      console.log("Seeding initial stores to Firestore...");
      for (const store of initialStores) {
        if (!deletedStoreIds.includes(store.id)) {
          await setDoc(doc(db, "stores", store.id), sanitizeForFirestore({
            ...store,
            updatedAt: new Date().toISOString()
          }));
        }
      }
    }

    // 2. Check if products exist
    const productsSnap = await getDocs(collection(db, "products"));
    if (productsSnap.empty) {
      console.log("Seeding initial products to Firestore...");
      for (const product of initialProducts) {
        await setDoc(doc(db, "products", product.id), sanitizeForFirestore({
          ...product,
          updatedAt: new Date().toISOString()
        }));
      }
    }

    // 3. Check if drivers exist
    const driversSnap = await getDocs(collection(db, "drivers"));
    if (driversSnap.empty) {
      console.log("Seeding initial drivers to Firestore...");
      for (const driver of initialDrivers) {
        if (!deletedDriverIds.includes(driver.id)) {
          await setDoc(doc(db, "drivers", driver.id), sanitizeForFirestore({
            ...driver,
            updatedAt: new Date().toISOString()
          }));
        }
      }
    }

    // 4. Check if coupons exist
    const couponsSnap = await getDocs(collection(db, "coupons"));
    if (couponsSnap.empty) {
      for (const coupon of initialCoupons) {
        await setDoc(doc(db, "coupons", coupon.code), sanitizeForFirestore(coupon));
      }
    }
  } catch (err) {
    console.warn("Firestore initial seeding note (non-blocking):", err);
  }
}

// -------------------------------------------------------------
// REAL-TIME SUBSCRIBERS
// -------------------------------------------------------------

export function subscribeToOrders(
  onOrdersUpdated: (orders: Order[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const ordersRef = collection(db, "orders");
    const unsub = onSnapshot(
      ordersRef,
      (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((d) => {
          list.push({ ...(d.data() as Order), id: d.id });
        });
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        onOrdersUpdated(list);
      },
      (err) => {
        console.warn("Orders subscription error:", err);
        if (onError) onError(err);
      }
    );
    return unsub;
  } catch (err) {
    console.warn("Failed to attach orders listener:", err);
    return () => {};
  }
}

export function subscribeToStores(
  onStoresUpdated: (stores: Store[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const storesRef = collection(db, "stores");
    const unsub = onSnapshot(
      storesRef,
      (snapshot) => {
        if (snapshot.empty) return;
        const list: Store[] = [];
        snapshot.forEach((d) => {
          let st = { ...(d.data() as Store), id: d.id };
          if (st.isApproved !== false && st.description && (st.description.includes("بانتظار اعتماد") || st.description.includes("بانتظار الاعتماد"))) {
            const isFood = st.category === "food" || (st.name && (st.name.includes("مواد") || st.name.includes("سوبرماركت")));
            st = {
              ...st,
              description: isFood ? "متجر مواد غذائية وتموينية طازجة معتمد في المنصة" : "متجر معتمد ونشط في المنصة"
            };
          }
          list.push(st);
        });
        onStoresUpdated(list);
      },
      (err) => {
        console.warn("Stores subscription error:", err);
        if (onError) onError(err);
      }
    );
    return unsub;
  } catch (err) {
    console.warn("Failed to attach stores listener:", err);
    return () => {};
  }
}

export function subscribeToProducts(
  onProductsUpdated: (products: Product[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const productsRef = collection(db, "products");
    const unsub = onSnapshot(
      productsRef,
      (snapshot) => {
        if (snapshot.empty) return;
        const list: Product[] = [];
        snapshot.forEach((d) => {
          list.push({ ...(d.data() as Product), id: d.id });
        });
        onProductsUpdated(list);
      },
      (err) => {
        console.warn("Products subscription error:", err);
        if (onError) onError(err);
      }
    );
    return unsub;
  } catch (err) {
    console.warn("Failed to attach products listener:", err);
    return () => {};
  }
}

export function subscribeToDrivers(
  onDriversUpdated: (drivers: DriverMember[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const driversRef = collection(db, "drivers");
    const unsub = onSnapshot(
      driversRef,
      (snapshot) => {
        if (snapshot.empty) return;
        const list: DriverMember[] = [];
        snapshot.forEach((d) => {
          list.push({ ...(d.data() as DriverMember), id: d.id });
        });
        onDriversUpdated(list);
      },
      (err) => {
        console.warn("Drivers subscription error:", err);
        if (onError) onError(err);
      }
    );
    return unsub;
  } catch (err) {
    console.warn("Failed to attach drivers listener:", err);
    return () => {};
  }
}

export function subscribeToRegistrations(
  onRegsUpdated: (regs: any[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const regsRef = collection(db, "registrations");
    const unsub = onSnapshot(
      regsRef,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => {
          list.push({ ...d.data(), id: d.id });
        });
        onRegsUpdated(list);
      },
      (err) => {
        console.warn("Registrations subscription error:", err);
        if (onError) onError(err);
      }
    );
    return unsub;
  } catch (err) {
    console.warn("Failed to attach registrations listener:", err);
    return () => {};
  }
}

export function subscribeToReviews(
  onReviewsUpdated: (reviews: StoreReview[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const reviewsRef = collection(db, "reviews");
    const unsub = onSnapshot(
      reviewsRef,
      (snapshot) => {
        const list: StoreReview[] = [];
        snapshot.forEach((d) => {
          list.push({ ...(d.data() as StoreReview), id: d.id });
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        onReviewsUpdated(list);
      },
      (err) => {
        console.warn("Reviews subscription error:", err);
        if (onError) onError(err);
      }
    );
    return unsub;
  } catch (err) {
    console.warn("Failed to attach reviews listener:", err);
    return () => {};
  }
}

export function subscribeToBroadcasts(
  onBroadcastsUpdated: (broadcasts: StoreBroadcast[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const broadcastsRef = collection(db, "broadcasts");
    const unsub = onSnapshot(
      broadcastsRef,
      (snapshot) => {
        const list: StoreBroadcast[] = [];
        snapshot.forEach((d) => {
          list.push({ ...(d.data() as StoreBroadcast), id: d.id });
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        onBroadcastsUpdated(list);
      },
      (err) => {
        console.warn("Broadcasts subscription error:", err);
        if (onError) onError(err);
      }
    );
    return unsub;
  } catch (err) {
    console.warn("Failed to attach broadcasts listener:", err);
    return () => {};
  }
}

// -------------------------------------------------------------
// DIRECT MUTATIONS (Writes directly to Firestore)
// -------------------------------------------------------------

export async function saveOrderToFirestore(order: Order): Promise<boolean> {
  try {
    const docRef = doc(db, "orders", order.id);
    await setDoc(docRef, sanitizeForFirestore({
      ...order,
      syncedAt: new Date().toISOString()
    }), { merge: true });
    return true;
  } catch (err) {
    console.error("Error saving order to Firestore:", err);
    return false;
  }
}

export async function updateOrderStatusInFirestore(
  orderId: string,
  statusOrUpdates: Order["status"] | Partial<Order>,
  extraFields: Partial<Order> = {}
): Promise<boolean> {
  try {
    const docRef = doc(db, "orders", orderId);
    let payload: any = {};
    if (typeof statusOrUpdates === "string") {
      payload = {
        status: statusOrUpdates,
        ...extraFields,
        updatedAt: new Date().toISOString()
      };
    } else {
      payload = {
        ...statusOrUpdates,
        ...extraFields,
        updatedAt: new Date().toISOString()
      };
    }
    await updateDoc(docRef, sanitizeForFirestore(payload));
    return true;
  } catch (err) {
    console.error("Error updating order status in Firestore:", err);
    return false;
  }
}

export async function saveStoreToFirestore(store: Store): Promise<boolean> {
  try {
    let storeToSave = { ...store };
    if (storeToSave.isApproved !== false && storeToSave.description && (storeToSave.description.includes("بانتظار اعتماد") || storeToSave.description.includes("بانتظار الاعتماد"))) {
      const isFood = storeToSave.category === "food" || (storeToSave.name && (storeToSave.name.includes("مواد") || storeToSave.name.includes("سوبرماركت")));
      storeToSave.description = isFood ? "متجر مواد غذائية وتموينية طازجة معتمد في المنصة" : "متجر معتمد ونشط في المنصة";
    }
    const docRef = doc(db, "stores", storeToSave.id);
    await setDoc(docRef, sanitizeForFirestore({
      ...storeToSave,
      updatedAt: new Date().toISOString()
    }), { merge: true });
    return true;
  } catch (err) {
    console.error("Error saving store to Firestore:", err);
    return false;
  }
}

export async function deleteStoreFromFirestore(storeId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "stores", storeId));
    return true;
  } catch (err) {
    console.error("Error deleting store from Firestore:", err);
    return false;
  }
}

export async function saveProductToFirestore(product: Product): Promise<boolean> {
  try {
    const docRef = doc(db, "products", product.id);
    await setDoc(docRef, sanitizeForFirestore({
      ...product,
      updatedAt: new Date().toISOString()
    }), { merge: true });
    return true;
  } catch (err) {
    console.error("Error saving product to Firestore:", err);
    return false;
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "products", productId));
    return true;
  } catch (err) {
    console.error("Error deleting product from Firestore:", err);
    return false;
  }
}

export async function saveDriverToFirestore(driver: DriverMember): Promise<boolean> {
  try {
    const docRef = doc(db, "drivers", driver.id);
    await setDoc(docRef, sanitizeForFirestore({
      ...driver,
      updatedAt: new Date().toISOString()
    }), { merge: true });
    return true;
  } catch (err) {
    console.error("Error saving driver to Firestore:", err);
    return false;
  }
}

export async function saveRegistrationToFirestore(reg: any): Promise<boolean> {
  try {
    const docRef = doc(db, "registrations", reg.id || `reg_${Date.now()}`);
    await setDoc(docRef, sanitizeForFirestore({
      ...reg,
      createdAt: reg.createdAt || new Date().toISOString()
    }), { merge: true });
    return true;
  } catch (err) {
    console.error("Error saving registration to Firestore:", err);
    return false;
  }
}

export async function saveReviewToFirestore(review: StoreReview): Promise<boolean> {
  try {
    const docRef = doc(db, "reviews", review.id);
    await setDoc(docRef, sanitizeForFirestore(review), { merge: true });
    return true;
  } catch (err) {
    console.error("Error saving review to Firestore:", err);
    return false;
  }
}

export async function saveBroadcastToFirestore(broadcast: StoreBroadcast): Promise<boolean> {
  try {
    const docRef = doc(db, "broadcasts", broadcast.id);
    await setDoc(docRef, sanitizeForFirestore(broadcast), { merge: true });
    return true;
  } catch (err) {
    console.error("Error saving broadcast to Firestore:", err);
    return false;
  }
}

export async function saveCustomerToFirestore(customer: RegisteredCustomer): Promise<boolean> {
  try {
    const docRef = doc(db, "customers", customer.id);
    await setDoc(docRef, sanitizeForFirestore(customer), { merge: true });
    return true;
  } catch (err) {
    console.error("Error saving customer to Firestore:", err);
    return false;
  }
}

// Clear a specific collection in Firestore
export async function clearFirestoreCollection(collectionName: string): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, collectionName));
    const deletePromises = snap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
    return true;
  } catch (err) {
    console.warn(`Error clearing Firestore collection ${collectionName}:`, err);
    return false;
  }
}

export async function fetchDriversFromFirestore(): Promise<DriverMember[]> {
  try {
    const snap = await getDocs(collection(db, "drivers"));
    const list: DriverMember[] = [];
    snap.forEach((d) => {
      list.push({ ...(d.data() as DriverMember), id: d.id });
    });
    return list;
  } catch (err) {
    console.warn("Error fetching drivers from Firestore:", err);
    return [];
  }
}

export async function deleteDriverFromFirestore(driverId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "drivers", driverId));
    return true;
  } catch (err) {
    console.error("Error deleting driver from Firestore:", err);
    return false;
  }
}

// Clean Slate in Firestore: Clears demo stores, products, orders, reviews, broadcasts while preserving settings/schema
export async function cleanSlateFirestore(target: "all" | "orders_only" | "zero_transactions" = "all"): Promise<boolean> {
  try {
    if (target === "zero_transactions" || target === "orders_only") {
      await clearFirestoreCollection("orders");
      
      // Reset driver deliveries and earnings to 0
      try {
        const driversSnap = await getDocs(collection(db, "drivers"));
        const updatePromises: Promise<any>[] = [];
        driversSnap.forEach((d) => {
          updatePromises.push(updateDoc(d.ref, {
            totalDeliveries: 0,
            earnings: 0,
            updatedAt: new Date().toISOString()
          }));
        });
        await Promise.all(updatePromises);
      } catch (err) {
        console.warn("Error resetting driver stats in Firestore:", err);
      }

      // Reset customer stats to 0
      try {
        const custSnap = await getDocs(collection(db, "customers"));
        const custPromises: Promise<any>[] = [];
        custSnap.forEach((c) => {
          custPromises.push(updateDoc(c.ref, {
            totalOrdersCount: 0,
            totalSpent: 0,
            updatedAt: new Date().toISOString()
          }));
        });
        await Promise.all(custPromises);
      } catch (err) {
        console.warn("Error resetting customer stats in Firestore:", err);
      }

      return true;
    }

    await Promise.all([
      clearFirestoreCollection("stores"),
      clearFirestoreCollection("products"),
      clearFirestoreCollection("orders"),
      clearFirestoreCollection("reviews"),
      clearFirestoreCollection("broadcasts")
    ]);
    return true;
  } catch (err) {
    console.error("Error in cleanSlateFirestore:", err);
    return false;
  }
}

// Restore default demo dataset to Firestore
export async function reseedFirestoreDemoData(): Promise<boolean> {
  try {
    for (const store of initialStores) {
      await setDoc(doc(db, "stores", store.id), sanitizeForFirestore({
        ...store,
        updatedAt: new Date().toISOString()
      }));
    }
    for (const product of initialProducts) {
      await setDoc(doc(db, "products", product.id), sanitizeForFirestore({
        ...product,
        updatedAt: new Date().toISOString()
      }));
    }
    for (const driver of initialDrivers) {
      await setDoc(doc(db, "drivers", driver.id), sanitizeForFirestore({
        ...driver,
        updatedAt: new Date().toISOString()
      }));
    }
    return true;
  } catch (err) {
    console.error("Error reseeding Firestore demo data:", err);
    return false;
  }
}

// Save or update a single category in Firestore
export async function saveCategoryToFirestore(category: Category): Promise<void> {
  try {
    const docRef = doc(db, "categories", category.id);
    await setDoc(docRef, sanitizeForFirestore({
      ...category,
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (err) {
    console.warn("Could not save category to Firestore:", err);
  }
}

// Sync all categories to Firestore (for reordering or batch save)
export async function syncCategoriesToFirestore(categories: Category[]): Promise<void> {
  try {
    // Store ordered categories array under settings/categories document
    const docRef = doc(db, "settings", "categories");
    await setDoc(docRef, {
      list: categories,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn("Could not sync categories list to Firestore:", err);
  }
}

// Subscribe to categories in real-time
export function subscribeToCategories(
  onCategoriesUpdated: (categories: Category[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    // Listen to ordered list stored in settings/categories
    const docRef = doc(db, "settings", "categories");
    const unsub = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && Array.isArray(data.list) && data.list.length > 0) {
            const deleted = new Set<string>(data.deletedCategoryIds || []);
            const validCategories = data.list.filter((c: Category) => !deleted.has(c.id));
            onCategoriesUpdated(validCategories);
          }
        }
      },
      (err) => {
        console.warn("Categories subscription error:", err);
        if (onError) onError(err);
      }
    );
    return unsub;
  } catch (err) {
    console.warn("Failed to attach categories listener:", err);
    return () => {};
  }
}

// Delete category from Firestore
export async function deleteCategoryFromFirestore(categoryId: string): Promise<void> {
  try {
    // 1. Delete standalone doc if present
    await deleteDoc(doc(db, "categories", categoryId)).catch(() => {});

    // 2. Remove from the ordered list in settings/categories and track in deletedCategoryIds
    const docRef = doc(db, "settings", "categories");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const currentList: Category[] = Array.isArray(data.list) ? data.list : [];
      const updatedList = currentList.filter((c) => c.id !== categoryId);
      const deletedCategoryIds: string[] = Array.isArray(data.deletedCategoryIds) ? data.deletedCategoryIds : [];
      if (!deletedCategoryIds.includes(categoryId)) {
        deletedCategoryIds.push(categoryId);
      }
      await setDoc(
        docRef,
        {
          list: updatedList,
          deletedCategoryIds,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn("Could not delete category from Firestore:", err);
  }
}
