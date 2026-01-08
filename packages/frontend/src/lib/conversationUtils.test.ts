import { ConversationStatus } from "@live-chat/shared-types";
import { getStatusLabel, getAvailableTransitions } from "./conversationUtils";
import { describe, it, expect, vi } from 'vitest';

// Mock i18n to just return the key
vi.mock('../i18n', () => ({
  default: {
    t: (key: string) => key,
  },
}));

describe('conversationUtils', () => {
  it('getStatusLabel should return correct i18n key for OPEN', () => {
    expect(getStatusLabel(ConversationStatus.OPEN)).toBe('conversations.status.open');
  });

  it('getStatusLabel should return correct i18n key for PENDING', () => {
    expect(getStatusLabel(ConversationStatus.PENDING)).toBe('conversations.status.pending');
  });

  it('getStatusLabel should return correct i18n key for SOLVED', () => {
    expect(getStatusLabel(ConversationStatus.SOLVED)).toBe('conversations.status.solved');
  });

  it('getStatusLabel should return correct i18n key for SPAM', () => {
    expect(getStatusLabel(ConversationStatus.SPAM)).toBe('conversations.status.spam');
  });

  it('getAvailableTransitions for OPEN should return PENDING, SOLVED, SPAM', () => {
    const transitions = getAvailableTransitions(ConversationStatus.OPEN);
    expect(transitions).toEqual([ConversationStatus.PENDING, ConversationStatus.SOLVED, ConversationStatus.SPAM]);
  });

  it('getAvailableTransitions for PENDING should return OPEN, SOLVED', () => {
    const transitions = getAvailableTransitions(ConversationStatus.PENDING);
    expect(transitions).toEqual([ConversationStatus.OPEN, ConversationStatus.SOLVED]);
  });

  it('getAvailableTransitions for SOLVED should return OPEN', () => {
    const transitions = getAvailableTransitions(ConversationStatus.SOLVED);
    expect(transitions).toEqual([ConversationStatus.OPEN]);
  });

  it('getAvailableTransitions for SPAM should return OPEN', () => {
    const transitions = getAvailableTransitions(ConversationStatus.SPAM);
    expect(transitions).toEqual([ConversationStatus.OPEN]);
  });

  it('getAvailableTransitions for "closed" (legacy) should return OPEN', () => {
    const transitions = getAvailableTransitions('closed' as ConversationStatus);
    expect(transitions).toEqual([ConversationStatus.OPEN]);
  });
});
