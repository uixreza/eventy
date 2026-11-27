import { eventTimeStatus, jalaliToDate } from "@/lib/jalali";
import { seedEvents } from "@/lib/seed-events";
import { shamsiMonths, toFa } from "@/lib/utils";

/* ── Browse page (/events) — static demo list ───────────────────── */

export type EventStatus = "live" | "upcoming" | "ended";

export type BrowseEvent = {
  id: string;
  title: string;
  summary: string;
  category: string;
  city: string;
  venue: string;
  date: string;
  time: string;
  status: EventStatus;
  price: number | null;
  seatsLeft: number | null;
  organizer: string;
  gradient: string;
};

export const eventStatusMeta: Record<EventStatus, { label: string; tint: string }> = {
  live: { label: "در حال برگزاری", tint: "bg-red-500 text-white" },
  upcoming: { label: "پیش رو", tint: "bg-blue-600 text-white" },
  ended: { label: "پایان‌یافته", tint: "bg-slate-800/85 text-slate-100 backdrop-blur" },
};

/**
 * The browse list is derived from the seeded events (`lib/seed-events.ts`) so
 * the static demo pages and the database never drift apart. The live pages
 * (`/events`, `/events/[slug]`) read the database instead — see `lib/events.ts`.
 */
export const browseEvents: BrowseEvent[] = seedEvents.map((event) => {
  const startsAt = jalaliToDate(event.jy, event.jm, event.jd, event.hh, event.mm);
  return {
    id: event.id,
    title: event.title,
    summary: event.summary,
    category: event.category,
    city: event.city,
    venue: event.venue,
    date: `${toFa(event.jd)} ${shamsiMonths[event.jm - 1].label}`,
    time: `${toFa(String(event.hh).padStart(2, "0"))}:${toFa(String(event.mm).padStart(2, "0"))}`,
    status: eventTimeStatus(startsAt),
    price: event.price,
    seatsLeft: event.capacity,
    organizer: event.organizer,
    gradient: event.gradient,
  };
});

/* The copy itself lives in an alias-free module so the seed script can
   write it into the database from the same source the app reads. */
export type { EventAgendaItem, EventDetails } from "@/lib/event-copy";
export { browseEventDetails } from "@/lib/event-copy";

export const eventTabs = [
  "همه",
  "فناوری و AI",
  "کسب‌وکار",
  "دورهمی‌های دوستانه",
  "وبینارهای آنلاین",
  "هنر و دیزاین",
];

export const metrics = [
  { value: "+۲,۴۰۰", label: "رویداد برگزار شده" },
  { value: "+۸۵,۰۰۰", label: "شرکت‌کننده فعال" },
  { value: "+۴۰۰", label: "کارگاه و وبینار" },
  { value: "۹۸٪", label: "رضایت شرکت‌کنندگان" },
];

export const trendTags = [
  "هکاتون هوش مصنوعی",
  "فین‌تک مشهد",
  "دورهمی شبکه‌سازی",
  "ایونت‌های رایگان",
];

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
  tint: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "ثبت‌نام‌های هکاتون با Kooja شفاف شد؛ ظرفیت سریع پر شد و دیگه لازم نبود لیست حاضرین رو دستی جمع کنم.",
    name: "سارا محمدی",
    role: "برگزارکننده رویدادهای فناوری",
    initials: "س",
    tint: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    quote:
      "قبلاً برای پیدا کردن رویداد خوب ساعت‌ها در گروه‌ها می‌گشتم. اینجا با چند کلیک رویدادهای نزدیک به علاقه‌ام را پیدا می‌کنم و بلیتم آماده است.",
    name: "امیر حسینی",
    role: "شرکت‌کننده رویداد",
    initials: "ا",
    tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    quote:
      "به‌عنوان مدرس، ثبت‌نام دیجیتال و یادآوری خودکار پیامکی باعث شد تمرکزم روی کیفیت کارگاه بماند نه لیست حاضرین.",
    name: "نگار احمدی",
    role: "مدرس و سخنران مهمان",
    initials: "ن",
    tint: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
];