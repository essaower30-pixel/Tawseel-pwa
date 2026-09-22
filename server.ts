import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import webpush from "web-push";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

const STORAGE_FILE = path.join(process.cwd(), "server_storage.json");

// Default initial stores
const defaultInitialStores = [
  {
    id: "store_yasmin",
    name: "مطعم الياسمين الدمشقي",
    category: "restaurants",
    image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=500&auto=format&fit=crop&q=60",
    rating: 4.8,
    deliveryTime: "20-30 دقيقة",
    deliveryFee: 5,
    locationNode: "store_yasmin",
    featuredProduct: "شاورما دجاج سوبر محمرة",
    status: "open",
    isApproved: true,
    description: "أشهى المأكولات الشامية والشاورما والبروستد بالطعم الأصلي",
    workingHours: "11:00 ص - 12:00 م"
  },
  {
    id: "store_pizza",
    name: "مطعم بيتزا الضيعة",
    category: "restaurants",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60",
    rating: 4.6,
    deliveryTime: "25-35 دقيقة",
    deliveryFee: 6,
    locationNode: "store_pizza",
    featuredProduct: "بيتزا نابوليتانا بالفرن العربي",
    status: "open",
    isApproved: true,
    description: "بيتزا نابوليتانا، مناقيش وفطائر طازجة على الحطب",
    workingHours: "12:00 م - 01:00 ص"
  },
  {
    id: "store_baraka",
    name: "سوبرماركت البركة للغذاء",
    category: "supermarkets",
    image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=60",
    rating: 4.9,
    deliveryTime: "15-25 دقيقة",
    deliveryFee: 4,
    locationNode: "store_baraka",
    featuredProduct: "سلة التوفير الأسبوعية للقرية",
    status: "open",
    isApproved: true,
    description: "كافة المواد الغذائية، التموينية، المنظفات والألبان الطازجة",
    workingHours: "08:00 ص - 12:00 منتصف الليل"
  },
  {
    id: "store_shifa",
    name: "صيدلية الشفاء المركزية",
    category: "pharmacies",
    image: "https://images.unsplash.com/photo-1586015555751-63c25a0b73c4?w=500&auto=format&fit=crop&q=60",
    rating: 4.9,
    deliveryTime: "10-20 دقيقة",
    deliveryFee: 3,
    locationNode: "store_shifa",
    featuredProduct: "حقيبة الإسعافات المنزلية الشاملة",
    status: "open",
    isApproved: true,
    description: "أدوية، مستلزمات طبية، رعاية الأم والطفل وحليب الرضع",
    workingHours: "خدمة 24 ساعة متواصلة"
  },
  {
    id: "store_elite",
    name: "خضروات وفواكه النخبة",
    category: "vegetables",
    image: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=500&auto=format&fit=crop&q=60",
    rating: 4.7,
    deliveryTime: "20-30 دقيقة",
    deliveryFee: 4,
    locationNode: "store_elite",
    featuredProduct: "صندوق خضار المزرعة اليومي المشكل",
    status: "open",
    isApproved: true,
    description: "خضار وفاكهة منتقاة بعناية يومياً من مزارع القرية والمحافظة",
    workingHours: "07:00 ص - 10:00 م"
  },
  {
    id: "store_baghdad",
    name: "حلويات بغداد الشرقية",
    category: "sweets",
    image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=60",
    rating: 4.8,
    deliveryTime: "25-35 دقيقة",
    deliveryFee: 5,
    locationNode: "store_baghdad",
    featuredProduct: "صينية وربات وكنافة نابلسية خشنة",
    status: "open",
    isApproved: true,
    description: "أشهى الحلويات الشرقية، الكنافة، البقلاوة والمعمول الفاخر بالسمن العربي",
    workingHours: "10:00 ص - 11:00 م"
  },
  {
    id: "store_fashion",
    name: "بوتيك الأناقة للأزياء والملابس",
    category: "clothes",
    image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500&auto=format&fit=crop&q=60",
    rating: 4.9,
    deliveryTime: "25-40 دقيقة",
    deliveryFee: 5,
    locationNode: "center",
    featuredProduct: "تشكيلة ألبسة وأزياء ولادية ورجالية ونسائية حديثة",
    status: "open",
    isApproved: true,
    description: "أحدث صيحات الملابس والأزياء الراقية، قطنيات، بيجامات، وأطقم خروج بأفضل الأسعار لجميع أفراد الأسرة",
    workingHours: "10:00 ص - 10:30 م",
    ownerPhone: "0955667788",
    contactPhone: "0955667788",
    ownerPin: "1234"
  },
  {
    id: "clinic_dr_ahmad",
    name: "عيادة الدكتور أحمد لطب الأسرة",
    category: "doctors",
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format&fit=crop&q=60",
    rating: 4.95,
    deliveryTime: "حجز مسبق",
    deliveryFee: 0,
    locationNode: "center",
    featuredProduct: "استشارة وزيارة منزلية لكبار السن",
    contactPhone: "0933112233",
    status: "open",
    isApproved: true,
    isService: true,
    description: "فحص عام، متابعة الضغط والسكري، ومعاينة الحالات الطارئة",
    workingHours: "04:00 م - 09:00 م"
  },
  {
    id: "craft_electric",
    name: "ورشة النور للتمديدات والكهرباء",
    category: "crafts",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=60",
    rating: 4.85,
    deliveryTime: "طلب فوري",
    deliveryFee: 0,
    locationNode: "center",
    featuredProduct: "صيانة طوارئ وأعطال منزلية سريعة",
    contactPhone: "0944556677",
    status: "open",
    isApproved: true,
    isService: true,
    description: "صيانة منزلية، تمديد كابلات وإنارة، تركيب طاقة شمسية"
  },
  {
    id: "craft_paint",
    name: "ورشة المعلم سامر للدهان والديكور",
    category: "crafts",
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&auto=format&fit=crop&q=60",
    rating: 4.75,
    deliveryTime: "حسب الاتفاق",
    deliveryFee: 0,
    locationNode: "center",
    featuredProduct: "دهانات وديكورات داخلية وخارجية",
    contactPhone: "0955667788",
    status: "open",
    isApproved: true,
    isService: true,
    description: "دهان منازل، ديكورات جصية وورق جدران"
  },
  {
    id: "service_hamza_oweir",
    name: "الكابتن حمزة عوير للتوصيل السريع",
    category: "drivers",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format&fit=crop&q=60",
    rating: 5.0,
    deliveryTime: "طلب فوري",
    deliveryFee: 0,
    locationNode: "center",
    featuredProduct: "توصيل ركاب وطلبات ومهمات سريعة بدراجة نارية",
    contactPhone: "0951854257",
    ownerPhone: "0951854257",
    ownerName: "الكابتن حمزة عوير",
    ownerPin: "1111",
    status: "open",
    isApproved: true,
    isService: true,
    description: "خدمات توصيل ركاب وطلبات ومهمات سريعة داخل وخارج القرية بدراجة نارية سوزوكي حديثة على مدار الساعة",
    priority: 1
  },
  {
    id: "service_taxi",
    name: "كابتن تيسير للتوصيل الخاص",
    category: "drivers",
    image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=500&auto=format&fit=crop&q=60",
    rating: 4.9,
    deliveryTime: "طلب فوري",
    deliveryFee: 0,
    locationNode: "center",
    featuredProduct: "توصيل ركاب ورحلات خارجية",
    contactPhone: "0966778899",
    status: "open",
    isApproved: true,
    isService: true,
    description: "توصيل خاص للقرى المجاورة والمدينة بسيارة مكيفة"
  },
  {
    id: "store_gypsum_decor",
    name: "جبس بورد وديكور",
    category: "crafts",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=60",
    rating: 5,
    deliveryTime: "حسب الاتفاق والمقاسات",
    deliveryFee: 0,
    locationNode: "center",
    featuredProduct: "ديكورات جبس بورد وأسقف مستعارة وقواطع جدارية",
    contactPhone: "0961141215",
    ownerPhone: "0961141215",
    ownerName: "فني ديكور وجبس",
    ownerPin: "1234",
    status: "open",
    isApproved: true,
    isService: true,
    description: "تركيب وتنفيذ أعمال جبس بورد، أسقف معلقة، ديكورات شاشات، قواطع جدارية، وإضاءة ليد بروفايل مخفية عصرية",
    workingHours: "09:00 ص - 09:00 م",
    priority: 1
  }
];

