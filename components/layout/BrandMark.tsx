export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="font-extrabold tracking-tight text-blue-700 dark:text-blue-400">رویدادشو</span>
      <span
        aria-hidden="true"
        className="absolute -top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-orange-500"
      />
    </span>
  );
}
