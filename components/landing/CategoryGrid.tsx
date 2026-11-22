import { ChevronLeft, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { categoryIcon } from "@/lib/category-icons";
import { getPublicCategories } from "@/lib/categories";

/**
 * The landing page's category grid — the visible rows of the `Category`
 * table, read through the cached `getPublicCategories` (so a hide/show or a
 * new category in the console reaches this section on the next render).
 * The trailing «همه دسته‌ها» tile is static UI, not a database row.
 */
export default async function CategoryGrid() {
  const categories = await getPublicCategories();

  return (
    <section
      id="categories"
      className="relative scroll-mt-28 overflow-hidden py-12 sm:py-14"
    >
      {/* Same background language as the testimonial section: a violet band
          over the canvas, faded dot texture and an ambient glow, so the two
          read as one continuous style down the page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/10 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(124,58,237,0.16)_1px,transparent_1px)] bg-[size:26px_26px] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute start-[8%] top-[14%] h-64 w-64 rounded-full bg-violet-400/25 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
              کاوش رویدادها بر اساس علاقه‌مندی شما
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              از هوش مصنوعی تا کتاب‌خوانی؛ هر حوزه‌ای که دوست داری را دنبال کن.
            </p>
          </div>
          <Link
            href="/#categories"
            className="hidden shrink-0 items-center gap-1 text-sm font-bold text-blue-600 transition-colors duration-200 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 sm:flex"
          >
            همه دسته‌بندی‌ها
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </div>

        {/* DB categories + the static «همه دسته‌ها» tile */}
        <div className="grid grid-cols-4 gap-3 sm:gap-4 lg:grid-cols-8">
          {categories.map((category) => {
            const meta = categoryIcon(category.icon);
            const Icon = meta.icon;
            return (
              <button
                key={category.name}
                type="button"
                className="group flex flex-col items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-100 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900 sm:p-4"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 sm:h-12 sm:w-12 ${meta.tint}`}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
                <span className="text-[11px] font-bold leading-4 text-slate-700 transition-colors duration-200 group-hover:text-blue-700 dark:text-slate-300 dark:group-hover:text-blue-300 sm:text-xs">
                  {category.name}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            className="group flex flex-col items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-100 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900 sm:p-4"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-transform duration-200 group-hover:scale-110 dark:bg-slate-800 dark:text-slate-300 sm:h-12 sm:w-12">
              <LayoutGrid className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            <span className="text-[11px] font-bold leading-4 text-slate-700 transition-colors duration-200 group-hover:text-blue-700 dark:text-slate-300 dark:group-hover:text-blue-300 sm:text-xs">
              همه دسته‌ها
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