const defaultFleetDrivers = [
  { id: "driver_hamza", name: "الكابتن حمزة عوير", username: "capt_hamza", phone: "0951854257", pin: "1111", status: "available", totalDeliveries: 15, earnings: 60000, rating: 5.0, vehicle: "دراجة نارية سوزوكي" },
  { id: "driver_1", name: "الكابتن أبو محمود", username: "capt_mahmoud", phone: "0991112233", pin: "1111", status: "available", totalDeliveries: 0, earnings: 0, rating: 5.0, vehicle: "دراجة نارية سوزوكي" },
  { id: "driver_2", name: "الكابتن طارق السريع", username: "capt_tarek", phone: "0992223344", pin: "2222", status: "available", totalDeliveries: 0, earnings: 0, rating: 5.0, vehicle: "سكوتر كهربائي" },
  { id: "driver_3", name: "الكابتن وسيم الورد", username: "capt_waseem", phone: "0993334455", pin: "3333", status: "available", totalDeliveries: 0, earnings: 0, rating: 5.0, vehicle: "دراجة نارية هوائية" }
];

const defaultInitialCategories = [
  { id: "offers", label: "العروض الحالية", icon: "Flame" },
  { id: "restaurants", label: "مطاعم وجبات", icon: "Utensils" },
  { id: "supermarkets", label: "سوبرماركت", icon: "ShoppingBag" },
  { id: "clothes", label: "ملابس وازياء", icon: "Shirt" },
  { id: "butcher", label: "لحوم وملاحم", icon: "Beef" },
  { id: "pharmacies", label: "صيدليات", icon: "Pill" },
  { id: "vegetables", label: "خضار وفواكه", icon: "Leaf" },
  { id: "sweets", label: "حلويات ومعجنات", icon: "CakeSlice" },
  { id: "doctors", label: "عيادات وأطباء", icon: "Stethoscope" },
  { id: "crafts", label: "مهن وصيانة", icon: "Wrench" },
  { id: "drivers", label: "خدمات وسائقين", icon: "Car" }
];

