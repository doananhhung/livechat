/**
 * DTO for listing conversations with visitor information included.
 * This ensures type safety between backend and frontend.
 */
export interface ConversationListItemDto {
  id: number;
  status: "open" | "closed" | "pending";
  lastMessageSnippet: string | null;
  lastMessageTimestamp: Date | null;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  visitor: {
    id: number;
    displayName: string;
    currentUrl: string | null;
  };
}
