import { chromium } from "playwright";

/**
 * HTML → PDF via Playwright's `page.pdf()`, not Puppeteer — docs/08's technology stack lists
 * Puppeteer among "technologies intentionally avoided" and Playwright is already the sanctioned
 * browser-automation tool (used by the Browser Engine); reusing it here avoids adding a second
 * browser-automation dependency for what both this and Browser Engine ultimately do (drive a
 * real Chromium instance).
 */
export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "24px", bottom: "24px", left: "24px", right: "24px" },
    });
  } finally {
    await browser.close();
  }
}
