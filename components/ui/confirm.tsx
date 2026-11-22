"use client";

import { useState, type CSSProperties } from "react";
import { sileo, type SileoOptions } from "sileo";

/**
 * A yes/no question as a sileo toast with two pills.
 *
 * sileo has no confirm API — `button` is a single action — so the two choices
 * live in the toast's `description`, which accepts a ReactNode. They carry
 * `data-sileo-button` themselves: that is the attribute sileo's own button
 * uses, and the one it skips when deciding whether to swallow the pointer for
 * a swipe-to-dismiss gesture, so a click reaches them instead.
 *
 * `confirm()` resolves `true` only for «بله». Dismissing the toast, the
 * deadline running out or it being replaced all read as «خیر», and a second
 * call while one is open hands back the very same promise rather than opening
 * a second toast.
 */
const TOAST_ID = "kooja-confirm";
/** How long the question waits for an answer. */
const DEADLINE_MS = 15_000;

/** `id` is read by sileo's toast store but is missing from `SileoOptions`. */
type ConfirmOptions = SileoOptions & { id: string };

export type ConfirmCopy = {
  title: string;
  question: string;
  yes: string;
  no: string;
};

const DEFAULT_COPY: ConfirmCopy = {
  title: "تأیید می‌کنید؟",
  question: "آیا مطمئن هستید؟",
  yes: "بله",
  no: "خیر",
};

/**
 * sileo styles `[data-sileo-button]` from a stylesheet it injects after the
 * app's own, so a class would lose the tie — the pills carry inline styles to
 * keep the upper hand, and the colours are swapped on hover by React instead
 * of by a `:hover` rule that inline styles would beat.
 */
const PILL_BASE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "4.5rem",
  height: "1.75rem",
  padding: "0 1rem",
  margin: 0,
  borderRadius: "9999px",
  fontSize: "0.75rem",
  fontWeight: 700,
  cursor: "pointer",
  textDecoration: "none",
  transition: "background-color 150ms ease",
};

const YES_TONES = { resting: "#dc2626", hovered: "#b91c1c", color: "#fff" };
const NO_TONES = {
  resting: "rgba(255,255,255,0.14)",
  hovered: "rgba(255,255,255,0.26)",
  color: "rgba(255,255,255,0.85)",
};

function Choice({
  label,
  tones,
  onPick,
}: {
  label: string;
  tones: { resting: string; hovered: string; color: string };
  onPick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href="#"
      role="button"
      data-sileo-button
      onClick={(event) => {
        /* Keep the click off `href="#"` and out of the toast's own handlers. */
        event.preventDefault();
        event.stopPropagation();
        onPick();
      }}
      onKeyDown={(event) => {
        /* Anchors activate on Enter only; space is what a button expects. */
        if (event.key !== " ") return;
        event.preventDefault();
        onPick();
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={{
        ...PILL_BASE,
        background: hovered ? tones.hovered : tones.resting,
        color: tones.color,
      }}
    >
      {label}
    </a>
  );
}

function ConfirmBody({ copy, onAnswer }: { copy: ConfirmCopy; onAnswer: (yes: boolean) => void }) {
  return (
    /* `text-align: start` here beats the `left` sileo sets on the wrapper, so
       the question and the pills sit on the right in this RTL app. */
    <span className="block text-start">
      <span className="block font-bold text-white/90">{copy.question}</span>
      <span className="mt-2.5 flex items-center gap-2">
        <Choice label={copy.yes} tones={YES_TONES} onPick={() => onAnswer(true)} />
        <Choice label={copy.no} tones={NO_TONES} onPick={() => onAnswer(false)} />
      </span>
    </span>
  );
}

/** The one question currently on screen, so a double click cannot open two. */
let open: Promise<boolean> | null = null;

export function confirm(copy: Partial<ConfirmCopy> = {}): Promise<boolean> {
  if (open) return open;
  const merged = { ...DEFAULT_COPY, ...copy };

  open = new Promise<boolean>((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const settle = (answer: boolean) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener("pointerover", onPointerOver, true);
      sileo.dismiss(TOAST_ID);
      resolve(answer);
      /* Next click asks again instead of replaying this answer. */
      open = null;
    };

    const arm = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => settle(false), DEADLINE_MS);
    };

    /* Sitting on the toast pushes the deadline back, the way sileo pauses its
       own auto-dismiss on hover — the question must not vanish mid-read. */
    const onPointerOver = (event: Event) => {
      const target = event.target as Element | null;
      if (!target?.closest?.("[data-sileo-toast]")) return;
      arm();
    };

    const options: ConfirmOptions = {
      id: TOAST_ID,
      title: merged.title,
      description: <ConfirmBody copy={merged} onAnswer={settle} />,
      duration: DEADLINE_MS,
      /* Expand straight away and never collapse on a timer: the pills have to
         be there to click, not behind a hover-to-reveal state. */
      autopilot: { expand: 0, collapse: 0 },
    };

    window.addEventListener("pointerover", onPointerOver, true);
    arm();
    sileo.warning(options);
  });

  return open;
}
