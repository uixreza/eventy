"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { sileo } from "sileo";
import { AuthModal } from "@/components/auth/AddEventButton";
import { notifyBookmarksChanged } from "@/components/events/bookmark-notify";
import { fetchBookmarkedIds, toggleBookmark } from "@/app/actions/events";
import type { EventCard } from "@/lib/event-types";

/**
 * The saved-events state behind every heart on the site.
 *
 * - The ids come from the database: once the session resolves, one read fills
 *   the hearts saved earlier. A visitor who is not signed in costs no request
 *   at all, so `/events` stays a static page.
 * - Pressing a heart while signed out is not a silent no-op: the sign-in
 *   modal opens and the save runs the moment the session cookie exists.
 * - Saves are optimistic — the heart flips at once and flips back if the
 *   server says no.
 */
export function useBookmarks() {
  const { status } = useSession();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  /** The event waiting for the visitor to sign in. */
  const pending = useRef<EventCard | null>(null);

  /* Fill the hearts from the database once we know who this is. */
  useEffect(() => {
    if (status !== "authenticated") return;
    let alive = true;
    fetchBookmarkedIds()
      .then((ids) => {
        if (alive) setSavedIds(ids);
      })
      .catch(() => {
        /* Leave the hearts as they are — the next visit reads them again. */
      });
    return () => {
      alive = false;
    };
  }, [status]);

  /** Flips one heart locally and tells the server; rolls back on failure. */
  const applySave = useCallback((event: EventCard, wasSaved: boolean) => {
    setSavedIds((prev) =>
      wasSaved
        ? prev.filter((id) => id !== event.id)
        : prev.includes(event.id)
          ? prev
          : [...prev, event.id],
    );

    void toggleBookmark(event.id).then((result) => {
      if (!result.ok) {
        /* Roll back the optimistic flip. */
        setSavedIds((prev) =>
          wasSaved
            ? prev.includes(event.id)
              ? prev
              : [...prev, event.id]
            : prev.filter((id) => id !== event.id),
        );
        sileo.error({ title: "ذخیره انجام نشد", description: result.error });
        return;
      }

      /* The server had the last word — settle on what it actually stored, in
         case the ids this click started from were still stale. */
      setSavedIds((prev) =>
        result.saved
          ? prev.includes(event.id)
            ? prev
            : [...prev, event.id]
          : prev.filter((id) => id !== event.id),
      );

      /* Any open favorites list re-fetches now — same tab and other tabs. */
      notifyBookmarksChanged();

      sileo.success(
        result.saved
          ? { title: "رویداد ذخیره شد", description: `«${event.title}» برای بعد نگه داشته شد.` }
          : {
              title: "از ذخیره‌شده‌ها حذف شد",
              description: `«${event.title}» از لیست شما حذف شد.`,
            },
      );
    });
  }, []);

  const toggle = useCallback(
    (event: EventCard) => {
      /* Signed out → remember the click and ask for the session first. */
      if (status !== "authenticated") {
        pending.current = event;
        setAuthOpen(true);
        return;
      }
      applySave(event, savedIds.includes(event.id));
    },
    [status, savedIds, applySave],
  );

  /** Runs right after the modal signs the visitor in: close it, then save. */
  function handleSignedIn() {
    const event = pending.current;
    pending.current = null;
    setAuthOpen(false);
    if (event) applySave(event, savedIds.includes(event.id));
  }

  const authModal = (
    <AnimatePresence>
      {authOpen && (
        <AuthModal onClose={() => setAuthOpen(false)} onSuccess={handleSignedIn} />
      )}
    </AnimatePresence>
  );

  return {
    /** Whether this event is saved by the current visitor. */
    isSaved: (id: string) => savedIds.includes(id),
    toggle,
    /** Render once inside the component's tree — it hosts the sign-in modal. */
    authModal,
  };
}
