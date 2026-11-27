import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import MobileTabBar from "@/components/layout/MobileTabBar";
import ScrollTopButton from "@/components/layout/ScrollTopButton";
import { getSiteAnnouncement } from "@/lib/announcement";
import { getPublicCategories } from "@/lib/categories";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  /* The header's dropdown lists the same DB categories as the landing grid,
     and it needs the ad line to rest below the strip at the page top. */
  const [categories, announcement] = await Promise.all([
    getPublicCategories(),
    getSiteAnnouncement(),
  ]);

  return (
    <div className="flex min-h-screen flex-col font-dana">
      <SiteHeader categories={categories} announcementText={announcement.text} />
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <SiteFooter />
      <MobileTabBar />
      <ScrollTopButton />
    </div>
  );
}
