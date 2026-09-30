import { Craftsman, Doctor, DriverService, DriverMember, StaffMember, Coupon, AuditLog, AppSettings, RegisteredCustomer, Order } from "../types";

export const initialCustomers: RegisteredCustomer[] = [
  { 
    id: "cust_1", 
    name: "الحاج أبو عدنان (أحمد الخالد)", 
    phone: "0991447788", 
    username: "abu_adnan",
    password: "pass_adnan_2025",
    pin: "4477",
    addressLandmark: "قرب الجامع الكبير", 
    addressDetails: "المنزل الثاني خلف مئذنة الجامع",
    notes: "طلب تسجيله هاتفياً لعدم معرفته بالهواتف الذكية - يفضل التواصل بالاتصال", 
    registeredBy: "المدير العام", 
    registeredAt: "2025-01-20", 
    totalOrdersCount: 0, 
    totalSpent: 0 
  },
  { 
    id: "cust_2", 
    name: "أم بشار النجار", 
    phone: "0992558899", 
    username: "om_bashar",
    password: "pass_om_5588",
    pin: "5588",
    addressLandmark: "الحارة الشرقية", 
    addressDetails: "بجانب معصرة الزيتون القديمة",
    notes: "سُجلت بمساعدة خدمة العملاء - تفضل الدفع النقدي عند الاستلام", 
    registeredBy: "مسؤول الطلبات", 
    registeredAt: "2025-02-05", 
    totalOrdersCount: 0, 
    totalSpent: 0 
  },
  { 
    id: "cust_3", 
    name: "الأستاذ كمال خليل", 
    phone: "0993669900", 
    username: "kamal_teacher",
    password: "pass_kamal_9900",
    pin: "6699",
    addressLandmark: "حي المدارس", 
    addressDetails: "عمارة المعلمين - الطابق الأول",
    notes: "مدرس متقاعد - تم تسجيله عبر اتصال هاتفي مع الإدارة", 
    registeredBy: "المدير العام", 
    registeredAt: "2025-02-12", 
    totalOrdersCount: 0, 
    totalSpent: 0 
  },
  { 
    id: "cust_4", 
    name: "ميساء العمر", 
    phone: "0994778811", 
    username: "maysa_omar",
    password: "pass_maysa_123",
    pin: "7788",
    addressLandmark: "طريق السهل", 
    addressDetails: "فيلا الورد قرب الصيدلية",
    notes: "زبونة دائمة - تطلب أسبوعياً من السوبرماركت", 
    registeredBy: "المدير العام", 
    registeredAt: "2025-02-18", 
    totalOrdersCount: 0, 
    totalSpent: 0 
  }
];

export const initialStaff: StaffMember[] = [
  { 
    id: "staff_1", 
    name: "المدير العام (أبو أحمد)", 
    role: "manager", 
    username: "admin_general", 
    password: "Admin@Tawseel2026#", 
    pin: "1234", 
    phone: "0991234567", 
    permissions: ["stats", "archive_reports", "vault", "customers", "orders", "stores", "products", "coupons", "drivers", "driver_services", "landmarks", "craftsmen", "doctors", "staff", "logs", "settings", "share", "platform_features"],
    notes: "المدير العام للمنصة - صلاحيات تحكم مركزية كاملة",
    isActive: true, 
    createdAt: "2025-01-01" 
  },
  { 
    id: "staff_om_milad", 
    name: "أم ميلاد (مسؤولة الطلبات والكباتن)", 
    role: "orders_clerk", 
    username: "om_milad", 
    password: "Pass_Milad2026@", 
    pin: "1234", 
    phone: "0955123456", 
    permissions: ["orders", "drivers", "customers", "landmarks", "archive_reports"],
    notes: "مسؤولة عن الطلبات والكباتن وتوجيه ومتابعة عمليات التوصيل الميدانية",
    isActive: true, 
    createdAt: "2025-02-20" 
  },
  { 
    id: "staff_2", 
    name: "أحمد علي (مسؤول الطلبات)", 
    role: "orders_clerk", 
    username: "orders_ahmed", 
    password: "orders_pass_5555", 
    pin: "5555", 
    phone: "0992345678", 
    permissions: ["orders", "drivers", "customers", "landmarks", "archive_reports"],
    notes: "متابعة الطلبات المباشرة وتوجيه الكباتن وحل استفسارات الزبائن",
    isActive: true, 
    createdAt: "2025-01-10" 
  },
  { 
    id: "staff_3", 
    name: "سامر كمال (المحاسب المالي)", 
    role: "accountant", 
    username: "accountant_samer", 
    password: "finance_pass_7777", 
    pin: "7777", 
    phone: "0993456789", 
    permissions: ["stats", "archive_reports", "logs", "customers"],
    notes: "إدارة الحسابات والتقارير المالية ومستحقات المتاجر وأجور الكباتن",
    isActive: true, 
    createdAt: "2025-01-15" 
  },
  { 
    id: "staff_4", 
    name: "مروان يوسف (خدمة العملاء والدعم الفني)", 
    role: "support", 
    username: "support_marwan", 
    password: "support_pass_9999", 
    pin: "9999", 
    phone: "0951854257", 
    permissions: ["customers", "orders", "craftsmen", "landmarks"],
    notes: "خدمة العملاء والدعم الفني - استقبال اتصالات واستفسارات الزبائن وحل المشكلات",
    isActive: true, 
    createdAt: "2025-02-01" 
  }
];

