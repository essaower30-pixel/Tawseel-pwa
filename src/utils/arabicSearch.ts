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

  // 1. فحص التطابق التام أو تطابق العبارة الكاملة (للاستعلامات المكونة من حرفين فأكثر)
  if (normQuery.length >= 2) {
    if (normTarget.includes(normQuery)) return true;
  }

  // 2. استخراج كلمات البحث وكلمات الهدف
  const queryWords = normQuery.split(/\s+/).filter(Boolean);
  const targetWords = normTarget.split(/\s+/).filter(Boolean);

  if (queryWords.length === 0) return true;
  if (targetWords.length === 0) return false;

  const queryWordsNoAl = queryWords.map(stripLeadingAl);
  const targetWordsNoAl = targetWords.map(stripLeadingAl);
  const normTargetNoAl = targetWordsNoAl.join(" ");
  const normQueryNoAl = queryWordsNoAl.join(" ");

  // 3. فحص الجملة كاملة بعد حذف "الـ" التعريف (إذا كانت 3 أحرف فأكثر)
  if (normQueryNoAl.length >= 3) {
    if (normTargetNoAl.includes(normQueryNoAl) || normTarget.includes(normQueryNoAl)) {
      return true;
    }
  }

  // 4. فحص كل كلمة بحث على حدة (يجب أن تتطابق كل كلمة من كلمات البحث مع كلمة مستهدفة)
  return queryWords.every((qWord, idx) => {
    const qWordNoAl = queryWordsNoAl[idx];
    const qLen = qWord.length;
    const qNoAlLen = qWordNoAl.length;

    // إذا كانت كلمة البحث حرفاً واحداً (مثل "ع" أو "م"):
    // يجب أن تبدأ بها إحدى كلمات الهدف حصراً، ولا نستخدم includes منعاً للتطابق مع كل الحروف!
    if (qLen === 1) {
      return targetWords.some((tWord, tIdx) => {
        const tWordNoAl = targetWordsNoAl[tIdx];
        return tWord.startsWith(qWord) || tWordNoAl.startsWith(qWord);
      });
    }

    // فحص التطابق مع كلمات الهدف
    return targetWords.some((tWord, tIdx) => {
      const tWordNoAl = targetWordsNoAl[tIdx];

      // 1. التطابق التام
      if (
        tWord === qWord ||
        tWord === qWordNoAl ||
        tWordNoAl === qWord ||
        tWordNoAl === qWordNoAl
      ) {
        return true;
      }

      // 2. تطابق البداية (Prefix) مثل "سمي" -> "سمير" أو "اسنان" -> "اسنانهم"
      if (
        tWord.startsWith(qWord) ||
        tWord.startsWith(qWordNoAl) ||
        tWordNoAl.startsWith(qWord) ||
        tWordNoAl.startsWith(qWordNoAl)
      ) {
        return true;
      }

      // 3. التطابق الجزئي داخل الكلمة فقط للكلمات المكونة من 3 أحرف فأكثر (مثل "كنعان" في "الكنعان")
      if (qLen >= 3 || qNoAlLen >= 3) {
        if (
          tWord.includes(qWord) ||
          tWord.includes(qWordNoAl) ||
          tWordNoAl.includes(qWord) ||
          tWordNoAl.includes(qWordNoAl)
        ) {
          return true;
        }
      }

      return false;
    });
  });
}
