import { ConversationStatus } from "@live-chat/shared-types";
import i18n from '../i18n';

export const getStatusLabel = (s: ConversationStatus) => {
  switch (s) {
    case ConversationStatus.OPEN: return i18n.t("conversations.status.open");
    case ConversationStatus.PENDING: return i18n.t("conversations.status.pending");
    case ConversationStatus.SOLVED: return i18n.t("conversations.status.solved");
    case ConversationStatus.SPAM: return i18n.t("conversations.status.spam");
    default: return s;
  }
};

export const getAvailableTransitions = (current: ConversationStatus): ConversationStatus[] => {
   switch (current) {
     case ConversationStatus.OPEN: return [ConversationStatus.PENDING, ConversationStatus.SOLVED, ConversationStatus.SPAM];
     case ConversationStatus.PENDING: return [ConversationStatus.OPEN, ConversationStatus.SOLVED];
     case ConversationStatus.SOLVED: return [ConversationStatus.OPEN];
     case ConversationStatus.SPAM: return [ConversationStatus.OPEN];
     // Legacy fallback
     case 'closed' as ConversationStatus: return [ConversationStatus.OPEN];
     default: return [ConversationStatus.OPEN];
   }
};
