import { Suspense } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageLoader from "@/components/ui/PageLoader";
import { requireUser } from "@/lib/session";

/**
 * Gate in front of the whole `/dashboard` segment (and everything under it).
 *
 * `proxy.ts` already turns unauthorized requests away before they render;
 * this second check runs on the server with the verified session, so the
 * shell can only ever be handed a real signed-in user — and so the check
 * still holds if someone reaches the segment through an unexpected entry.
 *
 * The session read sits behind `<Suspense>` because with Cache Components a
 * request read can't be prerendered into the static shell — it streams in.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader full />}>
      <DashboardGate>{children}</DashboardGate>
    </Suspense>
  );
}

async function DashboardGate({ children }: { children: React.ReactNode }) {
  /* `requireUser` re-reads the row, so `name` and `role` are current — a
     profile save or a role change shows up without waiting for a re-login. */
  const user = await requireUser();
  return (
    <DashboardShell
      user={{ name: user.name ?? "", isAdmin: user.role === "ADMIN" }}
    >
      {children}
    </DashboardShell>
  );
}
