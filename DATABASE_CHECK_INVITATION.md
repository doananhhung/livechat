# Database Check Guide - Invitation Status

## Quick SQL Queries to Check Invitation Status

### 1. Check Invitation Status

```sql
-- View all invitations for a specific project
SELECT
    i.id,
    i.email,
    i.status,
    i.role,
    i.created_at,
    i.expires_at,
    p.name as project_name,
    inviter.email as invited_by
FROM invitations i
JOIN projects p ON p.id = i.project_id
JOIN users inviter ON inviter.id = i.inviter_id
WHERE i.project_id = 1  -- Change to your project ID
ORDER BY i.created_at DESC;
```

### 2. Check Specific Invitation by Email

```sql
-- Check invitation for specific email
SELECT
    id,
    email,
    status,
    role,
    created_at,
    expires_at,
    CASE
        WHEN status = 'pending' THEN '⏳ Đang chờ'
        WHEN status = 'accepted' THEN '✅ Đã chấp nhận'
        WHEN status = 'expired' THEN '⏰ Hết hạn'
    END as status_display
FROM invitations
WHERE email = 'dinhviethoang604@gmail.com'  -- Change to the email you invited
ORDER BY created_at DESC
LIMIT 1;
```

### 3. Check if User Was Added to Project

```sql
-- Check if user is now a member of the project
SELECT
    pm.id,
    pm.role,
    u.email,
    u.full_name,
    p.name as project_name,
    pm.created_at as joined_at
FROM project_members pm
JOIN users u ON u.id = pm.user_id
JOIN projects p ON p.id = pm.project_id
WHERE u.email = 'dinhviethoang604@gmail.com'  -- Change to the email
  AND pm.project_id = 1;  -- Change to your project ID
```

### 4. Complete Invitation Journey Check

```sql
-- See the complete journey: invitation → user → membership
SELECT
    i.email,
    i.status as invitation_status,
    i.created_at as invitation_sent,
    u.id as user_id,
    u.email as user_email,
    u.created_at as user_registered,
    pm.id as membership_id,
    pm.role as member_role,
    pm.created_at as joined_project
FROM invitations i
LEFT JOIN users u ON u.email = i.email
LEFT JOIN project_members pm ON pm.user_id = u.id AND pm.project_id = i.project_id
WHERE i.email = 'dinhviethoang604@gmail.com'  -- Change to the email
ORDER BY i.created_at DESC
LIMIT 1;
```

### 5. Check All Pending Invitations

```sql
-- See all pending invitations that need attention
SELECT
    i.email,
    p.name as project_name,
    i.created_at,
    i.expires_at,
    CASE
        WHEN i.expires_at < NOW() THEN '⏰ EXPIRED'
        ELSE '⏳ PENDING'
    END as status_note
FROM invitations i
JOIN projects p ON p.id = i.project_id
WHERE i.status = 'pending'
ORDER BY i.created_at DESC;
```

### 6. Count Invitation Statistics

```sql
-- Get invitation statistics for a project
SELECT
    p.name as project_name,
    COUNT(*) as total_invitations,
    SUM(CASE WHEN i.status = 'pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN i.status = 'accepted' THEN 1 ELSE 0 END) as accepted,
    SUM(CASE WHEN i.status = 'expired' THEN 1 ELSE 0 END) as expired
FROM invitations i
JOIN projects p ON p.id = i.project_id
WHERE i.project_id = 1  -- Change to your project ID
GROUP BY p.name;
```

---

## How to Run These Queries

### Option 1: Using psql (PostgreSQL Command Line)

```bash
# Connect to your database
psql -h localhost -U your_username -d your_database_name

# Then paste any query above
```

### Option 2: Using Docker (if running in container)

```bash
# If your database is in Docker
docker exec -it your-postgres-container psql -U your_username -d your_database_name

# Then paste any query above
```

### Option 3: Using Database GUI Tools

- **pgAdmin**: Connect to your database and use the Query Tool
- **DBeaver**: Connect and execute SQL
- **TablePlus**: Connect and run queries
- **DataGrip**: Connect and execute

### Option 4: Using TypeORM CLI

```bash
cd packages/backend
npm run typeorm query "SELECT * FROM invitations WHERE email = 'dinhviethoang604@gmail.com';"
```

---

## Expected Results

### ✅ SUCCESS - Invitation Accepted

```
 email                        | status   | user_id | membership_id
------------------------------|----------|---------|---------------
 dinhviethoang604@gmail.com   | accepted | abc-123 | 456
```

**Indicators:**

- `invitation.status` = `'accepted'`
- `user_id` is NOT NULL (user exists)
- `membership_id` is NOT NULL (user is in project)

### ❌ FAILED - Still Pending

```
 email                        | status  | user_id | membership_id
------------------------------|---------|---------|---------------
 dinhviethoang604@gmail.com   | pending | abc-123 | NULL
```

