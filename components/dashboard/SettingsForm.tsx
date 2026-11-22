"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { jalaaliMonthLength, isValidJalaaliDate, toGregorian, toJalaali } from "jalaali-js";
import { Loader2, Lock, Save } from "lucide-react";
import { sileo } from "sileo";
import { updateProfile } from "@/app/actions/user";
import {
  isValidBirthDate,
  isValidName,
  isValidNationalId,
  normalizeDigits,
  normalizeName,
} from "@/lib/auth-flow";
import { shamsiMonths, toFa } from "@/lib/utils";

/** What `app/dashboard/settings/page.tsx` read out of the database. */
export type SettingsInitial = {
  fullName: string;
  phone: string;
  nationalId: string;
  birth: { year: number; month: number; day: number };
};

/** Shamsi year of today, so the birth-year list never goes stale. */
const THIS_YEAR = toJalaali(
  new Date().getFullYear(),
  new Date().getMonth() + 1,
  new Date().getDate(),
).jy;

const BIRTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-600";

const labelClass = "block text-sm font-bold text-slate-700 dark:text-slate-300";
const subLabelClass = "mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400";

const pad = (value: number) => String(value).padStart(2, "0");

export default function SettingsForm({ initial }: { initial: SettingsInitial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(initial.fullName);
  const [birth, setBirth] = useState(initial.birth);
  const [nationalId, setNationalId] = useState(initial.nationalId);

  /* 13 to 120 years old — same window `isValidBirthDate` enforces. */
  const birthYears = Array.from(
    { length: THIS_YEAR - 13 - (THIS_YEAR - 120) + 1 },
    (_, i) => THIS_YEAR - 13 - i,
  );
  /* Never offer a day the chosen month does not have (۳۰ دی، ۲۹ اسفند…). */
  const daysInMonth = jalaaliMonthLength(birth.year, birth.month);
  const birthDays = BIRTH_DAYS.filter((day) => day <= daysInMonth);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const name = normalizeName(fullName);
    if (!isValidName(name)) {
      sileo.error({
        title: "نام و نام خانوادگی نامعتبر",
        description: "نام باید بین ۳ تا ۸۰ حرف (با حروف فارسی، انگلیسی یا خط تیره) باشد.",
      });
      return;
    }
    if (!isValidNationalId(nationalId)) {
      sileo.error({
        title: "کد ملی نامعتبر",
        description: "کد ملی باید ۱۰ رقم و دارای رقم کنترل درست باشد.",
      });
      return;
    }
    if (!isValidJalaaliDate(birth.year, birth.month, birth.day)) {
      sileo.error({ title: "تاریخ تولد نامعتبر", description: "این روز در ماه انتخابی وجود ندارد." });
      return;
    }
    const g = toGregorian(birth.year, birth.month, birth.day);
    const birthDate = `${g.gy}-${pad(g.gm)}-${pad(g.gd)}`;
    if (!isValidBirthDate(birthDate)) {
      sileo.error({
        title: "تاریخ تولد نامعتبر",
        description: "سن باید بین ۱۳ تا ۱۲۰ سال باشد.",
      });
      return;
    }

    startTransition(async () => {
      const result = await updateProfile({ name, nationalId, birthDate });
      if (!result.ok) {
        sileo.error({ title: "ذخیره نشد", description: result.error });
        return;
      }
      sileo.success({
        title: "اطلاعات ذخیره شد",
        description: "تغییرات پروفایل شما با موفقیت اعمال شد.",
      });
      /* The action already revalidated; refresh so the header picks it up. */
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
          تنظیمات حساب کاربری
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          اطلاعات شخصی خود را مشاهده و ویرایش کنید.
        </p>
      </div>

      {/* ── Information fields ──────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="space-y-5">
          {/* Full name */}
          <div>
            <label htmlFor="settings-name" className={labelClass}>
              نام و نام خانوادگی
            </label>
            <input
              id="settings-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="مثال: مهراد رضایی"
              className={`mt-2 ${fieldClass}`}
            />
          </div>

          {/* Phone — pre-written and locked */}
          <div>
            <label
              htmlFor="settings-phone"
              className="flex items-center justify-between gap-2 text-sm font-bold text-slate-700 dark:text-slate-300"
            >
              شماره موبایل
              <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                <Lock className="h-3 w-3" />
                قابل تغییر نیست
              </span>
            </label>
            <input
              id="settings-phone"
              dir="ltr"
              readOnly
              value={toFa(initial.phone)}
              aria-describedby="settings-phone-hint"
              className={`mt-2 cursor-not-allowed bg-slate-50 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 ${fieldClass}`}
            />
            <p id="settings-phone-hint" className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
              شماره پس از تایید هویت، برای امنیت حساب تغییر نمی‌کند.
            </p>
          </div>

          {/* Date of birth — Shamsi */}
          <div>
            <span className={labelClass}>تاریخ تولد (شمسی)</span>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="settings-birth-year" className={subLabelClass}>
                  سال
                </label>
                <select
                  id="settings-birth-year"
                  value={birth.year}
                  onChange={(event) => setBirth({ ...birth, year: Number(event.target.value) })}
                  className={fieldClass}
                >
                  {birthYears.map((year) => (
                    <option key={year} value={year}>
                      {toFa(year)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="settings-birth-month" className={subLabelClass}>
                  ماه
                </label>
                <select
                  id="settings-birth-month"
                  value={birth.month}
                  onChange={(event) => {
                    const month = Number(event.target.value);
                    /* ۳۰/۳۱ روزی که در ماه قبل ممکن بود ممکن است این‌جا نباشد. */
                    const length = jalaaliMonthLength(birth.year, month);
                    setBirth({
                      ...birth,
                      month,
                      day: Math.min(birth.day, length),
                    });
                  }}
                  className={fieldClass}
                >
                  {shamsiMonths.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="settings-birth-day" className={subLabelClass}>
                  روز
                </label>
                <select
                  id="settings-birth-day"
                  value={birth.day}
                  onChange={(event) => setBirth({ ...birth, day: Number(event.target.value) })}
                  className={fieldClass}
                >
                  {birthDays.map((day) => (
                    <option key={day} value={day}>
                      {toFa(day)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Personal ID code */}
          <div>
            <label
              htmlFor="settings-national-id"
              className="flex items-center justify-between gap-2 text-sm font-bold text-slate-700 dark:text-slate-300"
            >
              کد ملی
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {toFa(normalizeDigits(nationalId).length)} از ۱۰ رقم
              </span>
            </label>
            <input
              id="settings-national-id"
              dir="ltr"
              inputMode="numeric"
              maxLength={10}
              value={nationalId}
              onChange={(event) =>
                setNationalId(normalizeDigits(event.target.value).slice(0, 10))
              }
              placeholder="0012345678"
              className={`mt-2 tracking-[0.3em] ${fieldClass}`}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-200 pt-5 dark:border-slate-700">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {pending ? "در حال ذخیره…" : "ذخیره تغییرات"}
          </button>
        </div>
      </form>
    </div>
  );
}
