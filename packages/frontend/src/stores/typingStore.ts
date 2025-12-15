// src/stores/typingStore.ts
import { create } from "zustand";

interface TypingState {
  typingStatus: Record<number, boolean>;
  setTypingStatus: (conversationId: number, isTyping: boolean) => void;
}

export const useTypingStore = create<TypingState>((set) => ({
  typingStatus: {},
  setTypingStatus: (conversationId, isTyping) =>
    set((state) => ({
      typingStatus: {
        ...state.typingStatus,
        [conversationId]: isTyping,
      },
    })),
}));
