import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sileo";
import AuthSessionProvider from "@/components/auth/SessionProvider";
import BroadcastToaster from "@/components/layout/BroadcastToaster";
import { LocationProvider } from "@/components/layout/LocationProvider";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const morabba = localFont({
  src: [
    { path: "../public/fonts/Morabba/Morabba-UltraLight.woff", weight: "100", style: "normal" },
    { path: "../public/fonts/Morabba/Morabba-Light.woff", weight: "300", style: "normal" },
    { path: "../public/fonts/Morabba/Morabba-Regular.woff", weight: "400", style: "normal" },
    { path: "../public/fonts/Morabba/Morabba-Medium.woff", weight: "500", style: "normal" },
    { path: "../public/fonts/Morabba/Morabba-SemiBold.woff", weight: "600", style: "normal" },
    { path: "../public/fonts/Morabba/Morabba-Bold.woff", weight: "700", style: "normal" },
    { path: "../public/fonts/Morabba/Morabba-ExtraBold.woff", weight: "800", style: "normal" },
    { path: "../public/fonts/Morabba/Morabba-Black.woff", weight: "900", style: "normal" },
  ],
  variable: "--font-morabba",
  display: "swap",
});

/* Public routes opt into Dana. It stays preload-disabled so dashboard and
   console visits don't preload a font they don't use. */
const dana = localFont({
  src: [
    { path: "../public/assets/fonts/Dana/Dana-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/assets/fonts/Dana/Dana-Bold.ttf", weight: "700", style: "normal" },
    { path: "../public/assets/fonts/Dana/Dana-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-dana",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Kooja | دورهمی‌ها و کشف رویدادها",
    template: "%s | Kooja",
  },
  description:
    "Kooja؛ جایی برای دورهمی‌های واقعی، شبکه‌سازی و کشف رویدادها در ایران.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      className={`${morabba.variable} ${dana.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LocationProvider>
            <AuthSessionProvider>{children}</AuthSessionProvider>
          </LocationProvider>
          {/* Global notifications sent from `/console`: shown once per
              browser, then remembered (see the component). */}
          <BroadcastToaster />
          {/* sileo names the theme after the ink, not the surface: `light`
              renders the dark #1a1a1a toast with light text; `dark` renders
              a light #f2f2f2 toast. We always want the dark one. */}
          {/* bottom-center = horizontally centered, resting at the bottom edge
              (sileo pins bottom:0 + left:50%/translateX(-50%)). */}
          <Toaster position="bottom-center" theme="light" />
        </ThemeProvider>
      </body>
    </html>
  );
}
