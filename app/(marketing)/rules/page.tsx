import type { Metadata } from "next";
import {
  BadgeCheck,
  CalendarX2,
  CreditCard,
  EyeOff,
  Gavel,
  MessageSquareWarning,
  RotateCcw,
  ShieldCheck,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { toFa } from "@/lib/utils";

export const metadata: Metadata = {
  title: "قوانین و مقررات",
  description:
    "قوانین و مقررات استفاده از Kooja؛ شرایط ثبت‌نام در رویدادها، بازگشت وجه، مسئولیت برگزارکنندگان و حریم خصوصی کاربران",
};

type RuleSection = {
  id: string;
  title: string;
  icon: LucideIcon;
  tint: string;
  items: string[];
};

const ruleSections: RuleSection[] = [
  {
    id: "general",
    title: "کلیات و پذیرش قوانین",
    icon: Gavel,
    tint: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
    items: [
      "استفاده از Kooja به معنای پذیرش کامل این قوانین و مقررات است؛ در صورت عدم موافقت، از استفاده از پلتفرم خودداری کنید.",
      "این قوانین درباره همه کاربران — شرکت‌کنندگان، برگزارکنندگان و بازدیدکنندگان — یکسان اعمال می‌شود.",
      "Kooja حق بازبینی و به‌روزرسانی این قوانین را دارد؛ نسخه به‌روزشده از همین صفحه منتشر می‌شود.",
    ],
  },
  {
    id: "account",
    title: "حساب کاربری",
    icon: BadgeCheck,
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    items: [
      "ثبت‌نام فقط با شماره موبایل معتبر انجام می‌شود و هر شماره می‌تواند یک حساب داشته باشد.",
      "حفظ اطلاعات ورود بر عهده خود کاربر است؛ هر فعالیتی که با حساب شما انجام شود، فعالیت شما محسوب می‌شود.",
      "وارد کردن نام، کد ملی و تاریخ تولد باید دقیق باشد؛ این اطلاعات برای بلیت و احراز هویت رویداد استفاده می‌شود.",
      "Kooja می‌تواند حساب‌های متخلف یا جعلی را بدون اطلاع قبلی مسدود کند.",
    ],
  },
  {
    id: "registration",
    title: "ثبت‌نام در رویدادها",
    icon: CalendarX2,
    tint: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300",
    items: [
      "ثبت‌نام قطعی فقط پس از تکمیل پرداخت (یا تأیید رویداد رایگان) انجام می‌شود؛ تا آن زمان صندلی شما رزرو نیست.",
      "ظرفیت هر رویداد محدود است و ترتیب، بر اساس زمان ثبت‌نام قطعی تعیین می‌شود.",
      "بلیت دیجیتال پس از ثبت‌نام در پنل کاربری و ایمیل/پیامک ارسال می‌شود و باید در روز رویداد همراه داشته باشید.",
      "شرکت‌کننده موظف است پیش از حضور، شرایط خاص رویداد (مکان، زمان، پیش‌نیازها) را بررسی کند.",
    ],
  },
  {
    id: "payment",
    title: "پرداخت و بازگشت وجه",
    icon: CreditCard,
    tint: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
    items: [
      "پرداخت‌ها از درگاه‌های پرداخت امن داخلی انجام می‌شود؛ Kooja اطلاعات کارت شما را ذخیره نمی‌کند.",
      "در صورت لغو رویداد از سوی برگزارکننده، وجه به‌صورت کامل بازگردانده می‌شود.",
      "درخواست بازگشت وجه تا ۷۲ ساعت پیش از آغاز رویداد و فقط از مسیر پنل کاربری پذیرفته می‌شود.",
      "بازگشت وجه معمولاً تا ۷۲ ساعت کاری پس از تأیید، به حساب پرداخت‌کنده واریز می‌شود.",
    ],
  },
  {
    id: "refunds-organizer",
    title: "مسئولیت برگزارکننده",
    icon: RotateCcw,
    tint: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300",
    items: [
      "برگزارکننده متعهد است اطلاعات رویداد (زمان، مکان، هزینه، ظرفیت) را دقیق و به‌روز ثبت کند.",
      "هرگونه تغییر زمان یا مکان باید حتماً از طریق پلتفرم به اطلاع شرکت‌کنندگان برسد.",
      "در صورت لغو رویداد، برگزارکننده موظف به همکاری برای بازگشت کامل وجه شرکت‌کنندگان است.",
      "برگزارکننده مسئول کیفیت اجرای رویداد، ایمنی حاضران و تعهد به وعده‌های داده‌شده در صفحه رویداد است.",
    ],
  },
  {
    id: "conduct",
    title: "رفتار کاربران",
    icon: MessageSquareWarning,
    tint: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    items: [
      "ارسال محتوای توهین‌آمیز، فریبنده یا تبلیغاتی ناخواسته ممنوع است.",
      "کپی، فروش مجدد یا سوءاستفاده از بلیت‌ها پیگرد دارد و بلیت باطل می‌شود.",
      "هرگونه تلاش برای دور زدن پرداخت، هک یا ایجاد اختلال در سرویس ممنوع است.",
      "گزارش رفتار نامناسب از مسیر پنل کاربری پذیرفته و بررسی می‌شود.",
    ],
  },
  {
    id: "privacy",
    title: "حریم خصوصی و داده‌ها",
    icon: EyeOff,
    tint: "bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-300",
    items: [
      "شماره موبایل، نام و اطلاعات پروفایل فقط برای ارائه سرویس (بلیت، اعلان‌ها، احراز هویت) استفاده می‌شود.",
      "اطلاعات کارت بانکی هرگز نزد Kooja ذخیره نمی‌شود؛ پرداخت مستقیماً از درگاه بانکی انجام می‌شود.",
      "داده‌های شخصی بدون اجازه شما به اشخاص ثالث فروخته یا افشا نمی‌شود، جز در موارد الزام قانونی.",
      "درخواست حذف حساب از مسیر پنل کاربری قابل ثبت است و ظرف مدت قانونی پردازش می‌شود.",
    ],
  },
  {
    id: "limits",
    title: "محدودیت مسئولیت",
    icon: ShieldCheck,
    tint: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-300",
    items: [
      "Kooja واسطه ارتباط شرکت‌کنندگان و برگزارکنندگان است و مجری مستقیم رویدادها نیست.",
      "کیفیت برگزاری، ایمنی مکان و تعهدات برگزارکننده بر عهده خود برگزارکننده است.",
      "Kooja در قبال خسارات ناشی از قطعی اینترنت، فورس ماژور یا سوءاستفاده کاربر از حساب خود مسئولیتی ندارد.",
    ],
  },
  {
    id: "suspension",
    title: "تعلیق و خاتمه حساب",
    icon: UserX,
    tint: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300",
    items: [
      "نقض هریک از این قوانین می‌تواند منجر به اخطار، مسدودسازی موقت یا دائم حساب شود.",
      "در صورت تعلیق حساب، ثبت‌نام‌های فعال شما لغو و وجه‌های قابل بازگشت مسترد می‌شود.",
      "اعتراض به تصمیم تعلیق از مسیر تماس با پشتیبانی قابل پیگیری است.",
    ],
  },
];

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:px-8">
      {/* ── Page heading ─────────────────────────────────────── */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          <Gavel className="h-3.5 w-3.5" />
          قوانین Kooja
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          قوانین و مقررات
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
          برای استفاده شفاف و امن از Kooja، این قوانین درباره ثبت‌نام، پرداخت، بازگشت وجه،
          مسئولیت برگزارکنندگان و حریم خصوصی شما اعمال می‌شود.
        </p>
        <p className="mt-2 text-xs font-medium text-slate-400 dark:text-slate-500">
          آخرین به‌روزرسانی: {toFa(1404)}/۸/۲۴
        </p>
      </div>

      {/* ── Sections ─────────────────────────────────────────── */}
      <div className="mt-10 space-y-5">
        {ruleSections.map((section, i) => {
          const Icon = section.icon;
          return (
            <section
              key={section.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${section.tint}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="text-base font-bold text-slate-800 sm:text-lg dark:text-slate-100">
                  {toFa(i + 1)}. {section.title}
                </h2>
              </div>
              <ul className="mt-4 space-y-2.5">
                {section.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm leading-7 text-slate-500 dark:text-slate-400"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400 dark:bg-blue-500"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {/* ── Contact note ─────────────────────────────────────── */}
      <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 text-sm leading-7 text-slate-600 sm:p-6 dark:border-blue-950 dark:bg-blue-950/40 dark:text-slate-300">
        اگر درباره این قوانین سؤالی دارید یا موردی برای پیگیری دارید، از مسیر{" "}
        <span className="font-bold text-blue-700 dark:text-blue-300">تماس با ما</span> در
        پشتیبانی Kooja پیام بگذارید؛ در اسرع وقت پاسخ می‌دهیم.
      </div>
    </div>
  );
}
