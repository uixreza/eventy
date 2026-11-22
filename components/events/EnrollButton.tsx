"use client";

import { useState, useTransition } from "react";
import { AnimatePresence } from "framer-motion";
import { CheckCircle2, Ticket, XCircle } from "lucide-react";
import { sileo } from "sileo";
import { AuthModal } from "@/components/auth/AddEventButton";
import { cancelRegistration, enrollInEvent } from "@/app/actions/events";
import type { RegistrationState } from "@/lib/event-types";
import { toFa } from "@/lib/utils";

type EnrollButtonProps = {
  eventId: string;
  /** `null` when the event is over or has no fixed capacity. */
  seatsLeft: number | null;
  /** The event's place in time — an unlimited event is still open. */
  ended: boolean;
  price: number | null;
  /** The signed-in person's ticket, when they have one. */
  registration: { id: string; status: RegistrationState; ticketCode: string } | null;
  signedIn: boolean;
  /** The signed-in visitor created this event, so they cannot join it. */
  isOwner: boolean;
  /**
   * Runs the page's own fetch again after a change — the event page gets
   * its rows from `GET /api/events/[slug]`, so a server refresh alone
   * would leave the seat count and the ticket as they were.
   */
  onChanged: () => void;
};

/**
 * The booking button of an event page.
 *
 * It reads the ticket the visitor already holds — signed in or not — and
 * either offers a seat, shows the ticket, or explains why sign-ups are
 * closed. Every change goes through a server action, so the seat count on the
 * server stays the truth.
 */
export default function EnrollButton({
  eventId,
  seatsLeft,
  ended,
  price,
  registration,
  signedIn,
  isOwner,
  onChanged,
}: EnrollButtonProps) {
  const [pending, startTransition] = useTransition();
  /** Signed-out visitors get the same sign-in sheet the save button uses. */
  const [authOpen, setAuthOpen] = useState(false);

  const confirmed = registration?.status === "CONFIRMED";
  const waiting = registration?.status === "WAITLIST";
  const full = seatsLeft === 0;

  /* Owners are blocked by the server action too — this just makes the rule
     visible before anyone can press the button. */
  if (isOwner) {
    return (
      <div className="mt-4 space-y-2.5">
        <button
          type="button"
          disabled
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
        >
          {full
            ? "ثبت نام در لیست انتظار"
            : price === null
              ? "رزرو سریع صندلی"
              : "ثبت نام در رویداد"}
        </button>
        <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
          برگزارکنندگان نمی‌توانند در رویداد خود ثبت نام کنند.
        </p>
      </div>
    );
  }

  function enroll() {
    startTransition(async () => {
      const result = await enrollInEvent(eventId);
      if (!result.ok) {
        sileo.error({ title: result.error, description: "دوباره تلاش کنید." });
        return;
      }
      sileo.success({ title: "ثبت‌نام انجام شد", description: result.message });
      onChanged();
    });
  }

  function cancel() {
    startTransition(async () => {
      const result = await cancelRegistration(registration!.id);
      if (!result.ok) {
        sileo.error({ title: result.error, description: "دوباره تلاش کنید." });
        return;
      }
      sileo.success({ title: "ثبت‌نام لغو شد", description: result.message });
      onChanged();
    });
  }

  /* The event is over — nothing to book. */
  if (ended) {
    return (
      <button
        type="button"
        disabled
        className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
      >
        رویداد برگزار شده
      </button>
    );
  }

  /* The visitor already holds a seat. */
  if (confirmed) {
    return (
      <div className="mt-4 space-y-2.5">
        <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 text-sm font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          ثبت‌نام شما قطعی است
        </div>
        <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
          <Ticket className="h-3.5 w-3.5 text-slate-400" />
          کد بلیت:{" "}
          <span dir="ltr" className="font-mono text-slate-700 dark:text-slate-300">
            {toFa(registration!.ticketCode)}
          </span>
        </p>
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-900 dark:hover:text-red-400"
        >
          <XCircle className="h-3.5 w-3.5" />
          لغو ثبت‌نام
        </button>
      </div>
    );
  }

  /* The visitor is on the waiting list. */
  if (waiting) {
    return (
      <div className="mt-4 space-y-2.5">
        <div className="rounded-xl bg-amber-50 py-3 text-center text-sm font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          در لیست انتظار هستید
        </div>
        <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
          به‌محض باز شدن ظرفیت، صندلی شما ثبت می‌شود.
        </p>
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-900 dark:hover:text-red-400"
        >
          <XCircle className="h-3.5 w-3.5" />
          انصراف از لیست انتظار
        </button>
      </div>
    );
  }

  /* Anonymous visitors get the same sign-in sheet as the save button. Once
     the session cookie exists, the booking they asked for runs right away. */
  if (!signedIn) {
    return (
      <>
        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          aria-haspopup="dialog"
          className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
        >
          {full
            ? "ثبت نام در لیست انتظار"
            : price === null
              ? "رزرو سریع صندلی"
              : "ثبت نام در رویداد"}
        </button>
        <AnimatePresence>
          {authOpen && (
            <AuthModal
              onClose={() => setAuthOpen(false)}
              onSuccess={() => {
                setAuthOpen(false);
                enroll();
              }}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="mt-4 space-y-2.5">
      <button
        type="button"
        onClick={enroll}
        disabled={pending}
        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
      >
        {pending
          ? "در حال ثبت‌نام…"
          : full
            ? "ثبت‌نام در لیست انتظار"
            : price === null
              ? "رزرو سریع صندلی"
              : "ثبت‌نام در رویداد"}
      </button>
      {full && (
        <p className="text-center text-[11px] text-amber-600 dark:text-amber-400">
          ظرفیت تکمیل است — ثبت‌نام شما در لیست انتظار قرار می‌گیرد.
        </p>
      )}
    </div>
  );
}
