"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Flag, Send, X } from "lucide-react";
import { sileo } from "sileo";
import { AuthModal } from "@/components/auth/AddEventButton";
import { submitEventReport } from "@/app/actions/reports";
import {
  EVENT_REPORT_REASONS,
  MAX_REPORT_MESSAGE,
  type EventReportReason,
} from "@/lib/event-report-types";
import { toFa } from "@/lib/utils";

type ReportEventButtonProps = {
  eventId: string;
  eventTitle: string;
  /** The button stays visible for the organizer, but is disabled. */
  isOwner: boolean;
};

/**
 * The report entry point on every event. Signed-out visitors get the same
 * auth modal the bookmark and booking buttons use; once signed in, the dialog
 * collects one of the fixed reasons plus an optional note for the managers.
 */
export default function ReportEventButton({
  eventId,
  eventTitle,
  isOwner,
}: ReportEventButtonProps) {
  const { status } = useSession();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  function handleClick() {
    if (isOwner) return;
    if (status !== "authenticated") {
      setAuthOpen(true);
      return;
    }
    setDialogOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isOwner}
        title={isOwner ? "برگزارکننده نمی‌تواند رویداد خود را گزارش کند" : undefined}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold transition-all duration-200 ${
          isOwner
            ? "cursor-not-allowed border-slate-200 text-slate-400 dark:border-slate-700 dark:text-slate-500"
            : "border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-rose-900 dark:hover:text-rose-400"
        }`}
      >
        <Flag className="h-4 w-4" />
        گزارش رویداد
      </button>

      <AnimatePresence>
        {authOpen && (
          <AuthModal
            onClose={() => setAuthOpen(false)}
            onSuccess={() => {
              setAuthOpen(false);
              setDialogOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dialogOpen && (
          <ReportDialog
            eventId={eventId}
            eventTitle={eventTitle}
            onClose={() => setDialogOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/** Portaled to <body> so sticky/blur parents cannot clip the fixed overlay. */
function ReportDialog({
  eventId,
  eventTitle,
  onClose,
}: {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<EventReportReason | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  /* Escape is the expected exit for a modal dialog on desktop. */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, pending]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!reason || pending) return;

    startTransition(async () => {
      const result = await submitEventReport({ eventId, reason, message });
      if (!result.ok) {
        sileo.error({ title: "گزارش ارسال نشد", description: result.error });
        return;
      }
      sileo.success({
        title: "گزارش شما ارسال شد",
        description: "مدیران Kooja آن را بررسی می\u200cکنند. با تشکر!",
      });
      onClose();
    });
  }

  return createPortal(
    <motion.div
      data-report-modal=""
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={() => !pending && onClose()}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
        className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-700/70 sm:rounded-3xl sm:p-6"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 16, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="report-dialog-title"
              className="text-base font-extrabold text-slate-900 dark:text-slate-100 sm:text-lg"
            >
              گزارش رویداد
            </h2>
            <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
              مشکل خود را با «{eventTitle}» در میان بگذارید؛ پیام شما به صورت محرمانه به مدیران
              ارسال می‌شود.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5">
          <fieldset>
            <legend className="text-xs font-bold text-slate-700 dark:text-slate-200">
              دلیل گزارش
            </legend>
            <div className="mt-2 space-y-2">
              {EVENT_REPORT_REASONS.map((item) => (
                <label
                  key={item.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all duration-200 ${
                    reason === item.value
                      ? "border-rose-300 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/30"
                      : "border-slate-200 hover:border-rose-200 dark:border-slate-700 dark:hover:border-rose-900"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={item.value}
                    checked={reason === item.value}
                    onChange={() => setReason(item.value)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      reason === item.value
                        ? "border-rose-500 bg-rose-500 ring-2 ring-rose-100 dark:ring-rose-950"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {reason === item.value && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-5 text-slate-400 dark:text-slate-500">
                      {item.hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label
            htmlFor="report-message"
            className="mt-5 block text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            توضیح بیشتر <span className="font-normal text-slate-400">(اختیاری)</span>
          </label>
          <textarea
            id="report-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={MAX_REPORT_MESSAGE}
            rows={3}
            placeholder={"هر جزئیاتی که به بررسی کمک می\u200cکند…"}
            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-rose-300 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-rose-800 dark:focus:bg-slate-800"
          />
          <p className="mt-1 text-left text-[11px] text-slate-400 dark:text-slate-500" dir="ltr">
            {toFa(message.length)} / {toFa(MAX_REPORT_MESSAGE)}
          </p>

          <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={!reason || pending}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-rose-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {pending ? "در حال ارسال…" : "ارسال گزارش"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
