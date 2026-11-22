import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PHONE = "09931939362";
const TITLE = "رویداد آزمایشی فرم جدید";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

/* ── Log in ───────────────────────────────────────────────────── */
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
await page.locator("button", { hasText: "ورود / ثبت‌نام" }).first().click();
await page.locator("#auth-phone").waitFor({ timeout: 20000 });
await page.locator("#auth-phone").fill(PHONE);

const otpBox = page.locator('input[aria-label^="رقم"]').first();
let advanced = false;
for (let attempt = 0; attempt < 3 && !advanced; attempt += 1) {
  await page.locator('button[type="submit"]', { hasText: "دریافت کد تایید" }).click();
  advanced = await otpBox
    .waitFor({ timeout: 4000 })
    .then(() => true)
    .catch(() => false);
  if (!advanced) await page.waitForTimeout(20000);
}

const log = readFileSync(".next/dev/logs/next-development.log", "utf8");
const code = [...log.matchAll(/\[OTP\] 09931939362[^\d]*(\d{6})/g)].at(-1)?.[1];
if (!code) throw new Error("no OTP in the dev log");
const boxes = page.locator('input[aria-label^="رقم"]');
for (let i = 0; i < code.length; i += 1) await boxes.nth(i).fill(code[i]);
await page.locator('button[type="submit"]', { hasText: "تایید و" }).click();
await page.waitForTimeout(3500);

/* ── Step 1 ───────────────────────────────────────────────────── */
await page.goto("http://localhost:3000/dashboard/events/new", {
  waitUntil: "domcontentloaded",
});
await page.locator("#ev-title").waitFor({ timeout: 30000 });
await page.waitForTimeout(500);

const widths = await page.evaluate(() => {
  const main = document.querySelector("main");
  const root = document.querySelector("main .max-w-4xl");
  return {
    main: main?.getBoundingClientRect().width,
    form: root?.getBoundingClientRect().width,
  };
});
console.log("WIDTHS", JSON.stringify(widths));

await page.locator("#ev-title").fill(TITLE);
await page.locator("#ev-category").selectOption({ label: "فناوری و AI" });
await page
  .locator("#ev-description")
  .fill("این توضیحات آزمایشی برای بررسی فیلدهای تازه فرم ثبت رویداد نوشته شده است.");

const undefinedBox = page.locator('label', { hasText: "نامشخص" }).locator('input[type="checkbox"]');
await undefinedBox.check();
console.log(
  "CAPACITY DISABLED",
  await page.locator("#ev-capacity").isDisabled(),
);

await page.getByRole("button", { name: "پولی", exact: true }).click();
await page.locator("#ev-price").fill("3000");
console.log("PRICE VALUE", await page.locator("#ev-price").inputValue());

await page.getByRole("button", { name: "افزودن مورد" }).click();
await page.getByRole("button", { name: "افزودن مورد" }).click();
const highlightInputs = page.locator(
  'input[aria-label*="چه چیزی در انتظارتان است"]',
);
await highlightInputs.nth(0).fill("منتورشیپ تخصصی در طول رویداد");
await highlightInputs.nth(1).fill("پذیرایی و فرصت شبکه‌سازی");

await page.getByRole("button", { name: "افزودن ردیف" }).click();
await page.getByRole("button", { name: "افزودن ردیف" }).click();
const timeInputs = page.locator('input[aria-label*="برنامه زمانی"]');
await page.locator('input[aria-label^="ساعت ردیف ۱"]').fill("۰۹:۰۰");
await page.locator('input[aria-label^="عنوان ردیف ۱"]').fill("ثبت‌نام و پذیرایی");
await page.locator('input[aria-label^="ساعت ردیف ۲"]').fill("۱۰:۳۰");
await page.locator('input[aria-label^="عنوان ردیف ۲"]').fill("شروع کارگاه اصلی");
console.log("AGENDA INPUTS", await timeInputs.count());

/* ── Step 2: a future date (Esfand, last day) ─────────────────── */
await page.getByRole("button", { name: "مرحله بعد" }).click();
await page.waitForTimeout(400);
await page.locator('[role="listbox"][aria-label="ماه برگزاری"]').focus();
await page.keyboard.press("End");
await page.waitForTimeout(500);
await page.locator('[role="listbox"][aria-label="روز برگزاری"]').focus();
await page.keyboard.press("End");
await page.waitForTimeout(500);
await page
  .locator("#ev-venue")
  .fill("دانشگاه صنعتی شریف، تالار اندیشه");

/* ── Step 3: preview + publish ────────────────────────────────── */
await page.getByRole("button", { name: "مرحله بعد" }).click();
await page.waitForTimeout(500);
const preview = await page.evaluate(() => {
  const text = document.querySelector("main")?.innerText ?? "";
  return {
    undefinedCapacity: text.includes("ظرفیت نامشخص"),
    price: text.includes("۳,۰۰۰ تومان"),
  };
});
console.log("PREVIEW", JSON.stringify(preview));
await page.screenshot({ path: "new-event-form.png", fullPage: true });

await page.getByRole("button", { name: "انتشار رویداد" }).click();
await page.waitForURL("**/dashboard/events", { timeout: 30000 });
await page.waitForTimeout(1200);

/* ── What actually landed in the database ─────────────────────── */
const created = await prisma.event.findFirst({
  where: { title: TITLE },
  orderBy: { createdAt: "desc" },
  select: {
    id: true,
    slug: true,
    capacity: true,
    price: true,
    highlights: true,
    agenda: true,
    status: true,
    startsAt: true,
  },
});
console.log("DB ROW", JSON.stringify(created, null, 2));
if (!created) throw new Error("event was not created");

/* Publish it so the public page can be read (nothing has cached this slug). */
await prisma.event.update({
  where: { id: created.id },
  data: { status: "PUBLISHED" },
});

await page.goto(`http://localhost:3000/events/${encodeURIComponent(created.slug)}`, {
  waitUntil: "domcontentloaded",
});
await page.waitForTimeout(2500);
const publicPage = await page.evaluate(() => {
  const text = document.querySelector("main")?.innerText ?? "";
  return {
    hasHighlightsTitle: text.includes("چه چیزی در انتظارتان است؟"),
    hasAgendaTitle: text.includes("برنامه زمانی"),
    highlight1: text.includes("منتورشیپ تخصصی در طول رویداد"),
    highlight2: text.includes("پذیرایی و فرصت شبکه‌سازی"),
    agenda1: text.includes("ثبت‌نام و پذیرایی"),
    agenda2: text.includes("شروع کارگاه اصلی"),
    undefinedCapacity: text.includes("ظرفیت نامشخص"),
    mockFallbackGone:
      !text.includes("گواهی شرکت برای حاضران") &&
      !text.includes("جمع‌بندی و شبکه‌سازی آزاد"),
  };
});
console.log("PUBLIC PAGE", JSON.stringify(publicPage, null, 2));
await page.screenshot({ path: "new-event-public.png", fullPage: true });

/* ── Clean up ─────────────────────────────────────────────────── */
await prisma.event.delete({ where: { id: created.id } });
console.log("CLEANED", created.id);

await browser.close();
await prisma.$disconnect();
