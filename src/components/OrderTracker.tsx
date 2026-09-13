import React, { useState, useEffect } from "react";
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  ShieldAlert, 
  Bike, 
  Store as StoreIcon, 
  Package, 
  Headphones, 
  AlertTriangle,
  Receipt,
  MessageSquare,
  Sparkles,
  Pill,
  Camera,
  ZoomIn,
  X
} from "lucide-react";
import { MapNode, Order } from "../types";
import { ContactActions } from "./ContactActions";

interface OrderTrackerProps {
  order: Order;
  onBack: () => void;
  mapNodes: MapNode[];
  onCancelOrder?: (orderId: string) => void;
  stores?: any[];
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  order,
  onBack,
  mapNodes,
  onCancelOrder,
  stores = []
}) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Purely computed based on live order status
  const currentStep = (() => {
    switch (order.status) {
      case "pending": return 0;
      case "accepted": return 1;
      case "preparing": return 2;
      case "picked_up": return 3;
      case "delivered": return 4;
      default: return 0;
    }
  })();

  const steps = [
    { title: "تم الاستلام", desc: "تم استقبال الطلب وبانتظار اعتماد وتوجيه الإدارة", icon: "📥" },
    { title: "تم التأكيد", desc: "المتجر اعتمد الطلب وبدأ التجهيز", icon: "✓" },
    { title: "قيد التجهيز", desc: "جاري الطهي والتحضير والتغليف", icon: "🍳" },
    { title: "مع الكابتن", desc: "الكابتن استلم الطلب وهو بالطريق إليك", icon: "🛵" },
    { title: "تم التسليم", desc: "وصل الطلب بالهناء والشفاء", icon: "🟢" }
  ];

  // Dynamic Driver Details from the real order
  const hasAssignedDriver = Boolean(order.driverName || order.driverPhone);
  const driverName = order.driverName || "لم يُحدد بعد";
  const driverPhone = order.driverPhone || "";
  const driverVehicle = order.driverVehicle || "دراجة نارية";

  // Dynamic Store Details
  const matchedStore = stores.find((s) => s.id === order.storeId || s.name === order.storeName);
  const storePhone = matchedStore?.contactPhone || matchedStore?.ownerPhone || "0944111222";
  const supportPhone = "0951854257";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-6 text-right font-sans" dir="rtl">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-black text-slate-700 bg-white hover:bg-slate-50 py-2.5 px-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer transition-all active:scale-95"
        >
          <ArrowRight className="w-4 h-4 text-orange-500" />
          <span>الرجوع للرئيسية</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
            طلب #{order.id.slice(-6)}
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* Driver Road Safety Banner (حفاظاً على حياة وسلامة السائق) */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-3xl p-5 sm:p-6 shadow-lg shadow-orange-500/15 border border-orange-400 space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-white text-orange-600 flex items-center justify-center font-black shrink-0 shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base">
              تنبيه أمان وسلامة مرورية لكابتن التوصيل 🛵
            </h3>
            <p className="text-orange-100 text-xs font-medium">
              حرصاً على سلامة السائق أثناء القيادة على الطريق وتجنب تشتيته، تم إلغاء الرسائل الكتابية والمراسلة المباشرة.
            </p>
          </div>
        </div>
        <p className="text-[11px] sm:text-xs text-white/90 pt-1 leading-relaxed bg-black/10 p-3 rounded-2xl border border-white/15">
          📞 <strong>للتواصل السريع والضروري:</strong> يرجى إجراء اتصال هاتفي مباشر بالكابتن أو إرسال رسالة واتساب (عادي أو أعمال) ليتمكن من مراجعتها عند التوقف الآمن.
        </p>
      </div>

      {/* Progress Stepper Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span>متابعة حالة وتجهيز الطلب</span>
            </h3>
            <p className="text-slate-500 text-xs font-bold mt-0.5">
              المتجر: <strong className="text-slate-800">{order.storeName}</strong> | الزبون:{" "}
              <strong className="text-slate-800">{order.customerName}</strong>
            </p>
          </div>
          <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-2xl text-xs font-black text-center self-start sm:self-auto">
            الوقت المتوقع للوصول: 20 - 30 دقيقة ⏳
          </div>
        </div>

        {/* Stepper Timeline */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStep;
            const isCurrent = idx === currentStep;
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border text-center transition-all ${
                  isCurrent
                    ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/25 scale-102 font-black"
                    : isCompleted
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center mb-1.5 text-xs font-black shadow-xs ${
                    isCurrent
                      ? "bg-white text-orange-600"
                      : isCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isCompleted && !isCurrent ? "✓" : step.icon}
                </div>
                <h4 className="font-extrabold text-xs">{step.title}</h4>
                <p className={`text-[10px] mt-0.5 leading-tight ${isCurrent ? "text-orange-100" : "text-slate-400"}`}>
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Communication Hub: Driver + Store + Support (With Dual WhatsApp) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Assigned Driver Contact or Waiting for Dispatch */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          {hasAssignedDriver ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-2xl shrink-0">
                      🛵
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-black text-slate-900 text-sm sm:text-base">{driverName}</h4>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-black px-2 py-0.5 rounded-full border border-emerald-200">
                          الكابتن المسؤول
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs font-semibold mt-0.5">
                        {driverVehicle} • مكلف من الإدارة
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-slate-500 text-xs leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  🛵 تم توجيه وتكليف الكابتن من قبل الإدارة لاستلام طلبك وتوصيله إليك. للتنسيق، اختر وسيلة التواصل:
                </p>
              </div>

              {/* Contact Buttons */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-extrabold text-slate-500 block">قنوات التواصل مع الكابتن:</span>
                <ContactActions 
                  phone={driverPhone} 
                  name={driverName}
                  defaultMessage={`مرحباً كابتن (${driverName})، أنا الزبون (${order.customerName}) بخصوص طلبي #${order.id.slice(-4)} من متجر (${order.storeName}).`}
                  variant="grid"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-2xl shrink-0 animate-pulse">
                      ⏳
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm sm:text-base">بانتظار توجيه الكابتن</h4>
                      <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                        قيد المتابعة من الإدارة
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-600 text-xs leading-relaxed bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200">
                  🛵 طلبك قيد المتابعة من إدارة المنصة، ويتم حالياً تخصيص وتوجيه أقرب كابتن متاح لاستلام وتوصيل الطلب من متجر (<strong>{order.storeName}</strong>). ستظهر بيانات الكابتن ورقم هاتفه هنا فور تعيينه.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-extrabold text-slate-500 block">للاستفسار المباشر مع إدارة العمليات:</span>
                <ContactActions 
                  phone={supportPhone} 
                  name="إدارة العمليات والتوجيه"
                  defaultMessage={`مرحباً إدارة العمليات، أنا الزبون (${order.customerName}) بخصوص متابعة توجيه كابتن لطلبي #${order.id.slice(-4)}.`}
                  variant="pills"
                />
              </div>
            </>
          )}
        </div>

        {/* Card 2: Store Contact */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-black text-xl shrink-0">
                  <StoreIcon className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm sm:text-base">{order.storeName}</h4>
                  <p className="text-slate-400 text-xs font-semibold mt-0.5">
                    إدارة وتحضير الطلب في المتجر
                  </p>
                </div>
              </div>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
              🏪 لأي تعديل أو إضافة على الوجبة أو الاستفسار عن جهوزية الطلب، يمكنك التواصل مع إدارة المتجر مباشرة.
            </p>
          </div>

          {/* Contact Buttons (Call + WhatsApp Regular + WhatsApp Business) */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-extrabold text-slate-500 block">قنوات التواصل مع المتجر:</span>
            <ContactActions 
              phone={storePhone} 
              name={order.storeName}
              defaultMessage={`مرحباً إدارة متجر (${order.storeName})، أنا الزبون (${order.customerName}) بخصوص طلبي #${order.id.slice(-4)}.`}
              variant="grid"
            />
          </div>
        </div>
      </div>

      {/* Order Summary Card & Customer Destination */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <Receipt className="w-4.5 h-4.5 text-orange-500" />
            <span>تفاصيل الفاتورة ومحتويات الطلب</span>
          </h4>
          <span className="text-xs text-slate-400 font-bold">
            {order.items?.length || 0} أصناف
          </span>
        </div>

        {/* Address and Landmark Box */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[10px] font-bold block">عنوان وموقع التسليم:</span>
              <span className="font-black text-slate-800 text-xs sm:text-sm">
                {order.addressLandmark || "وسط البلد"}
              </span>
              {order.addressDetails && (
                <span className="text-slate-500 block text-[11px] mt-0.5">{order.addressDetails}</span>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-slate-400 text-[10px] font-bold block">هاتف المستلم:</span>
            <span className="font-mono font-black text-slate-800">{order.customerPhone}</span>
          </div>
        </div>

        {/* Items List */}
        <div className="divide-y divide-slate-100 text-xs">
          {order.items &&
            order.items.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-orange-50 text-orange-600 font-black flex items-center justify-center text-xs">
                    {item.quantity}x
                  </span>
                  <div>
                    <span>{item.product.name}</span>
                    {item.selectedSize && (
                      <span className="text-slate-400 text-[10px] mr-1">({item.selectedSize.name})</span>
                    )}
                    {item.selectedAdditions && item.selectedAdditions.length > 0 && (
                      <span className="text-slate-400 text-[10px] mr-1">
                        + {item.selectedAdditions.map((a) => a.name).join("، ")}
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-black text-slate-900 font-mono">
                  {(item.totalItemPrice * item.quantity).toLocaleString()} ل.س
                </span>
              </div>
            ))}
        </div>

        {/* Medical Prescription & Doctor Notes Section */}
        {(order.prescriptionImage || order.prescriptionNotes) && (
          <div className="bg-emerald-50/80 border-2 border-emerald-200 rounded-3xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-black text-xs sm:text-sm text-emerald-950">وصفة / راشيتة أدوية مرفقة</h5>
                  <p className="text-[11px] text-emerald-700 font-bold">تم إرسالها للصيدلاني / الطبيب لتجهيزها بدقة</p>
                </div>
              </div>
              {order.prescriptionImage && (
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                  <Camera className="w-3 h-3 text-emerald-700" />
                  <span>صورة راشيتة مرفقة</span>
                </span>
              )}
            </div>

            {order.prescriptionNotes && (
              <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 text-xs text-slate-700 leading-relaxed font-semibold">
                <span className="text-[10px] text-emerald-800 font-black block mb-1">تفاصيل الأدوية والملاحظات:</span>
                {order.prescriptionNotes}
              </div>
            )}

            {order.prescriptionImage && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-black text-emerald-900 block">صورة الراشيتة الطبية:</span>
                <div 
                  onClick={() => setZoomedImage(order.prescriptionImage || null)}
                  className="relative rounded-2xl overflow-hidden border-2 border-emerald-300 bg-slate-950 max-w-sm group cursor-pointer shadow-md"
                >
                  <img
                    src={order.prescriptionImage}
                    alt="صورة الراشيتة"
                    className="w-full h-44 object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-black">
                    <ZoomIn className="w-4 h-4" />
                    <span>اضغط لتكبير وقراءة الراشيتة</span>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-xs">
                    🔍 تكبير
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Custom Store Order Section (قائمة المقاضي أو صورة الورقة) */}
        {(order.isCustomStoreOrder || (order.customOrderText && !order.prescriptionNotes) || order.customOrderImage) && (
          <div className="bg-orange-50/80 border-2 border-orange-200 rounded-3xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black">
                  🛍️
                </div>
                <div>
                  <h5 className="font-black text-xs sm:text-sm text-orange-950">طلب خاص من المتجر (منتجات غير معروضة)</h5>
                  <p className="text-[11px] text-orange-700 font-bold">تم إرسال قائمة الأغراض للمتجر لتحضيرها</p>
                </div>
              </div>
              {order.customOrderImage && (
                <span className="text-[10px] font-black bg-orange-100 text-orange-800 px-3 py-1 rounded-full border border-orange-300 flex items-center gap-1">
                  <Camera className="w-3 h-3 text-orange-700" />
                  <span>صورة مرفقة</span>
                </span>
              )}
            </div>

            {order.customOrderText && (
              <div className="bg-white p-3.5 rounded-2xl border border-orange-200 text-xs text-slate-800 leading-relaxed font-semibold whitespace-pre-line">
                <span className="text-[10px] text-orange-800 font-black block mb-1">قائمة الأغراض المطلوبة:</span>
                {order.customOrderText}
              </div>
            )}

            {order.estimatedBudget && (
              <div className="bg-white/90 p-2.5 rounded-xl border border-orange-200 text-xs text-slate-700 font-bold flex items-center justify-between">
                <span>الميزانية المقترحة من طرفك:</span>
                <span className="font-mono text-emerald-700 font-black">{order.estimatedBudget.toLocaleString()} ل.س</span>
              </div>
            )}

            {order.customOrderImage && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-black text-orange-900 block">صورة الطلب المرفقة:</span>
                <div 
                  onClick={() => setZoomedImage(order.customOrderImage || null)}
                  className="relative rounded-2xl overflow-hidden border-2 border-orange-300 bg-slate-950 max-w-sm group cursor-pointer shadow-md"
                >
                  <img
                    src={order.customOrderImage}
                    alt="صورة الطلب الخاص"
                    className="w-full h-44 object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-black">
                    <ZoomIn className="w-4 h-4" />
                    <span>اضغط لتكبير الصورة</span>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-xs">
                    🔍 تكبير
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Financial Totals */}
        <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>مجموع المنتجات:</span>
            <span className="font-bold font-mono">{order.subtotal.toLocaleString()} ل.س</span>
          </div>
          <div className="flex justify-between">
            <span>أجرة التوصيل السريع:</span>
            <span className="font-bold text-blue-600 font-mono">+{order.deliveryFee.toLocaleString()} ل.س</span>
          </div>
          {order.discount && order.discount > 0 ? (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>خصم الكوبون المطبق:</span>
              <span className="font-mono">-{order.discount.toLocaleString()} ل.س</span>
            </div>
          ) : null}
          <div className="flex justify-between font-black text-sm text-orange-600 pt-2 border-t border-slate-200">
            <span>المبلغ الإجمالي للدفع عند الاستلام:</span>
            <span className="font-mono text-base">{order.total.toLocaleString()} ل.س</span>
          </div>
        </div>

        {/* Support Footer */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-amber-400" />
            <div>
              <h5 className="font-black text-xs">خدمة العملاء والدعم الفني لمنصة "توصيل"</h5>
              <p className="text-slate-400 text-[10px]">جاهزون لمساعدتك في أي وقت على مدار الساعة</p>
            </div>
          </div>
          <ContactActions
            phone={supportPhone}
            name="دعم منصة توصيل"
            defaultMessage={`مرحباً خدمة العملاء، أود الاستفسار عن الطلب #${order.id.slice(-4)}.`}
            variant="compact"
          />
        </div>
      </div>

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
