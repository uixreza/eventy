"use client";

import { toFa } from "@/lib/utils";

type Props = {
  count: number;
  /** Positioning is left to the caller — the tab and the bell anchor it differently. */
  className?: string;
  /** What is being counted, for screen readers. Defaults to dashboard notices. */
  label?: string;
};

/** The unread-notification count that sits on the corner of the menu item. */
export default function NotificationsBadge({ count, className = "", label }: Props) {
  if (count <= 0) return null;

  const text = count > 99 ? "۹۹+" : toFa(count);

  return (
    <span
      aria-label={label ? `${text} ${label}` : `${toFa(count)} اعلان خواندهنشده`}
      className={`flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold leading-none text-white ${className}`}
    >
      {text}
    </span>
  );
}
