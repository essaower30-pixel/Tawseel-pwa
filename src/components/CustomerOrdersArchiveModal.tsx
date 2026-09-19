import React, { useState } from "react";
import { 
  Archive, 
  Clock, 
  Package, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Bike, 
  Store as StoreIcon, 
  Eye, 
  ChevronLeft,
  ShoppingBag,
  ExternalLink,
  Phone,
  Star,
  KeyRound
} from "lucide-react";
import { Order, CartItem, StoreReview } from "../types";
import { StoreReviewModal } from "./StoreReviewModal";

interface CustomerOrdersArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  customerPhone?: string;
  customerName?: string;
  onSelectOrderToTrack?: (order: Order) => void;
  onReorder?: (items: CartItem[]) => void;
  currency?: string;
  reviews?: StoreReview[];
  onAddReview?: (review: Omit<StoreReview, "id" | "createdAt">) => void;
}

export const CustomerOrdersArchiveModal: React.FC<CustomerOrdersArchiveModalProps> = ({
  isOpen,
  onClose,
  orders,
  customerPhone,
  customerName,
  onSelectOrderToTrack,
  onReorder,
  currency = "ل.س",
  reviews = [],
  onAddReview
}) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reviewOrderTarget, setReviewOrderTarget] = useState<Order | null>(null);

  if (!isOpen) return null;

  // Filter orders matching this customer
  const customerOrders = orders.filter((o) => {
    if (!customerPhone && !customerName) return true; // if guest with local orders, show all recorded locally
    const matchesPhone = customerPhone && o.customerPhone === customerPhone;
    const matchesName = customerName && o.customerName === customerName;
    return matchesPhone || matchesName;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "قيد المراجعة والموافقة 🟡", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      case "accepted":
      case "preparing":
        return { label: "جاري تجهيز الوجبة بالمحل 🍳", bg: "bg-blue-50 text-blue-700 border-blue-200" };
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans" dir="rtl">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto text-right max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg">سجل طلباتي المؤرشفة 📦</h3>
              <p className="text-xs text-slate-400">يمكنك الرجوع لجميع طلباتك السابقة وإعادة طلبها بضغطة واحدة</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-black p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Orders List / Details Body */}
        <div className="overflow-y-auto space-y-3.5 flex-1 pr-1 pl-1">
          {customerOrders.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-black text-sm text-slate-700">لا يوجد لديك طلبات سابقة بعد</h4>
              <p className="text-xs text-slate-400">عند إتمام أي طلب جديد سيتم حفظه هنا في أرشيفك الدائم.</p>
            </div>
          ) : (
            customerOrders.map((order) => {
              const statusInfo = getStatusBadge(order.status);
              const isSelected = selectedOrder?.id === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-2xl p-4 transition-all space-y-3"
                >
                  {/* Order Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        {order.status === "pending" ? (
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white font-black text-xs flex flex-col items-center justify-center shadow-[0_0_16px_rgba(249,115,22,0.7)] ring-2 ring-orange-400/80 animate-pulse">
                            <ShoppingBag className="w-4 h-4 drop-shadow-sm" />
                          </div>
                        ) : order.status === "accepted" || order.status === "preparing" ? (
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-600 text-white font-black text-xs flex flex-col items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.6)] ring-2 ring-purple-300/80">
                            <StoreIcon className="w-4 h-4 drop-shadow-sm" />
                          </div>
                        ) : order.status === "picked_up" ? (
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black text-xs flex flex-col items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.6)] ring-2 ring-cyan-300/80">
                            <Bike className="w-4 h-4 drop-shadow-sm" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-xs flex flex-col items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.6)] ring-2 ring-emerald-300/80">
                            <CheckCircle2 className="w-4 h-4 drop-shadow-sm" />
                          </div>
                        )}
                        {order.status === "pending" && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,1)]"></span>
                          </span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">#{order.id.slice(-5)}</span>
                          <span className="font-bold text-slate-700 text-xs flex items-center gap-1">
                            <StoreIcon className="w-3.5 h-3.5 text-orange-500" />
                            <span>{order.storeName}</span>
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {new Date(order.createdAt).toLocaleString("ar-SY", {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${statusInfo.bg}`}>
                        {statusInfo.label}
                      </span>
                      {order.deliveryOtp && (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-mono font-black px-2 py-0.5 rounded-lg border ${
                            order.status === "delivered"
                              ? "bg-slate-100 text-slate-500 border-slate-250"
                              : "bg-amber-50 text-amber-900 border-amber-300 shadow-xs"
                          }`}
                          title="كود تسليم واستلام الطلبية للكابتن"
                        >
                          <KeyRound className="w-3 h-3 text-amber-600" />
                          <span>كود التسليم: {order.deliveryOtp}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order Items & Custom Order Preview */}
                  <div className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/70 space-y-2">
                    {/* Custom Store Order Banner & Text */}
                    {(order.isCustomStoreOrder || order.customOrderText || order.customOrderImage) && (
                      <div className="bg-orange-50 border border-orange-200/80 p-2 rounded-lg space-y-1.5">
                        <div className="flex items-center gap-1.5 font-black text-orange-950 text-[11px]">
                          <ShoppingBag className="w-3.5 h-3.5 text-orange-600" />
                          <span>تفاصيل الطلب الخاص من المتجر:</span>
                        </div>
                        {order.customOrderText && (
                          <div className="text-[11px] text-slate-800 bg-white p-2 rounded border border-orange-100 font-semibold whitespace-pre-line">
                            {order.customOrderText}
                          </div>
                        )}
                        {order.customOrderImage && (
                          <div className="rounded-lg overflow-hidden border border-orange-200 bg-slate-900 h-28 flex items-center justify-center">
                            <img
                              src={order.customOrderImage}
                              alt="صورة الطلب الخاص"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        {order.estimatedBudget !== undefined && order.estimatedBudget > 0 && (
                          <div className="flex justify-between items-center text-[10px] text-slate-600 font-bold">
                            <span>الميزانية المقترحة:</span>
                            <span className="font-mono text-emerald-700">{order.estimatedBudget.toLocaleString()} {currency}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {order.items && order.items.length > 0 && (
                      <div>
                        <div className="font-bold text-slate-800 text-[11px] mb-1">الأصناف المسجلة:</div>
                        <div className="space-y-0.5">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px]">
                              <span>{item.quantity}x {item.product?.name}</span>
                              <span className="font-bold text-slate-900">
                                {item.totalItemPrice !== undefined
                                  ? item.totalItemPrice.toLocaleString()
                                  : ((item.product?.price || 0) * (item.quantity || 1)).toLocaleString()}{" "}
                                {currency}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pricing and Captain Info */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                    <div>
                      {order.driverName && (
                        <span className="text-[11px] text-orange-700 font-bold flex items-center gap-1">
                          <Bike className="w-3.5 h-3.5" />
                          <span>كابتن التوصيل: {order.driverName}</span>
                        </span>
                      )}
                    </div>
                    <div className="font-black text-slate-900 text-sm">
                      الإجمالي: {order.total?.toLocaleString()} {currency}
                    </div>
                  </div>

                  {/* Actions (Reorder / Track Order / Rate Order) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    {/* Rate Order for Delivered Orders */}
                    {order.status === "delivered" && (
                      <div>
                        {(() => {
                          const existingReview = reviews.find((r) => r.orderId === order.id);
                          if (existingReview) {
                            return (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>تم التقييم ({existingReview.rating}★)</span>
                              </span>
                            );
                          }
                          return (
                            <button
                              type="button"
                              onClick={() => setReviewOrderTarget(order)}
                              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                              title="قيّم جودة الطعام وتجربة التوصيل لهذا الطلب"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
                              <span>تقييم المتجر ⭐</span>
                            </button>
                          );
                        })()}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mr-auto">
                      {order.status !== "delivered" && order.status !== "cancelled" && onSelectOrderToTrack && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectOrderToTrack(order);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>تتبع الطلب الحي 🛵</span>
                        </button>
                      )}

                      {onReorder && (
                        <button
                          type="button"
                          onClick={() => {
                            onReorder(order.items);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                          title="إضافة منتجات هذا الطلب للسلة وإعادة الطلب فوراً"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                          <span>إعادة الطلب 🔄</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* Store Review Modal */}
      {reviewOrderTarget && (
        <StoreReviewModal
          isOpen={!!reviewOrderTarget}
          onClose={() => setReviewOrderTarget(null)}
          storeName={reviewOrderTarget.storeName}
          storeId={reviewOrderTarget.storeId}
          orderId={reviewOrderTarget.id}
          customerName={customerName || reviewOrderTarget.customerName || "زبون المنصة"}
          customerPhone={customerPhone || reviewOrderTarget.customerPhone}
          onSubmit={(reviewData) => {
            if (onAddReview) {
              onAddReview(reviewData);
            }
            setReviewOrderTarget(null);
          }}
        />
      )}
    </div>
  );
};
