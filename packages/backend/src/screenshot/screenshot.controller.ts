import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  Logger,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { ScreenshotService } from './screenshot.service';
import { URL } from 'url'; // Using Node's built-in URL parser

@Controller('utils')
export class ScreenshotController {
  private readonly logger = new Logger(ScreenshotController.name);
  constructor(private readonly screenshotService: ScreenshotService) {}

  @Get('screenshot')
  @Header('Content-Type', 'image/jpeg') // Set the header the NestJS way
  async getScreenshot(@Query('url') url: string): Promise<StreamableFile> {
    this.logger.debug(`Received screenshot request for URL: ${url}`);

    if (!url) {
      throw new HttpException(
        'URL query parameter is required',
        HttpStatus.BAD_REQUEST
      );
    }

    let targetUrl: URL;

    // --- 1. Robust URL Validation and Parsing ---
    try {
      // Decode the URL and parse it with the standard URL constructor.
      // This is safer than string checks and will throw if the URL is malformed.
      targetUrl = new URL(decodeURIComponent(url));

      // Ensure we only process http and https protocols
      if (!['http:', 'https:'].includes(targetUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch (error) {
      this.logger.warn(`Invalid URL received: ${url}. Error: ${error}`);
      throw new HttpException(
        'Invalid or malformed URL provided',
        HttpStatus.BAD_REQUEST
      );
    }

    const finalUrl = targetUrl.toString();
    this.logger.debug(`Processing screenshot for final URL: ${finalUrl}`);

    // --- 4. Screenshot Generation and Response ---
    try {
      const buffer = await this.screenshotService.getScreenshot(finalUrl);

      // By returning a StreamableFile, we let NestJS handle the response stream
      // efficiently without being tied to the underlying Express framework.
      return new StreamableFile(buffer);
    } catch (error) {
      this.logger.error(
        `Error capturing screenshot for URL [${finalUrl}]: ${error}`
      );
      throw new HttpException(
        'Failed to capture screenshot. The target URL may be unreachable or timed out.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
