import React, { useState } from "react";
import { 
  Clock, 
  Search, 
  Phone, 
  MapPin, 
  Bike, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  Package, 
  User, 
  Store as StoreIcon,
  ChevronDown,
  Pill,
  Camera,
  ZoomIn,
  ShoppingBag,
  X
} from "lucide-react";
import { DriverMember, Order } from "../../types";
import { ContactActions } from "../ContactActions";

interface OrdersTabProps {
  orders: Order[];
  driversList: DriverMember[];
  onUpdateOrderStatus: (orderId: string, status: any) => void;
  onAssignDriver?: (orderId: string, driver: DriverMember | null) => void;
  currency: string;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  driversList,
  onUpdateOrderStatus,
  onAssignDriver,
  currency
}) => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handleSelectDriver = (orderId: string, driverId: string) => {
    const matchedDriver = driversList.find((d) => d.id === driverId) || null;
    if (onAssignDriver) {
      onAssignDriver(orderId, matchedDriver);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "بانتظار الموافقة 🟡", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      case "accepted":
      case "preparing":
        return { label: "جاري التجهيز بالمحل 🍳", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      case "picked_up":
        return { label: "مع الكابتن بالطريق 🛵", bg: "bg-purple-50 text-purple-700 border-purple-200" };
      case "delivered":
        return { label: "تم التسليم بنجاح 🟢", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "cancelled":
        return { label: "ملغي 🔴", bg: "bg-red-50 text-red-700 border-red-200" };
      default:
        return { label: status, bg: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.customerPhone.includes(searchQuery) ||
                          o.storeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span>الطلبات النشطة والجدولة والعمليات 🕒</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">متابعة مسار الطلبات الحية، تعيين الكباتن، وتحديث مراحل التجهيز والتسليم</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">إجمالي الطلبات:</span>
          <span className="px-3 py-1 bg-orange-50 text-orange-600 font-black text-xs rounded-xl border border-orange-200">
            {orders.length} طلب
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Pills */}
        <div className="flex items-center flex-wrap gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          {[
            { id: "all", label: "كافة الطلبات" },
            { id: "pending", label: "قيد الانتظار" },
            { id: "preparing", label: "جاري التجهيز" },
            { id: "picked_up", label: "قيد التوصيل" },
            { id: "delivered", label: "تم التسليم" },
            { id: "cancelled", label: "ملغية" }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-orange-500 text-white shadow-sm font-black"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              {tab.label} ({tab.id === "all" ? orders.length : orders.filter(o => o.status === tab.id).length})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم الطلب، الزبون..."
            className="w-full pr-9 pl-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
          />
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-black text-sm text-slate-700">لا توجد طلبات في هذا القسم حالياً</h4>
          <p className="text-xs text-slate-400">ستظهر الطلبات الجديدة هنا فور قيام الزبائن بإرسالها.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const statusInfo = getStatusBadge(order.status);
            const assignedDriver = driversList.find(
              (d) => d.id === order.driverId || d.name === order.driverName
            ) || (order.driverName ? { id: order.driverId || "d_assigned", name: order.driverName, phone: order.driverPhone || "", vehicle: order.driverVehicle || "دراجة نارية", status: "available" as const } : null);

            const dispatchWhatsAppMsg = `🛵 *توجيه وتكليف طلب توصيل جديد:*
📌 رقم الطلب: #${order.id.slice(-4)}
🏪 المتجر: ${order.storeName}
👤 الزبون: ${order.customerName}
📞 هاتف الزبون: ${order.customerPhone}
📍 المعلم والعنوان: ${order.addressLandmark} ${order.addressDetails ? `(${order.addressDetails})` : ""}
💰 المبلغ المطلوب تحصيله: ${order.total.toLocaleString()} ${currency}
🛵 أجرة التوصيل الخاصة بك: ${order.deliveryFee === 0 ? "توصيل مجاني (0)" : `${(order.deliveryFee || 0).toLocaleString()} ${currency}`}

يرجى التوجه للمتجر لاستلام الوجبة وتوصيلها للزبون.`;

            return (
              <div 
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 hover:border-orange-300 transition-all p-5 shadow-xs space-y-4"
              >
                {/* Header: Order ID, Time, Store Name, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      {order.status === "pending" ? (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white font-black text-xs flex flex-col items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.7)] ring-2 ring-orange-400/80 animate-pulse">
                          <ShoppingBag className="w-4 h-4 drop-shadow-sm" />
                          <span className="text-[9px] font-mono leading-none mt-0.5">#{order.id.slice(-4)}</span>
                        </div>
                      ) : order.status === "accepted" || order.status === "preparing" ? (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-600 text-white font-black text-xs flex flex-col items-center justify-center shadow-[0_0_18px_rgba(168,85,247,0.6)] ring-2 ring-purple-300/80">
                          <StoreIcon className="w-4 h-4 drop-shadow-sm" />
                          <span className="text-[9px] font-mono leading-none mt-0.5">#{order.id.slice(-4)}</span>
                        </div>
                      ) : order.status === "picked_up" ? (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black text-xs flex flex-col items-center justify-center shadow-[0_0_18px_rgba(6,182,212,0.6)] ring-2 ring-cyan-300/80">
                          <Bike className="w-4 h-4 drop-shadow-sm" />
                          <span className="text-[9px] font-mono leading-none mt-0.5">#{order.id.slice(-4)}</span>
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-xs flex flex-col items-center justify-center shadow-[0_0_18px_rgba(16,185,129,0.6)] ring-2 ring-emerald-300/80">
                          <CheckCircle2 className="w-4 h-4 drop-shadow-sm" />
                          <span className="text-[9px] font-mono leading-none mt-0.5">#{order.id.slice(-4)}</span>
                        </div>
                      )}
                      {order.status === "pending" && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)]"></span>
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-slate-900">{order.storeName}</h4>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(order.createdAt).toLocaleTimeString("ar-SY", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">رقم الطلب: <strong className="font-mono">{order.id}</strong></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black border ${statusInfo.bg}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Body: Customer details + Items + Financials */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  {/* Customer & Address */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border space-y-2">
                    <h5 className="font-black text-slate-700 flex items-center gap-1.5 text-xs">
                      <User className="w-3.5 h-3.5 text-orange-500" />
                      <span>بيانات الزبون والعنوان:</span>
                    </h5>
                    <div className="space-y-1 text-[11px] text-slate-600">
                      <p><strong className="text-slate-800">الاسم:</strong> {order.customerName}</p>
                      <div className="pt-1 pb-1">
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">هاتف وتواصل الزبون:</span>
                        <ContactActions
                          phone={order.customerPhone}
                          name={order.customerName}
                          defaultMessage={`مرحباً ${order.customerName}، بخصوص طلبك #${order.id.slice(-4)} من متجر ${order.storeName}.`}
                          variant="pills"
                        />
                      </div>
                      <p className="flex items-center gap-1">
                        <strong className="text-slate-800">المعلم:</strong>
                        <span className="text-orange-600 font-bold">{order.addressLandmark}</span>
                      </p>
                      {order.addressDetails && (
                        <p className="text-slate-500">{order.addressDetails}</p>
                      )}
                    </div>
                  </div>

                  {/* Items list & Prescription */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border space-y-2">
                    <h5 className="font-black text-slate-700 flex items-center gap-1.5 text-xs">
                      <Package className="w-3.5 h-3.5 text-orange-500" />
                      <span>محتويات الطلب ({order.items.length} صنف):</span>
                    </h5>
                    {order.items && order.items.length > 0 ? (
                      <div className="space-y-1 text-[11px] text-slate-700 max-h-28 overflow-y-auto">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span>{it.quantity}x {it.product.name} {it.selectedSize ? `(${it.selectedSize.name})` : ""}</span>
                            <span className="font-bold">{it.totalItemPrice.toLocaleString()} {currency}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">طلب خاص / راشيتة طبية</p>
                    )}

                    {/* Prescription Details */}
                    {(order.prescriptionImage || order.prescriptionNotes) && (
                      <div className="mt-2 pt-2 border-t border-emerald-200 bg-emerald-50/70 p-2 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-emerald-950 flex items-center gap-1 text-[11px]">
                            <Pill className="w-3.5 h-3.5 text-emerald-600" />
                            <span>راشيتة أدوية / استشارة طبية</span>
                          </span>
                          {order.prescriptionImage && (
                            <button
                              type="button"
                              onClick={() => setZoomedImage(order.prescriptionImage || null)}
                              className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-md hover:bg-emerald-700 cursor-pointer flex items-center gap-1"
                            >
                              <ZoomIn className="w-3 h-3" />
                              <span>تكبير</span>
                            </button>
                          )}
                        </div>

                        {order.prescriptionNotes && (
                          <p className="text-slate-700 text-[11px] font-medium bg-white p-1.5 rounded-lg border border-emerald-100">
                            {order.prescriptionNotes}
                          </p>
                        )}

                        {order.prescriptionImage && (
                          <div 
                            onClick={() => setZoomedImage(order.prescriptionImage || null)}
                            className="relative rounded-lg overflow-hidden border border-emerald-300 bg-slate-900 h-20 cursor-pointer group"
                          >
                            <img
                              src={order.prescriptionImage}
                              alt="راشيتة"
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                              🔍 اضغط للتكبير
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Custom Store Order Details */}
                    {(order.isCustomStoreOrder || (order.customOrderText && !order.prescriptionNotes) || order.customOrderImage) && (
                      <div className="mt-2 pt-2 border-t border-orange-200 bg-orange-50/70 p-2 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-orange-950 flex items-center gap-1 text-[11px]">
                            <ShoppingBag className="w-3.5 h-3.5 text-orange-600" />
                            <span>طلب خاص / منتجات خارجية</span>
                          </span>
                          {order.customOrderImage && (
                            <button
                              type="button"
                              onClick={() => setZoomedImage(order.customOrderImage || null)}
                              className="text-[10px] font-black bg-orange-600 text-white px-2 py-0.5 rounded-md hover:bg-orange-700 cursor-pointer flex items-center gap-1"
                            >
                              <ZoomIn className="w-3 h-3" />
                              <span>تكبير الصورة</span>
                            </button>
                          )}
                        </div>

                        {order.customOrderText && (
                          <div className="bg-white p-2 rounded-lg border border-orange-200 text-slate-800 text-[11px] font-semibold whitespace-pre-line">
                            {order.customOrderText}
                          </div>
                        )}

                        {order.estimatedBudget && (
                          <div className="text-[10px] font-bold text-slate-700 bg-white/80 p-1.5 rounded border border-orange-100 flex items-center justify-between">
                            <span>الميزانية المقترحة:</span>
                            <span className="font-mono text-emerald-700 font-black">{order.estimatedBudget.toLocaleString()} ل.س</span>
                          </div>
                        )}

                        {order.customOrderImage && (
                          <div 
                            onClick={() => setZoomedImage(order.customOrderImage || null)}
                            className="relative rounded-lg overflow-hidden border border-orange-300 bg-slate-900 h-24 cursor-pointer group"
                          >
                            <img
                              src={order.customOrderImage}
                              alt="صورة الطلب الخاص"
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                              🔍 اضغط للتكبير (ورقة الطلب)
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Total and Driver Dispatch */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border space-y-2 flex flex-col justify-between">
                    <div>
                      <h5 className="font-black text-slate-700 text-xs">الحساب الإجمالي:</h5>
                      <div className="space-y-1 text-[11px] text-slate-600 mt-1">
                        <div className="flex justify-between">
                          <span>قيمة المنتجات:</span>
                          <span className="font-bold">{order.subtotal.toLocaleString()} {currency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>أجرة التوصيل:</span>
                          <span className={`font-bold ${order.deliveryFee === 0 ? "text-emerald-600 font-black" : "text-blue-600"}`}>
                            {order.deliveryFee === 0 ? "مجاني (0)" : `+${(order.deliveryFee || 0).toLocaleString()} ${currency}`}
                          </span>
                        </div>
                        {order.discount && order.discount > 0 ? (
                          <div className="flex justify-between text-red-600 font-bold">
                            <span>خصم الكوبون:</span>
                            <span>-{order.discount.toLocaleString()} {currency}</span>
                          </div>
                        ) : null}
                        <div className="flex justify-between font-black text-xs text-orange-600 pt-1 border-t">
                          <span>المجموع الكلي:</span>
                          <span>{order.total.toLocaleString()} {currency}</span>
                        </div>
                      </div>
                    </div>

                    {/* Assign Driver Dropdown & Dispatch Hub */}
                    <div className="pt-2 border-t space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500">
                        {assignedDriver ? "الكابتن المكلف بتوصيل هذا الطلب:" : "توجيه وتعيين كابتن من الإدارة:"}
                      </label>
                      <select
                        value={assignedDriver?.id || ""}
                        onChange={(e) => handleSelectDriver(order.id, e.target.value)}
                        className={`w-full py-1.5 px-2 bg-white border rounded-xl text-[11px] font-bold focus:outline-hidden ${
                          assignedDriver ? "border-emerald-300 text-slate-900" : "border-amber-300 bg-amber-50/40 text-amber-900"
                        }`}
                      >
                        <option value="">-- {assignedDriver ? "إلغاء التعيين / غير معين" : "اختر كابتن من الأسطول لتوجيه الطلب"} --</option>
                        {driversList.map(d => (
                          <option key={d.id} value={d.id}>
                            🛵 {d.name} ({d.vehicle || "دراجة"}) • {d.status === "available" ? "متاح 🟢" : "مشغول 🟡"}
                          </option>
                        ))}
                      </select>

                      {/* If Assigned: Show Captain Contact & One-Touch WhatsApp Dispatch Button */}
                      {assignedDriver && (
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-slate-800 flex items-center gap-1">
                              <span>🛵</span>
                              <span>{assignedDriver.name}</span>
                            </span>
                            <span className="text-slate-500 font-mono">{assignedDriver.phone}</span>
                          </div>

                          <ContactActions
                            phone={assignedDriver.phone}
                            name={assignedDriver.name}
                            defaultMessage={dispatchWhatsAppMsg}
                            variant="pills"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Actions: Status Transition Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onUpdateOrderStatus(order.id, "accepted")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        order.status === "accepted" || order.status === "preparing"
                          ? "bg-blue-600 text-white" 
                          : "bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700"
                      }`}
                    >
                      قبول وتجهيز 🍳
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateOrderStatus(order.id, "picked_up")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        order.status === "picked_up"
                          ? "bg-purple-600 text-white" 
                          : "bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700"
                      }`}
                    >
                      مع الكابتن 🛵
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateOrderStatus(order.id, "delivered")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        order.status === "delivered"
                          ? "bg-emerald-600 text-white" 
                          : "bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700"
                      }`}
                    >
                      تم التسليم ✅
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`إلغاء الطلب #${order.id.slice(-4)}؟`)) {
                          onUpdateOrderStatus(order.id, "cancelled");
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        order.status === "cancelled"
                          ? "bg-red-600 text-white" 
                          : "bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700"
                      }`}
                    >
                      إلغاء الطلب ✕
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة الفاتورة</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Prescription Image Zoom Modal */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          dir="rtl"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full max-h-[90vh] bg-slate-950 rounded-3xl p-3 flex flex-col items-center justify-center shadow-2xl border border-slate-800 cursor-default"
          >
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold cursor-pointer transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full flex items-center justify-between px-3 py-2 text-white border-b border-slate-800 mb-2">
              <span className="font-black text-xs sm:text-sm flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-emerald-400" />
                <span>معاينة صورة الراشيتة الطبية المكبرة</span>
              </span>
              <span className="text-[11px] text-slate-400">انقر خارج الإطار للإغلاق</span>
            </div>
            <div className="w-full overflow-auto flex items-center justify-center max-h-[75vh]">
              <img
                src={zoomedImage}
                alt="راشيتة أدوية مكبرة"
                className="max-w-full max-h-[75vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
