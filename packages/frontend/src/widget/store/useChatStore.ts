// src/widget/store/useChatStore.ts
import { create } from "zustand";
import type {
  Message,
  WidgetConfig,
  ConnectionStatus,
  MessageStatus,
} from "../types";

interface ChatState {
  widgetConfig: WidgetConfig | null;
  isWindowOpen: boolean;
  messages: Message[];
  connectionStatus: ConnectionStatus;
  unreadCount: number;
  isAgentTyping: boolean;

  // Actions
  setWidgetConfig: (config: WidgetConfig) => void;
  toggleWindow: () => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (
    messageId: string | number,
    status: MessageStatus
  ) => void;
  finalizeMessage: (tempId: string, finalMessage: Message) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  setAgentIsTyping: (isTyping: boolean) => void;
  loadConversationHistory: (history: Message[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // Initial state
  widgetConfig: null,
  isWindowOpen: false,
  messages: [],
  connectionStatus: "disconnected",
  unreadCount: 0,
  isAgentTyping: false,

  // Actions Implementation
  setWidgetConfig: (config) => set({ widgetConfig: config }),

  toggleWindow: () => set((state) => ({ isWindowOpen: !state.isWindowOpen })),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateMessageStatus: (messageId, status) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, status } : msg
      ),
    })),

  finalizeMessage: (tempId, finalMessage) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === tempId ? finalMessage : msg
      ),
    })),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  incrementUnreadCount: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  resetUnreadCount: () => set({ unreadCount: 0 }),

  setAgentIsTyping: (isTyping) => set({ isAgentTyping: isTyping }),

  loadConversationHistory: (history) => set({ messages: history }),
}));
