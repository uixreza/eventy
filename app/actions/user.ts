"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import {
  isValidBirthDate,
  isValidName,
  isValidNationalId,
  normalizeDigits,
  normalizeName,
} from "@/lib/auth-flow";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/** What the settings form posts — the row is never identified by the client. */
export type ProfileInput = {
  name: string;
  nationalId: string;
  /** Gregorian `YYYY-MM-DD`, the format `User.birthDate` and signup speak. */
  birthDate: string;
};

export type ProfileResult = { ok: true } | { ok: false; error: string };

/**
 * Saves the profile fields of the signed-in user.
 *
 * The session picks the row (a client-supplied id would be ignored anyway)
 * and every rule from `lib/auth-flow.ts` is repeated here — the form's own
 * checks exist for feedback, not for security.
 */
export async function updateProfile(input: ProfileInput): Promise<ProfileResult> {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, error: "نشست شما به پایان رسیده است؛ دوباره وارد شوید." };
  }

  const name = normalizeName(input.name);
  if (!isValidName(name)) {
    return { ok: false, error: "نام و نام خانوادگی باید بین ۳ تا ۸۰ حرف باشد." };
  }

  const nationalId = normalizeDigits(input.nationalId);
  if (!isValidNationalId(nationalId)) {
    return { ok: false, error: "کد ملی ۱۰ رقمی معتبر نیست." };
  }

  if (!isValidBirthDate(input.birthDate)) {
    return { ok: false, error: "تاریخ تولد معتبر نیست؛ سن باید بین ۱۳ تا ۱۲۰ سال باشد." };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        nationalId,
        birthDate: new Date(`${input.birthDate}T00:00:00.000Z`),
      },
    });
  } catch {
    return { ok: false, error: "ذخیره تغییرات ممکن نشد؛ اتصال اینترنت را بررسی کنید." };
  }

  /* The settings page (and every other dashboard route) rendered the old row. */
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export type AdminUserResult = { ok: true } | { ok: false; error: string };

/**
 * Shared guard of the admin server actions (client management here, category
 * management in `app/actions/category.ts`). The session is re-read here (not
 * trusted from the client), and `getSession` already answers `null` for
 * banned or deleted accounts.
 */
export async function requireAdminActor(): Promise<
  { ok: true; adminId: string } | { ok: false; error: string }
> {
  const session = await getSession();
  const adminId = session?.user?.id;
  if (!adminId || session.user.role !== "ADMIN") {
    return { ok: false, error: "فقط مدیر سیستم می‌تواند این کار را انجام دهد." };
  }
  return { ok: true, adminId };
}

/**
 * Promotes a client to `ADMIN` or demotes one back to `USER`.
 *
 * The acting admin can't change their own role — otherwise a single misclick
 * could strip `/console` from the last administrator. The new role takes
 * effect on the target's very next request, because the session re-reads the
 * row instead of trusting the JWT it was minted with.
 */
export async function setUserRole(
  targetId: string,
  role: Role,
): Promise<AdminUserResult> {
  const gate = await requireAdminActor();
  if (!gate.ok) return gate;

  if (role !== "USER" && role !== "ADMIN") {
    return { ok: false, error: "نقش انتخاب‌شده معتبر نیست." };
  }
  if (targetId === gate.adminId) {
    return { ok: false, error: "شما نمی‌توانید نقش خودتان را تغییر دهید." };
  }

  try {
    await prisma.user.update({ where: { id: targetId }, data: { role } });
  } catch {
    return { ok: false, error: "کاربر پیدا نشد یا تغییر نقش ذخیره نشد." };
  }

  /* Both gates read the role from the row on every request; this just makes
     the change visible to anything already sitting in cache. */
  revalidatePath("/console", "layout");
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/**
 * Blocks or restores an account. `bannedAt` is the single switch: from the
 * moment it is set, the OTP flow refuses to talk to the person, `authorize`
 * mints no session, and `getSession` reads their live cookie as signed out —
 * so every page, API and action closes at once, without deleting anything.
 *
 * An admin can't ban themselves, for the same reason they can't demote
 * themselves: it would lock the console shut from the inside.
 */
export async function setUserBanned(
  targetId: string,
  banned: boolean,
): Promise<AdminUserResult> {
  const gate = await requireAdminActor();
  if (!gate.ok) return gate;

  if (targetId === gate.adminId) {
    return { ok: false, error: "امکان مسدودسازی حساب خودتان وجود ندارد." };
  }

  try {
    await prisma.user.update({
      where: { id: targetId },
      data: { bannedAt: banned ? new Date() : null },
    });
  } catch {
    return { ok: false, error: "کاربر پیدا نشد یا تغییر وضعیت ذخیره نشد." };
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/console", "layout");
  return { ok: true };
}
