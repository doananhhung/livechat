/**
 * Cryptographic constants for the application.
 * These values can be configured via environment variables for different environments.
 */

/**
 * Number of bcrypt salt rounds.
 * - Production: 12 (secure but slow ~250ms per hash)
 * - Test: 1 (fast ~2ms per hash, security not needed for tests)
 */
export const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
