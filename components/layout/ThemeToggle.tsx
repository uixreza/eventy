"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

const DEFAULT_CLASSES =
  "rounded-full p-2 text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white";

/* Hydration-safe "is mounted" signal: server renders false, client true. */
const emptySubscribe = () => () => {};
const getMounted = () => true;
const getServerMounted = () => false;

/** How long `.theme-transition` stays on <html> while the palette fades. */
const TRANSITION_MS = 400;
let transitionTimer: number | undefined;

/**
 * next-themes applies `html.dark` instantly. Add a short-lived class that
 * (see globals.css) animates color/background/border changes so the switch
 * fades instead of snapping, then remove it so everyday hover transitions
 * keep their own durations afterwards.
 */
function animateThemeSwitch() {
  const root = document.documentElement;
  root.classList.add("theme-transition");
  if (transitionTimer) window.clearTimeout(transitionTimer);
  transitionTimer = window.setTimeout(() => {
    root.classList.remove("theme-transition");
  }, TRANSITION_MS);
}

/** Sun/Moon button that flips between light and dark (persisted by next-themes). */
export default function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, getMounted, getServerMounted);

  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={dark ? "تغییر به حالت روشن" : "تغییر به حالت تاریک"}
      title={dark ? "حالت روشن" : "حالت تاریک"}
      onClick={() => {
        animateThemeSwitch();
        setTheme(dark ? "light" : "dark");
      }}
      className={className ?? DEFAULT_CLASSES}
    >
      {mounted ? (
        dark ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )
      ) : (
        /* Reserve the icon box until hydration to avoid a mismatch flash. */
        <span aria-hidden="true" className="block h-5 w-5" />
      )}
    </button>
  );
}
