"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { LockKeyhole, LockKeyholeOpen, MessagesSquare, Send, X } from "lucide-react";
import { sileo } from "sileo";
import {
  addSupportTicketMessage,
  closeSupportTicket,
  reopenSupportTicket,
} from "@/app/actions/tickets";
import {
  MAX_TICKET_MESSAGE,
  MIN_TICKET_MESSAGE,
  TICKET_STATUS_BADGES,
  TICKET_THREAD_PANEL_HEIGHT,
  type TicketAuthorRole,
  type TicketView,
} from "@/lib/ticket-types";
import { toFa } from "@/lib/utils";

type Props = {
  ticket: TicketView;
  /** Admins may answer any ticket and are the only ones who may close/reopen. */
  isAdmin: boolean;
  onClose: () => void;
  /** Reloads the DB-backed list (and this ticket) after every mutation. */
  onChanged: () => void;
  /** Large screens show the thread in the page; smaller ones keep the sheet. */
  inline?: boolean;
};

/** "شما" is relative to whoever is reading the thread. */
function authorLabel(role: TicketAuthorRole, isAdmin: boolean): string {
  if (isAdmin) return role === "ADMIN" ? "شما" : "کاربر";
  return role === "USER" ? "شما" : "پشتیبانی";
}

/**
 * One whole support conversation: every message from both sides, a reply box
 * and — for admins — the close/reopen controls. The row itself is passed in
 * from the freshly loaded list, so answering or closing is reflected here on
 * the very next render.
 *
 * `inline` reuses the exact same body as a docked panel beside the list on
 * large screens; without it the panel is the familiar modal/bottom sheet.
 */
export default function TicketThreadModal({
  ticket,
  isAdmin,
  onClose,
  onChanged,
  inline = false,
}: Props) {
  const [reply, setReply] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const titleId = `ticket-thread-title-${uid}`;
  const replyId = `ticket-reply-${uid}`;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [ticket.messages.length]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, pending]);

  function sendReply(event: React.FormEvent) {
    event.preventDefault();
    const body = reply.trim();
    if (pending || body.length < MIN_TICKET_MESSAGE || body.length > MAX_TICKET_MESSAGE) return;

    startTransition(async () => {
      const result = await addSupportTicketMessage(ticket.id, body);
      if (!result.ok) {
        sileo.error({ title: "پیام ارسال نشد", description: result.error });
        return;
      }
      setReply("");
      sileo.success({
        title: isAdmin ? "پاسخ شما ارسال شد" : "پیام شما ارسال شد",
        description: isAdmin ? "پیامتان در تیکت ثبت شد." : "پشتیبانی تیکت شما را بررسی می\u200cکند.",
      });
      onChanged();
    });
  }

  function changeStatus(closing: boolean) {
    if (pending) return;

    startTransition(async () => {
      const result = closing
        ? await closeSupportTicket(ticket.id)
        : await reopenSupportTicket(ticket.id);
      if (!result.ok) {
        sileo.error({
          title: closing ? "تیکت بسته نشد" : "تیکت بازگشایی نشد",
          description: result.error,
        });
        return;
      }
      sileo.success({
        title: closing ? "تیکت بسته شد" : "تیکت بازگشایی شد",
        description: closing
          ? "گفتگو برای طرفین فقط خواندنی شد."
          : "طرفین دوباره می\u200cتوانند در تیکت پیام بدهند.",
      });
      onChanged();
    });
  }

  const canReply =
    !pending &&
    ticket.status !== "CLOSED" &&
    reply.trim().length >= MIN_TICKET_MESSAGE &&
    reply.trim().length <= MAX_TICKET_MESSAGE;

  /* One body, two shells: a docked column on desktop and the original modal
     everywhere else. Both get their own ids so hidden copies never clash. */
  const body = (
    <>
      {/* ── Header ─────────────────────────────────────── */}
      <div className="shrink-0 border-b border-slate-100 bg-white/95 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
            <MessagesSquare className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="truncate text-base font-extrabold text-slate-900 dark:text-slate-100 sm:text-lg"
            >
              {ticket.subject}
            </h2>
            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400 dark:text-slate-500">
              <span>ایجاد: {ticket.createdAt}</span>
              <span>آخرین پیام: {ticket.updatedAt}</span>
              {ticket.closedAt && <span>بسته شدن: {ticket.closedAt}</span>}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${TICKET_STATUS_BADGES[ticket.status]}`}
          >
            {ticket.statusLabel}
          </span>
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

        {isAdmin && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/60">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {ticket.owner.name} · <span dir="ltr">{ticket.owner.phone}</span>
            </p>
            {ticket.status === "CLOSED" ? (
              <button
                type="button"
                onClick={() => changeStatus(false)}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition-all duration-200 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <LockKeyholeOpen className="h-3.5 w-3.5" />
                بازگشایی تیکت
              </button>
            ) : (
              <button
                type="button"
                onClick={() => changeStatus(true)}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[11px] font-bold text-red-600 transition-all duration-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950"
              >
                <LockKeyhole className="h-3.5 w-3.5" />
                بستن تیکت
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Messages ───────────────────────────────────── */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-5 dark:bg-slate-950/40">
        {ticket.messages.map((message) => {
          const mine = isAdmin
            ? message.authorRole === "ADMIN"
            : message.authorRole === "USER";
          return (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                mine
                  ? "ms-auto rounded-es-md bg-blue-600 text-white"
                  : "rounded-ee-md border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              <div
                className={`flex items-center justify-between gap-3 text-[10px] font-bold ${
                  mine ? "text-blue-100" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                <span>{authorLabel(message.authorRole, isAdmin)}</span>
                <time>{message.createdAt}</time>
              </div>
              <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-6">
                {message.body}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Reply ──────────────────────────────────────── */}
      <form
        onSubmit={sendReply}
        className="shrink-0 border-t border-slate-100 bg-white/95 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:p-5"
      >
        {ticket.status === "CLOSED" ? (
          <p className="rounded-xl bg-slate-100 px-3.5 py-3 text-center text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            این تیکت بسته شده است. پس از بازگشایی توسط پشتیبانی می‌توانید پیام بدهید.
          </p>
        ) : (
          <>
            <label
              htmlFor={replyId}
              className="block text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              {isAdmin ? "پاسخ به کاربر" : "پیام جدید"}
            </label>
            <div className="mt-2 flex items-end gap-2">
              <textarea
                id={replyId}
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                maxLength={MAX_TICKET_MESSAGE}
                rows={2}
                placeholder={isAdmin ? "پاسخ پشتیبانی را بنویسید…" : "پیام خود را بنویسید…"}
                disabled={pending}
                className="min-h-11 flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-600 dark:focus:bg-slate-800"
              />
              <button
                type="submit"
                disabled={!canReply}
                aria-label="ارسال پیام"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-left text-[11px] text-slate-400 dark:text-slate-500" dir="ltr">
              {toFa(reply.trim().length)} / {toFa(MAX_TICKET_MESSAGE)}
            </p>
          </>
        )}
      </form>
    </>
  );

  if (inline) {
    return (
      <motion.section
        aria-labelledby={titleId}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`sticky top-4 flex ${TICKET_THREAD_PANEL_HEIGHT} flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900`}
      >
        {body}
      </motion.section>
    );
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6 lg:hidden"
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
        aria-labelledby={titleId}
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-700/70 sm:rounded-3xl"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 16, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
      >
        {body}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
