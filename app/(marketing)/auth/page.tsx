import { Suspense } from "react";
import type { Metadata } from "next";
import AuthHandoff from "@/components/auth/AuthHandoff";

export const metadata: Metadata = {
  title: "ورود به Kooja",
  description: "ورود یا ثبت نام برای دسترسی به حساب کاربری Kooja.",
};

type AuthPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

/* URL data stays below the Suspense boundary so `/auth` keeps an instant shell. */
async function AuthContent({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const next = Array.isArray(params.next) ? params.next[0] : params.next;
  return <AuthHandoff next={next} />;
}

export default function AuthPage({ searchParams }: AuthPageProps) {
  return (
    <Suspense fallback={<div className="min-h-[65vh]" />}>
      <AuthContent searchParams={searchParams} />
    </Suspense>
  );
}
