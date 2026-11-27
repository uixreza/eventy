import { Quote, Sparkles, Star } from "lucide-react";
import { testimonials } from "@/lib/data";

/**
 * The community quotes at the end of the landing page.
 *
 * Bento layout: the first testimonial is a tall featured card with its
 * own gradient and an oversized quote glyph; the rest stack beside it in
 * light cards. The copy lives in `lib/data.ts` and talks about events,
 * tickets and organizing — nothing else.
 */
export default function Testimonials() {
  const [featured, ...rest] = testimonials;

  return (
    <section className="relative overflow-hidden py-12 sm:py-14">
      {/* Violet band — transparent at both edges so it blends into the
          neighboring sections instead of forming a hard color seam. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/10 to-transparent"
      />
      {/* Faint dot texture, faded out at the edges by the mask */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(124,58,237,0.16)_1px,transparent_1px)] bg-[size:26px_26px] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
      />
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute start-[8%] top-[14%] h-64 w-64 rounded-full bg-violet-400/25 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Heading ─────────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-bold text-violet-700 ring-1 ring-violet-100 backdrop-blur dark:bg-slate-900/70 dark:text-violet-300 dark:ring-slate-800">
            <Sparkles className="h-3.5 w-3.5" />
            تجربه واقعی کاربران
          </span>
          <h2 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-2xl">
            جامعه Kooja چه می‌گوید؟
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-slate-500 dark:text-slate-400">
            نظر برگزارکنندگان و شرکت‌کنندگانی که تجربه واقعی Kooja را داشته‌اند.
          </p>
        </div>

        {/* ── Bento: featured quote + stacked cards ───────────── */}
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Featured — its own gradient, stars and oversized glyph */}
          <figure className="relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 text-white shadow-lg shadow-blue-900/20 sm:p-7 lg:col-span-5 lg:row-span-2">
            <Quote
              aria-hidden="true"
              className="absolute -end-4 -top-4 h-28 w-28 text-white/10"
              strokeWidth={1.5}
            />
            <div className="relative flex flex-1 flex-col">
              <div className="flex gap-0.5 text-amber-300" aria-label="۵ از ۵ امتیاز">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>

              <blockquote className="mt-4 flex-1 text-base font-medium leading-9 sm:text-lg">
                «{featured.quote}»
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-white/15 pt-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white ring-2 ring-white/30">
                  {featured.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{featured.name}</p>
                  <p className="truncate text-xs text-blue-100">{featured.role}</p>
                </div>
              </figcaption>
            </div>
          </figure>

          {/* The rest — light cards beside the featured one */}
          {rest.map((t) => (
            <figure
              key={t.name}
              className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md lg:col-span-7 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
                  <Quote className="h-4 w-4" />
                </span>
                <div className="flex gap-0.5 text-amber-400" aria-label="۵ از ۵ امتیاز">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>

              <blockquote className="mt-4 flex-1 text-sm leading-8 text-slate-600 dark:text-slate-300">
                «{t.quote}»
              </blockquote>

              <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${t.tint}`}
                >
                  {t.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                    {t.name}
                  </p>
                  <p className="truncate text-xs text-slate-400 dark:text-slate-500">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
