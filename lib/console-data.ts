/**
 * Display-mode mock data still backing the `/console/transactions` route —
 * same "حالت نمایشی" contract as the console's other placeholder figures:
 * nothing here touches Prisma. The reports page no longer takes part in
 * this: `/console/reports` reads live numbers from `lib/reports.ts`, and the
 * clients tab reads real accounts from `lib/users.ts`.
 */

export type ConsoleTransactionStatus = "paid" | "refunded" | "pending";

export type ConsoleTransaction = {
  id: string;
  code: string;
  buyer: string;
  event: string;
  amount: number;
  status: ConsoleTransactionStatus;
  date: string;
};

export const transactionStatusMeta: Record<
  ConsoleTransactionStatus,
  { label: string; tint: string }
> = {
  paid: { label: "پرداخت‌شده", tint: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  refunded: { label: "بازگشت‌شده", tint: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  pending: { label: "در انتظار تسویه", tint: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
};

export const consoleTransactions: ConsoleTransaction[] = [
  { id: "t-1", code: "TX-۸۴۲۱", buyer: "امیر حسینی", event: "مسترکلاس معماری میکروسرویس", amount: 290000, status: "paid", date: "۱۴۰۴/۰۸/۲۳" },
  { id: "t-2", code: "TX-۸۴۲۰", buyer: "مهسا کریمی", event: "کارگاه پیشرفته تجربه کاربری", amount: 450000, status: "paid", date: "۱۴۰۴/۰۸/۲۳" },
  { id: "t-3", code: "TX-۸۴۱۹", buyer: "کامران رضایی", event: "رویداد جذب سرمایه", amount: 320000, status: "pending", date: "۱۴۰۴/۰۸/۲۲" },
  { id: "t-4", code: "TX-۸۴۱۸", buyer: "الهه صادقی", event: "میت‌آپ ماهانه فین‌تک مشهد", amount: 0, status: "paid", date: "۱۴۰۴/۰۸/۲۲" },
  { id: "t-5", code: "TX-۸۴۱۷", buyer: "بهرام نادری", event: "کارگاه عملی راه‌اندازی کسب‌وکار", amount: 180000, status: "refunded", date: "۱۴۰۴/۰۸/۲۱" },
  { id: "t-6", code: "TX-۸۴۱۶", buyer: "سارا محمدی", event: "وبینار رایگان ورود به دنیای AI", amount: 0, status: "paid", date: "۱۴۰۴/۰۸/۲۱" },
  { id: "t-7", code: "TX-۸۴۱۵", buyer: "رضا توکری", event: "دورهمی شبکه‌سازی فریلنسرها", amount: 120000, status: "pending", date: "۱۴۰۴/۰۸/۲۰" },
  { id: "t-8", code: "TX-۸۴۱۴", buyer: "نگار احمدی", event: "هکاتون هوش مصنوعی تهران", amount: 250000, status: "paid", date: "۱۴۰۴/۰۸/۲۰" },
];
