/**
 * Centralized constants for infrastructure identifiers.
 * Prevents typos and ensures consistency across the codebase.
 */

// ============================================
// Redis Channel Names
// ============================================

/**
 * Channel used for broadcasting new messages across API instances.
 * Used by OutboxListenerService (publisher) and EventsGateway (subscriber).
 */
export const NEW_MESSAGE_CHANNEL = 'new_message_channel';

// ============================================
// BullMQ Queue Names
// ============================================

/**
 * Main queue for processing chat events (visitor messages, etc.)
 */
export const LIVE_CHAT_EVENTS_QUEUE = 'live-chat-events-queue';

/**
 * Queue for processing outbound webhooks.
 */
export const WEBHOOKS_QUEUE = 'webhooks-queue';

/**
 * Default job name for events in the queue
 */
export const EVENT_JOB_NAME = 'event-job';

// ============================================
// PostgreSQL Channels (LISTEN/NOTIFY)
// ============================================

/**
 * Database channel for outbox event notifications.
 * OutboxListenerService listens on this channel.
 */
export const OUTBOX_CHANNEL = 'outbox_channel';

// ============================================
// Cookie Names
// ============================================

export const CookieNames = {
  REFRESH_TOKEN: 'refresh_token',
  TWO_FACTOR_SECRET: '2fa_secret',
  TWO_FACTOR_PARTIAL_TOKEN: '2fa_partial_token',
} as const;

// ============================================
// Strategy Names
// ============================================

export const StrategyNames = {
  JWT: 'jwt',
  JWT_REFRESH: 'jwt-refresh',
  LOCAL: 'local',
  TWO_FACTOR_PARTIAL: '2fa-partial',
  GOOGLE: 'google',
  GOOGLE_LINK: 'google-link',
} as const;

// ============================================
// Room Name Prefixes
// ============================================

/**
 * Creates a room name for a project (used by agents subscribed to project messages)
 */
export function getProjectRoom(projectId: number | string): string {
  return `project:${projectId}`;
}
