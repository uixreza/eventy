import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Code2, GraduationCap, Sparkles, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "درباره ما",
  description:
    "رضا کمالی، معلم زبان انگلیسی و برنامه نویس با بیش از ۱۰ سال تجربه، بنیانگذار Kooja؛ بستری ساده برای گردهم آوردن آدمهایی از نقاط مختلف ایران",
};

const highlights = [
  {
    icon: GraduationCap,
    title: "معلم زبان انگلیسی",
    text: "تدریس و یادگیری زبان",
    tint: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    icon: Code2,
    title: "برنامه نویس",
    text: "توسعهٔ محصولات وب",
    tint: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
  },
  {
    icon: Sparkles,
    title: "بیش از ۱۰ سال تجربه",
    text: "بیش از یک دهه کار و تمرین",
    tint: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
  },
  {
    icon: Users,
    title: "گردهمایی سراسری",
    text: "از نقاط مختلف ایران",
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:px-8">
      {/* ── Page heading ─────────────────────────────────────── */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          <Sparkles className="h-3.5 w-3.5" />
          درباره ما
        </span>
      </div>

      {/* ── Intro card ──────────────────────────────────────── */}
      <div className="mt-9 grid items-center gap-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 md:grid-cols-2 dark:border-slate-700 dark:bg-slate-900">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100 shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <Image
            src="/assets/images/me.webp"
            alt="عکس رضا کمالی"
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            className="object-cover"
            priority
          />
        </div>

        <div className="min-w-0 rounded-2xl bg-blue-50/60 p-5 dark:bg-blue-950/30 sm:p-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            رضا کمالی
          </h1>
          <h2 className="mt-1 text-sm font-bold text-blue-700 dark:text-blue-300">
            بنیانگذار Kooja
          </h2>
          <blockquote className="mt-4 text-start text-sm leading-7 text-slate-700 sm:text-base dark:text-slate-200">
            معلم زبان انگلیسی و برنامه نویس با بیش از ۱۰ سال تجربه هستم؛ بالاخره تصمیم
            گرفتم بستری دلپذیر و ساده برای گردهم آوردن آدمهایی از نقاط مختلف ایران بسازم.
          </blockquote>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Kooja حاصل همان تصمیم است: جایی ساده برای پیدا کردن رویدادها، ساختن رویدادهای تازه و
            نزدیک شدن آدمهایی از سراسر ایران به یکدیگر.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
            >
              دیدن رویدادها
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-all duration-200 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:text-blue-400"
            >
              تماس با ما
            </Link>
          </div>
        </div>
      </div>

      {/* ── Highlights ──────────────────────────────────────── */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-start shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.tint}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-xs text-slate-400 dark:text-slate-500">
                  {item.text}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
