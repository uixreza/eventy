"use client";

import { RefreshCw } from "lucide-react";

/**
 * Shown when a client-side data fetch fails; the button runs the same
 * fetch again without leaving the page.
 */
export default function DataFetchError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
        دریافت اطلاعات ممکن نشد.
      </p>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
      >
        <RefreshCw className="h-4 w-4" />
        تلاش دوباره
      </button>
    </div>
  );
}
