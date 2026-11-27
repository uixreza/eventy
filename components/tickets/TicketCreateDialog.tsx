"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Send, X } from "lucide-react";
import { sileo } from "sileo";
import { createSupportTicket } from "@/app/actions/tickets";
import {
  MAX_TICKET_MESSAGE,
  MAX_TICKET_SUBJECT,
  MIN_TICKET_MESSAGE,
  MIN_TICKET_SUBJECT,
} from "@/lib/ticket-types";
import { toFa } from "@/lib/utils";

type Props = {
  onClose: () => void;
  /** Reloads the list from the database after the row was created. */
  onCreated: () => void;
};

/**
 * The client's «ساخت تیکت» form. The Server Action owns every validation
 * rule; the local `canSubmit` only keeps an obviously empty form from being
 * sent. On success the parent reloads, so the new row comes from Prisma.
 */
export default function TicketCreateDialog({ onClose, onCreated }: Props) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, pending]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    startTransition(async () => {
      const result = await createSupportTicket({ subject, message });
      if (!result.ok) {
        sileo.error({ title: "تیکت ارسال نشد", description: result.error });
        return;
      }
      sileo.success({
        title: "تیکت شما ثبت شد",
        description: "پیامتان در صندوق پشتیبانی مدیران قرار گرفت.",
      });
      onCreated();
      onClose();
    });
  }

  const subjectLength = subject.trim().length;
  const messageLength = message.trim().length;
  const canSubmit =
    !pending &&
    subjectLength >= MIN_TICKET_SUBJECT &&
    subjectLength <= MAX_TICKET_SUBJECT &&
    messageLength >= MIN_TICKET_MESSAGE &&
    messageLength <= MAX_TICKET_MESSAGE;

  /* Portaled to <body> so the dashboard's sticky, blurred header cannot
     become the containing block for this fixed overlay. */
  return createPortal(
    <motion.div
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
        aria-labelledby="ticket-create-title"
        className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-700/70 sm:rounded-3xl sm:p-6"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 16, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white/95 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <div>
            <h2
              id="ticket-create-title"
              className="text-base font-extrabold text-slate-900 dark:text-slate-100 sm:text-lg"
            >
              ساخت تیکت پشتیبانی
            </h2>
            <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
              موضوع و پیام شما مستقیماً به صندوق تیکت مدیران ارسال می‌شود.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            disabled={pending}
            className="shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5 sm:p-0 sm:pt-5">
          <div>
            <label
              htmlFor="ticket-subject"
              className="block text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              عنوان تیکت <span className="text-red-500">*</span>
            </label>
            <input
              id="ticket-subject"
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={MAX_TICKET_SUBJECT}
              placeholder="مثال: مشکل در ثبت‌نام رویداد"
              disabled={pending}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-600 dark:focus:bg-slate-800"
            />
            <p className="mt-1 text-left text-[11px] text-slate-400 dark:text-slate-500" dir="ltr">
              {toFa(subjectLength)} / {toFa(MAX_TICKET_SUBJECT)}
            </p>
          </div>

          <div>
            <label
              htmlFor="ticket-message"
              className="block text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              متن پیام <span className="text-red-500">*</span>
            </label>
            <textarea
              id="ticket-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={MAX_TICKET_MESSAGE}
              rows={5}
              placeholder="جزئیات درخواست یا مشکل خود را بنویسید…"
              disabled={pending}
              className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm leading-7 text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-600 dark:focus:bg-slate-800"
            />
            <p className="mt-1 text-left text-[11px] text-slate-400 dark:text-slate-500" dir="ltr">
              {toFa(messageLength)} / {toFa(MAX_TICKET_MESSAGE)}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-40 dark:text-slate-400 dark:hover:text-slate-200"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {pending ? "در حال ارسال…" : "ارسال تیکت"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
