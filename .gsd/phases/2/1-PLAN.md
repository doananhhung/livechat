---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Inbox API DTO Unification

## Objective

Standardize `inboxApi.ts` and its consumers to use shared DTOs for messaging, typing indicators, and message listing.

## Context

- `packages/frontend/src/services/inboxApi.ts`
- `packages/shared-dtos/src/agent-typing.dto.ts`
- `packages/shared-dtos/src/send-reply.dto.ts`
- `packages/shared-dtos/src/list-messages.dto.ts`
- `packages/frontend/src/components/features/inbox/MessageComposer.tsx`
- `packages/frontend/src/components/features/inbox/MessagePane.tsx`

## Proposed Changes

### [MODIFY] [inboxApi.ts](file:///home/hoang/node/live_chat/packages/frontend/src/services/inboxApi.ts)

- Update `sendAgentTypingStatus`, `sendAgentReply`, `getMessages` to use DTOs.
- Update `useSendAgentReply`, `useNotifyAgentTyping`, `useGetMessages` hooks.

### [MODIFY] [MessageComposer.tsx](file:///home/hoang/node/live_chat/packages/frontend/src/components/features/inbox/MessageComposer.tsx)

- Update `mutate` calls to pass DTO objects.

### [MODIFY] [MessagePane.tsx](file:///home/hoang/node/live_chat/packages/frontend/src/components/features/inbox/MessagePane.tsx)

- Ensure compatibility with new `useGetMessages` signature.

## Tasks

<task type="auto">
  <name>Refactor inboxApi.ts to use DTOs</name>
  <files>
    <file>packages/frontend/src/services/inboxApi.ts</file>
  </files>
  <action>
    - Import `AgentTypingDto`, `SendReplyDto`, `ListMessagesDto` from `@live-chat/shared-dtos`.
    - Refactor `sendAgentTypingStatus` to accept `payload: AgentTypingDto`.
    - Refactor `sendAgentReply` to accept `payload: SendReplyDto`.
    - Refactor `getMessages` to accept `projectId, conversationId, params: ListMessagesDto`.
    - Update `useSendAgentReply`, `useNotifyAgentTyping`, `useGetMessages` hooks to match.
  </action>
  <verify>
    Check for TypeScript errors in `inboxApi.ts`.
  </verify>
  <done>
    Inbox API functions use shared DTOs.
  </done>
</task>

<task type="auto">
  <name>Update Inbox UI components</name>
  <files>
    <file>packages/frontend/src/components/features/inbox/MessageComposer.tsx</file>
    <file>packages/frontend/src/components/features/inbox/MessagePane.tsx</file>
  </files>
  <action>
    - Update `MessageComposer`'s `sendMessage` and `notifyTyping` calls to pass objects `{ text }` and `{ isTyping }`.
    - Verify `MessagePane` correctly handles the updated `useGetMessages`.
  </action>
  <verify>
    npm run check-types --workspace=@live-chat/frontend
  </verify>
  <done>
    Inbox UI components are type-safe and functional with new DTO payloads.
  </done>
</task>

## Success Criteria

- [ ] Messaging and typing indicators use shared DTOs.
- [ ] Message listing uses `ListMessagesDto`.
- [ ] No regression in Inbox functionality.
