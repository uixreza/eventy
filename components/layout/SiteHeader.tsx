"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { ArrowLeft, ChevronDown, Headset, LayoutGrid, Menu, Search, X, Zap } from "lucide-react";
import AddEventButton from "@/components/auth/AddEventButton";
import { sileo } from "sileo";
import type { PublicCategory } from "@/lib/categories";
import { categoryIcon } from "@/lib/category-icons";
import { toFa } from "@/lib/utils";
import LocationPicker from "./LocationPicker";
import { useLocation } from "./LocationProvider";
import ThemeToggle from "./ThemeToggle";
import { BrandMark } from "./BrandMark";

type NavItem = {
  label: string;
  href: string;
  active?: boolean;
  badge?: string;
  caret?: boolean;
};

const navItems: NavItem[] = [
  { label: "کشف رویدادها", href: "/events", active: true },
  { label: "دسته‌بندی‌ها", href: "/#categories", caret: true },
  { label: "قوانین و مقررات", href: "/rules" },
];

const restingShell =
  "bg-white/90 border-slate-200/80 shadow-lg shadow-slate-900/5 dark:bg-slate-900/90 dark:border-slate-700/80 dark:shadow-black/30";
const scrolledShell =
  "bg-white/95 border-slate-300/80 shadow-xl shadow-slate-900/10 dark:bg-slate-900/95 dark:border-slate-600/80 dark:shadow-black/40";

