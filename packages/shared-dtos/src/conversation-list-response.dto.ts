import { Conversation, PaginationDto } from "@live-chat/shared-types";

/**
 * Response type for GET /inbox/conversations
 */
export type ConversationListResponseDto = PaginationDto<Conversation>;
