"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import {
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { sileo } from "sileo";
import { requestOtp, verifyOtp } from "@/app/actions/auth";
import {
  OTP_LENGTH,
  RESEND_SECONDS,
  isValidBirthDate,
  isValidName,
  isValidNationalId,
  normalizeDigits,
  normalizeName,
} from "@/lib/auth-flow";
import { toFa } from "@/lib/utils";
import { BrandMark } from "@/components/layout/BrandMark";
import ShamsiWheelDatePicker from "@/components/ui/ShamsiWheelDatePicker";

/**
 * One modal for both flows — there is no separate signup:
 *
 *   1. phone     → `requestOtp` answers `isNew` (unknown number = signup)
 *   2. otp       → `verifyOtp` stamps the code as proven
 *   3. profile   → only for new numbers: name, national id, birth date, then
 *                  the credentials sign-in creates the account and the session
 *
 * Existing numbers skip step 3 and sign in right after the code checks out.
 */

type Step = "phone" | "otp" | "profile";

const DEFAULT_CLASSES =
  "flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]";

const stepCopy: Record<Step, { title: string; description: string }> = {
  phone: {
    title: "ورود",
    description: "برای ورود یا ثبت‌نام، شماره موبایلت رو وارد کن.",
  },
  otp: {
    title: "کد تایید",
    description: "کدی که برایت فرستادیم را وارد کن تا وارد حسابت شوی.",
  },
  profile: {
    title: "ساخت حساب",
    description: "چون تا حالا ثبت‌نام نکرده‌ای، چند تا اطلاعات لازم داریم.",
  },
};

const bannerBullets = [
  "ثبت رایگان رویداد در کمتر از ۲ دقیقه",
  "آمار زنده فروش و تکمیل ظرفیت",
  "یادآوری پیامکی خودکار برای ثبت‌نام‌ها",
];

function faClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return toFa(`${m}:${String(s).padStart(2, "0")}`);
}

/** Development-only: prefill from the code the server action handed back. */
function initialDigits(devCode?: string): string[] {
  return devCode && devCode.length === OTP_LENGTH
    ? devCode.split("")
    : Array(OTP_LENGTH).fill("");
}

/**
 * The sign-in / sign-up modal (phone → OTP → profile).
 *
 * Exported for the bookmark flow: a signed-out visitor who presses a heart
 * gets this modal, and `onSuccess` runs their pending save the moment the
 * session cookie exists (instead of the usual redirect to the dashboard).
 */
