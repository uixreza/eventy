/**
 * Worn next to any figure or line that no table backs, so a placeholder can
 * never be mistaken for a live number. The content beside it is blurred
 * (`MOCK_CLASS`); this badge is the sharp legend that explains the blur.
 */
export default function MockBadge() {
  return (
    <span
      title="این مورد از دیتابیس خوانده نمی‌شود"
      className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
    >
      داده نمونه
    </span>
  );
}
