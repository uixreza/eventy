"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { signOut } from "next-auth/react";
import {
  ArrowRightLeft,
  Bell,
  Heart,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Settings,
  Ticket,
  X,
} from "lucide-react";
import { sileo } from "sileo";
import { confirmSignOut } from "@/components/ui/ConfirmSignOut";
import NotificationsBadge from "@/components/dashboard/NotificationsBadge";
import { useUnreadNotifications } from "@/components/dashboard/useUnreadNotifications";
import { BrandMark } from "@/components/layout/BrandMark";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LocationPicker from "@/components/layout/LocationPicker";
import { useLocation } from "@/components/layout/LocationProvider";

const navItems = [
  { label: "نمای کلی", href: "/dashboard", icon: LayoutDashboard },
  { label: "رویدادهای من", href: "/dashboard/events", icon: Ticket },
  { label: "تیکت", href: "/dashboard/tickets", icon: LifeBuoy },
  { label: "علاقه‌مندی‌ها", href: "/dashboard/saved", icon: Heart },
  { label: "اعلان‌ها", href: "/dashboard/notifications", icon: Bell },
  { label: "تنظیمات", href: "/dashboard/settings", icon: Settings },
];

/* Small screens surface notifications as the standalone bell beside the
   hamburger (outside the menu), so the menu item is dropped there. */
const mobileMenuItems = navItems.filter(
  (item) => item.href !== "/dashboard/notifications",
);

type DashboardShellProps = {
  /** The signed-in user, resolved on the server by `requireUser()`. */
  user: { name: string; isAdmin: boolean };
  children: React.ReactNode;
};

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const unreadCount = useUnreadNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [tabIndicator, setTabIndicator] = useState<{ left: number; width: number } | null>(
    null,
  );

  /* The central location — same store as the landing header. */
  const { location, setLocation } = useLocation();

  /* First letter of the real name — the session decides what shows here. */
  const initial = user.name.trim().charAt(0) || "ک";

  /* Close the mobile menu on outside click or Escape. */
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!mobileNavRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
  const activeHref = navItems.find((item) => isActive(item.href))?.href;

  /* Single sliding underline for the sm+ tabs: measure the active tab so the
     shared line can slide beneath it. Re-measured on resize and once the web
     fonts settle (tab widths depend on the Persian font). The first pass is
     deferred to a frame so no state is set synchronously in the effect. */
  useEffect(() => {
    const container = tabsRef.current;
    if (!container || !activeHref) return;

    const measure = () => {
      const el = container.querySelector<HTMLElement>(`[href="${activeHref}"]`);
      if (!el) return;
      const cRect = container.getBoundingClientRect();
      const aRect = el.getBoundingClientRect();
      if (aRect.width === 0) return; // row is hidden below `sm`
      setTabIndicator({ left: aRect.left - cRect.left, width: aRect.width });
    };

    const frame = requestAnimationFrame(measure);
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    document.fonts.ready.then(measure).catch(() => undefined);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, [activeHref]);

  const closeMenu = () => setMenuOpen(false);

  async function handleLogout() {
    const confirmed = await confirmSignOut({
      question: "آیا می‌خواهید از حساب خود خارج شوید؟",
    });
    if (!confirmed) return;

    sileo.success({
      title: "از حساب خارج شدید",
      description: "تا ورود دوباره، روز خوبی داشته باشید.",
    });
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas dark:bg-slate-900">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg">
              <BrandMark />
            </Link>
            <span className="hidden rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 sm:inline">
              پنل کاربری
            </span>
            {/* Central location — province first, city second */}
            <LocationPicker variant="chip" value={location} onChange={setLocation} />
          </div>

          <div className="flex items-center gap-2.5">
            {/* Admins hop between the two panels from here */}
            {user.isAdmin && (
              <Link
                href="/console"
                className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-blue-200 hover:text-blue-600 sm:flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:text-blue-400"
              >
                <ArrowRightLeft className="h-4 w-4" />
                کنسول مدیریت
              </Link>
            )}
            <Link
              href="/events"
              className="hidden rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 sm:block"
            >
              کشف رویدادها
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
              className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            >
              {initial}
            </span>
          </div>
        </div>

        {/* Sub-nav — small screens: hamburger (under the brand icon) at the
            start, notifications bell at the opposite end; the menu drops down
            from this exact row. `sm+` keeps the underline tabs below. */}
        <div
          ref={mobileNavRef}
          className="relative flex items-center justify-between border-t border-slate-200 px-4 py-2 sm:hidden dark:border-slate-700"
        >
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="منوی داشبورد"
            aria-expanded={menuOpen}
            aria-controls="dashboard-mobile-menu"
            className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-bold text-slate-700 transition-colors duration-200 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            منوی داشبورد
          </button>

          <Link
            href="/dashboard/notifications"
            aria-label="اعلان‌ها"
            className="relative rounded-full p-2 text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <Bell className="h-5 w-5" />
            <NotificationsBadge
              count={unreadCount}
              className="absolute -end-1 -top-1 ring-2 ring-white dark:ring-slate-900"
            />
          </Link>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                id="dashboard-mobile-menu"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute inset-x-4 top-full z-50 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xl shadow-slate-900/10 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/40"
              >
                <nav aria-label="منوی داشبورد">
                  {mobileMenuItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors duration-200 ${
                          active
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        }`}
                      >
                        <item.icon
                          className={`h-4 w-4 shrink-0 ${
                            active
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                {/* Admins hop to the console from the mobile menu too */}
                {user.isAdmin && (
                  <Link
                    href="/console"
                    onClick={closeMenu}
                    className="mt-1 flex items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 transition-colors duration-200 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:text-blue-400"
                  >
                    <ArrowRightLeft className="h-4 w-4 shrink-0" />
                    رفتن به کنسول مدیریت
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sub-nav — sm+: underline tabs */}
        <nav
          aria-label="منوی داشبورد"
          className="hidden border-t border-slate-200 sm:block dark:border-slate-700"
        >
          <div
            ref={tabsRef}
            className="relative mx-auto flex max-w-7xl gap-1 px-4 sm:px-6"
          >
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative shrink-0 border-b-2 border-transparent px-3.5 py-3 text-xs font-bold transition-colors duration-200 sm:text-sm ${
                    active
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                  }`}
                >
                  {item.label}
                  {item.href === "/dashboard/notifications" && (
                    <NotificationsBadge
                      count={unreadCount}
                      className="absolute -end-1.5 -top-1 ring-2 ring-white dark:ring-slate-900"
                    />
                  )}
                </Link>
              );
            })}

            {/* One shared line that slides under the active tab */}
            {tabIndicator && (
              <motion.div
                aria-hidden="true"
                initial={false}
                animate={{ x: tabIndicator.left, width: tabIndicator.width }}
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
                className="pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400"
              />
            )}
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-slate-400 dark:text-slate-500 sm:flex-row sm:px-6">
          <p>© ۱۴۰۴ Kooja — تمامی حقوق محفوظ است.</p>
          <Link href="/" className="flex items-center gap-1.5 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
            <ArrowRightLeft className="h-3.5 w-3.5 rotate-180" />
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </footer>
    </div>
  );
}
