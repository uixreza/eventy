import type { Metadata } from "next";
import ConsoleAdsLoader from "@/components/console/ConsoleAdsLoader";

export const metadata: Metadata = {
  title: "تبلیغات",
  description: "ویرایش متن، لینک و بنر تبلیغاتی صفحه اصلی Kooja",
};

/** Shell only — the stored text, link and banner key are fetched by the client loader. */
export default function ConsoleAdsPage() {
  return <ConsoleAdsLoader />;
}
