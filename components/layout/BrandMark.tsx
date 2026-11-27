export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span dir="ltr" className={`relative inline-block ${className}`}>
      <span className="font-extrabold tracking-tight text-blue-700 dark:text-blue-400">
        K<span className="relative inline-block">oo<svg aria-hidden="true" viewBox="0 0 24 8" preserveAspectRatio="none" className="pointer-events-none absolute bottom-[0.02em] left-0 h-[0.22em] w-full rotate-[8deg]"><path d="M7 2 Q12 7 17 2" fill="none" stroke="currentColor" strokeWidth="5.2" strokeLinecap="round" /></svg></span>ja
      </span>
      <span
        aria-hidden="true"
        className="absolute -top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-orange-500"
      />
    </span>
  );
}
