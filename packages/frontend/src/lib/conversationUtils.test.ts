import { ConversationStatus } from "@live-chat/shared-types";
import { getStatusLabel, getAvailableTransitions } from "./conversationUtils";
import { describe, it, expect } from 'vitest';

describe('conversationUtils', () => {
  it('getStatusLabel should return correct label for OPEN', () => {
    expect(getStatusLabel(ConversationStatus.OPEN)).toBe('Mở');
  });

  it('getStatusLabel should return correct label for PENDING', () => {
    expect(getStatusLabel(ConversationStatus.PENDING)).toBe('Đang chờ');
  });

  it('getStatusLabel should return correct label for SOLVED', () => {
    expect(getStatusLabel(ConversationStatus.SOLVED)).toBe('Đã giải quyết');
  });

  it('getStatusLabel should return correct label for SPAM', () => {
    expect(getStatusLabel(ConversationStatus.SPAM)).toBe('Spam');
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
