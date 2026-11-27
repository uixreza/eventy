import { ArrowLeft, CalendarSearch, Check, Heart, QrCode, Sparkles } from "lucide-react";
import AddEventButton from "@/components/auth/AddEventButton";
import { toFa } from "@/lib/utils";

const steps = [
  {
    icon: CalendarSearch,
    title: "کشف رویداد یا ایجاد دورهمی",
    description:
      "رویداد مورد علاقه‌ات را پیدا کن، یا در چند ثانیه یک دورهمی جدید بساز و ظرفیت آن را اعلام کن.",
    tint: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
    ring: "ring-blue-100/80 dark:ring-blue-900",
    chips: ["جستجو بر اساس علاقه", "ثبت رویداد در چند دقیقه"],
  },
  {
    icon: Heart,
    title: "ذخیره و پیگیری ثبت‌نام‌ها",
    description:
      "رویدادهای مورد علاقه‌ات را نشانه بزن، ثبت‌نام‌ها و یادآوری‌هایت را از پنل کاربری پیگیری کن.",
    tint: "bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-300",
    ring: "ring-pink-100/80 dark:ring-pink-900",
    chips: ["علاقه‌مندی‌ها", "یادآوری قبل از رویداد"],
  },
  {
    icon: QrCode,
    title: "حضور، یادگیری و گسترش شبکه",
    description:
      "با بلیت دیجیتال در رویداد حاضر شو، افراد جدید بشناس و شبکه ارتباطی حرفه‌ای‌ات را گسترش بده.",
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    ring: "ring-emerald-100/80 dark:ring-emerald-900",
    chips: ["بلیت دیجیتال با QR", "گواهی حضور"],
  },
];

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden py-12 sm:py-14">
      {/* Calm sky band — transparent at both edges so it blends into the
          neighboring sections instead of forming a hard color seam. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-sky-500/15 to-transparent"
      />
      {/* Faint dot texture, faded out at the edges by the mask */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(14,165,233,0.16)_1px,transparent_1px)] bg-[size:26px_26px] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
      />
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute end-[10%] bottom-[18%] h-64 w-64 rounded-full bg-sky-400/25 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Heading ─────────────────────────────────────────── */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-bold text-sky-700 ring-1 ring-sky-100 backdrop-blur dark:bg-slate-900/70 dark:text-sky-300 dark:ring-slate-800">
            <Sparkles className="h-3.5 w-3.5" />
            سه قدم، از کشف تا حضور
          </span>
          <h2 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-2xl">
            «Kooja» چگونه کار می‌کند؟
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
            از کشف رویداد تا حضور در رویداد، فقط سه قسمت ساده در پیش دارید.
          </p>
        </div>

        {/* ── Steps ───────────────────────────────────────────── */}
        <ol className="relative grid gap-8 md:grid-cols-3 md:gap-10">
          {/* Rail that links the nodes on wide screens */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-9 hidden md:block">
            <div className="mx-[17%] h-px bg-gradient-to-l from-transparent via-sky-300 to-transparent dark:via-sky-900" />
          </div>

          {steps.map((step, i) => {
            const Icon = step.icon;
            const last = i === steps.length - 1;
            return (
              <li key={step.title} className="relative flex gap-4 md:block">
                {/* Node */}
                <div className="relative shrink-0">
                  <span
                    className={`flex h-[72px] w-[72px] items-center justify-center rounded-3xl shadow-sm ring-1 transition-transform duration-300 hover:-translate-y-1 ${step.tint} ${step.ring}`}
                  >
                    <Icon className="h-7 w-7" />
                  </span>
                  <span className="absolute -bottom-2 -end-2 flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-xs font-extrabold text-white ring-4 ring-white dark:bg-sky-400 dark:text-slate-950 dark:ring-slate-950">
                    {toFa(i + 1)}
                  </span>

                  {/* Rail that links to the next step on narrow screens */}
                  {!last && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 top-[78px] mx-auto h-10 w-px bg-gradient-to-b from-sky-200 to-transparent md:hidden dark:from-sky-900"
                    />
                  )}
                </div>

                {/* Copy */}
                <div className="min-w-0 flex-1 md:mt-6">
                  <h3 className="text-base font-extrabold leading-7 text-slate-800 dark:text-slate-100 sm:text-lg">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                    {step.description}
                  </p>

                  <ul className="mt-4 space-y-2">
                    {step.chips.map((chip) => (
                      <li
                        key={chip}
                        className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400"
                      >
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-300">
                          <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                        </span>
                        {chip}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>

        {/* ── Closing call to action ───────────────────────────── */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur sm:flex-row dark:border-slate-700/80 dark:bg-slate-900/70">
          <div className="text-center sm:text-start">
            <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              آماده‌ای شروع کنی؟
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              رویداد بعدی تو همین امروز روی «Kooja» منتشر می‌شود.
            </p>
          </div>
          <AddEventButton
            href="/dashboard/events/new"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
          >
            ثبت اولین رویداد
            <ArrowLeft className="h-4 w-4" />
          </AddEventButton>
        </div>
      </div>
    </section>
  );
}