export default function SiteHeader({ categories }: { categories: PublicCategory[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  /* The central location: the header owns the picker, and every event form
     starts from the city chosen here. */
  const { location, setLocation } = useLocation();

  /* Session: the sign-in button becomes the client's name (a "signed-in"
     style, linking to /dashboard) as soon as Auth.js reports a session. */
  const { data: session, status } = useSession();
  const authenticated = status === "authenticated";

  /* The landing-page location picker stays disabled until the user is logged
     in and real data (session resolved) has been retrieved. */
  const [dataRetrieved, setDataRetrieved] = useState(false);
  const [, startTransition] = useTransition();
  const canChangeLocation = authenticated && dataRetrieved;

  /** Prompt the user to log in before they can pick a province/city. */
  function promptLogin() {
    sileo.error({
      title: "ابتدا وارد شوید",
      description: "برای انتخاب استان و شهر برگزاری ابتدا باید وارد حساب خود شوید.",
    });
  }

  useEffect(() => {
    if (authenticated && !dataRetrieved) startTransition(() => setDataRetrieved(true));
  }, [authenticated, dataRetrieved, startTransition]);

  const displayName = session?.user?.name?.trim() || "داشبورد من";
  const initial = Array.from(displayName)[0] ?? "م";

  /* Scroll state: heavier shell once the page moves. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close the mobile panel on outside click or Escape. */
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      /* The auth dialog is portaled to <body>, so a click inside it counts as
         "outside" the header. Closing the mobile menu here would unmount the
         trigger that owns the dialog and make the form vanish mid-typing. */
      if (target instanceof Element && target.closest("[data-auth-modal]")) return;
      if (!headerRef.current?.contains(target)) setMenuOpen(false);
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

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 z-50 mx-auto w-full select-none px-4 transition-[top,max-width] duration-300 ease-out ${
        scrolled ? "top-3 max-w-6xl" : "top-0 max-w-5xl"
      }`}
    >
      {/* ── Floating pill bar ─────────────────────────────────── */}
      <div
        className={`flex h-13 items-center justify-between gap-3 rounded-full border px-3.5 backdrop-blur-xl transition-all duration-300 sm:h-16 sm:px-6 ${
          scrolled ? scrolledShell : restingShell
        }`}
      >
        {/* Brand (RTL start) */}
        <Link
          href="/"
          className="shrink-0 transition-opacity hover:opacity-80"
          aria-label="رویدادشو — صفحه اصلی"
        >
          <BrandMark className="text-lg sm:text-xl" />
        </Link>

        {/* Center navigation (desktop) */}
        <nav className="hidden flex-1 items-center justify-center gap-5 lg:flex xl:gap-6">
          {navItems.map((item) =>
            item.caret ? (
              <div key={item.label} className="group relative">
                <Link
                  href={item.href}
                  className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
                >
                  {item.label}
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform duration-300 group-hover:rotate-180 group-hover:text-blue-600 group-focus-within:rotate-180 dark:text-slate-500" />
                </Link>

                {/* Hover/focus dropdown — glass panel with a header row,
                    tinted icon tiles, and a footer CTA */}
                <div className="invisible absolute left-1/2 top-full z-50 w-80 -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <div className="origin-top -translate-y-1 scale-95 rounded-2xl border border-slate-200/80 bg-white/95 p-2.5 shadow-2xl shadow-slate-900/15 backdrop-blur-xl transition-all duration-200 group-focus-within:translate-y-0 group-focus-within:scale-100 group-hover:translate-y-0 group-hover:scale-100 dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-2.5 pb-2 pt-1">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                        <LayoutGrid className="h-3.5 w-3.5" />
                        دسته‌بندی‌ها
                      </span>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {toFa(categories.length)} دسته
                      </span>
                    </div>

                    {/* Category rows */}
                    <div className="grid grid-cols-2 gap-1">
                      {categories.map((category) => {
                        const meta = categoryIcon(category.icon);
                        const Icon = meta.icon;
                        return (
                          <Link
                            key={category.name}
                            href="/#categories"
                            className="flex items-center gap-2 rounded-xl px-2 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-950 dark:hover:text-blue-300"
                          >
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.tint}`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <span className="truncate">{category.name}</span>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Footer CTA — the old 8th grid cell, promoted */}
                    <div className="mt-1.5 border-t border-slate-100 pt-1.5 dark:border-slate-800">
                      <Link
                        href="/#categories"
                        className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-2.5 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-blue-950 dark:hover:text-blue-300"
                      >
                        <span className="flex items-center gap-2">
                          <LayoutGrid className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                          همه دسته‌ها
                        </span>
                        <ArrowLeft className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-1.5 text-sm transition-colors ${
                  item.active
                    ? "font-semibold text-blue-600 dark:text-blue-400"
                    : "font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
                }`}
              >
                {item.label}
                {item.badge && (
                  <span className="rounded-full border border-blue-200/80 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            ),
          )}
        </nav>

        {/* Actions (RTL end) */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {/* The central location — province first, city second */}
          <LocationPicker
            variant="chip"
            value={location}
            onChange={setLocation}
            className="hidden lg:block"
            disabled={!canChangeLocation}
            onDisabledClick={promptLogin}
          />

          {/* Search trigger → hero omni-search (mobile) */}
          <Link
            href="/#hero-search"
            aria-label="جستجو"
            className="rounded-full p-2 text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
          >
            <Search className="h-5 w-5" />
          </Link>

          {/* Support → the contact page (email, phone and message form) */}
          <Link
            href="/support"
            aria-label="پشتیبانی"
            className="rounded-full p-2 text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <Headset className="h-5 w-5" />
          </Link>

          <ThemeToggle />

          {/* Sign in / register → the client's own name + dashboard link
               (filled "signed-in" style) once a session exists */}
          <AddEventButton
            authenticated={authenticated}
            className={
              authenticated
                ? "hidden max-w-40 items-center gap-2 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 lg:inline-flex"
                : "hidden rounded-full px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white lg:inline-flex"
            }
          >
            {authenticated ? (
              <>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold">
                  {initial}
                </span>
                <span className="truncate">{displayName}</span>
              </>
            ) : (
              "ورود / ثبت‌نام"
            )}
          </AddEventButton>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="منوی ناوبری"
            aria-expanded={menuOpen}
            className="rounded-full p-2 text-slate-700 transition-colors duration-200 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile slide-down panel ───────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-x-4 top-full z-50 mt-2 origin-top rounded-3xl border border-slate-200/80 bg-white/95 p-3 shadow-2xl shadow-slate-900/15 backdrop-blur-xl lg:hidden dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/50"
          >
            {/* Header row — live counter + menu label (mirrors the desktop
                dropdown's header) */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-bold text-orange-600 dark:bg-orange-950 dark:text-orange-300">
                <Zap className="h-3.5 w-3.5" />
                ۳۴ رویداد زنده این هفته
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                <Menu className="h-3.5 w-3.5" />
                منو
              </span>
            </div>

            {/* Nav links — card rows with a trailing forward arrow */}
            <nav className="space-y-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMenu}
                  className={`group flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-bold transition-colors duration-200 ${
                    item.active
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="shrink-0 rounded-full border border-blue-200/80 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {item.badge}
                      </span>
                    )}
                  </span>
                  <ArrowLeft className="h-4 w-4 shrink-0 text-slate-300 transition-transform duration-200 group-hover:-translate-x-0.5 dark:text-slate-600" />
                </Link>
              ))}
            </nav>

            <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

            {/* Location picker — full width across the panel */}
            <div className="pb-2">
              <LocationPicker
                variant="field"
                value={location}
                onChange={setLocation}
                disabled={!canChangeLocation}
                onDisabledClick={promptLogin}
              />
            </div>

            {/* Profile — tinted card row, avatar shows the signed-in
                client's initial when we know it */}
            <Link
              href="/dashboard"
              onClick={closeMenu}
              className="group mb-2 flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700 transition-colors duration-200 hover:bg-slate-100 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {authenticated ? initial : "م"}
              </span>
              <span className="truncate">پروفایل من</span>
              <ArrowLeft className="ms-auto h-4 w-4 shrink-0 text-slate-300 transition-transform duration-200 group-hover:-translate-x-0.5 dark:text-slate-600" />
            </Link>

            {/* Sign in / register → client's name when signed in (soft tint
                marks "already logged in" instead of the solid CTA) */}
            <AddEventButton
              authenticated={authenticated}
              className={
                authenticated
                  ? "flex w-full max-w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm font-bold text-blue-700 transition-all duration-200 hover:bg-blue-100 active:scale-[0.98] dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
                  : "w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
              }
            >
              {authenticated ? (
                <>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                    {initial}
                  </span>
                  <span className="truncate">{displayName}</span>
                </>
              ) : (
                "ورود / ثبت‌نام"
              )}
            </AddEventButton>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
