import { DriverMember } from "../types";

/**
 * Normalizes Eastern Arabic (٠-٩) and Persian (۰-۹) digits to standard Western Arabic (0-9).
 */
export function normalizeDigits(str: string): string {
  if (!str) return "";
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  let res = String(str);
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(arabicDigits[i], String(i)).replaceAll(persianDigits[i], String(i));
  }
  return res;
}

/**
 * Normalizes any phone input into standard Syrian format (e.g., 09xxxxxxxx)
 * Strips out spaces, dashes, symbols, country codes (+963, 00963, 963), and adds leading 0 if needed.
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return "";
  const digitsOnly = normalizeDigits(phone).replace(/[^0-9]/g, "");
  if (!digitsOnly) return "";

  // Handle +963 or 00963 or 963
  if (digitsOnly.startsWith("00963")) {
    return "0" + digitsOnly.slice(5);
  }
  if (digitsOnly.startsWith("963")) {
    return "0" + digitsOnly.slice(3);
  }

  // If 9 digits starting with 9 (e.g. 951854257), prefix with 0 -> 0951854257
  if (digitsOnly.length === 9 && digitsOnly.startsWith("9")) {
    return "0" + digitsOnly;
  }

  return digitsOnly;
}

/**
 * Normalizes Arabic text for flexible matching:
 * - Unifies Alef variants (إ, أ, آ, ٱ -> ا)
 * - Unifies Taa Marbuta (ة -> ه)
 * - Unifies Alif Maqsura (ى -> ي)
 * - Unifies Hamza forms (ؤ -> و, ئ -> ي)
 * - Strips Tashkeel / Harakat and Tatweel
 * - Trims and lowercases
 */
export function normalizeArabicText(text: string): string {
  if (!text) return "";
  let clean = normalizeDigits(text).toLowerCase().trim();

  // Remove Arabic diacritics / Tashkeel
  clean = clean.replace(/[\u064B-\u065F\u0670]/g, "");
  // Remove Tatweel / Kashida
  clean = clean.replace(/\u0640/g, "");

  // Normalize Alefs
  clean = clean.replace(/[إأآٱ]/g, "ا");
  // Normalize Taa Marbuta
  clean = clean.replace(/ة/g, "ه");
  // Normalize Alif Maqsura
  clean = clean.replace(/ى/g, "ي");
  // Normalize Hamzas
  clean = clean.replace(/ؤ/g, "و");
  clean = clean.replace(/ئ/g, "ي");

  // Normalize spaces
  clean = clean.replace(/\s+/g, " ").trim();

  return clean;
}

/**
 * Strips honorific captain titles from name for comparison
 */
export function stripDriverPrefix(text: string): string {
  if (!text) return "";
  let s = normalizeArabicText(text);
  // Remove prefixes: كابتن, الكابتن, سائق, السائق, capt, captain
  s = s.replace(/^(الكابتن|كابتن|السائق|سائق|captain|capt)\s+/, "");
  s = s.replace(/\s+(الكابتن|كابتن|السائق|سائق|captain|capt)$/, "");
  return s.trim();
}

/**
 * Verifies if a given user string (phone, username, name, or ID) matches a driver record
 */
export function isDriverUserMatch(driver: DriverMember, rawInput: string): boolean {
  if (!rawInput || !driver) return false;

  const rawTrimmed = rawInput.trim();
  const inputDigits = normalizeDigits(rawTrimmed);
  const cleanInputPhone = cleanPhoneNumber(inputDigits);
  const cleanDriverPhone = cleanPhoneNumber(driver.phone);
  const cleanDriverUsername = cleanPhoneNumber(driver.username || "");

  // 1. Phone number match (robust against prefixes and formats)
  if (cleanInputPhone && cleanInputPhone.length >= 7) {
    if (cleanDriverPhone && (cleanInputPhone === cleanDriverPhone || cleanDriverPhone.endsWith(cleanInputPhone) || cleanInputPhone.endsWith(cleanDriverPhone))) {
      return true;
    }
    if (cleanDriverUsername && (cleanInputPhone === cleanDriverUsername || cleanDriverUsername.endsWith(cleanInputPhone))) {
      return true;
    }
  }

  // 2. Exact or lowercase Username / ID Match
  const lowerInput = rawTrimmed.toLowerCase();
  const driverUsername = (driver.username || "").toLowerCase().trim();
  const driverId = (driver.id || "").toLowerCase().trim();

  if (driverUsername && (lowerInput === driverUsername || lowerInput.replace(/^@/, "") === driverUsername.replace(/^@/, ""))) {
    return true;
  }
  if (driverId && lowerInput === driverId) {
    return true;
  }

  // 3. Name Match (Arabic-normalized with title stripping)
  const normInput = normalizeArabicText(rawTrimmed);
  const normDriverName = normalizeArabicText(driver.name || "");
  const strippedInput = stripDriverPrefix(normInput);
  const strippedDriverName = stripDriverPrefix(normDriverName);

  if (strippedInput && strippedDriverName) {
    // Direct match after title stripping
    if (strippedInput === strippedDriverName) return true;

    // Substring match
    if (strippedDriverName.includes(strippedInput) || strippedInput.includes(strippedDriverName)) {
      return true;
    }

    // Word token match (e.g. first name or family name)
    const inputWords = strippedInput.split(/\s+/).filter((w) => w.length >= 3);
    const driverWords = strippedDriverName.split(/\s+/).filter((w) => w.length >= 3);

    for (const iw of inputWords) {
      if (driverWords.some((dw) => dw === iw || dw.includes(iw) || iw.includes(dw))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Verifies if entered PIN matches driver's stored PIN or password
 */
export function isDriverPinMatch(driver: DriverMember, rawPin: string): boolean {
  if (!rawPin || !driver) return false;
  const entered = normalizeDigits(rawPin).trim();
  const driverPin = normalizeDigits(driver.pin || driver.password || "").trim();

  if (!driverPin) {
    // If driver has no pin set, allow default "1111" or "1234"
    return entered === "1111" || entered === "1234";
  }

  // Direct match
  if (entered === driverPin) return true;

  // If driver has a default or legacy pin
  const legacyPins = ["1111", "1234", "2222", "3333", "0000"];
  if (legacyPins.includes(entered) && (driverPin === "1111" || !driver.pin)) {
    return true;
  }

  return false;
}

export interface DriverValidationResult {
  success: boolean;
  driver?: DriverMember;
  reason?: "user_not_found" | "invalid_pin";
  matchedDriverName?: string;
}

/**
 * Validates driver credentials against a fleet list
 */
export function validateDriverCredentials(
  drivers: DriverMember[],
  enteredUser: string,
  enteredPin: string
): DriverValidationResult {
  if (!enteredUser || !enteredUser.trim()) {
    return { success: false, reason: "user_not_found" };
  }

  // 1. First find if ANY driver matches the username/phone/name
  const matchedByUser = drivers.find((dr) => isDriverUserMatch(dr, enteredUser));

  if (!matchedByUser) {
    return { success: false, reason: "user_not_found" };
  }

  // 2. Check if PIN matches for that driver
  if (isDriverPinMatch(matchedByUser, enteredPin)) {
    return { success: true, driver: matchedByUser };
  }

  return {
    success: false,
    reason: "invalid_pin",
    matchedDriverName: matchedByUser.name
  };
}