export const initialDrivers: DriverMember[] = [
  { id: "driver_hamza", name: "الكابتن حمزة عوير", username: "capt_hamza", password: "driver_pass_1111", phone: "0951854257", pin: "1111", status: "available", totalDeliveries: 0, earnings: 0, rating: 5.0, vehicle: "دراجة نارية سوزوكي", createdAt: "2025-02-15" },
  { id: "driver_1", name: "الكابتن أبو محمود", username: "capt_mahmoud", password: "driver_pass_1111", phone: "0991112233", pin: "1111", status: "available", totalDeliveries: 0, earnings: 0, rating: 5.0, vehicle: "دراجة نارية سوزوكي", createdAt: "2025-01-10" },
  { id: "driver_2", name: "الكابتن طارق السريع", username: "capt_tarek", password: "driver_pass_2222", phone: "0992223344", pin: "2222", status: "available", totalDeliveries: 0, earnings: 0, rating: 5.0, vehicle: "سكوتر كهربائي", createdAt: "2025-01-20" },
  { id: "driver_3", name: "الكابتن وسيم الورد", username: "capt_waseem", password: "driver_pass_3333", phone: "0993334455", pin: "3333", status: "available", totalDeliveries: 0, earnings: 0, rating: 5.0, vehicle: "دراجة نارية هوائية", createdAt: "2025-02-05" }
];

export const initialCraftsmen: Craftsman[] = [
  { id: "craft_1", name: "المعلم أبو خالد السباك", craft: "سباك وتمديدات صحية", phone: "0994112233", neighborhood: "الحارة الشرقية", description: "صيانة وتمديد شبكات المياه والمضخات وفلاتر المياه على مدار الساعة", availability: "available", rating: 4.9 },
  { id: "craft_2", name: "الأستاذ فادي الكهربائي", craft: "كهربائي وطاقة شمسية", phone: "0995223344", neighborhood: "قرب الجامع الكبير", description: "تمديدات منزلية، صيانة إنفرتر وبطاريات طاقة شمسية، تصليح غسالات وبرادات", availability: "available", rating: 4.9 },
  { id: "craft_3", name: "المعلم هيثم النجار", craft: "نجارة وموبيليا وألمنيوم", phone: "0996334455", neighborhood: "شارع البلدية", description: "تفصيل وتصليح غرف نوم، مطابخ ألمنيوم، شبابيك وأبواب خشبية", availability: "available", rating: 4.8 },
  { id: "craft_4", name: "الحداد أبو سمير", craft: "حدادة وأبواب فولاذية", phone: "0997445566", neighborhood: "طريق السهل", description: "أبواب حماية، حمايات نوافذ، تصليح خزانات حديد وشناكل زراعية", availability: "available", rating: 4.7 },
  { id: "craft_5", name: "المعلم نادر الدهان", craft: "دهان وديكورات داخلية", phone: "0998556677", neighborhood: "الحارة الغربية", description: "دهان منازل وفلل، معجون وديكورات جبس بورد، معالجة الرطوبة والنش", availability: "available", rating: 4.9 },
  { id: "craft_6", name: "الأسطى رضوان الميكانيكي", craft: "ميكانيك سيارات ودراجات", phone: "0999667788", neighborhood: "المدخل الغربي", description: "صيانة كهرباء وميكانيك الدراجات النارية والسيارات والشاحنات الخفيفة", availability: "available", rating: 4.8 }
];

