# E2E Test Guidelines

This document outlines best practices for writing E2E tests in this project, based on lessons learned from fixing the `visitors.e2e-spec.ts` test suite.

---

## Database Access Patterns

### ✅ DO: Use `harness.dataSource` for Database Operations

When you need to interact with the database directly in tests, use the `harness.dataSource` object:

```typescript
// For raw SQL queries
const result = await harness.dataSource.query(`
  INSERT INTO visitors (project_id, visitor_uid, display_name)
  VALUES (${projectId}, gen_random_uuid(), 'Test Visitor')
  RETURNING *
`);

// For TypeORM repository operations
const visitor = await harness.dataSource.getRepository(Visitor).findOne({ 
  where: { id: visitorId } 
});
```

### ❌ DON'T: Use `harness.entityManager` Directly

The `entityManager` property may not be initialized in all test configurations:

```typescript
// ❌ This will fail with "Cannot read properties of undefined"
await harness.entityManager.save(Visitor, { ... });
await harness.entityManager.findOne(Visitor, { where: { id } });
```

---

## Column Names in Raw SQL

### ✅ DO: Use Snake_case for Column Names in SQL

PostgreSQL uses snake_case column names. Always use the actual database column names:

```typescript
await harness.dataSource.query(`
  INSERT INTO visitors (project_id, visitor_uid, display_name, last_seen_at)
  VALUES (${projectId}, gen_random_uuid(), 'Test', NOW())
`);
```

### ❌ DON'T: Use camelCase Property Names in Raw SQL

TypeORM entities use camelCase, but the database columns are snake_case:

```typescript
// ❌ This will fail with "column 'displayName' does not exist"
await harness.dataSource.query(`
  INSERT INTO visitors (projectId, visitorUid, displayName)
  VALUES (...)
`);
```

---

## Handling Raw SQL Results

### ✅ DO: Remember Raw SQL Returns Snake_case Keys

When using raw SQL queries, the returned objects have snake_case property names:

```typescript
const result = await harness.dataSource.query(`
  SELECT * FROM visitors WHERE id = ${id}
`);
// result[0].display_name ✅
// result[0].displayName  ❌ (undefined)
```

### ✅ DO: Use Hardcoded Values for Assertions When Possible

If you know the exact value, use it directly to avoid snake_case/camelCase issues:

```typescript
// ✅ Clear and explicit
expect(visitorInDb!.displayName).toBe('Visitor #123');
```

### ❌ DON'T: Reference Raw SQL Results with camelCase

```typescript
const visitorRes = await harness.dataSource.query(`SELECT * FROM visitors ...`);
visitor = visitorRes[0];

// ❌ visitor.displayName is undefined (raw SQL returns display_name)
expect(visitorInDb!.displayName).toBe(visitor.displayName);
```

---

## Entity Schema Verification

### ✅ DO: Verify Entity Schema Before Writing SQL

Always check the actual entity definition before writing INSERT statements:

```typescript
// Check /src/database/entities/visitor.entity.ts first
// Visitor entity has: id, projectId, visitorUid, displayName, metadata, lastSeenAt
// It does NOT have: deviceInfo
```

### ❌ DON'T: Assume Column Existence

Entities may change over time. Don't assume columns exist:

```typescript
// ❌ This fails if device_info column was removed
await harness.dataSource.query(`
  INSERT INTO visitors (..., device_info) VALUES (..., '{}')
`);
```

---

## Quick Reference: TestHarness Patterns

| Task | Correct Pattern |
|------|-----------------|
| Insert data | `harness.dataSource.query(\`INSERT INTO...\`)` |
| Query single entity | `harness.dataSource.getRepository(Entity).findOne({ where: {...} })` |
| Query multiple entities | `harness.dataSource.getRepository(Entity).find({ where: {...} })` |
| Update data | `harness.dataSource.query(\`UPDATE table SET...\`)` |
| Clean database | `harness.cleanDatabase()` (handled in beforeEach) |

---

## Summary

1. **Use `harness.dataSource`** instead of `harness.entityManager`
2. **Use snake_case** for column names in raw SQL queries
3. **Use camelCase** when accessing TypeORM repository results
4. **Verify entity schema** before writing INSERT statements
5. **Use hardcoded values** in assertions when possible to avoid property name mismatches
