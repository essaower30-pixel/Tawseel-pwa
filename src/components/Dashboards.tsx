import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  AppSettings, 
  AuditLog, 
  Category, 
  Coupon, 
  Craftsman, 
  DriverMember, 
  MapNode, 
  Order, 
  Product, 
  RegisteredCustomer,
  StaffMember, 
  Store, 
  UserProfile,
  StoreBroadcast 
} from "../types";
import { 
  initialStaff, 
  initialDrivers, 
  initialCraftsmen, 
  initialCoupons, 
  initialAppSettings,
  initialCustomers 
} from "../data/adminInitialData";
import { AdminHeader, AdminTab } from "./admin/AdminHeader";
import { StatsTab } from "./admin/StatsTab";
import { StoresTab } from "./admin/StoresTab";
import { ProductsTab } from "./admin/ProductsTab";
import { StaffTab } from "./admin/StaffTab";
import { DriversTab } from "./admin/DriversTab";
import { CraftsmenTab } from "./admin/CraftsmenTab";
import { LandmarksTab } from "./admin/LandmarksTab";
import { CouponsTab } from "./admin/CouponsTab";
import { OrdersTab } from "./admin/OrdersTab";
import { SettingsTab } from "./admin/SettingsTab";
import { CredentialsVaultTab } from "./admin/CredentialsVaultTab";
import { OrdersArchiveReportsTab } from "./admin/OrdersArchiveReportsTab";
import { PlatformFeaturesTab } from "./admin/PlatformFeaturesTab";
import { BottomNavigation } from "./BottomNavigation";
import { AccountSettingsModal } from "./AccountSettingsModal";

