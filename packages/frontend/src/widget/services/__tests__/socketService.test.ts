import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type Mock,
} from "vitest";
import { socketService } from "../socketService";
import { useChatStore } from "../../store/useChatStore";
import { WebSocketEvent } from "@live-chat/shared-types";
import { io } from "socket.io-client";

// Mock socket.io-client
vi.mock("socket.io-client");

describe("socketService", () => {
  let mockSocket: any;

  beforeEach(() => {
    // Reset store
    useChatStore.getState().setConnectionStatus("disconnected");
    useChatStore.getState().setSessionReady(false);

    // Mock socket instance
    mockSocket = {
      connected: false,
      id: "mock-socket-id",
      on: vi.fn(),
      off: vi.fn(),
      onAny: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
      close: vi.fn(),
    };

    (io as any).mockReturnValue(mockSocket);
  });

  afterEach(() => {
    vi.clearAllMocks();
    socketService.disconnect();
  });

  it("connects and sets status", () => {
    socketService.connect("proj-1", "vis-1");
    expect(io).toHaveBeenCalled();
    expect(useChatStore.getState().connectionStatus).toBe("connecting");

    // Simulate connect event
    const connectHandler = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === "connect",
    )?.[1];

    expect(connectHandler).toBeDefined();
    if (connectHandler) {
      // Manually trigger
      mockSocket.connected = true;
      connectHandler();
      expect(useChatStore.getState().connectionStatus).toBe("connected");
    }
  });

  it("emits submitForm correctly when connected", async () => {
    // Setup connection
    socketService.connect("proj-1", "vis-1");
    mockSocket.connected = true;

    // Mock emit implementation for callback
    mockSocket.emit.mockImplementation(
      (event: string, payload: any, callback: any) => {
        if (event === WebSocketEvent.SUBMIT_FORM) {
          callback({ success: true });
        }
      },
    );

    const result = await socketService.emitSubmitForm("form-msg-1", {
      name: "Test",
    });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      WebSocketEvent.SUBMIT_FORM,
      { formRequestMessageId: "form-msg-1", data: { name: "Test" } },
      expect.any(Function),
    );
    expect(result).toEqual({ success: true });
  });

  it("fails to emit submitForm when disconnected", async () => {
    // Ensure disconnected
    socketService.disconnect();

    const result = await socketService.emitSubmitForm("form-msg-1", {
      name: "Test",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Socket not connected");
  });

  it("handles formSubmitted event from server", () => {
    socketService.connect("proj-1", "vis-1");

    const formHandler = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === WebSocketEvent.FORM_SUBMITTED,
    )?.[1];

    expect(formHandler).toBeDefined();

    if (formHandler) {
      formHandler({
        messageId: "sub-msg-1",
        formRequestMessageId: "req-msg-1",
      });
      const state = useChatStore.getState();
      expect(state.submittedFormMessageIds.has("sub-msg-1")).toBe(true);
      expect(state.submittedFormMessageIds.has("req-msg-1")).toBe(true);
    }
  });
});
