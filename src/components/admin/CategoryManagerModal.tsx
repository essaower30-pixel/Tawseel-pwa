import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Tag,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  ArrowUpToLine,
  ArrowDownToLine,
  TrendingUp,
  Check,
  Eye,
  EyeOff,
  Store as StoreIcon,
  HelpCircle,
  X,
  Edit2,
  Save,
  Layers
} from "lucide-react";
import { Category, Store } from "../../types";
import { CategoryIcon, AVAILABLE_CATEGORY_ICONS } from "../CategoryIcon";
import { initialCategories } from "../../data/initialData";

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  stores: Store[];
  onReorderCategories: (newCategories: Category[]) => void;
  onAddCategory: (category: Category) => void;
  onUpdateCategory?: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  initialOpenAddForm?: boolean;
}

export const POPULAR_CATEGORY_PRESETS = [
  { label: "لحوم وملاحم وجزارة", icon: "Beef", emoji: "🥩" },
  { label: "أدوات منزلية ومطابخ", icon: "Home", emoji: "🍳" },
  { label: "مخابز وأفران ومعجنات", icon: "Croissant", emoji: "🥐" },
  { label: "ألبان وأجبان ومشتقاتها", icon: "Milk", emoji: "🥛" },
  { label: "أسماك ومأكولات بحرية", icon: "Fish", emoji: "🐟" },
  { label: "فواكه وخضار منتقاة", icon: "Apple", emoji: "🍎" },
  { label: "بيتزا وفطائر سريعة", icon: "Pizza", emoji: "🍕" },
  { label: "إلكترونيات وموبايلات", icon: "Smartphone", emoji: "📱" },
  { label: "مستلزمات أطفال ومواليد", icon: "Baby", emoji: "👶" },
  { label: "أحذية وحقائب جلدية", icon: "Footprints", emoji: "👟" },
  { label: "عطور وهدايا وتحف", icon: "Gift", emoji: "🎁" },
  { label: "ألعاب ومستلزمات ترفيه", icon: "Gamepad2", emoji: "🎮" }
];

