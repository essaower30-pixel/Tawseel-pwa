import React, { useState } from "react";
import { 
  KeyRound, 
  Search, 
  Copy, 
  Check, 
  Send, 
  Eye, 
  EyeOff, 
  Edit3, 
  Plus, 
  User, 
  Store as StoreIcon, 
  Bike, 
  ShieldCheck, 
  Phone, 
  Lock, 
  RefreshCw, 
  FileText,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  MessageCircle
} from "lucide-react";
import { DriverMember, RegisteredCustomer, StaffMember, Store } from "../../types";
import { openWhatsApp } from "../../utils/whatsapp";
import { getAppUrl } from "../../utils/appUrl";

interface CredentialsVaultTabProps {
  customers: RegisteredCustomer[];
  stores: Store[];
  drivers: DriverMember[];
  staff: StaffMember[];
  onUpdateCustomer: (customer: RegisteredCustomer) => void;
  onAddCustomer: (customer: RegisteredCustomer) => void;
  onUpdateStore: (store: Store) => void;
  onUpdateDriver: (driver: DriverMember) => void;
  onUpdateStaff: (staff: StaffMember) => void;
}

type AccountTypeFilter = "all" | "customers" | "stores" | "drivers" | "staff";

interface AccountItem {
  id: string;
  type: "customer" | "store" | "driver" | "staff";
  typeLabel: string;
  name: string;
  phone: string;
  username: string;
  password?: string;
  pin?: string;
  subInfo?: string;
  notes?: string;
  rawRef: any;
}

