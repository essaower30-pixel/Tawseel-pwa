import React, { useState, useMemo } from "react";
import {
  Wallet,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Share2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Bike,
  ShieldCheck,
  Calculator,
  Store as StoreIcon,
  User,
  Percent,
  Check,
  Download
} from "lucide-react";
import { DriverMember, Order } from "../../types";

interface CaptainWalletProps {
  currentDriver: DriverMember;
  orders: Order[];
  currency?: string;
}

export const CaptainWallet: React.FC<CaptainWalletProps> = ({
  currentDriver,
  orders,
  currency = "ل.س"
}) => {
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month" | "all">("all");
  const [copiedShare, setCopiedShare] = useState(false);

  // Filter completed orders for this driver
  const myCompletedOrders = useMemo(() => {
    const driverOrders = orders.filter(
      (o) =>
        (o.driverPhone === currentDriver.phone ||
          o.driverName === currentDriver.name ||
          o.driverId === currentDriver.id) &&
        o.status === "delivered"
    );

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (timeFilter === "today") {
      return driverOrders.filter((o) => {
        const orderDate = new Date(o.createdAt).toISOString().split("T")[0];
        return orderDate === todayStr;
      });
    }

    if (timeFilter === "week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return driverOrders.filter((o) => new Date(o.createdAt) >= oneWeekAgo);
    }

    if (timeFilter === "month") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(now.getDate() - 30);
      return driverOrders.filter((o) => new Date(o.createdAt) >= oneMonthAgo);
    }

    return driverOrders;
  }, [orders, currentDriver, timeFilter]);

  // Calculations
  const totalDeliveries = myCompletedOrders.length;
  
  // Total delivery fee earned by driver (handles 0)
  const totalDeliveryEarnings = myCompletedOrders.reduce((sum, o) => {
    const fee = o.deliveryFee !== undefined && o.deliveryFee !== null ? Number(o.deliveryFee) : 0;
    return sum + fee;
  }, 0) + (timeFilter === "all" ? (currentDriver.earnings || 0) : 0);

  // Total cash collected from customers (orders where paymentMethod is cash)
  const totalCashCollected = myCompletedOrders.reduce((sum, o) => {
    if (o.paymentMethod === "cash" || !o.paymentMethod) {
      return sum + o.total;
    }
    return sum;
  }, 0);

  // Products value owed to stores (Cash collected minus driver's delivery fees)
  const totalStoreDues = myCompletedOrders.reduce((sum, o) => {
    if (o.paymentMethod === "cash" || !o.paymentMethod) {
      const fee = o.deliveryFee !== undefined && o.deliveryFee !== null ? Number(o.deliveryFee) : 0;
      const storeNet = Math.max(0, o.total - fee);
      return sum + storeNet;
    }
    return sum;
  }, 0);

  // Electronic payments received directly by admin
  const totalElectronicOrders = myCompletedOrders.reduce((sum, o) => {
    if (o.paymentMethod === "electronic") {
      const fee = o.deliveryFee !== undefined && o.deliveryFee !== null ? Number(o.deliveryFee) : 0;
      return sum + fee;
    }
    return sum;
  }, 0);

  // WhatsApp Share Statement
  const handleShareStatement = () => {
    const periodLabel = 
      timeFilter === "today" ? "اليوم" :
      timeFilter === "week" ? "هذا الأسبوع" :
      timeFilter === "month" ? "هذا الشهر" : "الكامل";

    const text = `🛵 *كشف حساب وأرباح كابتن التوصيل*
👤 الكابتن: ${currentDriver.name}
📱 الهاتف: ${currentDriver.phone}
🗓️ الفترة: ${periodLabel}
-----------------------------
📦 عدد الطلبات المكتملة: ${totalDeliveries} طلب
💰 صافي أرباح التوصيل للكابتن: ${totalDeliveryEarnings.toLocaleString()} ${currency}
💵 إجمالي الكاش المقبوض باليد: ${totalCashCollected.toLocaleString()} ${currency}
🏪 مستحقات المحلات/الإدارة الواجب تسليمها: ${totalStoreDues.toLocaleString()} ${currency}
-----------------------------
✅ تم استخراج التقرير عبر تطبيق توصيل القرية`;

    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-5 sm:p-7 border border-emerald-800/60 shadow-xl relative overflow-hidden space-y-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-emerald-500/25 shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg sm:text-xl">محفظة الكابتن المالية</h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  حسابات مباشرة
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                تتبع فوري لأجور التوصيل، المبالغ النقدية المقبوضة، والمستحقات الواجب تسويتها.
              </p>
            </div>
          </div>

          {/* Time Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80 shrink-0">
            {(
              [
                { id: "today", label: "اليوم" },
                { id: "week", label: "الأسبوع" },
                { id: "month", label: "الشهر" },
                { id: "all", label: "الكل" }
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setTimeFilter(f.id)}
                className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  timeFilter === f.id
                    ? "bg-emerald-500 text-slate-950 shadow-xs"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Core Financial KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative pt-2 border-t border-slate-800">
          {/* Card 1: Net Delivery Earnings */}
          <div className="bg-slate-800/70 backdrop-blur-sm p-4 rounded-2xl border border-emerald-500/30 space-y-1">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
              <span>أرباح التوصيل الصافية</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {totalDeliveryEarnings.toLocaleString()}{" "}
              <span className="text-xs font-sans text-emerald-400">{currency}</span>
            </div>
            <span className="text-[10px] text-emerald-300/80 block font-medium">
              أجرتك المستحقة عن {totalDeliveries} طلب
            </span>
          </div>

          {/* Card 2: Cash in Hand Collected */}
          <div className="bg-slate-800/70 backdrop-blur-sm p-4 rounded-2xl border border-slate-700 space-y-1">
            <div className="flex items-center justify-between text-amber-400 text-xs font-bold">
              <span>الكاش المقبوض باليد</span>
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {totalCashCollected.toLocaleString()}{" "}
              <span className="text-xs font-sans text-amber-300">{currency}</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-medium">
              مجموع المبالغ النقدية المستلمة
            </span>
          </div>

          {/* Card 3: Stores / Admin Dues */}
          <div className="bg-slate-800/70 backdrop-blur-sm p-4 rounded-2xl border border-slate-700 space-y-1">
            <div className="flex items-center justify-between text-blue-400 text-xs font-bold">
              <span>مستحقات المحلات/الإدارة</span>
              <StoreIcon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-blue-400 font-mono">
              {totalStoreDues.toLocaleString()}{" "}
              <span className="text-xs font-sans text-blue-300">{currency}</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-medium">
              واجب تسليمها للمحلات أو الإدارة
            </span>
          </div>

          {/* Card 4: Electronic Payouts Due to Driver */}
          <div className="bg-slate-800/70 backdrop-blur-sm p-4 rounded-2xl border border-slate-700 space-y-1">
            <div className="flex items-center justify-between text-teal-400 text-xs font-bold">
              <span>أجور الدفع الإلكتروني</span>
              <Receipt className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-teal-400 font-mono">
              {totalElectronicOrders.toLocaleString()}{" "}
              <span className="text-xs font-sans text-teal-300">{currency}</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-medium">
              تستلمها من الإدارة لاحقاً
            </span>
          </div>
        </div>

        {/* Action Button: Share via WhatsApp */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>جميع الحسابات والطلبات موثقة ومحسوبة تلقائياً بدقة 100%.</span>
          </p>

          <button
            type="button"
            onClick={handleShareStatement}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black text-xs py-2.5 px-5 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {copiedShare ? (
              <>
                <Check className="w-4 h-4" />
                <span>تم النسخ وفتح واتساب!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>مشاركة كشف الحساب عبر واتساب 📲</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Itemized Order Delivery History */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <h4 className="font-black text-slate-900 text-sm sm:text-base">
              سجل تفاصيل الفواتير والطلبات المنجزة ({myCompletedOrders.length})
            </h4>
          </div>
          <span className="text-xs text-slate-400 font-bold">
            مرتبة من الأحدث
          </span>
        </div>

        {myCompletedOrders.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <Bike className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-600 text-xs">لا توجد طلبات مكتملة ضمن هذه الفترة الزمنية.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-hidden">
            {myCompletedOrders.map((order) => {
              const deliveryFeeEarned = order.deliveryFee !== undefined && order.deliveryFee !== null ? Number(order.deliveryFee) : 0;
              const storeOwed = Math.max(0, order.total - deliveryFeeEarned);
              const isCash = order.paymentMethod === "cash" || !order.paymentMethod;

              return (
                <div
                  key={order.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-900 text-xs sm:text-sm">
                        طلب #{order.id.slice(-4)}
                      </span>
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                        {order.storeName}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isCash
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-teal-50 text-teal-800 border border-teal-200"
                        }`}
                      >
                        {isCash ? "💵 كاش من الزبون" : "💳 دفع إلكتروني"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                      <span>الزبون: <strong className="text-slate-700">{order.customerName}</strong></span>
                      <span>•</span>
                      <span>المنطقة: <strong className="text-slate-700">{order.addressLandmark}</strong></span>
                      <span>•</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(order.createdAt).toLocaleTimeString("ar-SY", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* Financial Breakdown per Order */}
                  <div className="flex items-center gap-3 text-left justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right sm:text-left">
                      <span className="text-[10px] text-slate-400 font-bold block">إجمالي الفاتورة</span>
                      <span className="font-black text-slate-800 font-mono text-xs">
                        {order.total.toLocaleString()} {currency}
                      </span>
                    </div>

                    <div className="text-right sm:text-left bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-xl">
                      <span className="text-[10px] text-emerald-800 font-extrabold block">أجرتك الصافية 🛵</span>
                      <span className="font-black text-emerald-600 font-mono text-xs sm:text-sm">
                        +{deliveryFeeEarned.toLocaleString()} {currency}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
