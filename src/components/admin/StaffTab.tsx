import React, { useState } from "react";
import { 
  Users, 
  Plus, 
  KeyRound, 
  Trash2, 
  ShieldCheck, 
  Phone, 
  Power, 
  CheckCircle2, 
  Lock,
  Edit3,
  Copy,
  Check,
  Send,
  MessageCircle,
  MessageSquare,
  Eye,
  EyeOff,
  UserCheck,
  Sliders,
  Shield,
  Clock,
  Briefcase,
  Layers,
  Sparkles
} from "lucide-react";
import { StaffMember, StaffPermission, StaffRole } from "../../types";
import { openWhatsApp } from "../../utils/whatsapp";
import { getAppUrl } from "../../utils/appUrl";

interface StaffTabProps {
  staffList: StaffMember[];
  onAddStaff: (staff: StaffMember) => void;
  onUpdateStaff: (staff: StaffMember) => void;
  onDeleteStaff: (staffId: string) => void;
}

interface PermissionOption {
  id: StaffPermission;
  label: string;
  category: string;
  emoji: string;
  desc: string;
}

const ALL_PERMISSIONS: PermissionOption[] = [
  { id: "orders", label: "الطلبات النشطة والجدولة", category: "العمليات والتوصيل", emoji: "🕒", desc: "متابعة الطلبات اللحظية، قبولها، وتوجيه الكباتن" },
  { id: "drivers", label: "إدارة الكباتن والمناديب", category: "العمليات والتوصيل", emoji: "🛵", desc: "تعيين الكباتن، إدارة أسطول التوصيل وحساب الأجور" },
  { id: "customers", label: "سجل الزبائن والعملاء", category: "العملاء والتواصل", emoji: "👥", desc: "استعراض بيانات الزبائن، العناوين، وسجل الطلبات" },
  { id: "archive_reports", label: "أرشيف الطلبات والتقارير", category: "التقارير والمالية", emoji: "📦", desc: "البحث في تاريخ الطلبات السابقة وتصدير التقارير" },
  { id: "stats", label: "الإحصائيات والأرباح العامة", category: "التقارير والمالية", emoji: "📊", desc: "مخططات المبيعات اليومية والشهرية وإجمالي الأرباح" },
  { id: "stores", label: "إدارة المتاجر والمحلات", category: "المتاجر والمنتجات", emoji: "🏪", desc: "إضافة المحلات وتعديل حالتها والتحكم بالبيانات" },
  { id: "products", label: "إدارة المنتجات والأسعار", category: "المتاجر والمنتجات", emoji: "🍽️", desc: "تعديل قوائم الطعام والمنتجات والأسعار والعروض" },
  { id: "coupons", label: "كوبونات الخصم والترويج", category: "المتاجر والمنتجات", emoji: "🏷️", desc: "إنشاء رموز الخصم ونسب التخفيض" },
  { id: "landmarks", label: "إدارة المعالم الجغرافية", category: "الخدمات والبيانات", emoji: "📍", desc: "إضافة وتعديل نقاط التوصيل والأحياء بالقرية" },
  { id: "craftsmen", label: "دليل الحرفيين وأصحاب المهن", category: "الخدمات والبيانات", emoji: "🛠️", desc: "إدارة أرقام وخدمات المهنيين والسباكين والكهربائيين" },
  { id: "share", label: "نشر وتوزيع التطبيق", category: "الخدمات والبيانات", emoji: "📢", desc: "مشاركة رابط التثبيت وباركود QR للمستخدمين" },
  { id: "logs", label: "سجل عمليات الموظفين", category: "الرقابة والمراجعة", emoji: "📑", desc: "مراجعة أنشطة النظام وسجل الدخول والتعديلات" },
  { id: "vault", label: "خزنة بيانات الدخول السرية", category: "حساس / إدارة عليا", emoji: "🔒", desc: "استعراض وتعديل كلمات مرور كافة المستخدمين" },
  { id: "staff", label: "طاقم العمل وتخصيص الصلاحيات", category: "حساس / إدارة عليا", emoji: "🔑", desc: "إضافة كوادر الإدارة وتوزيع المسؤوليات" },
  { id: "settings", label: "إعدادات النظام والرسوم وباسوورد الإدارة", category: "حساس / إدارة عليا", emoji: "⚙️", desc: "تغيير إعدادات المنصة ورسوم التوصيل وكلمة مرور المدير" },
];

