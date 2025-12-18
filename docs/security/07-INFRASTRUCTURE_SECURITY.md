# Bảo mật Infrastructure & DevOps

## Tổng quan

Infrastructure security bảo vệ toàn bộ hệ thống từ môi trường phát triển đến production, bao gồm:

- **Environment Separation**
- **Secrets Management**
- **CI/CD Security**
- **Container Security**
- **Network Security**
- **Monitoring & Incident Response**

## 1. Environment Configuration

### 1.1. Environment Variables

**File:** `.env` (Development - NOT in Git)

```bash
# Node Environment
NODE_ENV=development

# Server
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database
PSQL_HOST=localhost
PSQL_PORT=5432
PSQL_USER=postgres
PSQL_PASSWORD=your_password_here
PSQL_DATABASE=live_chat

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secrets (32+ characters, random)
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret_key_here_min_32_chars
JWT_REFRESH_EXPIRES_IN=30d

# 2FA
TWO_FACTOR_AUTH_JWT_SECRET=your_2fa_secret_here_min_32_chars
TWO_FACTOR_AUTH_JWT_EXPIRES_IN=5m

# Encryption (MUST be exactly 32 characters)
ENCRYPTION_KEY=12345678901234567890123456789012

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@example.com
SENDGRID_FROM_NAME=Live Chat
```

**Production .env:**

```bash
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://app.example.com

# Use secrets manager instead of .env in production
# These are placeholders
PSQL_PASSWORD={{SECRETS_MANAGER}}
JWT_SECRET={{SECRETS_MANAGER}}
ENCRYPTION_KEY={{SECRETS_MANAGER}}
```

### 1.2. .gitignore

```gitignore
# Environment variables
.env
.env.local
.env.development
.env.production

# Secrets
*.pem
*.key
*.crt
secrets/

# Dependencies
node_modules/

# Build outputs
dist/
build/

# Logs
*.log
logs/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
```

### 1.3. Config Validation

**File:** `packages/backend/src/config/config.validation.ts`

```typescript
import * as Joi from "joi";

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),

  PORT: Joi.number().default(3000),

  PSQL_HOST: Joi.string().required(),
  PSQL_PORT: Joi.number().default(5432),
  PSQL_USER: Joi.string().required(),
  PSQL_PASSWORD: Joi.string().required(),
  PSQL_DATABASE: Joi.string().required(),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),

  ENCRYPTION_KEY: Joi.string().length(32).required(),

  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
});
```

**Usage:**

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      validationOptions: {
        abortEarly: false, // Show all errors
      },
    }),
  ],
})
export class AppModule {}
```

## 2. Secrets Management

### 2.1. Development (Local)

**Use .env file:**

- Store in `.env` (gitignored)
- Use `dotenv` or `@nestjs/config`
- Never commit to Git

### 2.2. Production (Secrets Manager)

**AWS Secrets Manager:**

```typescript
// config.service.ts
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

@Injectable()
export class SecretService {
  private client = new SecretsManagerClient({ region: "us-east-1" });

  async getSecret(secretName: string): Promise<string> {
    try {
      const response = await this.client.send(
        new GetSecretValueCommand({ SecretId: secretName })
      );
      return response.SecretString!;
    } catch (error) {
      console.error(`Failed to retrieve secret ${secretName}`, error);
      throw error;
    }
  }

  async getJwtSecret(): Promise<string> {
    if (process.env.NODE_ENV === "production") {
      return await this.getSecret("prod/jwt-secret");
    }
    return process.env.JWT_SECRET!;
  }
}
```

**HashiCorp Vault:**

```typescript
import * as vault from "node-vault";

