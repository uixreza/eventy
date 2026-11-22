"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Lightbulb,
  MapPin,
  Monitor,
  Plus,
  RotateCw,
  Sparkles,
  Ticket,
  Trash2,
  Users,
} from "lucide-react";
import { sileo } from "sileo";
import { jalaaliMonthLength, toJalaali } from "jalaali-js";
import { createEvent, updateEvent, type EventInput } from "@/app/actions/events";
import { categoryIcon, FALLBACK_ICON } from "@/lib/category-icons";
import { eventTabs } from "@/lib/data";
import { faNumber, faPrice, normalizeDigits, shamsiMonths, toFa } from "@/lib/utils";
import { useLocation } from "@/components/layout/LocationProvider";
import { Wheel, WHEEL_HEIGHT } from "@/components/ui/Wheel";

/** «همه» is a filter, not a real category. */
const categories = eventTabs.slice(1);

const coverGradients = [
  { name: "آبی", className: "from-blue-600 via-indigo-500 to-purple-600" },
  { name: "کهربایی", className: "from-amber-500 via-orange-500 to-red-500" },
  { name: "زمردی", className: "from-emerald-500 via-teal-500 to-cyan-600" },
  { name: "آسمانی", className: "from-sky-500 via-blue-500 to-indigo-600" },
  { name: "صورتی", className: "from-pink-500 via-rose-500 to-fuchsia-600" },
  { name: "بنفش", className: "from-violet-600 via-fuchsia-500 to-pink-500" },
  { name: "نارنجی", className: "from-orange-500 via-rose-500 to-pink-600" },
  { name: "نیلی", className: "from-indigo-500 via-blue-500 to-sky-600" },
];

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = [0, 15, 30, 45];

const tips = [
  "عنوان کوتاه و گویا بنویس؛ جستجوها بر اساس عنوان انجام می‌شود.",
  "دسته‌بندی درست را انتخاب کن تا رویداد به مخاطبان درست برسد.",
  "حداقل ۲۴ ساعت قبل از شروع، رویداد را منتشر کن.",
];

/** The steps of the form — the last one previews the card and publishes. */
const STEPS = [
  { title: "اطلاعات اصلی", short: "اطلاعات", icon: Sparkles },
  { title: "زمان و مکان برگزاری", short: "زمان و مکان", icon: Clock },
  { title: "پیش‌نمایش و انتشار", short: "انتشار", icon: Check },
];

/* Horizontal padding is spelled out per input (ps/pe) so suffixed fields can
   widen only the end side without relying on conflicting utility order. */
const fieldBase =
  "w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-600";
const fieldClass = `${fieldBase} ps-3.5 pe-3.5`;
const fieldSuffixed = `${fieldBase} ps-3.5 pe-16`;
const labelClass = "block text-sm font-bold text-slate-700 dark:text-slate-300";
const cardClass =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-900 sm:p-6";

/** The values the form starts with — a new event, or an existing one. */
export type EventFormValues = {
  /** Present when an existing event is being edited. */
  id?: string;
  title: string;
  category: string;
  description: string;
  city: string;
  venue: string;
  onlineUrl: string;
  /** `null` when the organizer left the capacity undefined. */
  capacity: number | null;
  /** «چه چیزی در انتظارتان است؟» */
  highlights: string[];
  /** «برنامه زمانی» */
  agenda: { time: string; title: string }[];
  price: number | null;
  gradient: string;
  mode: "INPERSON" | "ONLINE";
  jy: number;
  jm: number;
  jd: number;
  hour: number;
  minute: number;
};

type NewEventFormProps = {
  /** The event being edited — omitted when a new one is created. */
  initial?: EventFormValues;
  /** The name of the signed-in user, shown on the preview card. */
  organizerName?: string;
  /**
   * Category name → icon key (`lib/category-icons.ts`). The form offers the
   * static `eventTabs`, but the glyph of the selected one comes from the
   * database so the preview matches the public cards.
   */
  categoryIcons?: Record<string, string>;
  /**
   * Where «بازگشت» points and where a save sends the browser. The console
   * hands in its own (`/console/events`) so an admin ends up back in the
   * moderation queue instead of their personal dashboard.
   */
  returnTo?: { href: string; label: string };
};

