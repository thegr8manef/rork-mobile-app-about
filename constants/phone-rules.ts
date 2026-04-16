// constants/phone-rules.ts
// ─────────────────────────────────────────────────────────────────────────────
// Per-country phone validation rules.
// `minDigits` / `maxDigits` count only the *local* part (without dial code).
// `placeholder` is a formatted example that matches the expected pattern.
// ─────────────────────────────────────────────────────────────────────────────

export interface PhoneRule {
  /** Minimum number of digits (spaces excluded) */
  minDigits: number;
  /** Maximum number of digits (spaces excluded) */
  maxDigits: number;
  /** Max characters the TextInput should allow (digits + spaces) */
  maxLength: number;
  /** Formatted placeholder shown in the input */
  placeholder: string;
}

const PHONE_RULES: Record<string, PhoneRule> = {
  // NANP Caribbean / territories — 7 local digits after area code
AG: { minDigits: 7, maxDigits: 7, maxLength: 9,  placeholder: "562 3860" },  // Antigua +1268
JM: { minDigits: 7, maxDigits: 7, maxLength: 9,  placeholder: "876 5432" },  // Jamaica +1876
TT: { minDigits: 7, maxDigits: 7, maxLength: 9,  placeholder: "612 3456" },  // Trinidad +1868
BS: { minDigits: 7, maxDigits: 7, maxLength: 9,  placeholder: "302 1234" },  // Bahamas +1242
BB: { minDigits: 7, maxDigits: 7, maxLength: 9,  placeholder: "230 1234" },  // Barbados +1246
  // North Africa
  TN: { minDigits: 8, maxDigits: 8, maxLength: 11, placeholder: "20 000 000" },
  DZ: {
    minDigits: 9,
    maxDigits: 9,
    maxLength: 13,
    placeholder: "551 23 45 67",
  },
  MA: { minDigits: 9, maxDigits: 9, maxLength: 12, placeholder: "612 345 678" },
  EG: {
    minDigits: 10,
    maxDigits: 10,
    maxLength: 13,
    placeholder: "100 123 4567",
  },
  LY: { minDigits: 9, maxDigits: 9, maxLength: 12, placeholder: "91 234 5678" },
  SD: { minDigits: 9, maxDigits: 9, maxLength: 12, placeholder: "91 234 5678" },

  // Middle East
  SA: { minDigits: 9, maxDigits: 9, maxLength: 12, placeholder: "512 345 678" },
  AE: { minDigits: 9, maxDigits: 9, maxLength: 12, placeholder: "50 123 4567" },
  LB: { minDigits: 7, maxDigits: 8, maxLength: 11, placeholder: "71 123 456" },
  JO: { minDigits: 9, maxDigits: 9, maxLength: 12, placeholder: "79 123 4567" },
  IQ: {
    minDigits: 10,
    maxDigits: 10,
    maxLength: 13,
    placeholder: "770 123 4567",
  },

  // Europe
  FR: {
    minDigits: 9,
    maxDigits: 9,
    maxLength: 14,
    placeholder: "6 12 34 56 78",
  },
  DE: {
    minDigits: 10,
    maxDigits: 11,
    maxLength: 15,
    placeholder: "151 23456789",
  },
  IT: {
    minDigits: 9,
    maxDigits: 10,
    maxLength: 14,
    placeholder: "312 345 6789",
  },
  ES: { minDigits: 9, maxDigits: 9, maxLength: 12, placeholder: "612 345 678" },
  GB: {
    minDigits: 10,
    maxDigits: 10,
    maxLength: 13,
    placeholder: "7700 900000",
  },
  BE: {
    minDigits: 9,
    maxDigits: 9,
    maxLength: 13,
    placeholder: "470 12 34 56",
  },

  // Americas
  US: {
    minDigits: 10,
    maxDigits: 10,
    maxLength: 14,
    placeholder: "201 555 0123",
  },
  CA: {
    minDigits: 10,
    maxDigits: 10,
    maxLength: 14,
    placeholder: "204 234 5678",
  },

  // West / Central Africa
  SN: {
    minDigits: 9,
    maxDigits: 9,
    maxLength: 13,
    placeholder: "70 123 45 67",
  },
  CI: {
    minDigits: 10,
    maxDigits: 10,
    maxLength: 14,
    placeholder: "70 00 00 00 00",
  },
  CM: {
    minDigits: 9,
    maxDigits: 9,
    maxLength: 13,
    placeholder: "6 70 00 00 00",
  },

  // Add these to PHONE_RULES:

  // Southern / East Africa
  AO: { minDigits: 9, maxDigits: 9, maxLength: 12, placeholder: "923 456 789" },
  MZ: { minDigits: 9, maxDigits: 9, maxLength: 12, placeholder: "841 234 567" },
  KE: { minDigits: 9, maxDigits: 9, maxLength: 12, placeholder: "712 345 678" },
  TZ: { minDigits: 9, maxDigits: 9, maxLength: 12, placeholder: "712 345 678" },
  NG: {
    minDigits: 10,
    maxDigits: 10,
    maxLength: 14,
    placeholder: "802 345 6789",
  },
  GH: { minDigits: 9, maxDigits: 9, maxLength: 12, placeholder: "241 234 567" },
  ET: { minDigits: 9, maxDigits: 9, maxLength: 12, placeholder: "911 234 567" },
  ZA: { minDigits: 9, maxDigits: 9, maxLength: 12, placeholder: "712 345 678" },

  // Gulf
  QA: { minDigits: 8, maxDigits: 8, maxLength: 11, placeholder: "5512 3456" },
  KW: { minDigits: 8, maxDigits: 8, maxLength: 11, placeholder: "5123 4567" },
  BH: { minDigits: 8, maxDigits: 8, maxLength: 11, placeholder: "3612 3456" },
  OM: { minDigits: 8, maxDigits: 8, maxLength: 11, placeholder: "9212 3456" },

  // Other
  TR: {
    minDigits: 10,
    maxDigits: 10,
    maxLength: 14,
    placeholder: "501 234 5678",
  },
  MR: { minDigits: 8, maxDigits: 8, maxLength: 11, placeholder: "2212 3456" },
  ML: { minDigits: 8, maxDigits: 8, maxLength: 11, placeholder: "7612 3456" },
};

/** Fallback rule for countries not listed above */
const DEFAULT_PHONE_RULE: PhoneRule = {
  minDigits: 6,
  maxDigits: 15,
  maxLength: 20,
  placeholder: "612 345 678", // ← realistic-looking, no leading zero
};

/**
 * Get phone validation rules for a given country code (ISO 3166-1 alpha-2).
 */
export const getPhoneRule = (countryCode: string): PhoneRule => {
  return PHONE_RULES[countryCode] ?? DEFAULT_PHONE_RULE;
};

/**
 * Validate a local phone number (without dial code) against a country's rules.
 * Returns `true` if valid.
 */
export const isPhoneValid = (
  localPhone: string,
  countryCode: string,
): boolean => {
  const rule = getPhoneRule(countryCode);
  const digitsOnly = localPhone.replace(/\s/g, "");

  // Must contain only digits (and spaces, which we stripped)
  if (!/^\d+$/.test(digitsOnly)) return false;

  return (
    digitsOnly.length >= rule.minDigits && digitsOnly.length <= rule.maxDigits
  );
};
