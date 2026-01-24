/**
 * System Actor Constants
 *
 * These constants define the dedicated "System" user for automated actions.
 * The System user is seeded during migration and cannot be deleted.
 */

/** UUID for the System user. Must match the seeded value in migration. */
export const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";

/** Email for the System user. Not a real email, only for identification. */
export const SYSTEM_USER_EMAIL = "system@internal.local";
