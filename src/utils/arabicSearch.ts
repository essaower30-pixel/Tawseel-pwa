/**
 * نظام البحث العربي الذكي والمرن (Smart Arabic Search & Normalization)
 * -------------------------------------------------------------------
 * يضمن عدم تقيد التطبيق بحرفية الكلمات:
 * 1. تطبيع كافة أشكال الهمزات (أ, إ, آ, ٱ, ء, ئ, ؤ)
 * 2. تطبيع التاء المربوطة والهاء (ة, ه)
 * 3. تطبيع الألف المقصورة والياء (ى, ي)
 * 4. تجاهل كافة حركات التشكيل والتنوين والشدة والتطويل
 * 5. المرونة مع "الـ" التعريف (البحث بـ "اسنان" يجد "الأسنان" والعكس)
 * 6. البحث متعدد الكلمات (Multi-word query matching) بأي ترتيب
 */

export function normalizeArabicForSearch(text?: string): string {
  if (!text) return "";
  return String(text)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "") // إزالة التشكيل والتنوين والتطويل (ـ)
    .replace(/[أإآٱ]/g, "ا")                     // توحيد الألفات
    .replace(/[ة]/g, "ه")                         // توحيد التاء المربوطة
    .replace(/[ى]/g, "ي")                         // توحيد الألف المقصورة
    .replace(/[ؤ]/g, "و")                         // واو بهمزة
    .replace(/[ئ]/g, "ي")                         // نبرة بهمزة
    .replace(/[^a-z0-9\u0600-\u06FF\s]/gi, " ")  // استبدال الرموز الخاصة بمسافات
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * حذف "الـ" التعريف من بداية الكلمة إذا كانت مكونة من 4 أحرف أو أكثر
 * مثال: "الاسنان" -> "اسنان" | "المطعم" -> "مطعم" | "الله" لا تحذف
 */
export function stripLeadingAl(word: string): string {
  if (word.startsWith("ال") && word.length >= 4) {
    return word.slice(2);
  }
  return word;
}

/**
 * فحص التطابق الذكي بين نص معين وكلمات البحث
 * @param targetText النص المراد البحث فيه (مثل اسم المتجر، اسم الطبيب، الاختصاص، اسم المنتج...)
 * @param query نص البحث المدخل من المستخدم
 */
export function matchesArabicSearch(targetText: string, query: string): boolean {
  if (!query || !query.trim()) return true;
  if (!targetText) return false;

  const normTarget = normalizeArabicForSearch(targetText);
  const normQuery = normalizeArabicForSearch(query);

  if (!normQuery) return true;

  // 1. فحص التطابق المباشر بعد التطبيع
  if (normTarget.includes(normQuery)) return true;

  // 2. استخراج كلمات البحث وكلمات الهدف
  const queryWords = normQuery.split(/\s+/).filter(Boolean);
  const targetWords = normTarget.split(/\s+/).filter(Boolean);

  const queryWordsNoAl = queryWords.map(stripLeadingAl);
  const targetWordsNoAl = targetWords.map(stripLeadingAl);
  const normTargetNoAl = targetWordsNoAl.join(" ");
  const normQueryNoAl = queryWordsNoAl.join(" ");

  // 3. فحص الجملة كاملة بعد حذف "الـ" التعريف
  if (normTargetNoAl.includes(normQueryNoAl) || normTarget.includes(normQueryNoAl)) {
    return true;
  }

  // 4. فحص كل كلمة بحث على حدة (All search tokens must match somewhere)
  return queryWords.every((qWord, idx) => {
    const qWordNoAl = queryWordsNoAl[idx];

    // تطابق مع النص الكامل أو النص المنزوع منه "الـ"
    if (normTarget.includes(qWord) || normTarget.includes(qWordNoAl) || normTargetNoAl.includes(qWordNoAl)) {
      return true;
    }

    // تطابق مع أي كلمة من كلمات الهدف
    return targetWords.some((tWord, tIdx) => {
      const tWordNoAl = targetWordsNoAl[tIdx];

      return (
        tWord.includes(qWord) ||
        tWord.includes(qWordNoAl) ||
        tWordNoAl.includes(qWord) ||
        tWordNoAl.includes(qWordNoAl) ||
        qWord.includes(tWord) ||
        qWordNoAl.includes(tWordNoAl)
      );
    });
  });
}
