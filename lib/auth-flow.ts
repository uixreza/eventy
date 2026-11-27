import { normalizeDigits } from "@/lib/utils";

/**
 * Shared contract of the phone → OTP → (profile) auth flow: the validation
 * rules used by both the modal and the server, the timing constants, and the
 * result shapes the server actions answer with.
 *
 * Deliberately free of server-only imports so the client form can reuse every
 * rule and give feedback before a round-trip — the server repeats all of them
 * anyway, since client checks are convenience, not security.
 */

/* Persian-digit handling lives with the other display helpers; re-exported
   here so the flow only ever needs one import. */
export { normalizeDigits };

export const OTP_LENGTH = 6;
/** How long a freshly issued code stays usable. */
export const OTP_TTL_SECONDS = 5 * 60;
/** Minimum gap between two code requests for the same number. */
export const RESEND_SECONDS = 60;
/** Wrong guesses a single code tolerates before it locks. */
export const OTP_MAX_ATTEMPTS = 5;

export type OtpRequestResult =
  | {
      ok: true;
      isNew: boolean;
      /**
       * Development-only convenience: the freshly issued code, so the modal
       * can prefill the OTP boxes when signing in from another device. Never
       * present in a production build.
       */
      devCode?: string;
    }
  | { ok: false; error: string };

export type OtpVerifyResult = { ok: true } | { ok: false; error: string };

/** Accepts `09123456789` (Persian digits allowed), returns it normalized. */
export function normalizePhone(value: string | null | undefined): string | null {
  const digits = normalizeDigits(value ?? "");
  return /^09\d{9}$/.test(digits) ? digits : null;
}

/** Collapse runs of whitespace and trim — what we store as the display name. */
export function normalizeName(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function isValidName(value: string | null | undefined): boolean {
  const name = normalizeName(value);
  if (name.length < 3 || name.length > 80) return false;
  // Persian/Arabic letters, latin letters, hyphen, apostrophe, ZWNJ, spaces.
  return /^[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z\u200c' -]+$/.test(name);
}

/**
 * Iranian national id (کد ملی): 10 digits whose check digit follows the
 * standard weighted checksum. All-identical digits (0000000000, 1111111111, …)
 * are never valid ids, so they are rejected outright.
 */
export function isValidNationalId(value: string | null | undefined): boolean {
  const id = normalizeDigits(value ?? "");
  if (!/^\d{10}$/.test(id) || /^(\d)\1{9}$/.test(id)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(id[i]) * (10 - i);
  const remainder = sum % 11;

  return remainder < 2 ? Number(id[9]) === remainder : Number(id[9]) === 11 - remainder;
}

/**
 * `YYYY-MM-DD` from `<input type="date">`: a real calendar day that puts the
 * holder between 13 and 120 years old today.
 */
export function isValidBirthDate(value: string | null | undefined): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const oldest = new Date(Date.UTC(now.getUTCFullYear() - 120, 0, 1));
  const youngest = new Date(
    Date.UTC(now.getUTCFullYear() - 13, now.getUTCMonth(), now.getUTCDate()),
  );

  return date >= oldest && date <= youngest;
}
