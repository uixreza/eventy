"use client";

import { Share2 } from "lucide-react";
import { sileo } from "sileo";

/**
 * Copies an event link. The detail page uses the exact address in the bar;
 * list cards pass the event slug so they never share the /events URL.
 */
type ShareEventButtonProps = {
  title: string;
  /** Optional destination for list cards; defaults to the current page. */
  href?: string;
  /** Icon-only variant for cards. */
  compact?: boolean;
  /** Gold tint for promoted cards. */
  gold?: boolean;
};

export default function ShareEventButton({
  title,
  href,
  compact = false,
  gold = false,
}: ShareEventButtonProps) {
  async function copyLink() {
    const url = href
      ? new URL(href, window.location.origin).href
      : window.location.href;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        /* Plain HTTP outside localhost has no Clipboard API. */
        const field = document.createElement("textarea");
        field.value = url;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand("copy");
        field.remove();
        if (!copied) throw new Error("copy failed");
      }
      sileo.success({
        title: "لینک رویداد کپی شد",
        description: `لینک «${title}» در کلیپ\u200cبورد شماست.`,
      });
    } catch {
      sileo.error({
        title: "کپی لینک ممکن نشد",
        description: "آدرس صفحه را دستی از نوار آدرس کپی کنید.",
      });
    }
  }

  const shape = compact
    ? "grid h-9 w-9 place-items-center rounded-xl"
    : "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold";
  const tone = gold
    ? "border-amber-300/70 bg-amber-50 text-amber-700 hover:border-amber-400 hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
    : "border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300";

  return (
    <button
      type="button"
      onClick={copyLink}
      title={compact ? "اشتراک\u200cگذاری" : undefined}
      aria-label={compact ? `اشتراک\u200cگذاری رویداد ${title}` : undefined}
      className={`border transition-all duration-200 ${shape} ${tone}`}
    >
      <Share2 className="h-4 w-4" />
      {!compact && "اشتراک\u200cگذاری"}
    </button>
  );
}
