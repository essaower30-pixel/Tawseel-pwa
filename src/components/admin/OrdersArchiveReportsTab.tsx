import React, { useState, useMemo } from "react";
import { 
  Archive, 
  Search, 
  Calendar, 
  FileText, 
  Printer, 
  Send, 
  Download, 
  Store as StoreIcon, 
  Bike, 
  User, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Filter,
  Receipt,
  Eye,
  ChevronDown,
  MessageSquare,
  MessageCircle
} from "lucide-react";
import { DriverMember, Order, Store } from "../../types";
import { openWhatsApp } from "../../utils/whatsapp";

interface OrdersArchiveReportsTabProps {
  orders: Order[];
  stores: Store[];
  drivers: DriverMember[];
  currency?: string;
}

export const OrdersArchiveReportsTab: React.FC<OrdersArchiveReportsTabProps> = ({
  orders,
  stores,
  drivers,
  currency = "ل.س"
}) => {
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "yesterday" | "week" | "month">("all");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("all");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Filter calculation
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOfWeek = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return orders.filter((o) => {
      const orderTime = new Date(o.createdAt).getTime();

      // Date Filtering
      if (dateFilter === "today" && orderTime < startOfToday) return false;
      if (dateFilter === "yesterday" && (orderTime < startOfYesterday || orderTime >= startOfToday)) return false;
      if (dateFilter === "week" && orderTime < startOfWeek) return false;
      if (dateFilter === "month" && orderTime < startOfMonth) return false;

      // Store Filtering
      if (selectedStoreId !== "all" && o.storeId !== selectedStoreId && o.storeName !== selectedStoreId) return false;

      // Driver Filtering
      if (selectedDriverId !== "all" && o.driverId !== selectedDriverId && o.driverName !== selectedDriverId) return false;

      // Status Filtering
      if (statusFilter !== "all" && o.status !== statusFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          o.storeName.toLowerCase().includes(q) ||
          (o.driverName && o.driverName.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [orders, dateFilter, selectedStoreId, selectedDriverId, statusFilter, searchQuery]);

  // Financial Stats of Filtered Archive
  const stats = useMemo(() => {
    let totalSales = 0;
    let totalDeliveryFees = 0;
    let totalStoresRevenue = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    filteredOrders.forEach((o) => {
      if (o.status === "delivered") {
        completedCount++;
        totalSales += o.total || 0;
        totalDeliveryFees += o.deliveryFee || 0;
        totalStoresRevenue += o.subtotal || 0;
      } else if (o.status === "cancelled") {
        cancelledCount++;
      } else {
        totalSales += o.total || 0;
      }
    });

    const successRate = filteredOrders.length > 0 ? Math.round((completedCount / filteredOrders.length) * 100) : 100;

    return {
      totalOrders: filteredOrders.length,
      completedCount,
      cancelledCount,
      totalSales,
      totalDeliveryFees,
      totalStoresRevenue,
      successRate
    };
  }, [filteredOrders]);

  // Breakdown per Store
  const storeBreakdown = useMemo(() => {
    const map: Record<string, { name: string; count: number; total: number }> = {};
    filteredOrders.forEach((o) => {
      if (!map[o.storeName]) {
        map[o.storeName] = { name: o.storeName, count: 0, total: 0 };
      }
      map[o.storeName].count += 1;
      if (o.status === "delivered") {
        map[o.storeName].total += o.subtotal || 0;
      }
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredOrders]);

  // Breakdown per Driver
  const driverBreakdown = useMemo(() => {
    const map: Record<string, { name: string; count: number; fees: number }> = {};
    filteredOrders.forEach((o) => {
      const driverName = o.driverName || "بدون كابتن معين";
      if (!map[driverName]) {
        map[driverName] = { name: driverName, count: 0, fees: 0 };
      }
      map[driverName].count += 1;
      if (o.status === "delivered") {
        map[driverName].fees += o.deliveryFee || 0;
      }
    });
    return Object.values(map).sort((a, b) => b.fees - a.fees);
  }, [filteredOrders]);

  const handlePrintReport = () => {
    window.print();
  };

  const handleSendWhatsAppReport = (type: "regular" | "business" = "regular") => {
    const periodLabel = 
      dateFilter === "today" ? "اليوم" :
      dateFilter === "yesterday" ? "الأمس" :
      dateFilter === "week" ? "آخر 7 أيام" :
      dateFilter === "month" ? "هذا الشهر" : "كافة الفترات";

    let msg = `📊 *تقرير عمليات وأرشيف الطلبات - تطبيق توصيل* 📊
📅 *الفترة:* ${periodLabel}
⏱️ *تاريخ الإصدار:* ${new Date().toLocaleString("ar-SY")}

📦 *إجمالي الطلبات:* ${stats.totalOrders} طلب
✅ *الطلبات المسلمة بنجاح:* ${stats.completedCount} (${stats.successRate}%)
❌ *الطلبات الملغية:* ${stats.cancelledCount}

💰 *إجمالي حركة المبيعات:* ${stats.totalSales.toLocaleString()} ${currency}
🛵 *إجمالي رسوم التوصيل (الكباتن):* ${stats.totalDeliveryFees.toLocaleString()} ${currency}
🏪 *صافي مبيعات المتاجر:* ${stats.totalStoresRevenue.toLocaleString()} ${currency}

───────────────
🏪 *أداء المتاجر في التقرير:*
`;

    storeBreakdown.forEach((s) => {
      msg += `• ${s.name}: ${s.count} طلبات | المبيعات: ${s.total.toLocaleString()} ${currency}\n`;
    });

    msg += `\n🛵 *أداء الكباتن في التقرير:*\n`;
    driverBreakdown.forEach((d) => {
      msg += `• ${d.name}: ${d.count} توصيلات | الأجور: ${d.fees.toLocaleString()} ${currency}\n`;
    });

    msg += `\n───────────────\nصدر عن نظام الإدارة والتقارير الذكي 🌟`;

    openWhatsApp({ phone: "0991234567", message: msg, type });
  };

  const handleExportCSV = () => {
    const headers = ["رقم الطلب", "التاريخ والوقت", "المتجر", "الزبون", "هاتف الزبون", "الكابتن المكلف", "قيمة المواد", "أجرة التوصيل", "الإجمالي الكلي", "حالة الطلب"];
    const rows = filteredOrders.map((o) => [
      o.id,
      new Date(o.createdAt).toLocaleString("ar-SY"),
      o.storeName,
      o.customerName,
      o.customerPhone,
      o.driverName || "غير محدد",
      o.subtotal || 0,
      o.deliveryFee || 0,
      o.total || 0,
      o.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_archive_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-700/80 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base sm:text-lg flex items-center gap-2">
                <span>أرشيف الطلبات والتقارير المالية المتقدمة</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  📄 جاهز للتقارير
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                سجل تاريخي شامل لجميع الطلبات السابقة مع إمكانية الفلترة الدقيقة، وإصدار تقارير مبيعات وحسابات المتاجر والكباتن.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons for Generating Report */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-orange-500/25 flex items-center gap-2 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            <span>إصدار تقرير رسمي مفصل</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            title="تصدير جدول الأرشيف كملف Excel / CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Financial KPIs Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">إجمالي المبيعات المؤرشفة</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-900">
            {stats.totalSales.toLocaleString()} <span className="text-xs font-bold text-slate-500">{currency}</span>
          </p>
          <p className="text-[11px] text-slate-400 font-medium">حجم التدفق المالي للطلبات المفلترة</p>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">رسوم وأجور التوصيل</span>
            <Bike className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-lg sm:text-xl font-black text-orange-600">
            {stats.totalDeliveryFees.toLocaleString()} <span className="text-xs font-bold text-slate-500">{currency}</span>
          </p>
          <p className="text-[11px] text-slate-400 font-medium">مستحقات أسطول الكباتن</p>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">مستحقات المتاجر الصافية</span>
            <StoreIcon className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-lg sm:text-xl font-black text-blue-700">
            {stats.totalStoresRevenue.toLocaleString()} <span className="text-xs font-bold text-slate-500">{currency}</span>
          </p>
          <p className="text-[11px] text-slate-400 font-medium">صافي حسابات التجار والمحلات</p>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">عدد الطلبات ونسبة النجاح</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-900">
            {stats.completedCount} <span className="text-xs font-bold text-slate-400">من {stats.totalOrders}</span>
          </p>
          <p className="text-[11px] text-emerald-600 font-bold">نسبة إنجاز وتسليم: {stats.successRate}%</p>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-black text-slate-800">
          <Filter className="w-4 h-4 text-orange-500" />
          <span>خيارات الفلترة والتخصيص الزمني:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Period Filter */}
          <div>
            <label className="block text-slate-500 font-bold mb-1">الفترة الزمنية:</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">كافة الأوقات والأرشيف</option>
              <option value="today">اليوم فقط</option>
              <option value="yesterday">الأمس</option>
              <option value="week">آخر 7 أيام</option>
              <option value="month">هذا الشهر</option>
            </select>
          </div>

          {/* Store Filter */}
          <div>
            <label className="block text-slate-500 font-bold mb-1">المتجر / المحل:</label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">جميع المتاجر</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Driver Filter */}
          <div>
            <label className="block text-slate-500 font-bold mb-1">الكابتن المكلف:</label>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">جميع الكباتن</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-slate-500 font-bold mb-1">حالة الطلب:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">جميع الحالات</option>
              <option value="delivered">تم التسليم بنجاح 🟢</option>
              <option value="picked_up">قيد التوصيل 🛵</option>
              <option value="cancelled">ملغي 🔴</option>
              <option value="pending">قيد الانتظار 🟡</option>
            </select>
          </div>
        </div>

        {/* Search in Archive */}
        <div className="pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث برقم الطلب، اسم الزبون، هاتف الزبون، أو اسم الكابتن..."
              className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4 text-orange-500" />
            <span>سجل الطلبات المؤرشفة ({filteredOrders.length} طلب)</span>
          </h4>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Archive className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-black text-slate-700">لا توجد طلبات مطابقة للفلاتر المحددة</p>
            <p className="text-xs text-slate-400">جرب تغيير خيارات الفترة الزمنية أو إزالة البحث.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">رقم الطلب</th>
                  <th className="py-3 px-4">التاريخ والوقت</th>
                  <th className="py-3 px-4">المتجر</th>
                  <th className="py-3 px-4">الزبون</th>
                  <th className="py-3 px-4">الكابتن</th>
                  <th className="py-3 px-4">المبلغ الكلي</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredOrders.map((order) => {
                  const isDelivered = order.status === "delivered";
                  const isCancelled = order.status === "cancelled";

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-black font-mono text-slate-900">
                        #{order.id.slice(-5)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleString("ar-SY", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{order.storeName}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{order.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{order.customerPhone}</div>
                      </td>
                      <td className="py-3 px-4">
                        {order.driverName ? (
                          <span className="font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60">
                            🛵 {order.driverName}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">بدون كابتن</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900 whitespace-nowrap">
                        {order.total?.toLocaleString()} {currency}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                            isDelivered
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isCancelled
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {isDelivered ? "تم التسليم 🟢" : isCancelled ? "ملغي 🔴" : "قيد المتابعة 🟡"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderDetails(order)}
                          className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors cursor-pointer"
                          title="عرض فاتورة وتفاصيل الطلب"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Report Generator Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-500" />
                  <span>التقرير الإداري والمالي الرسمي</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تم توليد هذا التقرير بناءً على الفلاتر المحددة حالياً ({dateFilter === "all" ? "كافة الأوقات" : dateFilter})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-black p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Report Content Body */}
            <div className="space-y-4 text-xs" id="printable-report">
              {/* Summary Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <div className="text-slate-400 font-bold">إجمالي الطلبات</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{stats.totalOrders}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold">المسلمة بنجاح</div>
                  <div className="text-base font-black text-emerald-600 mt-0.5">{stats.completedCount}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold">إجمالي المبيعات</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{stats.totalSales.toLocaleString()} {currency}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold">رسوم التوصيل</div>
                  <div className="text-base font-black text-orange-600 mt-0.5">{stats.totalDeliveryFees.toLocaleString()} {currency}</div>
                </div>
              </div>

              {/* Stores Breakdown */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
                <h5 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                  <StoreIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span>توزيع المبيعات على المتاجر:</span>
                </h5>
                <div className="space-y-1.5 divide-y divide-slate-100">
                  {storeBreakdown.map((s) => (
                    <div key={s.name} className="flex items-center justify-between pt-1.5">
                      <span className="font-bold text-slate-800">{s.name} ({s.count} طلبات)</span>
                      <span className="font-black text-slate-900">{s.total.toLocaleString()} {currency}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drivers Breakdown */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
                <h5 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5 text-orange-500" />
                  <span>توزيع التوصيلات ومستحقات الكباتن:</span>
                </h5>
                <div className="space-y-1.5 divide-y divide-slate-100">
                  {driverBreakdown.map((d) => (
                    <div key={d.name} className="flex items-center justify-between pt-1.5">
                      <span className="font-bold text-slate-800">{d.name} ({d.count} توصيلة)</span>
                      <span className="font-black text-orange-700">{d.fees.toLocaleString()} {currency}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSendWhatsAppReport("regular")}
                  className="px-3.5 py-2.5 bg-[#25D366] hover:bg-[#20ba56] text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>واتساب العادي 💬</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendWhatsAppReport("business")}
                  className="px-3.5 py-2.5 bg-[#075E54] hover:bg-[#054a43] text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>واتساب أعمال 💼</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة التقرير (Print)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Invoice Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">فاتورة الطلب #{selectedOrderDetails.id.slice(-5)}</h3>
                <span className="text-[11px] text-slate-400">{new Date(selectedOrderDetails.createdAt).toLocaleString("ar-SY")}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-black p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-2xl space-y-1.5 border border-slate-200/80">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>المتجر:</span>
                  <span className="font-black text-slate-900">{selectedOrderDetails.storeName}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700">
                  <span>الزبون:</span>
                  <span className="font-black text-slate-900">{selectedOrderDetails.customerName} ({selectedOrderDetails.customerPhone})</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700">
                  <span>العنوان:</span>
                  <span className="text-slate-900">{selectedOrderDetails.addressLandmark} - {selectedOrderDetails.addressDetails || ""}</span>
                </div>
                {selectedOrderDetails.driverName && (
                  <div className="flex justify-between font-bold text-orange-800">
                    <span>الكابتن المكلف:</span>
                    <span className="font-black">{selectedOrderDetails.driverName} ({selectedOrderDetails.driverPhone})</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-2xl p-3 space-y-2">
                <div className="font-black text-slate-800">قائمة الأصناف:</div>
                <div className="space-y-1 divide-y divide-slate-100">
                  {selectedOrderDetails.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center pt-1">
                      <span>{item.quantity}x {item.product?.name}</span>
                      <span className="font-black text-slate-900">{item.totalItemPrice?.toLocaleString()} {currency}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation */}
              <div className="bg-orange-50 border border-orange-200 p-3 rounded-2xl space-y-1 font-bold text-orange-950">
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
                  <span>{selectedOrderDetails.subtotal?.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>أجرة التوصيل:</span>
                  <span>{selectedOrderDetails.deliveryFee?.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-sm font-black pt-1 border-t border-orange-200 text-orange-900">
                  <span>الإجمالي النهائي:</span>
                  <span>{selectedOrderDetails.total?.toLocaleString()} {currency}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="px-5 py-2 bg-slate-900 text-white font-black rounded-xl cursor-pointer"
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
