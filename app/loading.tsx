import PageLoader from "@/components/ui/PageLoader";

/**
 * Root loading boundary: shown full-screen for top-level navigations
 * (marketing ↔ dashboard ↔ console) while the new layout tree streams in.
 */
export default function Loading() {
  return <PageLoader full />;
}
