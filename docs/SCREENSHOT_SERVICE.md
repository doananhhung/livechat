
# Screenshot Service Documentation

## Overview

The Screenshot Service is a specialized micro-service within the backend monolith responsible for generating visual previews of URLs. It utilizes a headless Chrome instance (via Puppeteer) to render web pages and capture screenshots.

Given the high resource cost of browser automation and the security risks associated with fetching arbitrary URLs (SSRF), this service implements strict architectural constraints, concurrency limits, and a multi-layered defense strategy.

## 1. Service Architecture

The service is designed as a **Singleton Worker** that manages a persistent browser instance.

### Lifecycle Management
*   **Initialization (`OnModuleInit`)**: The service attempts to launch a headless Chromium instance using Puppeteer.
    *   **Graceful Degradation**: If the Chromium binary is missing (common in minimal Docker containers), the service logs a warning and sets `browserAvailable = false`. It does not crash the application. Subsequent requests will fail with a descriptive error.
*   **Termination (`OnModuleDestroy`)**: The service ensures the browser process is killed cleanly when the NestJS application shuts down to prevent zombie processes.

### Resource Management (Semaphore Pattern)
Headless browsers are memory-intensive. To prevent a Denial of Service (DoS) where too many tabs exhaust the server's RAM, the service implements a **Manual Semaphore**.

*   **Limit**: `MAX_CONCURRENT_PAGES = 5` (Hardcoded).
*   **Mechanism**:
    1.  An internal counter `activePages` tracks open tabs.
    2.  Incoming requests check `activePages >= MAX_CONCURRENT_PAGES`.
    3.  If the limit is reached, the request is immediately rejected with `503 Service Unavailable`.
    4.  The counter is incremented before opening a page and decremented in a `finally` block after the screenshot is taken or if an error occurs.

## 2. Security Architecture: Anti-SSRF Strategy

The `ScreenshotController` implements a rigorous **Defense-in-Depth** strategy to prevent Server-Side Request Forgery (SSRF). This prevents attackers from using the screenshot bot to probe internal networks (e.g., `localhost:5432`) or cloud metadata services (e.g., AWS `169.254.169.254`).

### Layer 1: Input Validation
*   **Protocol Restriction**: Only `http:` and `https:` protocols are allowed. `file://`, `gopher://`, etc., are rejected.
*   **URL Parsing**: The native Node.js `URL` class is used to parse the input. If parsing fails, the request is rejected.

### Layer 2: Hostname Blocklisting
The service explicitly blocks known dangerous hostnames before attempting DNS resolution:
*   `localhost`
*   `127.0.0.1`
*   `metadata.google.internal`
*   `169.254.169.254` (Cloud Metadata)

### Layer 3: DNS Resolution & IP Validation
To prevent attacks where a malicious domain resolves to an internal IP, the service performs its own DNS lookup **before** passing the URL to Puppeteer.

1.  **Resolution**: `dns.lookup(hostname)` resolves the domain to an IP address.
2.  **IP Validation**: The resolved IP is checked against a list of private and reserved ranges using `ipaddr.js`.
    *   **Blocked Ranges**:
        *   Loopback (`127.0.0.0/8`, `::1`)
        *   Private (`10.0.0.0/8`, `192.168.0.0/16`, etc.)
        *   Link-Local (`169.254.0.0/16`)
        *   Unique Local IPv6 (`fc00::/7`)

### Layer 4: DNS Rebinding Protection (URL Rewriting)
A sophisticated attack vector involves **DNS Rebinding**, where a domain resolves to a safe IP during the check (Layer 3) but switches to a private IP (TTL=0) when the browser actually connects.

To defeat this, the service uses a **URL Rewriting Strategy**:

1.  **Rewrite**: The target URL passed to Puppeteer is modified to use the **Resolved Safe IP** instead of the hostname.
    *   *Input*: `http://example.com/foo` (Resolves to `93.184.216.34`)
    *   *Navigation*: `http://93.184.216.34/foo`
2.  **Host Header Injection**: To ensure the target server routes the request correctly (Virtual Hosting), the original hostname is injected via the HTTP `Host` header.
    *   *Header*: `Host: example.com`

This forces the browser to connect to the specific IP address validated in Layer 3, physically preventing it from connecting to an internal IP regardless of subsequent DNS changes.

## 3. Caching Strategy

To reduce load on the browser and improve response times, screenshots are cached using Redis.

*   **Storage**: `CACHE_MANAGER` (Redis).
*   **Key**: The full target URL.
*   **Value**: Base64-encoded string of the image buffer.
    *   *Note*: Base64 is used because standard Redis clients handle strings better than raw binary buffers.
*   **TTL**: 60 seconds. This short TTL balances freshness with burst protection.
*   **Flow**:
    1.  Check Cache. If hit -> Return Buffer (decoded from Base64).
    2.  If miss -> Generate Screenshot.
    3.  Store in Cache -> Return Buffer.

## 4. Operational Dependencies

### System Requirements
The service requires a valid Chromium binary to function.
*   **Command**: `npx puppeteer browsers install chrome`
*   **Docker**: Ensure the Dockerfile includes the necessary shared libraries for Chromium (e.g., `libnss3`, `libatk1.0-0`, etc.).

### Environment Variables
No specific environment variables are required for the logic itself, but the underlying Redis connection depends on:
*   `REDIS_HOST`
*   `REDIS_PORT`

### Troubleshooting
*   **"Screenshot service is unavailable"**: The Chromium binary is missing. Run the install command.
*   **"Screenshot service is currently overloaded"**: More than 5 concurrent requests are being processed. Consider increasing `MAX_CONCURRENT_PAGES` (requires code change) or scaling horizontally (though this requires a distributed lock/semaphore which is not currently implemented).
*   **"Access to this URL is not allowed"**: The URL was blocked by the SSRF protection layers.
