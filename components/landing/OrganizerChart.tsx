"use client";

import { useId, useMemo, useState } from "react";
import { TrendingUp, Users } from "lucide-react";
import { toFa } from "@/lib/utils";

/**
 * The live ticket-sales panel of the «ویژه برگزارکنندگان» block.
 *
 * A real chart rather than a row of bars: an SVG area curve with a gradient
 * fill, a soft glow, grid lines and a highlighted last point — plus hover
 * interaction, so the value under the cursor is readable. The range tabs
 * swap the series, and the headline number always matches the range.
 */

type Point = { label: string; value: number };
type RangeKey = "7" | "30" | "90";

const RANGES: { key: RangeKey; label: string; growth: string }[] = [
  { key: "7", label: "۷ روز", growth: "۳۲٪" },
  { key: "30", label: "۳۰ روز", growth: "۱۸٪" },
  { key: "90", label: "۹۰ روز", growth: "۹٪" },
];

const SERIES: Record<RangeKey, Point[]> = {
  "7": [
    { label: "شنبه", value: 18 },
    { label: "یکشنبه", value: 22 },
    { label: "دوشنبه", value: 19 },
    { label: "سه‌شنبه", value: 31 },
    { label: "چهارشنبه", value: 27 },
    { label: "پنجشنبه", value: 34 },
    { label: "جمعه", value: 36 },
  ],
  "30": [
    { label: "هفته ۱", value: 21 },
    { label: "هفته ۲", value: 28 },
    { label: "هفته ۳", value: 24 },
    { label: "هفته ۴", value: 35 },
    { label: "هفته ۵", value: 31 },
    { label: "هفته ۶", value: 44 },
    { label: "هفته ۷", value: 39 },
    { label: "هفته ۸", value: 52 },
    { label: "هفته ۹", value: 47 },
    { label: "هفته ۱۰", value: 61 },
    { label: "هفته ۱۱", value: 55 },
    { label: "هفته ۱۲", value: 72 },
    { label: "هفته ۱۳", value: 68 },
  ],
  "90": [
    { label: "ماه ۱", value: 62 },
    { label: "ماه ۲", value: 74 },
    { label: "ماه ۳", value: 68 },
    { label: "ماه ۴", value: 96 },
    { label: "ماه ۵", value: 88 },
    { label: "ماه ۶", value: 112 },
    { label: "ماه ۷", value: 104 },
    { label: "ماه ۸", value: 131 },
    { label: "ماه ۹", value: 122 },
    { label: "ماه ۱۰", value: 148 },
    { label: "ماه ۱۱", value: 139 },
    { label: "ماه ۱۲", value: 167 },
  ],
};

/** Extra facts that belong to the range, next to the curve. */
const FACTS: Record<RangeKey, { capacity: number; revenue: string; waitlist: number }> = {
  "7": { capacity: 75, revenue: "۲۳.۵M", waitlist: 12 },
  "30": { capacity: 82, revenue: "۹۴.۲M", waitlist: 38 },
  "90": { capacity: 88, revenue: "۲۸۱M", waitlist: 96 },
};

const VIEW_W = 600;
const VIEW_H = 220;
const PAD = { top: 18, right: 14, bottom: 26, left: 14 };

/** A smooth curve through the points (Catmull-Rom → cubic bézier). */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return path;
}

