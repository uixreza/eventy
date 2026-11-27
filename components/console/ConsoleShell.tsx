"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useRef } from "react";
import {
  ArrowRightLeft,
  BarChart3,
  Flag,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  PanelTop,
  Settings,
  Tags,
  Users,
} from "lucide-react";
import { sileo } from "sileo";
import type { LucideIcon } from "lucide-react";
import type { ConsoleNavCounts } from "@/lib/console-types";
import NotificationsBadge from "@/components/dashboard/NotificationsBadge";
import { confirmSignOut } from "@/components/ui/ConfirmSignOut";
import { BrandMark } from "@/components/layout/BrandMark";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { useConsoleNavCounts } from "./useConsoleNavCounts";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  countKey?: keyof ConsoleNavCounts;
  /** Read aloud by screen readers next to the number. */
  badgeLabel?: string;
};

const navItems: NavItem[] = [
  { label: "نمای کلی", href: "/console", icon: LayoutDashboard },
  {
    label: "مدیریت رویدادها",
    href: "/console/events",
    icon: Megaphone,
    countKey: "pendingEvents",
    badgeLabel: "رویداد در انتظار تأیید",
  },
  { label: "کاربران", href: "/console/users", icon: Users },
  { label: "دسته‌بندی‌ها", href: "/console/categories", icon: Tags },
  { label: "تبلیغات", href: "/console/ads", icon: PanelTop },
  { label: "گزارش‌ها", href: "/console/reports", icon: BarChart3 },
  {
    label: "گزارش رویدادها",
    href: "/console/event-reports",
    icon: Flag,
    countKey: "eventReports",
    badgeLabel: "گزارش رویداد",
  },
  {
    label: "تیکت",
    href: "/console/tickets",
    icon: LifeBuoy,
    countKey: "openTickets",
    badgeLabel: "تیکت در انتظار پاسخ",
  },
  { label: "تراکنش\u200cها", href: "/console/transactions", icon: ArrowRightLeft },
  { label: "تنظیمات", href: "/console/settings", icon: Settings },
];

type ConsoleShellProps = {
  /** The signed-in admin, resolved on the server by `requireAdmin()`. */
  user: { name: string };
  children: React.ReactNode;
};

export default function ConsoleShell({ user, children }: ConsoleShellProps) {
  const pathname = usePathname();
  const counts = useConsoleNavCounts();
  const initial = user.name.trim().charAt(0) || "م";
  const mainRef = useRef<HTMLElement>(null);

  /* The console is a fixed-height frame whose <main> is the scroll
     container, so the router's window-level scroll-to-top no longer reaches
     the content. Reset it by hand whenever the route changes. */
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  async function handleLogout() {
    const confirmed = await confirmSignOut({
      title: "خروج از کنسول؟",
      question: "آیا می‌خواهید از کنسول مدیریت خارج شوید؟",
    });
    if (!confirmed) return;

    sileo.success({
      title: "از کنسول خارج شدید",
      description: "نشست مدیریتی شما پایان یافت.",
    });
    await signOut({ redirectTo: "/" });
  }

  return (
    /* Full-height frame: the sidebar and topbar stay put and only <main>
       scrolls, so a long page never pushes the chrome off-screen. */
    <div className="flex h-dvh overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-e border-slate-200 bg-slate-900 lg:flex dark:border-slate-800">
        <div className="flex h-16 items-center border-b border-white/10 px-5">
          <Link href="/" className="text-lg">
            <span className="font-extrabold tracking-tight text-white">
              <span className="text-blue-400">Kooja</span>
            </span>
            <span className="ms-2 rounded-md bg-red-500/90 px-1.5 py-0.5 align-middle text-[10px] font-bold text-white">
              کنسول
            </span>
          </Link>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const active =
              item.href === "/console"
                ? pathname === "/console"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="min-w-0 truncate">{item.label}</span>
                {item.countKey && (
                  <NotificationsBadge
                    count={counts[item.countKey]}
                    label={item.badgeLabel}
                    className="ms-auto shrink-0 ring-2 ring-slate-900"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
          >
            <ArrowRightLeft className="h-4 w-4 rotate-180" />
            بازگشت به سایت اصلی
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="text-base lg:hidden">
              <BrandMark />
            </Link>
            <h1 className="min-w-0 truncate text-sm font-bold text-slate-800 dark:text-slate-100 sm:text-base">
              کنسول مدیریت Kooja
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {/* Back to the user-facing panel */}
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all duration-200 hover:border-blue-200 hover:text-blue-600 sm:px-3.5 sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:text-blue-400"
            >
              <ArrowRightLeft className="h-4 w-4" />
              داشبورد کاربری
            </Link>
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              aria-label="خروج از حساب"
              title="خروج"
              className="rounded-full p-2 text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <LogOut className="h-5 w-5" />
            </button>
            <span
              title={user.name}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white dark:bg-blue-950"
            >
              {initial}
            </span>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
          {navItems.map((item) => {
            const active =
              item.href === "/console"
                ? pathname === "/console"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors duration-200 ${
                  active
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 text-slate-600 hover:border-blue-200 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-800"
                }`}
              >
                {item.label}
                {item.countKey && (
                  <NotificationsBadge
                    count={counts[item.countKey]}
                    label={item.badgeLabel}
                    className="shrink-0"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
