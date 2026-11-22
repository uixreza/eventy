import PageLoader from "@/components/ui/PageLoader";

/**
 * Shown inside the dashboard shell while a sub-route (events, teams, saved,
 * notifications, settings) streams — the topbar and tabs stay interactive.
 */
export default function Loading() {
  return <PageLoader />;
}
