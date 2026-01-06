
import "@testing-library/jest-dom";
import { render, screen, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach, type Mock } from "vitest";
import { SocketProvider, useSocket } from "./SocketContext";
import { useAuthStore } from "../stores/authStore";
import { useToast } from "../components/ui/use-toast";
import { io as mockedIo, Socket } from "socket.io-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock external modules
vi.mock("socket.io-client");
vi.mock("../stores/authStore");
vi.mock("../stores/typingStore", () => ({
  useTypingStore: vi.fn(() => ({ setTypingStatus: vi.fn() })),
}));
vi.mock("../stores/projectStore", () => ({
  useProjectStore: vi.fn(() => ({ currentProjectId: 1 })),
}));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useLocation: () => ({ pathname: "/test-path" }),
  };
});
vi.mock("../services/inboxApi"); // Mock updateConversationStatus
vi.mock("../components/ui/use-toast");

// Helper component to consume the context
const TestComponent = () => {
  const { socket } = useSocket();
  return <div data-testid="socket-status">{socket ? "Connected" : "Disconnected"}</div>;
};

describe("SocketContext", () => {
  let mockSocket: Socket;
  const mockToast = vi.fn();
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create fresh QueryClient for each test to prevent state pollution
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Mock socket.io-client setup
    mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      disconnect: vi.fn(),
      close: vi.fn(),
      emit: vi.fn(),
      // Add server property for eventsGateway.server.emit
      server: {
        to: vi.fn().mockReturnThis(),
        emit: vi.fn(),
      },
      // Mock onAny for console.log
      onAny: vi.fn(),
    } as unknown as Socket;

    (mockedIo as unknown as Mock).mockReturnValue(mockSocket);
    // Correctly mock Zustand store selector
    (useAuthStore as unknown as Mock).mockImplementation((selector: (state: any) => any) =>
      selector({ accessToken: "test-token" })
    );
    (useToast as unknown as Mock).mockReturnValue({ toast: mockToast });
  });

  afterEach(() => {
    // Clear QueryClient to prevent state leakage and pending operations
    queryClient.clear();
    // Ensure socket disconnects if it was connected
    if (mockSocket && mockSocket.disconnect) {
      mockSocket.disconnect();
    }
  });

  it("should connect socket when accessToken is present", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      </QueryClientProvider>
    );

    // Expect io to be called with auth token
    expect(mockedIo).toHaveBeenCalledWith(expect.any(String), {
      auth: { token: "test-token" },
    });

    // Manually trigger the 'connect' event within act
    await act(async () => {
        const connectHandler = (mockSocket.on as Mock).mock.calls.find(
            (call: any[]) => call[0] === "connect"
        )?.[1];
        if (connectHandler) {
            connectHandler();
        }
    });

    expect(screen.getByTestId("socket-status")).toHaveTextContent("Connected");
  });

  it("should disconnect socket when accessToken is removed", async () => {
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      </QueryClientProvider>
    );

    // Simulate connection within act
    await act(async () => {
        const connectHandler = (mockSocket.on as Mock).mock.calls.find(
            (call: any[]) => call[0] === "connect"
        )?.[1];
        if (connectHandler) {
            connectHandler();
        }
    });

    expect(screen.getByTestId("socket-status")).toHaveTextContent("Connected");

    // Simulate token removal within act
    await act(async () => {
        (useAuthStore as unknown as Mock).mockImplementation((selector: (state: any) => any) => selector({ accessToken: null }));
        rerender(
            <QueryClientProvider client={queryClient}>
                <SocketProvider>
                    <TestComponent />
                </SocketProvider>
            </QueryClientProvider>
        );
    });

    // Expect disconnect and close to be called
    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(mockSocket.close).toHaveBeenCalled();

    await waitFor(() => {
        expect(screen.getByTestId("socket-status")).toHaveTextContent("Disconnected");
    });
  });

  it("should show a toast notification when 'automation.triggered' event is received", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      </QueryClientProvider>
    );

    // Simulate socket connection within act
    await act(async () => {
        const connectHandler = (mockSocket.on as Mock).mock.calls.find(
            (call: any[]) => call[0] === "connect"
        )?.[1];
        if (connectHandler) {
            connectHandler();
        }
    });

    // Find the 'automation.triggered' event handler
    // Ensure the event handler is registered AFTER socket connection is established (setSocket(newSocket) in provider)
    let automationTriggeredHandler: any;
    await waitFor(() => {
        automationTriggeredHandler = (mockSocket.on as Mock).mock.calls.find(
            (call: any[]) => call[0] === "automation.triggered"
        )?.[1];
        expect(automationTriggeredHandler).toBeDefined();
    });

    const mockPayload = {
      conversationId: "123",
      type: "auto_pending",
      message: "Conversation moved to Pending automatically.",
    };

    // Trigger the event within act
    await act(async () => {
      if (automationTriggeredHandler) {
        automationTriggeredHandler(mockPayload);
      }
    });

    // Expect toast to be called with the payload message
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Tự động hóa",
        description: mockPayload.message,
      });
    });
  });
});
