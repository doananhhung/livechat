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
import * as dns from 'dns';

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
 * @param ip - The IP address to check
 * @returns true if the IP is private/reserved and should be blocked
 */
function isPrivateOrReservedIP(ip: string): boolean {
  // Try to parse as IP address
  let addr: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    // Handle bracketed IPv6 addresses like [::1]
    const cleanIP = ip.replace(/^\[|\]$/g, '');
    addr = ipaddr.parse(cleanIP);
  } catch {
    // Not a valid IP address
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

/**
 * Resolves a hostname to an IP address.
 * Returns null if resolution fails.
 */
async function resolveHostname(hostname: string): Promise<string | null> {
  try {
    const { address } = await dns.promises.lookup(hostname);
    return address;
  } catch {
    return null;
  }
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

    // --- 2. SSRF Protection: Block known bad hostnames ---
    const originalHostname = targetUrl.hostname.toLowerCase();

    if (BLOCKED_HOSTNAMES.has(originalHostname)) {
      this.logger.warn(`SSRF attempt blocked - blocked hostname: ${originalHostname}`);
      throw new HttpException(
        'Access to this URL is not allowed',
        HttpStatus.FORBIDDEN
      );
    }

    // --- 3. DNS Rebinding Protection ---
    // Resolve hostname to IP BEFORE making the request, then validate the resolved IP.
    // This prevents attackers from using domains like "evil.com" that resolve to 127.0.0.1
    
    // First check if hostname is already an IP address
    if (isPrivateOrReservedIP(originalHostname)) {
      this.logger.warn(
        `SSRF attempt blocked - private/reserved IP in URL: ${originalHostname}`
      );
      throw new HttpException(
        'Access to private or reserved IP addresses is not allowed',
        HttpStatus.FORBIDDEN
      );
    }

    // Resolve the hostname to an IP address
    const resolvedIP = await resolveHostname(originalHostname);
    
    if (!resolvedIP) {
      this.logger.warn(`DNS resolution failed for hostname: ${originalHostname}`);
      throw new HttpException(
        'Could not resolve the hostname. Please check the URL.',
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate the resolved IP against our blocklist
    if (isPrivateOrReservedIP(resolvedIP)) {
      this.logger.warn(
        `SSRF attempt blocked - hostname ${originalHostname} resolved to private/reserved IP: ${resolvedIP}`
      );
      throw new HttpException(
        'Access to private or reserved IP addresses is not allowed',
        HttpStatus.FORBIDDEN
      );
    }

    // --- 4. Construct safe URL with IP and original Host header ---
    // Rewrite URL to use the resolved IP instead of hostname
    const safeUrl = new URL(targetUrl.toString());
    safeUrl.hostname = resolvedIP;
    const finalUrl = safeUrl.toString();

    // Pass the original Host header so the target server responds correctly
    const headers: Record<string, string> = {
      Host: originalHostname,
    };

    this.logger.debug(
      `Processing screenshot: original=${targetUrl.toString()}, resolved=${finalUrl}, Host=${originalHostname}`
    );

    // --- 5. Screenshot Generation and Response ---
    try {
      const buffer = await this.screenshotService.getScreenshot(finalUrl, headers);
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
