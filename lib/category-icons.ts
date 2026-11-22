/**
 * The icon picker of `/console/categories`: a fixed registry of glyphs a
 * category can wear, keyed by the string stored in `Category.icon`.
 *
 * The database never holds a component — only a key from this table — so a
 * row stays serializable and the client resolves it here. An unknown key
 * (a row written before an icon existed, say) falls back to the generic
 * `Tag`, so a category never renders as a blank tile. The same keys are
 * validated on write by `app/actions/category.ts`.
 */

import {
  BookOpen,
  Briefcase,
  Camera,
  Cpu,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  Landmark,
  Languages,
  LayoutGrid,
  Leaf,
  Music,
  Palette,
  Rocket,
  Shapes,
  Tag,
  Utensils,
  type LucideIcon,
} from "lucide-react";

export type CategoryIconMeta = {
  icon: LucideIcon;
  /** Badge background/text, dark mode included — same style as `lib/data.ts`. */
  tint: string;
  /** Persian label shown under the glyph in the picker. */
  label: string;
};

/** The generic fallback — also the default written by the schema. */
export const FALLBACK_ICON = "Tag";

export const categoryIcons: Record<string, CategoryIconMeta> = {
  Tag: {
    icon: Tag,
    tint: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    label: "برچسب",
  },
  Cpu: {
    icon: Cpu,
    tint: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
    label: "فناوری",
  },
  Rocket: {
    icon: Rocket,
    tint: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
    label: "استارتاپ",
  },
  Palette: {
    icon: Palette,
    tint: "bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-300",
    label: "هنر و دیزاین",
  },
  Languages: {
    icon: Languages,
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    label: "زبان",
  },
  Gamepad2: {
    icon: Gamepad2,
    tint: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    label: "بازی",
  },
  HeartPulse: {
    icon: HeartPulse,
    tint: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
    label: "سلامت",
  },
  BookOpen: {
    icon: BookOpen,
    tint: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-300",
    label: "کتاب",
  },
  Briefcase: {
    icon: Briefcase,
    tint: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    label: "کسب‌وکار",
  },
  GraduationCap: {
    icon: GraduationCap,
    tint: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300",
    label: "آموزش",
  },
  Music: {
    icon: Music,
    tint: "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950 dark:text-fuchsia-300",
    label: "موسیقی",
  },
  Utensils: {
    icon: Utensils,
    tint: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300",
    label: "خوراک",
  },
  Camera: {
    icon: Camera,
    tint: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-300",
    label: "عکاسی",
  },
  Landmark: {
    icon: Landmark,
    tint: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
    label: "فرهنگ",
  },
  Leaf: {
    icon: Leaf,
    tint: "bg-lime-50 text-lime-600 dark:bg-lime-950 dark:text-lime-300",
    label: "طبیعت",
  },
  LayoutGrid: {
    icon: LayoutGrid,
    tint: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    label: "عمومی",
  },
  Shapes: {
    icon: Shapes,
    tint: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300",
    label: "چندمنظوره",
  },
};

/** The 16 keys the picker offers, in display order. */
export const categoryIconKeys: string[] = Object.keys(categoryIcons);

/** Resolve a stored key to its meta — unknown keys degrade to `Tag`. */
export function categoryIcon(key: string): CategoryIconMeta {
  return categoryIcons[key] ?? categoryIcons[FALLBACK_ICON];
}
