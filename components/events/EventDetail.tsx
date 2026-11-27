"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Bookmark,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Pin,
  Ticket,
  UserRound,
  Users,
} from "lucide-react";
import { eventStatusMeta, type EventDetails } from "@/lib/data";
import type { EventCard } from "@/lib/event-types";
import { eventImageUrl } from "@/lib/event-images";
import { eventMapCenter } from "@/lib/map";
import { faPrice, toFa } from "@/lib/utils";
import EventMap from "@/components/maps/EventMap";
import EventImageSlideshow from "./EventImageSlideshow";
import EventListCard from "./EventListCard";
import ReportEventButton from "./ReportEventButton";
import ShareEventButton from "./ShareEventButton";
import { useBookmarks } from "./useBookmarks";

type EventDetailProps = {
  event: EventCard;
  details: EventDetails;
  similar: EventCard[];
  /** The booking card — rendered by the server, since it reads the session. */
  action: React.ReactNode;
  /** The organizer never gets a report button for their own event. */
  isOwner: boolean;
};

const metaTiles = [
  { key: "date", icon: CalendarDays, label: "زمان برگزاری" },
  { key: "venue", icon: MapPin, label: "مکان" },
  { key: "price", icon: Ticket, label: "هزینه ثبت‌نام" },
  { key: "seats", icon: Users, label: "ظرفیت" },
] as const;

