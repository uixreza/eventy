/**
 * The small vocabulary shared by the report dialog and the server that checks
 * it. Keeping the keys here means the client can render the exact same choices
 * the action accepts, without importing anything server-only.
 */

export const EVENT_REPORT_REASONS = [
  {
    value: "INAPPROPRIATE_CONTENT",
    label: "محتوای نامناسب",
    hint: "عکس، متن یا مطالب ناپسند در رویداد",
  },
  {
    value: "DANGEROUS_BEHAVIOR",
    label: "رفتارهای خطرناک",
    hint: "تهدید، خشونت یا رفتار ناایمن",
  },
  {
    value: "MISLEADING_INFO",
    label: "اطلاعات نادرست",
    hint: "زمان، مکان یا هزینه اشتباه",
  },
  {
    value: "SPAM",
    label: "اسپم یا تبلیغات",
    hint: "تبلیغات یا پیام‌های تکراری",
  },
  {
    value: "OTHER",
    label: "مورد دیگری هست",
    hint: "چیزی که در گزینه‌های بالا نیست",
  },
] as const;

export type EventReportReason = (typeof EVENT_REPORT_REASONS)[number]["value"];

export const MAX_REPORT_MESSAGE = 500;

/** One row of the managers' report inbox, already formatted for display. */
export type AdminEventReport = {
  id: string;
  reason: string;
  reasonLabel: string;
  message: string;
  createdAt: string;
  reporter: { name: string; phone: string };
  event: { id: string; title: string; slug: string };
};