function readServerData() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const content = fs.readFileSync(STORAGE_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed.isCleanSlate) {
        if (!parsed.stores) parsed.stores = [];
        if (!parsed.orders) parsed.orders = [];
        if (!parsed.products) parsed.products = [];
        if (!parsed.drivers) parsed.drivers = [];
        if (!parsed.notifications) parsed.notifications = [];
        if (!parsed.deletedCategoryIds) parsed.deletedCategoryIds = [];
        if (!parsed.categories || !Array.isArray(parsed.categories) || parsed.categories.length === 0) {
          parsed.categories = defaultInitialCategories.filter((c: any) => !parsed.deletedCategoryIds.includes(c.id));
        } else {
          const catIds = new Set(parsed.categories.map((c: any) => c.id));
          for (const defCat of defaultInitialCategories) {
            if (!catIds.has(defCat.id) && !parsed.deletedCategoryIds.includes(defCat.id)) {
              parsed.categories.push(defCat);
              catIds.add(defCat.id);
            }
          }
          parsed.categories = parsed.categories.filter((c: any) => !parsed.deletedCategoryIds.includes(c.id));
        }
        return parsed;
      }
      if (!parsed.stores) parsed.stores = defaultInitialStores;
      if (!parsed.orders) parsed.orders = [];
      if (!parsed.products) parsed.products = [];
      if (!parsed.deletedDriverIds) parsed.deletedDriverIds = [];
      if (!parsed.deletedStoreIds) parsed.deletedStoreIds = [];
      if (!parsed.deletedCategoryIds) parsed.deletedCategoryIds = [];
      if (!parsed.categories || !Array.isArray(parsed.categories) || parsed.categories.length === 0) {
        parsed.categories = defaultInitialCategories.filter((c: any) => !parsed.deletedCategoryIds.includes(c.id));
      } else {
        const catIds = new Set(parsed.categories.map((c: any) => c.id));
        for (const defCat of defaultInitialCategories) {
          if (!catIds.has(defCat.id) && !parsed.deletedCategoryIds.includes(defCat.id)) {
            parsed.categories.push(defCat);
            catIds.add(defCat.id);
          }
        }
        parsed.categories = parsed.categories.filter((c: any) => !parsed.deletedCategoryIds.includes(c.id));
      }

      if (!parsed.drivers || !Array.isArray(parsed.drivers) || parsed.drivers.length === 0) {
        parsed.drivers = defaultFleetDrivers.filter((d: any) => !parsed.deletedDriverIds.includes(d.id));
      } else {
        parsed.drivers = parsed.drivers.filter((d: any) => !parsed.deletedDriverIds.includes(d.id));
      }
      if (!parsed.notifications) parsed.notifications = [];

      // Filter out deleted stores and deduplicate driver service stores
      const cleanPhone = (p?: string) => (p || "").replace(/[^0-9]/g, "");
      const seenStoreIds = new Set<string>();
      const seenDriverPhones = new Set<string>();
      const dedupedStores: any[] = [];

      for (const s of (parsed.stores || [])) {
        if (parsed.deletedStoreIds.includes(s.id)) continue;
        if (seenStoreIds.has(s.id)) continue;

        if (s.category === "drivers" && s.contactPhone) {
          const p = cleanPhone(s.contactPhone);
          if (p && seenDriverPhones.has(p)) continue;
          if (p) seenDriverPhones.add(p);
        }

        let storeObj = s;
        if (storeObj.id === "store_gypsum_decor" || storeObj.id === "store-gypsum-board") {
          storeObj = {
            ...storeObj,
            isApproved: true,
            status: storeObj.status === "closed" && storeObj.isApproved === false ? "open" : (storeObj.status || "open")
          };
        }
        if (storeObj.isApproved !== false && storeObj.description && (storeObj.description.includes("بانتظار اعتماد") || storeObj.description.includes("بانتظار الاعتماد"))) {
          const isFood = storeObj.category === "food" || (storeObj.name && (storeObj.name.includes("مواد") || storeObj.name.includes("سوبرماركت")));
          storeObj = {
            ...storeObj,
            description: isFood ? "متجر مواد غذائية وتموينية طازجة معتمد في المنصة" : "متجر معتمد ونشط في المنصة"
          };
        }

        seenStoreIds.add(storeObj.id);
        dedupedStores.push(storeObj);
      }

      // Merge default initial stores unless in clean slate or explicitly deleted
      if (parsed.isCleanSlate !== true) {
        for (const defStore of defaultInitialStores) {
          if (parsed.deletedStoreIds.includes(defStore.id)) continue;
          if (seenStoreIds.has(defStore.id)) continue;
          if (defStore.category === "drivers" && defStore.contactPhone) {
            const p = cleanPhone(defStore.contactPhone);
            if (p && seenDriverPhones.has(p)) continue;
            if (p) seenDriverPhones.add(p);
          }
          seenStoreIds.add(defStore.id);
          dedupedStores.push(defStore);
        }
      }

      parsed.stores = dedupedStores;

      return parsed;
    }
  } catch (err) {
    console.error("Error reading server storage:", err);
  }

  const initialData = {
    isCleanSlate: false,
    stores: defaultInitialStores,
    orders: [],
    products: [],
    drivers: defaultFleetDrivers,
    categories: defaultInitialCategories,
    deletedCategoryIds: [],
    notifications: [],
    lastUpdated: Date.now()
  };
  writeServerData(initialData);
  return initialData;
}

function writeServerData(data: any) {
  try {
    data.lastUpdated = Date.now();
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing server storage:", err);
  }
}

// 1. API: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 1.1 API: System Freeze / Emergency Rush Status
app.get("/api/system-status", (req, res) => {
  const data = readServerData();
  res.json({ emergencyRush: Boolean(data.emergencyRush) });
});

app.post("/api/system-status", (req, res) => {
  const { emergencyRush } = req.body;
  const data = readServerData();
  data.emergencyRush = Boolean(emergencyRush);
  writeServerData(data);
  res.json({ success: true, emergencyRush: data.emergencyRush });
});

// ==============================================================================
// Web Push Notifications & Background Alerts Setup (Works when phone is locked/closed)
// ==============================================================================
let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || "",
  privateKey: process.env.VAPID_PRIVATE_KEY || "",
};

try {
  const currentData = readServerData();
  if (currentData.vapidKeys && currentData.vapidKeys.publicKey && currentData.vapidKeys.privateKey) {
    vapidKeys = currentData.vapidKeys;
  } else if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
    vapidKeys = webpush.generateVAPIDKeys();
    currentData.vapidKeys = vapidKeys;
    writeServerData(currentData);
  }

  webpush.setVapidDetails(
    "mailto:support@tawseel.app",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
  console.log("Web Push initialized successfully with public key:", vapidKeys.publicKey.substring(0, 15) + "...");
} catch (vapidErr) {
  console.error("VAPID Init error:", vapidErr);
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  sound?: string;
  data?: any;
}

