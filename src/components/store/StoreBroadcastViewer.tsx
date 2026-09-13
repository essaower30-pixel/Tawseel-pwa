import React, { useState } from "react";
import { 
  Megaphone, 
  Bell, 
  Tag, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  ShieldAlert, 
  Info,
  Calendar,
  ExternalLink,
  Volume2
} from "lucide-react";
import { StoreBroadcast, Store } from "../../types";

interface StoreBroadcastViewerProps {
  currentStore: Store;
  broadcasts: StoreBroadcast[];
  onAcknowledgeBroadcast: (broadcastId: string) => void;
}

export const StoreBroadcastViewer: React.FC<StoreBroadcastViewerProps> = ({
  currentStore,
  broadcasts,
  onAcknowledgeBroadcast
}) => {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter broadcasts relevant to this store
  const relevantBroadcasts = broadcasts.filter((bc) => {
    if (bc.targetType === "all") return true;
    if (bc.targetType === "category" && bc.targetIds?.includes(currentStore.category)) return true;
    if (bc.targetType === "specific" && bc.targetIds?.includes(currentStore.id)) return true;
    return false;
  });

  // Unread broadcasts for this store
  const unreadBroadcasts = relevantBroadcasts.filter(
    (bc) => !bc.readBy || !bc.readBy.includes(currentStore.id)
  );

  // Urgent/Important unread broadcasts to show in the top alert banner
  const topActiveBroadcast = unreadBroadcasts.length > 0 ? unreadBroadcasts[0] : null;

  if (relevantBroadcasts.length === 0) return null;

  const handleMarkRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onAcknowledgeBroadcast(id);
  };

  return (
    <div className="space-y-3 font-sans text-right" dir="rtl">
      {/* Top Banner for Unread / Urgent Announcement */}
      {topActiveBroadcast && (
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-md transition-all relative overflow-hidden animate-fadeIn ${
            topActiveBroadcast.priority === "urgent"
              ? "bg-gradient-to-r from-rose-500/10 via-rose-50 to-red-100/50 border-rose-300 ring-2 ring-rose-400"
              : topActiveBroadcast.priority === "important"
              ? "bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-100/50 border-amber-300 ring-2 ring-amber-400"
              : "bg-gradient-to-r from-orange-500/10 via-orange-50 to-amber-100/40 border-orange-200"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md ${
                  topActiveBroadcast.priority === "urgent"
                    ? "bg-rose-600 animate-pulse"
                    : topActiveBroadcast.priority === "important"
                    ? "bg-amber-500"
                    : "bg-orange-500"
                }`}
              >
                {topActiveBroadcast.type === "discount" ? (
                  <Tag className="w-5 h-5" />
                ) : topActiveBroadcast.type === "alert" ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : topActiveBroadcast.type === "timing" ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <Megaphone className="w-5 h-5" />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                      topActiveBroadcast.priority === "urgent"
                        ? "bg-rose-100 text-rose-800 border-rose-300 font-extrabold"
                        : "bg-amber-100 text-amber-900 border-amber-300"
                    }`}
                  >
                    {topActiveBroadcast.priority === "urgent"
                      ? "⚠️ تنبيه إداري عاجل ومهم"
                      : "📢 تعميم من الإدارة المركزية"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(topActiveBroadcast.createdAt).toLocaleDateString("ar-SY")}
                  </span>
                </div>

                <h4 className="text-sm font-black text-slate-900 leading-snug">
                  {topActiveBroadcast.title}
                </h4>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {topActiveBroadcast.message}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => handleMarkRead(topActiveBroadcast.id)}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تأكيد الاطلاع والاستلام ✓</span>
              </button>

              {relevantBroadcasts.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  كافة التعاميم ({relevantBroadcasts.length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating / Header Widget for browsing broadcasts */}
      {!topActiveBroadcast && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 p-3 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Megaphone className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-black text-slate-800">
              مركز التعاميم وتحديثات الإدارة للمتجر
            </span>
            <span className="text-[10px] font-extrabold bg-orange-200/80 text-orange-950 px-2 py-0.5 rounded-lg">
              {relevantBroadcasts.length} تعاميم إدارية
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="py-1.5 px-3 bg-white hover:bg-orange-100 border border-orange-200 text-orange-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            عرض سجل التعاميم 📋
          </button>
        </div>
      )}

      {/* Full Broadcasts History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-sans text-right animate-fadeIn" dir="rtl">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-l from-orange-600 to-amber-500 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">تعاميم وتنبيهات الإدارة لـ ({currentStore.name})</h3>
                  <p className="text-xs text-orange-100">
                    سجل كافة التوجيهات والخصومات والتحديثات الصادرة من إدارة المنصة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
              {relevantBroadcasts.map((bc) => {
                const isRead = bc.readBy?.includes(currentStore.id);
                const isExpanded = expandedId === bc.id;

                return (
                  <div
                    key={bc.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      !isRead
                        ? "bg-orange-50/70 border-orange-300 ring-2 ring-orange-400"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                              bc.type === "discount"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : bc.type === "alert"
                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                : bc.type === "timing"
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-blue-100 text-blue-800 border-blue-300"
                            }`}
                          >
                            {bc.type === "discount"
                              ? "🏷️ خصومات وعروض"
                              : bc.type === "alert"
                              ? "⚠️ تنبيه إداري"
                              : bc.type === "timing"
                              ? "⏱️ أوقات عمل"
                              : "📢 تعميم إداري"}
                          </span>

                          {!isRead && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-orange-500 text-white animate-pulse">
                              جديد (لم يتم التأكيد)
                            </span>
                          )}

                          <span className="text-[10px] text-slate-400 font-bold">
                            📅 {new Date(bc.createdAt).toLocaleString("ar-SY")}
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-slate-900 mt-1">{bc.title}</h4>
                      </div>

                      {!isRead ? (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(bc.id)}
                          className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all shadow-xs flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تأكيد الاطلاع</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-xl flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تم التأكيد</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-200/60">
                      {bc.message}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0 font-medium">
              <span>تصل التنبيهات والخصومات مباشرة من الإدارة العامة لتطبيق القرية</span>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
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
