// src/stores/typingStore.ts
import { create } from "zustand";

interface TypingState {
  typingStatus: Record<number, boolean>;
  fillingStatus: Record<number, boolean>;
  setTypingStatus: (conversationId: number, isTyping: boolean) => void;
  setFillingStatus: (conversationId: number, isFilling: boolean) => void;
}

export const useTypingStore = create<TypingState>((set) => ({
  typingStatus: {},
  fillingStatus: {},
  setTypingStatus: (conversationId, isTyping) =>
    set((state) => ({
      typingStatus: {
        ...state.typingStatus,
        [conversationId]: isTyping,
      },
    })),
  setFillingStatus: (conversationId, isFilling) =>
    set((state) => ({
      fillingStatus: {
        ...state.fillingStatus,
        [conversationId]: isFilling,
      },
    })),
}));
