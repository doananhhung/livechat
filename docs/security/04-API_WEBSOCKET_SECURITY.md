# Bảo mật API & WebSocket

## Tổng quan

Hệ thống triển khai bảo mật toàn diện cho cả REST API và WebSocket, bao gồm:

- **CORS (Cross-Origin Resource Sharing)**
- **Domain Whitelisting**
- **Rate Limiting (chuẩn bị)**
- **Input Validation**
- **Error Handling bảo mật**
- **Logging & Monitoring**

## 1. CORS (Cross-Origin Resource Sharing)

### 1.1. REST API CORS

**File:** `packages/backend/src/main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true, // Allow all origins (development)
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true, // Allow cookies
  });

  await app.listen(3000);
}
```

**Development vs Production:**

```typescript
// Production configuration (recommended)
app.enableCors({
  origin: [
    "https://app.example.com", // Main frontend
    "https://dashboard.example.com", // Dashboard
    /\.example\.com$/, // Subdomains
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
  maxAge: 86400, // Cache preflight for 24h
});
```

**Tại sao `credentials: true`:**

- Cho phép gửi cookies (refresh_token)
- Yêu cầu trong CORS requests
- Frontend phải set `withCredentials: true`

**Frontend (axios config):**

```typescript
// File: packages/frontend/src/lib/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Send cookies with requests
});
```

### 1.2. WebSocket CORS

**File:** `packages/backend/src/gateway/redis-io.adapter.ts`

```typescript
createIOServer(port: number, options?: ServerOptions): any {
  const server: Server = super.createIOServer(port, {
    ...options,
    cors: {
      origin: true,      // Allow all origins (development)
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Custom CORS middleware for widget validation
  server.use(async (socket, next) => {
    const origin = socket.handshake.headers.origin;

    // Allow main frontend app
    if (origin === this.configService.get('FRONTEND_URL')) {
      this.logger.log(`Allowing origin (frontend): ${origin}`);
      return next();
    }

    // For widgets, validate against project whitelist
    await this.validateWidgetOrigin(socket, next);
  });

  return server;
}
```

## 2. Domain Whitelisting (Widget Security)

### 2.1. Project Whitelist

**Database Schema:**

```typescript
@Entity()
export class Project {
  @Column("simple-array", { nullable: true })
  whitelistedDomains: string[]; // ['example.com', 'app.example.com']
}
```

**Setting whitelist:**

```typescript
// Frontend: Project settings
async updateProject(projectId: number, data: UpdateProjectDto) {
  return api.patch(`/projects/${projectId}`, {
    whitelistedDomains: ['example.com', 'shop.example.com'],
  });
}
```

### 2.2. Origin Validation

**File:** `packages/backend/src/gateway/redis-io.adapter.ts`

```typescript
server.use(async (socket, next) => {
  const origin = socket.handshake.headers.origin;

  // Main frontend - always allow
  if (origin === frontendUrl) {
    logger.log(`Allowing origin (frontend): ${origin}`);
    return next();
  }

  // Widget origin validation
  if (!origin) {
    return next(new Error("Origin header is missing"));
  }

  const projectId = socket.handshake.query.projectId;
  if (!projectId || typeof projectId !== "string") {
    return next(new Error("Project ID is missing or invalid"));
  }

  // Get project from database
  const project = await projectService.findByProjectId(+projectId);
  if (!project) {
    return next(new Error(`Project with ID ${projectId} not found`));
  }

  // Check whitelist
  if (!project.whitelistedDomains || project.whitelistedDomains.length === 0) {
    logger.warn(
      `Project ${projectId} has no whitelisted domains. WS connection denied.`
    );
    return next(new Error("Not allowed by CORS"));
  }

  // Extract hostname from origin
  const originUrl = new URL(origin);
  const originDomain = originUrl.hostname;

  // Check if origin is whitelisted
  if (project.whitelistedDomains.includes(originDomain)) {
    logger.log(`Allowing WS connection from origin (widget): ${origin}`);
    return next();
  }

  logger.warn(
    `Origin ${origin} not in whitelist for project ${projectId}. Blocked.`
  );
  return next(new Error("Not allowed by CORS"));
});
```

**Security benefits:**

1. **Prevent unauthorized embedding:** Chỉ domains được phê duyệt mới nhúng widget
2. **Protect API quota:** Ngăn abuse từ domains khác
3. **Data isolation:** Mỗi project chỉ nhận data từ domains của mình
4. **Audit trail:** Log tất cả connection attempts

