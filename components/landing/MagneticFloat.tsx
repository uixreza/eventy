"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** How close (px beyond the element's edge) the cursor must get to attract. */
  radius?: number;
  /** Maximum pull in px — keeps the movement to a subtle drift. */
  strength?: number;
  /** Settle duration in ms — higher = slower follow with more lag. */
  duration?: number;
};

/**
 * Magnetic wrapper: while the cursor is near, the child drifts a few pixels
 * toward it (trailing via a CSS transition for a "sticky" feel), then
 * eases back to rest once the cursor leaves the radius.
 *
 * The listener is rAF-throttled and skipped entirely for coarse pointers
 * (touch) and `prefers-reduced-motion` users.
 */
export default function MagneticFloat({
  children,
  className,
  radius = 96,
  strength = 14,
  duration = 700,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let frame = 0;
    const onMove = (event: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        // Distance from the cursor to the nearest point on the element.
        const nearX = Math.min(Math.max(event.clientX, rect.left), rect.right);
        const nearY = Math.min(Math.max(event.clientY, rect.top), rect.bottom);
        const gap = Math.hypot(event.clientX - nearX, event.clientY - nearY);

        if (gap >= radius) {
          setOffset((prev) => (prev.x === 0 && prev.y === 0 ? prev : { x: 0, y: 0 }));
          return;
        }

        // Direction from the element's center toward the cursor, scaled by
        // proximity: strongest at touch distance, fading out to the radius.
        const dirX = event.clientX - (rect.left + rect.width / 2);
        const dirY = event.clientY - (rect.top + rect.height / 2);
        const len = Math.hypot(dirX, dirY) || 1;
        const pull = strength * (1 - gap / radius);
        const next = { x: (dirX / len) * pull, y: (dirY / len) * pull };

        setOffset((prev) =>
          Math.abs(prev.x - next.x) < 0.05 && Math.abs(prev.y - next.y) < 0.05
            ? prev
            : next,
        );
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [radius, strength]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
    >
      {children}
    </div>
  );
}