export const detectIconFromName = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("لحم") || lower.includes("جزار") || lower.includes("قصاب") || lower.includes("مفروم") || lower.includes("كباب")) return "Beef";
  if (lower.includes("ملابس") || lower.includes("لباس") || lower.includes("ثياب") || lower.includes("أزياء") || lower.includes("قميص") || lower.includes("فستان") || lower.includes("البسة") || lower.includes("ألبسة") || lower.includes("بسة")) return "Shirt";
  if (lower.includes("مخبز") || lower.includes("أفران") || lower.includes("فرن") || lower.includes("معجنات") || lower.includes("كرواسان") || lower.includes("خبز")) return "Croissant";
  if (lower.includes("لبن") || lower.includes("حليب") || lower.includes("جبن") || lower.includes("ألبان") || lower.includes("مشتقات")) return "Milk";
  if (lower.includes("سمك") || lower.includes("أسماك") || lower.includes("جمبري") || lower.includes("بحري")) return "Fish";
  if (lower.includes("فواكه") || lower.includes("فاكهة") || lower.includes("تفاح") || lower.includes("تمر")) return "Apple";
  if (lower.includes("بيتزا") || lower.includes("فطائر")) return "Pizza";
  if (lower.includes("أطفال") || lower.includes("رضيع") || lower.includes("مواليد") || lower.includes("حفاضات") || lower.includes("بيبي")) return "Baby";
  if (lower.includes("حذاء") || lower.includes("أحذية") || lower.includes("شنط") || lower.includes("حقائب")) return "Footprints";
  if (lower.includes("ساعات") || lower.includes("ساعة") || lower.includes("إكسسوار")) return "Watch";
  if (lower.includes("موبايل") || lower.includes("هاتف") || lower.includes("جوال") || lower.includes("إلكترونيات") || lower.includes("شواحن")) return "Smartphone";
  if (lower.includes("مفروشات") || lower.includes("أثاث") || lower.includes("ستائر") || lower.includes("سجاد") || lower.includes("ديكور")) return "Home";
  if (lower.includes("عطر") || lower.includes("بخور") || lower.includes("هدية") || lower.includes("هدايا") || lower.includes("ورد") || lower.includes("زهور")) return "Gift";
  if (lower.includes("كافيه") || lower.includes("قهوة") || lower.includes("بن") || lower.includes("محمصة") || lower.includes("شاي")) return "Coffee";
  if (lower.includes("حلاقة") || lower.includes("صالون") || lower.includes("كوافير") || lower.includes("تجميل")) return "Scissors";
  if (lower.includes("صيدل") || lower.includes("دواء") || lower.includes("علاج") || lower.includes("أدوية")) return "Pill";
  if (lower.includes("طرد") || lower.includes("شحن") || lower.includes("توصيل سريع")) return "Package";
  return "ShoppingBag";
};

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  stores,
  onReorderCategories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  initialOpenAddForm = false
}) => {
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("ShoppingBag");
  const [showAddForm, setShowAddForm] = useState(initialOpenAddForm);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  // Editing state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editIcon, setEditIcon] = useState("ShoppingBag");

  // Deletion confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleExecuteDelete = (cat: Category) => {
    onDeleteCategory(cat.id);
    setConfirmDeleteId(null);
    triggerSaveFeedback(`تم حذف تصنيف "${cat.label}" بنجاح 🗑️`);
  };

  useEffect(() => {
    if (initialOpenAddForm) {
      setShowAddForm(true);
    }
  }, [initialOpenAddForm, isOpen]);

  if (!isOpen) return null;

  // Move item in array helper
  const moveCategory = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= categories.length || fromIndex === toIndex) return;
    const updated = [...categories];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);
    onReorderCategories(updated);
    triggerSaveFeedback("تم تحديث ترتيب التصنيفات وحفظه بنجاح");
  };

  const moveToTop = (index: number) => {
    moveCategory(index, 0);
  };

  const moveToBottom = (index: number) => {
    moveCategory(index, categories.length - 1);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    moveCategory(draggedIndex, dropIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Smart Sort: By most stores (demand) with Offers at top
  const handleSortByPopularity = () => {
    const sorted = [...categories].sort((a, b) => {
      if (a.id === "offers") return -1;
      if (b.id === "offers") return 1;
      const countA = stores.filter((s) => s.category === a.id).length;
      const countB = stores.filter((s) => s.category === b.id).length;
      return countB - countA;
    });
    onReorderCategories(sorted);
    triggerSaveFeedback("تم ترتيب التصنيفات حسب الأكثر طلباً ومتاجر");
  };

  // Reset to default categories
  const handleResetToDefault = () => {
    if (confirm("هل تريد استعادة الترتيب الافتراضي للتصنيفات؟")) {
      const existingIds = new Set(initialCategories.map((c) => c.id));
      const customOnes = categories.filter((c) => !existingIds.has(c.id));
      const merged = [...initialCategories, ...customOnes];
      onReorderCategories(merged);
      triggerSaveFeedback("تمت استعادة الترتيب الافتراضي");
    }
  };

  const triggerSaveFeedback = (msg = "تم الحفظ بنجاح") => {
    setStatusMessage(msg);
    setSaveSuccessNotice(true);
    setTimeout(() => {
      setSaveSuccessNotice(false);
      setStatusMessage(null);
    }, 2800);
  };

  const handleLabelChange = (val: string) => {
    setNewCatLabel(val);
    const suggested = detectIconFromName(val);
    setNewCatIcon(suggested);
  };

  const handleAddSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newCatLabel.trim();
    if (!clean) return;

    // Check duplicate
    const norm = (s: string) => s.replace(/\s+/g, "").replace(/^(ال)/, "");
    const exists = categories.some(
      (c) => norm(c.label) === norm(clean) || c.label.trim().toLowerCase() === clean.toLowerCase()
    );
    if (exists) {
      alert(`التصنيف "${clean}" موجود مسبقاً في القائمة!`);
      return;
    }

    const id = "cat_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newCategory: Category = {
      id,
      label: clean,
      icon: newCatIcon
    };

    onAddCategory(newCategory);
    setNewCatLabel("");
    setNewCatIcon("ShoppingBag");
    setShowAddForm(false);
    setNewlyAddedId(id);
    setTimeout(() => setNewlyAddedId(null), 4000);
    triggerSaveFeedback(`تمت إضافة تصنيف "${clean}" وحفظه سحابياً بنجاح! 🎉`);
  };

  const handleQuickAddPreset = (preset: { label: string; icon: string; emoji: string }) => {
    // Check if already exists
    const norm = (s: string) => s.replace(/\s+/g, "").replace(/^(ال)/, "");
    const exists = categories.find((c) => norm(c.label) === norm(preset.label) || c.label.includes(preset.label) || preset.label.includes(c.label));
    if (exists) {
      triggerSaveFeedback(`تصنيف "${exists.label}" موجود مسبقاً في القائمة`);
      return;
    }

    const id = "cat_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newCategory: Category = {
      id,
      label: preset.label,
      icon: preset.icon
    };

    onAddCategory(newCategory);
    setNewlyAddedId(id);
    setTimeout(() => setNewlyAddedId(null), 4000);
    triggerSaveFeedback(`تمت إضافة وتفعيل تصنيف "${preset.label}" فوراً! 🎉`);
  };

  const startEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditLabel(cat.label);
    setEditIcon(cat.icon);
  };

  const saveEditCategory = () => {
    if (!editingCatId || !editLabel.trim()) return;
    if (onUpdateCategory) {
      onUpdateCategory({
        id: editingCatId,
        label: editLabel.trim(),
        icon: editIcon
      });
    } else {
      const updated = categories.map((c) =>
        c.id === editingCatId ? { ...c, label: editLabel.trim(), icon: editIcon } : c
      );
      onReorderCategories(updated);
    }
    setEditingCatId(null);
    triggerSaveFeedback("تم تحديث بيانات التصنيف بنجاح");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 25, scale: 0.98 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl border border-slate-200 shadow-2xl flex flex-col h-[94dvh] sm:h-auto sm:max-h-[90vh] text-right my-0 sm:my-auto overflow-hidden"
        dir="rtl"
      >
        {/* Mobile Sheet Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-3.5 py-3 sm:px-5 sm:py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span>إدارة وإضافة التصنيفات</span>
                <span className="text-[10px] sm:text-[11px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                  شامل المنصة 🏷️
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300 font-semibold truncate">
                أضف تصنيفات عامة جديدة (ملابس، لحوم...) ورتّب ظهورها
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Single Smooth Scrollable Body Container */}
        <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-100">
          {/* Live Preview Bar */}
          <div className="bg-slate-50 p-2.5 sm:p-3.5">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-black text-slate-700 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>معاينة حية لشريط الصفحة الرئيسية:</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                ({categories.length} تصنيف)
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
              {/* All stores fixed tab */}
              <div className="shrink-0 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-[11px] font-extrabold flex items-center gap-1 opacity-60">
                <StoreIcon className="w-3 h-3 text-orange-500" />
                <span>جميع المحلات</span>
              </div>

              {/* Dynamic categories preview */}
              {categories.map((cat, idx) => {
                const isOffers = cat.id === "offers";
                return (
                  <div
                    key={cat.id}
                    className={`shrink-0 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border text-[11px] font-extrabold flex items-center gap-1.5 shadow-2xs transition-all ${
                      idx === 0
                        ? isOffers
                          ? "bg-red-600 text-white border-red-700 ring-2 ring-red-400/30"
                          : "bg-orange-500 text-white border-orange-600 ring-2 ring-orange-400/30"
                        : isOffers
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-white text-slate-800 border-slate-200"
                    }`}
                  >
                    <CategoryIcon name={cat.icon} className={`w-3.5 h-3.5 ${isOffers ? "text-red-500" : "text-orange-600"}`} />
                    <span>{cat.label}</span>
                    {idx === 0 && <span className="text-[9px] bg-white/20 px-1 rounded-md">الأول ⭐</span>}
                    {isOffers && idx !== 0 && <span className="text-[9px] bg-red-100 text-red-700 px-1 rounded-md">🔥</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Presets Section (One-click fill) */}
          <div className="bg-amber-50/70 p-2.5 sm:p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>تصنيفات رئيسية شائعة (انقر للإضافة الفورية):</span>
              </span>
              <span className="text-[10px] font-bold text-amber-800/80 hidden sm:inline">
                لحوم، ملابس، مخابز، أسماك...
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-none">
              {POPULAR_CATEGORY_PRESETS.map((preset) => {
                const alreadyExists = categories.some((c) => c.label.includes(preset.label) || preset.label.includes(c.label));
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleQuickAddPreset(preset)}
                    className={`text-[10px] sm:text-[11px] font-bold py-1 px-2.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                      alreadyExists
                        ? "bg-amber-100/60 border-amber-300/60 text-amber-900 opacity-70"
                        : "bg-white hover:bg-amber-100 border-amber-300 text-amber-950 shadow-2xs hover:border-amber-400"
                    }`}
                    title={alreadyExists ? "مضاف مسبقاً" : "انقر لإضافة هذا التصنيف"}
                  >
                    <span>{preset.emoji}</span>
                    <span>{preset.label}</span>
                    {alreadyExists ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Plus className="w-3 h-3 text-amber-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Control Toolbar */}
          <div className="p-2.5 sm:p-3.5 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className={`w-full sm:w-auto text-xs font-black py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 ${
                showAddForm
                  ? "bg-slate-800 text-white"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? "إغلاق نموذج الإضافة" : "➕ إضافة تصنيف رئيسي جديد"}</span>
            </button>

            <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
              {/* Sort by most stores */}
              <button
                type="button"
                onClick={handleSortByPopularity}
                className="text-[11px] sm:text-xs font-black py-2 px-2.5 sm:px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
                title="ترتيب التصنيفات حسب عدد المتاجر النشطة تلقائياً"
              >
                <TrendingUp className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span>حسب الأكثر طلباً 📈</span>
              </button>

              {/* Reset to default */}
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-[11px] sm:text-xs font-bold py-2 px-2.5 sm:px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>استعادة الترتيب</span>
              </button>
            </div>
          </div>

          {/* Add Category Collapsible Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-emerald-50/90 border-b border-emerald-200 p-3 sm:p-4"
              >
                <form onSubmit={handleAddSubmit} className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-950 font-black text-xs">
                    <Tag className="w-4 h-4 text-emerald-700" />
                    <span>بيانات التصنيف العام الجديد:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">
                        اسم التصنيف الرئيسي: *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCatLabel}
                        onChange={(e) => handleLabelChange(e.target.value)}
                        placeholder="مثال: لحوم وملاحم، ملابس وأزياء، مخابز..."
                        className="w-full py-2 sm:py-2.5 px-3 bg-white border border-emerald-300 rounded-xl text-xs font-bold focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/20 text-slate-900 shadow-2xs"
                        autoFocus
                      />
                      <p className="text-[10px] text-slate-500 font-semibold mt-1">
                        💡 سيتم اختيار الأيقونة المناسبة تلقائياً حسب الكلمة التي تكتبها.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">
                        أيقونة وشكل التصنيف:
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
                          <CategoryIcon name={newCatIcon} className="w-5 h-5 text-emerald-600" />
                        </div>
                        <select
                          value={newCatIcon}
                          onChange={(e) => setNewCatIcon(e.target.value)}
                          className="w-full py-2 sm:py-2.5 px-3 bg-white border border-emerald-300 rounded-xl text-xs font-bold focus:outline-hidden focus:border-emerald-600 text-slate-900 shadow-2xs"
                        >
                          {AVAILABLE_CATEGORY_ICONS.map((icon) => (
                            <option key={icon.id} value={icon.id}>
                              {icon.label} ({icon.id})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewCatLabel("");
                      }}
                      className="py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer text-center"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer active:scale-95 flex items-center justify-center gap-2 text-center"
                    >
                      <Check className="w-4 h-4" />
                      <span>حفظ ونشر التصنيف في المنصة فوراً ✓</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notice Info / Success Banner */}
          <div className="px-3 sm:px-4 py-2 bg-blue-50/70 flex items-center justify-between text-xs text-blue-900 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-bold text-blue-800">
                اسحب من المقبض <strong>(⋮⋮)</strong> أو استخدم أزرار الأسهم لترتيب الأقسام.
              </span>
            </div>
            {saveSuccessNotice && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[10px] sm:text-[11px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0 shadow-xs whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{statusMessage || "تم الحفظ فوراً"}</span>
              </motion.span>
            )}
          </div>

          {/* Drag & Drop Categories List */}
          <div className="p-2.5 sm:p-4 space-y-2">
            {categories.map((cat, index) => {
              const isOffers = cat.id === "offers";
              const storeCount = stores.filter((s) => s.category === cat.id).length;
              const isDragging = draggedIndex === index;
              const isOver = dragOverIndex === index;
              const isEditing = editingCatId === cat.id;

              return (
                <div
                  key={cat.id}
                  draggable={!isEditing}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`transition-all ${
                    isDragging
                      ? "opacity-30 scale-98"
                      : isOver
                      ? "border-t-2 border-orange-500 transform translate-y-1"
                      : ""
                  }`}
                >
                  {isEditing ? (
                    <div className="p-3 bg-orange-50/90 rounded-2xl border border-orange-300 space-y-3">
                      <div className="flex items-center justify-between text-xs font-black text-orange-950">
                        <span>تعديل بيانات التصنيف:</span>
                        <button
                          type="button"
                          onClick={() => setEditingCatId(null)}
                          className="text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="py-2 px-3 bg-white border border-orange-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
                          placeholder="اسم التصنيف"
                        />
                        <select
                          value={editIcon}
                          onChange={(e) => setEditIcon(e.target.value)}
                          className="py-2 px-3 bg-white border border-orange-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500"
                        >
                          {AVAILABLE_CATEGORY_ICONS.map((icon) => (
                            <option key={icon.id} value={icon.id}>
                              {icon.label} ({icon.id})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingCatId(null)}
                          className="py-1.5 px-3 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="button"
                          onClick={saveEditCategory}
                          className="py-1.5 px-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black rounded-lg cursor-pointer shadow-xs"
                        >
                          حفظ التعديل ✓
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`p-2.5 sm:p-3 rounded-2xl border transition-all ${
                        newlyAddedId === cat.id
                          ? "ring-2 ring-emerald-500 bg-emerald-50/80 border-emerald-400 shadow-md"
                          : index === 0
                          ? isOffers
                            ? "bg-red-50/70 border-red-200/90 shadow-2xs"
                            : "bg-orange-50/50 border-orange-200/90 shadow-2xs"
                          : isOffers
                          ? "bg-red-50/40 hover:bg-red-50/70 border-red-200/70"
                          : "bg-slate-50/80 hover:bg-slate-100/80 border-slate-200/70"
                      }`}
                    >
                      {/* Main Info Row */}
                      <div className="flex items-center justify-between gap-2">
                        {/* Right: Drag Handle, Rank Badge, Icon, Label & Store Count */}
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          {/* Drag Grip Handle */}
                          <div
                            className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors shrink-0"
                            title="اسحب لتغيير الترتيب"
                          >
                            <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>

                          {/* Rank Badge */}
                          <div
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              newlyAddedId === cat.id
                                ? "bg-emerald-600 text-white shadow-xs"
                                : index === 0
                                ? isOffers
                                  ? "bg-red-600 text-white shadow-xs"
                                  : "bg-orange-500 text-white shadow-xs"
                                : index === 1
                                ? "bg-slate-800 text-white"
                                : isOffers
                                ? "bg-red-500 text-white"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {index + 1}
                          </div>

                          {/* Category Icon */}
                          <div className={`w-8 h-8 rounded-xl bg-white border flex items-center justify-center shrink-0 shadow-2xs ${
                            newlyAddedId === cat.id
                              ? "border-emerald-300 text-emerald-600"
                              : isOffers
                              ? "border-red-200 text-red-600"
                              : "border-slate-200 text-orange-600"
                          }`}>
                            <CategoryIcon name={cat.icon} className={`w-4 h-4 ${newlyAddedId === cat.id ? "text-emerald-600" : isOffers ? "text-red-500" : "text-orange-600"}`} />
                          </div>

                          {/* Category Title & Store Count */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                                {cat.label}
                              </span>
                              {newlyAddedId === cat.id && (
                                <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-600 text-white animate-pulse">
                                  مضاف حديثاً ✨
                                </span>
                              )}
                              {index === 0 && (
                                <span className={`text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${
                                  isOffers ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"
                                }`}>
                                  في الصدارة ⭐
                                </span>
                              )}
                              {isOffers && index !== 0 && (
                                <span className="text-[9px] sm:text-[10px] font-black bg-red-100 text-red-800 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                                  عروض 🔥
                                </span>
                              )}
                              {cat.isHidden && (
                                <span className="text-[9px] sm:text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-0.5">
                                  <EyeOff className="w-2.5 h-2.5 text-amber-800" />
                                  <span>مخفي</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate">
                              {isOffers
                                ? "تخفيضات وعروض حصرية للمتاجر"
                                : storeCount === 0
                                ? "لا توجد متاجر بعد"
                                : `${storeCount} ${storeCount === 1 ? "متجر مسجل" : "متاجر مسجلة"}`}
                            </p>
                          </div>
                        </div>

                        {/* Desktop Controls (visible on sm and up) */}
                        <div className="hidden sm:flex items-center gap-1 shrink-0 mr-2">
                          {/* Move to Top button */}
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => moveToTop(index)}
                              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                                isOffers
                                  ? "text-red-500 hover:text-red-700 hover:bg-red-100"
                                  : "text-slate-400 hover:text-orange-600 hover:bg-orange-50"
                              }`}
                              title="نقل إلى الصدارة فوراً"
                            >
                              <ArrowUpToLine className="w-4 h-4" />
                            </button>
                          )}

                          {/* Move Up */}
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveCategory(index, index - 1)}
                            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                              index === 0
                                ? "text-slate-300 opacity-40 cursor-not-allowed"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                            }`}
                            title="تحريك لأعلى"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>

                          {/* Move Down */}
                          <button
                            type="button"
                            disabled={index === categories.length - 1}
                            onClick={() => moveCategory(index, index + 1)}
                            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                              index === categories.length - 1
                                ? "text-slate-300 opacity-40 cursor-not-allowed"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                            }`}
                            title="تحريك لأسفل"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>

                          {/* Move to Bottom */}
                          {index < categories.length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveToBottom(index)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                              title="نقل إلى النهاية"
                            >
                              <ArrowDownToLine className="w-4 h-4" />
                            </button>
                          )}

                          {/* Inline Deletion Confirmation on Desktop */}
                          {confirmDeleteId === cat.id ? (
                            <div className="flex items-center gap-1.5 bg-red-50 py-1 px-2 rounded-xl border border-red-200 text-xs animate-in fade-in mr-1">
                              <span className="font-bold text-red-700 text-[11px] whitespace-nowrap">
                                حذف؟ {storeCount > 0 ? `(${storeCount} متجر)` : ""}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleExecuteDelete(cat)}
                                className="py-1 px-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-black shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                              >
                                تأكيد 🗑️
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="py-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* Hide / Show Category Button */}
                              {onUpdateCategory && !isOffers && (
                                <button
                                  type="button"
                                  onClick={() => onUpdateCategory({ ...cat, isHidden: !cat.isHidden })}
                                  className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                                    cat.isHidden
                                      ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                                  }`}
                                  title={cat.isHidden ? "التصنيف مخفي حالياً - انقر لإظهاره للزبائن" : "إخفاء التصنيف عن شريط الرئيسية"}
                                >
                                  {cat.isHidden ? <EyeOff className="w-4 h-4 text-amber-800" /> : <Eye className="w-4 h-4" />}
                                </button>
                              )}

                              {/* Edit Category Button */}
                              {!isOffers && (
                                <button
                                  type="button"
                                  onClick={() => startEditCategory(cat)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                                  title="تعديل اسم أو أيقونة التصنيف"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}

                              {/* Delete Category */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (isOffers) {
                                    alert("تصنيف (العروض الحالية) هو قسم رئيسي للتطبيق لا يمكن حذفه، ويمكنك تغيير ترتيبه ونقله لأي موضع تريده.");
                                    return;
                                  }
                                  setConfirmDeleteId(cat.id);
                                }}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer mr-0.5"
                                title="حذف التصنيف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Mobile Dedicated Action Row (Only visible on mobile screens) */}
                      <div className="sm:hidden flex items-center justify-between pt-2 mt-2 border-t border-slate-200/70">
                        {/* Reorder Buttons */}
                        <div className="flex items-center gap-1">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => moveToTop(index)}
                              className="p-1.5 text-slate-500 hover:text-orange-600 bg-white border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-0.5 active:scale-95"
                              title="نقل للصدارة"
                            >
                              <ArrowUpToLine className="w-3.5 h-3.5 text-orange-500" />
                              <span>الأول</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveCategory(index, index - 1)}
                            className={`p-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-0.5 active:scale-95 ${
                              index === 0 ? "opacity-40 cursor-not-allowed" : "text-slate-700"
                            }`}
                            title="تحريك لأعلى"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>أعلى</span>
                          </button>

                          <button
                            type="button"
                            disabled={index === categories.length - 1}
                            onClick={() => moveCategory(index, index + 1)}
                            className={`p-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-0.5 active:scale-95 ${
                              index === categories.length - 1 ? "opacity-40 cursor-not-allowed" : "text-slate-700"
                            }`}
                            title="تحريك لأسفل"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>أسفل</span>
                          </button>

                          {index < categories.length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveToBottom(index)}
                              className="p-1.5 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-0.5 active:scale-95"
                              title="نقل للنهاية"
                            >
                              <ArrowDownToLine className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        {confirmDeleteId === cat.id ? (
                          <div className="flex items-center gap-1.5 bg-red-50 p-1.5 rounded-lg border border-red-200 text-xs">
                            <span className="font-bold text-red-700 text-[10px]">
                              تأكيد الحذف؟ {storeCount > 0 ? `(${storeCount})` : ""}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleExecuteDelete(cat)}
                              className="py-1 px-2 bg-red-600 text-white rounded-md text-[10px] font-black active:scale-95 cursor-pointer"
                            >
                              احذف 🗑️
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="py-1 px-1.5 bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {onUpdateCategory && !isOffers && (
                              <button
                                type="button"
                                onClick={() => onUpdateCategory({ ...cat, isHidden: !cat.isHidden })}
                                className={`py-1 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 active:scale-95 ${
                                  cat.isHidden
                                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                {cat.isHidden ? <EyeOff className="w-3 h-3 text-amber-800" /> : <Eye className="w-3 h-3" />}
                                <span>{cat.isHidden ? "إظهار" : "إخفاء"}</span>
                              </button>
                            )}

                            {!isOffers && (
                              <button
                                type="button"
                                onClick={() => startEditCategory(cat)}
                                className="py-1 px-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg text-[10px] font-bold flex items-center gap-1 active:scale-95"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>تعديل</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (isOffers) {
                                  alert("تصنيف (العروض الحالية) هو قسم رئيسي للتطبيق لا يمكن حذفه.");
                                  return;
                                }
                                setConfirmDeleteId(cat.id);
                              }}
                              className="py-1 px-2 text-red-700 bg-red-50 border border-red-200 rounded-lg text-[10px] font-bold flex items-center gap-1 active:scale-95"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>حذف</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 gap-2">
          <div className="text-[11px] sm:text-xs text-slate-600 font-bold">
            التصنيفات: <strong className="text-slate-900">{categories.length}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 sm:px-6 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>حفظ وإغلاق نافذة التصنيفات</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
