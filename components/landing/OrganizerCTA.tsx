import { ArrowLeft, Check, UserPlus } from "lucide-react";
import AddEventButton from "@/components/auth/AddEventButton";
import OrganizerChart from "@/components/landing/OrganizerChart";

const features = [
  "تسویه آنی و پرداخت مستقیم به حساب برگزارکننده",
  "پیامک یادآوری خودکار برای ثبت‌نام‌شده‌ها",
  "ثبت‌نام دیجیتال و بلیت با QR اختصاصی",
];

export default function OrganizerCTA() {
  return (
    <section id="organizers" className="scroll-mt-28 py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 p-7 text-white shadow-xl shadow-slate-900/10 sm:p-10 dark:border-slate-800 dark:bg-slate-950">
          {/* Subtle blue glow + faint grid — professional, low-chroma backdrop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.28),transparent_55%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.35] bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
          />

          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            {/* Copy */}
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 ring-1 ring-white/10">
                <UserPlus className="h-3.5 w-3.5 text-blue-400" />
                ویژه برگزارکنندگان
              </span>

              <h2 className="mt-4 text-xl font-extrabold leading-9 text-white sm:text-2xl sm:leading-10">
                شما هم برگزارکننده هستید؟ جامعه مخاطب خود را بسازید و تمام صندلی‌ها را پر
                کنید!
              </h2>

              <ul className="mt-5 space-y-3">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/20">
                      <Check className="h-3 w-3 text-emerald-300" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <AddEventButton
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/40 transition-all duration-200 hover:bg-blue-500 active:scale-[0.98]"
                href="/dashboard/events/new"
              >
                ثبت‌نام به عنوان برگزارکننده
                <ArrowLeft className="h-4 w-4" />
              </AddEventButton>
            </div>

            {/* Live ticket sales analytics */}
            <OrganizerChart />
          </div>
        </div>
      </div>
    </section>
  );
}
