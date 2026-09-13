export interface StoreSize {
  name: string;
  price: number;
}

export interface StoreAddition {
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  unit?: string;
  stock?: number;
  soldCount?: number;
  description: string;
  image: string;
  category: string;
  storeId: string;
  storeName?: string;
  isOffer?: boolean;
  originalPrice?: number;
  offerLabel?: string;
  sizes?: StoreSize[];
  additions?: StoreAddition[];
  isHidden?: boolean;
  isAvailable?: boolean;
  inStock?: boolean;
  isApproved?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface Store {
  id: string;
  name: string;
  category: string;
  image: string;
  rating: number;
  ratingCount?: number;
  deliveryTime: string;
  deliveryFee: number;
  locationNode: string;
  featuredProduct?: string;
  contactPhone?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerUsername?: string;
  ownerPassword?: string;
  ownerPin?: string;
  isApproved?: boolean;
  status?: "open" | "closed";
  description?: string;
  workingHours?: string;
  priority?: number;
  maxRegularProducts?: number;
  maxOfferProducts?: number;
  isService?: boolean;
  neighborhood?: string;
  tickerAnnouncement?: string; // رسالة الشريط الإخباري (مثل: ترقبوا العروض يوم كذا، أو ترقبوا العرض الكبير يوم الخميس)
  isHidden?: boolean;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  isHidden?: boolean;
}

export interface MapNode {
  id: string;
  name: string;
  x: number;
  y: number;
  type: "intersection" | "store" | "landmark";
  arabicName: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: StoreSize;
  selectedAdditions?: StoreAddition[];
  totalItemPrice: number;
}

export interface UserProfile {
  name: string;
  phone: string;
  pin: string;
  storeId?: string;
  staffId?: string;
  role?: string;
  permissions?: StaffPermission[];
}

export interface RegisteredCustomer {
  id: string;
  name: string;
  phone: string;
  username?: string;
  password?: string;
  pin?: string;
  addressLandmark?: string;
  addressDetails?: string;
  notes?: string;
  registeredBy?: string; // e.g. "المدير العام"
  registeredAt: string;
  totalOrdersCount?: number;
  totalSpent?: number;
}

export interface Message {
  id: string;
  sender: "customer" | "driver" | "store" | "system";
  text?: string;
  audioUrl?: string;
  audioDuration?: number;
  imageUrl?: string;
  timestamp: string;
}

export interface Order {
  id: string;
  storeId: string;
  storeName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  couponCode?: string;
  total: number;
  status: "pending" | "accepted" | "preparing" | "picked_up" | "delivered" | "cancelled";
  createdAt: string;
  customerName: string;
  customerPhone: string;
  addressLandmark: string;
  addressDetails?: string;
  notes?: string;
  paymentMethod?: "cash" | "electronic";
  customOrderText?: string;
  customOrderImage?: string;
  estimatedBudget?: number;
  isCustomStoreOrder?: boolean;
  prescriptionImage?: string;
  prescriptionNotes?: string;
  isServiceOrder?: boolean;
  serviceType?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverVehicle?: string;
  assignedAt?: string;
  stockDeducted?: boolean;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  maxDiscount?: number;
  minOrder?: number;
  isActive: boolean;
}

export type StaffRole = "manager" | "orders_clerk" | "accountant" | "support" | "products_specialist" | "custom";

export type StaffPermission =
  | "stats"
  | "archive_reports"
  | "vault"
  | "customers"
  | "orders"
  | "stores"
  | "products"
  | "coupons"
  | "drivers"
  | "landmarks"
  | "craftsmen"
  | "staff"
  | "logs"
  | "settings"
  | "share"
  | "platform_features";

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  pin: string;
  phone?: string;
  username?: string;
  password?: string;
  permissions?: StaffPermission[];
  isActive?: boolean;
  createdAt?: string;
  notes?: string;
}

export interface DriverMember {
  id: string;
  name: string;
  phone: string;
  username?: string;
  password?: string;
  pin?: string;
  status: "available" | "busy" | "offline";
  totalDeliveries?: number;
  earnings?: number;
  rating?: number;
  vehicle?: string;
  notes?: string;
  createdAt?: string;
  isHidden?: boolean;
}

export interface Craftsman {
  id: string;
  name: string;
  craft: string;
  phone: string;
  neighborhood: string;
  description?: string;
  availability?: "available" | "busy" | "offline";
  rating?: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
}

export interface AppSettings {
  appName: string;
  logoUrl?: string;
  customAppIcon?: string;
  contactPhone: string;
  currency: string;
  baseDeliveryFee: number;
  minOrderValue: number;
  activeRegions: string[];
  adminPassword?: string;
  adminPin?: string;
  officialAppUrl?: string;
}

export type BroadcastType = "discount" | "update" | "alert" | "timing" | "system";
export type BroadcastPriority = "normal" | "important" | "urgent";

export interface StoreBroadcast {
  id: string;
  title: string;
  message: string;
  type: BroadcastType;
  priority: BroadcastPriority;
  targetType: "all" | "category" | "specific";
  targetIds?: string[]; // category ids or store ids
  senderName?: string;
  createdAt: string;
  expiresAt?: string;
  readBy?: string[]; // Array of store IDs that opened/read this broadcast
  actionDiscountCode?: string;
  actionUrl?: string;
}

export interface StoreReview {
  id: string;
  storeId: string;
  storeName?: string;
  orderId: string;
  customerName: string;
  customerPhone?: string;
  rating: number; // 1 to 5
  comment: string;
  tags?: string[];
  createdAt: string;
  reply?: string;
  replyAt?: string;
}


