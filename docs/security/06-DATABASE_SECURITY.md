# Bảo mật Database & Data Access

## Tổng quan

Lớp bảo mật database là tầng quan trọng nhất trong việc bảo vệ dữ liệu, bao gồm:

- **SQL Injection Prevention**
- **Access Control**
- **Data Encryption**
- **Audit Logging**
- **Backup Security**
- **Connection Security**

## 1. SQL Injection Prevention

### 1.1. TypeORM Parameterized Queries

**File:** `packages/backend/src/user/user.service.ts`

**GOOD - Parameterized queries:**

```typescript
// TypeORM Repository pattern (SAFE)
async findOneByEmail(email: string): Promise<User | null> {
  return await this.userRepository.findOne({
    where: { email }  // Parameterized
  });
}

// Query Builder (SAFE)
async findUsersByRole(role: GlobalRole): Promise<User[]> {
  return await this.userRepository
    .createQueryBuilder('user')
    .where('user.role = :role', { role })  // Parameterized
    .getMany();
}
```

**BAD - String concatenation:**

```typescript
// VULNERABLE - Never do this!
async findUser(email: string) {
  return await this.entityManager.query(
    `SELECT * FROM users WHERE email = '${email}'`
    // SQL Injection: email = "' OR '1'='1"
  );
}
```

### 1.2. Input Validation

**DTO Validation:**

```typescript
import { IsEmail, IsUUID, IsInt, Min, Max } from "class-validator";

export class GetConversationsDto {
  @IsUUID("4", { message: "Invalid user ID format" })
  userId: string;

  @IsInt()
  @Min(1)
  projectId: number;

  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
```

**Database-level constraints:**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  -- Email format validated at app level
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}$')
);
```

### 1.3. TypeORM Entity Listeners

```typescript
@Entity()
export class User {
  @BeforeInsert()
  @BeforeUpdate()
  validateEmail() {
    // Additional validation
    if (!this.email.includes("@")) {
      throw new Error("Invalid email format");
    }
  }
}
```

## 2. Database Access Control

### 2.1. Connection Configuration

**File:** `packages/backend/src/app.module.ts`

```typescript
TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: "postgres",
    host: configService.get<string>("PSQL_HOST"),
    port: configService.get<number>("PSQL_PORT"),
    username: configService.get<string>("PSQL_USER"),
    password: configService.get<string>("PSQL_PASSWORD"),
    database: configService.get<string>("PSQL_DATABASE"),

    // Security settings
    ssl:
      configService.get("NODE_ENV") === "production"
        ? {
            rejectUnauthorized: true,
            ca: fs.readFileSync("/path/to/ca-cert.pem").toString(),
          }
        : false,

    // Connection pooling
    extra: {
      max: 20, // Max connections
      min: 5, // Min connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },

    // Never synchronize in production
    synchronize: false,

    // Use migrations
    migrations: ["dist/migrations/*.js"],
    migrationsRun: true,
  }),
});
```

### 2.2. Database User Permissions

**Production setup:**

```sql
-- Create application user with limited permissions
CREATE USER app_user WITH PASSWORD 'strong_password_here';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE live_chat TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Deny dangerous operations
REVOKE CREATE ON SCHEMA public FROM app_user;
REVOKE DROP ON ALL TABLES IN SCHEMA public FROM app_user;

-- Read-only user for reporting
CREATE USER readonly_user WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE live_chat TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
```

### 2.3. Row-Level Security (RLS)

**PostgreSQL RLS:**

```sql
-- Enable RLS on sensitive tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see projects they're members of
CREATE POLICY project_member_policy ON projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
        AND project_members.user_id = current_user_id()
    )
  );

-- Policy: Only project managers can update
CREATE POLICY project_manager_policy ON projects
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
        AND project_members.user_id = current_user_id()
        AND project_members.role = 'manager'
    )
  );
