/**
 * Pure text checks used by the event moderator.
 *
 * Kept free of `server-only`, network calls and path aliases so the same rules
 * can be exercised in a plain Node process. The OpenAI Moderation classifier
 * scores a whole string, so packing every event field into one long paragraph
 * can dilute a short insult below its threshold. Each field is therefore sent
 * on its own, and a small deterministic Persian-insult check covers wording
 * the classifier still misses.
 */

export type ModeratableEventText = {
  title: string;
  description: string;
  summary?: string;
  category?: string;
  city?: string;
  venue?: string;
  organizerName?: string;
  onlineUrl?: string;
  highlights?: string[];
  agendaTitles?: string[];
};

export type ModerationApiCategoryResult = {
  flagged?: boolean;
  categories?: Record<string, boolean | null>;
  category_scores?: Record<string, number | null>;
};

export const INSULT_CATEGORY = "insults";
export const PHONE_CATEGORY = "phone_numbers";

/**
 * Conservative score floors. The classifier's boolean threshold is 0.5 for
 * every category, which is too high for short Persian phrases. These values
 * stayed below every benign control phrase checked in Persian (including
 * events about mental health, self-defence and sexual health).
 */
const SCORE_THRESHOLDS: Record<string, number> = {
  harassment: 0.25,
  "harassment/threatening": 0.25,
  hate: 0.25,
  "hate/threatening": 0.25,
  sexual: 0.35,
  "sexual/minors": 0.1,
  illicit: 0.35,
  "illicit/violent": 0.3,
  "self-harm": 0.35,
  "self-harm/intent": 0.25,
  "self-harm/instructions": 0.15,
  violence: 0.35,
  "violence/graphic": 0.3,
};

/**
 * Unambiguous Persian insults/derogatory abuse. Generic nouns that can be
 * innocent in event copy (for example «خرید» or «سگ») are deliberately left
 * out; the classifier still handles everything not listed here.
 */
const INSULT_TERMS = [
  "احمق",
  "احمقانه",
  "خره",
  "خریت",
  "خریات",
  "بی شعور",
  "بی شعوری",
  "کودن",
  "ابله",
  "سفیه",
  "جاهل",
  "نادان",
  "دیوانه",
  "لعنتی",
  "حرامزاده",
  "وقیح",
  "گستاخ",
  "پست فطرت",
  "حقیر",
];

function normalize(value: string): string {
  return value
    .replace(/[\u064b-\u065f\u0670]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[\u200c\u200d]/g, " ")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ة/g, "ه")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const INSULT_PATTERN = new RegExp(
  `(?<!\\p{L})(?:${INSULT_TERMS.map((term) => normalize(term)).join("|")})(?!\\p{L})`,
  "u",
);

/** Every user-visible field, labelled but kept as its own moderation item. */
export function buildTextFields(input: ModeratableEventText): string[] {
  return [
    `عنوان رویداد: ${input.title}`,
    input.summary ? `خلاصه: ${input.summary}` : "",
    `توضیحات: ${input.description}`,
    input.category ? `دسته بندی: ${input.category}` : "",
    input.city ? `شهر: ${input.city}` : "",
    input.venue ? `محل برگزار: ${input.venue}` : "",
    input.organizerName ? `برگزارکننده: ${input.organizerName}` : "",
    input.onlineUrl ? `لینک پخش: ${input.onlineUrl}` : "",
    ...(input.highlights ?? []).map((item) => `ویژگی: ${item}`),
    ...(input.agendaTitles ?? []).map((item) => `برنامه: ${item}`),
  ].filter((line) => line.trim() !== "");
}

function allText(input: ModeratableEventText): string {
  return [
    input.title,
    input.summary ?? "",
    input.description,
    input.category ?? "",
    input.city ?? "",
    input.venue ?? "",
    input.organizerName ?? "",
    input.onlineUrl ?? "",
    ...(input.highlights ?? []),
    ...(input.agendaTitles ?? []),
  ].join("\n");
}

/** Iranian digits are common in phone numbers written by Persian speakers. */
function toAsciiDigits(value: string): string {
  return value
    .replace(/[\u0660-\u0669]/g, (digit) =>
      String.fromCharCode(digit.charCodeAt(0) - 0x0660 + 48),
    )
    .replace(/[\u06f0-\u06f9]/g, (digit) =>
      String.fromCharCode(digit.charCodeAt(0) - 0x06f0 + 48),
    );
}

/**
 * The moderation model does not reliably flag phone numbers, so event copy is
 * checked locally too. This catches mobile and landline numbers with or
 * without separators, the `98` country code, and Persian digits.
 */
export function containsPhoneNumber(input: ModeratableEventText): boolean {
  const candidates = toAsciiDigits(allText(input)).match(/(?:\+?\d[\d\s().\-]{7,}\d)/g) ?? [];

  return candidates.some((candidate) => {
    const digits = candidate.replace(/\D/g, "");
    const local = digits.replace(/^0098/, "").replace(/^98/, "");
    return /^0?9\d{9}$/.test(local) || /^0\d{10}$/.test(digits);
  });
}

/** Catches direct Persian insults even when the classifier scores them low. */
export function containsInsult(input: ModeratableEventText): boolean {
  return INSULT_PATTERN.test(normalize(allText(input)));
}

/**
 * Turns the raw OpenAI results into the category keys we persist. A field is
 * unsafe when the model flags it, when a category score crosses one of the
 * conservative floors above, or when a result is flagged without named
 * categories.
 */
export function flaggedCategoriesFromApi(
  results: ModerationApiCategoryResult[],
): Set<string> {
  const flagged = new Set<string>();
  for (const result of results) {
    for (const [category, value] of Object.entries(result.categories ?? {})) {
      if (value === true) flagged.add(category);
    }
    for (const [category, score] of Object.entries(result.category_scores ?? {})) {
      const threshold = SCORE_THRESHOLDS[category];
      if (typeof score === "number" && threshold !== undefined && score >= threshold) {
        flagged.add(category);
      }
    }
    if (result.flagged && Object.keys(result.categories ?? {}).length === 0) {
      flagged.add("unsafe_content");
    }
  }
  return flagged;
}