interface DashboardProps {
  userRole: "admin" | "store_owner" | "driver";
  userProfile: UserProfile;
  stores: Store[];
  products: Product[];
  orders: Order[];
  categories?: Category[];
  mapNodes?: MapNode[];
  broadcasts?: StoreBroadcast[];
  onAddStore: (store: Store) => void;
  onUpdateStore: (store: Store) => void;
  onDeleteStore: (storeId: string) => void;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: any) => void;
  onAssignDriver?: (orderId: string, driver: DriverMember | null) => void;
  onLogout: () => void;
  onAddCategory?: (category: Category) => void;
  onUpdateCategory?: (category: Category) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onReorderCategories?: (categories: Category[]) => void;
  onAddMapNode?: (node: MapNode) => void;
  onUpdateMapNode?: (node: MapNode) => void;
  onDeleteMapNode?: (nodeId: string) => void;
  onSendBroadcast?: (broadcast: StoreBroadcast) => void;
  onDeleteBroadcast?: (id: string) => void;
  onResendBroadcast?: (broadcast: StoreBroadcast) => void;
  onCleanSlateData?: (options: { target: "all" | "orders_only" | "restore_defaults" }) => Promise<void> | void;
  driversList?: DriverMember[];
  onAddDriver?: (driver: DriverMember) => void;
  onUpdateDriver?: (driver: DriverMember) => void;
  onDeleteDriver?: (driverId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  userRole,
  userProfile,
  stores,
  products,
  orders,
  categories = [],
  mapNodes = [],
  broadcasts = [],
  onAddStore,
  onUpdateStore,
  onDeleteStore,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onAssignDriver,
  onLogout,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategories,
  onAddMapNode,
  onUpdateMapNode,
  onDeleteMapNode,
  onSendBroadcast = () => {},
  onDeleteBroadcast = () => {},
  onResendBroadcast = () => {},
  onCleanSlateData,
  driversList: propDriversList,
  onAddDriver: propOnAddDriver,
  onUpdateDriver: propOnUpdateDriver,
  onDeleteDriver: propOnDeleteDriver
}) => {
  // Persistent Emergency Rush Mode
  const [isEmergencyRush, setIsEmergencyRush] = useState<boolean>(() => {
    return localStorage.getItem("tw_emergency_rush") === "true";
  });

  const handleToggleEmergencyRush = () => {
    const nextVal = !isEmergencyRush;
    setIsEmergencyRush(nextVal);
    localStorage.setItem("tw_emergency_rush", nextVal.toString());
  };

  // Staff Members State
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem("tw_staff_members");
      return saved ? JSON.parse(saved) : initialStaff;
    } catch {
      return initialStaff;
    }
  });

  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(() => {
    const activeStaffId = localStorage.getItem("tw_active_staff_id") || userProfile?.staffId;
    if (activeStaffId) {
      const found = staffList.find(s => s.id === activeStaffId);
      if (found) return found;
    }
    if (userProfile?.name) {
      const foundByName = staffList.find(s => s.name === userProfile.name || s.pin === userProfile.pin);
      if (foundByName) return foundByName;
    }
    return staffList.find(s => s.role === "manager") || staffList[0] || null;
  });

  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    const activeStaffId = localStorage.getItem("tw_active_staff_id") || userProfile?.staffId;
    let st: StaffMember | undefined;
    if (activeStaffId) {
      st = staffList.find(s => s.id === activeStaffId);
    }
    if (!st && userProfile?.name) {
      st = staffList.find(s => s.name === userProfile.name || s.pin === userProfile.pin);
    }
    if (st && st.role !== "manager" && st.permissions && st.permissions.length > 0) {
      return (st.permissions[0] as AdminTab) || "orders";
    }
    if (st?.role === "orders_clerk") return "orders";
    if (st?.role === "accountant") return "archive_reports";
    if (st?.role === "support") return "customers";
    return "stats";
  });

  // Keep currentStaff in sync if userProfile changes
  useEffect(() => {
    const activeStaffId = localStorage.getItem("tw_active_staff_id") || userProfile?.staffId;
    if (activeStaffId) {
      const found = staffList.find(s => s.id === activeStaffId);
      if (found && found.id !== currentStaff?.id) {
        setCurrentStaff(found);
      }
    }
  }, [userProfile, staffList]);

  // Handler when staff switches in header
  const handleSelectStaff = (st: StaffMember) => {
    setCurrentStaff(st);
    localStorage.setItem("tw_active_staff_id", st.id);
    localStorage.setItem("tw_staff_role", st.role);
    if (st.role !== "manager" && st.permissions && st.permissions.length > 0) {
      if (!st.permissions.includes(activeTab as any)) {
        setActiveTab((st.permissions[0] as AdminTab) || "orders");
      }
    }
  };

  const handleAddStaff = (staff: StaffMember) => {
    const next = [...staffList, staff];
    setStaffList(next);
    localStorage.setItem("tw_staff_members", JSON.stringify(next));
  };

  const handleUpdateStaff = (staff: StaffMember) => {
    const next = staffList.map(s => s.id === staff.id ? staff : s);
    setStaffList(next);
    localStorage.setItem("tw_staff_members", JSON.stringify(next));
  };

  const handleDeleteStaff = (staffId: string) => {
    const next = staffList.filter(s => s.id !== staffId);
    setStaffList(next);
    localStorage.setItem("tw_staff_members", JSON.stringify(next));
  };

  // Drivers Fleet State (Synchronized with App root and local cache)
  const [localDriversList, setLocalDriversList] = useState<DriverMember[]>(() => {
    try {
      const saved = localStorage.getItem("tw_drivers_list") || localStorage.getItem("tw_drivers");
      return saved ? JSON.parse(saved) : initialDrivers;
    } catch {
      return initialDrivers;
    }
  });

  const driversList = propDriversList && propDriversList.length > 0 ? propDriversList : localDriversList;

  useEffect(() => {
    if (propDriversList && propDriversList.length > 0) {
      setLocalDriversList(propDriversList);
    }
  }, [propDriversList]);

  const handleAddDriver = (driver: DriverMember) => {
    const next = [...driversList.filter((d) => d.id !== driver.id), driver];
    setLocalDriversList(next);
    try {
      localStorage.setItem("tw_drivers", JSON.stringify(next));
      localStorage.setItem("tw_drivers_list", JSON.stringify(next));
    } catch {}
    if (propOnAddDriver) {
      propOnAddDriver(driver);
    }
  };

  const handleUpdateDriver = (driver: DriverMember) => {
    const next = driversList.map((d) => (d.id === driver.id ? driver : d));
    setLocalDriversList(next);
    try {
      localStorage.setItem("tw_drivers", JSON.stringify(next));
      localStorage.setItem("tw_drivers_list", JSON.stringify(next));
    } catch {}
    if (propOnUpdateDriver) {
      propOnUpdateDriver(driver);
    }
  };

  const handleDeleteDriver = (driverId: string) => {
    const next = driversList.filter((d) => d.id !== driverId);
    setLocalDriversList(next);
    try {
      localStorage.setItem("tw_drivers", JSON.stringify(next));
      localStorage.setItem("tw_drivers_list", JSON.stringify(next));
    } catch {}
    if (propOnDeleteDriver) {
      propOnDeleteDriver(driverId);
    }
  };

  // Craftsmen State
  const [craftsmenList, setCraftsmenList] = useState<Craftsman[]>(() => {
    try {
      const saved = localStorage.getItem("tw_craftsmen");
      return saved ? JSON.parse(saved) : initialCraftsmen;
    } catch {
      return initialCraftsmen;
    }
  });

  const handleAddCraftsman = (craftsman: Craftsman) => {
    const next = [...craftsmenList, craftsman];
    setCraftsmenList(next);
    localStorage.setItem("tw_craftsmen", JSON.stringify(next));
  };

  const handleUpdateCraftsman = (craftsman: Craftsman) => {
    const next = craftsmenList.map(c => c.id === craftsman.id ? craftsman : c);
    setCraftsmenList(next);
    localStorage.setItem("tw_craftsmen", JSON.stringify(next));
  };

  const handleDeleteCraftsman = (id: string) => {
    const next = craftsmenList.filter(c => c.id !== id);
    setCraftsmenList(next);
    localStorage.setItem("tw_craftsmen", JSON.stringify(next));
  };

  // Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const saved = localStorage.getItem("tw_coupons");
      return saved ? JSON.parse(saved) : initialCoupons;
    } catch {
      return initialCoupons;
    }
  });

  const handleAddCoupon = (coupon: Coupon) => {
    const next = [...coupons, coupon];
    setCoupons(next);
    localStorage.setItem("tw_coupons", JSON.stringify(next));
  };

  const handleUpdateCoupon = (coupon: Coupon) => {
    const next = coupons.map(c => c.code === coupon.code ? coupon : c);
    setCoupons(next);
    localStorage.setItem("tw_coupons", JSON.stringify(next));
  };

  const handleDeleteCoupon = (code: string) => {
    const next = coupons.filter(c => c.code !== code);
    setCoupons(next);
    localStorage.setItem("tw_coupons", JSON.stringify(next));
  };

  // App Settings State
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem("tw_app_settings");
      return saved ? JSON.parse(saved) : initialAppSettings;
    } catch {
      return initialAppSettings;
    }
  });

  const handleUpdateAppSettings = (settings: AppSettings) => {
    setAppSettings(settings);
    localStorage.setItem("tw_app_settings", JSON.stringify(settings));
  };

  // Registered Customers State (Manual registration by admin + customers)
  const [registeredCustomers, setRegisteredCustomers] = useState<RegisteredCustomer[]>(() => {
    try {
      const saved = localStorage.getItem("tw_registered_customers");
      return saved ? JSON.parse(saved) : initialCustomers;
    } catch {
      return initialCustomers;
    }
  });

  const handleAddCustomer = (customer: RegisteredCustomer) => {
    const next = [customer, ...registeredCustomers];
    setRegisteredCustomers(next);
    localStorage.setItem("tw_registered_customers", JSON.stringify(next));
  };

  const handleUpdateCustomer = (customer: RegisteredCustomer) => {
    const next = registeredCustomers.map(c => c.id === customer.id ? customer : c);
    setRegisteredCustomers(next);
    localStorage.setItem("tw_registered_customers", JSON.stringify(next));
  };

  const handleDeleteCustomer = (customerId: string) => {
    const next = registeredCustomers.filter(c => c.id !== customerId);
    setRegisteredCustomers(next);
    localStorage.setItem("tw_registered_customers", JSON.stringify(next));
  };

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem("tw_audit_logs");
      return saved ? JSON.parse(saved) : [
        {
          id: "log_1",
          timestamp: new Date().toISOString(),
          user: "المدير العام",
          role: "manager",
          action: "تسجيل الدخول للنظام",
          details: "تم فتح لوحة التحكم المركزية للإدارة"
        }
      ];
    } catch {
      return [];
    }
  });

  const [showAccountModal, setShowAccountModal] = useState(false);

  // Close internal modal on mobile back button tap without leaving admin dashboard
  useEffect(() => {
    const handleBack = (e: Event) => {
      if (showAccountModal) {
        setShowAccountModal(false);
        e.preventDefault();
      }
    };
    window.addEventListener("tw_back_button_pressed", handleBack);
    return () => window.removeEventListener("tw_back_button_pressed", handleBack);
  }, [showAccountModal]);

  const handleProfileUpdate = async (updatedProfile: UserProfile, extraData?: any) => {
    if (currentStaff?.role === "manager" || userRole === "admin") {
      const updatedSettings: AppSettings = {
        ...appSettings,
        adminPassword: updatedProfile.pin,
        adminPin: updatedProfile.pin,
        contactPhone: updatedProfile.phone || appSettings.contactPhone
      };
      handleUpdateAppSettings(updatedSettings);
      localStorage.setItem("tw_admin_password", updatedProfile.pin);
      localStorage.setItem("tw_admin_pin", updatedProfile.pin);
    }
    if (currentStaff) {
      const updatedSt: StaffMember = {
        ...currentStaff,
        name: updatedProfile.name,
        phone: updatedProfile.phone,
        pin: updatedProfile.pin
      };
      handleUpdateStaff(updatedSt);
    }
    localStorage.setItem("tw_user_profile", JSON.stringify(updatedProfile));
    localStorage.setItem("tw_customer_user", JSON.stringify(updatedProfile));
  };

  // Registered customers count
  const registeredCount = Math.max(orders.length + registeredCustomers.length, registeredCustomers.length);

  // Count of pending store applications waiting for admin approval
  const pendingStoresCount = stores.filter(s => s.isApproved === false).length;

  // Count of pending product additions from merchants waiting for admin approval
  const pendingProductsCount = products.filter(
    (p) => p.isApproved === false || p.approvalStatus === "pending"
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 pb-28">
      {/* Header & Tabs Navigation */}
      <AdminHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isEmergencyRush={isEmergencyRush}
        onToggleEmergencyRush={handleToggleEmergencyRush}
        staffList={staffList}
        currentStaff={currentStaff}
        onSelectStaff={handleSelectStaff}
        onLogout={onLogout}
        onOpenAccount={() => setShowAccountModal(true)}
        pendingStoresCount={pendingStoresCount}
        pendingProductsCount={pendingProductsCount}
      />

      {/* Main Tab Content */}
      <main className="transition-all duration-300 relative min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {activeTab === "platform_features" && (
              <PlatformFeaturesTab
                appSettings={appSettings}
                currency={appSettings.currency || "ل.س"}
              />
            )}

            {activeTab === "stats" && (
              <StatsTab
                stores={stores}
                products={products}
                orders={orders}
                staffList={staffList}
                driversList={driversList}
                craftsmenList={craftsmenList}
                registeredCustomersCount={registeredCount}
                onNavigateToTab={setActiveTab}
                currency={appSettings.currency || "ل.س"}
                categories={categories}
              />
            )}

            {activeTab === "archive_reports" && (
              <OrdersArchiveReportsTab
                orders={orders}
                stores={stores}
                drivers={driversList}
                currency={appSettings.currency || "ل.س"}
              />
            )}

            {activeTab === "vault" && (
              <CredentialsVaultTab
                customers={registeredCustomers}
                stores={stores}
                drivers={driversList}
                staff={staffList}
                onUpdateCustomer={handleUpdateCustomer}
                onAddCustomer={handleAddCustomer}
                onUpdateStore={onUpdateStore}
                onUpdateDriver={handleUpdateDriver}
                onUpdateStaff={handleUpdateStaff}
              />
            )}

            {activeTab === "stores" && (
              <StoresTab
                stores={stores}
                categories={categories}
                products={products}
                broadcasts={broadcasts}
                onAddStore={onAddStore}
                onUpdateStore={onUpdateStore}
                onDeleteStore={onDeleteStore}
                onAddCategory={onAddCategory || (() => {})}
                onUpdateCategory={onUpdateCategory}
                onDeleteCategory={onDeleteCategory || (() => {})}
                onReorderCategories={onReorderCategories || (() => {})}
                onSendBroadcast={onSendBroadcast}
                onDeleteBroadcast={onDeleteBroadcast}
                onResendBroadcast={onResendBroadcast}
                currency={appSettings.currency || "ل.س"}
              />
            )}

            {activeTab === "products" && (
              <ProductsTab
                products={products}
                stores={stores}
                categories={categories}
                onAddProduct={onAddProduct}
                onUpdateProduct={onUpdateProduct}
                onDeleteProduct={onDeleteProduct}
                currency={appSettings.currency || "ل.س"}
              />
            )}

            {activeTab === "orders" && (
              <OrdersTab
                orders={orders}
                driversList={driversList}
                onUpdateOrderStatus={onUpdateOrderStatus}
                onAssignDriver={onAssignDriver}
                currency={appSettings.currency || "ل.س"}
              />
            )}

            {activeTab === "staff" && (
              <StaffTab
                staffList={staffList}
                onAddStaff={handleAddStaff}
                onUpdateStaff={handleUpdateStaff}
                onDeleteStaff={handleDeleteStaff}
              />
            )}

            {activeTab === "drivers" && (
              <DriversTab
                driversList={driversList}
                onAddDriver={handleAddDriver}
                onUpdateDriver={handleUpdateDriver}
                onDeleteDriver={handleDeleteDriver}
                currency={appSettings.currency || "ل.س"}
              />
            )}

            {activeTab === "craftsmen" && (
              <CraftsmenTab
                craftsmenList={craftsmenList}
                onAddCraftsman={handleAddCraftsman}
                onUpdateCraftsman={handleUpdateCraftsman}
                onDeleteCraftsman={handleDeleteCraftsman}
              />
            )}

            {activeTab === "landmarks" && (
              <LandmarksTab
                mapNodes={mapNodes}
                onAddMapNode={onAddMapNode || (() => {})}
                onUpdateMapNode={onUpdateMapNode}
                onDeleteMapNode={onDeleteMapNode || (() => {})}
              />
            )}

            {activeTab === "coupons" && (
              <CouponsTab
                coupons={coupons}
                onAddCoupon={handleAddCoupon}
                onUpdateCoupon={handleUpdateCoupon}
                onDeleteCoupon={handleDeleteCoupon}
                currency={appSettings.currency || "ل.س"}
              />
            )}

            {(activeTab === "customers" || activeTab === "logs" || activeTab === "settings" || activeTab === "share") && (
              <SettingsTab
                currentSubView={activeTab}
                appSettings={appSettings}
                onUpdateAppSettings={handleUpdateAppSettings}
                orders={orders}
                registeredUsers={[]}
                registeredCustomers={registeredCustomers}
                onAddCustomer={handleAddCustomer}
                onUpdateCustomer={handleUpdateCustomer}
                onDeleteCustomer={handleDeleteCustomer}
                staffList={staffList}
                onUpdateStaff={handleUpdateStaff}
                auditLogs={auditLogs}
                stores={stores}
                onNavigateToTab={setActiveTab}
                onCleanSlateData={onCleanSlateData}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Universal Bottom Navigation for Admin / Staff */}
      <BottomNavigation
        userRole="admin"
        activeTab={activeTab}
        onNavigateHome={() => setActiveTab("stats")}
        onSelectRoleTab={(tab) => setActiveTab(tab as any)}
        onOpenAccount={() => setShowAccountModal(true)}
        activeOrdersCount={orders.filter(
          (o) => o.status === "pending" || o.status === "accepted" || o.status === "preparing"
        ).length}
        userName={currentStaff?.name || userProfile.name}
      />

      {/* Account Settings Modal */}
      {showAccountModal && (
        <AccountSettingsModal
          isOpen={showAccountModal}
          onClose={() => setShowAccountModal(false)}
          userRole="admin"
          userProfile={userProfile}
          currentStaff={currentStaff}
          onUpdateProfile={handleProfileUpdate}
          onLogout={onLogout}
        />
      )}
    </div>
  );
};
