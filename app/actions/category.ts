"use server";

import { updateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { categoryIconKeys } from "@/lib/category-icons";
import { requireAdminActor } from "@/app/actions/user";

export type CategoryResult = { ok: true } | { ok: false; error: string };

/** Names are trimmed here — the form's own check exists for feedback only. */
function cleanName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/**
 * Creates a category from the console's form: the name (unique) plus the
 * icon key picked in the small grid next to the field. The key is checked
 * against the registry so a stale or forged value can never land in the
 * column; an unknown key would render as a blank tile.
 */
export async function createCategory(input: {
  name: string;
  icon: string;
}): Promise<CategoryResult> {
  const gate = await requireAdminActor();
  if (!gate.ok) return gate;

  const name = cleanName(input.name);
  if (!name || name.length > 60) {
    return { ok: false, error: "نام دسته باید بین ۱ تا ۶۰ حرف باشد." };
  }
  if (!categoryIconKeys.includes(input.icon)) {
    return { ok: false, error: "آیکون انتخاب‌شده معتبر نیست." };
  }

  try {
    await prisma.category.create({ data: { name, icon: input.icon } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: `دسته «${name}» قبلاً ثبت شده است.` };
    }
    return { ok: false, error: "ذخیره دسته ممکن نشد؛ دوباره تلاش کنید." };
  }

  /* The console list and every public grid read this name. */
  updateTag("categories");
  return { ok: true };
}

/**
 * Renames a category. Events keep their own free-text `category`, so the rows
 * that still carry the old title are moved with it — otherwise the curated
 * list would show the new name while the public filter and event count still
 * looked for the old one. Both writes go in one transaction.
 */
export async function renameCategory(
  categoryId: string,
  rawName: string,
): Promise<CategoryResult> {
  const gate = await requireAdminActor();
  if (!gate.ok) return gate;

  const name = cleanName(rawName);
  if (!name || name.length > 60) {
    return { ok: false, error: "نام دسته باید بین ۱ تا ۶۰ حرف باشد." };
  }

  try {
    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { name: true },
    });
    if (!existing) {
      return { ok: false, error: "دسته پیدا نشد." };
    }
    if (existing.name === name) return { ok: true };

    const duplicate = await prisma.category.findFirst({
      where: { name, id: { not: categoryId } },
      select: { id: true },
    });
    if (duplicate) {
      return { ok: false, error: `دسته «${name}» قبلاً ثبت شده است.` };
    }

    await prisma.$transaction([
      prisma.category.update({ where: { id: categoryId }, data: { name } }),
      prisma.event.updateMany({
        where: { category: existing.name },
        data: { category: name },
      }),
    ]);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: `دسته «${name}» قبلاً ثبت شده است.` };
    }
    return { ok: false, error: "تغییر نام دسته ذخیره نشد؛ دوباره تلاش کنید." };
  }

  /* Both the curated grid and the event cards/filters read these names. */
  updateTag("categories");
  updateTag("events");
  return { ok: true };
}

/** Hides a category from the public grids, or brings it back. */
export async function setCategoryVisible(
  categoryId: string,
  visible: boolean,
): Promise<CategoryResult> {
  const gate = await requireAdminActor();
  if (!gate.ok) return gate;

  try {
    await prisma.category.update({
      where: { id: categoryId },
      data: { visible },
    });
  } catch {
    return { ok: false, error: "دسته پیدا نشد یا تغییر وضعیت ذخیره نشد." };
  }

  updateTag("categories");
  return { ok: true };
}

/**
 * Deletes a category. There is no trash: the row is gone for good — but its
 * events are untouched, because `Event.category` is a free string and never
 * pointed here. Only the curated list loses an entry.
 */
export async function deleteCategory(categoryId: string): Promise<CategoryResult> {
  const gate = await requireAdminActor();
  if (!gate.ok) return gate;

  try {
    await prisma.category.delete({ where: { id: categoryId } });
  } catch {
    return { ok: false, error: "دسته پیدا نشد یا حذف ذخیره نشد." };
  }

  updateTag("categories");
  return { ok: true };
}
