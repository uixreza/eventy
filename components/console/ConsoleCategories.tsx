"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { sileo } from "sileo";
import {
  createCategory,
  deleteCategory,
  renameCategory,
  setCategoryVisible,
} from "@/app/actions/category";
import { confirm } from "@/components/ui/confirm";
import { categoryIcon, categoryIconKeys, FALLBACK_ICON } from "@/lib/category-icons";
import type { ConsoleCategory } from "@/lib/category-types";
import { toFa } from "@/lib/utils";

const cardClass =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900";
const headingClass = "text-sm font-bold text-slate-800 dark:text-slate-100";
const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-600";

/**
 * `/console/categories` — the curated category list, read from the database
 * (the loader fetched it) and mutated through server actions that re-check
 * the admin session. The add form stacks the name field over a small icon
 * picker: a grid of registry glyphs, stored as the key in `Category.icon`.
 *
 * Deliberately not wrapped in `startTransition`: toasts (and the delete
 * confirm) are sileo store writes, and a write scheduled while an async
 * transition is open never reaches the Toaster — see `useUserActions`.
 */
export default function ConsoleCategories({
  rows,
  onChanged,
}: {
  rows: ConsoleCategory[];
  onChanged: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState(FALLBACK_ICON);
  /** Which category title is being edited, and its in-progress value. */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  /** The id of the row being mutated (`"new"` = the add form), or null. */
  const [busy, setBusy] = useState<string | null>(null);

  const visibleCount = rows.filter((row) => row.visible).length;
  const totalEvents = rows.reduce((sum, row) => sum + row.eventCount, 0);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const name = newName.trim();
    if (!name) {
      sileo.error({ title: "نام دسته را وارد کنید", description: "این فیلد الزامی است." });
      return;
    }

    setBusy("new");
    try {
      const result = await createCategory({ name, icon: newIcon });
      if (!result.ok) {
        sileo.error({ title: result.error, description: "دوباره تلاش کنید." });
        return;
      }
      setNewName("");
      sileo.success({
        title: `دسته «${name}» ساخته شد`,
        description: "با آیکون انتخاب‌شده در فهرست دسته‌ها ثبت شد.",
      });
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  function startEditing(row: ConsoleCategory) {
    if (busy) return;
    setEditingId(row.id);
    setDraftName(row.name);
  }

  function cancelEditing() {
    setEditingId(null);
    setDraftName("");
  }

  async function saveName(row: ConsoleCategory) {
    if (busy) return;
    const name = draftName.trim().replace(/\s+/g, " ");
    if (!name) {
      sileo.error({ title: "نام دسته را وارد کنید", description: "این فیلد الزامی است." });
      return;
    }
    if (name === row.name) {
      cancelEditing();
      return;
    }

    setBusy(row.id);
    try {
      const result = await renameCategory(row.id, name);
      if (!result.ok) {
        sileo.error({ title: result.error, description: "دوباره تلاش کنید." });
        return;
      }
      sileo.success({
        title: `نام دسته به «${name}» تغییر یافت`,
        description: "عنوان رویدادهای این دسته هم به روز شد.",
      });
      cancelEditing();
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  async function toggleVisibility(row: ConsoleCategory) {
    if (busy) return;
    setBusy(row.id);
    try {
      const result = await setCategoryVisible(row.id, !row.visible);
      if (!result.ok) {
        sileo.error({ title: result.error, description: "دوباره تلاش کنید." });
        return;
      }
      sileo.info({
        title: row.visible
          ? `دسته «${row.name}» پنهان شد`
          : `دسته «${row.name}» نمایان شد`,
        description: "تغییر فوراً در سایت اعمال می‌شود.",
      });
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  async function removeCategory(row: ConsoleCategory) {
    if (busy) return;
    setBusy(row.id);
    try {
      const ok = await confirm({
        title: `حذف «${row.name}»`,
        question:
          "دسته برای همیشه حذف می‌شود؛ رویدادهایش دست‌نخورده می‌مانند و فقط از فهرست دسته‌ها می‌رود. حذف کنم؟",
        yes: "بله، حذف کن",
        no: "انصراف",
      });
      if (!ok) return;

      const result = await deleteCategory(row.id);
      if (!result.ok) {
        sileo.error({ title: result.error, description: "دوباره تلاش کنید." });
        return;
      }
      sileo.success({
        title: `دسته «${row.name}» حذف شد`,
        description: "رویدادهایش دست‌نخورده ماندند.",
      });
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Heading ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl">
          دسته‌بندی‌ها
        </h1>
        <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
          {toFa(visibleCount)} دسته نمایان از {toFa(rows.length)} دسته با مجموع{" "}
          {toFa(totalEvents)} رویداد؛ دسته بسازید، نام‌شان را ویرایش کنید یا نمایش‌شان را
          کنترل کنید.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ── Add form: name + icon picker side by side ─────── */}
        <form onSubmit={handleAdd} className={`${cardClass} h-fit`}>
          <h2 className={headingClass}>دسته جدید</h2>
          {/* Name field */}
          <div className="mt-3">
            <label
              htmlFor="console-new-category"
              className="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400"
            >
              نام دسته‌بندی
            </label>
            <input
              id="console-new-category"
              type="text"
              maxLength={60}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="مثلاً معماری و ساختمان"
              className={fieldClass}
            />
          </div>

          {/* Icon picker — the small section under the name field */}
          <fieldset className="mt-3">
            <legend className="mb-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
              آیکون دسته
            </legend>
            <div className="grid grid-cols-8 gap-1.5">
              {categoryIconKeys.map((key) => {
                const meta = categoryIcon(key);
                const Icon = meta.icon;
                const selected = newIcon === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setNewIcon(key)}
                    aria-label={`انتخاب آیکون ${meta.label}`}
                    aria-pressed={selected}
                    title={meta.label}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150 ${meta.tint} ${
                      selected
                        ? "ring-2 ring-blue-600 ring-offset-1 ring-offset-white dark:ring-offset-slate-900"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={busy !== null}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy === "new" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            افزودن دسته
          </button>
          <p className="mt-3 text-[11px] leading-6 text-slate-400 dark:text-slate-500">
            دسته‌های جدید بلافاصله در فیلترهای سایت و فرم ساخت رویداد ظاهر می‌شوند.
          </p>
        </form>

        {/* ── Category list ─────────────────────────────────── */}
        <div className={`${cardClass} lg:col-span-2`}>
          <div className="flex items-center justify-between">
            <h2 className={headingClass}>فهرست دسته‌ها</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {toFa(visibleCount)} نمایان
            </span>
          </div>
          <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => {
              const meta = categoryIcon(row.icon);
              const Icon = meta.icon;
              const isEditing = editingId === row.id;
              return (
                <li
                  key={row.id}
                  className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-blue-900 dark:hover:bg-slate-800"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.tint}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <input
                        autoFocus
                        type="text"
                        value={draftName}
                        maxLength={60}
                        onChange={(e) => setDraftName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void saveName(row);
                          }
                          if (e.key === "Escape") cancelEditing();
                        }}
                        aria-label={`ویرایش نام ${row.name}`}
                        className="w-full min-w-0 rounded-lg border border-blue-300 bg-white px-2 py-1 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-blue-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    ) : (
                      <>
                        <div className="flex min-w-0 items-center gap-1.5">
                          <p className="truncate text-xs font-bold text-slate-700 dark:text-slate-200">
                            {row.name}
                          </p>
                          {!row.visible && (
                            <span className="shrink-0 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                              پنهان
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                          {toFa(row.eventCount)} رویداد
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void saveName(row)}
                          disabled={busy !== null}
                          aria-label={`ذخیره نام ${row.name}`}
                          title="ذخیره"
                          className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-emerald-400 dark:hover:bg-emerald-950"
                        >
                          {busy === row.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={busy !== null}
                          aria-label="انصراف از ویرایش"
                          title="انصراف"
                          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditing(row)}
                          disabled={busy !== null}
                          aria-label={`تغییر نام ${row.name}`}
                          title="تغییر نام"
                          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleVisibility(row)}
                    disabled={busy !== null}
                    aria-label={row.visible ? `پنهان‌سازی ${row.name}` : `نمایش ${row.name}`}
                    title={row.visible ? "پنهان‌سازی" : "نمایش"}
                    className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                  >
                    {row.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                    <button
                      type="button"
                      onClick={() => removeCategory(row)}
                      disabled={busy !== null}
                      aria-label={`حذف ${row.name}`}
                      title="حذف"
                      className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
            {rows.length === 0 && (
              <li className="col-span-full px-3 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                هیچ دسته‌ای ثبت نشده است؛ از فرم کنار، اولین دسته را بسازید.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
