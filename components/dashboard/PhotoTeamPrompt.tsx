"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Camera, X } from "lucide-react";

type Props = {
  /** Disables both answers while the publish action is in flight. */
  pending: boolean;
  /** Publishes the event with the chosen answer. */
  onAnswer: (needsPhotographyTeam: boolean) => void;
};

/**
 * Publish-time question for a new event. It floats above the wizard with a
 * blurred backdrop on large screens and becomes a bottom sheet on phones.
 * There is no dismiss path: the event is only written once an answer is given.
 */
export default function PhotoTeamPrompt({ pending, onAnswer }: Props) {
  const yesRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    /* Keep the wizard behind the dialog still while the choice is open. */
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    yesRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  /* Portaled to <body> so the dashboard's sticky, blurred header cannot
     become the containing block for this fixed overlay. */
  return createPortal(
    <motion.div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-team-title"
        aria-describedby="photo-team-copy"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 pb-8 text-center shadow-2xl ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-700/70 sm:rounded-3xl sm:p-8"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
      >
        {/* The familiar sheet grip — desktop gets a plain centred card. */}
        <div
          aria-hidden="true"
          className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden"
        />

        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
          <Camera className="h-7 w-7" />
        </span>
        <h2
          id="photo-team-title"
          className="mt-5 text-xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-2xl"
        >
          آیا برای رویدادتان به تیم عکاسی هم نیاز دارید؟
        </h2>
        <p
          id="photo-team-copy"
          className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400"
        >
          پاسخ شما فقط در پنل مدیریت رویدادها ثبت می‌شود و در صفحه عمومی رویداد
          نمایش داده نخواهد شد.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            ref={yesRef}
            type="button"
            onClick={() => onAnswer(true)}
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
            بله
          </button>
          <button
            type="button"
            onClick={() => onAnswer(false)}
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition-all duration-200 hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-800 dark:hover:text-blue-300"
          >
            <X className="h-4 w-4" />
            خیر
          </button>
        </div>

        {pending && (
          <p aria-live="polite" className="mt-4 text-xs font-bold text-blue-600 dark:text-blue-400">
            در حال ثبت رویداد…
          </p>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