async function dispatchPushNotification(
  filterFn: (sub: any) => boolean,
  payload: PushPayload
) {
  const data = readServerData();
  if (!data.pushSubscriptions || !Array.isArray(data.pushSubscriptions)) return;

  const validPayload = {
    title: payload.title || "توصيل 🛵",
    body: payload.body || "",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    tag: payload.tag || "tw-push-" + Date.now(),
    sound: payload.sound || "ringtone",
    data: payload.data || { url: "/" },
    timestamp: Date.now()
  };

  const stringified = JSON.stringify(validPayload);
  const deadEndpoints = new Set<string>();

  const matchingSubs = data.pushSubscriptions.filter(filterFn);
  if (matchingSubs.length > 0) {
    console.log(`[Push] Dispatching to ${matchingSubs.length} matching subscribers. Title: "${payload.title}"`);
  }

  await Promise.allSettled(
    matchingSubs.map(async (item: any) => {
      try {
        if (!item.subscription || !item.subscription.endpoint) return;
        await webpush.sendNotification(item.subscription, stringified);
      } catch (err: any) {
        console.warn(`[Push Error] for endpoint ${item.subscription?.endpoint?.substring(0, 30)}:`, err?.statusCode || err?.message);
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          deadEndpoints.add(item.subscription.endpoint);
        }
      }
    })
  );

  if (deadEndpoints.size > 0) {
    data.pushSubscriptions = data.pushSubscriptions.filter(
      (s: any) => !deadEndpoints.has(s.subscription?.endpoint)
    );
    writeServerData(data);
  }
}

// 1.2 Web Push Endpoints
app.get("/api/push/public-key", (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

app.post("/api/push/subscribe", (req, res) => {
  const { subscription, role, identifier, name, orderId } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "بيانات الاشتراك غير مكتملة" });
  }

  const data = readServerData();
  if (!data.pushSubscriptions) data.pushSubscriptions = [];

  data.pushSubscriptions = [
    ...data.pushSubscriptions.filter(
      (s: any) => s.subscription?.endpoint !== subscription.endpoint
    ),
    {
      subscription,
      role: role || "customer",
      identifier: identifier || "",
      name: name || "",
      orderId: orderId || "",
      updatedAt: Date.now()
    }
  ];

  writeServerData(data);
  res.json({ success: true, count: data.pushSubscriptions.length });
});

app.post("/api/push/unsubscribe", (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: "Endpoint مطلوب" });

  const data = readServerData();
  if (data.pushSubscriptions) {
    data.pushSubscriptions = data.pushSubscriptions.filter(
      (s: any) => s.subscription?.endpoint !== endpoint
    );
    writeServerData(data);
  }
  res.json({ success: true });
});

app.post("/api/push/notify", async (req, res) => {
  const { targetRole, targetId, title, body, sound, url, orderId } = req.body;
  await dispatchPushNotification(
    (s: any) => {
      if (targetRole && targetRole !== "all" && s.role !== targetRole) return false;
      if (targetId && s.identifier !== targetId && s.orderId !== targetId) return false;
      return true;
    },
    {
      title: title || "توصيل 🛵",
      body: body || "",
      sound: sound || "ringtone",
      tag: orderId ? `tw-order-${orderId}` : undefined,
      data: { url: url || "/", orderId }
    }
  );
  res.json({ success: true });
});

app.post("/api/push/send-test", async (req, res) => {
  const { role, identifier } = req.body;
  await dispatchPushNotification(
    (s: any) => {
      if (role && s.role !== role) return false;
      if (identifier && s.identifier !== identifier) return false;
      return true;
    },
    {
      title: "تطبيق توصيل 🛵",
      body: "تنبيه اختبار بالخلفية! الإشعارات ستصل مع النغمة وظهور الأيقونة حتى لو كان الهاتف مقفلاً تماماً.",
      sound: "ringtone",
      data: { url: "/" }
    }
  );
  res.json({ success: true, message: "تم إرسال إشعار الاختبار بنجاح" });
});

// 2. API: Unified Full Sync Endpoint
app.get("/api/sync", (req, res) => {
  const data = readServerData();
  const deletedSet = new Set(data.deletedCategoryIds || []);
  if (data.categories && Array.isArray(data.categories)) {
    data.categories = data.categories.filter((c: any) => !deletedSet.has(c.id));
  }
  res.json(data);
});

// 2.1 API: Categories Management (Admin / Global)
app.get("/api/categories", (req, res) => {
  const data = readServerData();
  const deletedSet = new Set(data.deletedCategoryIds || []);
  const baseList = (data.categories || defaultInitialCategories).filter((c: any) => !deletedSet.has(c.id));
  res.json(baseList);
});