export const initialDoctors: Doctor[] = [
  {
    id: "doc_1",
    name: "د. سمير كنعان",
    specialty: "طب أطفال وحديثي ولادة",
    phone: "0933445566",
    clinicAddress: "مجمع الياسمين الطبي - الطابق الثاني",
    workingHours: "4:00 عصراً - 8:30 مساءً",
    notes: "معاينة الأطفال، لقاحات ومتابعة نمو، استشارات هاتفية طارئة"
  },
  {
    id: "doc_2",
    name: "د. ميساء العلي",
    specialty: "طب وجراحة الأسنان",
    phone: "0944112233",
    clinicAddress: "شارع البلدية - جانب الصيدلية المركزية",
    workingHours: "10:00 صباحاً - 3:00 عصراً",
    notes: "معالجة وجراحة الأسنان، تبييض وزراعة، تركيبات تجميلية"
  },
  {
    id: "doc_3",
    name: "د. خالد المحمود",
    specialty: "أمراض باطنية وقلبية",
    phone: "0955223344",
    clinicAddress: "ساحة البلدة العامة - برج الشفاء",
    workingHours: "5:00 مساءً - 9:00 مساءً",
    notes: "تخطيط قلب، متابعة الضغط والسكري، استشارات باطنية عامة"
  },
  {
    id: "doc_4",
    name: "د. ريم درويش",
    specialty: "أمراض نسائية وتوليد",
    phone: "0966334455",
    clinicAddress: "طريق المدارس - البناء الطبي الحديث",
    workingHours: "11:00 صباحاً - 4:00 عصراً",
    notes: "متابعة حمل وإيكو، رعاية الأمومة، تشخيص واستشارات نسائية"
  },
  {
    id: "doc_5",
    name: "د. طارق الجاسم",
    specialty: "جراحة عظمية ومفاصل",
    phone: "0988776655",
    clinicAddress: "قرب دوار الساعة - عمارة السلام",
    workingHours: "4:30 عصراً - 8:00 مساءً",
    notes: "علاج الكسور، آلام المفاصل والفقرات، تنظير وجراحة عظام"
  }
];

export const initialDriverServices: DriverService[] = [
  {
    id: "drv_srv_1",
    name: "الكابتن حمزة عوير - تكسي القرية",
    vehicle: "تكسي أجرة سياحي وسرفيس خاص",
    phone: "0966778899",
    serviceArea: "داخل البلدة، ريف دمشق، ولكافة المحافظات",
    workingHours: "متاح على مدار 24 ساعة",
    notes: "سيارة حديثة ومكيفة، رحلات عائلية، مشاوير مطار ومحافظات، التزام بالمواعيد",
    availability: "available",
    rating: 5.0
  },
  {
    id: "drv_srv_2",
    name: "أبو عبدو لنقل البضائع والأثاث",
    vehicle: "سوزوكي نقل حمولة وبضائع",
    phone: "0955112233",
    serviceArea: "نقل أثاث وبضائع وخضار بين القرى والأسواق المركزية",
    workingHours: "من 6:00 صباحاً حتى 9:00 مساءً",
    notes: "صندوق واسع وشادر حماية، حمولة حتى 1.5 طن، أسعار مناسبة وخدمة سريعة",
    availability: "available",
    rating: 4.8
  },
  {
    id: "drv_srv_3",
    name: "الكابتن وائل - مشاوير خاصة",
    vehicle: "سيارة سياحية خاصة حديثة",
    phone: "0944889900",
    serviceArea: "مشاوير طبية عاجلة، نقل جامعات، ودمشق",
    workingHours: "متاح 24 ساعة للطلبات والحالات الإسعافية",
    notes: "تكييف ممتاز، رحلات هادئة وآمنة، تلبية فورية للنداءات المستعجلة",
    availability: "available",
    rating: 4.9
  }
];