**Indicators:**

- `invitation.status` = `'pending'`
- `user_id` exists (user registered)
- `membership_id` is NULL (NOT in project yet)

### ⚠️ NOT REGISTERED - User Doesn't Exist

```
 email                        | status  | user_id | membership_id
------------------------------|---------|---------|---------------
 dinhviethoang604@gmail.com   | pending | NULL    | NULL
```

**Indicators:**

- `invitation.status` = `'pending'`
- `user_id` is NULL (user not registered)
- `membership_id` is NULL (can't join without account)

---

## Quick Diagnostic Queries

### Check Your Specific Case

```sql
-- Replace with your actual email
WITH invitation_check AS (
    SELECT
        i.email,
        i.status as inv_status,
        u.id as user_exists,
        pm.id as is_member
    FROM invitations i
    LEFT JOIN users u ON u.email = i.email
    LEFT JOIN project_members pm ON pm.user_id = u.id AND pm.project_id = i.project_id
    WHERE i.email = 'dinhviethoang604@gmail.com'  -- YOUR EMAIL HERE
      AND i.project_id = 1  -- YOUR PROJECT ID HERE
    ORDER BY i.created_at DESC
    LIMIT 1
)
SELECT
    email,
    CASE
        WHEN inv_status = 'accepted' AND is_member IS NOT NULL
            THEN '✅ SUCCESS - Invitation accepted and user is in project'
        WHEN inv_status = 'pending' AND user_exists IS NOT NULL AND is_member IS NULL
            THEN '⚠️ USER REGISTERED BUT NOT IN PROJECT - Invitation not accepted'
        WHEN inv_status = 'pending' AND user_exists IS NULL
            THEN '⏳ WAITING - User has not registered yet'
        WHEN inv_status = 'expired'
            THEN '⏰ EXPIRED - Invitation expired'
        ELSE '❓ UNKNOWN STATUS'
    END as diagnosis
FROM invitation_check;
```

---

## Troubleshooting Based on Results

### If Status is "pending" but user is registered:

1. User clicked registration link but invitation not accepted
2. Solution: Delete and resend invitation OR share accept link manually

### If Status is "pending" and user doesn't exist:

1. User hasn't clicked the registration link yet
2. Wait for user to register, or resend invitation

### If Status is "accepted" but user not in project_members:

1. Database inconsistency - acceptance didn't complete
2. Manually add user:
   ```sql
   INSERT INTO project_members (project_id, user_id, role, created_at)
   VALUES (
       1,  -- project_id
       (SELECT id FROM users WHERE email = 'user@email.com'),  -- user_id
       'AGENT',  -- role
       NOW()  -- created_at
   );
   ```

---

## Environment-Specific Connection Strings

### Development (Local)

```bash
psql postgresql://postgres:password@localhost:5432/social_commerce
```

### Production (Check your .env file)

```bash
# Check your .env for these values:
PSQL_HOST=
PSQL_PORT=
PSQL_USER=
PSQL_PASSWORD=
PSQL_DATABASE=
```

---

## Quick Check Script

Create a file `check-invitation.sql` and paste this:

```sql
-- Quick Invitation Check Script
-- Replace these variables:
\set project_id 1
\set user_email '''dinhviethoang604@gmail.com'''

\echo '=== INVITATION STATUS ==='
SELECT
    email,
    status,
    role,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as sent_at,
    TO_CHAR(expires_at, 'YYYY-MM-DD HH24:MI:SS') as expires_at
FROM invitations
WHERE email = :user_email
  AND project_id = :project_id
ORDER BY created_at DESC
LIMIT 1;

\echo ''
\echo '=== USER ACCOUNT ==='
SELECT
    id,
    email,
    full_name,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as registered_at
FROM users
WHERE email = :user_email;

\echo ''
\echo '=== PROJECT MEMBERSHIP ==='
SELECT
    pm.id,
    pm.role,
    TO_CHAR(pm.created_at, 'YYYY-MM-DD HH24:MI:SS') as joined_at,
    p.name as project_name
FROM project_members pm
JOIN projects p ON p.id = pm.project_id
JOIN users u ON u.id = pm.user_id
WHERE u.email = :user_email
  AND pm.project_id = :project_id;
```

Run it:

```bash
psql -f check-invitation.sql your_database_name
```

---

## Next Steps After Checking

1. **If invitation is accepted**: ✅ Everything works!

2. **If invitation is pending**:

   - Check if old invitation (delete and resend)
   - Have user click the link again
   - Or manually share: `/accept-invitation?token=<token>`

3. **If user is in project but invitation pending**:
   - Update invitation status manually:
   ```sql
   UPDATE invitations
   SET status = 'accepted'
   WHERE email = 'user@email.com' AND project_id = 1;
   ```

---

Need help with a specific query? Let me know your project ID and email, and I can create a custom query for you!