const DEFAULT_ROLE_PERMISSIONS: Record<StaffRole, StaffPermission[]> = {
  manager: ["stats", "archive_reports", "vault", "customers", "orders", "stores", "products", "coupons", "drivers", "landmarks", "craftsmen", "staff", "logs", "settings", "share"],
  orders_clerk: ["orders", "drivers", "customers", "landmarks", "archive_reports"],
  accountant: ["stats", "archive_reports", "logs", "customers"],
  support: ["customers", "orders", "craftsmen", "landmarks", "drivers"],
  products_specialist: ["stores", "products", "coupons", "landmarks"],
  custom: ["orders", "customers"]
};

export const StaffTab: React.FC<StaffTabProps> = ({
  staffList,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [role, setRole] = useState<StaffRole>("orders_clerk");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<StaffPermission[]>(DEFAULT_ROLE_PERMISSIONS.orders_clerk);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formError, setFormError] = useState("");

  // Card toggles for passwords
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const generateStrongPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyz";
    const nums = "23456789";
    const special = "#@!";
    const randomChar = chars.charAt(Math.floor(Math.random() * chars.length));
    const randomChar2 = chars.charAt(Math.floor(Math.random() * chars.length)).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const randomSpec = special.charAt(Math.floor(Math.random() * special.length));
    return `Pass_${randomChar}${randomChar2}${randomNum}${randomSpec}`;
  };

  const handleOpenAddModal = () => {
    setEditingStaffId(null);
    setName("");
    setRole("orders_clerk");
    setPhone("");
    setUsername("");
    setPassword(generateStrongPassword());
    setPin(Math.floor(1000 + Math.random() * 9000).toString());
    setNotes("");
    setSelectedPermissions([...DEFAULT_ROLE_PERMISSIONS.orders_clerk]);
    setFormError("");
    setShowModal(true);
  };

  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingStaffId(staff.id);
    setName(staff.name);
    setRole(staff.role);
    setPhone(staff.phone || "");
    setUsername(staff.username || "");
    setPassword(staff.password || generateStrongPassword());
    setPin(staff.pin || "1234");
    setNotes(staff.notes || "");
    setSelectedPermissions(staff.permissions && staff.permissions.length > 0 
      ? [...staff.permissions] 
      : [...(DEFAULT_ROLE_PERMISSIONS[staff.role] || ["orders"])]
    );
    setFormError("");
    setShowModal(true);
  };

  const handleRoleChange = (newRole: StaffRole) => {
    setRole(newRole);
    // If not custom, auto-populate recommended permissions
    if (newRole !== "custom") {
      setSelectedPermissions([...DEFAULT_ROLE_PERMISSIONS[newRole]]);
    }
  };

  const togglePermission = (permId: StaffPermission) => {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permId));
    } else {
      setSelectedPermissions([...selectedPermissions, permId]);
    }
  };

  const handleSelectAllPermissions = () => {
    setSelectedPermissions(ALL_PERMISSIONS.map(p => p.id));
  };

  const handleClearPermissions = () => {
    setSelectedPermissions([]);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const trimmedName = name.trim();
    const trimmedPin = pin.trim();
    const trimmedPass = password.trim();

    if (!trimmedName) {
      setFormError("الرجاء إدخال اسم الموظف.");
      return;
    }

    if (!trimmedPin || trimmedPin.length < 3 || !/^\d+$/.test(trimmedPin)) {
      setFormError("الرجاء إدخال رمز PIN للدخول السريع مكون من 3-6 أرقام فقط.");
      return;
    }

    if (!trimmedPass || trimmedPass.length <= 4) {
      setFormError("يجب أن تكون كلمة المرور (الباسوورد) أكثر من 4 خانات لحماية الحساب من الاختراق.");
      return;
    }

    const hasLetters = /[a-zA-Z\u0600-\u06FF]/.test(trimmedPass);
    const hasNumbers = /\d/.test(trimmedPass);
    if (!hasLetters || !hasNumbers) {
      setFormError("يجب أن تحتوي كلمة المرور على أحرف وأرقام معاً (مثال: Pass_2026 أو user_ahmed_55).");
      return;
    }

    if (selectedPermissions.length === 0) {
      setFormError("الرجاء تحديد مسؤولية أو صلاحية واحدة على الأقل لهذا الموظف ليتمكن من العمل.");
      return;
    }

    const generatedUsername = username.trim() || `staff_${trimmedName.split(" ")[0].toLowerCase()}_${trimmedPin.slice(-2)}`;

    if (editingStaffId) {
      // Update existing
      const existing = staffList.find(s => s.id === editingStaffId);
      if (existing) {
        onUpdateStaff({
          ...existing,
          name: trimmedName,
          role,
          phone: phone.trim(),
          username: generatedUsername,
          password: trimmedPass,
          pin: trimmedPin,
          permissions: selectedPermissions,
          notes: notes.trim()
        });
      }
    } else {
      // Add new
      onAddStaff({
        id: "staff_" + Date.now(),
        name: trimmedName,
        role,
        phone: phone.trim(),
        username: generatedUsername,
        password: trimmedPass,
        pin: trimmedPin,
        permissions: selectedPermissions,
        notes: notes.trim(),
        isActive: true,
        createdAt: new Date().toISOString().split("T")[0]
      });
    }

    setShowModal(false);
  };

  const handleCopyCredentials = (staff: StaffMember) => {
    const permNames = (staff.permissions || DEFAULT_ROLE_PERMISSIONS[staff.role] || [])
      .map(pid => ALL_PERMISSIONS.find(p => p.id === pid)?.label || pid)
      .join(" • ");

    const text = `بيانات الدخول الإدارية للموظف: ${staff.name}
الدور الوظيفي: ${getRoleLabel(staff.role).label}
اسم المستخدم: ${staff.username || "admin_" + staff.role}
كلمة المرور: ${staff.password || staff.pin}
رمز الـ PIN السريع: ${staff.pin}
المسؤوليات والصلاحيات المخصصة:
${permNames}`;

    navigator.clipboard.writeText(text);
    setCopiedId(staff.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendCredentialsWhatsApp = (staff: StaffMember, type: "regular" | "business" = "regular") => {
    const permNames = (staff.permissions || DEFAULT_ROLE_PERMISSIONS[staff.role] || [])
      .map(pid => `• ${ALL_PERMISSIONS.find(p => p.id === pid)?.label || pid}`)
      .join("\n");

    const appUrl = getAppUrl();
    const message = `🔐 *بيانات الدخول وتخصيص المهام الإدارية*

مرحباً يا *${staff.name}*، تم اعتماد وتخصيص مهامك في لوحة تحكم المنصة:

👤 *الدور الوظيفي:* ${getRoleLabel(staff.role).label}
🔑 *كلمة المرور الخاصة بك:* *${staff.password || staff.pin}*
🔢 *رمز الـ PIN السريع:* *${staff.pin}*
👤 *اسم المستخدم:* ${staff.username || "admin_" + staff.role}

📋 *الأقسام والمسؤوليات المتاحة لك:*
${permNames}

🌐 *رابط الدخول المباشر للوحة:*
${appUrl}

يرجى تسجيل الدخول باستخدام كلمة المرور الخاصة بك للوصول إلى صفحة مهامك المخصصة.`;

    openWhatsApp({
      phone: staff.phone || "0991234567",
      message,
      type
    });
  };

  const getRoleLabel = (r: StaffRole) => {
    switch (r) {
      case "manager": return { label: "المدير العام (تحكم كامل)", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "orders_clerk": return { label: "مسؤول الطلبات والتوجيه", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "accountant": return { label: "المحاسب المالي", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "support": return { label: "موظف الدعم والاتصال", color: "bg-amber-50 text-amber-700 border-amber-200" };
      case "products_specialist": return { label: "مشرف المتاجر والأصناف", color: "bg-teal-50 text-teal-700 border-teal-200" };
      case "custom": return { label: "صلاحيات مخصصة", color: "bg-slate-50 text-slate-700 border-slate-200" };
      default: return { label: "موظف إداري", color: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-orange-500" />
            <span>إدارة طاقم العمل وتخصيص المسؤوليات وكلمات المرور 🔐</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            المدير يحدد مسؤوليات وصلاحيات كل موظف، ويدخل كل موظف بباسوورده الخاص لفتح صفحته المخصصة
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة موظف / مسؤول جديد 👤</span>
        </button>
      </div>

      {/* Quick Summary Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black">
            {staffList.length}
          </div>
          <div>
            <div className="text-xs font-black text-slate-900">إجمالي الكوادر المسجلة</div>
            <div className="text-[11px] text-slate-500">مدراء وموظفي عمليات ودعم</div>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
            {staffList.filter(s => s.isActive !== false).length}
          </div>
          <div>
            <div className="text-xs font-black text-slate-900">الحسابات النشطة</div>
            <div className="text-[11px] text-slate-500">مخولين بالدخول بكلمات مرورهم</div>
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
            15
          </div>
          <div>
            <div className="text-xs font-black text-slate-900">أقسام الصلاحيات المتاحة</div>
            <div className="text-[11px] text-slate-500">تخصيص دقيق ومستقل لكل كادر</div>
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffList.map((member) => {
          const roleInfo = getRoleLabel(member.role);
          const isActive = member.isActive !== false;
          const assignedPerms = member.permissions || DEFAULT_ROLE_PERMISSIONS[member.role] || [];
          const isShowPass = visiblePasswords[member.id] || false;
          const isCopied = copiedId === member.id;

          return (
            <div 
              key={member.id} 
              className={`bg-white rounded-3xl border transition-all p-4.5 shadow-xs flex flex-col justify-between space-y-4 ${
                isActive ? "border-slate-200 hover:border-orange-300 hover:shadow-md" : "border-slate-200 bg-slate-50/70 opacity-75"
              }`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                        <span>{member.name}</span>
                        {member.role === "manager" && <Shield className="w-3.5 h-3.5 text-purple-600" />}
                      </h4>
                      <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md border mt-1 ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}>
                    {isActive ? "نشط ✓" : "معطل ✕"}
                  </span>
                </div>

                {/* Credentials Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-orange-500" />
                      <span>كلمة المرور / الباسوورد:</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs tracking-wider text-slate-800 bg-white px-2 py-0.5 rounded-md border font-mono">
                        {isShowPass ? (member.password || member.pin) : "••••••••"}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(member.id)}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                        title={isShowPass ? "إخفاء" : "إظهار"}
                      >
                        {isShowPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/60">
                    <span className="text-slate-500 font-bold">رمز الـ PIN السريع:</span>
                    <span className="font-black font-mono text-slate-800 bg-white px-2 py-0.5 rounded-md border">
                      {member.pin}
                    </span>
                  </div>

                  {member.username && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-bold">اسم المستخدم:</span>
                      <span className="font-mono text-slate-700 font-bold">{member.username}</span>
                    </div>
                  )}

                  {member.phone && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-bold">رقم الهاتف:</span>
                      <a href={`tel:${member.phone}`} className="font-bold text-blue-600 hover:underline">
                        {member.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Assigned Responsibilities Pills */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-black text-slate-700 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                      <span>المسؤوليات والصلاحيات المخصصة:</span>
                    </span>
                    <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                      {assignedPerms.length} قسم
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-slate-50/60 rounded-xl border border-slate-100">
                    {assignedPerms.map((permId) => {
                      const opt = ALL_PERMISSIONS.find(p => p.id === permId);
                      return (
                        <span 
                          key={permId} 
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 shadow-2xs"
                        >
                          <span>{opt?.emoji || "✓"}</span>
                          <span>{opt?.label || permId}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {member.notes && (
                  <p className="text-[11px] text-slate-500 bg-amber-50/50 p-2 rounded-xl border border-amber-100 italic">
                    📝 {member.notes}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(member)}
                    className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Sliders className="w-3.5 h-3.5 text-orange-400" />
                    <span>تخصيص الصلاحيات والباسوورد</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyCredentials(member)}
                    className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center cursor-pointer"
                    title="نسخ بيانات الدخول"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSendCredentialsWhatsApp(member, "regular")}
                      className="py-1.5 px-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] border border-[#25D366]/30 rounded-xl text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      title="إرسال بيانات الدخول عبر واتساب العادي"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                      <span>واتساب 💬</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendCredentialsWhatsApp(member, "business")}
                      className="py-1.5 px-2.5 bg-[#075E54]/10 hover:bg-[#075E54]/20 text-[#075E54] border border-[#075E54]/30 rounded-xl text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      title="إرسال بيانات الدخول عبر واتساب الأعمال"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#075E54]" />
                      <span>واتساب أعمال 💼</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateStaff({ ...member, isActive: !isActive })}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                        isActive ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-emerald-600 text-white"
                      }`}
                    >
                      {isActive ? "تعطيل" : "تفعيل"}
                    </button>

                    {member.role !== "manager" && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف حساب الموظف "${member.name}" بشكل نهائي؟`)) {
                            onDeleteStaff(member.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="حذف الموظف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto pt-6 sm:pt-4 pb-48 sm:pb-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-4 my-auto text-right animate-scale-up" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-orange-500" />
                <span>{editingStaffId ? "تعديل مسؤوليات وبيانات الموظف 🔐" : "إضافة موظف جديد وتخصيص مسؤولياته 👤"}</span>
              </h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4 text-xs text-slate-700">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-black text-rose-700">
                  ⚠️ {formError}
                </div>
              )}

              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-700 mb-1">الاسم الكامل للموظف: *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: يوسف المحمود"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 mb-1">رقم الهاتف (للتواصل والواتساب):</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0991234567"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block font-black text-slate-700 mb-1">الدور الإداري الأساسي (القالب الافتراضي): *</label>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value as StaffRole)}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-slate-800 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                >
                  <option value="orders_clerk">مسؤول الطلبات والتنسيق مع الكباتن (متابعة الطلبات المباشرة)</option>
                  <option value="accountant">المحاسب المالي (التقارير والأرباح والأرشيف وسجل العمليات)</option>
                  <option value="support">موظف الدعم الفني واستقبال اتصالات العملاء والمهنيين</option>
                  <option value="products_specialist">مشرف المتاجر والأصناف وقوائم الأسعار والكوبونات</option>
                  <option value="manager">المدير العام (كامل الصلاحيات والتحكم المركزي بالموقع)</option>
                  <option value="custom">صلاحيات مخصصة (تحديد يدوي حر للمسؤوليات)</option>
                </select>
              </div>

              {/* Password & PIN configuration */}
              <div className="bg-orange-50/50 border border-orange-200/70 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-orange-950 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-orange-600" />
                    <span>بيانات تسجيل الدخول الخاصة بالموظف</span>
                  </span>
                  <span className="text-[10px] text-orange-700 font-bold">يدخل بها الموظف لصفحته</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-[11px] text-slate-600 mb-1">اسم المستخدم (Username):</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="مثال: user_ahmed"
                      className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl font-bold font-mono focus:outline-hidden focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[11px] text-slate-600">كلمة المرور المشفرة (أكثر من 4 خانات): *</label>
                      <button
                        type="button"
                        onClick={() => setPassword(generateStrongPassword())}
                        className="text-[10px] text-orange-600 font-bold hover:underline flex items-center gap-0.5"
                        title="توليد كلمة مرور قوية"
                      >
                        🎲 توليد
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showFormPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="أحرف وأرقام (مثال: Pass_2026)"
                        className="w-full py-2 pl-8 pr-3 bg-white border border-slate-200 rounded-xl font-bold font-mono text-xs focus:outline-hidden focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[11px] text-slate-600">رمز PIN السريع (3-6 أرقام): *</label>
                      <button
                        type="button"
                        onClick={() => setPin(Math.floor(1000 + Math.random() * 9000).toString())}
                        className="text-[10px] text-slate-500 hover:text-orange-600 font-bold"
                      >
                        🎲 رمز جديد
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="مثال: 5555"
                      className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl font-mono text-center tracking-widest font-black focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                  <span className="text-sm shrink-0">🛡️</span>
                  <div>
                    <span className="font-black">نظام الحماية ضد الاختراق والتخمين:</span>{" "}
                    يُتاح للموظف تسجيل الدخول بالرمز السري <strong>(PIN)</strong> لمرتين فقط، وفي المحاولة الثالثة يُقفل الـ PIN ويُشترط إدخال <strong>كلمة المرور المشفرة الكاملة (المكونة من أحرف وأرقام)</strong> لحماية حسابات الكوادر من أي وصول غير مصرح به.
                  </div>
                </div>
              </div>

              {/* Granular Responsibilities & Permissions Matrix */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-orange-500" />
                      <span>تخصيص مسؤوليات وصفحات الموظف ({selectedPermissions.length} محددة):</span>
                    </label>
                    <p className="text-[10px] text-slate-500">
                      حدد الأقسام التي تظهر لهذا الموظف فقط عند تسجيل دخوله بكلمة المرور الخاصة به
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllPermissions}
                      className="text-[10px] font-black text-blue-600 hover:underline cursor-pointer"
                    >
                      تحديد الكل
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleClearPermissions}
                      className="text-[10px] font-black text-slate-500 hover:underline cursor-pointer"
                    >
                      إلغاء التحديد
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                  {ALL_PERMISSIONS.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                          isChecked 
                            ? "bg-orange-50/70 border-orange-300 text-orange-950 font-bold" 
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(perm.id)}
                          className="mt-0.5 rounded text-orange-500 focus:ring-orange-400"
                        />
                        <div className="text-[11px] leading-tight">
                          <div className="font-black flex items-center gap-1">
                            <span>{perm.emoji}</span>
                            <span>{perm.label}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{perm.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات ومهام خاصة بالموظف (اختياري):</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: مسؤول فترة المساء ومتابعة كباتن حي المدارس"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer active:scale-95"
                >
                  {editingStaffId ? "حفظ التعديلات وتحديث الصلاحيات ✓" : "اعتماد وإضافة الموظف ✓"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
