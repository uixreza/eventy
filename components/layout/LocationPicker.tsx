"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, MapPin, Search } from "lucide-react";
import { provinces } from "@/lib/iran-locations";
import type { LocationValue } from "@/components/layout/LocationProvider";

/**
 * The location picker: province first, city second.
 *
 * Picking a province opens its cities; the value is only complete once a
 * city is chosen. The same component serves the header (as a compact chip)
 * and the event form (as a field), so there is one behaviour to learn.
 */

type LocationPickerProps = {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  /** `chip` is the compact header trigger, `field` the form control. */
  variant?: "chip" | "field";
  /** Shown when nothing is picked yet (the field variant). */
  placeholder?: string;
  className?: string;
  /** When true the picker shows its current value but cannot be changed. */
  disabled?: boolean;
  /** Fired when a disabled picker is clicked — the parent can show a prompt. */
  onDisabledClick?: () => void;
};

export default function LocationPicker({
  value,
  onChange,
  variant = "field",
  placeholder = "استان و شهر برگزاری را انتخاب کنید",
  className = "",
  disabled = false,
  onDisabledClick,
}: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [province, setProvince] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  /* Set once the panel opens: where it sits (relative to the trigger's
     container) and how wide it is, so it never leaves the viewport. */
  const [placement, setPlacement] = useState<{ left: number; width: number } | null>(null);

  /* Close on outside click or Escape. */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  /* Keep the panel inside the viewport. It opens aligned with the trigger's
     inline-end edge (the left edge in RTL) and grows toward the inline-start
     side, so on a narrow screen — or when the trigger sits near the opposite
     edge — the naive position would push it off-screen. Measure both boxes
     and clamp the offset; the width is capped to the space between margins. */
  useLayoutEffect(() => {
    if (!open) return;

    function place() {
      const trigger = triggerRef.current;
      const container = containerRef.current;
      if (!trigger || !container) return;

      const triggerRect = trigger.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const viewport = window.innerWidth;
      const margin = 16;
      const maxWidth = variant === "field" && viewport >= 640 ? 26 * 16 : 22 * 16;
      const width = Math.min(maxWidth, viewport - margin * 2);

      /* Where the panel would sit if it simply followed the trigger. */
      const desired = triggerRect.left - containerRect.left;
      /* The smallest/largest offset that still leaves a margin on both sides. */
      const min = margin - containerRect.left;
      const max = viewport - margin - width - containerRect.left;

      setPlacement({ left: Math.min(Math.max(desired, min), max), width });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, variant]);

  const provinceList = useMemo(() => {
    const q = query.trim();
    if (!q) return provinces;
    return provinces.filter(
      (item) =>
        item.name.includes(q) || item.cities.some((city) => city.includes(q)),
    );
  }, [query]);

  const cities = useMemo(
    () => provinces.find((item) => item.name === province)?.cities ?? [],
    [province],
  );

  function selectCity(city: string) {
    if (!province) return;
    onChange({ province, city });
    setOpen(false);
    setProvince(null);
    setQuery("");
  }

  const chipClasses =
    "flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-all duration-200 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300";

  const fieldClasses =
    "mt-2 flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white py-2.5 ps-3.5 pe-3 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-600";

  const disabledChipClasses =
    "opacity-50 cursor-not-allowed border-slate-300 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500";

  const disabledFieldClasses =
    "opacity-50 cursor-not-allowed border-slate-300 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500";

  const hasValue = Boolean(value.province && value.city);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        ref={triggerRef}
        disabled={disabled}
        aria-disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          variant === "chip"
            ? `انتخاب استان و شهر — مکان فعلی: ${value.city}`
            : "انتخاب استان و شهر برگزاری"
        }
        onClick={() => {
          if (disabled) {
            onDisabledClick?.();
            return;
          }
          setOpen((current) => !current);
        }}
        className={`${
          variant === "chip" ? chipClasses : fieldClasses
        } ${disabled ? (variant === "chip" ? disabledChipClasses : disabledFieldClasses) : ""}`}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <MapPin
            className={`h-3.5 w-3.5 shrink-0 ${
              hasValue ? "text-blue-600 dark:text-blue-400" : "text-slate-400"
            }`}
          />
          <span className="truncate">
            {hasValue ? (
              variant === "chip" ? (
                value.city
              ) : (
                <>
                  {value.city}
                  <span className="ms-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    {value.province}
                  </span>
                </>
              )
            ) : (
              <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
            )}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="انتخاب استان و شهر"
            style={placement ? { left: placement.left, width: placement.width } : undefined}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={`absolute end-0 top-[calc(100%+6px)] z-[60] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/50 ${
              variant === "field" ? "sm:w-[26rem]" : ""
            }`}
          >
            {province ? (
              /* ── Second level: the cities of the chosen province ── */
              <div className="flex max-h-72 flex-col">
                <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setProvince(null);
                      setQuery("");
                    }}
                    className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-300"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    همه استان‌ها
                  </button>
                  <span className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                    {province}
                  </span>
                </div>

                <div className="no-scrollbar flex-1 overflow-y-auto p-1.5">
                  {cities.length === 0 ? (
                    <p className="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                      شهری برای این استان ثبت نشده است.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      {cities.map((city) => {
                        const selected = city === value.city && province === value.province;
                        return (
                          <button
                            key={city}
                            type="button"
                            onClick={() => selectCity(city)}
                            className={`flex items-center justify-between gap-1.5 rounded-lg px-2.5 py-2 text-start text-xs font-bold transition-colors duration-150 ${
                              selected
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span className="truncate">{city}</span>
                            {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── First level: the provinces ── */
              <div className="flex max-h-80 flex-col">
                <div className="relative border-b border-slate-100 p-2 dark:border-slate-800">
                  <Search className="pointer-events-none absolute start-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="جستجوی استان یا شهر..."
                    aria-label="جستجوی استان یا شهر"
                    className="w-full rounded-lg bg-slate-50 py-2 ps-8 pe-3 text-xs font-medium text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-blue-300 dark:bg-slate-800/70 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                  />
                </div>

                <div className="no-scrollbar flex-1 overflow-y-auto p-1.5">
                  {provinceList.length === 0 ? (
                    <p className="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                      استانی با این نام پیدا نشد.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      {provinceList.map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setProvince(item.name)}
                          className="flex items-center justify-between gap-1.5 rounded-lg px-2.5 py-2 text-start text-xs font-bold text-slate-600 transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-950 dark:hover:text-blue-300"
                        >
                          <span className="truncate">{item.name}</span>
                          <ChevronDown className="h-3.5 w-3.5 shrink-0 -rotate-90 text-slate-300 dark:text-slate-600" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