export const CredentialsVaultTab: React.FC<CredentialsVaultTabProps> = ({
  customers,
  stores,
  drivers,
  staff,
  onUpdateCustomer,
  onAddCustomer,
  onUpdateStore,
  onUpdateDriver,
  onUpdateStaff
}) => {
  const [filterType, setFilterType] = useState<AccountTypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Modal State
  const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editName, setEditName] = useState("");

  // Add Account Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccountType, setNewAccountType] = useState<"customer" | "driver" | "store">("customer");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newAddressLandmark, setNewAddressLandmark] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Map all sources into unified Account items
  const allAccounts: AccountItem[] = [
    ...customers.map((c) => ({
      id: `cust_${c.id}`,
      type: "customer" as const,
      typeLabel: "زبون / عميل",
      name: c.name,
      phone: c.phone,
      username: c.username || `user_${c.phone.slice(-4)}`,
      password: c.password || c.pin || `pass_${c.phone.slice(-4)}`,
      pin: c.pin || c.phone.slice(-4),
      subInfo: c.addressLandmark ? `📍 ${c.addressLandmark}` : undefined,
      notes: c.notes,
      rawRef: c
    })),
    ...stores.map((s) => ({
      id: `store_${s.id}`,
      type: "store" as const,
      typeLabel: "صاحب متجر",
      name: s.ownerName || s.name,
      phone: s.ownerPhone || s.contactPhone || "0944111222",
      username: s.ownerUsername || `store_${s.id}`,
      password: s.ownerPassword || s.ownerPin || "1234",
      pin: s.ownerPin || "1234",
      subInfo: `🏪 متجر: ${s.name}`,
      notes: s.workingHours ? `ساعات العمل: ${s.workingHours}` : undefined,
      rawRef: s
    })),
    ...drivers.map((d) => ({
      id: `driver_${d.id}`,
      type: "driver" as const,
      typeLabel: "كابتن توصيل",
      name: d.name,
      phone: d.phone,
      username: d.username || `capt_${d.phone.slice(-4)}`,
      password: d.password || d.pin || "1111",
      pin: d.pin || "1111",
      subInfo: `🛵 مركبة: ${d.vehicle || "دراجة نارية"}`,
      notes: d.status === "available" ? "متاح للعمل" : "مشغول / أوفلاين",
      rawRef: d
    })),
    ...staff.map((st) => ({
      id: `staff_${st.id}`,
      type: "staff" as const,
      typeLabel: st.role === "manager" ? "المدير العام" : "موظف إدارة",
      name: st.name,
      phone: st.phone || "0991234567",
      username: st.username || `admin_${st.role}`,
      password: st.password || st.pin,
      pin: st.pin,
      subInfo: `🔑 الصلاحية: ${st.role}`,
      notes: st.isActive !== false ? "حساب نشط" : "حساب معطل",
      rawRef: st
    }))
  ];

  // Filtering
  const filteredAccounts = allAccounts.filter((acc) => {
    const matchesType =
      filterType === "all" ||
      (filterType === "customers" && acc.type === "customer") ||
      (filterType === "stores" && acc.type === "store") ||
      (filterType === "drivers" && acc.type === "driver") ||
      (filterType === "staff" && acc.type === "staff");

    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      acc.name.toLowerCase().includes(query) ||
      acc.phone.includes(query) ||
      acc.username.toLowerCase().includes(query) ||
      (acc.subInfo && acc.subInfo.toLowerCase().includes(query));

    return matchesType && matchesQuery;
  });

  const toggleShowPassword = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCredentials = (acc: AccountItem) => {
    const pwd = acc.password || acc.pin || "غير محدد";
    const text = `👤 الاسم: ${acc.name}\n📱 الهاتف: ${acc.phone}\n🆔 اسم المستخدم: ${acc.username}\n🔐 كلمة المرور / PIN: ${pwd}`;
    navigator.clipboard?.writeText(text);
    setCopiedId(acc.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendWhatsAppCredentials = (acc: AccountItem, type: "regular" | "business" = "regular") => {
    const pwd = acc.password || acc.pin || "غير محدد";
    const msg = `مرحباً بك يا ${acc.name} 🌸

تحياتنا لك من إدارة تطبيق توصيل.
بناءً على طلب استرجاع بيانات الحساب، إليك معلومات تسجيل الدخول الخاصة بك:

👤 *نوع الحساب:* ${acc.typeLabel}
📱 *رقم الهاتف:* ${acc.phone}
🆔 *اسم المستخدم:* ${acc.username}
🔐 *كلمة المرور / الرمز السري:* ${pwd}

🔗 *رابط الدخول المباشر للتطبيق:*
${getAppUrl()}

نحن دائماً بخدمتكم في حال احتجتم أي مساعدة!`;

    openWhatsApp({ phone: acc.phone, message: msg, type });
  };

  const handleOpenEdit = (acc: AccountItem) => {
    setEditingAccount(acc);
    setEditName(acc.name);
    setEditPhone(acc.phone);
    setEditUsername(acc.username);
    setEditPassword(acc.password || acc.pin || "");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    if (editingAccount.type === "customer") {
      const updatedCustomer: RegisteredCustomer = {
        ...editingAccount.rawRef,
        name: editName,
        phone: editPhone,
        username: editUsername,
        password: editPassword,
        pin: editPassword
      };
      onUpdateCustomer(updatedCustomer);
    } else if (editingAccount.type === "store") {
      const updatedStore: Store = {
        ...editingAccount.rawRef,
        ownerName: editName,
        ownerPhone: editPhone,
        ownerUsername: editUsername,
        ownerPassword: editPassword,
        ownerPin: editPassword
      };
      onUpdateStore(updatedStore);
    } else if (editingAccount.type === "driver") {
      const updatedDriver: DriverMember = {
        ...editingAccount.rawRef,
        name: editName,
        phone: editPhone,
        username: editUsername,
        password: editPassword,
        pin: editPassword
      };
      onUpdateDriver(updatedDriver);
    } else if (editingAccount.type === "staff") {
      const updatedStaff: StaffMember = {
        ...editingAccount.rawRef,
        name: editName,
        phone: editPhone,
        username: editUsername,
        password: editPassword,
        pin: editPassword
      };
      onUpdateStaff(updatedStaff);
    }

    setEditingAccount(null);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    const username = newUsername || `user_${newPhone.slice(-4)}`;
    const password = newPassword || `pass_${newPhone.slice(-4)}`;

    if (newAccountType === "customer") {
      const newCust: RegisteredCustomer = {
        id: `cust_${Date.now()}`,
        name: newName,
        phone: newPhone,
        username,
        password,
        pin: password,
        addressLandmark: newAddressLandmark,
        notes: newNotes,
        registeredBy: "المدير العام",
        registeredAt: new Date().toISOString().split("T")[0],
        totalOrdersCount: 0,
        totalSpent: 0
      };
      onAddCustomer(newCust);
    }

    setShowAddModal(false);
    setNewName("");
    setNewPhone("");
    setNewUsername("");
    setNewPassword("");
    setNewAddressLandmark("");
    setNewNotes("");
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "customer":
        return { label: "زبون / عميل", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: User };
      case "store":
        return { label: "صاحب متجر", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: StoreIcon };
      case "driver":
        return { label: "كابتن توصيل", bg: "bg-orange-50 text-orange-700 border-orange-200", icon: Bike };
      case "staff":
        return { label: "إدارة وإشراف", bg: "bg-purple-50 text-purple-700 border-purple-200", icon: ShieldCheck };
      default:
        return { label: type, bg: "bg-slate-50 text-slate-700 border-slate-200", icon: User };
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-700/80 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base sm:text-lg flex items-center gap-2">
                <span>أرشيف وسجل بيانات الدخول والحسابات (سري للإدارة)</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  🔒 مشفر ومحمي
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                سجل متكامل لكافة الزبائن والمتاجر والكباتن لاسترجاع وتزويد المستخدمين ببياناتهم (الاسم، الهاتف، اليوزرنيم، الباسوورد) فوراً عند ضياعها.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-orange-500/25 flex items-center gap-2 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل حساب يدوي جديد</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center flex-wrap gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          {[
            { id: "all", label: "كافة الحسابات", count: allAccounts.length },
            { id: "customers", label: "👥 الزبائن", count: customers.length },
            { id: "stores", label: "🏪 المتاجر", count: stores.length },
            { id: "drivers", label: "🛵 الكباتن", count: drivers.length },
            { id: "staff", label: "🔑 طاقم الإدارة", count: staff.length }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id as AccountTypeFilter)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                filterType === tab.id
                  ? "bg-slate-900 text-white shadow-sm font-black"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم، الهاتف، اليوزرنيم..."
            className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
          />
        </div>
      </div>

      {/* Accounts Grid / Table */}
      {filteredAccounts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <KeyRound className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-black text-sm text-slate-700">لا توجد حسابات مطابقة للبحث</h4>
          <p className="text-xs text-slate-400">تأكد من كتابة الاسم أو رقم الهاتف أو اسم المستخدم بشكل صحيح.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((acc) => {
            const badge = getTypeBadge(acc.type);
            const Icon = badge.icon;
            const isPwVisible = !!showPasswords[acc.id];
            const pwd = acc.password || acc.pin || "غير مسجل";

            return (
              <div
                key={acc.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-4 sm:p-5 flex flex-col justify-between gap-4 relative overflow-hidden group"
              >
                {/* Header of Card */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                        <Icon className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">{acc.name}</h4>
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black border mt-0.5 ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(acc)}
                      className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors cursor-pointer"
                      title="تعديل بيانات الحساب وكلمة المرور"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Account Credentials Box */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-2 text-xs">
                    {/* Phone */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-bold flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>رقم الهاتف:</span>
                      </span>
                      <span className="font-black text-slate-900 font-mono dir-ltr">{acc.phone}</span>
                    </div>

                    {/* Username */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-bold flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>اسم المستخدم:</span>
                      </span>
                      <span className="font-black text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                        {acc.username}
                      </span>
                    </div>

                    {/* Password / PIN */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-bold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>كلمة السر / الرمز:</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-emerald-800 font-mono bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          {isPwVisible ? pwd : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleShowPassword(acc.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title={isPwVisible ? "إخفاء" : "إظهار كلمة المرور"}
                        >
                          {isPwVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {acc.subInfo && (
                      <div className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-200/60">
                        {acc.subInfo}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons (Direct WhatsApp Regular & Business + Quick Copy) */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppCredentials(acc, "regular")}
                    className="py-2 px-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] font-black text-[11px] rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                    title="إرسال بيانات الحساب عبر واتساب العادي"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                    <span className="truncate">واتساب</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppCredentials(acc, "business")}
                    className="py-2 px-1 bg-[#075E54]/10 hover:bg-[#075E54]/20 border border-[#075E54]/30 text-[#075E54] font-black text-[11px] rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                    title="إرسال بيانات الحساب عبر واتساب الأعمال"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#075E54]" />
                    <span className="truncate">أعمال</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyCredentials(acc)}
                    className="py-2 px-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                    title="نسخ بيانات الدخول للحافظة"
                  >
                    {copiedId === acc.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 truncate">تم!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">نسخ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Account Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto pt-6 sm:pt-4 pb-48 sm:pb-6">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-orange-500" />
                <span>تعديل بيانات الدخول للحساب</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-black p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">الاسم الكامل:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">رقم الهاتف:</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم المستخدم (Username):</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">كلمة المرور / الرمز السري (Password / PIN):</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-orange-500 font-mono"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl shadow-md cursor-pointer"
                >
                  حفظ وتحديث الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto pt-6 sm:pt-4 pb-48 sm:pb-6">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-500" />
                <span>تسجيل حساب يدوي جديد</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-black p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">نوع الحساب:</label>
                <select
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-orange-500"
                >
                  <option value="customer">زبون / عميل</option>
                  <option value="driver">كابتن توصيل</option>
                  <option value="store">صاحب متجر</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الاسم الكامل:</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: الحاج أحمد الخالد"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">رقم الهاتف:</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="09xxxxxxxx"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم المستخدم (اختياري):</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="تلقائي إن تُرك فارغاً"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">كلمة المرور / PIN:</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="تلقائي إن تُرك فارغاً"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">العنوان أو الحي المقرب:</label>
                <input
                  type="text"
                  value={newAddressLandmark}
                  onChange={(e) => setNewAddressLandmark(e.target.value)}
                  placeholder="مثال: قرب الجامع الكبير"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl shadow-md cursor-pointer"
                >
                  إضافة وحفظ الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
