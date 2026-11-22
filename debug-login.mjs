import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const info = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll("button")].filter((b) =>
    b.textContent?.includes("ورود / ثبت‌نام"),
  );
  return {
    width: window.innerWidth,
    sheets: document.styleSheets.length,
    buttons: buttons.map((b) => {
      const style = getComputedStyle(b);
      const rect = b.getBoundingClientRect();
      return {
        display: style.display,
        visibility: style.visibility,
        rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
        parentDisplay: b.parentElement ? getComputedStyle(b.parentElement).display : null,
      };
    }),
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: "login-debug.png" });
await browser.close();
