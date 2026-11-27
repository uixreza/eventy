"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { eventImageUrl } from "@/lib/event-images";
import { toFa } from "@/lib/utils";

/**
 * A slideshow for the photos uploaded to an event.
 *
 * The public event detail uses the default portrait orientation: slides are
 * stacked in a column and revealed by translating the track upward, keeping
 * the narrow left column's vertical rhythm. The admin review dialog asks for
 * `horizontal`, which lays the same photos out in a row with left/right
 * controls and a strip of dots underneath. Both modes advance on their own
 * and pause while the pointer or keyboard focus is inside.
 */
export default function EventImageSlideshow({
  images,
  title,
  orientation = "vertical",
}: {
  images: string[];
  title: string;
  orientation?: "vertical" | "horizontal";
}) {
  const horizontal = orientation === "horizontal";
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = images.length;

  /* Advance on its own, but never while someone is reading or using it. */
  useEffect(() => {
    if (total < 2 || paused) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % total), 5000);
    return () => window.clearInterval(timer);
  }, [total, paused]);

  /* Guard against a caller passing an empty list: nothing to show. */
  if (total === 0) return null;

  const current = Math.min(index, total - 1);
  const go = (step: number) => setIndex((value) => (value + step + total) % total);
  const controlClass =
    "rounded-full bg-white/90 p-1.5 text-slate-600 shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-blue-600 dark:bg-slate-900/85 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-300";

  return (
    <section
      aria-label="تصاویر رویداد"
      aria-roledescription="اسلایدشو"
      data-orientation={orientation}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <h2 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
          تصاویر رویداد
        </h2>
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500" aria-live="polite">
          {toFa(current + 1)} / {toFa(total)}
        </p>
      </div>

      <div
        role="group"
        aria-label={`تصویر ${toFa(current + 1)} از ${toFa(total)}`}
        tabIndex={0}
        onKeyDown={(event) => {
          const previous = horizontal ? "ArrowRight" : "ArrowUp";
          const next = horizontal ? "ArrowLeft" : "ArrowDown";
          if (event.key === previous) {
            event.preventDefault();
            go(-1);
          } else if (event.key === next) {
            event.preventDefault();
            go(1);
          }
        }}
        className={`relative overflow-hidden bg-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:bg-slate-800 ${
          horizontal ? "aspect-[16/9]" : "aspect-[4/5]"
        }`}
      >
        {/* One track only: each slide fills the viewport. This app is RTL,
            where `row` runs right-to-left; reversing it keeps -X moving to
            the next photo instead of sliding every slide off screen. */}
        <div
          className={`flex h-full transition-transform duration-500 ease-out motion-reduce:transition-none ${
            horizontal ? "flex-row-reverse" : "flex-col"
          }`}
          style={{
            transform: horizontal
              ? `translateX(-${current * 100}%)`
              : `translateY(-${current * 100}%)`,
          }}
        >
          {images.map((imageKey, slide) => (
            <div key={`${imageKey}-${slide}`} className="relative h-full w-full shrink-0">
              <Image
                src={eventImageUrl(imageKey)}
                alt={`تصویر ${toFa(slide + 1)} از ${title}`}
                fill
                unoptimized
                sizes={
                  horizontal
                    ? "(max-width: 768px) 100vw, 704px"
                    : "(max-width: 1024px) 100vw, 320px"
                }
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {total > 1 && (
          <>
            <div
              className={`absolute z-10 flex gap-1.5 ${
                horizontal
                  ? "start-2 top-1/2 -translate-y-1/2 flex-row"
                  : "start-2 top-1/2 -translate-y-1/2 flex-col"
              }`}
            >
              <button
                type="button"
                aria-label="تصویر قبلی"
                onClick={() => go(-1)}
                className={controlClass}
              >
                {horizontal ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                aria-label="تصویر بعدی"
                onClick={() => go(1)}
                className={controlClass}
              >
                {horizontal ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Dots follow the movement axis: a strip below, or a side rail. */}
            <div
              className={`absolute z-10 flex gap-1.5 ${
                horizontal
                  ? "bottom-2 left-1/2 -translate-x-1/2 flex-row"
                  : "end-2 top-1/2 -translate-y-1/2 flex-col items-center"
              }`}
            >
              {images.map((imageKey, slide) => (
                <button
                  key={`dot-${imageKey}-${slide}`}
                  type="button"
                  aria-label={`نمایش تصویر ${toFa(slide + 1)}`}
                  aria-current={slide === current}
                  onClick={() => setIndex(slide)}
                  className={`rounded-full transition-all duration-200 ${
                    slide === current
                      ? horizontal
                        ? "h-1.5 w-5 bg-white shadow ring-1 ring-slate-300/70"
                        : "h-4 w-1.5 bg-white shadow ring-1 ring-slate-300/70"
                      : "h-1.5 w-1.5 bg-white/60 hover:bg-white"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