```

**Application-level (current implementation):**

```typescript
// File: packages/backend/src/projects/project.service.ts
async checkProjectAccess(userId: string, projectId: number): Promise<boolean> {
  const member = await this.projectMemberRepository.findOne({
    where: { userId, projectId }
  });

  if (!member) {
    throw new ForbiddenException('Access denied');
  }

  return true;
}
```

## 3. Data Encryption at Rest

### 3.1. Column-Level Encryption

**Encrypted columns:**

```typescript
@Entity()
export class UserIdentity {
  @Column({ type: "text", nullable: true })
  @Transformer({
    to: (value: string) => encryptionService.encrypt(value),
    from: (value: string) => encryptionService.decrypt(value),
  })
  accessToken?: string;

  @Column({ type: "text", nullable: true })
  @Transformer({
    to: (value: string | null) =>
      value ? encryptionService.encrypt(value) : null,
    from: (value: string | null) =>
      value ? encryptionService.decrypt(value) : null,
  })
  refreshToken?: string;
}
```

### 3.2. Transparent Data Encryption (TDE)

**PostgreSQL pgcrypto extension:**

```sql
-- Enable encryption extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive columns
CREATE TABLE user_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  encrypted_ssn BYTEA,
  encrypted_credit_card BYTEA,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert with encryption
INSERT INTO user_secrets (user_id, encrypted_ssn)
VALUES (
  'user-uuid',
  pgp_sym_encrypt('123-45-6789', 'encryption_key')
);

-- Query with decryption
SELECT
  user_id,
  pgp_sym_decrypt(encrypted_ssn, 'encryption_key') as ssn
FROM user_secrets
WHERE user_id = 'user-uuid';
```

### 3.3. Hashed Storage

**Passwords (bcrypt):**

```typescript
@Entity()
export class User {
  @Column({ type: "varchar", length: 60, nullable: true })
  passwordHash: string; // Never store plaintext
}

// Hashing
user.passwordHash = await bcrypt.hash(password, 12);

// Verification
const isValid = await bcrypt.compare(password, user.passwordHash);
```

**Refresh Tokens:**

```typescript
@Entity()
export class RefreshToken {
  @Column({ type: "varchar", length: 60 })
  tokenHash: string; // Hash before storing
}

// Hashing
const tokenHash = await bcrypt.hash(refreshToken, 10);

