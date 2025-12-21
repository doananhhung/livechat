import 'crypto';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { json } from 'body-parser';
import { RedisIoAdapter } from './gateway/redis-io.adapter';
import { ConfigService } from '@nestjs/config';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { execSync } from 'child_process';

/**
 * Kill any process currently using a specific port.
 * This prevents EADDRINUSE errors during development restarts.
 */
function killPort(port: number): void {
  try {
    // Find and kill processes using the port (Linux/macOS)
    execSync(`lsof -ti :${port} | xargs -r kill -9 2>/dev/null || true`, {
      stdio: 'ignore',
    });
    Logger.log(`Cleared port ${port} if it was in use.`, 'Bootstrap');
  } catch {
    // Ignore errors - port might not be in use
  }
}

async function bootstrap() {
  const PORT = 3000;

  // Kill any existing process on the port before starting
  killPort(PORT);

  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Setup Redis Adapter for WebSocket
  const redisIoAdapter = new RedisIoAdapter(app, configService);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);
  Logger.log('WebSocket adapter (RedisIoAdapter) has been set.', 'main.ts');

  const logger = new LoggerMiddleware();
  app.use(logger.use.bind(logger));
  app.use(json());
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix('api/v1');

  // Swagger/OpenAPI Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Live Chat API')
    .setDescription('API documentation for the Live Chat application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(PORT);
  Logger.log(`Application listening on port ${PORT}`, 'Bootstrap');
}

bootstrap();
