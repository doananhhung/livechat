import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * HTTP Logging Interceptor.
 *
 * Replaces the old LoggerMiddleware that relied on monkey-patching response.send/json.
 * Uses NestJS Interceptor pattern with RxJS tap() for clean, non-invasive logging.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const { method, originalUrl } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logger.log(
            `${method} ${originalUrl} ${statusCode} - ${duration}ms`
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          const message = error.message || 'Internal Server Error';

          this.logger.error(
            `${method} ${originalUrl} ${statusCode} - ${duration}ms | ${message}`
          );
        },
      })
    );
  }
}