const vaultClient = vault({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

async function getSecret(path: string): Promise<string> {
  const result = await vaultClient.read(path);
  return result.data.value;
}
```

### 2.3. Secret Rotation

**Automated rotation (AWS Lambda example):**

```typescript
export async function rotateSecret(event: any) {
  const { SecretId, Token, Step } = event;

  if (Step === "createSecret") {
    // Generate new secret
    const newSecret = crypto.randomBytes(32).toString("hex");

    // Store in Secrets Manager
    await secretsManager.putSecretValue({
      SecretId,
      ClientRequestToken: Token,
      SecretString: newSecret,
      VersionStages: ["AWSPENDING"],
    });
  } else if (Step === "setSecret") {
    // Update application to use new secret
    // This is application-specific
  } else if (Step === "testSecret") {
    // Test new secret works
    // Validate database connection, API calls, etc.
  } else if (Step === "finishSecret") {
    // Mark new secret as current
    await secretsManager.updateSecretVersionStage({
      SecretId,
      VersionStage: "AWSCURRENT",
      MoveToVersionId: Token,
      RemoveFromVersionId: "AWSPENDING",
    });
  }
}
```

## 3. Docker Security

### 3.1. Dockerfile Best Practices

**File:** `packages/backend/Dockerfile`

```dockerfile
# Use specific version (not latest)
FROM node:20.11.0-alpine AS base

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy dependency files first (better caching)
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies (production only)
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY --chown=nestjs:nodejs packages/backend ./packages/backend
COPY --chown=nestjs:nodejs packages/shared ./packages/shared

# Build application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "dist/main.js"]
```

**Security best practices:**

- ✅ Use specific versions (not `latest`)
- ✅ Run as non-root user
- ✅ Multi-stage builds to reduce image size
- ✅ Only copy necessary files
- ✅ Remove dev dependencies
- ✅ Use `.dockerignore`
- ✅ Scan for vulnerabilities

### 3.2. .dockerignore

```
node_modules
npm-debug.log
.env
.env.*
.git
.gitignore
README.md
.vscode
.idea
dist
coverage
*.log
```

### 3.3. Docker Compose Security

**File:** `packages/backend/compose.yaml`

```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
    env_file:
      - .env # Use secrets manager in production
    networks:
      - app-network
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

    # Security options
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    read_only: true
    tmpfs:
      - /tmp

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - app-network
    restart: unless-stopped

secrets:
  db_password:
    file: ./secrets/db_password.txt

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### 3.4. Container Scanning

```bash
# Scan Docker image for vulnerabilities
docker scan live-chat-backend:latest

# Using Trivy
trivy image live-chat-backend:latest

# Using Snyk
snyk container test live-chat-backend:latest
```

## 4. CI/CD Security

### 4.1. GitHub Actions Workflow

**File:** `.github/workflows/ci.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: "20"

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: "fs"
          scan-ref: "."
          format: "sarif"
          output: "trivy-results.sarif"

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: "trivy-results.sarif"

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test:cov

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  build:
    needs: [security-scan, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t live-chat-backend:${{ github.sha }} .

      - name: Scan Docker image
        run: |
          docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
            aquasec/trivy image live-chat-backend:${{ github.sha }}

      - name: Push to registry
        if: github.ref == 'refs/heads/main'
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker tag live-chat-backend:${{ github.sha }} myregistry/live-chat-backend:latest
          docker push myregistry/live-chat-backend:latest

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /app
            docker-compose pull
            docker-compose up -d
            docker system prune -f
```

### 4.2. GitHub Secrets

**Required secrets:**

```
DOCKER_USERNAME
DOCKER_PASSWORD
PROD_HOST
PROD_USER
PROD_SSH_KEY
DATABASE_URL
JWT_SECRET
ENCRYPTION_KEY
GOOGLE_CLIENT_SECRET
SENDGRID_API_KEY
```

**Setting secrets:**

```bash
# Via GitHub CLI
gh secret set JWT_SECRET -b"your-secret-here"

# Via UI: Settings → Secrets and variables → Actions → New repository secret
```

### 4.3. Dependabot

**File:** `.github/dependabot.yml`

```yaml
version: 2
updates:
  # Backend dependencies
  - package-ecosystem: npm
    directory: "/packages/backend"
    schedule:
      interval: weekly
    open-pull-requests-limit: 10
    reviewers:
      - "security-team"
    labels:
      - "dependencies"
      - "security"

  # Frontend dependencies
  - package-ecosystem: npm
    directory: "/packages/frontend"
    schedule:
      interval: weekly
    open-pull-requests-limit: 10

  # Docker
  - package-ecosystem: docker
    directory: "/packages/backend"
    schedule:
      interval: weekly

  # GitHub Actions
  - package-ecosystem: github-actions
    directory: "/"
    schedule:
      interval: weekly
```

## 5. Network Security

### 5.1. Firewall Rules

**UFW (Ubuntu):**

```bash
# Default deny
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change port if using non-standard)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow from specific IPs only (internal services)
sudo ufw allow from 10.0.1.0/24 to any port 5432  # PostgreSQL
sudo ufw allow from 10.0.1.0/24 to any port 6379  # Redis

# Enable firewall
sudo ufw enable
```

### 5.2. Reverse Proxy (Nginx)

**File:** `/etc/nginx/sites-available/live-chat`

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

# Upstream
upstream backend {
  server localhost:3000;
  keepalive 32;
}

server {
  listen 443 ssl http2;
  server_name api.example.com;

  # SSL Configuration
  ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  # HSTS
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

  # Security headers
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "no-referrer-when-downgrade" always;

  # Rate limiting
  limit_req zone=api_limit burst=20 nodelay;
  limit_conn conn_limit 10;

  # Request size limits
  client_max_body_size 10M;
  client_body_buffer_size 128k;

  # Proxy configuration
  location /api/v1 {
    proxy_pass http://backend;
    proxy_http_version 1.1;

    # Headers
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Caching
    proxy_cache_bypass $http_upgrade;
  }

  # WebSocket
  location /socket.io {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}

# Redirect HTTP to HTTPS
server {
  listen 80;
  server_name api.example.com;
  return 301 https://$server_name$request_uri;
}
```

### 5.3. DDoS Protection

**CloudFlare setup:**

```
1. Add domain to CloudFlare
2. Update DNS records to proxy through CloudFlare
3. Enable "Under Attack" mode if needed
4. Configure WAF rules
5. Enable rate limiting
6. Enable bot protection
```

**CloudFlare Page Rules:**

```
URL Pattern: api.example.com/api/v1/auth/*
Settings:
  - Security Level: High
  - Challenge Passage: 30 minutes
  - Browser Integrity Check: On

URL Pattern: api.example.com/api/v1/*
Settings:
  - Rate Limiting: 100 requests per minute
```

## 6. Monitoring & Logging

### 6.1. Application Logging

**Winston Logger:**

```typescript
// logger.config.ts
import * as winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: "live-chat-api",
    environment: process.env.NODE_ENV,
  },
  transports: [
    // Console (development)
    new winston.transports.Console({
      format: winston.format.simple(),
    }),

    // File (production)
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// Production: send to log aggregation
if (process.env.NODE_ENV === "production") {
  // Add DataDog transport
  logger.add(
    new DatadogTransport({
      apiKey: process.env.DATADOG_API_KEY,
      service: "live-chat-api",
    })
  );
}
```

### 6.2. Metrics Collection

**Prometheus metrics:**

```typescript
// metrics.service.ts
import { Counter, Histogram, register } from "prom-client";

@Injectable()
export class MetricsService {
  private httpRequestDuration = new Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status_code"],
  });

  private httpRequestTotal = new Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"],
  });

  private authFailures = new Counter({
    name: "auth_failures_total",
    help: "Total number of authentication failures",
  });

  recordRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number
  ) {
    this.httpRequestTotal.inc({ method, route, status_code: statusCode });
    this.httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      duration
    );
  }

  recordAuthFailure() {
    this.authFailures.inc();
  }

  getMetrics() {
    return register.metrics();
  }
}
```

**Metrics endpoint:**

```typescript
@Controller("metrics")
export class MetricsController {
  @Get()
  async getMetrics(@Res() res: Response) {
    res.set("Content-Type", register.contentType);
    res.send(await register.metrics());
  }
}
```

### 6.3. Health Checks

```typescript
@Controller("health")
export class HealthController {
  constructor(private readonly db: DataSource, private readonly redis: Redis) {}

  @Get()
  async check() {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        memory: this.checkMemory(),
      },
    };

    const allHealthy = Object.values(health.checks).every(
      (c) => c.status === "ok"
    );
    return {
      ...health,
      status: allHealthy ? "ok" : "degraded",
    };
  }

  private async checkDatabase() {
    try {
      await this.db.query("SELECT 1");
      return { status: "ok" };
    } catch (error) {
      return { status: "error", message: error.message };
    }
  }

  private async checkRedis() {
    try {
      await this.redis.ping();
      return { status: "ok" };
    } catch (error) {
      return { status: "error", message: error.message };
    }
  }

  private checkMemory() {
    const usage = process.memoryUsage();
    const threshold = 1024 * 1024 * 1024; // 1GB

    return {
      status: usage.heapUsed < threshold ? "ok" : "warning",
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
    };
  }
}
```

## 7. Incident Response

### 7.1. Security Incident Playbook

**Detection:**

1. Monitor alerts (auth failures, unusual traffic)
2. Review logs regularly
3. Set up automated alerts

**Containment:**

1. Identify affected systems
2. Isolate compromised services
3. Block malicious IPs
4. Revoke compromised credentials

**Investigation:**

1. Collect logs and evidence
2. Identify attack vector
3. Assess damage
4. Document findings

**Recovery:**

1. Patch vulnerabilities
2. Restore from backups if needed
3. Reset passwords
4. Update security measures

**Post-Incident:**

1. Write incident report
2. Update security policies
3. Conduct team training
4. Improve monitoring

### 7.2. Backup & Disaster Recovery

**Backup strategy:**

```bash
# Daily database backups
0 2 * * * /scripts/backup-database.sh

# Weekly full system backup
0 3 * * 0 /scripts/backup-full.sh

# Replicate to off-site location
0 4 * * * /scripts/sync-backups.sh
```

**Recovery Time Objective (RTO):** 4 hours
**Recovery Point Objective (RPO):** 24 hours

## 8. Kết luận

Infrastructure security được thiết kế với:

✅ **Environment separation:** Dev/Staging/Production
✅ **Secrets management:** Env vars, secrets manager
✅ **Docker security:** Non-root, scanning, best practices
✅ **CI/CD security:** Automated testing, scanning, secrets
✅ **Network security:** Firewall, reverse proxy, DDoS protection
✅ **Monitoring:** Logging, metrics, health checks
✅ **Incident response:** Playbook, backups, recovery plan

**Cần cải thiện:**

1. Implement secrets manager (AWS/Vault)
2. Set up log aggregation (ELK/DataDog)
3. Enable DDoS protection (CloudFlare)
4. Implement WAF rules
5. Set up intrusion detection (IDS)
6. Add automated security scanning
7. Implement disaster recovery drills
8. Add infrastructure as code (Terraform)
