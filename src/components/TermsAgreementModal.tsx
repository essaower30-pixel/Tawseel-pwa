import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  X,
  CheckCircle2,
  AlertTriangle,
  Scale,
  FileText,
  User,
  Store as StoreIcon,
  Bike,
  Check,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { ROLE_TERMS, RoleTermsAgreement } from "../data/termsData";

interface TermsAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: "customer" | "store_owner" | "driver" | "general" | string;
  onAccept?: () => void;
  showAcceptButton?: boolean;
  isMandatoryAcceptance?: boolean;
}

export const TermsAgreementModal: React.FC<TermsAgreementModalProps> = ({
  isOpen,
  onClose,
  role = "customer",
  onAccept,
  showAcceptButton = false,
  isMandatoryAcceptance = false
}) => {
  // Normalize role key
  const normalizedRole =
    role === "store" || role === "store_owner"
      ? "store_owner"
      : role === "driver"
      ? "driver"
      : "customer";

  const terms: RoleTermsAgreement = ROLE_TERMS[normalizedRole] || ROLE_TERMS.customer;

  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const [isCheckedConsent, setIsCheckedConsent] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
      setHasReadToBottom(true);
    }
  };

  const handleConfirmAgreement = () => {
    if (onAccept) {
      onAccept();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.96 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]"
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-xl text-amber-400 border border-white/10 shadow-inner">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg">{terms.roleName}</h3>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {terms.badge}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium line-clamp-1">{terms.roleSubtitle}</p>
            </div>
          </div>

          {!isMandatoryAcceptance && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Informational Sub-Banner */}
        <div className="px-4 py-2.5 bg-amber-50/80 border-b border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-950 font-bold shrink-0">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{terms.summary}</p>
        </div>

        {/* Scrollable Terms Content */}
        <div
          onScroll={handleScroll}
          className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-slate-800 text-right text-xs sm:text-sm"
        >
          {terms.sections.map((section, idx) => {
            const isExpanded = expandedSection === section.id || expandedSection === null;

            return (
              <div
                key={section.id}
                className="bg-slate-50/80 rounded-2xl border border-slate-200/90 overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-3.5 flex items-center justify-between font-black text-slate-900 hover:bg-slate-100/70 transition-colors text-right cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{section.icon}</span>
                    <span className="text-xs sm:text-sm font-black">{section.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-2 border-t border-slate-200/60 bg-white/70">
                    {section.clauses.map((clause, cIdx) => (
                      <div key={cIdx} className="flex items-start gap-2 text-xs font-semibold text-slate-700 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5" />
                        <p>{clause}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Legal Declaration Box */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-2 shadow-inner">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-black">
              <Scale className="w-4 h-4" />
              <span>إقرار وتعهد قانوني</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {terms.declaration}
            </p>
          </div>
        </div>

        {/* Modal Footer / Acceptance Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-3">
          {(showAcceptButton || isMandatoryAcceptance) && (
            <label className="flex items-start gap-2.5 cursor-pointer select-none text-right">
              <input
                type="checkbox"
                checked={isCheckedConsent}
                onChange={(e) => setIsCheckedConsent(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 leading-relaxed">
                قرأت وفهمت جميع بنود الاتفاقية وإخلاء المسؤولية المذكورة أعلاه، وأوافق عليها بالكامل وبلا قيد أو شرط.
              </span>
            </label>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-[10px] text-slate-400 font-bold">
              تاريخ التحديث: {terms.lastUpdated}
            </span>

            <div className="flex items-center gap-2">
              {!isMandatoryAcceptance && (
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs rounded-xl transition-all cursor-pointer"
                >
                  إغلاق
                </button>
              )}

              {(showAcceptButton || isMandatoryAcceptance) && (
                <button
                  type="button"
                  disabled={!isCheckedConsent}
                  onClick={handleConfirmAgreement}
                  className={`py-2 px-5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                    isCheckedConsent
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 shadow-emerald-600/20"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>موافق ومتابعة التسجيل</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
