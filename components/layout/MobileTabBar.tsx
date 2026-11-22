"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { CalendarSearch, Home, Ticket, User } from "lucide-react";

const tabs = [
  { label: "صفحه اصلی", href: "/", icon: Home },
  { label: "تقویم", href: "/#events", icon: CalendarSearch },
  { label: "رویدادهای من", href: "/dashboard", icon: Ticket },
  { label: "پروفایل", href: "/dashboard", icon: User },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="ناوبری اصلی"
      className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 lg:hidden"
    >
      {tabs.map((tab, i) => {
        const active =
          tab.href === "/" ? pathname === "/" : pathname.startsWith("/dashboard") && i >= 2;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex flex-1 flex-col items-center gap-1 py-1 text-[10px] font-bold transition-colors duration-200 ${
              active
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            }`}
          >
            <Icon className="h-5 w-5" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