export function AuthModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  /** Called right after a successful sign-in, when provided. */
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [autoFilled, setAutoFilled] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [pending, setPending] = useState(false);
  const [profile, setProfile] = useState({ name: "", nationalId: "", birthDate: "" });
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  /* On phones the dialog becomes a bottom sheet (banner hidden, slides up). */
  const isSheet =
    typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches;

  /* Close on Escape + lock page scroll while open. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  /* Resend countdown. */
  useEffect(() => {
    if (step !== "otp" || secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, secondsLeft]);

  /* Focus the first OTP box when the step appears. */
  useEffect(() => {
    if (step === "otp") otpRefs.current[0]?.focus();
  }, [step]);

  async function handlePhoneSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    const normalized = normalizeDigits(phone);
    if (!/^09\d{9}$/.test(normalized)) {
      sileo.error({
        title: "شماره موبایل معتبر نیست",
        description: "شماره را به‌صورت ۰۹۱۲۳۴۵۶۷۸۹ وارد کنید.",
      });
      return;
    }

    setPending(true);
    const result = await requestOtp(normalized);
    setPending(false);

    if (!result.ok) {
      sileo.error({ title: "ارسال کد تایید ممکن نشد", description: result.error });
      return;
    }

    setPhone(normalized);
    setIsNew(result.isNew);
    setDigits(initialDigits(result.devCode));
    setAutoFilled(Boolean(result.devCode));
    setSecondsLeft(RESEND_SECONDS);
    setStep("otp");
    sileo.info({
      title: "کد تایید ارسال شد",
      description: result.devCode
        ? `کد ${toFa(OTP_LENGTH)} رقمی به شمارهٔ ${toFa(normalized)} پیامک شد. (حالت تست: کد به طور خودکار وارد شد)`
        : `کد ${toFa(OTP_LENGTH)} رقمی به شمارهٔ ${toFa(normalized)} پیامک شد. (نسخهٔ فعلی: کد در ترمینال سرور نمایش داده می‌شود)`,
    });
  }

  /** Shared exit: the session cookie is set — hand over to the caller (the
      bookmark flow stays on its own page) or show the dashboard. */
  async function finishLogin(title: string, description: string) {
    sileo.success({ title, description });
    onClose();
    if (onSuccess) {
      onSuccess();
      return;
    }
    router.push("/dashboard");
  }

  async function handleCodeSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    const code = digits.join("");
    if (code.length < OTP_LENGTH) {
      sileo.warning({
        title: "کد کامل نیست",
        description: `هر ${toFa(OTP_LENGTH)} رقم کد تایید را وارد کنید.`,
      });
      return;
    }

    setPending(true);
    const result = await verifyOtp(phone, code);
    setPending(false);

    if (!result.ok) {
      sileo.error({ title: "کد تایید نادرست است", description: result.error });
      setDigits(Array(OTP_LENGTH).fill(""));
      setAutoFilled(false);
      otpRefs.current[0]?.focus();
      return;
    }

    /* Returning user → the code is all we need; sign in now. */
    if (!isNew) {
      await signInWithProfile();
      return;
    }

    /* First time → step three: collect the profile, then create everything. */
    setStep("profile");
  }

  async function signInWithProfile(fields?: {
    name: string;
    nationalId: string;
    birthDate: string;
  }) {
    setPending(true);
    try {
      const result = await signIn("credentials", {
        phone,
        mode: isNew ? "signup" : "login",
        ...(fields ?? {}),
        redirect: false,
      });

      if (!result || result.error) {
        sileo.error({
          title: "ورود ناموفق بود",
          description: "کد تایید منقضی شده یا اطلاعات قابل تأیید نیست؛ دوباره از ابتدا تلاش کنید.",
        });
        setStep("phone");
        setDigits(Array(OTP_LENGTH).fill(""));
        setAutoFilled(false);
        return;
      }

      await finishLogin(
        isNew ? "حساب شما ساخته شد" : "ورود موفقیت‌آمیز بود",
        isNew
          ? "خوش آمدی! حالا می‌توانی وارد داشبوردت شوی."
          : "به Kooja خوش آمدی!",
      );
    } catch {
      sileo.error({
        title: "خطا در برقراری ارتباط",
        description: "ارتباط با سرور برقرار نشد؛ چند لحظه دیگر دوباره تلاش کنید.",
      });
    } finally {
      setPending(false);
    }
  }

  async function handleProfileSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    const name = normalizeName(profile.name);
    const nationalId = normalizeDigits(profile.nationalId);

    if (!isValidName(name)) {
      sileo.error({
        title: "نام واردشده معتبر نیست",
        description: "نام و نام خانوادگی را کامل و حداقل ۳ حرفی وارد کنید.",
      });
      return;
    }
    if (!isValidNationalId(nationalId)) {
      sileo.error({
        title: "کد ملی معتبر نیست",
        description: "کد ملی ۱۰ رقمی را بدون خط تیره وارد کنید.",
      });
      return;
    }
    if (!isValidBirthDate(profile.birthDate)) {
      sileo.error({
        title: "تاریخ تولد معتبر نیست",
        description: "تاریخ تولد را به‌درستی انتخاب کنید.",
      });
      return;
    }

    await signInWithProfile({ name, nationalId, birthDate: profile.birthDate });
  }

  async function handleResend() {
    if (pending || secondsLeft > 0) return;

    setPending(true);
    const result = await requestOtp(phone);
    setPending(false);

    if (!result.ok) {
      sileo.error({ title: "ارسال کد جدید ممکن نشد", description: result.error });
      return;
    }

    setDigits(initialDigits(result.devCode));
    setAutoFilled(Boolean(result.devCode));
    setSecondsLeft(RESEND_SECONDS);
    otpRefs.current[0]?.focus();
    sileo.info({
      title: "کد جدید ارسال شد",
      description: result.devCode
        ? `کد تایید تازه به شمارهٔ ${toFa(phone)} پیامک شد. (حالت تست: کد به طور خودکار وارد شد)`
        : `کد تایید تازه به شمارهٔ ${toFa(phone)} پیامک شد.`,
    });
  }

  function handleOtpChange(index: number, raw: string) {
    const chars = normalizeDigits(raw);
    const next = [...digits];

    if (chars.length > 1) {
      // Typed on top of a filled box → replace with the new digit and move on.
      if (chars.length === 2 && digits[index] && chars[0] === digits[index]) {
        next[index] = chars[1];
        setDigits(next);
        if (index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
        return;
      }
      // Multi-digit paste → fill the following boxes.
      const fill = chars.slice(0, OTP_LENGTH - index).split("");
      fill.forEach((char, i) => {
        next[index + i] = char;
      });
      setDigits(next);
      otpRefs.current[Math.min(index + fill.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    next[index] = chars;
    setDigits(next);
    if (chars && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpPaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = normalizeDigits(event.clipboardData.getData("text"));
    if (!pasted) return;
    event.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    pasted.slice(0, OTP_LENGTH).split("").forEach((char, i) => {
      next[i] = char;
    });
    setDigits(next);
    otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  function handleOtpKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      otpRefs.current[index - 1]?.focus();
    }
  }

  /* Portaled to <body> so the sticky header's backdrop-filter can't become
     the containing block for this fixed-position overlay. */
  return createPortal(
    <motion.div
      data-auth-modal=""
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog — in RTL the first panel lands on the right side. */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={stepCopy[step].title}
        className="relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-700/70 sm:max-h-[92vh] sm:rounded-3xl"
        initial={isSheet ? { y: "100%" } : { opacity: 0, y: 24, scale: 0.97 }}
        animate={isSheet ? { y: 0, opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        exit={isSheet ? { y: "100%" } : { opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: "spring", bounce: isSheet ? 0.15 : 0.25, duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row">
          {/* ── Right side: banner ─── */}
          {/* Light mode keeps the Notion-ish paper look; dark mode matches the
              form side's slate-900 instead of a contrasting pure black. */}
          <div className="relative hidden overflow-hidden border-e border-neutral-200 bg-neutral-50 p-6 text-neutral-900 sm:p-8 md:block md:w-[40%] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50">
            {/* Faint paper-grid texture, faded out at the edges */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(9,9,9,0.11)_1px,transparent_1px),linear-gradient(90deg,rgba(9,9,9,0.11)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_92%)] dark:bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)]"
            />

            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-900/15 bg-white px-3 py-1.5 text-[11px] font-bold text-neutral-900 shadow-xs dark:border-slate-50/20 dark:bg-slate-800 dark:text-slate-50">
                <Sparkles className="h-3.5 w-3.5" />
                ثبت رایگان رویداد
              </span>

              <h3 className="mt-4 text-lg font-extrabold leading-8 sm:text-xl">
                رویداد بساز، ظرفیتش رو پر کن!
              </h3>
              <p className="mt-2 text-sm leading-7 text-neutral-600 dark:text-slate-400">
                با ورود به Kooja، رویدادهات رو به هزاران نفر برسون، ثبت‌نام‌ها رو مدیریت کن و
                بلیت‌ها رو زنده بفروش.
              </p>

              <ul className="mt-5 space-y-3">
                {bannerBullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-start gap-2.5 text-sm text-neutral-700 dark:text-slate-300"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-900 dark:bg-slate-50">
                      <Check className="h-3 w-3 text-white dark:text-slate-900" strokeWidth={3} />
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>

              <p className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-slate-400">
                <Zap className="h-3.5 w-3.5" />
                بیش از {toFa(1200)} رویداد فعال این ماه
              </p>
            </div>
          </div>

          {/* ── Left side: form ────────────────────────── */}
          <div className="flex-1 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <BrandMark />
                <h2 className="mt-3 text-xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-2xl">
                  {stepCopy[step].title}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {stepCopy[step].description}
                </p>
              </div>
              <button
                type="button"
                aria-label="بستن"
                onClick={onClose}
                className="shrink-0 rounded-full p-2 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {step === "phone" ? (
                <motion.form
                  key="phone"
                  onSubmit={handlePhoneSubmit}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                  className="mt-6"
                >
                  <label
                    htmlFor="auth-phone"
                    className="block text-sm font-bold text-slate-700 dark:text-slate-300"
                  >
                    شماره موبایل
                  </label>
                  <input
                    id="auth-phone"
                    type="tel"
                    inputMode="numeric"
                    dir="ltr"
                    autoComplete="tel"
                    autoFocus
                    placeholder="09123456789"
                    value={phone}
                    onChange={(event) =>
                      setPhone(normalizeDigits(event.target.value).slice(0, 11))
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm tracking-widest text-slate-900 outline-none transition-all duration-200 placeholder:tracking-normal placeholder:text-slate-300 focus:border-blue-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-600 dark:focus:bg-slate-800"
                  />

                  {/* Policy note, directly under the input */}
                  <p className="mt-2.5 flex items-start gap-1.5 text-[11px] leading-5 text-slate-400 dark:text-slate-500">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                    <span>
                      ثبت‌نام به معنای تأیید{" "}
                      <span className="cursor-pointer font-bold text-blue-600 underline underline-offset-2 transition-colors duration-200 hover:text-blue-700">
                        قوانین و مقررات
                      </span>{" "}
                      و{" "}
                      <span className="cursor-pointer font-bold text-blue-600 underline underline-offset-2 transition-colors duration-200 hover:text-blue-700">
                        سیاست حریم خصوصی
                      </span>{" "}
                      Kooja است.
                    </span>
                  </p>

                  <button
                    type="submit"
                    disabled={pending}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {pending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        در حال ارسال کد…
                      </>
                    ) : (
                      <>
                        دریافت کد تایید
                        <ArrowLeft className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </motion.form>
              ) : step === "otp" ? (
                <motion.form
                  key="otp"
                  onSubmit={handleCodeSubmit}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                  className="mt-6"
                >
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    کد {toFa(OTP_LENGTH)} رقمی به شمارهٔ{" "}
                    <span dir="ltr" className="font-bold text-slate-800 dark:text-slate-100">
                      {toFa(phone)}
                    </span>{" "}
                    ارسال شد.
                  </p>

                  {autoFilled && (
                    <p className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                      حالت تست: کد تایید به طور خودکار وارد شد.
                    </p>
                  )}

                  {/* OTP boxes — LTR so the code reads left → right */}
                  <div dir="ltr" className="mt-5 flex gap-2 sm:gap-2.5">
                    {digits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(element) => {
                          otpRefs.current[index] = element;
                        }}
                        value={digit}
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        aria-label={`رقم ${toFa(index + 1)} کد تایید`}
                        onChange={(event) => handleOtpChange(index, event.target.value)}
                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                        onPaste={handleOtpPaste}
                        className="h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 text-center text-lg font-extrabold text-slate-900 outline-none transition-all duration-200 focus:border-blue-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-600 dark:focus:bg-slate-800"
                      />
                    ))}
                  </div>

                  {/* Countdown + resend */}
                  <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-400 dark:text-slate-500">
                      {secondsLeft > 0 ? (
                        <>
                          ارسال مجدد کد تا{" "}
                          <span className="font-bold tabular-nums text-slate-600 dark:text-slate-300">
                            {faClock(secondsLeft)}
                          </span>
                        </>
                      ) : (
                        "کدی دریافت نکردی؟"
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={secondsLeft > 0 || pending}
                      className="shrink-0 font-bold text-blue-600 transition-colors duration-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:text-slate-300 dark:text-blue-400 dark:hover:text-blue-300 dark:disabled:text-slate-600 dark:disabled:hover:text-slate-600"
                    >
                      ارسال مجدد کد
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={pending}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {pending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        در حال بررسی کد…
                      </>
                    ) : (
                      <>
                        {isNew ? "تایید و ادامه" : "تایید و ورود"}
                        <ArrowLeft className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep("phone")}
                    className="mt-3 w-full text-center text-xs font-bold text-slate-400 transition-colors duration-200 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    ویرایش شماره موبایل
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="profile"
                  onSubmit={handleProfileSubmit}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                  className="mt-6"
                >
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    کد شمارهٔ{" "}
                    <span dir="ltr" className="font-bold text-slate-800 dark:text-slate-100">
                      {toFa(phone)}
                    </span>{" "}
                    تایید شد؛ فقط چند تا اطلاعات برای ساخت حساب لازم است.
                  </p>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label
                        htmlFor="auth-name"
                        className="block text-sm font-bold text-slate-700 dark:text-slate-300"
                      >
                        نام و نام خانوادگی
                      </label>
                      <input
                        id="auth-name"
                        type="text"
                        autoComplete="name"
                        autoFocus
                        placeholder="مثال: سارا رضایی"
                        value={profile.name}
                        onChange={(event) =>
                          setProfile((p) => ({ ...p, name: event.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-300 focus:border-blue-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-600 dark:focus:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="auth-national-id"
                        className="block text-sm font-bold text-slate-700 dark:text-slate-300"
                      >
                        کد ملی
                      </label>
                      <input
                        id="auth-national-id"
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        maxLength={10}
                        autoComplete="off"
                        placeholder="0012345678"
                        value={profile.nationalId}
                        onChange={(event) =>
                          setProfile((p) => ({
                            ...p,
                            nationalId: normalizeDigits(event.target.value).slice(0, 10),
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm tracking-widest text-slate-900 outline-none transition-all duration-200 placeholder:tracking-normal placeholder:text-slate-300 focus:border-blue-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-600 dark:focus:bg-slate-800"
                      />
                    </div>

                    <div>
                      <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                        تاریخ تولد
                      </span>
                      <ShamsiWheelDatePicker
                        value={profile.birthDate}
                        onChange={(birthDate) =>
                          setProfile((p) => ({ ...p, birthDate }))
                        }
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={pending}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {pending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        در حال ساخت حساب…
                      </>
                    ) : (
                      <>
                        ساخت حساب و ورود
                        <ArrowLeft className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep("otp")}
                    className="mt-3 w-full text-center text-xs font-bold text-slate-400 transition-colors duration-200 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    بازگشت به کد تایید
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

type AddEventButtonProps = {
  /** Full class list for the trigger button (falls back to the primary CTA style). */
  className?: string;
  children?: React.ReactNode;
  /**
   * Session exists → skip the auth modal entirely: the client already has an
   * account, so the trigger becomes a plain link into the app instead.
   * Omitted → the button checks the session itself via `useSession()`.
   */
  authenticated?: boolean;
  /** Where the signed-in client goes (defaults to their dashboard). */
  href?: string;
};

/**
 * Trigger button that opens the «ورود» popup (phone → OTP → profile) — or,
 * when a session exists, a link to the signed-in client's destination.
 *
 * The session is read here (not by each caller) so every «ثبت رویداد» CTA
 * follows the same rule: signed in → straight to `href`, signed out → auth.
 * Callers that already know the state — the header — pass `authenticated`
 * and win over the lookup.
 */
export default function AddEventButton({
  className,
  children,
  authenticated,
  href = "/dashboard",
}: AddEventButtonProps) {
  const [open, setOpen] = useState(false);

  const { status } = useSession();
  const signedIn = authenticated ?? status === "authenticated";

  if (signedIn) {
    return (
      <Link href={href} className={className ?? DEFAULT_CLASSES}>
        {children ?? "داشبورد من"}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={className ?? DEFAULT_CLASSES}
      >
        {children ?? (
          <>
            <Plus className="h-4 w-4" />
            ثبت رایگان رویداد
          </>
        )}
      </button>

      <AnimatePresence>{open && <AuthModal onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}
