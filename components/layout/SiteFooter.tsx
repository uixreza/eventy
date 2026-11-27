import Link from "next/link";
import { toJalaali } from "jalaali-js";
import { cacheLife } from "next/cache";
import { ArrowLeft, CalendarSearch, Heart, Sparkles, Ticket } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { toFa } from "@/lib/utils";

/**
 * The current Jalali year, for the copyright line.
 *
 * It is read inside a cached scope so the footer stays part of the static
 * shell — a bare `new Date()` during prerendering is an "unstable value" for
 * Cache Components.
 */
async function currentJalaliYear(): Promise<number> {
  "use cache";
  cacheLife("days");

  const now = new Date();
  return toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate()).jy;
}

/**
 * The marketing footer.
 *
 * Every link here points at a page that exists (or an anchor on the landing
 * page) — there are no placeholder destinations. The app badges, social
 * buttons, newsletter form and trust badges of the old footer were pure
 * decoration for features that do not exist, so they are gone.
 */

const exploreLinks = [
  { label: "همه رویدادها", href: "/events" },
  { label: "رویدادهای منتخب", href: "/#events" },
  { label: "درباره ما", href: "/about" },
  { label: "دسته‌بندی‌ها", href: "/#categories" },
];

const accountLinks = [
  { label: "داشبورد من", href: "/dashboard" },
  { label: "رویدادهای من", href: "/dashboard/events" },
  { label: "ثبت رویداد جدید", href: "/dashboard/events/new" },
  { label: "علاقه‌مندی‌ها", href: "/dashboard/saved" },
  { label: "تنظیمات حساب", href: "/dashboard/settings" },
];

const howItWorks = [
  { icon: CalendarSearch, title: "کشف یا ساخت", text: "رویداد پیدا کن یا خودت بساز." },
  { icon: Heart, title: "ذخیره برای بعد", text: "رویدادهای مورد علاقه‌ات را نشانه بزن." },
  { icon: Ticket, title: "حضور و شبکه", text: "با بلیت دیجیتال حاضر شو." },
];

/* Decorative corner orbit — concentric ring diameters (px), centered on the
   footer's bottom-left corner so only the top-right quarter of each shows. */
const footerOrbitRings = [280, 460, 640, 820];

export default async function SiteFooter() {
  const year = await currentJalaliYear();

  return (
    <footer className="relative overflow-hidden border-t border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* ── Corner orbit: concentric rings centered exactly on the
          bottom-left corner, so only their top-right quarter shows inside
          the footer — overflow-hidden clips the rest off-screen. */}
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 z-0">
        {footerOrbitRings.map((size) => (
          <div
            key={size}
            className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 rounded-full border border-slate-200/70 dark:border-slate-700/60"
            style={{ width: size, height: size }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── CTA strip ─────────────────────────────────────────── */}
        <div className="pt-10 sm:pt-12">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 shadow-xl shadow-blue-900/20 sm:p-8">
            {/* Decorative glow + grid */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.28),transparent_55%)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.25] bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
            />

            <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold text-white ring-1 ring-white/25 backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5" />
                  ویژه برگزارکنندگان
                </span>
                <h2 className="mt-3 text-lg font-extrabold leading-8 text-white sm:text-xl">
                  رویدادت را بساز، ظرفیتش را با آدم‌های درست پر کن.
                </h2>
                <p className="mt-1.5 max-w-lg text-sm leading-7 text-white/80">
                  ثبت رویداد رایگان است؛ بلیت، یادآوری و تسویه خودکار در داشبورد مدیریت می‌شود.
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                <Link
                  href="/dashboard/events/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-lg transition-all duration-200 hover:bg-white/90 active:scale-[0.98]"
                >
                  ثبت رویداد جدید
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/25 backdrop-blur transition-all duration-200 hover:bg-white/20 active:scale-[0.98]"
                >
                  دیدن رویدادها
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Columns ───────────────────────────────────────────── */}
        <div className="grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Link href="/" className="text-xl">
              <BrandMark />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-500 dark:text-slate-400">
              پیونددهنده مشتاقان یادگیری، شبکه‌سازی و دورهمی‌های حرفه‌ای در ایران — برای
              شرکت‌کننده‌ها و برگزارکننده‌ها.
            </p>
            <p className="mt-4 text-xs leading-6 text-slate-400 dark:text-slate-500">
              ساخته‌شده با ❤️ برای جامعه رویداد ایران
            </p>
          </div>

          {/* Explore */}
          <nav className="lg:col-span-3" aria-label="رویدادها">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">
              رویدادها
            </h3>
            <ul className="space-y-2.5">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 transition-colors duration-200 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Account */}
          <nav className="lg:col-span-2" aria-label="حساب کاربری">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">
              حساب کاربری
            </h3>
            <ul className="space-y-2.5">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 transition-colors duration-200 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* How it works */}
          <div className="lg:col-span-3">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">
              در سه قدم
            </h3>
            <ul className="space-y-3">
              {howItWorks.map((step) => (
                <li key={step.title} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <step.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                      {step.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-6 text-slate-400 dark:text-slate-500">
                      {step.text}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ────────────────────────────────────────── */}
        <div className="border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col items-center justify-between gap-3 py-5 text-xs text-slate-400 sm:flex-row dark:text-slate-500">
            <p>© {toFa(year)} Kooja — تمامی حقوق محفوظ است.</p>
            <Link
              href="/rules"
              className="font-bold transition-colors duration-200 hover:text-blue-600 dark:hover:text-blue-400"
            >
              قوانین و مقررات
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
