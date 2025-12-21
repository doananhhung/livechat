import { create } from "zustand";
import type { ConnectionStatus } from "../types";
import type { WidgetMessageDto as Message } from "@live-chat/shared-types";
import type { IWidgetSettingsDto } from "@live-chat/shared-types";
import { MessageStatus } from "@live-chat/shared-types";

// Constants for memory management
const MAX_MESSAGES = 500; // Keep only last 500 messages to prevent memory leak
const MESSAGE_CLEANUP_THRESHOLD = 600; // Start cleanup when reaching this

export type WidgetConfig = IWidgetSettingsDto & { projectId: string };

interface ChatState {
  widgetConfig: WidgetConfig | null;
  isWindowOpen: boolean;
  messages: Message[];
  connectionStatus: ConnectionStatus;
  unreadCount: number;
  isAgentTyping: boolean;
  isSessionReady: boolean;

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
  setSessionReady: (isReady: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // Initial state
  widgetConfig: null,
  isWindowOpen: false,
  messages: [],
  connectionStatus: "disconnected",
  unreadCount: 0,
  isAgentTyping: false,
  isSessionReady: false,

  // Actions Implementation
  setWidgetConfig: (config) => set({ widgetConfig: config }),

  toggleWindow: () => set((state) => ({ isWindowOpen: !state.isWindowOpen })),

  addMessage: (message) =>
    set((state) => {
      const newMessages = [...state.messages, message];
      // Cleanup old messages if exceeding threshold
      if (newMessages.length > MESSAGE_CLEANUP_THRESHOLD) {
        return { messages: newMessages.slice(-MAX_MESSAGES) };
      }
      return { messages: newMessages };
    }),

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

  loadConversationHistory: (history) => {
    // Limit history to prevent memory issues
    const limitedHistory = history.slice(-MAX_MESSAGES);
    set({ messages: limitedHistory });
  },

  setSessionReady: (isReady) => set({ isSessionReady: isReady }),
}));
