
import { Visitor } from '@live-chat/shared-types';

export class VisitorUpdatedEvent {
  projectId: number;
  visitorId: number;
  visitor: Visitor;
}

export class VisitorDisconnectedEvent {
  projectId: number;
  visitorUid: string;
  conversationId?: string;
}

export class VisitorConnectedEvent {
  projectId: number;
  visitorUid: string;
}
