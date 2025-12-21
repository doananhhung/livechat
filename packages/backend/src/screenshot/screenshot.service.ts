
import { Injectable, OnModuleInit, OnModuleDestroy, Inject, Logger } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ScreenshotService implements OnModuleInit, OnModuleDestroy {
  private browser: Browser | null = null;
  private browserAvailable = false;
  private readonly logger = new Logger(ScreenshotService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async onModuleInit() {
    try {
      this.logger.log('Launching Puppeteer browser instance...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      this.browserAvailable = true;
      this.logger.log('Puppeteer browser launched successfully.');
    } catch (error) {
      this.logger.warn(
        'Failed to launch Puppeteer browser. Screenshot functionality will be disabled. ' +
        'Run "npx puppeteer browsers install chrome" to install Chrome.',
      );
      this.logger.debug(`Puppeteer error: ${error instanceof Error ? error.message : String(error)}`);
      this.browserAvailable = false;
    }
  }

  async onModuleDestroy() {
    if (this.browser) {
      this.logger.log('Closing Puppeteer browser instance...');
      await this.browser.close();
    }
  }

  async getScreenshot(url: string): Promise<Buffer> {
    // Check if browser is available
    if (!this.browserAvailable || !this.browser) {
      throw new Error(
        'Screenshot service is unavailable. Chrome browser is not installed. ' +
        'Run "npx puppeteer browsers install chrome" to enable screenshots.',
      );
    }

    // 1. Check cache (Redis)
    // We store the image as a base64 string to ensure safe serialization in Redis
    const cached = await this.cacheManager.get<string>(url);
    if (cached) {
      this.logger.debug(`Cache hit for URL: ${url}`);
      return Buffer.from(cached, 'base64');
    }

    // 2. Use the singleton browser instance
    const page = await this.browser.newPage();
    try {
      // 3. Set viewport
      await page.setViewport({ width: 1280, height: 720 });

      // 4. Go to the URL with a timeout
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });

      // 5. Take screenshot
      const screenshot = await page.screenshot({
        type: 'jpeg',
        quality: 70,
        encoding: 'binary',
      });
      
      const buffer = screenshot as Buffer;

      // 6. Store in cache (Redis) for 1 minute (60000 ms)
      // Convert Buffer to base64 string for storage
      await this.cacheManager.set(url, buffer.toString('base64'), 60000);

      return buffer;
    } catch (error) {
      this.logger.error(`Failed to capture screenshot for ${url}`, error);
      throw error;
    } finally {
      // 7. Close the page (tab), but keep the browser open
      await page.close();
    }
  }
}
