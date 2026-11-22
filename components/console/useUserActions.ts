"use client";

import { useState } from "react";
import { sileo } from "sileo";
import { setUserBanned, setUserRole } from "@/app/actions/user";
import { confirm } from "@/components/ui/confirm";
import type { UserRole } from "@/lib/user-types";

/** The facts both actions need about the account they are about to change. */
export type UserActionTarget = {
  id: string;
  name: string;
  role: UserRole;
  /** `bannedAt` resolved to a flag — the actions only need the switch. */
  banned: boolean;
};

/**
 * The two client-management moves of `/console/users`, shared by the table
 * row and the detail modal so both ask the same question, in the same
 * words, and react to the same result.
 *
 * Each move confirms first (both change what an account can *reach*), then
 * runs the server action — which re-checks the admin session and refuses a
 * self-demotion or self-ban on its own — and on success calls `onChanged`
 * so the list and any open modal re-read the database.
 *
 * Deliberately not wrapped in `startTransition`: the confirm dialog and
 * the toasts are sileo store writes, and a write scheduled while an async
 * transition is open never reaches the Toaster (the question would sit on
 * screen never rendering). The plain async flow keeps `pending` — held
 * across the dialog and the action — as the only shared busy flag.
 */
export function useUserActions(onChanged: () => void) {
  const [pending, setPending] = useState(false);

  async function changeRole(target: UserActionTarget, next: UserRole) {
    if (pending) return;
    const becomesAdmin = next === "ADMIN";
    setPending(true);
    try {
      const ok = await confirm({
        title: `نقش «${target.name}»`,
        question: becomesAdmin
          ? "این حساب دسترسی کامل به کنسول مدیریت پیدا می‌کند. تغییر بدهم؟"
          : "این حساب به «کاربر» برمی‌گردد و دسترسی‌اش به کنسول قطع می‌شود. تغییر بدهم؟",
        yes: "بله، تغییر بده",
        no: "انصراف",
      });
      if (!ok) return;

      const result = await setUserRole(target.id, next);
      if (!result.ok) {
        sileo.error({ title: result.error, description: "دوباره تلاش کنید." });
        return;
      }
      sileo.success({
        title: `نقش «${target.name}» به «${becomesAdmin ? "مدیر" : "کاربر"}» تغییر کرد`,
        description: "از همین حالا اعمال شد؛ نیازی به ورود دوباره نیست.",
      });
      onChanged();
    } finally {
      setPending(false);
    }
  }

  async function toggleBan(target: UserActionTarget) {
    if (pending) return;
    const unbanning = target.banned;
    setPending(true);
    try {
      const ok = await confirm({
        title: unbanning ? `رفع مسدودی «${target.name}»` : `مسدودسازی «${target.name}»`,
        question: unbanning
          ? "حساب دوباره فعال می‌شود و صاحبش می‌تواند وارد شود. ادامه بدهم؟"
          : "این حساب دیگر نمی‌تواند وارد شود و داشبوردش بسته می‌شود. ادامه بدهم؟",
        yes: unbanning ? "بله، فعال کن" : "بله، مسدود کن",
        no: "انصراف",
      });
      if (!ok) return;

      const result = await setUserBanned(target.id, !unbanning);
      if (!result.ok) {
        sileo.error({ title: result.error, description: "دوباره تلاش کنید." });
        return;
      }
      sileo.success({
        title: unbanning
          ? `حساب «${target.name}» دوباره فعال شد`
          : `حساب «${target.name}» مسدود شد`,
        description: "تغییر وضعیت از همین حالا اعمال شد.",
      });
      onChanged();
    } finally {
      setPending(false);
    }
  }

  return { pending, changeRole, toggleBan };
}
