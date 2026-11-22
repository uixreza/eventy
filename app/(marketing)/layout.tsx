import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import MobileTabBar from "@/components/layout/MobileTabBar";
import ScrollTopButton from "@/components/layout/ScrollTopButton";
import { getPublicCategories } from "@/lib/categories";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  /* The header's dropdown lists the same DB categories as the landing grid. */
  const categories = await getPublicCategories();

  return (
    <div className="flex min-h-screen flex-col font-dana">
      <SiteHeader categories={categories} />
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <SiteFooter />
      <MobileTabBar />
      <ScrollTopButton />
    </div>
  );
}
