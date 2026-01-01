// src/common/middleware/logger.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  private readonly colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
  };

  private colorize(text: string, color: string): string {
    return `${color}${text}${this.colors.reset}`;
  }

  private colorizeMethod(method: string): string {
    const methodColors: Record<string, string> = {
      GET: this.colors.green,
      POST: this.colors.cyan,
      PUT: this.colors.yellow,
      PATCH: this.colors.yellow,
      DELETE: this.colors.red,
    };
    return this.colorize(method, methodColors[method] || this.colors.white);
  }

  private colorizeStatus(statusCode: number): string {
    if (statusCode >= 500) return this.colorize(String(statusCode), this.colors.red);
    if (statusCode >= 400) return this.colorize(String(statusCode), this.colors.yellow);
    if (statusCode >= 300) return this.colorize(String(statusCode), this.colors.cyan);
    return this.colorize(String(statusCode), this.colors.green);
  }

  use(request: Request, response: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, headers, ip } = request;

    const oldSend = response.send;
    const oldJson = response.json;
    let responseBody: any;

    response.send = function (body?: any): Response {
      responseBody = body;
      return oldSend.call(response, body);
    };

    response.json = function (body?: any): Response {
      responseBody = body;
      return oldJson.call(response, body);
    };

    response.on('finish', () => {
      const { statusCode } = response;
      const duration = Date.now() - startTime;
      const contentLength = response.get('content-length') || '-';

      // Simple one-line log for successful requests
      const simpleLog = `${this.colorizeMethod(method.padEnd(7))} ${originalUrl} ${this.colorizeStatus(statusCode)} ${this.colorize(`${duration}ms`, this.colors.dim)}`;

      if (statusCode >= 400) {
        // Detailed log for errors
        let parsedResponse: any;
        try {
          parsedResponse = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
        } catch {
          parsedResponse = responseBody;
        }

        const errorLog = [
          '',
          this.colorize('━'.repeat(60), this.colors.red),
          `${this.colorize('ERROR', this.colors.red)} ${simpleLog}`,
          this.colorize('━'.repeat(60), this.colors.red),
          `IP: ${ip}  Content-Length: ${contentLength}`,
          `User-Agent: ${headers['user-agent'] || 'unknown'}`,
          '',
          this.colorize('Request Body:', this.colors.bright),
          JSON.stringify(request.body || {}, null, 2),
          '',
          this.colorize('Response:', this.colors.bright),
          JSON.stringify(parsedResponse || {}, null, 2),
          this.colorize('━'.repeat(60), this.colors.red),
          '',
        ].join('\n');

        this.logger.error(errorLog);
      } else {
        // Simple log for success
        this.logger.log(simpleLog);
      }
    });

    next();
  }
}
