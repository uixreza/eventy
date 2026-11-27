"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { BrandMark } from "@/components/layout/BrandMark";
import { AuthModal } from "./AddEventButton";

const PROTECTED_PREFIXES = ["/dashboard", "/console"] as const;

/**
 * `proxy.ts` sends signed-out visitors here with the protected URL in `next`.
 * Only internal dashboard/console destinations are accepted, so the parameter
 * can never become an open redirect.
 */
function safeDestination(raw: string | undefined): string {
  if (!raw) return "/dashboard";

  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    return "/dashboard";
  }

  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/dashboard";
  }

  const pathname = value.split("?")[0];
  const allowed = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return allowed ? value : "/dashboard";
}

export default function AuthHandoff({ next }: { next?: string }) {
  const [open, setOpen] = useState(true);
  const destination = safeDestination(next);

  return (
    <div className="flex min-h-[65vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex justify-center">
          <BrandMark className="text-2xl" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-slate-900 dark:text-slate-50">
          ورود به Kooja
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          برای ادامه و دسترسی به حسابت، وارد شو یا ثبت نام کن.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
        >
          ورود / ثبت نام
        </button>
        <Link
          href="/"
          className="mt-4 block text-xs font-semibold text-slate-400 transition-colors duration-200 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>

      <AnimatePresence>
        {open && (
          <AuthModal
            onClose={() => setOpen(false)}
            /* A hard navigation guarantees the just-set session cookie is
               present when `proxy.ts` checks the protected destination. */
            onSuccess={() => window.location.assign(destination)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