app.post("/api/categories", (req, res) => {
  const newCat = req.body;
  if (!newCat || !newCat.label) {
    return res.status(400).json({ error: "اسم التصنيف مطلوب" });
  }
  const data = readServerData();
  if (!data.categories || !Array.isArray(data.categories)) {
    data.categories = [...defaultInitialCategories];
  }

  const id = newCat.id || ("cat_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5));
  const categoryItem = {
    id,
    label: String(newCat.label).trim(),
    icon: newCat.icon || "ShoppingBag"
  };

  const existingIdx = data.categories.findIndex((c: any) => c.id === id);
  if (existingIdx >= 0) {
    data.categories[existingIdx] = categoryItem;
  } else {
    data.categories.push(categoryItem);
  }
  if (!data.deletedCategoryIds) data.deletedCategoryIds = [];
  data.deletedCategoryIds = data.deletedCategoryIds.filter((cid: string) => cid !== id);
  writeServerData(data);
  res.json({ success: true, category: categoryItem, categories: data.categories });
});

app.put("/api/categories", (req, res) => {
  const { categories } = req.body;
  if (!Array.isArray(categories)) {
    return res.status(400).json({ error: "بيانات التصنيفات غير صالحة" });
  }
  const data = readServerData();
  const deletedSet = new Set(data.deletedCategoryIds || []);
  data.categories = categories.filter((c: any) => !deletedSet.has(c.id));
  writeServerData(data);
  res.json({ success: true, categories: data.categories });
});

app.delete("/api/categories/:id", (req, res) => {
  const catId = req.params.id;
  if (catId === "offers") {
    return res.status(400).json({ error: "لا يمكن حذف تصنيف العروض الحالية الرئيسي" });
  }
  const data = readServerData();
  if (!data.deletedCategoryIds) data.deletedCategoryIds = [];
  if (!data.deletedCategoryIds.includes(catId)) {
    data.deletedCategoryIds.push(catId);
  }
  if (data.categories) {
    data.categories = data.categories.filter((c: any) => c.id !== catId);
  }

  // Safe Store Healing: If any stores were attached to this deleted category,
  // automatically reassign them so they don't become invisible or orphaned!
  let reassignedStoresCount = 0;
  if (data.stores && Array.isArray(data.stores)) {
    const fallbackCategory = (catId.includes("cloth") || catId.includes("mtuj2s13ho2")) ? "clothes" : "supermarkets";
    data.stores = data.stores.map((s: any) => {
      if (s.category === catId) {
        reassignedStoresCount++;
        return { ...s, category: fallbackCategory };
      }
      return s;
    });
  }

  writeServerData(data);
  res.json({
    success: true,
    categories: data.categories,
    deletedCategoryIds: data.deletedCategoryIds,
    reassignedStoresCount
  });
});

// 3. API: Get all stores
app.get("/api/stores", (req, res) => {
  const data = readServerData();
  res.json(data.stores || []);
});

// 4. API: Register / Add a store (from mobile merchant registration or admin dashboard)
app.post("/api/stores", (req, res) => {
  const newStore = req.body;
  if (!newStore || !newStore.name) {
    return res.status(400).json({ error: "اسم المتجر مطلوب" });
  }

  const data = readServerData();
  const cleanPhone = (p?: string) => (p || "").replace(/[^0-9]/g, "");
  const targetPhone = cleanPhone(newStore.ownerPhone || newStore.contactPhone);

  // Automatic category healing if a deleted or obsolete category was submitted
  const deletedSet = new Set(data.deletedCategoryIds || []);
  if (deletedSet.has(newStore.category) || newStore.category === "cat_mtuj2s13ho2") {
    if (newStore.category?.includes("cloth") || newStore.category === "cat_mtuj2s13ho2") {
      newStore.category = "clothes";
    } else {
      newStore.category = "supermarkets";
    }
  }

  const existingIdx = data.stores.findIndex((s: any) => {
    if (s.id === newStore.id) return true;
    if (targetPhone && (cleanPhone(s.ownerPhone) === targetPhone || cleanPhone(s.contactPhone) === targetPhone)) {
      return true;
    }
    return false;
  });

  if (existingIdx >= 0) {
    data.stores[existingIdx] = { ...data.stores[existingIdx], ...newStore };
  } else {
    data.stores.unshift(newStore);
  }

  // Record system broadcast notification
  data.notifications = [
    {
      id: "notif_" + Date.now(),
      type: "STORE_REGISTERED",
      title: "طلب انضمام متجر جديد 🏪",
      message: `قام متجر "${newStore.name}" بالتسجيل وينتظر موافقة واعتماد الإدارة.`,
      targetStoreId: newStore.id,
      timestamp: Date.now()
    },
    ...(data.notifications || []).slice(0, 30)
  ];

  writeServerData(data);
  return res.json({ success: true, store: newStore });
});

// 5. API: Approve Store (Sets isApproved: true, status: 'open')
app.post("/api/stores/:id/approve", (req, res) => {
  const storeId = req.params.id;
  const data = readServerData();
  const store = data.stores.find((s: any) => s.id === storeId);

  if (!store) {
    return res.status(404).json({ error: "المتجر غير موجود" });
  }

  store.isApproved = true;
  store.status = "open";
  if (!store.description || store.description.includes("بانتظار اعتماد") || store.description.includes("بانتظار الاعتماد")) {
    const isFood = store.category === "food" || (store.name && (store.name.includes("مواد") || store.name.includes("سوبرماركت")));
    store.description = isFood ? "متجر مواد غذائية وتموينية طازجة معتمد في المنصة" : "متجر معتمد ونشط في المنصة";
  }

  // Add approval broadcast notification
  data.notifications = [
    {
      id: "notif_" + Date.now(),
      type: "STORE_APPROVED",
      title: "تم اعتماد وتفعيل المتجر 🎉",
      message: `تم اعتماد وتفعيل متجر "${store.name}" بنجاح وأصبح متاحاً للزبائن.`,
      targetStoreId: store.id,
      timestamp: Date.now()
    },
    ...(data.notifications || []).slice(0, 30)
  ];

  writeServerData(data);
  return res.json({ success: true, store });
});

// 6. API: Update Store
app.put("/api/stores/:id", (req, res) => {
  const storeId = req.params.id;
  const updates = req.body;
  const data = readServerData();
  const idx = data.stores.findIndex((s: any) => s.id === storeId);

  if (idx >= 0) {
    let mergedStore = { ...data.stores[idx], ...updates };
    if (mergedStore.isApproved !== false && mergedStore.description && (mergedStore.description.includes("بانتظار اعتماد") || mergedStore.description.includes("بانتظار الاعتماد"))) {
      const isFood = mergedStore.category === "food" || (mergedStore.name && (mergedStore.name.includes("مواد") || mergedStore.name.includes("سوبرماركت")));
      mergedStore.description = isFood ? "متجر مواد غذائية وتموينية طازجة معتمد في المنصة" : "متجر معتمد ونشط في المنصة";
    }
    data.stores[idx] = mergedStore;
    writeServerData(data);
    return res.json({ success: true, store: data.stores[idx] });
  }

  return res.status(404).json({ error: "المتجر غير موجود" });
});

// 7. API: Delete Store
app.delete("/api/stores/:id", (req, res) => {
  const storeId = req.params.id;
  const data = readServerData();
  if (!data.deletedStoreIds) data.deletedStoreIds = [];
  if (!data.deletedStoreIds.includes(storeId)) {
    data.deletedStoreIds.push(storeId);
  }
  data.stores = (data.stores || []).filter((s: any) => s.id !== storeId);
  writeServerData(data);
  res.json({ success: true });
});

// 8. API: Orders
app.get("/api/orders", (req, res) => {
  const data = readServerData();
  res.json(data.orders || []);
});

app.post("/api/orders", (req, res) => {
  const newOrder = req.body;
  const data = readServerData();

  if (data.emergencyRush) {
    return res.status(403).json({
      error: "تم تجميد استقبال الطلبات مؤقتاً بسبب ضغط العمل العالي",
      emergencyRush: true
    });
  }

  data.orders = [newOrder, ...(data.orders || []).filter((o: any) => o.id !== newOrder.id)];

  // Deduct product stock on server with each sale until out of stock
  if (data.products && Array.isArray(data.products) && newOrder.items && Array.isArray(newOrder.items)) {
    const itemQtyMap = new Map<string, number>();
    const itemByNameMap = new Map<string, number>();
    for (const item of newOrder.items) {
      if (item.product) {
        const qty = Number(item.quantity) || 1;
        if (item.product.id) {
          itemQtyMap.set(item.product.id, (itemQtyMap.get(item.product.id) || 0) + qty);
        }
        if (item.product.name) {
          const key = `${newOrder.storeId || item.product.storeId}_${item.product.name.trim().toLowerCase()}`;
          itemByNameMap.set(key, (itemByNameMap.get(key) || 0) + qty);
        }
      }
    }
    data.products = data.products.map((p: any) => {
      let soldQty = itemQtyMap.get(p.id);
      if (!soldQty && p.name) {
        const key = `${p.storeId}_${p.name.trim().toLowerCase()}`;
        soldQty = itemByNameMap.get(key);
      }
      if (soldQty && soldQty > 0) {
        const currentStock = p.stock !== undefined ? p.stock : 50;
        const newStock = Math.max(0, currentStock - soldQty);
        const currentSold = p.soldCount || 0;
        return {
          ...p,
          stock: newStock,
          soldCount: currentSold + soldQty,
          inStock: newStock > 0,
          isAvailable: newStock > 0
        };
      }
      return p;
    });
  }

  // Record new order notification
  data.notifications = [
    {
      id: "notif_order_" + Date.now(),
      type: "NEW_ORDER",
      title: "طلب جديد وارد! 🛍️",
      message: `طلب #${newOrder.id} وارد إلى (${newOrder.storeName}) بقيمة ${newOrder.total} ل.س`,
      targetStoreId: newOrder.storeId,
      order: newOrder,
      timestamp: Date.now()
    },
    ...(data.notifications || []).slice(0, 30)
  ];

    writeServerData(data);

    // Trigger background Web Push for new order (Wakes up phones when locked or app closed)
    try {
      // 1. Alert Admins
      dispatchPushNotification(
        (s: any) => s.role === "admin",
        {
          title: `🔔 طلب جديد وارد للإدارة #${newOrder.id}`,
          body: `طلب وارد لمتجر (${newOrder.storeName}) بقيمة ${newOrder.total} ل.س`,
          sound: "ringtone",
          data: { url: `/?orderId=${newOrder.id}`, orderId: newOrder.id }
        }
      ).catch(() => {});

      // 2. Alert Store Owner
      dispatchPushNotification(
        (s: any) => s.role === "store" && (s.identifier === newOrder.storeId || s.identifier === newOrder.storePhone),
        {
          title: `🏪 طلب جديد وارد لمتجرك #${newOrder.id}!`,
          body: `لديك طلب جديد بقيمة ${newOrder.total} ل.س! انقر للمراجعة والبدء بالتجهيز 🛵`,
          sound: "ringtone",
          data: { url: `/?store=${newOrder.storeId}`, orderId: newOrder.id }
        }
      ).catch(() => {});

      // 3. Alert Drivers fleet
      dispatchPushNotification(
        (s: any) => s.role === "driver",
        {
          title: `🛵 طلب توصيل جديد متاح #${newOrder.id}!`,
          body: `طلب توصيل جديد من (${newOrder.storeName}) جاهز للتكليف والتوصيل`,
          sound: "ringtone",
          data: { url: `/?orderId=${newOrder.id}`, orderId: newOrder.id }
        }
      ).catch(() => {});
    } catch (e) {
      console.warn("Error dispatching background push for new order:", e);
    }

    res.json({ success: true, order: newOrder });
  });

app.put("/api/orders/:id", (req, res) => {
  const orderId = req.params.id;
  const updates = req.body;
  const data = readServerData();
  const idx = data.orders.findIndex((o: any) => o.id === orderId);
  if (idx >= 0) {
    const prevOrder = data.orders[idx];
    data.orders[idx] = { ...prevOrder, ...updates };

    // If order is cancelled, restore stock if previously deducted
    if (updates.status === "cancelled" && prevOrder.status !== "cancelled" && prevOrder.items && Array.isArray(prevOrder.items) && data.products) {
      for (const item of prevOrder.items) {
        if (item.product) {
          const qty = Number(item.quantity) || 1;
          const target = data.products.find((p: any) => 
            p.id === item.product.id || 
            (p.storeId === prevOrder.storeId && p.name && item.product.name && p.name.trim().toLowerCase() === item.product.name.trim().toLowerCase())
          );
          if (target) {
            target.stock = (target.stock !== undefined ? target.stock : 0) + qty;
            target.soldCount = Math.max(0, (target.soldCount || 0) - qty);
            target.inStock = target.stock > 0;
            target.isAvailable = target.stock > 0;
          }
        }
      }
      data.orders[idx].stockDeducted = false;
    }

    // If order is delivered or active and stock was not yet deducted, deduct it
    if ((updates.status === "delivered" || updates.status === "accepted" || updates.status === "preparing" || updates.status === "picked_up") && !prevOrder.stockDeducted && prevOrder.items && Array.isArray(prevOrder.items) && data.products) {
      for (const item of prevOrder.items) {
        if (item.product) {
          const qty = Number(item.quantity) || 1;
          const target = data.products.find((p: any) => 
            p.id === item.product.id || 
            (p.storeId === prevOrder.storeId && p.name && item.product.name && p.name.trim().toLowerCase() === item.product.name.trim().toLowerCase())
          );
          if (target) {
            const currentStock = target.stock !== undefined ? target.stock : 50;
            target.stock = Math.max(0, currentStock - qty);
            target.soldCount = (target.soldCount || 0) + qty;
            target.inStock = target.stock > 0;
            target.isAvailable = target.stock > 0;
          }
        }
      }
      data.orders[idx].stockDeducted = true;
    }

    // Record order status update notification
    data.notifications = [
      {
        id: "notif_update_" + Date.now(),
        type: "ORDER_UPDATED",
        title: "تحديث حالة الطلب 📦",
        message: `الطلب #${orderId}: ${updates.status || "تم تحديث الطلب"}`,
        order: data.orders[idx],
        timestamp: Date.now()
      },
      ...(data.notifications || []).slice(0, 30)
    ];

    writeServerData(data);

    // Trigger background Web Push for order updates (wakes up mobile screen & status bar)
    try {
      // Alert Driver if newly assigned
      if ((updates.driverPhone && updates.driverPhone !== prevOrder.driverPhone) || (updates.driverName && !prevOrder.driverName)) {
        dispatchPushNotification(
          (s: any) => s.role === "driver" && (s.identifier === updates.driverPhone || s.identifier === updates.driverId),
          {
            title: `🛵 تم إسناد طلب جديد إليك #${orderId}!`,
            body: `تم إسناد توصيل طلب متجر (${data.orders[idx].storeName}) إليك. انقر لفتح التفاصيل والموقع.`,
            sound: "ringtone",
            data: { url: `/?orderId=${orderId}`, orderId }
          }
        ).catch(() => {});
      }

      // Alert Customer when status progresses
      if (updates.status && updates.status !== prevOrder.status) {
        let custTitle = `تحديث طلبك #${orderId}`;
        let custBody = "";
        let custSound: "ringtone" | "chime" = "chime";

        if (updates.status === "accepted") {
          custTitle = `📋 تم قبول طلبك #${orderId}`;
          custBody = `تم تأكيد وقبول طلبك من متجر (${data.orders[idx].storeName}).`;
        } else if (updates.status === "preparing") {
          custTitle = `🍳 جاري تجهيز طلبك #${orderId}`;
          custBody = `بدأ متجر (${data.orders[idx].storeName}) بتجهيز طلبك وسيتم تسليمه للكابتن قريباً.`;
        } else if (updates.status === "picked_up") {
          custTitle = `🛵 طلبك #${orderId} خرج للتوصيل!`;
          custBody = data.orders[idx].driverName
            ? `الكابتن ${data.orders[idx].driverName} استلم طلبك وهو في الطريق إليك الآن.`
            : "الكابتن استلم طلبك وهو الآن في الطريق إليك.";
          custSound = "ringtone";
        } else if (updates.status === "delivered") {
          custTitle = `✅ تم تسليم طلبك #${orderId} بنجاح!`;
          custBody = "تم تأكيد التسليم ومطابقة كود الأمان بنجاح. شكراً لاختيارك توصيل 🛵";
        } else if (updates.status === "cancelled") {
          custTitle = `❌ تم إلغاء طلبك #${orderId}`;
          custBody = updates.cancellationReason || "تم إلغاء الطلب من قبل المتجر أو الإدارة.";
        }

        if (custBody) {
          dispatchPushNotification(
            (s: any) => s.role === "customer" || s.identifier === data.orders[idx].customerPhone || s.identifier === orderId || s.orderId === orderId,
            {
              title: custTitle,
              body: custBody,
              sound: custSound,
              data: { url: `/?orderId=${orderId}`, orderId }
            }
          ).catch(() => {});
        }
      }
    } catch (pushErr) {
      console.warn("Error dispatching background push on order update:", pushErr);
    }

    return res.json({ success: true, order: data.orders[idx] });
  }
  res.status(404).json({ error: "الطلب غير موجود" });
});

// 9. API: Products
app.get("/api/products", (req, res) => {
  const data = readServerData();
  res.json(data.products || []);
});

app.post("/api/products", (req, res) => {
  const newProduct = req.body;
  const data = readServerData();
  data.products = [newProduct, ...(data.products || []).filter((p: any) => p.id !== newProduct.id)];
  writeServerData(data);
  res.json({ success: true, product: newProduct });
});

app.put("/api/products/:id", (req, res) => {
  const productId = req.params.id;
  const updates = req.body;
  const data = readServerData();
  const idx = (data.products || []).findIndex((p: any) => p.id === productId);
  if (idx >= 0) {
    data.products[idx] = { ...data.products[idx], ...updates };
    writeServerData(data);
    return res.json({ success: true, product: data.products[idx] });
  }
  res.status(404).json({ error: "المنتج غير موجود" });
});

app.delete("/api/products/:id", (req, res) => {
  const productId = req.params.id;
  const data = readServerData();
  data.products = (data.products || []).filter((p: any) => p.id !== productId);
  writeServerData(data);
  res.json({ success: true });
});

// 10. API: Drivers Fleet
app.get("/api/drivers", (req, res) => {
  const data = readServerData();
  res.json(data.drivers || []);
});

app.post("/api/drivers", (req, res) => {
  const newDriver = req.body;
  if (!newDriver || !newDriver.name) {
    return res.status(400).json({ error: "بيانات الكابتن غير مكتملة" });
  }
  const data = readServerData();
  if (!data.drivers) data.drivers = [];
  
  const cleanPhone = (p?: string) => (p || "").replace(/[^0-9]/g, "");
  const targetPhone = cleanPhone(newDriver.phone);

  const existingIdx = data.drivers.findIndex((d: any) => {
    if (d.id === newDriver.id) return true;
    if (targetPhone && cleanPhone(d.phone) === targetPhone) return true;
    if (newDriver.username && d.username && d.username.toLowerCase() === newDriver.username.toLowerCase()) return true;
    return false;
  });

  if (existingIdx >= 0) {
    data.drivers[existingIdx] = { ...data.drivers[existingIdx], ...newDriver };
  } else {
    data.drivers.push(newDriver);
  }

  writeServerData(data);
  res.json({ success: true, driver: newDriver });
});

app.put("/api/drivers/:id", (req, res) => {
  const driverId = req.params.id;
  const updates = req.body;
  const data = readServerData();
  if (!data.drivers) data.drivers = [];
  const idx = data.drivers.findIndex((d: any) => d.id === driverId);
  if (idx >= 0) {
    data.drivers[idx] = { ...data.drivers[idx], ...updates };
    const updatedDriver = data.drivers[idx];

    // Also update and deduplicate any associated service store in data.stores
    if (data.stores) {
      const cleanP = (p?: string) => (p || "").replace(/[^0-9]/g, "");
      const targetPhone = cleanP(updatedDriver.phone);
      const storeName = updatedDriver.name.startsWith("الكابتن") || updatedDriver.name.startsWith("كابتن") ? updatedDriver.name : `الكابتن ${updatedDriver.name}`;

      let storeUpdated = false;
      data.stores = data.stores.map((s: any) => {
        const isMatch =
          s.id === `service_driver_${driverId}` ||
          (driverId === "driver_hamza" && s.id === "service_hamza_oweir") ||
          (s.category === "drivers" && ((targetPhone && cleanP(s.contactPhone) === targetPhone) || (s.name && s.name.includes(updatedDriver.name))));
        
        if (isMatch && !storeUpdated) {
          storeUpdated = true;
          return {
            ...s,
            name: storeName,
            contactPhone: updatedDriver.phone,
            ownerPhone: updatedDriver.phone,
            ownerName: updatedDriver.name,
            ownerPin: updatedDriver.pin || s.ownerPin || "1111",
            featuredProduct: updatedDriver.vehicle ? `توصيل سريع (${updatedDriver.vehicle})` : s.featuredProduct,
            description: `كابتن توصيل سريع معتمد في القرية (${updatedDriver.vehicle || "دراجة نارية"}). متاح لتوصيل الطلبات والمشاوير الخاصة.`
          };
        }
        return s;
      });

      // Filter out any duplicate store for this driver
      const seenDriverStore = new Set<string>();
      data.stores = data.stores.filter((s: any) => {
        if (s.category === "drivers") {
          const p = cleanP(s.contactPhone);
          if (p === targetPhone) {
            if (seenDriverStore.has(p)) return false;
            seenDriverStore.add(p);
          }
        }
        return true;
      });
    }

    writeServerData(data);
    return res.json({ success: true, driver: updatedDriver });
  }
  res.status(404).json({ error: "الكابتن غير موجود" });
});

app.delete("/api/drivers/:id", (req, res) => {
  const driverId = req.params.id;
  const data = readServerData();
  if (!data.deletedDriverIds) data.deletedDriverIds = [];
  if (!data.deletedDriverIds.includes(driverId)) {
    data.deletedDriverIds.push(driverId);
  }
  data.drivers = (data.drivers || []).filter((d: any) => d.id !== driverId);

  // Also remove and mark as deleted any associated driver service store
  if (!data.deletedStoreIds) data.deletedStoreIds = [];
  data.stores = (data.stores || []).filter((s: any) => {
    const isMatch =
      s.id === `service_driver_${driverId}` ||
      (driverId === "driver_hamza" && s.id === "service_hamza_oweir") ||
      (s.category === "drivers" && s.id.includes(driverId));
    if (isMatch) {
      if (!data.deletedStoreIds.includes(s.id)) {
        data.deletedStoreIds.push(s.id);
      }
      return false;
    }
    return true;
  });

  writeServerData(data);
  res.json({ success: true });
});

// 11. API: Clean Slate (Zero out demo data while preserving server data structures)
app.post("/api/clean-slate", (req, res) => {
  const { preserveCustomOnly, target } = req.body || {};
  const currentData = readServerData();

  if (target === "zero_transactions" || target === "orders_only") {
    currentData.orders = [];
    currentData.notifications = [];
    if (currentData.drivers) {
      currentData.drivers = currentData.drivers.map((d: any) => ({
        ...d,
        totalDeliveries: 0,
        earnings: 0
      }));
    }
    writeServerData(currentData);
    return res.json({ 
      success: true, 
      message: "تم تصفير الحركات وكافة عدادات الطلبات والتوصيلات إلى (0) بنجاح مع إبقاء المتاجر والأصناف لتعديلها." 
    });
  }

  // Complete Clean Slate
  const cleanedData = {
    isCleanSlate: true,
    stores: [],
    products: [],
    orders: [],
    drivers: (currentData.drivers || []).map((d: any) => ({ ...d, totalDeliveries: 0, earnings: 0 })),
    notifications: [
      {
        id: "notif_clean_" + Date.now(),
        type: "SYSTEM",
        title: "تم تصفير البيانات التجريبية ✨",
        message: "تم بدء النظام على نظافة تامة وجاهز لإضافة متاجر القرية الحقيقية.",
        timestamp: Date.now()
      }
    ],
    lastUpdated: Date.now()
  };

  writeServerData(cleanedData);
  return res.json({ 
    success: true, 
    message: "تم تصفير كافة الأمثلة التجريبية والبدء على نظافة تامة مع حفظ هيكل البرنامج وإعداداته." 
  });
});

// 11. API: Restore Default Demo Data
app.post("/api/restore-defaults", (req, res) => {
  const resetData = {
    isCleanSlate: false,
    stores: defaultInitialStores,
    products: [],
    orders: [],
    notifications: [],
    lastUpdated: Date.now()
  };
  writeServerData(resetData);
  return res.json({ success: true, message: "تمت استعادة البيانات التجريبية الافتراضية بنجاح" });
});

// Process protection against unexpected crashes
process.on("unhandledRejection", (reason, promise) => {
  console.warn("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

// Mount Vite middleware for dev or static files for prod
async function start() {
  // Global express error handler for API routes
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Server API Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error", message: err?.message || String(err) });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(
      express.static(distPath, {
        maxAge: "1d",
        setHeaders: (res, filePath) => {
          if (filePath.endsWith("sw.js")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          } else if (filePath.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-cache, must-revalidate");
          }
        },
      })
    );
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-cache, must-revalidate");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Fatal startup error in server.ts:", err);
});


