import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Braces,
  Cloud,
  Cpu,
  Flame,
  PenTool,
  Rocket,
  Star,
  type LucideIcon,
} from "lucide-react";
import AddEventButton from "@/components/auth/AddEventButton";
import MagneticFloat from "./MagneticFloat";
import SearchBar from "./SearchBar";

/* ── Orbital nodes (category/tech badges floating on the rings) ── */
type OrbitNode = {
  icon: LucideIcon;
  color: string;
  label: string;
  /** Base = small screens (corner slots), `lg:` = side slots along the rings. */
  position: string;
  delay: string;
  /** The two extra nodes only join at lg so mobile keeps 4 compact nodes. */
  extra?: boolean;
};

const orbitNodes: OrbitNode[] = [
  {
    icon: Cpu,
    color: "text-blue-500 dark:text-blue-400",
    label: "هوش مصنوعی",
    position: "left-[12%] top-[3%] lg:left-[17%] lg:top-[19%]",
    delay: "0s",
  },
  {
    icon: Rocket,
    color: "text-orange-500 dark:text-orange-400",
    label: "استارتاپ",
    position: "left-[88%] top-[3%] lg:left-[83%] lg:top-[19%]",
    delay: "1.4s",
  },
  {
    icon: Braces,
    color: "text-cyan-500 dark:text-cyan-400",
    label: "کدنویسی",
    position: "left-[12%] top-[97%] lg:left-[18%] lg:top-[71%]",
    delay: "2.2s",
  },
  {
    icon: BookOpen,
    color: "text-emerald-500 dark:text-emerald-400",
    label: "کتاب و فرهنگ",
    position: "left-[88%] top-[97%] lg:left-[82%] lg:top-[71%]",
    delay: "0.7s",
  },
  {
    icon: PenTool,
    color: "text-purple-500 dark:text-purple-400",
    label: "دیزاین و UX",
    position: "left-[6%] top-[45%]",
    delay: "1.8s",
    extra: true,
  },
  {
    icon: Cloud,
    color: "text-slate-500 dark:text-slate-400",
    label: "زیرساخت و کلاود",
    position: "left-[94%] top-[45%]",
    delay: "2.7s",
    extra: true,
  },
];

/* Concentric ring diameters (px) — outer two are hidden below md. */
const RINGS = [
  { size: 420, mobile: true },
  { size: 640, mobile: true },
  { size: 880, mobile: true },
  { size: 1150, mobile: false },
  { size: 1400, mobile: false },
];

