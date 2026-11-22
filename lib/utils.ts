const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Convert latin digits inside a string/number to Persian digits. */
export function toFa(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** Format a number as grouped Persian digits, e.g. 290000 → ۲۹۰,۰۰۰ */
export function faNumber(value: number): string {
  return toFa(value.toLocaleString("en-US"));
}

/** Format a price in Toman, e.g. 290000 → ۲۹۰,۰۰۰ تومان */
export function faPrice(value: number): string {
  return `${faNumber(value)} تومان`;
}

/** Persian month names for Shamsi date pickers (سال/ماه/روز selects). */
export const shamsiMonths: { value: number; label: string }[] = [
  { value: 1, label: "فروردین" },
  { value: 2, label: "اردیبهشت" },
  { value: 3, label: "خرداد" },
  { value: 4, label: "تیر" },
  { value: 5, label: "مرداد" },
  { value: 6, label: "شهریور" },
  { value: 7, label: "مهر" },
  { value: 8, label: "آبان" },
  { value: 9, label: "آذر" },
  { value: 10, label: "دی" },
  { value: 11, label: "بهمن" },
  { value: 12, label: "اسفند" },
];

/** Turn Persian digits into latin ones and drop everything else
    (for numeric inputs that display with toFa). */
export function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[^0-9]/g, "");
}
