"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Runs a server-action fetch on every mount — that is, on every route
 * load — and reports loading, failure and retry. The fetcher is kept in a
 * ref (synced in an effect) so an inline arrow never re-triggers the
 * effect by identity.
 */
export function useServerData<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const fetcherRef = useRef(fetcher);

  /* Keep the ref on the latest fetcher without re-running the fetch. */
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let alive = true;
    fetcherRef
      .current()
      .then((value) => {
        if (!alive) return;
        setData(value);
        setLoaded(true);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  /** Runs the fetch again — the retry button and post-mutation reloads. */
  const reload = useCallback(() => {
    setFailed(false);
    setAttempt((value) => value + 1);
  }, []);

  return { data, loaded, failed, reload };
}
