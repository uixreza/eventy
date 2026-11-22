"use client";

import { confirm } from "@/components/ui/confirm";

/**
 * «آیا واقعاً می‌خواهید خارج شوید؟» — the sign-out question, on top of the
 * shared confirm-toast helper (`components/ui/confirm.tsx`).
 */
export function confirmSignOut(
  copy: { title?: string; question?: string } = {},
): Promise<boolean> {
  return confirm({
    title: copy.title ?? "خروج از حساب؟",
    question: copy.question ?? "آیا می‌خواهید از حساب خود خارج شوید؟",
    yes: "بله",
    no: "خیر",
  });
}
