import type { Metadata } from "next";
import { Clock, Headset, Mail, MessageSquare, Phone } from "lucide-react";
import SupportForm from "@/components/support/SupportForm";

export const metadata: Metadata = {
  title: "پشتیبانی",
  description:
    "تماس با پشتیبانی رویدادشو؛ ایمیل، تلفن و فرم پیام برای پیگیری ثبت‌نام، پرداخت و برگزاری رویدادها",
};

const channels = [
  {
    icon: Mail,
    label: "ایمیل",
    value: "info@kooja.ir",
    href: "mailto:info@kooja.ir",
    hint: "برای پیگیری و سؤالات عمومی",
    tint: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    icon: Phone,
    label: "تلفن",
    value: "0915-xxx-xxxx",
    href: "tel:0915xxxxxxx",
    hint: "شنبه تا چهارشنبه، ۹ تا ۱۷",
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    icon: Clock,
    label: "زمان پاسخ",
    value: "حداکثر ۲۴ ساعت",
    href: null,
    hint: "روزهای کاری، زودتر هم پاسخ می‌دهیم",
    tint: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
  },
];

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:px-8">
      {/* ── Page heading ─────────────────────────────────────── */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          <Headset className="h-3.5 w-3.5" />
          پشتیبانی رویدادشو
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          در کنارتان هستیم
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
          سؤالی درباره ثبت‌نام، پرداخت، بازگشت وجه یا برگزاری رویداد دارید؟ از هر کدام از
          راه‌های زیر با ما در تماس باشید یا پیامتان را از فرم زیر بفرستید.
        </p>
      </div>

      {/* ── Contact channels ─────────────────────────────────── */}
      <div className="mt-9 grid gap-4 sm:grid-cols-3">
        {channels.map((channel) => {
          const Icon = channel.icon;
          const body = (
            <>
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${channel.tint}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold text-slate-400 dark:text-slate-500">
                  {channel.label}
                </span>
                <span
                  dir="ltr"
                  className="mt-0.5 block truncate text-sm font-extrabold text-slate-800 dark:text-slate-100"
                >
                  {channel.value}
                </span>
                <span className="mt-1 block text-[11px] text-slate-400 dark:text-slate-500">
                  {channel.hint}
                </span>
              </span>
            </>
          );

          return channel.href ? (
            <a
              key={channel.label}
              href={channel.href}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-start shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-900"
            >
              {body}
            </a>
          ) : (
            <div
              key={channel.label}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {body}
            </div>
          );
        })}
      </div>

      {/* ── Message form ─────────────────────────────────────── */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
            <MessageSquare className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-800 sm:text-lg dark:text-slate-100">
              ارسال پیام
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              فیلدهای ستاره‌دار الزامی‌اند.
            </p>
          </div>
        </div>

        <SupportForm />
      </div>

      {/* ── Note ─────────────────────────────────────────────── */}
      <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 text-sm leading-7 text-slate-600 sm:p-6 dark:border-blue-950 dark:bg-blue-950/40 dark:text-slate-300">
        برای پیگیری ثبت‌نام یا پرداخت، لطفاً شماره موبایل و کد پیگیری را در متن پیام
        بنویسید تا سریع‌تر به جواب برسید.
      </div>
    </div>
  );
}