// Verification
const isValid = await bcrypt.compare(refreshToken, token.tokenHash);
```

## 4. Database Migrations

### 4.1. Migration Security

**File:** `packages/backend/src/migrations/*.ts`

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(60),
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        is_email_verified BOOLEAN NOT NULL DEFAULT false,
        tokens_valid_from TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      -- Indexes for performance
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_role ON users(role);
      
      -- Constraints
      ALTER TABLE users ADD CONSTRAINT email_format 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z]{2,}$');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE;`);
  }
}
```

**Best practices:**

- ✅ Version control migrations
- ✅ Test migrations on staging first
- ✅ Never modify existing migrations
- ✅ Include rollback (down) logic
- ✅ Add constraints in migrations

### 4.2. Seeding (Development Only)

```typescript
import { Seeder } from "typeorm-extension";
import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";

export default class UserSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    // ONLY for development/testing
    if (process.env.NODE_ENV === "production") {
      throw new Error("Cannot seed in production!");
    }

    const repository = dataSource.getRepository(User);

    await repository.insert({
      email: "admin@example.com",
      passwordHash: await bcrypt.hash("admin123", 12),
      fullName: "Admin User",
      role: GlobalRole.ADMIN,
      isEmailVerified: true,
    });
  }
}
```

## 5. Query Optimization & Security

### 5.1. Prevent N+1 Queries

**BAD - N+1 problem:**

```typescript
// Fetches conversations first, then projects one by one
async getConversations() {
  const conversations = await this.conversationRepository.find();

  for (const conv of conversations) {
    conv.project = await this.projectRepository.findOne({
      where: { id: conv.projectId }
    });
  }

  return conversations;
}
```

**GOOD - Eager loading:**

```typescript
async getConversations() {
  return await this.conversationRepository.find({
    relations: ['project', 'assignedAgent'],  // Join in single query
  });
}
```

### 5.2. Pagination

```typescript
async getConversations(
  projectId: number,
  page: number = 1,
  limit: number = 20
): Promise<{ data: Conversation[]; total: number }> {
  // Validate limits
  if (limit > 100) {
    throw new BadRequestException('Limit cannot exceed 100');
  }

  const [data, total] = await this.conversationRepository.findAndCount({
    where: { projectId },
    take: limit,
    skip: (page - 1) * limit,
    order: { createdAt: 'DESC' },
  });

  return { data, total };
}
```

### 5.3. Query Timeout

```typescript
// TypeORM configuration
extra: {
  statement_timeout: 30000,  // 30 seconds max query time
}

// Or per-query
async longRunningQuery() {
  await this.entityManager.query('SET statement_timeout = 60000');  // 60s
  const result = await this.repository.find({ ... });
  await this.entityManager.query('RESET statement_timeout');
  return result;
}
```

## 6. Connection Security

### 6.1. SSL/TLS Encryption

**Development:**

```typescript
ssl: false;
```

**Production:**

```typescript
ssl: {
  rejectUnauthorized: true,
  ca: fs.readFileSync('/path/to/ca-certificate.crt').toString(),
  cert: fs.readFileSync('/path/to/client-cert.crt').toString(),
  key: fs.readFileSync('/path/to/client-key.key').toString(),
}
```

**PostgreSQL server config:**

```conf
# postgresql.conf
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'
ssl_ca_file = '/path/to/ca.crt'
```

### 6.2. Connection Pooling

```typescript
extra: {
  max: 20,              // Maximum connections
  min: 5,               // Minimum connections
  idleTimeoutMillis: 30000,     // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Timeout acquiring connection
  maxUses: 7500,        // Recycle connection after N uses
}
```

**Benefits:**

- Prevent connection exhaustion
- Improve performance
- Automatic cleanup
- Connection recycling

### 6.3. Network Security

**Firewall rules:**

```bash
# Allow only application servers
sudo ufw allow from 10.0.1.0/24 to any port 5432

# Deny all other traffic
sudo ufw deny 5432
```

**PostgreSQL pg_hba.conf:**

```conf
# TYPE  DATABASE  USER      ADDRESS       METHOD
hostssl all       app_user  10.0.1.0/24   md5
hostssl all       all       127.0.0.1/32  md5
```

## 7. Audit Logging

### 7.1. Application-Level Logging

```typescript
@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  action: string; // 'CREATE', 'UPDATE', 'DELETE'

  @Column()
  entityType: string; // 'User', 'Project', 'Message'

  @Column()
  entityId: string;

  @Column("jsonb", { nullable: true })
  changes: any; // Old vs new values

  @Column()
  ipAddress: string;

  @Column()
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

**Usage:**

```typescript
async updateProject(projectId: number, userId: string, updateDto: UpdateProjectDto) {
  const project = await this.projectRepository.findOne({ where: { id: projectId } });
  const oldValues = { ...project };

  // Update
  Object.assign(project, updateDto);
  await this.projectRepository.save(project);

  // Log audit
  await this.auditLogRepository.save({
    userId,
    action: 'UPDATE',
    entityType: 'Project',
    entityId: projectId.toString(),
    changes: {
      before: oldValues,
      after: project,
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  return project;
}
```

### 7.2. Database-Level Logging

**PostgreSQL:**

```conf
# postgresql.conf
logging_collector = on
log_destination = 'csvlog'
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'mod'  # Log all modifications (INSERT/UPDATE/DELETE)
log_duration = on
log_min_duration_statement = 1000  # Log queries > 1s
```

**Analyze logs:**

```bash
# Find slow queries
grep "duration:" /var/log/postgresql/postgresql.log | sort -t: -k2 -n

# Find failed login attempts
grep "FATAL" /var/log/postgresql/postgresql.log
```

## 8. Backup Security

### 8.1. Automated Backups

**Backup script:**

```bash
#!/bin/bash
# backup.sh

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/postgresql"
DB_NAME="live_chat"

# Create backup with encryption
pg_dump -U postgres $DB_NAME | \
  gzip | \
  openssl enc -aes-256-cbc -salt -pbkdf2 -pass file:/path/to/encryption.key \
  > "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz.enc"

# Verify backup
if [ $? -eq 0 ]; then
  echo "Backup successful: backup_$TIMESTAMP.sql.gz.enc"

  # Delete backups older than 30 days
  find $BACKUP_DIR -name "backup_*.sql.gz.enc" -mtime +30 -delete
else
  echo "Backup failed!" >&2
  exit 1
fi
```

**Restore:**

```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1

# Decrypt and restore
openssl enc -aes-256-cbc -d -pbkdf2 -pass file:/path/to/encryption.key \
  -in $BACKUP_FILE | \
  gunzip | \
  psql -U postgres live_chat
```

### 8.2. Backup Storage

**Best practices:**

- ✅ **Encrypt backups** before storing
- ✅ **Store off-site** (S3, Azure Blob)
- ✅ **Test restores** regularly
- ✅ **Retention policy** (30 days, 90 days, etc.)
- ✅ **Access control** on backup files
- ✅ **Separate credentials** for backups

**AWS S3 upload:**

```bash
# Upload encrypted backup to S3
aws s3 cp $BACKUP_FILE s3://my-backups/postgresql/ \
  --storage-class GLACIER \
  --sse AES256
```

### 8.3. Point-in-Time Recovery

**PostgreSQL WAL archiving:**

```conf
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /archive/%f && cp %p /archive/%f'
```

## 9. Monitoring & Alerting

### 9.1. Query Performance Monitoring

**pg_stat_statements extension:**

```sql
-- Enable extension
CREATE EXTENSION pg_stat_statements;

-- View slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 9.2. Connection Monitoring

```sql
-- Active connections
SELECT
  datname,
  usename,
  application_name,
  client_addr,
  state,
  query
FROM pg_stat_activity
WHERE state != 'idle';

-- Max connections check
SELECT
  count(*) as current_connections,
  current_setting('max_connections')::int as max_connections
FROM pg_stat_activity;
```

### 9.3. Alerts

**Monitoring setup:**

```typescript
// Check database health
async checkDatabaseHealth() {
  try {
    await this.entityManager.query('SELECT 1');
    return { status: 'healthy' };
  } catch (error) {
    // Alert ops team
    this.alertService.sendAlert('Database connection failed', error);
    throw error;
  }
}
```

## 10. Data Retention & Deletion

### 10.1. Soft Delete

```typescript
@Entity()
export class User {
  @DeleteDateColumn()
  deletedAt?: Date; // Soft delete timestamp
}

// Soft delete
await this.userRepository.softDelete(userId);

// Find including deleted
await this.userRepository.find({ withDeleted: true });

// Permanently delete
await this.userRepository.delete(userId);
```

### 10.2. GDPR Compliance

```typescript
async deleteUserData(userId: string) {
  await this.entityManager.transaction(async manager => {
    // Delete user
    await manager.delete(User, userId);

    // Delete related data
    await manager.delete(RefreshToken, { userId });
    await manager.delete(UserIdentity, { userId });
    await manager.delete(ProjectMember, { userId });

    // Anonymize messages (can't delete - business requirement)
    await manager.update(Message,
      { sender: { type: 'agent', id: userId } },
      { sender: { type: 'agent', id: 'deleted-user' } }
    );

    this.logger.log(`User data deleted: ${userId}`);
  });
}
```

### 10.3. Data Expiration

```typescript
// Delete old verification tokens
@Cron('0 0 * * *')  // Daily at midnight
async cleanupExpiredTokens() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);  // 30 days

  const result = await this.refreshTokenRepository.delete({
    expiresAt: LessThan(cutoff),
  });

  this.logger.log(`Deleted ${result.affected} expired refresh tokens`);
}
```

## 11. Kết luận

Database security được thiết kế với:

✅ **SQL Injection Prevention:** TypeORM parameterized queries
✅ **Access Control:** Limited DB user permissions, RLS
✅ **Encryption:** Column-level, TDE, hashed passwords
✅ **Secure Connections:** SSL/TLS, connection pooling
✅ **Audit Logging:** Application + database level
✅ **Backup Security:** Encrypted, off-site, tested
✅ **Monitoring:** Query performance, connection health
✅ **GDPR Compliance:** Data deletion, soft delete

**Cần cải thiện:**

1. Enable Row-Level Security (RLS)
2. Implement database-level encryption (TDE)
3. Set up automated backup verification
4. Add query performance monitoring
5. Implement data anonymization tools
6. Set up database replication
7. Add connection encryption verification
8. Implement audit log retention policy
