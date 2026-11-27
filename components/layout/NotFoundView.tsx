"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, Compass, Home, Ticket } from "lucide-react";
import { BrandMark } from "@/components/layout/BrandMark";

// Console is the admin panel — deliberately not suggested on a public 404.
const quickLinks = [
  { label: "کشف رویدادها", href: "/", icon: Compass },
  { label: "رویدادهای من", href: "/dashboard", icon: Ticket },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function NotFoundView() {
  const router = useRouter();
  const reduce = useReducedMotion();

  /** Direct-loaded 404s have no history to go back to — fall home instead. */
  function goBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-canvas px-5 py-16 text-center dark:bg-slate-900">
      {/* Single soft blue glow — the page's only color, everything else is ink */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[440px]"
        style={{
          backgroundImage:
            "radial-gradient(60% 100% at 50% 0%, rgba(37,99,235,0.15), transparent 70%)",
        }}
      />
      {/* Faint dot texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      <motion.div
        variants={container}
        initial={reduce ? "show" : "hidden"}
        animate="show"
        className="relative z-10 flex w-full max-w-xl flex-col items-center"
      >
        {/* Brand */}
        <motion.div variants={item}>
          <Link
            href="/"
            aria-label="Kooja — صفحه اصلی"
            className="inline-block transition-opacity hover:opacity-80"
          >
            <BrandMark className="text-lg sm:text-xl" />
          </Link>
        </motion.div>

        {/* Hero numeral — solid 4s around an outlined 0 */}
        <motion.div variants={item} className="mt-10 flex flex-col items-center">
          <span
            aria-hidden="true"
            className="select-none text-[6.5rem] font-black leading-none tracking-tighter text-slate-900 sm:text-[9rem] dark:text-slate-50"
          >
            ۴
            <span className="text-transparent [-webkit-text-stroke:3px_#cbd5e1] dark:[-webkit-text-stroke:3px_#334155]">
              ۰
            </span>
            ۴
          </span>
          <span aria-hidden="true" className="mt-6 block h-1.5 w-16 rounded-full bg-blue-600" />
        </motion.div>

        {/* Copy */}
        <motion.h1
          variants={item}
          className="mt-7 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100"
        >
          این صفحه برگزار نشد!
        </motion.h1>
        <motion.p
          variants={item}
          className="mt-3 max-w-md text-sm leading-8 text-slate-500 sm:text-base dark:text-slate-400"
        >
          به نظر می‌رسد آدرسی که وارد کرده‌اید اشتباه است یا این رویداد لغو شده. نگران نباشید —
          رویدادهای خوب هنوز پابرجا هستند.
        </motion.p>

        {/* Actions */}
        <motion.div variants={item} className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
          >
            <Home className="h-4 w-4" />
            بازگشت به صفحه اصلی
          </Link>
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
          >
            <ArrowRight className="h-4 w-4" />
            صفحه قبل
          </button>
        </motion.div>

        {/* Quick links behind a hairline divider */}
        <motion.div variants={item} className="mt-10 w-full max-w-sm">
          <div className="flex items-center gap-4">
            <span aria-hidden="true" className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
              یا بروید به
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:bg-blue-950 dark:hover:text-blue-300"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                  <ArrowRight className="h-3 w-3 opacity-0 transition-all duration-200 group-hover:-translate-x-0.5 group-hover:opacity-100" />
                </Link>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