### 2.3. Widget Embedding Example

**HTML:**

```html
<!-- Only works if example.com is whitelisted for projectId=123 -->
<script>
  (function () {
    const script = document.createElement("script");
    script.src = "https://cdn.example.com/widget.js";
    script.setAttribute("data-project-id", "123");
    document.body.appendChild(script);
  })();
</script>
```

**Widget connection:**

```typescript
// File: packages/frontend/src/widget/services/socketService.ts
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '');

public connect(projectId: string, visitorUid: string): void {
  const socketUrlWithParams = `${SOCKET_URL}?projectId=${projectId}`;

  this.socket = io(socketUrlWithParams, {
    // Origin header automatically set by browser
    transports: ['websocket', 'polling'],
  });
}
```

## 3. Rate Limiting & Throttling

### 3.1. Infrastructure Setup

**File:** `packages/backend/src/app.module.ts`

```typescript
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";

@Module({
  imports: [
    // Currently commented out, but ready to enable
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 20, // 20 requests per 60 seconds
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Apply globally
    },
  ],
})
export class AppModule {}
```

### 3.2. Endpoint-Specific Limits

**File:** `packages/backend/src/auth/auth.controller.ts`

```typescript
import { Throttle } from "@nestjs/throttler";

@Controller("auth")
export class AuthController {
  // Login endpoint - 5 attempts per minute
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("login")
  async login(@Request() req) {
    // ...
  }

  // Registration - 5 per 5 minutes
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    // ...
  }

  // Password reset - 3 per 15 minutes
  @Throttle({ default: { limit: 3, ttl: 900000 } })
  @Post("forgot-password")
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    // ...
  }
}
```

**Project invitations:**

```typescript
// File: packages/backend/src/projects/project.controller.ts
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post(':id/invite')
async inviteToProject() {
  // Prevent spam invitations
}
```

### 3.3. Custom Rate Limiting

**Per-user rate limiting:**

```typescript
import { Injectable, ExecutionContext } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Rate limit per user instead of per IP
    return req.user?.id || req.ip;
  }
}
```

**Per-project rate limiting:**

```typescript
@Injectable()
export class ProjectThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return `project:${req.params.projectId}`;
  }
}
```

## 4. Input Validation

### 4.1. Class Validator

**Global validation pipe:**

```typescript
// File: packages/backend/src/main.ts
app.useGlobalPipes(new ValidationPipe());
```

**DTO Example:**

```typescript
// File: packages/shared/src/register.dto.ts
import { IsEmail, IsNotEmpty, MinLength, MaxLength } from "class-validator";

export class RegisterDto {
  @IsEmail({}, { message: "Email không hợp lệ" })
  @IsNotEmpty({ message: "Email không được để trống" })
  email: string;

  @IsNotEmpty({ message: "Mật khẩu không được để trống" })
  @MinLength(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" })
  @MaxLength(100, { message: "Mật khẩu quá dài" })
  password: string;

  @IsNotEmpty({ message: "Họ tên không được để trống" })
  @MinLength(2, { message: "Họ tên phải có ít nhất 2 ký tự" })
  @MaxLength(100, { message: "Họ tên quá dài" })
  fullName: string;
}
```

**Custom validators:**

```typescript
import { registerDecorator, ValidationOptions } from "class-validator";

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isStrongPassword",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== "string") return false;
          return (
            value.length >= 8 &&
            /[a-z]/.test(value) &&
            /[A-Z]/.test(value) &&
            /\d/.test(value) &&
            /[^a-zA-Z\d]/.test(value)
          );
        },
        defaultMessage() {
          return "Password must contain uppercase, lowercase, number, and special character";
        },
      },
    });
  };
}

// Usage
export class ChangePasswordDto {
  @IsStrongPassword()
  newPassword: string;
}
```

### 4.2. Sanitization

**XSS Prevention:**

```typescript
import { Transform } from "class-transformer";
import * as sanitizeHtml from "sanitize-html";

export class SendMessageDto {
  @Transform(({ value }) =>
    sanitizeHtml(value, {
      allowedTags: [], // Strip all HTML tags
      allowedAttributes: {},
    })
  )
  content: string;
}
```

**SQL Injection Prevention:**

- ✅ **Sử dụng TypeORM với parameterized queries**
- ✅ **Không string concatenation trong queries**
- ✅ **Validate input types**

