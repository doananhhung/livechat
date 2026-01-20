import { describe, it, expect, beforeEach, vi } from "vitest";
import { useChatStore } from "../useChatStore";
import { MessageStatus, MessageContentType } from "@live-chat/shared-types";
import type { WidgetMessageDto as Message } from "@live-chat/shared-types";

describe("useChatStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useChatStore.setState({
      widgetConfig: null,
      isWindowOpen: false,
      messages: [],
      connectionStatus: "disconnected",
      unreadCount: 0,
      isAgentTyping: false,
      isSessionReady: false,
      submittedFormMessageIds: new Set(),
    });
  });

  const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
    id: "msg-1",
    conversationId: 1,
    content: "Hello",
    fromCustomer: false,
    senderId: "agent-1",
    status: MessageStatus.SENT,
    createdAt: new Date().toISOString(),
    contentType: "text" as any,
    ...overrides,
  });

  it("should have correct initial state", () => {
    const state = useChatStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.connectionStatus).toBe("disconnected");
    expect(state.submittedFormMessageIds.size).toBe(0);
  });

  it("adds messages correctly", () => {
    const message = createMockMessage();
    useChatStore.getState().addMessage(message);

    const state = useChatStore.getState();
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]).toEqual(message);
  });

  it("limits messages to MAX_MESSAGES when threshold reached", () => {
    // Inject 601 messages
    const messages = Array.from({ length: 601 }, (_, i) =>
      createMockMessage({ id: `msg-${i}` }),
    );

    // Add them one by one or in batch if we had a batch action,
    // but here check addMessage logic.
    // For simplicity, let's just loop addMessage a few times or manipulate state directly then add one
    // to trigger the limit check.

    // Actually addMessage implementation:
    // const newMessages = [...state.messages, message];
    // if (newMessages.length > MESSAGE_CLEANUP_THRESHOLD) ...

    // Let's set initial state to 600 messages
    useChatStore.setState({
      messages: Array.from({ length: 600 }, (_, i) =>
        createMockMessage({ id: `msg-${i}` }),
      ),
    });

    // Add one more
    useChatStore.getState().addMessage(createMockMessage({ id: "msg-600" }));

    const state = useChatStore.getState();
    // Should be slice(-MAX_MESSAGES) -> last 500
    expect(state.messages).toHaveLength(500);
    expect(state.messages[499].id).toBe("msg-600"); // Latest
  });

  it("updates message status", () => {
    const message = createMockMessage({ status: MessageStatus.SENDING });
    useChatStore.getState().addMessage(message);

    useChatStore
      .getState()
      .updateMessageStatus(message.id, MessageStatus.DELIVERED);

    const state = useChatStore.getState();
    expect(state.messages[0].status).toBe(MessageStatus.DELIVERED);
  });

  it("finalizes message (swaps tempId)", () => {
    const tempMessage = createMockMessage({ id: "temp-1", content: "Temp" });
    useChatStore.getState().addMessage(tempMessage);

    const finalMessage = createMockMessage({ id: "final-1", content: "Final" });
    useChatStore.getState().finalizeMessage("temp-1", finalMessage);

    const state = useChatStore.getState();
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].id).toBe("final-1");
    expect(state.messages[0].content).toBe("Final");
  });

  it("markFormAsSubmitted adds messageId to submittedFormMessageIds", () => {
    useChatStore.getState().markFormAsSubmitted("req-1");

    const state = useChatStore.getState();
    expect(state.submittedFormMessageIds.has("req-1")).toBe(true);
  });

  it("restores submitted state from history", () => {
    const mockHistory: Message[] = [
      {
        id: "req-1",
        conversationId: 1,
        content: "Form Request",
        contentType: MessageContentType.FORM_REQUEST,
        fromCustomer: false,
        senderId: "agent-1",
        status: MessageStatus.SENT,
        createdAt: new Date().toISOString(),
        metadata: { templateId: 1 } as any,
      },
      {
        id: "sub-1",
        conversationId: 1,
        content: "Form Submitted",
        contentType: MessageContentType.FORM_SUBMISSION,
        fromCustomer: true,
        status: MessageStatus.SENT,
        createdAt: new Date().toISOString(),
        metadata: { formRequestMessageId: "req-1" } as any,
      },
    ];

    useChatStore.getState().loadConversationHistory(mockHistory);

    const state = useChatStore.getState();
    expect(state.messages).toHaveLength(2);
    expect(state.submittedFormMessageIds.has("req-1")).toBe(true);
  });

  it("toggles window open state", () => {
    useChatStore.getState().toggleWindow();
    expect(useChatStore.getState().isWindowOpen).toBe(true);

    useChatStore.getState().toggleWindow();
    expect(useChatStore.getState().isWindowOpen).toBe(false);
  });
});
