# Design Review: canned_responses_core

## Status
**VERDICT: APPROVE**

## Findings
1.  **Schema:** `Unique(["projectId", "shortcut"])` correctly enforces the project-scoped uniqueness invariant.
2.  **Validation:** Regex for shortcut ensures usability (no spaces/special chars makes it easy to type).
3.  **Limits:** 5000 char limit is a reasonable constraint.
4.  **Architecture:** Roles (Manager Write/Agent Read) align with system RBAC.

## Notes
-   **Implementation Detail:** Place TypeORM Entity in `packages/backend/src/canned-responses/entities` (or `database/entities`).
-   **Shared:** Place DTOs in `packages/shared-dtos`. Place Interfaces in `packages/shared-types`.
