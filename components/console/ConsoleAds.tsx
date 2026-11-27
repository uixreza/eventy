"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Save, Trash2, UploadCloud, X } from "lucide-react";
import { sileo } from "sileo";
import {
  deleteSiteBanner,
  saveSiteAnnouncement,
  saveSiteBanner,
} from "@/app/actions/announcement";
import { MAX_AD_LINK } from "@/lib/ad-link";
import type { SiteAnnouncementData } from "@/lib/announcement-types";
import {
  SITE_BANNER_ACCEPT,
  SITE_BANNER_HEIGHT,
  SITE_BANNER_WIDTH,
  siteBannerUrl,
} from "@/lib/site-banner";
import { toFa } from "@/lib/utils";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-600";

/** Mirrors the server validators; kept local so the counters can cap input. */
const MAX_TEXT = 160;

/**
 * `/console/ads` — the landing strip's text/link editor and the single banner.
 *
 * Saving an empty text hides the strip; deleting the banner removes the
 * section entirely. The parent keys this component on all four stored values
 * so a reload from `onChanged` refreshes every field and the preview. Like the
 * console's other forms, these stay outside `startTransition` so sileo toasts
 * are not swallowed mid-transition.
 */
export default function ConsoleAds({
  announcement,
  onChanged,
}: {
  announcement: SiteAnnouncementData;
  onChanged: () => void;
}) {
  const [text, setText] = useState(announcement.text);
  const [link, setLink] = useState(announcement.link);
  const [busy, setBusy] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerLink, setBannerLink] = useState(announcement.bannerLink);
  const [bannerBusy, setBannerBusy] = useState(false);
  const bannerKey = announcement.bannerKey;
  const bannerLinkChanged = bannerLink.trim() !== announcement.bannerLink;

  async function commit(nextText: string, nextLink: string) {
    if (busy) return;
    const cleanText = nextText.trim().replace(/\s+/g, " ");
    const cleanLink = nextLink.trim();
    if (cleanText.length > MAX_TEXT) {
      sileo.error({ title: "متن تبلیغاتی بلند است", description: `حداکثر ${toFa(MAX_TEXT)} حرف.` });
      return;
    }
    if (cleanLink.length > MAX_AD_LINK) {
      sileo.error({ title: "لینک تبلیغاتی بلند است", description: `حداکثر ${toFa(MAX_AD_LINK)} حرف.` });
      return;
    }

    setBusy(true);
    try {
      const result = await saveSiteAnnouncement(cleanText, cleanLink);
      if (!result.ok) {
        sileo.error({ title: result.error, description: "دوباره تلاش کنید." });
        return;
      }
      setText(cleanText);
      setLink(cleanLink);
      sileo.success({
        title: cleanText ? "متن تبلیغاتی ذخیره شد" : "متن تبلیغاتی حذف شد",
        description: cleanText
          ? cleanLink
            ? "متن و لینک از بارگذاری بعدی صفحه اصلی نمایش داده می‌شوند."
            : "از بارگذاری بعدی صفحه اصلی، بالای هدر نمایش داده می‌شود."
          : "دیگر نوار تبلیغاتی در صفحه اصلی نمایش داده نمی‌شود.",
      });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function commitBanner() {
    if (bannerBusy || (!bannerFile && !bannerLinkChanged)) return;
    const cleanLink = bannerLink.trim();
    if (cleanLink.length > MAX_AD_LINK) {
      sileo.error({ title: "لینک بنر بلند است", description: `حداکثر ${toFa(MAX_AD_LINK)} حرف.` });
      return;
    }

    const form = new FormData();
    if (bannerFile) form.set("banner", bannerFile);
    form.set("bannerLink", cleanLink);
    setBannerBusy(true);
    try {
      const result = await saveSiteBanner(form);
      if (!result.ok) {
        sileo.error({ title: result.error, description: "دوباره تلاش کنید." });
        return;
      }
      const uploaded = Boolean(bannerFile);
      setBannerFile(null);
      sileo.success({
        title: uploaded
          ? bannerKey
            ? "بنر جایگزین شد"
            : "بنر آپلود شد"
          : "لینک بنر ذخیره شد",
        description: uploaded
          ? bannerKey
            ? "بنر قبلی حذف شد و بنر و لینک جدید در صفحه اصلی نمایش داده می‌شوند."
            : "بنر و لینک از بارگذاری بعدی صفحه اصلی نمایش داده می‌شوند."
          : bannerKey
            ? "لینک ذخیره شد و از بارگذاری بعدی، روی بنر قابل کلیک است."
            : "لینک ذخیره شد؛ هنگام آپلود بنر، همان لینک روی آن قرار می گیرد.",
      });
      onChanged();
    } finally {
      setBannerBusy(false);
    }
  }

  async function removeBanner() {
    if (bannerBusy || !bannerKey) return;
    setBannerBusy(true);
    try {
      const result = await deleteSiteBanner();
      if (!result.ok) {
        sileo.error({ title: result.error, description: "دوباره تلاش کنید." });
        return;
      }
      setBannerFile(null);
      sileo.success({
        title: "بنر حذف شد",
        description: "بخش بنر از صفحه اصلی حذف شد، فایل آن پاک شد و لینک آن نگه داشته شد.",
      });
      onChanged();
    } finally {
      setBannerBusy(false);
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              متن و لینک تبلیغاتی صفحه اصلی
            </h2>
            <p className="mt-1 text-[11px] leading-6 text-slate-400 dark:text-slate-500">
              یک خط کوتاه بالای هدر صفحه اصلی نمایش داده می‌شود؛ با پاک کردن متن، نوار حذف می‌شود.
              لینک اختیاری است و در صورت تنظیم، متن قابل کلیک می‌شود.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            نوار بالای صفحه
          </span>
        </div>

        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void commit(text, link);
          }}
        >
          <div>
            <label
              htmlFor="console-ad-text"
              className="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400"
            >
              متن
            </label>
            <input
              id="console-ad-text"
              type="text"
              maxLength={MAX_TEXT}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="مثلاً: جشنواره تابستانه کوجا آغاز شد"
              className={fieldClass}
            />
            <p className="mt-1 text-left text-[10px] font-bold tabular-nums text-slate-400 dark:text-slate-500">
              {toFa(text.length)} / {toFa(MAX_TEXT)}
            </p>
          </div>

          <div>
            <label
              htmlFor="console-ad-link"
              className="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400"
            >
              لینک (اختیاری)
            </label>
            <input
              id="console-ad-link"
              type="text"
              inputMode="url"
              dir="ltr"
              maxLength={MAX_AD_LINK}
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://example.com/event"
              className={`${fieldClass} text-left`}
            />
            <p className="mt-1 text-[11px] leading-5 text-slate-400 dark:text-slate-500">
              اگر لینکی وارد شود، متن روی نوار به آن لینک متصل می‌شود. آدرس بدون https هم پذیرفته می‌شود.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => void commit("", "")}
              disabled={busy || (!text.trim() && !link.trim())}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 transition-all duration-200 hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-900 dark:hover:text-red-400"
            >
              <X className="h-3.5 w-3.5" />
              پاک کردن
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              ذخیره
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              بنر تبلیغاتی صفحه اصلی
            </h2>
            <p className="mt-1 text-[11px] leading-6 text-slate-400 dark:text-slate-500">
              تصویر یا GIF بین هدر و رویدادهای داغ نمایش داده می‌شود. لینک اختیاری، کل بنر را قابل کلیک
              می‌کند. با حذف بنر، این بخش کاملاً از صفحه اصلی ناپدید می‌شود.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
            ابعاد مورد نیاز: {toFa(SITE_BANNER_WIDTH)} × {toFa(SITE_BANNER_HEIGHT)} پیکسل
          </span>
        </div>

        {bannerKey && (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            <Image
              src={siteBannerUrl(bannerKey)}
              alt="پیشنمایش بنر تبلیغاتی"
              width={SITE_BANNER_WIDTH}
              height={SITE_BANNER_HEIGHT}
              unoptimized
              className="h-auto w-full"
            />
          </div>
        )}

        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void commitBanner();
          }}
        >
          <div>
            <label
              htmlFor="console-ad-banner"
              className="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400"
            >
              فایل بنر {bannerKey ? "(جایگزینی)" : "(آپلود)"}
            </label>
            <input
              id="console-ad-banner"
              name="banner"
              type="file"
              accept={SITE_BANNER_ACCEPT}
              onChange={(event) => {
                const input = event.currentTarget;
                setBannerFile(input.files?.[0] ?? null);
                /* Clear the picker so choosing the same file again still fires. */
                input.value = "";
              }}
              className="w-full text-xs text-slate-600 file:ml-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-slate-700 hover:file:bg-slate-200 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-slate-200 dark:hover:file:bg-slate-700"
            />
            <p className="mt-1 text-[11px] leading-5 text-slate-400 dark:text-slate-500">
              PNG، JPG، WebP یا GIF تا ۱۰ مگابایت. ابعاد باید دقیقاً {toFa(SITE_BANNER_WIDTH)} ×{" "}
              {toFa(SITE_BANNER_HEIGHT)} پیکسل باشد تا بنر روی صفحه کشیده نشود.
            </p>
            {bannerFile && (
              <p className="mt-1 truncate text-[11px] font-bold text-blue-600 dark:text-blue-400" dir="ltr">
                {bannerFile.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="console-ad-banner-link"
              className="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400"
            >
              لینک بنر (اختیاری)
            </label>
            <input
              id="console-ad-banner-link"
              name="bannerLink"
              type="text"
              inputMode="url"
              dir="ltr"
              maxLength={MAX_AD_LINK}
              value={bannerLink}
              onChange={(event) => setBannerLink(event.target.value)}
              placeholder="https://example.com/campaign"
              className={`${fieldClass} text-left`}
            />
            <p className="mt-1 text-[11px] leading-5 text-slate-400 dark:text-slate-500">
              اگر لینکی وارد شود، کل بنر به آن لینک متصل می‌شود و در تب جدید باز می‌شود. آدرس بدون https
              هم پذیرفته می‌شود.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => void removeBanner()}
              disabled={bannerBusy || !bannerKey}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 transition-all duration-200 hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-900 dark:hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              حذف بنر
            </button>
            <button
              type="submit"
              disabled={bannerBusy || (!bannerFile && !bannerLinkChanged)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {bannerBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : bannerFile ? (
                <UploadCloud className="h-3.5 w-3.5" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {bannerFile
                ? bannerKey
                  ? "جایگزینی بنر"
                  : "آپلود بنر"
                : "ذخیره لینک"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
