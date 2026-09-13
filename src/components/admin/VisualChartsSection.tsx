import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  TrendingUp,
  Store as StoreIcon,
  Calendar,
  BarChart3,
  PieChart as PieIcon,
  DollarSign,
  ShoppingBag,
  Sparkles,
  Layers,
  ArrowUpRight,
  Filter
} from "lucide-react";
import { Order, Store, Category } from "../../types";

interface VisualChartsSectionProps {
  orders: Order[];
  stores: Store[];
  categories?: Category[];
  currency?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  restaurants: "#f97316", // orange-500
  supermarket: "#10b981", // emerald-500
  pharmacy: "#06b6d4",    // cyan-500
  vegetables: "#84cc16",  // lime-500
  sweets: "#ec4899",      // pink-500
  clinics: "#3b82f6",     // blue-500
  craftsmen: "#8b5cf6",   // violet-500
  services: "#eab308",    // yellow-500
  other: "#64748b"        // slate-500
};

const CHART_PALETTE = [
  "#f97316",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f59e0b",
  "#6366f1",
  "#14b8a6",
  "#f43f5e"
];

export const VisualChartsSection: React.FC<VisualChartsSectionProps> = ({
  orders,
  stores,
  categories = [],
  currency = "ل.س"
}) => {
  const [salesTimeframe, setSalesTimeframe] = useState<7 | 14 | 30>(7);
  const [salesChartType, setSalesChartType] = useState<"area" | "bar">("area");
  const [storeMetricType, setStoreMetricType] = useState<"orders" | "sales" | "combined">("combined");
  const [activeChartTab, setActiveChartTab] = useState<"sales" | "stores" | "categories">("sales");

  // Format Arabic Date
  const formatArabicDay = (date: Date) => {
    const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const months = [
      "كانون 2", "شباط", "آذار", "نيسان", "أيار", "حزيران",
      "تموز", "آب", "أيلول", "تشرين 1", "تشرين 2", "كانون 1"
    ];
    return {
      dayName: days[date.getDay()],
      shortLabel: `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`,
      dateKey: date.toISOString().split("T")[0]
    };
  };

  // 1. Daily Sales & Orders Trend Data (Strictly 100% Real Calculations)
  const dailySalesData = useMemo(() => {
    const daysCount = salesTimeframe;
    const now = new Date();
    const result: Array<{
      dateKey: string;
      dayName: string;
      shortLabel: string;
      sales: number;
      ordersCount: number;
      completedSales: number;
      deliveryFees: number;
      avgOrderValue: number;
    }> = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const { dayName, shortLabel, dateKey } = formatArabicDay(d);

      // Orders for this specific calendar day
      const dayOrders = orders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate.toDateString() === d.toDateString();
      });

      const dayCompletedOrders = dayOrders.filter((o) => o.status === "delivered");
      
      // Calculate 100% real sales and fees
      const realSales = dayCompletedOrders.reduce((acc, o) => acc + (o.subtotal || 0), 0);
      const realDeliveryFees = dayCompletedOrders.reduce((acc, o) => acc + (o.deliveryFee || 0), 0);
      const totalCount = dayOrders.length;

      result.push({
        dateKey,
        dayName,
        shortLabel,
        sales: realSales,
        ordersCount: totalCount,
        completedSales: realSales,
        deliveryFees: realDeliveryFees,
        avgOrderValue: totalCount > 0 ? Math.round(realSales / totalCount) : 0
      });
    }

    return result;
  }, [orders, salesTimeframe]);

  // Key KPI aggregates (Strictly from real orders)
  const totalSalesInRange = useMemo(() => {
    return dailySalesData.reduce((sum, d) => sum + d.sales, 0);
  }, [dailySalesData]);

  const totalOrdersInRange = useMemo(() => {
    return dailySalesData.reduce((sum, d) => sum + d.ordersCount, 0);
  }, [dailySalesData]);

  const avgDailySales = useMemo(() => {
    return dailySalesData.length > 0 ? Math.round(totalSalesInRange / dailySalesData.length) : 0;
  }, [totalSalesInRange, dailySalesData]);

  const highestSalesDay = useMemo(() => {
    if (dailySalesData.length === 0 || totalSalesInRange === 0) return null;
    const sorted = [...dailySalesData].filter(d => d.sales > 0).sort((a, b) => b.sales - a.sales);
    return sorted.length > 0 ? sorted[0] : null;
  }, [dailySalesData, totalSalesInRange]);

  // 2. Orders & Sales per Store Data (Strictly 100% Real from Orders)
  const storesChartData = useMemo(() => {
    const map: Record<string, {
      storeId: string;
      name: string;
      category: string;
      ordersCount: number;
      completedOrdersCount: number;
      totalSales: number;
      avgTicket: number;
    }> = {};

    // Initialize all stores
    stores.forEach((store) => {
      map[store.id] = {
        storeId: store.id,
        name: store.name,
        category: store.category,
        ordersCount: 0,
        completedOrdersCount: 0,
        totalSales: 0,
        avgTicket: 0
      };
    });

    // Populate strictly from actual orders
    orders.forEach((ord) => {
      if (map[ord.storeId]) {
        map[ord.storeId].ordersCount += 1;
        if (ord.status === "delivered") {
          map[ord.storeId].completedOrdersCount += 1;
          map[ord.storeId].totalSales += ord.subtotal || 0;
        }
      } else {
        // Store from order that might not be in stores list
        const storeName = ord.storeName || "متجر مخصص";
        map[ord.storeId] = {
          storeId: ord.storeId,
          name: storeName,
          category: "other",
          ordersCount: 1,
          completedOrdersCount: ord.status === "delivered" ? 1 : 0,
          totalSales: ord.status === "delivered" ? (ord.subtotal || 0) : 0,
          avgTicket: 0
        };
      }
    });

    // Compute average ticket
    const list = Object.values(map).map((item) => ({
      ...item,
      avgTicket: item.ordersCount > 0 ? Math.round(item.totalSales / item.ordersCount) : 0
    }));

    // Sort by orders count descending
    return list.sort((a, b) => b.ordersCount - a.ordersCount || b.totalSales - a.totalSales);
  }, [stores, orders]);

  // 3. Category Breakdown Data for Pie Chart
  const categoryShareData = useMemo(() => {
    const catMap: Record<string, { name: string; count: number; sales: number; color: string }> = {};

    storesChartData.forEach((s) => {
      if (s.ordersCount > 0) {
        const catId = s.category || "other";
        const catObj = categories.find((c) => c.id === catId);
        const catName = catObj ? catObj.label : (catId === "restaurants" ? "مطاعم ومأكولات" : catId);
        const color = CATEGORY_COLORS[catId] || CHART_PALETTE[Object.keys(catMap).length % CHART_PALETTE.length];

        if (!catMap[catId]) {
          catMap[catId] = {
            name: catName,
            count: 0,
            sales: 0,
            color
          };
        }
        catMap[catId].count += s.ordersCount;
        catMap[catId].sales += s.totalSales;
      }
    });

    return Object.values(catMap);
  }, [storesChartData, categories]);

  // Custom Chart Tooltips (Arabic, High Contrast)
  const CustomSalesTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3.5 rounded-2xl shadow-xl text-right text-white space-y-1.5 min-w-[200px]" dir="rtl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1">
            <span className="font-black text-xs text-amber-400">{data.shortLabel}</span>
            <span className="text-[10px] text-slate-400">📊 إحصاء يومي</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold">💰 إجمالي المبيعات:</span>
            <span className="font-extrabold text-orange-400">{data.sales.toLocaleString()} {currency}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold">📦 عدد الطلبات:</span>
            <span className="font-extrabold text-blue-400">{data.ordersCount} طلب</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold">🛵 أجور التوصيل:</span>
            <span className="font-extrabold text-emerald-400">{data.deliveryFees.toLocaleString()} {currency}</span>
          </div>
          {data.avgOrderValue > 0 && (
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800 text-slate-400">
              <span>متوسط قيمة الطلب:</span>
              <span className="font-bold text-slate-200">{data.avgOrderValue.toLocaleString()} {currency}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomStoreTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3.5 rounded-2xl shadow-xl text-right text-white space-y-1.5 min-w-[210px]" dir="rtl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1">
            <span className="font-black text-xs text-amber-400">{data.name}</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
              {data.category}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold">📦 إجمالي الطلبات:</span>
            <span className="font-extrabold text-blue-400 text-sm">{data.ordersCount} طلب</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold">💰 إجمالي المبيعات:</span>
            <span className="font-extrabold text-orange-400">{data.totalSales.toLocaleString()} {currency}</span>
          </div>
          {data.avgTicket > 0 && (
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800 text-slate-400">
              <span>متوسط الفاتورة:</span>
              <span className="font-bold text-slate-200">{data.avgTicket.toLocaleString()} {currency}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header & Section Navigation Tabs */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl space-y-4 text-right" dir="rtl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/90 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-white">
                  مركز التحليلات والمخططات البيانية التفاعلية (Recharts)
                </h3>
                <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  تحليل ذكي 📈
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold">
                رصد فوري لحركة المبيعات اليومية، وتوزيع الطلبات والسيولة لكل متجر في القرية
              </p>
            </div>
          </div>

          {/* Chart View Switcher */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveChartTab("sales")}
              className={`flex items-center gap-1.5 text-xs font-black py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
                activeChartTab === "sales"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>المبيعات اليومية</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChartTab("stores")}
              className={`flex items-center gap-1.5 text-xs font-black py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
                activeChartTab === "stores"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <StoreIcon className="w-3.5 h-3.5" />
              <span>طلبات المحلات</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChartTab("categories")}
              className={`flex items-center gap-1.5 text-xs font-black py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
                activeChartTab === "categories"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>حصص التصنيفات</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Highlight Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="bg-slate-800/60 border border-slate-700/70 p-3.5 rounded-2xl">
            <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
              <span>إجمالي مبيعات الفترة</span>
              <span className="text-orange-400 font-extrabold">{salesTimeframe} أيام</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-white mt-1">
              {totalSalesInRange.toLocaleString()} <span className="text-xs font-bold text-orange-400">{currency}</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/70 p-3.5 rounded-2xl">
            <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
              <span>إجمالي الطلبات بالفترة</span>
              <span className="text-blue-400 font-extrabold">📦 مكتمل ونشط</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-blue-400 mt-1">
              {totalOrdersInRange} <span className="text-xs font-bold text-slate-400">طلب</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/70 p-3.5 rounded-2xl">
            <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
              <span>المعدل اليومي للمبيعات</span>
              <span className="text-emerald-400 font-extrabold">📈 يومياً</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-400 mt-1">
              {avgDailySales.toLocaleString()} <span className="text-xs font-bold text-slate-400">{currency}</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/70 p-3.5 rounded-2xl">
            <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
              <span>أعلى يوم مبيعاً</span>
              <span className="text-amber-400 font-extrabold">⭐ الذروة</span>
            </div>
            <div className="text-sm sm:text-base font-black text-amber-300 mt-1 truncate">
              {highestSalesDay ? `${highestSalesDay.dayName} (${(highestSalesDay.sales / 1000).toFixed(0)}k ${currency})` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: Daily Sales & Order Trends (Area / Bar Chart) */}
      {(activeChartTab === "sales" || activeChartTab === "categories") && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5 text-right" dir="rtl">
          {/* Chart Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                <span>مخطط إجمالي المبيعات والطلبات اليومية</span>
              </h4>
              <p className="text-xs text-slate-500 font-semibold">
                حجم السيولة والمبيعات اليومية بالليرة السورية ومقارنتها بعدد الطلبات المنجزة
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {/* Timeframe Selector */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                {[
                  { value: 7, label: "آخر 7 أيام" },
                  { value: 14, label: "14 يوماً" },
                  { value: 30, label: "30 يوماً" }
                ].map((tf) => (
                  <button
                    key={tf.value}
                    type="button"
                    onClick={() => setSalesTimeframe(tf.value as any)}
                    className={`text-[11px] font-black py-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
                      salesTimeframe === tf.value
                        ? "bg-white text-orange-600 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {/* Chart Style Selector */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSalesChartType("area")}
                  className={`text-[11px] font-black py-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
                    salesChartType === "area"
                      ? "bg-orange-500 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  مساحي متصل 〰️
                </button>
                <button
                  type="button"
                  onClick={() => setSalesChartType("bar")}
                  className={`text-[11px] font-black py-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
                    salesChartType === "bar"
                      ? "bg-orange-500 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  أعمدة 📊
                </button>
              </div>
            </div>
          </div>

          {/* Recharts Area / Bar Canvas */}
          <div className="w-full h-80 pt-2" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              {salesChartType === "area" ? (
                <AreaChart data={dailySalesData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="dayName"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                  />
                  <Tooltip content={<CustomSalesTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="المبيعات (ل.س)"
                    stroke="#ea580c"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#salesGradient)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={dailySalesData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="dayName"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                  />
                  <Tooltip content={<CustomSalesTooltip />} />
                  <Bar
                    dataKey="sales"
                    name="المبيعات (ل.س)"
                    fill="#f97316"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 border-t border-slate-100 font-semibold">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-orange-500" />
                <span>إجمالي المبيعات اليومية ({currency})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span>عدد الطلبات المنجزة</span>
              </span>
            </div>
            <span>يتم احتساب اليوم الحالي بناءً على العمليات المباشرة والمسجلة</span>
          </div>
        </div>
      )}

      {/* VIEW 2: Orders & Sales per Store Chart (BarChart & Breakdown) */}
      {(activeChartTab === "stores" || activeChartTab === "sales") && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5 text-right" dir="rtl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
                <StoreIcon className="w-5 h-5 text-blue-600" />
                <span>مخطط عدد الطلبات وحجم المبيعات لكل متجر</span>
              </h4>
              <p className="text-xs text-slate-500 font-semibold">
                مقارنة دقيقة لأداء المحلات والمتاجر حسب عدد الطلبات المسجلة وقيمتها المالية
              </p>
            </div>

            {/* Metric Mode Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setStoreMetricType("combined")}
                className={`text-[11px] font-black py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  storeMetricType === "combined"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                الطلبات والمبيعات معاً 📊
              </button>
              <button
                type="button"
                onClick={() => setStoreMetricType("orders")}
                className={`text-[11px] font-black py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  storeMetricType === "orders"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                عدد الطلبات فقط 📦
              </button>
              <button
                type="button"
                onClick={() => setStoreMetricType("sales")}
                className={`text-[11px] font-black py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  storeMetricType === "sales"
                    ? "bg-orange-500 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                المبيعات فقط 💰
              </button>
            </div>
          </div>

          {/* Horizontal / Vertical Bar Chart for Stores */}
          <div className="w-full h-88 pt-2" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={storesChartData.slice(0, 10)}
                margin={{ top: 15, right: 20, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis
                  yAxisId="ordersAxis"
                  stroke="#3b82f6"
                  fontSize={11}
                  tickLine={false}
                  orientation="left"
                />
                {storeMetricType !== "orders" && (
                  <YAxis
                    yAxisId="salesAxis"
                    stroke="#f97316"
                    fontSize={11}
                    tickLine={false}
                    orientation="right"
                    tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                  />
                )}
                <Tooltip content={<CustomStoreTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: "15px", fontSize: "12px", fontFamily: "sans-serif" }}
                  formatter={(value) => <span className="text-slate-700 font-bold">{value}</span>}
                />

                {(storeMetricType === "orders" || storeMetricType === "combined") && (
                  <Bar
                    yAxisId="ordersAxis"
                    dataKey="ordersCount"
                    name="عدد الطلبات المسجلة"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                  />
                )}

                {(storeMetricType === "sales" || storeMetricType === "combined") && (
                  <Bar
                    yAxisId={storeMetricType === "sales" ? "ordersAxis" : "salesAxis"}
                    dataKey="totalSales"
                    name={`حجم المبيعات (${currency})`}
                    fill="#f97316"
                    radius={[6, 6, 0, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Stores Quick Mini Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
            {storesChartData.slice(0, 4).map((st, idx) => (
              <div
                key={st.storeId}
                className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-black text-xs">
                    #{idx + 1}
                  </span>
                  <div>
                    <h5 className="font-black text-xs text-slate-800 truncate max-w-[110px]">
                      {st.name}
                    </h5>
                    <span className="text-[10px] text-blue-600 font-bold">
                      {st.ordersCount} طلب منجز
                    </span>
                  </div>
                </div>
                <div className="text-left font-black text-xs text-slate-900">
                  {st.totalSales.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">{currency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: Category Share Breakdown (Pie Chart & Legend) */}
      {(activeChartTab === "categories" || activeChartTab === "stores") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-purple-600" />
                  <span>توزيع الطلبات حسب تصنيف المتاجر</span>
                </h4>
                <p className="text-xs text-slate-500 font-semibold">
                  النسبة المئوية لطلب كل قطاع (مطاعم، بقاليات، صيدليات، خضار وفواكه...)
                </p>
              </div>
              <span className="text-xs bg-purple-50 text-purple-700 font-black px-2.5 py-1 rounded-xl border border-purple-200">
                توزيع القطاعات 🍩
              </span>
            </div>

            {categoryShareData.length > 0 ? (
              <div className="w-full h-72" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryShareData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={4}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryShareData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [`${value} طلب`, name]}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        color: "#fff",
                        borderRadius: "14px",
                        border: "1px solid #334155",
                        direction: "rtl",
                        textAlign: "right"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="w-full h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                  <PieIcon className="w-6 h-6" />
                </div>
                <h5 className="font-black text-slate-800 text-sm">لا توجد حركات مسجلة للقطاعات بعد</h5>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  عند تسجيل أول طلب في أي متجر أو مطعم، سيتم رسم المخطط الدائري ونسب القطاعات تلقائياً في الوقت الفعلي.
                </p>
              </div>
            )}
          </div>

          {/* Legend and Insights */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-md flex flex-col justify-between text-right" dir="rtl">
            <div className="space-y-4">
              <h4 className="font-black text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>رؤى وتحليلات التصنيفات</span>
              </h4>

              <div className="space-y-2.5">
                {categoryShareData.length > 0 ? (
                  categoryShareData.map((cat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="font-bold text-slate-200">{cat.name}</span>
                      </div>
                      <div className="text-left font-black text-amber-400">
                        {cat.count} <span className="text-[10px] text-slate-400 font-normal">طلب</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-slate-800/40 rounded-xl text-center text-xs text-slate-400 font-bold">
                    البيانات جاهزة ونظيفة للبدء الفعلي (0 حركات)
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 text-center">
              يساعدك هذا التحليل في تحديد المتاجر والقطاعات الأكثر جذباً للمستهلكين في القرية.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
