"use client";

import { useEffect, useId, useLayoutEffect, useRef } from "react";

/**
 * One rolling wheel column — scroll with the mouse wheel or a finger, drag
 * with the mouse, or focus and use the arrow keys; the row sitting inside the
 * highlight band is the selection. Extracted from `ShamsiWheelDatePicker` so
 * any picker (birthday, event date, clock) can compose the same control.
 *
 * The parent provides the shared highlight band behind the wheels and gives
 * its wheel row exactly `WHEEL_HEIGHT`, which is also what every scroll
 * calculation is built on.
 */

/** Row height in px — every scroll calculation is a multiple of this. */
const ITEM_H = 40;
/** Rows visible at once: the selected one plus one of context each side. */
const ROWS = 3;
/** Total height of a wheel column — the parent's wheel row must match. */
export const WHEEL_HEIGHT = ITEM_H * ROWS;
/** Half of the empty space above/below the first/last row (centers them). */
const PAD = (WHEEL_HEIGHT - ITEM_H) / 2;
/** Pause after the last scroll event before snapping to the nearest row. */
const SETTLE_MS = 110;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export type WheelItem = { value: number; text: string };

type WheelProps = {
  /** Accessible name — any visible caption sits outside. */
  label: string;
  items: WheelItem[];
  /** The selected item's `value` (not its index — lists can shrink). */
  selected: number;
  onSelect: (value: number) => void;
};

export function Wheel({ label, items, selected, onSelect }: WheelProps) {
  const id = useId();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRef = useRef(true);
  const dragRef = useRef<{ pointerId: number; startY: number; startTop: number } | null>(
    null,
  );

  const index = Math.max(
    0,
    items.findIndex((item) => item.value === selected),
  );

  /* Land on the selected row whenever the list or the selection changes
     (mount, items change, clamp). The first positioning jumps so the
     wheel never animates into view; later ones glide. */
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const target = index * ITEM_H;
    if (Math.abs(el.scrollTop - target) > 1) {
      el.scrollTo({ top: target, behavior: firstRef.current ? "auto" : "smooth" });
    }
    firstRef.current = false;
  }, [index, items.length]);

  useEffect(
    () => () => {
      if (settleRef.current) clearTimeout(settleRef.current);
    },
    [],
  );

  const snapTo = (target: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const top = target * ITEM_H;
    if (Math.abs(el.scrollTop - top) > 1) {
      el.scrollTo({ top, behavior: "smooth" });
    }
  };

  /* After scrolling stops, pick the row under the highlight band and snap to
     its center. Selection only fires when the row actually changed, so the
     snap-back after `onSelect` can never loop. */
  const handleScroll = () => {
    if (settleRef.current) clearTimeout(settleRef.current);
    settleRef.current = setTimeout(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const target = clamp(Math.round(el.scrollTop / ITEM_H), 0, items.length - 1);
      const item = items[target];
      if (!item) return;
      if (item.value !== selected) onSelect(item.value);
      else snapTo(target);
    }, SETTLE_MS);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    let next: number;
    switch (event.key) {
      case "ArrowDown":
        next = index + 1;
        break;
      case "ArrowUp":
        next = index - 1;
        break;
      case "PageDown":
        next = index + 5;
        break;
      case "PageUp":
        next = index - 5;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = items.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const item = items[clamp(next, 0, items.length - 1)];
    if (item && item.value !== selected) onSelect(item.value);
  };

  /* Mouse drag, desktop only — touch already scrolls natively. The trailing
     scroll event goes through the same settle-and-snap path. */
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const el = scrollerRef.current;
    if (!el) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startTop: el.scrollTop,
    };
    el.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const el = scrollerRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !el) return;
    el.scrollTop = drag.startTop - (event.clientY - drag.startY);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
  };

  return (
    <div
      ref={scrollerRef}
      role="listbox"
      aria-label={label}
      aria-activedescendant={`${id}-${selected}`}
      tabIndex={0}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="no-scrollbar relative h-full min-w-0 flex-1 cursor-grab overflow-y-scroll rounded-lg overscroll-contain select-none outline-none [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-blue-400/70 dark:focus-visible:ring-blue-500/70"
    >
      <div aria-hidden="true" style={{ height: PAD }} />
      {items.map((item, i) => {
        const distance = Math.abs(i - index);
        return (
          <div
            key={item.value}
            id={`${id}-${item.value}`}
            role="option"
            aria-selected={item.value === selected}
            style={{ height: ITEM_H }}
            className={`flex items-center justify-center whitespace-nowrap transition-colors ${
              distance === 0
                ? "text-sm font-extrabold text-blue-700 dark:text-blue-300"
                : distance === 1
                  ? "text-sm font-semibold text-slate-500 dark:text-slate-400"
                  : "text-sm font-medium text-slate-300 dark:text-slate-600"
            }`}
          >
            {item.text}
          </div>
        );
      })}
      <div aria-hidden="true" style={{ height: PAD }} />
    </div>
  );
}
