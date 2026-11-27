import { ArrowLeft, ChevronDown, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { toFa } from "@/lib/utils";

const faqs = [
  {
    question: "چطور می‌توانم رویداد پیدا کنم و ثبت نام کنم؟",
    answer:
      "در صفحه رویدادها می‌توانی بر اساس دسته، شهر یا جستجو، دورهمی مورد نظرت را پیدا کنی. با باز کردن رویداد و زدن دکمه ثبت نام، بلیت دیجیتالت ساخته می‌شود و یادآوری آن را در حسابت پیگیری می کنی.",
  },
  {
    question: "آیا ثبت رویداد رایگان است؟",
    answer:
      "بله. ایجاد و انتشار رویداد در Kooja رایگان است و می‌توانی ظرفیت، محل برگزاری و ثبت نام‌ها را از داشبوردت مدیریت کنی.",
  },
  {
    question: "رویداد آنلاین هم می‌شود برگزار کرد؟",
    answer:
      "بله. هنگام ساخت رویداد، حالت آنلاین را انتخاب کن. در این حالت نیازی به مشخص کردن مکان نیست و رویداد در لیست رویدادهای آنلاین نمایش داده می‌شود.",
  },
  {
    question: "چرا رویدادم هنوز در سایت دیده نمی‌شود؟",
    answer:
      "هر رویداد پیش از انتشار بررسی می‌شود. تا زمانی که وضعیت آن تأیید نشده، می‌توانی آن را در داشبورد پیگیری کنی. اگر رد شده باشد، دلیل آن همان جا نشان داده می‌شود.",
  },
  {
    question: "می‌توانم رویداد ثبت‌شدهام را ویرایش کنم؟",
    answer:
      "بله. از بخش رویدادهای من می‌توانی جزئیات را تغییر دهی. هر ویرایش دوباره بررسی می‌شود و تا زمان تأیید، وضعیت رویداد دوباره به حالت بررسی باز می گردد.",
  },
  {
    question: "از کجا وضعیت بلیت و ثبت نام‌هایم را ببینم؟",
    answer:
      "در داشبورد، بخش بلیت‌ها و رویدادهای من، می‌توانی ثبت نام‌ها، بلیت دیجیتال و یادآوری‌ها را ببینی و هر زمان که لازم شد آن را بررسی کنی.",
  },
];

export default function FAQ() {
  return (
    <section className="relative overflow-hidden py-12 sm:py-14">
      {/* Warm band — transparent at both edges so it blends into the
          neighboring sections instead of forming a hard color seam. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/10 to-transparent"
      />
      {/* Faint dot texture, faded out at the edges by the mask */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(245,158,11,0.16)_1px,transparent_1px)] bg-[size:26px_26px] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
      />
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute start-[8%] bottom-[12%] h-64 w-64 rounded-full bg-amber-400/25 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Heading ─────────────────────────────────────────── */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-100 backdrop-blur dark:bg-slate-900/70 dark:text-amber-300 dark:ring-slate-800">
            <Sparkles className="h-3.5 w-3.5" />
            پرسش و پاسخ
          </span>
          <h2 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-2xl">
            سوالات پرتکرار
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
            پاسخ سوالاتی را که بیشتر از بقیه پرسیده می شوند، اینجا پیدا کن.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          {/* ── Side note ─────────────────────────────────────── */}
          <aside className="lg:col-span-4">
            <div className="rounded-2xl border border-amber-100/80 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                <MessageCircle className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-extrabold text-slate-800 dark:text-slate-100">
                جوابت را پیدا نکردی؟
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                تیم پشتیبانی Kooja آماده است تا هر سوال دیگری که داری را پاسخ بدهد.
              </p>
              <Link
                href="/support"
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-amber-600 active:scale-[0.98] dark:bg-amber-500 dark:hover:bg-amber-400"
              >
                تماس با پشتیبانی
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </aside>

          {/* ── Accordion ─────────────────────────────────────── */}
          <div className="space-y-3 lg:col-span-8">
            {faqs.map((faq, index) => (
              <details
                key={faq.question}
                open={index === 0}
                className="group rounded-2xl border border-slate-200/80 bg-white/80 shadow-xs backdrop-blur transition-all duration-200 open:border-amber-200 open:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:open:border-amber-900/60"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-[11px] font-extrabold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    {toFa(index + 1)}
                  </span>
                  <span className="flex-1 text-sm font-extrabold leading-6 text-slate-800 dark:text-slate-100 sm:text-base">
                    {faq.question}
                  </span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-200 group-open:rotate-180 group-open:bg-amber-50 group-open:text-amber-700 dark:bg-slate-800 dark:text-slate-400 dark:group-open:bg-amber-950 dark:group-open:text-amber-300">
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </summary>
                <div className="border-t border-slate-100 px-5 pb-5 pt-4 text-sm leading-7 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