const partners = [
  "دانشگاه صنعتی شریف",
  "دانشگاه تهران",
  "کارخانه نوآوری آزادی",
  "دیجی‌کالا نکست",
  "تپسی",
  "اسنپ",
  "ابر آروان",
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-slate-950">
      {/* Radial backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,#eff6ff_0%,#ffffff_70%)] dark:bg-[radial-gradient(ellipse_at_center,#0f172a_0%,#020617_70%)]"
      />
      {/* Soft accent blob — kept to the top corner only; the bottom of the
          hero stays clean so it flows straight into the next section. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -end-24 h-80 w-80 rounded-full bg-blue-300/30 blur-3xl dark:bg-blue-900/30"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Orbit field: rings + nodes + central core ─────────── */}
        <div className="relative flex flex-col items-center pt-24 pb-28 md:pt-28 md:pb-32">
          {/* Concentric rings + accent arcs */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
          >
            {RINGS.map((ring) => (
              <div
                key={ring.size}
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/70 dark:border-slate-700/60 ${
                  ring.mobile ? "" : "hidden md:block"
                }`}
                style={{ width: ring.size, height: ring.size }}
              />
            ))}

            {/* Gradient accent arcs riding the middle ring */}
            <div className="absolute left-1/2 top-1/2 hidden h-[880px] w-[880px] -translate-x-1/2 -translate-y-1/2 md:block">
              <svg viewBox="0 0 100 100" fill="none" className="h-full w-full animate-orbit-spin">
                <defs>
                  <linearGradient id="hero-arc-blue" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.9" />
                  </linearGradient>
                  <linearGradient id="hero-arc-cyan" x1="1" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.85" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="49.5"
                  stroke="url(#hero-arc-blue)"
                  strokeWidth="0.35"
                  strokeDasharray="40 271"
                  strokeLinecap="round"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="49.5"
                  stroke="url(#hero-arc-cyan)"
                  strokeWidth="0.35"
                  strokeDasharray="28 283"
                  strokeDashoffset="-165"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* ── Central content core ────────────────────────────── */}
          <div className="relative z-20 flex w-full max-w-2xl flex-col items-center text-center">
            {/* Social proof pill */}
            <div className="mb-6 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-slate-200/80 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ۴.۹ از ۵ رضایت کاربران
              </span>
              <span
                aria-hidden="true"
                className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600"
              />
              <span className="flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                +۲,۴۰۰ رویداد برگزار شده
              </span>
            </div>

            {/* Headline */}
            <h1 className="max-w-2xl text-center text-4xl font-black leading-[1.25] tracking-tight text-slate-900 dark:text-slate-50 md:text-5xl lg:text-6xl">
              جایی برای{" "}
              <span className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-400">
                دورهمی‌های واقعی
              </span>{" "}
              و شبکه‌سازی
            </h1>

            {/* Sub-headline */}
            <p className="mt-4 max-w-xl text-center text-base leading-relaxed text-slate-600 dark:text-slate-400 md:text-lg">
              از هکاتون‌های هوش مصنوعی تا ورکشاپ‌های تخصصی دیزاین؛ رویداد مورد علاقه‌تان را
              پیدا کنید، ظرفیت دورهمی را تکمیل کنید و بدون دغدغه شرکت کنید.
            </p>

            {/* CTA group */}
            <div className="mt-7 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/events"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-blue-600 hover:shadow-lg active:scale-95 sm:w-auto dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                کشف دورهمی‌ها
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <AddEventButton
                href="/dashboard/events/new"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-xs transition-all duration-200 hover:bg-slate-50 active:scale-95 sm:w-auto dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                ثبت رایگان رویداد
              </AddEventButton>
            </div>

            {/* Omni search */}
            <div className="mt-8 w-full">
              <SearchBar />
            </div>

            {/* Live activity toast stack — magnetic: each card drifts toward
                a nearby cursor independently, the peek card trailing the main
                one (longer lag, shorter pull), then both settle back. */}
            <div className="relative mt-10 w-full max-w-sm pb-6">
              {/* Peek card underneath */}
              <MagneticFloat
                className="absolute inset-x-4 bottom-0"
                radius={80}
                strength={9}
                duration={1300}
              >
                <div className="animate-float rounded-2xl border border-slate-100 bg-white/80 px-3.5 py-2.5 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-800/80 dark:shadow-black/20">
                  <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-700 dark:text-slate-200">سارا امینی</span>{" "}
                    رویداد «دیزاین سیستم در مقیاس بالا» را بوکمارک کرد
                  </p>
                </div>
              </MagneticFloat>
              {/* Main card */}
              <MagneticFloat
                className="relative z-10 w-full"
                radius={120}
                strength={15}
                duration={850}
              >
                <div className="animate-float-delayed flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/95 p-3.5 text-start shadow-xl shadow-blue-400/20 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-blue-950/40">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white ring-2 ring-blue-100 dark:ring-blue-950">
                    ع
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      علی رضایی به هکاتون هوش مصنوعی پیوست
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                      ۲ دقیقه پیش • ظرفیت تکمیل شد: ۳ از ۴ نفر
                    </p>
                  </div>
                  <span className="relative mt-1 flex h-2 w-2 shrink-0" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                </div>
              </MagneticFloat>
            </div>
          </div>

          {/* ── Floating planetary nodes ────────────────────────── */}
          {orbitNodes.map((node, index) => {
            const Icon = node.icon;
            return (
              <div
                key={node.label}
                className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 ${
                  node.extra ? "hidden lg:block" : ""
                } ${node.position}`}
              >
                <span
                  className={`block ${
                    index % 2 === 0 ? "animate-float" : "animate-float-delayed"
                  }`}
                  style={{ animationDelay: node.delay }}
                >
                  <Link
                    href="/#categories"
                    aria-label={node.label}
                    title={node.label}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-white p-2.5 shadow-lg shadow-blue-500/10 transition-transform duration-200 hover:scale-110 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/40 md:h-14 md:w-14"
                  >
                    <Icon
                      className={`h-5 w-5 md:h-6 md:w-6 ${node.color}`}
                      strokeWidth={2.2}
                    />
                  </Link>
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Trusted-by strip ─────────────────────────────────── */}
        {/* Temporarily hidden (kept in the tree — just add `hidden` removal
            when it should come back). */}
        <div className="relative z-20 hidden pb-14 pt-2 text-center">
          <p className="mb-6 text-xs font-semibold tracking-wide text-slate-400 dark:text-slate-500">
            مورد اعتماد بیش از ۸۵,۰۰۰ شرکت‌کننده و معتبرترین برگزارکنندگان ایران
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
            {partners.map((name) => (
              <span
                key={name}
                className="cursor-default text-sm font-black text-slate-400 opacity-60 transition-opacity duration-200 hover:opacity-100 dark:text-slate-500"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
