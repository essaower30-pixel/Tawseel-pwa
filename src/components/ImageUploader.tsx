import React, { useRef, useState } from "react";
import { Camera, Image as ImageIcon, Trash2, CheckCircle2, RefreshCw, Upload, Sparkles } from "lucide-react";

interface ImageUploaderProps {
  value: string;
  onChange: (base64Image: string) => void;
  label?: string;
  helperText?: string;
  aspectRatio?: "square" | "wide";
  maxDimension?: number;
  quality?: number;
  presets?: { label: string; url: string; emoji: string }[];
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = "الصورة",
  helperText = "يمكنك التقاط صورة بالكاميرا أو استيرادها من المعرض",
  aspectRatio = "wide",
  maxDimension = 640,
  quality = 0.80,
  presets
}) => {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [fileSizeKb, setFileSizeKb] = useState<number | null>(() => {
    if (value && value.startsWith("data:image")) {
      return Math.round((value.length * 3) / 4 / 1024);
    }
    return null;
  });

  const processFile = (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP).");
      return;
    }

    setIsCompressing(true);

    const reader = new FileReader();
    reader.onerror = () => {
      setIsCompressing(false);
      alert("حدث خطأ أثناء قراءة الصورة. يرجى المحاولة مرة أخرى.");
    };

    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();

      img.onerror = () => {
        setIsCompressing(false);
        alert("تعذر تحميل ملف الصورة. يرجى اختيار صورة أخرى.");
      };

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = maxDimension;

          // Downscale to optimal dimensions to preserve maximum storage space & instant PWA loading
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            setIsCompressing(false);
            onChange(src);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to light & crisp JPEG at quality ~0.8
          const compressed = canvas.toDataURL("image/jpeg", quality);
          const kb = Math.round((compressed.length * 3) / 4 / 1024);
          
          setFileSizeKb(kb);
          onChange(compressed);
        } catch (err) {
          console.warn("Canvas compression fallback:", err);
          onChange(src);
        } finally {
          setIsCompressing(false);
        }
      };

      img.src = src;
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset inputs so user can choose the same photo again if desired
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleRemove = () => {
    onChange("");
    setFileSizeKb(null);
  };

  const hasImage = Boolean(value && value.trim().length > 0);

  return (
    <div className="space-y-2 text-right" dir="rtl">
      {/* Hidden File Inputs */}
      {/* Gallery / Studio import input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Direct Camera capture input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Label and size indicator */}
      <div className="flex items-center justify-between">
        <label className="block font-black text-xs sm:text-sm text-slate-800">
          {label} *
        </label>
        {fileSizeKb !== null && hasImage && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>حجم فائق الخفة: {fileSizeKb} KB (آمن وسريع)</span>
          </span>
        )}
      </div>

      {/* Preview and Upload Container */}
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 hover:border-orange-300 rounded-3xl p-3 sm:p-4 transition-all space-y-3">
        {hasImage ? (
          <div className="relative group rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs">
            <img
              src={value}
              alt="معاينة الصورة"
              className={`w-full object-cover transition-transform group-hover:scale-105 duration-300 ${
                aspectRatio === "square" ? "h-44 sm:h-52" : "h-36 sm:h-44"
              }`}
              onError={(e) => {
                // Fallback placeholder on broken URL
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60";
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between p-3">
              <div className="text-white text-xs font-bold flex items-center gap-1.5 drop-shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>تم إدراج الصورة وضغطها بنجاح</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="p-2 bg-white/90 hover:bg-white text-slate-800 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  title="استبدال من المعرض"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-orange-600" />
                  <span className="hidden sm:inline text-[11px]">استبدال</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  title="حذف الصورة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">حذف</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State Dropzone */
          <div className="py-6 px-4 text-center flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-orange-100/80 text-orange-600 flex items-center justify-center shadow-xs">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <p className="font-black text-xs sm:text-sm text-slate-700">
                اختر طريقة إدراج الصورة
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                {helperText}
              </p>
            </div>
          </div>
        )}

        {/* Buttons Row: Camera & Gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {/* Gallery / Studio Button */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={isCompressing}
            className="py-3 px-3 rounded-2xl bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-800 font-black text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <ImageIcon className="w-4 h-4 text-orange-500 shrink-0" />
            <span>{isCompressing ? "جاري المعالجة..." : "استيراد من الاستديو / المعرض 🖼️"}</span>
          </button>

          {/* Camera Capture Button */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isCompressing}
            className="py-3 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Camera className="w-4 h-4 text-orange-400 shrink-0" />
            <span>{isCompressing ? "جاري المعالجة..." : "التقاط فوري بالكاميرا 📸"}</span>
          </button>
        </div>

        {/* Optional Presets */}
        {presets && presets.length > 0 && (
          <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 block flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>أو اختر من النماذج الجاهزة السريعة:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onChange(p.url);
                    setFileSizeKb(null);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-xl text-[11px] font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <span>{p.emoji}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
        🛡️ يتم ضغط وتحسين الصور تلقائياً لتبقى خفيفة جداً، مع الحفاظ على سرعة التصفح وسعة تثبيت التطبيق (PWA) دون أي بطء.
      </p>
    </div>
  );
};
