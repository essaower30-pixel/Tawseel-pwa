import React, { useState } from "react";
import { 
  BarChart3, 
  DollarSign, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  MessageCircle, 
  FileText, 
  Printer, 
  ArrowLeft, 
  Users, 
  Store as StoreIcon, 
  Wrench, 
  Bike, 
  Trophy, 
  Copy, 
  Send, 
  ExternalLink,
  Calendar
} from "lucide-react";
import { Craftsman, DriverMember, Order, Product, StaffMember, Store, Category } from "../../types";
import { openWhatsApp } from "../../utils/whatsapp";
import { VisualChartsSection } from "./VisualChartsSection";

interface StatsTabProps {
  stores: Store[];
  products: Product[];
  orders: Order[];
  staffList: StaffMember[];
  driversList: DriverMember[];
  craftsmenList: Craftsman[];
  registeredCustomersCount: number;
  onNavigateToTab: (tabId: any) => void;
  currency: string;
  categories?: Category[];
}

export const StatsTab: React.FC<StatsTabProps> = ({
  stores,
  products,
  orders,
  staffList,
  driversList,
  craftsmenList,
  registeredCustomersCount,
  onNavigateToTab,
  currency,
  categories = []
}) => {
  const [filterPeriod, setFilterPeriod] = useState<"today" | "week" | "month" | "all">("all");
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [showOfficialModal, setShowOfficialModal] = useState(false);
  const [managerPhone, setManagerPhone] = useState(() => localStorage.getItem("tw_manager_report_phone") || "0991234567");
  const [reportNotes, setReportNotes] = useState("");
  const [copied, setCopied] = useState(false);

  // Filter orders based on selected period
  const now = new Date();
  const filteredOrders = orders.filter((ord) => {
    if (filterPeriod === "all") return true;
    const ordDate = new Date(ord.createdAt);
    if (filterPeriod === "today") {
      return ordDate.toDateString() === now.toDateString();
    }
    if (filterPeriod === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return ordDate >= weekAgo;
    }
    if (filterPeriod === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return ordDate >= monthAgo;
    }
    return true;
  });

  const completedOrders = filteredOrders.filter(o => o.status === "delivered");
  const cancelledOrders = filteredOrders.filter(o => o.status === "cancelled");
  const totalSales = completedOrders.reduce((acc, o) => acc + (o.subtotal || 0), 0);
  const totalDeliveryFees = completedOrders.reduce((acc, o) => acc + (o.deliveryFee || 0), 0);
  const cancellationRate = filteredOrders.length > 0 ? ((cancelledOrders.length / filteredOrders.length) * 100).toFixed(1) : "0";

  // Top Stores calculation
  const storeSalesMap: Record<string, { name: string; sales: number; count: number }> = {};
  completedOrders.forEach(ord => {
    if (!storeSalesMap[ord.storeId]) {
      storeSalesMap[ord.storeId] = {
        name: ord.storeName || "متجر",
        sales: 0,
        count: 0
      };
    }
    storeSalesMap[ord.storeId].sales += ord.subtotal || 0;
    storeSalesMap[ord.storeId].count += 1;
  });

  const topStores = Object.values(storeSalesMap).sort((a, b) => b.sales - a.sales).slice(0, 5);

  // Active stores count
  const activeStoresCount = stores.filter(s => s.status !== "closed").length;
  const availableDriversCount = driversList.filter(d => d.status === "available").length;

  // Format WhatsApp report
  const generateWhatsappReport = () => {
    const periodLabel = filterPeriod === "today" ? "اليوم" : filterPeriod === "week" ? "الأسبوعي" : filterPeriod === "month" ? "الشهري" : "الشامل (كافة الأوقات)";
    let msg = `📊 *تقرير عمليات وتوصيل القرية الذكي (${periodLabel})*\n`;
    msg += `📅 *التاريخ:* ${new Date().toLocaleDateString("ar-SY", { dateStyle: "full" })}\n\n`;
    msg += `💰 *الملخص المالي:*\n`;
    msg += `• إجمالي المبيعات المكتملة: ${totalSales.toLocaleString()} ${currency}\n`;
    msg += `• رسوم التوصيل المحصلة: ${totalDeliveryFees.toLocaleString()} ${currency}\n`;
    msg += `• إجمالي التدفق المالي: ${(totalSales + totalDeliveryFees).toLocaleString()} ${currency}\n\n`;
    msg += `📦 *حركة الطلبات:*\n`;
    msg += `• الطلبات المكتملة: ${completedOrders.length} طلب ناجح ✅\n`;
    msg += `• الطلبات الملغاة: ${cancelledOrders.length} طلب (${cancellationRate}%)\n`;
    msg += `• إجمالي الطلبات المسجلة: ${filteredOrders.length} طلب\n\n`;
    msg += `👥 *إحصاءات شبكة ومجتمع القرية:*\n`;
    msg += `• الزبائن المسجلين والموثقين: ${registeredCustomersCount} زبون\n`;
    msg += `• المحلات والمتاجر: ${stores.length} متجر (${activeStoresCount} نشط)\n`;
    msg += `• دليل المهن والحرفيين: ${craftsmenList.length} مهني معتمد\n`;
    msg += `• أسطول الكباتن: ${driversList.length} كابتن (${availableDriversCount} متاح) + ${staffList.length} إدارة\n\n`;

    if (topStores.length > 0) {
      msg += `🏆 *المحلات الأكثر مبيعاً:*\n`;
      topStores.forEach((st, idx) => {
        msg += `${idx + 1}. *${st.name}*: ${st.sales.toLocaleString()} ${currency} (${st.count} طلب)\n`;
      });
      msg += `\n`;
    }

    if (reportNotes.trim()) {
      msg += `📝 *ملاحظات إدارية:*\n${reportNotes.trim()}\n\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏢 صادر عن: لوحة الإدارة العامة المركزية • توصيل القرية`;
    return msg;
  };

  const handleSendWhatsapp = (type: "regular" | "business" = "regular", phoneParam?: string) => {
    const text = generateWhatsappReport();
    openWhatsApp({
      phone: phoneParam || managerPhone,
      message: text,
      type
    });
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateWhatsappReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Control Toolbar: Back to Orders, Filters, Share Buttons */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateToTab("orders")}
            className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border border-slate-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>رجوع للطلبات</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

          <span className="text-xs text-slate-500 font-extrabold ml-1">تصفية التقرير:</span>
          {[
            { id: "today", label: "مبيعات اليوم" },
            { id: "week", label: "التقرير الأسبوعي" },
            { id: "month", label: "التقرير الشهري" },
            { id: "all", label: "جميع الأوقات" }
          ].map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilterPeriod(item.id as any)}
              className={`text-xs font-black py-2 px-3.5 rounded-xl border transition-all cursor-pointer ${
                filterPeriod === item.id 
                  ? "bg-orange-500 border-orange-500 text-white shadow-sm" 
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowWhatsappModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>إرسال التقرير عبر واتساب 📲</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOfficialModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-2 px-3.5 rounded-xl border border-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-orange-400" />
            <span>التقرير الرسمي والتصوير 📄</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>طباعة 🖨️</span>
          </button>
        </div>
      </div>

      {/* Ecosystem Census Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-lg">
              📊
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white">إحصاءات وتعداد مجتمع القرية (الزبائن والمتاجر والمهن)</h3>
              <p className="text-slate-400 text-[11px]">تعداد شامل ومباشر لكافة المسجلين بالنظام مع إمكانية تصدير التقرير ومشاركته فوراً.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab("customers")}
            className="py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>فتح سجل الزبائن والمهن الكامل 📋</span>
          </button>
        </div>

        {/* 4 Stats Sub-Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>👥 الزبائن المسجلين</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">{registeredCustomersCount} زبون</div>
            <p className="text-[10px] text-slate-400">دخول مسجل وموثق بالاسم والموبايل</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>🏪 المحلات والمتاجر</span>
              <span className="text-[10px] text-emerald-400 font-bold">{activeStoresCount} نشط</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">{stores.length} متجر</div>
            <p className="text-[10px] text-slate-400">مطاعم • بقاليات • صيدليات • خضار</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>🛠️ المهن وخدمات القرية</span>
              <span className="text-[10px] text-orange-400 font-bold">دليل الحرف</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">{craftsmenList.length} حرفي ومهنة</div>
            <p className="text-[10px] text-slate-400">سباكة، كهرباء، حدادة، أطباء...</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>🛵 الكباتن والكوادر</span>
              <span className="text-[10px] text-blue-400 font-bold">{availableDriversCount} متاح</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">{driversList.length + staffList.length} كادر</div>
            <p className="text-[10px] text-slate-400">{driversList.length} كابتن توصيل + {staffList.length} إدارة</p>
          </div>
        </div>
      </div>

      {/* 4 Financial & Order Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Completed Sales */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي المبيعات المكتملة</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm">
              💰
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-black text-white">
              {totalSales.toLocaleString()} <span className="text-xs font-bold text-orange-400">{currency}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSendWhatsapp()}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>مشاركة الرقم بالواتساب</span>
          </button>
        </div>

        {/* Card 2: Completed Orders */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">الطلبات المكتملة بالتسليم</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-800">
              {completedOrders.length} <span className="text-xs font-bold text-slate-400">طلب مكتمل</span>
            </div>
          </div>
          <span className="text-[11px] text-emerald-600 font-bold">تسليم يدوي ناجح 🟢</span>
        </div>

        {/* Card 3: Delivery Fees Collected */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">رسوم التوصيل المحصلة</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-800">
              {totalDeliveryFees.toLocaleString()} <span className="text-xs font-bold text-blue-600">{currency}</span>
            </div>
          </div>
          <span className="text-[11px] text-blue-600 font-bold">أرباح أسطول الكباتن 🚚</span>
        </div>

        {/* Card 4: Cancelled Orders */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">الطلبات الملغاة حالياً</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-800">
              {cancelledOrders.length} <span className="text-xs font-bold text-slate-400">طلب ملغي</span>
            </div>
          </div>
          <span className="text-[11px] text-red-500 font-bold">نسبة الإلغاء: {cancellationRate}%</span>
        </div>
      </div>

      {/* Visual Recharts Analytics Section: Daily Sales and Orders per Store */}
      <VisualChartsSection
        orders={filteredOrders}
        stores={stores}
        categories={categories}
        currency={currency}
      />

      {/* WhatsApp Share Report Modal */}
      {showWhatsappModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 text-right animate-scale-up" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <span>إرسال التقرير الإداري عبر واتساب 📲</span>
              </h3>
              <button 
                onClick={() => setShowWhatsappModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">رقم هاتف المدير / المسؤول:</label>
                <input
                  type="tel"
                  value={managerPhone}
                  onChange={(e) => {
                    setManagerPhone(e.target.value);
                    localStorage.setItem("tw_manager_report_phone", e.target.value);
                  }}
                  placeholder="0991234567"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ملاحظة إدارية إضافية (اختياري):</label>
                <textarea
                  rows={2}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="اكتب أي ملاحظة تريد إرفاقها مع التقرير..."
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Preview Box */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 max-h-44 overflow-y-auto text-[11px] font-mono text-slate-700 whitespace-pre-wrap">
                {generateWhatsappReport()}
              </div>

              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendWhatsapp("regular")}
                    className="py-3 bg-[#25D366] hover:bg-[#20ba56] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>واتساب العادي 💬</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendWhatsapp("business")}
                    className="py-3 bg-[#075E54] hover:bg-[#054a43] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>واتساب أعمال 💼</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyText}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-orange-400" />
                  <span>{copied ? "تم النسخ بنجاح! ✓" : "نسخ نص التقرير"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Snapshot Report Modal */}
      {showOfficialModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 text-right max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black text-lg">
                  ت
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">التقرير الإداري والمالي الرسمي للقرية</h3>
                  <p className="text-xs text-slate-500">نظام إدارة توصيل العمليات المركزية</p>
                </div>
              </div>
              <button 
                onClick={() => setShowOfficialModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Official Report Content */}
            <div className="space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">تاريخ الإصدار:</span>
                  <span className="font-black text-slate-800">{new Date().toLocaleDateString("ar-SY")}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">الفترة المحددة:</span>
                  <span className="font-black text-slate-800">{filterPeriod === "all" ? "كافة الأوقات" : filterPeriod}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">إجمالي المبيعات:</span>
                  <span className="font-black text-orange-600">{totalSales.toLocaleString()} {currency}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">الطلبات المسلمة:</span>
                  <span className="font-black text-emerald-600">{completedOrders.length} طلب</span>
                </div>
              </div>

              {/* Stores breakdown */}
              <div>
                <h4 className="font-black text-sm text-slate-800 mb-2">أداء المحلات والمتاجر:</h4>
                <div className="border rounded-2xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 font-black text-slate-700">
                      <tr>
                        <th className="p-2.5">المتجر</th>
                        <th className="p-2.5">الطلبات الناجحة</th>
                        <th className="p-2.5">إجمالي المبيعات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {topStores.length > 0 ? (
                        topStores.map((st, i) => (
                          <tr key={i}>
                            <td className="p-2.5 font-bold">{st.name}</td>
                            <td className="p-2.5">{st.count}</td>
                            <td className="p-2.5 font-black text-orange-600">{st.sales.toLocaleString()} {currency}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-slate-400 font-bold">
                            لا توجد حركات بيع مسجلة بعد (المبيعات مصفّرة 0)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة أو حفظ كملف PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setShowOfficialModal(false)}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
