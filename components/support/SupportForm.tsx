"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { Loader2, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { sileo } from "sileo";
import { normalizeDigits, toFa } from "@/lib/utils";

/**
 * The contact form on `/support`.
 *
 * Mock on purpose: there is no message table yet, so a valid submit just
 * shows a success toast and resets. The captcha is a local arithmetic
 * question — enough to keep bots out of the (not yet wired) endpoint.
 */
export default function SupportForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [pending, setPending] = useState(false);

  /**
   * The question is seeded from React's `useId()` — the same value on the
   * server and during hydration — plus a salt the refresh button bumps.
   * (`Math.random()` in a `useState` initializer made the prerendered page
   * fail hydration: the server had drawn different numbers than the client.)
   */
  const instanceId = useId();
  const [salt, setSalt] = useState(0);
  const captcha = useMemo(
    () => captchaFromSeed(`${instanceId}:${salt}`),
    [instanceId, salt],
  );

  function refreshCaptcha() {
    setSalt((value) => value + 1);
    setAnswer("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      sileo.error({ title: "نام را وارد کنید", description: "نام شما برای پاسخ لازم است." });
      return;
    }
    if (message.trim().length < 10) {
      sileo.error({
        title: "متن پیام کوتاه است",
        description: "لطفاً پیام را با جزئیات بنویسید (حداقل ۱۰ حرف).",
      });
      return;
    }
    if (normalizeDigits(answer).trim() !== String(captcha.expected)) {
      sileo.error({ title: "پاسخ کپچا درست نیست", description: "دوباره تلاش کنید." });
      refreshCaptcha();
      return;
    }

    setPending(true);
    /* Mock send — no backend yet. */
    window.setTimeout(() => {
      setPending(false);
      sileo.success({
        title: "پیامتان دریافت شد",
        description: "در اسرع وقت از طریق ایمیل یا تلفن پاسخ می‌دهیم.",
      });
      setName("");
      setMessage("");
      refreshCaptcha();
    }, 700);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
      {/* Name */}
      <div>
        <label
          htmlFor="support-name"
          className="block text-sm font-bold text-slate-700 dark:text-slate-300"
        >
          نام <span className="text-red-500">*</span>
        </label>
        <input
          id="support-name"
          type="text"
          autoComplete="name"
          placeholder="مثال: سارا رضایی"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-300 focus:border-blue-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-600"
        />
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="support-message"
          className="block text-sm font-bold text-slate-700 dark:text-slate-300"
        >
          متن پیام <span className="text-red-500">*</span>
        </label>
        <textarea
          id="support-message"
          rows={5}
          placeholder="سؤال یا مشکل خود را بنویسید؛ اگر پیگیری ثبت‌نام یا پرداخت است، شماره موبایل و کد پیگیری را هم اضافه کنید."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-300 focus:border-blue-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-600"
        />
      </div>

      {/* Captcha + submit — one compact row: the check sits beside the
          send button instead of taking a full card of its own. */}
      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
          <ShieldCheck
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500"
          />
          <span className="whitespace-nowrap text-xs font-bold text-slate-600 dark:text-slate-300">
            {toFa(captcha.a)} + {toFa(captcha.b)} = ؟
          </span>
          <input
            type="text"
            inputMode="numeric"
            dir="ltr"
            aria-label="پاسخ کپچا"
            placeholder="پاسخ"
            value={answer}
            onChange={(event) => setAnswer(normalizeDigits(event.target.value).slice(0, 3))}
            className="h-8 w-16 rounded-lg border border-slate-200 bg-white px-2 text-center text-xs tracking-widest text-slate-900 outline-none transition-all duration-200 placeholder:tracking-normal focus:border-blue-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
          <button
            type="button"
            onClick={refreshCaptcha}
            aria-label="کپچای جدید"
            className="rounded-md p-1 text-slate-400 transition-colors duration-200 hover:bg-white hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Send stays disabled until the captcha has an answer */}
        <button
          type="submit"
          disabled={pending || answer.trim() === ""}
          title={
            answer.trim() === "" ? "برای ارسال، ابتدا کپچا را پاسخ دهید" : undefined
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              در حال ارسال…
            </>
          ) : (
            <>
              ارسال پیام
              <Send className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/** The arithmetic question. `expected` never reaches the DOM. */
type Captcha = { a: number; b: number; expected: number };

/**
 * FNV-1a over the seed → two addends in 1..9. Deterministic, so the server
 * render and the hydration render always draw the same question.
 */
function captchaFromSeed(seed: string): Captcha {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const positive = hash >>> 0;
  const a = 1 + (positive % 9);
  const b = 1 + ((positive >>> 16) % 9);
  return { a, b, expected: a + b };
}
