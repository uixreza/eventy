import { BrandMark } from "@/components/layout/BrandMark";

type PageLoaderProps = {
  /**
   * `full` fills the viewport — used by the root loading boundary, where the
   * loader replaces the entire page (marketing ↔ dashboard ↔ console).
   * Without it the loader fills just its content area, keeping the shared
   * topbar/footer of a layout visible while the segment streams in.
   */
  full?: boolean;
};

/**
 * Branded fallback rendered by `loading.tsx` boundaries while a route
 * segment streams in. Server-component only — no client JS.
 */
export default function PageLoader({ full = false }: PageLoaderProps) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-5 px-5 text-center ${
        full ? "min-h-dvh" : "min-h-[50vh]"
      }`}
    >
      <span className="sr-only">در حال بارگذاری…</span>
      <BrandMark className="text-2xl" />
      <span className="flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="loader-dot h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
      <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
        در حال بارگذاری…
      </p>
    </div>
  );
}
