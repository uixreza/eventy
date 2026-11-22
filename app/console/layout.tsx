import { Suspense } from "react";
import ConsoleShell from "@/components/console/ConsoleShell";
import PageLoader from "@/components/ui/PageLoader";
import { requireAdmin } from "@/lib/session";

/**
 * `/console` is admin-only. `proxy.ts` redirects everyone else before this
 * renders; the gate below re-verifies the role on the server (a session that
 * says `ADMIN` but a user record that doesn't, or a stale cookie, never gets
 * past here).
 *
 * The read sits behind `<Suspense>` because with Cache Components a request
 * read can't be prerendered into the static shell.
 */
export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader full />}>
      <ConsoleGate>{children}</ConsoleGate>
    </Suspense>
  );
}

async function ConsoleGate({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return <ConsoleShell user={{ name: user.name ?? "" }}>{children}</ConsoleShell>;
}
