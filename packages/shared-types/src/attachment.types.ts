/**
 * Attachment type for messages.
 * Used across frontend and backend for consistent file attachment handling.
 */
export interface Attachment {
  /** MIME type of the attachment (e.g., 'image/png', 'application/pdf') */
  type: string;
  /** URL where the attachment can be accessed */
  url: string;
  /** Optional filename for display purposes */
  name?: string;
  /** Optional file size in bytes */
  size?: number;
}
