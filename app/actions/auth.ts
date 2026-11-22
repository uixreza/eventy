"use server";

import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_SECONDS,
  RESEND_SECONDS,
  normalizeDigits,
  normalizePhone,
  type OtpRequestResult,
  type OtpVerifyResult,
} from "@/lib/auth-flow";

/** Best-effort removal of a dead code — the row is useless from here on. */
async function discard(id: string): Promise<void> {
  try {
    await prisma.otpCode.delete({ where: { id } });
  } catch {
    /* already gone */
  }
}

/** The one refusal a blocked account gets, at every door of the flow. */
const BANNED_ERROR =
  "حساب شما مسدود شده است. برای پیگیری و رفع مسدودی با پشتیبانی تماس بگیرید.";

/**
 * Step 1 — issue a code for a phone number.
 *
 * Returns `isNew` so the modal knows whether a login (existing account, no
 * profile step) or a signup (profile step three) is about to happen. That
 * flag only changes which screens the user sees; it never bypasses the code.
 */
export async function requestOtp(rawPhone: string): Promise<OtpRequestResult> {
  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return { ok: false, error: "شماره موبایل معتبر نیست. شماره را به‌صورت ۰۹۱۲۳۴۵۶۷۸۹ وارد کنید." };
  }

  /* A blocked account never even gets a code — the screen says why here,
     instead of the login failing later at the door with a vague error. */
  const account = await prisma.user.findUnique({
    where: { phone },
    select: { bannedAt: true },
  });
  if (account?.bannedAt) {
    return { ok: false, error: BANNED_ERROR };
  }

  const latest = await prisma.otpCode.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });

  if (latest && Date.now() - latest.createdAt.getTime() < RESEND_SECONDS * 1000) {
    const wait = Math.ceil(
      (RESEND_SECONDS * 1000 - (Date.now() - latest.createdAt.getTime())) / 1000,
    );
    return {
      ok: false,
      error: `کد جدید تا ${wait} ثانیه دیگر قابل ارسال است. همان کد قبلی را وارد کنید.`,
    };
  }

  const code = String(randomInt(100000, 1000000)).padStart(OTP_LENGTH, "0");

  /* Asking for a new code kills the previous one, verified or not. */
  await prisma.otpCode.deleteMany({ where: { phone } });
  await prisma.otpCode.create({
    data: { phone, code, expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000) },
  });

  /* TODO: hand the code to an SMS gateway. For now it only lives here —
     in production this must never log the code. */
  console.log(`\n  [OTP] ${phone} → ${code}  (valid ${OTP_TTL_SECONDS / 60} min)\n`);

  return { ok: true, isNew: account === null };
}

/** Step 2 — check the code the user typed and stamp it as proven. */
export async function verifyOtp(rawPhone: string, rawCode: string): Promise<OtpVerifyResult> {
  const phone = normalizePhone(rawPhone);
  const code = normalizeDigits(rawCode);

  if (!phone) return { ok: false, error: "شماره موبایل معتبر نیست." };
  if (code.length !== OTP_LENGTH) {
    return { ok: false, error: `هر ${OTP_LENGTH} رقم کد تایید را وارد کنید.` };
  }

  /* Same wall as step one: a blocked account can't prove anything, so no
     code is ever stamped for it. */
  const account = await prisma.user.findUnique({
    where: { phone },
    select: { bannedAt: true },
  });
  if (account?.bannedAt) {
    return { ok: false, error: BANNED_ERROR };
  }

  const otp = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.expiresAt.getTime() <= Date.now()) {
    if (otp) await discard(otp.id);
    return { ok: false, error: "کد تایید منقضی شده است؛ کد جدیدی بگیرید." };
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await discard(otp.id);
    return {
      ok: false,
      error: "تعداد تلاش‌های مجاز تمام شد. کد جدیدی بگیرید.",
    };
  }

  if (otp.code !== code) {
    const updated = await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    const left = OTP_MAX_ATTEMPTS - updated.attempts;
    return {
      ok: false,
      error:
        left > 0
          ? `کد تایید نادرست است. ${left} تلاش دیگر باقی مانده.`
          : "کد تایید نادرست است. کد جدیدی بگیرید.",
    };
  }

  await prisma.otpCode.update({ where: { id: otp.id }, data: { verifiedAt: new Date() } });
  return { ok: true };
}