```typescript
// GOOD - Parameterized
await this.userRepository.findOne({
  where: { email: userInput }, // Safe
});

// BAD - String concatenation
await this.entityManager.query(
  `SELECT * FROM users WHERE email = '${userInput}'` // Vulnerable!
);
```

### 4.3. File Upload Validation

**Future implementation:**

```typescript
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Post('upload')
@UseInterceptors(FileInterceptor('file', {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const randomName = crypto.randomBytes(16).toString('hex');
      cb(null, `${randomName}-${file.originalname}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Invalid file type'), false);
    }
  },
}))
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  // Process file
}
```

## 5. Error Handling

### 5.1. Không lộ thông tin nhạy cảm

**BAD - Lộ chi tiết:**

```typescript
catch (error) {
  throw new InternalServerErrorException(error.message);
  // Could expose: "Cannot connect to database at 192.168.1.100:5432"
}
```

**GOOD - Generic message:**

```typescript
catch (error) {
  this.logger.error('Database error', error.stack);
  throw new InternalServerErrorException('An error occurred');
}
```

### 5.2. Custom Exception Filters

**File:** `packages/backend/src/common/filters/http-exception.filter.ts` (planned)

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    // Log full error internally
    console.error("Exception:", {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: exception.message,
      stack: exception.stack,
    });

    // Send safe error to client
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: this.getSafeMessage(exception),
    });
  }

  private getSafeMessage(exception: HttpException): string {
    const response = exception.getResponse();
    if (typeof response === "object" && "message" in response) {
      return response.message;
    }
    // Default safe message
    return "An error occurred";
  }
}
```

### 5.3. Error Codes

**Custom error codes:**

```typescript
throw new UnauthorizedException({
  message: "2FA required",
  errorCode: "2FA_REQUIRED", // Machine-readable
});

throw new BadRequestException({
  message: "Mật khẩu hiện tại là bắt buộc",
  errorCode: "CURRENT_PASSWORD_REQUIRED",
});

throw new UnauthorizedException({
  message: "Token has been revoked",
  errorCode: "TOKEN_REVOKED",
});
```

**Frontend handling:**

```typescript
// File: packages/frontend/src/lib/api.ts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorCode = error.response?.data?.errorCode;

    if (errorCode === "2FA_REQUIRED") {
      // Redirect to 2FA page
      navigate("/auth/2fa");
    } else if (errorCode === "TOKEN_REVOKED") {
      // Force re-login
      authStore.logout();
    }

    return Promise.reject(error);
  }
);
```

## 6. Logging & Monitoring

### 6.1. Request Logging

**File:** `packages/backend/src/common/middleware/logger.middleware.ts`

```typescript
import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger("HTTP");

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get("user-agent") || "";

    res.on("finish", () => {
      const { statusCode } = res;
      const contentLength = res.get("content-length");

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${ip}`
      );
    });

    next();
  }
}
```

**Usage:**

```typescript
// File: packages/backend/src/main.ts
const logger = new LoggerMiddleware();
app.use(logger.use.bind(logger));
```

### 6.2. Security Event Logging

**Authentication events:**

```typescript
// File: packages/backend/src/auth/auth.service.ts
this.logger.log(`✅ User registered: ${newUser.email}`);
this.logger.log(`✅ User logged in: ${user.email} from IP: ${ipAddress}`);
this.logger.error(`❌ Login failed for email: ${email}`);
this.logger.warn(`⚠️ Multiple failed login attempts for: ${email}`);
```

**Authorization events:**

```typescript
this.logger.warn(
  `Unauthorized access attempt to project ${projectId} by user ${userId}`
);
this.logger.log(`User ${userId} invited to project ${projectId}`);
```

**WebSocket events:**

```typescript
// File: packages/backend/src/gateway/events.gateway.ts
this.logger.log(`Client connected: ${client.id}`);
this.logger.log(`User ${user.email} joined conversation ${conversationId}`);
this.logger.warn(`Origin ${origin} not in whitelist for project ${projectId}`);
```

### 6.3. Structured Logging (Recommended)

**Winston logger:**

```typescript
import * as winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "live-chat-api" },
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Production: send to log aggregation service
if (process.env.NODE_ENV === "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// Usage
logger.info("User login", { userId, email, ip });
logger.error("Database error", { error: error.message, stack: error.stack });
```

## 7. Security Headers (Planned)

### 7.1. Helmet.js

**Installation:**

```bash
npm install helmet
```

**Usage:**

```typescript
// File: packages/backend/src/main.ts
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  await app.listen(3000);
}
```

**Headers added:**

- `Strict-Transport-Security`: Force HTTPS
- `X-Content-Type-Options`: Prevent MIME sniffing
- `X-Frame-Options`: Prevent clickjacking
- `X-XSS-Protection`: Enable XSS filter
- `Content-Security-Policy`: Restrict resource loading

### 7.2. CORS Headers

```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