export default function NewEventForm({
  initial,
  organizerName,
  categoryIcons = {},
  returnTo,
}: NewEventFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const back = returnTo ?? { href: "/dashboard/events", label: "بازگشت به رویدادهای من" };

  /** Current Jalali year, computed at render time so server and client agree. */
  const now = new Date();
  const currentYear = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate()).jy;
  /** The year never changes on the wheel — a new event happens this year. */
  const year = initial?.jy ?? currentYear;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState({
    month: initial?.jm ?? 8,
    day: initial?.jd ?? 15,
  });
  const [hour, setHour] = useState(initial?.hour ?? 16);
  const [minute, setMinute] = useState(initial?.minute ?? 0);
  const [mode, setMode] = useState<"inperson" | "online">(
    initial?.mode === "ONLINE" ? "online" : "inperson",
  );
  const [venue, setVenue] = useState(initial?.venue ?? "");
  const [link, setLink] = useState(initial?.onlineUrl ?? "");
  const [capacity, setCapacity] = useState(initial?.capacity ? String(initial.capacity) : "");
  /* «نامشخص» — the organizer does not want a fixed cap, so the input is
     disabled and `null` is stored. */
  const [capacityUndefined, setCapacityUndefined] = useState(initial?.capacity === null);
  const [highlights, setHighlights] = useState<string[]>(initial?.highlights ?? []);
  const [agenda, setAgenda] = useState<{ time: string; title: string }[]>(
    initial?.agenda ?? [],
  );
  const [priceType, setPriceType] = useState<"free" | "paid">(
    initial?.price === null || initial?.price === undefined ? "free" : "paid",
  );
  const [price, setPrice] = useState(initial?.price ? String(initial.price) : "");
  /* A new event starts with a random cover; an edit keeps the saved one. */
  const [gradient, setGradient] = useState(
    () =>
      initial?.gradient ??
      coverGradients[Math.floor(Math.random() * coverGradients.length)].className,
  );

  /** The city chosen once in the header; new in-person events inherit it. */
  const { location: centralLocation } = useLocation();

  /* Wheel option lists — days follow the selected month's length in the
     fixed year (Esfand 29/30 included). */
  const dayItems = Array.from({ length: jalaaliMonthLength(year, date.month) }, (_, i) => ({
    value: i + 1,
    text: toFa(i + 1),
  }));
  const monthItems = shamsiMonths.map((month) => ({ value: month.value, text: month.label }));
  const hourItems = hours.map((value) => ({ value, text: toFa(pad2(value)) }));
  const minuteItems = minutes.map((value) => ({ value, text: toFa(pad2(value)) }));

  const dateString = `${toFa(date.day)} ${shamsiMonths[date.month - 1].label} - ${toFa(
    pad2(hour),
  )}:${toFa(pad2(minute))}`;
  const priceNumber = Number(price) || 0;
  /* The preview mirrors what the publish action stores: blank rows are left
     out, so the last step shows exactly the lists the event page will get. */
  const previewHighlights = highlights.map((item) => item.trim()).filter(Boolean);
  const previewAgenda = agenda
    .map((row) => ({ time: row.time.trim(), title: row.title.trim() }))
    .filter((row) => row.time && row.title);
  const isEditing = Boolean(initial?.id);
  const isLastStep = step === STEPS.length - 1;

  /** The selected category's glyph, shown on the preview cover. */
  const CategoryIcon = category
    ? categoryIcon(categoryIcons[category] ?? FALLBACK_ICON).icon
    : null;

  /** The checks of one step — the same rules the server repeats. */
  function validateStep(index: number): boolean {
    if (index === 0) {
      if (!title.trim()) {
        sileo.error({ title: "عنوان رویداد را وارد کنید", description: "این فیلد الزامی است." });
        return false;
      }
      if (title.trim().length < 5) {
        sileo.error({
          title: "عنوان رویداد خیلی کوتاه است",
          description: "عنوان باید حداقل ۵ حرف باشد.",
        });
        return false;
      }
      if (!category) {
        sileo.error({
          title: "دسته‌بندی را انتخاب کنید",
          description: "رویداد باید یک دسته داشته باشد.",
        });
        return false;
      }
      if (description.trim().length < 10) {
        sileo.error({
          title: "توضیحات رویداد را بنویسید",
          description: "شرکت‌کنندگان به توضیحات نیاز دارند.",
        });
        return false;
      }
      if (!capacityUndefined && (!capacity || Number(capacity) < 1)) {
        sileo.error({
          title: "ظرفیت رویداد را وارد کنید",
          description: "ظرفیت باید حداقل ۱ نفر باشد، یا گزینه «نامشخص» را بزنید.",
        });
        return false;
      }
      if (
        agenda.some(
          (row) =>
            (row.time.trim() || row.title.trim()) &&
            (!row.time.trim() || !row.title.trim()),
        )
      ) {
        sileo.error({
          title: "برنامه زمانی ناقص است",
          description: "هر ردیف برنامه زمانی به ساعت و عنوان نیاز دارد.",
        });
        return false;
      }
      if (priceType === "paid" && priceNumber < 1) {
        sileo.error({
          title: "قیمت بلیت را وارد کنید",
          description: "برای بلیت پولی، قیمت باید بیشتر از صفر باشد.",
        });
        return false;
      }
    }

    if (index === 1) {
      if (mode === "inperson" && !venue.trim()) {
        sileo.error({
          title: "آدرس محل برگزاری را وارد کنید",
          description: "برای رویداد حضوری آدرس لازم است.",
        });
        return false;
      }
      if (mode === "online" && !link.trim()) {
        sileo.error({
          title: "لینک پخش آنلاین را وارد کنید",
          description: "برای رویداد آنلاین لینک پخش لازم است.",
        });
        return false;
      }
    }

    return true;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(STEPS.length - 1, current + 1));
  }

  function goBack() {
    setStep((current) => Math.max(0, current - 1));
  }

  /** The preview's rotate button — always swaps in a different cover. */
  function shuffleGradient() {
    setGradient((current) => {
      const options = coverGradients.filter((option) => option.className !== current);
      return options[Math.floor(Math.random() * options.length)].className;
    });
  }

  /* ── «چه چیزی در انتظارتان است؟» rows ───────────────────────── */
  function addHighlight() {
    setHighlights((current) => (current.length >= 10 ? current : [...current, ""]));
  }

  function updateHighlight(index: number, value: string) {
    setHighlights((current) =>
      current.map((item, position) => (position === index ? value : item)),
    );
  }

  function removeHighlight(index: number) {
    setHighlights((current) => current.filter((_, position) => position !== index));
  }

  /* ── «برنامه زمانی» rows ────────────────────────────────────── */
  function addAgendaRow() {
    setAgenda((current) =>
      current.length >= 15 ? current : [...current, { time: "", title: "" }],
    );
  }

  function updateAgendaRow(
    index: number,
    field: "time" | "title",
    value: string,
  ) {
    setAgenda((current) =>
      current.map((row, position) =>
        position === index ? { ...row, [field]: value } : row,
      ),
    );
  }

  function removeAgendaRow(index: number) {
    setAgenda((current) => current.filter((_, position) => position !== index));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    /* The last step publishes — every step has to be valid by then. */
    for (let index = 0; index < STEPS.length - 1; index += 1) {
      if (!validateStep(index)) {
        setStep(index);
        return;
      }
    }

    const payload: EventInput = {
      title: title.trim(),
      category,
      description: description.trim(),
      jy: year,
      jm: date.month,
      jd: date.day,
      hour,
      minute,
      mode: mode === "online" ? "ONLINE" : "INPERSON",
      venue: venue.trim(),
      /* An online event has no place on the map; an in-person one uses the
         city chosen in the header (or the existing city when editing). */
      city: mode === "online"
        ? (initial?.city || "آنلاین")
        : initial?.city || centralLocation.city,
      onlineUrl: link.trim(),
      capacity: capacityUndefined ? null : Number(capacity),
      highlights: highlights.map((item) => item.trim()).filter(Boolean),
      agenda: agenda
        .map((row) => ({ time: row.time.trim(), title: row.title.trim() }))
        .filter((row) => row.time && row.title),
      price: priceType === "free" ? null : priceNumber,
      coverGradient: gradient,
    };

    startTransition(async () => {
      const result = initial?.id
        ? await updateEvent(initial.id, payload)
        : await createEvent(payload);

      if (!result.ok) {
        sileo.error({ title: result.error, description: "لطفاً موارد را بررسی کنید." });
        return;
      }

      sileo.success({
        title: isEditing ? "تغییرات ذخیره شد" : "رویداد شما ثبت شد",
        description:
          result.message ??
          "پس از بررسی کارشناسان رویدادشو، در سایت منتشر می‌شود.",
      });
      router.push(back.href);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
            <Plus className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
              {isEditing ? "ویرایش رویداد" : "ثبت رویداد جدید"}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              مرحله {toFa(step + 1)} از {toFa(STEPS.length)} — {STEPS[step].title}
            </p>
          </div>
        </div>
        <Link
          href={back.href}
          className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300"
        >
          {back.label}
        </Link>
      </div>

      {/* ── Stepper ───────────────────────────────────────────── */}
      <nav aria-label="مراحل ثبت رویداد" className={cardClass}>
        {/* Progress bar — small screens */}
        <div className="mb-4 sm:hidden">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            {STEPS[step].title}
          </p>
        </div>

        {/* Steps — wide screens */}
        <ol className="hidden items-start sm:flex">
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            const done = index < step;
            const current = index === step;
            const last = index === STEPS.length - 1;

            return (
              <li key={item.title} className="relative flex flex-1 flex-col items-center text-center">
                {/* The rail between two steps — it starts at this node's
                    center and reaches the next one, so it never leaves the
                    container. */}
                {!last && (
                  <span
                    aria-hidden="true"
                    className={`absolute start-1/2 top-[19px] h-0.5 w-full transition-colors duration-300 ${
                      done ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                )}

                <button
                  type="button"
                  onClick={() => setStep(index)}
                  aria-current={current ? "step" : undefined}
                  title={item.title}
                  className="relative z-10 flex flex-col items-center gap-2"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
                      current
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                        : done
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300"
                          : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span
                    className={`text-[11px] font-bold leading-4 transition-colors duration-200 ${
                      current
                        ? "text-blue-700 dark:text-blue-300"
                        : done
                          ? "text-slate-600 dark:text-slate-300"
                          : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {item.short}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Step 1 — basics ─────────────────────────────────── */}
        {step === 0 && (
          <section className={cardClass}>
            <div className="mb-5 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                اطلاعات اصلی
              </h2>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="ev-title" className={labelClass}>
                  عنوان رویداد
                </label>
                <input
                  id="ev-title"
                  type="text"
                  maxLength={80}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="مثال: هکاتون هوش مصنوعی تهران"
                  className={`mt-2 ${fieldClass}`}
                />
                <span className="mt-1.5 block text-[11px] text-slate-400 dark:text-slate-500">
                  {toFa(title.length)} از ۸۰ نویسه
                </span>
              </div>

              {/* Category and capacity sit next to each other */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="ev-category" className={labelClass}>
                    دسته‌بندی
                  </label>
                  <select
                    id="ev-category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className={`mt-2 ${fieldClass}`}
                  >
                    <option value="">انتخاب دسته‌بندی…</option>
                    {categories.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1.5 block text-[11px] text-slate-400 dark:text-slate-500">
                    دسته‌بندی، فیلترهای صفحه کشف را دقیق‌تر می‌کند.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="ev-capacity" className={labelClass}>
                      ظرفیت رویداد
                    </label>
                    <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={capacityUndefined}
                        onChange={(event) => setCapacityUndefined(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
                      />
                      نامشخص
                    </label>
                  </div>
                  <div className="relative mt-2">
                    <input
                      id="ev-capacity"
                      inputMode="numeric"
                      disabled={capacityUndefined}
                      value={capacityUndefined ? "" : toFa(capacity)}
                      onChange={(event) => setCapacity(normalizeDigits(event.target.value).slice(0, 5))}
                      placeholder={capacityUndefined ? "نامشخص" : "۵۰"}
                      className={`${fieldSuffixed} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800/60 dark:disabled:text-slate-500`}
                    />
                    <span className="pointer-events-none absolute inset-y-0 end-3.5 flex items-center text-xs font-bold text-slate-400 dark:text-slate-500">
                      نفر
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                    {capacityUndefined
                      ? "بدون سقف ظرفیت؛ ثبت‌نام همیشه باز است و کسی در لیست انتظار نمی‌رود."
                      : "بعد از پر شدن ظرفیت، بقیه در لیست انتظار ثبت‌نام می‌شوند."}
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="ev-description" className={labelClass}>
                  توضیحات رویداد
                </label>
                <textarea
                  id="ev-description"
                  rows={5}
                  maxLength={500}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="درباره رویداد، سخنران‌ها، پیش‌نیازها و نکات مهم بنویسید…"
                  className={`mt-2 resize-y ${fieldClass}`}
                />
                <span className="mt-1.5 block text-[11px] text-slate-400 dark:text-slate-500">
                  {toFa(description.length)} از ۵۰۰ حرف
                </span>
              </div>

              {/* «چه چیزی در انتظارتان است؟» — the bullets on the event page */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={labelClass}>چه چیزی در انتظارتان است؟</span>
                  <button
                    type="button"
                    onClick={addHighlight}
                    disabled={highlights.length >= 10}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition-all duration-200 hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    افزودن مورد
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  هر مورد با تیک سبز در بخش «چه چیزی در انتظارتان است؟» صفحه رویداد نمایش
                  داده می‌شود.
                </p>

                {highlights.length === 0 ? (
                  <button
                    type="button"
                    onClick={addHighlight}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-3 text-xs font-bold text-slate-500 transition-all duration-200 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:border-blue-800 dark:hover:text-blue-300"
                  >
                    <Plus className="h-4 w-4" />
                    افزودن اولین مورد
                  </button>
                ) : (
                  <div className="mt-2 space-y-2">
                    {highlights.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={120}
                          value={item}
                          onChange={(event) => updateHighlight(index, event.target.value)}
                          placeholder="مثال: منتورشیپ تخصصی در طول رویداد"
                          aria-label={`مورد ${toFa(index + 1)} چه چیزی در انتظارتان است`}
                          className={fieldClass}
                        />
                        <button
                          type="button"
                          onClick={() => removeHighlight(index)}
                          aria-label={`حذف مورد ${toFa(index + 1)}`}
                          title="حذف مورد"
                          className="shrink-0 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-400 transition-colors duration-200 hover:border-red-200 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 dark:hover:border-red-900 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* «برنامه زمانی» — the timed rows on the event page */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={labelClass}>برنامه زمانی</span>
                  <button
                    type="button"
                    onClick={addAgendaRow}
                    disabled={agenda.length >= 15}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition-all duration-200 hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    افزودن ردیف
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  ترتیب ردیف‌ها همان ترتیب نمایش در صفحه رویداد است.
                </p>

                {agenda.length === 0 ? (
                  <button
                    type="button"
                    onClick={addAgendaRow}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-3 text-xs font-bold text-slate-500 transition-all duration-200 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:border-blue-800 dark:hover:text-blue-300"
                  >
                    <Plus className="h-4 w-4" />
                    افزودن اولین ردیف برنامه
                  </button>
                ) : (
                  <div className="mt-2 space-y-2">
                    {agenda.map((row, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[84px_minmax(0,1fr)_auto] items-center gap-2"
                      >
                        <input
                          type="text"
                          maxLength={24}
                          value={row.time}
                          onChange={(event) =>
                            updateAgendaRow(index, "time", event.target.value)
                          }
                          placeholder="۰۹:۰۰"
                          aria-label={`ساعت ردیف ${toFa(index + 1)} برنامه زمانی`}
                          className={`${fieldClass} text-center`}
                        />
                        <input
                          type="text"
                          maxLength={120}
                          value={row.title}
                          onChange={(event) =>
                            updateAgendaRow(index, "title", event.target.value)
                          }
                          placeholder="مثال: ثبت‌نام و پذیرایی"
                          aria-label={`عنوان ردیف ${toFa(index + 1)} برنامه زمانی`}
                          className={fieldClass}
                        />
                        <button
                          type="button"
                          onClick={() => removeAgendaRow(index)}
                          aria-label={`حذف ردیف ${toFa(index + 1)} برنامه زمانی`}
                          title="حذف ردیف"
                          className="shrink-0 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-400 transition-colors duration-200 hover:border-red-200 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 dark:hover:border-red-900 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <span className={labelClass}>نوع بلیت</span>
                <div className="mt-2 flex gap-2">
                  {(
                    [
                      { id: "free", label: "رایگان" },
                      { id: "paid", label: "پولی" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={priceType === option.id}
                      onClick={() => setPriceType(option.id)}
                      className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 sm:text-sm ${
                        priceType === option.id
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {priceType === "paid" && (
                <div>
                  <label htmlFor="ev-price" className={labelClass}>
                    قیمت هر بلیت
                  </label>
                  <div className="relative mt-2">
                    <input
                      id="ev-price"
                      inputMode="numeric"
                      value={price ? faNumber(Number(price)) : ""}
                      onChange={(event) =>
                        setPrice(
                          normalizeDigits(event.target.value)
                            .replace(/[^0-9]/g, "")
                            .slice(0, 9),
                        )
                      }
                      placeholder="۲۹۰,۰۰۰"
                      className={fieldSuffixed}
                    />
                    <span className="pointer-events-none absolute inset-y-0 end-3.5 flex items-center text-xs font-bold text-slate-400 dark:text-slate-500">
                      تومان
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Step 2 — time & place ──────────────────────────── */}
        {step === 1 && (
          <section className={cardClass}>
            <div className="mb-5 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                <Clock className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                زمان و مکان برگزاری
              </h2>
            </div>

            <div className="space-y-5">
              {/* Date and clock wheels sit next to each other */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Date — روز ← ماه ← سال; the year cell is a fixed readout
                    of the event's year, never a wheel */}
                <div>
                  <span className="mb-2 block px-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    تاریخ برگزاری
                  </span>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-1.5 dark:border-slate-700 dark:bg-slate-800/70">
                    <div aria-hidden="true" className="mb-1 flex gap-1 sm:gap-2">
                      {["روز", "ماه", "سال"].map((caption) => (
                        <span
                          key={caption}
                          className="flex-1 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500"
                        >
                          {caption}
                        </span>
                      ))}
                    </div>

                    <div className="relative" role="group" aria-label="تاریخ برگزاری">
                      {/* The highlight band the selected row sits in. */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 top-1/2 z-0 h-10 -translate-y-1/2 rounded-lg bg-blue-50 ring-1 ring-blue-100 dark:bg-blue-950/60 dark:ring-blue-900"
                      />
                      <div
                        className="relative z-10 flex gap-1 sm:gap-2"
                        style={{ height: WHEEL_HEIGHT }}
                      >
                        <Wheel
                          label="روز برگزاری"
                          items={dayItems}
                          selected={date.day}
                          onSelect={(next) => setDate((prev) => ({ ...prev, day: next }))}
                        />
                        <Wheel
                          label="ماه برگزاری"
                          items={monthItems}
                          selected={date.month}
                          onSelect={(next) =>
                            setDate((prev) => ({
                              month: next,
                              /* A short month pulls an out-of-range day back in. */
                              day: Math.min(prev.day, jalaaliMonthLength(year, next)),
                            }))
                          }
                        />
                        {/* Not a wheel — the year never changes. */}
                        <span
                          aria-label={`سال شمسی (ثابت): ${year}`}
                          className="flex min-w-0 flex-1 items-center justify-center text-sm font-extrabold tabular-nums text-blue-700 select-none dark:text-blue-300"
                        >
                          {toFa(year)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clock — ساعت / دقیقه */}
                <div>
                  <span className="mb-2 block px-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    ساعت برگزاری
                  </span>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-1.5 dark:border-slate-700 dark:bg-slate-800/70">
                    <div aria-hidden="true" className="mb-1 flex gap-1 sm:gap-2">
                      {["ساعت", "دقیقه"].map((caption) => (
                        <span
                          key={caption}
                          className="flex-1 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500"
                        >
                          {caption}
                        </span>
                      ))}
                    </div>

                    <div className="relative" role="group" aria-label="ساعت برگزاری">
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 top-1/2 z-0 h-10 -translate-y-1/2 rounded-lg bg-blue-50 ring-1 ring-blue-100 dark:bg-blue-950/60 dark:ring-blue-900"
                      />
                      <div
                        className="relative z-10 flex gap-1 sm:gap-2"
                        style={{ height: WHEEL_HEIGHT }}
                      >
                        <Wheel
                          label="ساعت برگزاری"
                          items={hourItems}
                          selected={hour}
                          onSelect={setHour}
                        />
                        <Wheel
                          label="دقیقه برگزاری"
                          items={minuteItems}
                          selected={minute}
                          onSelect={setMinute}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <span className={labelClass}>نحوه برگزاری</span>
                <div className="mt-2 flex gap-2">
                  {(
                    [
                      { id: "inperson", label: "حضوری" },
                      { id: "online", label: "آنلاین" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={mode === option.id}
                      onClick={() => setMode(option.id)}
                      className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 sm:text-sm ${
                        mode === option.id
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {mode === "inperson" ? (
                <>
                  <div>
                    <label htmlFor="ev-venue" className={labelClass}>
                      آدرس محل برگزاری
                    </label>
                    <input
                      id="ev-venue"
                      type="text"
                      value={venue}
                      onChange={(event) => setVenue(event.target.value)}
                      placeholder="مثال: دانشگاه صنعتی شریف، تالار اندیشه"
                      className={`mt-2 ${fieldClass}`}
                    />
                  </div>

                </>
              ) : (
                <div>
                  <label htmlFor="ev-link" className={labelClass}>
                    لینک پخش آنلاین
                  </label>
                  <input
                    id="ev-link"
                    type="url"
                    dir="ltr"
                    value={link}
                    onChange={(event) => setLink(event.target.value)}
                    placeholder="https://…"
                    className={`mt-2 text-left ${fieldClass}`}
                  />
                  <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                    این لینک فقط بعد از تایید نهایی، برای ثبت‌نام‌شده‌ها نمایش داده می‌شود.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Step 3 — preview & publish ─────────────────────── */}
        {step === 2 && (
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            {/* The live card */}
            <section className={cardClass}>
              <div className="mb-5 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                  <Check className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  پیش‌نمایش کارت رویداد
                </h2>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
                {/* Badge row */}
                <div className="flex items-center gap-2 px-4 pt-4">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                      category
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                    }`}
                  >
                    {category || "دسته‌بندی نشده"}
                  </span>
                </div>

                {/* Cover */}
                <div className="relative mx-4 mt-3 aspect-video overflow-hidden rounded-xl">
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                  <div className="absolute inset-0 bg-black/10" />
                  {CategoryIcon && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-sm">
                        <CategoryIcon className="h-8 w-8" strokeWidth={1.75} />
                      </span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={shuffleGradient}
                    aria-label="تغییر رنگ کاور"
                    title="تغییر رنگ کاور"
                    className="absolute top-2 end-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-sm backdrop-blur transition-all duration-200 hover:text-blue-600 active:scale-95 dark:bg-slate-900/95 dark:text-slate-300 dark:hover:text-blue-400"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>
                  <span className="absolute bottom-2 end-2 flex max-w-[85%] items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-700 backdrop-blur dark:bg-slate-900/95 dark:text-slate-300">
                    {mode === "online" ? (
                      <>
                        <Monitor className="h-3 w-3 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span className="truncate">آنلاین</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-3 w-3 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span className="truncate">{venue || "آدرس برگزاری"}</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-3 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
                    {dateString}
                  </p>
                  <h3
                    className={`line-clamp-2 text-base font-bold leading-7 ${
                      title.trim()
                        ? "text-slate-800 dark:text-slate-100"
                        : "text-slate-300 dark:text-slate-600"
                    }`}
                  >
                    {title.trim() || "عنوان رویداد شما اینجا نمایش داده می‌شود"}
                  </h3>
                  {description.trim() && (
                    <p className="line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {description.trim()}
                    </p>
                  )}
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                      {(organizerName || "م").trim().charAt(0) || "م"}
                    </span>
                    <p className="min-w-0 text-xs">
                      <span className="block truncate font-bold text-slate-700 dark:text-slate-300">
                        {organizerName || "برگزارکننده"}
                      </span>
                      <span className="block truncate text-slate-400 dark:text-slate-500">
                        برگزارکننده
                      </span>
                    </p>
                  </div>

                  {/* The two lists the event page will render — only the rows
                      that survived the same trim/filter as the submit payload. */}
                  {previewHighlights.length > 0 && (
                    <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        چه چیزی در انتظارتان است؟
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {previewHighlights.map((item, index) => (
                          <li
                            key={`highlight-${index}`}
                            className="flex items-start gap-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400"
                          >
                            <Check
                              className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500"
                              strokeWidth={3}
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {previewAgenda.length > 0 && (
                    <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
                        برنامه زمانی
                      </p>
                      <ol className="mt-2 space-y-2">
                        {previewAgenda.map((row, index) => (
                          <li
                            key={`agenda-${index}`}
                            className="flex gap-2 text-[11px] leading-5"
                          >
                            <span className="w-12 shrink-0 font-bold text-blue-600 dark:text-blue-400">
                              {row.time}
                            </span>
                            <span className="text-slate-600 dark:text-slate-300">
                              {row.title}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                {/* Price + capacity */}
                <div className="space-y-3 border-t border-slate-200 px-4 py-3.5 dark:border-slate-700">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Ticket className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    {priceType === "free" ? (
                      <span className="text-emerald-600 dark:text-emerald-400">ورود رایگان</span>
                    ) : priceNumber > 0 ? (
                      <>شهریه ثبت‌نام: {faPrice(priceNumber)}</>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">قیمت بلیت</span>
                    )}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Users className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    {capacityUndefined || !capacity
                      ? "ظرفیت نامشخص"
                      : `${toFa(capacity)} صندلی`}
                  </p>
                </div>
              </div>
            </section>

            {/* Publish + tips */}
            <div className="space-y-4">
              <section className={cardClass}>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  آماده انتشار
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                  رویداد شما پس از ثبت، در صف بررسی کارشناسان قرار می‌گیرد و بعد از تأیید روی
                  صفحه کشف رویدادها نمایش داده می‌شود.
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href={back.href}
                    className="text-xs font-bold text-slate-500 transition-colors duration-200 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                  >
                    انصراف
                  </Link>
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" />
                    {pending
                      ? "در حال ثبت…"
                      : isEditing
                        ? "ذخیره تغییرات"
                        : "انتشار رویداد"}
                  </button>
                </div>
              </section>

              <section className={cardClass}>
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  نکات انتشار
                </h2>
                <ul className="mt-3 space-y-2.5">
                  {tips.map((tip) => (
                    <li
                      key={tip}
                      className="flex items-start gap-2 text-xs leading-6 text-slate-500 dark:text-slate-400"
                    >
                      <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={3} />
                      {tip}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}

        {/* ── Step navigation ─────────────────────────────────── */}
        {!isLastStep && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-md dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              مرحله قبل
            </button>

            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
            >
              مرحله بعد
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
