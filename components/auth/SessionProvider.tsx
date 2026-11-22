"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Puts the Auth.js session into client context so components can call
 * `useSession()`.
 *
 * Deliberately rendered without the `session` prop: the provider then fetches
 * `/api/auth/session` on the client instead of reading the cookie during the
 * server render — which keeps the marketing pages statically prerenderable.
 */
export default function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
