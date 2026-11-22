import type { Metadata } from "next";
import ConsoleUsersLoader from "@/components/console/ConsoleUsersLoader";

export const metadata: Metadata = {
  title: "کاربران",
  description: "مدیریت اعضا، نقش‌ها و وضعیت حساب‌های کاربری رویدادشو",
};

/** Static shell — the member list is fetched client-side from
 *  `GET /api/console/users`, so the page renders instantly and streams
 *  only the admin gate before the real rows land. */
export default function ConsoleUsersPage() {
  return <ConsoleUsersLoader />;
}