export default function EventDetail({ event, details, similar, action, isOwner }: EventDetailProps) {
  const status = eventStatusMeta[event.status];
  /* Online events have no location at all. Older in-person rows without a
     pin fall back to the city centre and are labelled as approximate. */
  const hasExactPin = event.latitude !== null && event.longitude !== null;
  const mapPoint =
    event.mode === "ONLINE"
      ? null
      : eventMapCenter(event.city, {
          lat: event.latitude ?? Number.NaN,
          lng: event.longitude ?? Number.NaN,
        });

  /* The hearts — real rows in the database, see `useBookmarks`. */
  const { isSaved, toggle, authModal } = useBookmarks();
  const saved = isSaved(event.id);

  const metaValues: Record<(typeof metaTiles)[number]["key"], React.ReactNode> = {
    date: `${event.date} - ${event.time}`,
    venue: `${event.city} - ${event.venue}`,
    price:
      event.price === null ? (
        <span className="text-emerald-600 dark:text-emerald-400">رایگان</span>
      ) : (
        faPrice(event.price)
      ),
    seats:
      event.capacity === null ? (
        <span className="text-slate-400 dark:text-slate-500">ظرفیت نامشخص</span>
      ) : event.seatsLeft === null ? (
        <span className="text-slate-400 dark:text-slate-500">
          {event.status === "ended" ? "برگزار شده" : "ثبت‌نام بسته"}
        </span>
      ) : (
        `${toFa(event.seatsLeft)} صندلی آزاد`
      ),
  };

  return (
    <>
      {/* ── Hero banner (image placeholder + status over it) ──── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative mt-4 overflow-hidden rounded-3xl"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${event.gradient}`} />
        {event.images[0] && (
          <Image
            src={eventImageUrl(event.images[0])}
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            /* Slight scale hides the soft edges the blur would otherwise pull
               in from outside the frame; the darker wash keeps copy legible. */
            className="scale-110 object-cover blur-[3px]"
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] bg-[size:22px_22px]"
        />

        <div className="relative p-6 sm:p-9 lg:p-11">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status over the hero image */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold shadow-sm ring-1 ring-white/40 ${status.tint}`}
            >
              {event.status === "live" && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              )}
              {status.label}
            </span>
            {event.promoted && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1.5 text-[11px] font-bold text-amber-950 shadow-sm ring-1 ring-white/40">
                <Pin className="h-3.5 w-3.5" />
                رویداد ویژه
              </span>
            )}
            <span className="rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur ring-1 ring-white/30">
              {event.category}
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur ring-1 ring-white/30">
              {event.city}
            </span>
          </div>

          <h1 className="mt-4 max-w-3xl text-2xl font-extrabold leading-9 text-white sm:text-3xl sm:leading-10 lg:text-4xl lg:leading-[1.4]">
            {event.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 sm:text-[15px]">
            {event.summary}
          </p>
        </div>
      </motion.div>

      {/* ── Quick facts strip ─────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metaTiles.map((tile) => (
          <div
            key={tile.key}
            className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900 sm:p-4"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
              <tile.icon className="h-4 w-4" />
            </span>
            <p className="mt-2.5 text-[11px] font-bold text-slate-400 dark:text-slate-500">
              {tile.label}
            </p>
            <p className="mt-0.5 truncate text-sm font-bold text-slate-800 dark:text-slate-100">
              {metaValues[tile.key]}
            </p>
          </div>
        ))}
      </div>

      {/* ── Body: content + sticky booking card ───────────────── */}
      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
        <div className="space-y-5">
          {/* About */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 sm:text-lg">
              درباره این رویداد
            </h2>
            <div className="mt-3 space-y-3">
              {details.about.map((paragraph, index) => (
                <p
                  key={`about-${index}`}
                  className="text-sm leading-7 text-slate-600 dark:text-slate-300"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          {/* Location — only in-person events have one */}
          {event.mode !== "ONLINE" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 sm:text-lg">
                  محل برگزاری
                </h2>
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {hasExactPin ? "نقشه تعاملی" : "مکان تقریبی"}
                </span>
              </div>
              <EventMap point={mapPoint} city={event.city} className="mt-3 h-56" />
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                {event.venue}، {event.city}
              </p>
            </section>
          )}

          {/* Highlights — hidden when the organizer left it empty */}
          {details.highlights.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 sm:text-lg">
                چه چیزی در انتظارتان است؟
              </h2>
              <ul className="mt-3 space-y-2.5">
                {details.highlights.map((item, index) => (
                  <li
                    key={`highlight-${index}`}
                    className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="leading-6">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Agenda — hidden when the organizer left it empty */}
          {details.agenda.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 sm:text-lg">
                برنامه زمانی
              </h2>
              <ol className="mt-4 space-y-0">
                {details.agenda.map((item, index) => (
                  <li
                    key={`agenda-${index}`}
                    className="relative flex gap-4 pb-5 last:pb-0"
                  >
                    {/* Rail connecting the time dots */}
                    {index < details.agenda.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute start-[7px] top-4 h-full w-px bg-slate-200 dark:bg-slate-700"
                      />
                    )}
                    <span className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-blue-500 bg-white dark:bg-slate-900" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{item.time}</p>
                      <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                        {item.title}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* Left column: the photo slideshow scrolls above the booking card,
            while the booking card and host card keep their sticky behaviour. */}
        <aside className="mt-5 space-y-3 lg:mt-0 lg:self-stretch">
          {event.images.length > 0 && (
            <EventImageSlideshow images={event.images} title={event.title} />
          )}

          <div className="lg:sticky lg:top-24">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {event.price === null ? (
                  <span className="text-emerald-600 dark:text-emerald-400">ورود رایگان</span>
                ) : (
                  faPrice(event.price)
                )}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {event.capacity === null
                  ? event.status === "ended"
                    ? "این رویداد برگزار شده است"
                    : "ظرفیت نامشخص — ثبت‌نام باز است"
                  : event.seatsLeft === null
                    ? event.status === "ended"
                      ? "این رویداد برگزار شده است"
                      : "ثبت‌نام برای این رویداد بسته است"
                    : `${toFa(event.seatsLeft)} صندلی باقی مانده`}
              </p>

              {/* The booking button — handed over by the loader together
                  with the visitor's own ticket, read by the API route. */}
              {action}

              <button
                type="button"
                onClick={() => toggle(event)}
                aria-pressed={saved}
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition-all duration-200 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300"
              >
                <Bookmark
                  className={`h-4 w-4 ${saved ? "fill-current text-blue-600 dark:text-blue-400" : ""}`}
                />
                {saved ? "ذخیره شده" : "ذخیره رویداد"}
              </button>

              {/* Sharing and reporting sit with the other visitor actions. */}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <ShareEventButton title={event.title} />
                <ReportEventButton
                  eventId={event.id}
                  eventTitle={event.title}
                  isOwner={isOwner}
                />
              </div>

              <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
                <p className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                  <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                  {event.date} - {event.time}
                </p>
                <p className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                  {event.venue}، {event.city}
                </p>
              </div>
            </div>

            {/* The conductor gets their own small card, directly under the
                sticky booking card in the left column. */}
            <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                میزبان رویداد
              </p>
              <div className="mt-2.5 flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                  <UserRound className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                    {event.organizer}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                    برگزارکننده این رویداد
                  </p>
                </div>
              </div>
            </section>
          </div>
        </aside>
      </div>

      {/* ── More on Kooja ─────────────────────────────────────── */}
      {similar.length > 0 && (
        <section className="mt-10 border-t border-slate-200 pt-8 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 sm:text-lg">
              دیگه کوجا ؟
            </h2>
            <Link
              href="/events"
              className="text-xs font-bold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              دیدن همه
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {similar.map((item) => (
              <EventListCard
                key={item.id}
                event={item}
                saved={isSaved(item.id)}
                onToggleSave={toggle}
              />
            ))}
          </div>
        </section>
      )}

      {/* Hosts the sign-in modal a signed-out visitor gets when pressing a heart */}
      {authModal}
    </>
  );
}
