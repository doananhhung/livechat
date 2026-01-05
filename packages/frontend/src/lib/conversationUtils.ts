import { ConversationStatus } from "@live-chat/shared-types";
import { RotateCcw, Clock, CheckCircle, AlertOctagon } from "lucide-react";

export const getStatusLabel = (s: ConversationStatus) => {
  switch (s) {
    case ConversationStatus.OPEN: return "Mở";
    case ConversationStatus.PENDING: return "Đang chờ";
    case ConversationStatus.SOLVED: return "Đã giải quyết";
    case ConversationStatus.SPAM: return "Spam";
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
