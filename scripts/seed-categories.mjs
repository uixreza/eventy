/**
 * Seeds the `Category` table with the union of the 7 static categories
 * (`lib/data.ts`) and the 4 event categories that exist only in the events
 * table — 11 rows. Idempotent: an existing name keeps its icon and visible
 * flag (admin edits win); only missing names are created.
 *
 * Run:  node scripts/seed-categories.mjs
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/** name → icon key from `lib/category-icons.ts`. */
const SEED = [
  // The 7 static categories from `lib/data.ts`.
  { name: "فناوری و AI", icon: "Cpu" },
  { name: "استارتاپ و سرمایه", icon: "Rocket" },
  { name: "هنر، دیزاین و UX", icon: "Palette" },
  { name: "زبان‌های خارجی", icon: "Languages" },
  { name: "بازی و سرگرمی", icon: "Gamepad2" },
  { name: "سلامت و ورزش", icon: "HeartPulse" },
  { name: "کتاب و فرهنگ", icon: "BookOpen" },
  // The 4 categories that only events carry today.
  { name: "کسب‌وکار", icon: "Briefcase" },
  { name: "هنر و دیزاین", icon: "Palette" },
  { name: "وبینارهای آنلاین", icon: "Camera" },
  { name: "دورهمی‌های دوستانه", icon: "Utensils" },
];

for (const row of SEED) {
  await prisma.category.upsert({
    where: { name: row.name },
    update: {}, // an admin's icon/visible edits survive a re-seed
    create: row,
  });
}

const rows = await prisma.category.findMany({ orderBy: { createdAt: "asc" } });
console.table(
  rows.map((r) => ({ name: r.name, icon: r.icon, visible: r.visible })),
);
console.log(`${rows.length} categories in the table.`);
await prisma.$disconnect();
