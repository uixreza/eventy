"use client";

import { useState } from "react";
import { Loader2, Send, Trash2 } from "lucide-react";
import { sileo } from "sileo";
import { deleteBroadcast, sendBroadcast } from "@/app/actions/broadcast";
import { confirm } from "@/components/ui/confirm";
import type { BroadcastNotice } from "@/lib/broadcast-types";
import { toFa } from "@/lib/utils";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-600";

const MAX_TITLE = 120;
const MAX_BODY = 500;

/**
 * `/console`'s «اعلان سراسری» — the send side of the global notifications.
 *
 * The write is a server action that re-checks the admin session; the list
 * beside it is re-read through `onChanged`, which runs the overview's own
 * fetch again, so a broadcast appears the instant it is sent. Delivery is
 * handled elsewhere: `components/layout/BroadcastToaster.tsx` shows each one
 * once per browser.
 *
 * Deliberately not wrapped in `startTransition` — the toasts (and the delete
 * confirm) are sileo store writes, and a write scheduled while an async
 * transition is open never reaches the Toaster. Same note as
 * `components/console/ConsoleCategories.tsx`.
 */
export default function ConsoleBroadcasts({
  broadcasts,
  onChanged,
}: {
  broadcasts: BroadcastNotice[];
  onChanged: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  /** The id being deleted, or `"new"` while the form is sending. */
  const [busy, setBusy] = useState<string | null>(null);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    if (!title.trim()) {
      sileo.error({ title: "متن اعلان را وارد کنید", description: "این فیلد الزامی است." });
      return;
    }
    if (title.trim().length > MAX_TITLE) {
      sileo.error({ title: "عنوان اعلان بلند است", description: `حداکثر ${toFa(MAX_TITLE)} حرف.` });
      return;
    }
    if (body.trim().length > MAX_BODY) {
      sileo.error({ title: "متن اعلان بلند است", description: `حداکثر ${toFa(MAX_BODY)} حرف.` });
      return;
    }

    setBusy("new");
    try {
      const result = await sendBroadcast({ title, body });
      if (!result.ok) {
        sileo.error({ title: result.error, description: "دوباره تلاش کنید." });
        return;
      }
      setTitle("");
      setBody("");
      sileo.success({
        title: "اعلان ارسال شد",
        description: "از بارگذاری بعدی سایت، برای همه بازدیدکنندگان نمایش داده می‌شود.",
      });
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  async function remove(notice: BroadcastNotice) {
    if (busy) return;
    const ok = await confirm({
      title: "حذف اعلان؟",
      question: `«${notice.title}» از این پس برای بازدیدکنندگان جدید نمایش داده نمی‌شود. حذف کنم؟`,
      yes: "بله، حذف کن",
      no: "انصراف",
    });
    if (!ok) return;

    setBusy(notice.id);
    try {
      const result = await deleteBroadcast(notice.id);
      if (!result.ok) {
        sileo.error({ title: result.error, description: "دوباره تلاش کنید." });
        return;
      }
      sileo.success({
        title: "اعلان حذف شد",
        description: "مرورگرهایی که آن را دیده‌اند دیگر تکرارش نمی‌کنند.",
      });
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">اعلان سراسری</h2>
          <p className="mt-1 text-[11px] leading-6 text-slate-400 dark:text-slate-500">
            برای همه کاربران و بازدیدکنندگان سایت ارسال می‌شود؛ هر مرورگر فقط یک بار آن را
            می‌بیند.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {toFa(broadcasts.length)} اعلان ارسال‌شده
        </span>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        {/* ── Send form ─────────────────────────────────────── */}
        <form onSubmit={handleSend}>
          <label
            htmlFor="console-broadcast-title"
            className="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400"
          >
            عنوان اعلان
          </label>
          <input
            id="console-broadcast-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="مثلاً: تعمیرات شبانه از ساعت ۲ تا ۴"
            className={fieldClass}
          />
          <p className="mt-1 text-left text-[10px] font-bold tabular-nums text-slate-400 dark:text-slate-500">
            {toFa(title.length)} / {toFa(MAX_TITLE)}
          </p>

          <label
            htmlFor="console-broadcast-body"
            className="mt-3 block text-[11px] font-bold text-slate-500 dark:text-slate-400"
          >
            متن (اختیاری)
          </label>
          <textarea
            id="console-broadcast-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            placeholder="توضیح کوتاه زیر عنوان…"
            className={`${fieldClass} resize-none`}
          />
          <p className="mt-1 text-left text-[10px] font-bold tabular-nums text-slate-400 dark:text-slate-500">
            {toFa(body.length)} / {toFa(MAX_BODY)}
          </p>

          <button
            type="submit"
            disabled={busy !== null}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy === "new" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            ارسال برای همه کاربران
          </button>
        </form>

        {/* ── Sent list ─────────────────────────────────────── */}
        <div className="min-w-0">
          <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            اعلان‌های اخیر
          </h3>
          <ul className="mt-2 space-y-1.5">
            {broadcasts.map((notice) => (
              <li
                key={notice.id}
                className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {notice.title}
                  </p>
                  {notice.body && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-5 text-slate-400 dark:text-slate-500">
                      {notice.body}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    {notice.sentAt}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(notice)}
                  disabled={busy !== null}
                  aria-label={`حذف اعلان ${notice.title}`}
                  title="حذف"
                  className="shrink-0 rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
            {broadcasts.length === 0 && (
              <li className="rounded-xl border border-dashed border-slate-200 px-3 py-8 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
                هنوز اعلانی ارسال نشده است.
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
