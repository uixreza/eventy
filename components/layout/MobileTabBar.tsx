"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Compass, Home, Ticket, User, type LucideIcon } from "lucide-react";

type Tab = {
  label: string;
  /** Every tab has its own real route — no duplicate destinations. */
  href: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
};

const tabs: Tab[] = [
  {
    label: "صفحه اصلی",
    href: "/",
    icon: Home,
    isActive: (pathname) => pathname === "/",
  },
  {
    label: "رویدادها",
    href: "/events",
    icon: Compass,
    isActive: (pathname) => pathname === "/events" || pathname.startsWith("/events/"),
  },
  {
    label: "رویدادهای من",
    href: "/dashboard/events",
    icon: Ticket,
    isActive: (pathname) =>
      pathname === "/dashboard/events" || pathname.startsWith("/dashboard/events/"),
  },
  {
    label: "پروفایل",
    href: "/dashboard/settings",
    icon: User,
    isActive: (pathname) =>
      pathname.startsWith("/dashboard") && !pathname.startsWith("/dashboard/events"),
  },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="ناوبری اصلی"
      className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 lg:hidden"
    >
      {tabs.map((tab) => {
        const active = tab.isActive(pathname);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
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