export const initialCoupons: Coupon[] = [
  { code: "RAMADAN2025", discountPercent: 15, maxDiscount: 25000, minOrder: 50000, isActive: true },
  { code: "VILLAGE10", discountPercent: 10, maxDiscount: 15000, minOrder: 30000, isActive: true },
  { code: "WELCOME", discountPercent: 20, maxDiscount: 30000, minOrder: 40000, isActive: true }
];

export const initialAppSettings: AppSettings = {
  appName: "توصيل القرية الذكي",
  contactPhone: "0951854257",
  supportName: "خدمة العملاء والدعم الفني لمنصة توصيل",
  currency: "ل.س",
  baseDeliveryFee: 5000,
  minOrderValue: 10000,
  activeRegions: ["وسط البلد", "الحارة الشرقية", "الحارة الغربية", "حي المدارس", "طريق السهل", "منطقة المزارع"],
  adminPassword: "Admin@Tawseel2026#",
  adminPin: "1234"
};

export const initialOrders: Order[] = [
  {
    id: "tw-98124",
    storeId: "1",
    storeName: "شاورما وبطاطا الضيعة",
    status: "picked_up",
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    customerName: "الحاج أبو عدنان (أحمد الخالد)",
    customerPhone: "0991447788",
    addressLandmark: "قرب الجامع الكبير",
    addressDetails: "المنزل الثاني خلف مئذنة الجامع",
    driverId: "driver_1",
    driverName: "الكابتن أبو محمود",
    driverPhone: "0991112233",
    driverVehicle: "دراجة نارية سوزوكي",
    assignedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    subtotal: 35000,
    deliveryFee: 5000,
    total: 40000,
    stockDeducted: true,
    items: [
      {
        product: {
          id: "p1",
          name: "وجبة شاورما عربي دبل",
          price: 25000,
          description: "شاورما لحم عربي مع بطاطا ومخلل وثومية",
          image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=500&auto=format&fit=crop&q=60",
          category: "food",
          storeId: "1"
        },
        quantity: 1,
        totalItemPrice: 25000
      },
      {
        product: {
          id: "p2",
          name: "صحن بطاطا مقلية عائلي",
          price: 10000,
          description: "بطاطا مقرمشة طازجة مع بهارات مميزة",
          image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60",
          category: "food",
          storeId: "1"
        },
        quantity: 1,
        totalItemPrice: 10000
      }
    ]
  },
  {
    id: "tw-98125",
    storeId: "2",
    storeName: "سوبرماركت الأمانة",
    status: "pending",
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    customerName: "أم بشار النجار",
    customerPhone: "0992558899",
    addressLandmark: "الحارة الشرقية",
    addressDetails: "بجانب معصرة الزيتون القديمة",
    subtotal: 48000,
    deliveryFee: 5000,
    total: 53000,
    stockDeducted: true,
    items: [
      {
        product: {
          id: "p3",
          name: "زيت زيتون بلدي بكر (1 لتر)",
          price: 40000,
          description: "عصرة أولى معصور على البارد",
          image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60",
          category: "supermarkets",
          storeId: "2"
        },
        quantity: 1,
        totalItemPrice: 40000
      },
      {
        product: {
          id: "p4",
          name: "سكر أبيض ناعم (1 كغ)",
          price: 8000,
          description: "سكر نقي ممتاز للحلويات والشاي",
          image: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=500&auto=format&fit=crop&q=60",
          category: "supermarkets",
          storeId: "2"
        },
        quantity: 1,
        totalItemPrice: 8000
      }
    ]
  }
];
