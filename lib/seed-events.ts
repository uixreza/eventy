/**
 * The events the platform starts with.
 *
 * One list, used by three places:
 *
 * - `scripts/seed-events.ts` writes them into the database (the real source
 *   of truth for everything the site shows),
 * - `lib/data.ts` derives the mock browse list from them, so the demo pages
 *   that are still static (`/console/reports`) never drift from the seeded
 *   content,
 * - the seed script is idempotent, so it can be re-run at any time.
 */

export type SeedEvent = {
  /** Stable id used by the mock data and by the seed script. */
  id: string;
  /** URL segment of `/events/[slug]`. */
  slug: string;
  title: string;
  summary: string;
  category: string;
  city: string;
  venue: string;
  mode: "INPERSON" | "ONLINE";
  /** Jalali start date and time (the wall clock the user sees). */
  jy: number;
  jm: number;
  jd: number;
  hh: number;
  mm: number;
  /** Maximum number of participants. */
  capacity: number;
  /** Ticket price in Toman — `null` means free. */
  price: number | null;
  organizer: string;
  /** Tailwind gradient classes of the generated cover. */
  gradient: string;
};

/** Jalali year every seeded event happens in. */
export const SEED_JY = 1405;

export const seedEvents: SeedEvent[] = [
  {
    id: "be-1",
    slug: "ai-health-hackathon",
    title: "هکاتون هوش مصنوعی تهران — ساخت دستیار سلامت",
    summary:
      "۳۶ ساعت کدنویسی در تیم‌های ۴ نفره با منتورهای بالقوه تا یک دستیار سلامت واقعی بسازید و به داوری سرمایه‌گذاران برسید.",
    category: "فناوری و AI",
    city: "تهران",
    venue: "کارخانه نوآوری آزادی",
    mode: "INPERSON",
    jy: SEED_JY,
    jm: 8,
    jd: 28,
    hh: 9,
    mm: 0,
    capacity: 6,
    price: 250000,
    organizer: "انجمن فناوری تهران",
    gradient: "from-blue-600 via-indigo-500 to-purple-600",
  },
  {
    id: "be-2",
    slug: "microservices-architecture-masterclass",
    title: "مسترکلاس عمیق معماری میکروسرویس در مقیاس بالا",
    summary:
      "از مرزبندی سرویس‌ها تا استقرار چند-region؛ همراه با بازبینی زنده معماری پروژه‌های شرکت‌کنندگان توسط معمار سیستم.",
    category: "فناوری و AI",
    city: "تهران",
    venue: "دانشگاه صنعتی شریف",
    mode: "INPERSON",
    jy: SEED_JY,
    jm: 8,
    jd: 28,
    hh: 16,
    mm: 0,
    capacity: 8,
    price: 290000,
    organizer: "مهرپرداز",
    gradient: "from-sky-500 via-blue-500 to-indigo-600",
  },
  {
    id: "be-3",
    slug: "urban-photography-walk",
    title: "دورهمی دوستانه عکاسی شهری در بافت تاریخی",
    summary:
      "قدم زدن عکاسی در خیابان‌های قدیمی، نقد گروهی عکس‌ها و چای آخر روز در کافه محله؛ دوربین یا موبایل فرقی ندارد.",
    category: "دورهمی‌های دوستانه",
    city: "تهران",
    venue: "بوستان نیاوران",
    mode: "INPERSON",
    jy: SEED_JY,
    jm: 8,
    jd: 27,
    hh: 10,
    mm: 0,
    capacity: 30,
    price: null,
    organizer: "باشگاه عکاسان جوان",
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
  },
  {
    id: "be-4",
    slug: "ai-writing-webinar",
    title: "وبینار رایگان ورود به دنیای هوش مصنوعی برای نویسندگان",
    summary:
      "چطور با ابزارهای تولید متن سرعت کار را دو برابر کنیم بدون اینکه صدای شخصی متن از بین برود؛ همراه با فایل تمرین.",
    category: "وبینارهای آنلاین",
    city: "آنلاین",
    venue: "پلتفرم وبینارشو",
    mode: "ONLINE",
    jy: SEED_JY,
    jm: 8,
    jd: 24,
    hh: 20,
    mm: 0,
    capacity: 120,
    price: null,
    organizer: "مدرسه محتوا",
    gradient: "from-violet-600 via-fuchsia-500 to-pink-500",
  },
  {
    id: "be-5",
    slug: "advanced-ux-workshop",
    title: "کارگاه پیشرفته تجربه کاربری؛ از تحقیق تا سیستم دیزاین",
    summary:
      "دو روز کار عملی روی نقشه سفر، مصاحبه کاربر و ساخت کامپوننت‌های قابل استفاده مجدد برای تیم محصول.",
    category: "هنر و دیزاین",
    city: "تهران",
    venue: "دانشکده هنرهای زیبا",
    mode: "INPERSON",
    jy: SEED_JY,
    jm: 8,
    jd: 29,
    hh: 14,
    mm: 0,
    capacity: 5,
    price: 450000,
    organizer: "استودیو رنگینک",
    gradient: "from-pink-500 via-rose-500 to-fuchsia-600",
  },
  {
    id: "be-6",
    slug: "fintech-meetup-mashhad",
    title: "میت‌آپ ماهانه فین‌تک مشهد؛ تجربه‌ها و چالش‌های پرداخت",
    summary:
      "سه سخنرانی کوتاه از تیم‌های پرداخت، پنل پرسش‌وپاسخ و شبکه‌سازی آزاد با فعالان اکوسیستم مشهد.",
    category: "فناوری و AI",
    city: "مشهد",
    venue: "مرکز نوآوری مشهد",
    mode: "INPERSON",
    jy: SEED_JY,
    jm: 8,
    jd: 26,
    hh: 17,
    mm: 0,
    capacity: 18,
    price: null,
    organizer: "فین‌تک خراسان",
    gradient: "from-indigo-500 via-blue-500 to-sky-600",
  },
  {
    id: "be-7",
    slug: "health-startup-demo-day",
    title: "رویداد جذب سرمایه و دمو دی رو استارتاپ‌های حوزه سلامت",
    summary:
      "ده تیم روی صحنه، داوری سرمایه‌گذاران خطرپذیر و فرصت معرفی مستقیم به صندوق‌های مرحله اول.",
    category: "کسب‌وکار",
    city: "تهران",
    venue: "شتاب‌دهنده آواتک",
    mode: "INPERSON",
    jy: SEED_JY,
    jm: 8,
    jd: 25,
    hh: 18,
    mm: 30,
    capacity: 15,
    price: 250000,
    organizer: "آواتک",
    gradient: "from-amber-500 via-orange-500 to-red-500",
  },
  {
    id: "be-8",
    slug: "startup-workshop-isfahan",
    title: "کارگاه راه‌اندازی کسب‌وکار نوپا در اصفهان",
    summary:
      "از اعتبارسنجی ایده تا اولین مشتری؛ تمرین عملی مدل کسب‌وکار و بازخورد گروهی روی پروژه هر شرکت‌کننده.",
    category: "کسب‌وکار",
    city: "اصفهان",
    venue: "مرکز رشد دانشگاه اصفهان",
    mode: "INPERSON",
    jy: SEED_JY,
    jm: 8,
    jd: 22,
    hh: 9,
    mm: 30,
    capacity: 100,
    price: null,
    organizer: "روشنا",
    gradient: "from-orange-500 via-rose-500 to-pink-600",
  },
  {
    id: "be-9",
    slug: "handicrafts-exhibition-isfahan",
    title: "نمایشگاه و کارگاه صنایع دستی هنرمندان اصفهان",
    summary:
      "غرفه‌های میناکاری و خاتم‌کاری، کارگاه کوتاه برای بازدیدکنندگان و گفت‌وگو با استادکارهای محله تاریخی.",
    category: "هنر و دیزاین",
    city: "اصفهان",
    venue: "مجموعه عمارت عالی‌قاپو",
    mode: "INPERSON",
    jy: SEED_JY,
    jm: 9,
    jd: 1,
    hh: 11,
    mm: 0,
    capacity: 44,
    price: 120000,
    organizer: "خانه صنایع دستی",
    gradient: "from-rose-500 via-red-500 to-orange-500",
  },
  {
    id: "be-10",
    slug: "freelancers-networking-shiraz",
    title: "دورهمی شبکه‌سازی فریلنسرهای شیراز",
    summary:
      "نشست صمیمی فریلنسرهای طراح، مترجم و توسعه‌دهنده برای تبادل تجربه قیمت‌گذاری و پیدا کردن پروژه مشترک.",
    category: "دورهمی‌های دوستانه",
    city: "شیراز",
    venue: "کافه گیتار",
    mode: "INPERSON",
    jy: SEED_JY,
    jm: 8,
    jd: 24,
    hh: 18,
    mm: 0,
    capacity: 12,
    price: null,
    organizer: "فریلنسرهای شیراز",
    gradient: "from-teal-500 via-emerald-500 to-green-600",
  },
  {
    id: "be-11",
    slug: "product-management-webinar",
    title: "وبینار مدیریت محصول برای تیم‌های کوچک",
    summary:
      "چطور بدون تیم تحقیق بزرگ تصمیم بگیریم؛ چارچوب ساده اولویت‌بندی و نمونه‌ای از تقویم انتشار یک اسپرینت.",
    category: "وبینارهای آنلاین",
    city: "آنلاین",
    venue: "پلتفرم وبینارشو",
    mode: "ONLINE",
    jy: SEED_JY,
    jm: 8,
    jd: 20,
    hh: 19,
    mm: 0,
    capacity: 100,
    price: 90000,
    organizer: "محصول‌یار",
    gradient: "from-cyan-500 via-sky-500 to-blue-600",
  },
  {
    id: "be-12",
    slug: "web3-hackathon-tabriz",
    title: "هکاتون وب۳ و توسعه قراردادهای هوشمند تبریز",
    summary:
      "کارگاه آشنایی با Solidity و ساخت یک dApp ساده در قالب تیم‌های سه نفره، با جوایز نقدی برای سه تیم برتر.",
    category: "فناوری و AI",
    city: "تبریز",
    venue: "پارک علم و فناوری آذربایجان",
    mode: "INPERSON",
    jy: SEED_JY,
    jm: 9,
    jd: 3,
    hh: 10,
    mm: 0,
    capacity: 24,
    price: null,
    organizer: "آذربایجان بلاکچین",
    gradient: "from-purple-600 via-violet-500 to-indigo-600",
  },
];