## 8. Request Size Limits

### 8.1. Body Parser Limits

```typescript
// File: packages/backend/src/main.ts
import { json } from "body-parser";

app.use(json({ limit: "10mb" })); // Max 10MB JSON payload
```

### 8.2. Per-endpoint limits

```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file', {
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB
    files: 1,
  },
}))
async uploadFile() {}
```

## 9. API Versioning

### 9.1. URL Versioning

```typescript
// File: packages/backend/src/main.ts
app.setGlobalPrefix("api/v1");
```

**Endpoints:**

- `https://api.example.com/api/v1/auth/login`
- `https://api.example.com/api/v1/projects`

**Benefits:**

- Backward compatibility
- Gradual migration
- Clear deprecation path

### 9.2. Version Migration

```typescript
// v1 (deprecated but still supported)
@Controller("api/v1/projects")
export class ProjectsV1Controller {}

// v2 (current)
@Controller("api/v2/projects")
export class ProjectsV2Controller {}
```

## 10. WebSocket-Specific Security

### 10.1. Namespace Isolation

```typescript
@WebSocketGateway({
  namespace: "/inbox", // Separate namespace for inbox
  cors: { origin: true },
})
export class InboxGateway {}

@WebSocketGateway({
  namespace: "/widget", // Separate for widgets
  cors: { origin: true },
})
export class WidgetGateway {}
```

### 10.2. Room-based Authorization

```typescript
@SubscribeMessage('joinConversation')
async handleJoinConversation(
  @MessageBody() data: { conversationId: number },
  @ConnectedSocket() client: Socket
) {
  const user = client.data.user;

  // Verify user has access to conversation
  const conversation = await this.conversationService.findOne(data.conversationId);
  await this.projectService.checkProjectRole(
    user.id,
    conversation.projectId,
    [ProjectRole.AGENT]
  );

  // Join room
  client.join(`conversation:${data.conversationId}`);

  // Emit only to this room
  this.server.to(`conversation:${data.conversationId}`).emit('message', {});
}
```

### 10.3. Connection Limits

```typescript
private connections = new Map<string, number>();

handleConnection(client: Socket) {
  const userId = client.data.user?.id;

  const current = this.connections.get(userId) || 0;
  if (current >= 5) {
    client.disconnect();
    this.logger.warn(`Too many connections for user ${userId}`);
    return;
  }

  this.connections.set(userId, current + 1);
}

handleDisconnect(client: Socket) {
  const userId = client.data.user?.id;
  const current = this.connections.get(userId) || 0;
  this.connections.set(userId, Math.max(0, current - 1));
}
```

## 11. API Documentation Security

### 11.1. Swagger/OpenAPI

**Don't expose in production:**

```typescript
if (process.env.NODE_ENV !== "production") {
  const config = new DocumentBuilder()
    .setTitle("Live Chat API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api-docs", app, document);
}
```

### 11.2. Authentication for docs

```typescript
SwaggerModule.setup("api-docs", app, document, {
  swaggerOptions: {
    authAction: {
      bearer: {
        name: "bearer",
        schema: { type: "http", in: "header", scheme: "bearer" },
        value: "Bearer <token>",
      },
    },
  },
});
```

## 12. Kết luận

API & WebSocket security được thiết kế với:

✅ **CORS protection:** Configurable origins
✅ **Domain whitelist:** Widget embedding control
✅ **Rate limiting:** Ready to enable (throttler)
✅ **Input validation:** Class-validator DTOs
✅ **Error handling:** Safe error messages
✅ **Logging:** Comprehensive security events
✅ **WebSocket auth:** Dual-mode (auth + widget)
✅ **Room isolation:** Conversation-level access control

**Cần cải thiện:**

1. Enable rate limiting in production
2. Add Helmet.js security headers
3. Implement request size limits
4. Add API versioning strategy
5. Set up log aggregation (ELK stack)
6. Add DDoS protection (CloudFlare)
7. Implement API key rotation
8. Add GraphQL security (if using)