export default function OrganizerChart() {
  const [range, setRange] = useState<RangeKey>("7");
  const [hover, setHover] = useState<number | null>(null);
  const gradientId = useId();

  const points = SERIES[range];
  const facts = FACTS[range];

  const geometry = useMemo(() => {
    const max = Math.max(...points.map((point) => point.value));
    const min = Math.min(...points.map((point) => point.value));
    /* A little headroom so the curve never touches the frame. */
    const top = max + (max - min) * 0.25 + 1;
    const bottom = Math.max(0, min - (max - min) * 0.35);

    const width = VIEW_W - PAD.left - PAD.right;
    const height = VIEW_H - PAD.top - PAD.bottom;
    const step = points.length > 1 ? width / (points.length - 1) : 0;

    const coords = points.map((point, index) => ({
      x: PAD.left + step * index,
      y: PAD.top + height - ((point.value - bottom) / (top - bottom)) * height,
    }));

    const line = smoothPath(coords);
    const area = `${line} L ${coords[coords.length - 1].x} ${VIEW_H - PAD.bottom} L ${coords[0].x} ${VIEW_H - PAD.bottom} Z`;

    return { coords, line, area, bottomY: VIEW_H - PAD.bottom, topY: PAD.top };
  }, [points]);

  const total = points.reduce((sum, point) => sum + point.value, 0);
  const active = hover === null ? null : points[hover];
  const activeCoord = hover === null ? null : geometry.coords[hover];
  const growth = RANGES.find((item) => item.key === range)?.growth ?? "۳۲٪";

  /** Every n-th label, so the axis never gets crowded. */
  const labelEvery = points.length > 10 ? 3 : points.length > 8 ? 2 : 1;

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * VIEW_W;
    const first = geometry.coords[0].x;
    const last = geometry.coords[geometry.coords.length - 1].x;
    const ratio = Math.min(1, Math.max(0, (x - first) / (last - first)));
    setHover(Math.round(ratio * (points.length - 1)));
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
      {/* Headline + range switch */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-400">فروش بلیت زنده</p>
          <p className="mt-1 flex items-baseline gap-2 text-3xl font-extrabold tracking-tight text-white">
            {toFa(total)}
            <span className="text-sm font-bold text-slate-400">بلیت فروخته‌شده</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-400/20">
            <TrendingUp className="h-3.5 w-3.5" />
            {growth} رشد
          </span>
        </div>
      </div>

      {/* Range tabs */}
      <div className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {RANGES.map((item) => {
          const selected = item.key === range;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setRange(item.key);
                setHover(null);
              }}
              aria-pressed={selected}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all duration-200 ${
                selected
                  ? "bg-blue-500/90 text-white shadow-sm"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* The curve */}
      <div className="relative mt-4">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="h-44 w-full touch-none select-none"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label={`نمودار فروش بلیت در ${RANGES.find((item) => item.key === range)?.label}`}
        >
          <defs>
            <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${gradientId}-line`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <filter id={`${gradientId}-glow`} x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Horizontal grid */}
          {[0, 1, 2, 3].map((i) => {
            const y = PAD.top + ((VIEW_H - PAD.top - PAD.bottom) / 3) * i;
            return (
              <line
                key={i}
                x1={PAD.left}
                x2={VIEW_W - PAD.right}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.07)"
                strokeWidth="1"
              />
            );
          })}

          {/* Area + curve */}
          <path d={geometry.area} fill={`url(#${gradientId}-fill)`} />
          <path
            d={geometry.line}
            fill="none"
            stroke={`url(#${gradientId}-line)`}
            strokeWidth="2.5"
            strokeLinecap="round"
            filter={`url(#${gradientId}-glow)`}
          />

          {/* The points */}
          {geometry.coords.map((coord, index) => {
            const isActive = hover === index;
            const isLast = index === geometry.coords.length - 1;
            return (
              <circle
                key={index}
                cx={coord.x}
                cy={coord.y}
                r={isActive ? 5 : isLast ? 4 : 2.5}
                fill={isActive || isLast ? "#ffffff" : "#93c5fd"}
                stroke={isActive || isLast ? "#3b82f6" : "transparent"}
                strokeWidth="2"
              />
            );
          })}

          {/* Hover guide */}
          {activeCoord && (
            <line
              x1={activeCoord.x}
              x2={activeCoord.x}
              y1={geometry.topY}
              y2={geometry.bottomY}
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
          )}

          {/* Baseline */}
          <line
            x1={PAD.left}
            x2={VIEW_W - PAD.right}
            y1={geometry.bottomY}
            y2={geometry.bottomY}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />

          {/* Axis labels */}
          {points.map((point, index) =>
            index % labelEvery === 0 || index === points.length - 1 ? (
              <text
                key={point.label}
                x={geometry.coords[index].x}
                y={VIEW_H - 8}
                textAnchor="middle"
                className="fill-slate-500 text-[10px] font-bold"
              >
                {point.label}
              </text>
            ) : null,
          )}
        </svg>

        {/* Hover tooltip */}
        {active && activeCoord && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-slate-900/95 px-2.5 py-1.5 text-center shadow-xl backdrop-blur"
            style={{
              left: `${(activeCoord.x / VIEW_W) * 100}%`,
              top: `${(activeCoord.y / VIEW_H) * 100}%`,
            }}
          >
            <p className="text-[10px] font-bold text-slate-400">{active.label}</p>
            <p className="text-xs font-extrabold text-white">{toFa(active.value)} بلیت</p>
          </div>
        )}
      </div>

      {/* Facts */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {/* Capacity — a donut that fills up */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <div className="flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="#34d399"
                strokeWidth="3"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray={`${facts.capacity} ${100 - facts.capacity}`}
              />
            </svg>
          </div>
          <p className="mt-1.5 text-sm font-extrabold text-white">{toFa(facts.capacity)}٪</p>
          <p className="mt-0.5 text-[10px] font-medium text-slate-500">ظرفیت تکمیل</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <p className="text-lg font-extrabold text-white">{facts.revenue}</p>
          <p className="mt-1 text-[10px] font-medium text-slate-500">درآمد (تومان)</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <p className="flex items-center justify-center gap-1.5 text-lg font-extrabold text-white">
            <Users className="h-4 w-4 text-blue-400" />
            {toFa(facts.waitlist)}
          </p>
          <p className="mt-1 text-[10px] font-medium text-slate-500">لیست انتظار</p>
        </div>
      </div>
    </div>
  );
}
