"use client";

import { useState } from "react";
import { Loader2, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { sileo } from "sileo";
import { MOCK_CLASS } from "./mock";

const cardClass =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900";
const headingClass = "text-sm font-bold text-slate-800 dark:text-slate-100";
const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-600";
const subLabelClass = "mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400";

type ToggleDef = {
  key: string;
  label: string;
  description: string;
  on: boolean;
};

/** Platform-wide switches — grouped so each card reads as one concern. */
const toggleGroups: { title: string; toggles: ToggleDef[] }[] = [
  {
    title: "ثبت‌نام و کاربران",
    toggles: [
      {
        key: "signup",
        label: "ثبت‌نام با شماره موبایل",
        description: "ورود و ثبت‌نام کاربران جدید با کد تأیید پیامکی فعال باشد.",
        on: true,
      },
      {
        key: "review",
        label: "تأیید دستی کاربران",
        description: "کاربران جدید قبل از ایجاد رویداد، در انتظار تأیید مدیریت بمانند.",
        on: false,
      },
    ],
  },
  {
    title: "رویدادها",
    toggles: [
      {
        key: "autoApprove",
        label: "انتشار خودکار رویدادها",
        description: "رویدادهای ساخته‌شده بدون بررسی، بلافاصله منتشر شوند.",
        on: false,
      },
      {
        key: "freeEvents",
        label: "رویدادهای رایگان",
        description: "برگزارکنندگان بتوانند رویداد بدون شهریه ثبت کنند.",
        on: true,
      },
      {
        key: "waitlist",
        label: "لیست انتظار",
        description: "پس از تکمیل ظرفیت، لیست انتظار خودکار فعال شود.",
        on: true,
      },
    ],
  },
  {
    title: "پرداخت و بازگشت وجه",
    toggles: [
      {
        key: "refund",
        label: "بازگشت وجه خودکار",
        description: "در صورت لغو رویداد، بازگشت وجه بدون تأیید دستی انجام شود.",
        on: true,
      },
      {
        key: "installment",
        label: "پرداخت اقساطی",
        description: "امکان پرداخت شهریه رویدادهای گران‌قیمت به صورت اقساط.",
        on: false,
      },
    ],
  },
  {
    title: "اعلان‌ها",
    toggles: [
      {
        key: "sms",
        label: "یادآوری پیامکی",
        description: "یادآوری رویداد، ۲۴ ساعت قبل از آغاز برای ثبت‌نام‌شده‌ها ارسال شود.",
        on: true,
      },
      {
        key: "pendingDigest",
        label: "خلاصه رویدادهای در انتظار",
        description: "هر صبح فهرست رویدادهای در انتظار بررسی برای مدیران ارسال شود.",
        on: true,
      },
      {
        key: "marketing",
        label: "پیامک تبلیغاتی",
        description: "کمپین‌ها و رویدادهای ویژه از طریق پیامک اطلاع‌رسانی شوند.",
        on: false,
      },
    ],
  },
];

const initialToggles: Record<string, boolean> = Object.fromEntries(
  toggleGroups.flatMap((group) => group.toggles.map((t) => [t.key, t.on])),
);

const initialFields = {
  siteName: "رویدادشو",
  supportPhone: "۰۲۱-۹۱۰۰۱۲۳۴",
  maxCapacity: "۵۰۰",
};

/** One switch row — knob slides to the inline end (left, RTL) when on. */
function ToggleRow({
  toggle,
  checked,
  onChange,
}: {
  toggle: ToggleDef;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <li className="flex items-start justify-between gap-4 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {toggle.label}
        </p>
        <p className="mt-0.5 text-xs leading-6 text-slate-500 dark:text-slate-400">
          {toggle.description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={toggle.label}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
          checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "-translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </li>
  );
}

export default function ConsoleSettings() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(initialToggles);
  const [fields, setFields] = useState(initialFields);
  const [pending, setPending] = useState(false);

  const setToggle = (key: string, value: boolean) =>
    setToggles((prev) => ({ ...prev, [key]: value }));

  const setField = (key: keyof typeof initialFields, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    /* Mock save — the console runs on display data for now. */
    setPending(true);
    window.setTimeout(() => {
      setPending(false);
      sileo.success({
        title: "تنظیمات ذخیره شد",
        description: "تغییرات سراسری کنسول با موفقیت اعمال شد.",
      });
    }, 600);
  }

  function handleReset() {
    setToggles(initialToggles);
    setFields(initialFields);
    sileo.info({
      title: "تنظیمات بازنشانی شد",
      description: "مقادیر پیش‌فرض دوباره بارگذاری شدند.",
    });
  }

  /* The four cards pair up two-by-two; the grid takes any count. */
  const cards = toggleGroups.map((group) => (
    <div key={group.title} className={`${cardClass} ${MOCK_CLASS}`}>
      <h2 className={headingClass}>{group.title}</h2>
      <ul className="mt-3 space-y-1">
        {group.toggles.map((toggle) => (
          <ToggleRow
            key={toggle.key}
            toggle={toggle}
            checked={toggles[toggle.key]}
            onChange={(value) => setToggle(toggle.key, value)}
          />
        ))}
      </ul>
    </div>
  ));

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* ── General ─────────────────────────────────────────── */}
      <div className={`${cardClass} ${MOCK_CLASS}`}>
        <h2 className={headingClass}>اطلاعات عمومی</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="console-site-name" className={subLabelClass}>
              نام سامانه
            </label>
            <input
              id="console-site-name"
              type="text"
              value={fields.siteName}
              onChange={(e) => setField("siteName", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="console-support" className={subLabelClass}>
              تلفن پشتیبانی
            </label>
            <input
              id="console-support"
              type="text"
              dir="ltr"
              value={fields.supportPhone}
              onChange={(e) => setField("supportPhone", e.target.value)}
              className={`${fieldClass} text-right tracking-widest`}
            />
          </div>
          <div>
            <label htmlFor="console-capacity" className={subLabelClass}>
              سقف ظرفیت رویداد (نفر)
            </label>
            <input
              id="console-capacity"
              type="text"
              inputMode="numeric"
              value={fields.maxCapacity}
              onChange={(e) => setField("maxCapacity", e.target.value)}
              className={`${fieldClass} text-right`}
            />
          </div>
        </div>
      </div>

      {/* ── Toggle groups ───────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-2">{cards}</div>

      {/* ── Security note ───────────────────────────────────── */}
      <div className={`${cardClass} flex items-start gap-3 ${MOCK_CLASS}`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className={headingClass}>امنیت نشست مدیریتی</h2>
          <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
            نشست شما تا ۳۰ دقیقه عدم فعالیت به‌صورت خودکار منقضی می‌شود؛ ورود دوباره با کد
            تأیید پیامکی انجام می‌شود. آخرین ورود: امروز، ۰۹:۴۵
          </p>
        </div>
      </div>

      {/* ── Actions ─────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
        >
          <RotateCcw className="h-4 w-4" />
          بازنشانی
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          ذخیره تغییرات
        </button>
      </div>
    </form>
  );
}
