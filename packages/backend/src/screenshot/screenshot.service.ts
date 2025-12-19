import puppeteer from 'puppeteer';

// Cache to prevent re-fetching the same URL too quickly
const screenshotCache = new Map<
  string,
  { buffer: Buffer; timestamp: number }
>();
const CACHE_TTL_MS = 60000; // 1 minute

export class ScreenshotService {
  async getScreenshot(url: string): Promise<Buffer> {
    const now = Date.now();

    // 1. Check cache
    if (screenshotCache.has(url)) {
      const cached = screenshotCache.get(url)!;
      if (now - cached.timestamp < CACHE_TTL_MS) {
        return cached.buffer;
      }
    }

    // 2. Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    try {
      // 3. Set viewport (what the user sees)
      await page.setViewport({ width: 1280, height: 720 });

      // 4. Go to the URL with a timeout
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });

      // 5. Take screenshot (viewport only, not full page)
      const screenshot = await page.screenshot({
        type: 'jpeg',
        quality: 70, // Lower quality for faster loading
      });
      const buffer = Buffer.from(screenshot);

      // 6. Store in cache
      screenshotCache.set(url, { buffer, timestamp: Date.now() });

      return buffer;
    } catch (error) {
      throw error;
    } finally {
      // 7. Always close the browser
      await browser.close();
    }
  }
}
