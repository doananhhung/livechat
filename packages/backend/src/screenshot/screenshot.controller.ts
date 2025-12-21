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
import { URL } from 'url';
import * as net from 'net';

/**
 * Blocklist of hostnames and IP ranges that should never be accessed.
 * Prevents SSRF attacks targeting internal services and cloud metadata.
 */
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
  'metadata.google.internal', // GCP metadata
  'metadata.google.com',
]);

/**
 * Check if an IP address is in a private/reserved range.
 * Blocks RFC 1918 private IPs and link-local addresses.
 */
function isPrivateOrReservedIP(hostname: string): boolean {
  // Check if it's an IP address
  if (!net.isIP(hostname)) {
    return false;
  }

  const parts = hostname.split('.').map(Number);

  // 10.0.0.0/8 - Private
  if (parts[0] === 10) return true;

  // 172.16.0.0/12 - Private
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  // 192.168.0.0/16 - Private
  if (parts[0] === 192 && parts[1] === 168) return true;

  // 169.254.0.0/16 - Link-local (AWS/cloud metadata!)
  if (parts[0] === 169 && parts[1] === 254) return true;

  // 127.0.0.0/8 - Loopback
  if (parts[0] === 127) return true;

  // 0.0.0.0/8 - Current network
  if (parts[0] === 0) return true;

  return false;
}

@Controller('utils')
export class ScreenshotController {
  private readonly logger = new Logger(ScreenshotController.name);
  constructor(private readonly screenshotService: ScreenshotService) {}

  @Get('screenshot')
  @Header('Content-Type', 'image/jpeg')
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

    // --- 2. SSRF Protection: Block internal/private addresses ---
    const hostname = targetUrl.hostname.toLowerCase();

    if (BLOCKED_HOSTNAMES.has(hostname)) {
      this.logger.warn(`SSRF attempt blocked - blocked hostname: ${hostname}`);
      throw new HttpException(
        'Access to this URL is not allowed',
        HttpStatus.FORBIDDEN
      );
    }

    if (isPrivateOrReservedIP(hostname)) {
      this.logger.warn(`SSRF attempt blocked - private/reserved IP: ${hostname}`);
      throw new HttpException(
        'Access to private or reserved IP addresses is not allowed',
        HttpStatus.FORBIDDEN
      );
    }

    const finalUrl = targetUrl.toString();
    this.logger.debug(`Processing screenshot for final URL: ${finalUrl}`);

    // --- 3. Screenshot Generation and Response ---
    try {
      const buffer = await this.screenshotService.getScreenshot(finalUrl);
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
