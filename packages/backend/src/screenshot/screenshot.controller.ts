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
import * as ipaddr from 'ipaddr.js';

/**
 * Blocklist of hostnames that should never be accessed.
 * Prevents SSRF attacks targeting internal services and cloud metadata.
 */
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal', // GCP metadata
  'metadata.google.com',
  '169.254.169.254', // AWS/Azure metadata
]);

/**
 * Check if an IP address (IPv4 or IPv6) is in a private/reserved range.
 * Uses ipaddr.js for proper parsing of both IPv4 and IPv6.
 *
 * @param hostname - The hostname or IP address to check
 * @returns true if the IP is private/reserved and should be blocked
 */
function isPrivateOrReservedIP(hostname: string): boolean {
  // Try to parse as IP address
  let addr: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    // Handle bracketed IPv6 addresses like [::1]
    const cleanHostname = hostname.replace(/^\[|\]$/g, '');
    addr = ipaddr.parse(cleanHostname);
  } catch {
    // Not a valid IP address - could be a hostname, skip IP check
    return false;
  }

  // Get the range type for this IP
  const range = addr.range();

  // List of ranges that are considered private/reserved and should be blocked
  const blockedRanges = new Set([
    'unspecified', // 0.0.0.0, ::
    'loopback', // 127.0.0.0/8, ::1
    'private', // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, fc00::/7
    'linkLocal', // 169.254.0.0/16, fe80::/10
    'reserved', // Various reserved ranges
    'carrierGradeNat', // 100.64.0.0/10
    'uniqueLocal', // fc00::/7 (IPv6 private)
  ]);

  return blockedRanges.has(range);
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
      this.logger.warn(
        `SSRF attempt blocked - private/reserved IP: ${hostname}`
      );
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
