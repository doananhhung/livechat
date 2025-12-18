// src/widget/services/socketService.ts
import { io, Socket } from "socket.io-client";
import { useChatStore } from "../store/useChatStore";
import { type Message } from "../types";

// Socket.IO runs on the root domain, not /api/v1
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "");

class SocketService {
  private socket: Socket | null = null;
  private isConnecting = false; // Prevent race conditions

  // Method to connect and listen for events
  public connect(projectId: string, visitorUid: string): void {
    const socketUrlWithParams = `${SOCKET_URL}?projectId=${projectId}`;

    // Prevent multiple simultaneous connection attempts
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    const {
      setConnectionStatus,
      loadConversationHistory,
      addMessage,
      setAgentIsTyping,
      incrementUnreadCount,
      finalizeMessage,
    } = useChatStore.getState();
    setConnectionStatus("connecting");

    this.socket = io(socketUrlWithParams, {
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
    });

    // --- Remove all existing listeners before adding new ones ---
    this.removeAllListeners();

    // --- Listen for events from the Server ---

    this.socket.on("connect", () => {
      this.isConnecting = false;
      setConnectionStatus("connected");
      // Send identification event immediately after connecting
      this.socket?.emit("identify", { projectId, visitorUid });
    });

    this.socket.on("disconnect", () => {
      this.isConnecting = false;
      setConnectionStatus("disconnected");
    });

    this.socket.on("connect_error", () => {
      this.isConnecting = false;
      setConnectionStatus("disconnected");
    });

    this.socket.on("reconnect_failed", () => {
      this.isConnecting = false;
      setConnectionStatus("disconnected");
    });

    // Only log in development
    if (import.meta.env.DEV) {
      this.socket.onAny((eventName, ...args) => {
        console.log(`[Socket Event]: ${eventName}`, args);
      });
    }

    this.socket.on("conversationHistory", (data: { messages: Message[] }) => {
      loadConversationHistory(data.messages);
    });

    this.socket.on(
      "messageSent",
      (data: { tempId: string; finalMessage: any }) => {
        const finalMessage = data.finalMessage;
        const correctedMessage: Message = {
          ...finalMessage,
          sender: {
            type: finalMessage.sender === "visitor" ? "visitor" : "agent",
          },
        };
        finalizeMessage(data.tempId, correctedMessage);
      }
    );

    this.socket.on("agentReplied", (data: any) => {
      // Transform the data to match the Message type
      const newMessage: Message = {
        id: data.id,
        content: data.content,
        sender: {
          type: data.fromCustomer ? "visitor" : "agent",
        },
        status: "sent", // Assuming the message is sent successfully
        timestamp: data.createdAt,
      };

      addMessage(newMessage);
      if (!useChatStore.getState().isWindowOpen) {
        incrementUnreadCount();
      }
    });

    this.socket.on(
      "agentIsTyping",
      (data: { agentName: string; isTyping: boolean }) => {
        setAgentIsTyping(data.isTyping);
      }
    );
  }

  // --- Helper to remove all listeners (prevent duplicates) ---
  private removeAllListeners(): void {
    if (!this.socket) return;

    this.socket.off("connect");
    this.socket.off("disconnect");
    this.socket.off("connect_error");
    this.socket.off("reconnect_failed");
    this.socket.off("conversationHistory");
    this.socket.off("messageSent");
    this.socket.off("agentReplied");
    this.socket.off("agentIsTyping");
    this.socket.offAny();
  }

  // --- Methods to send events to the Server ---

  public emitSendMessage(content: string, tempId: string): void {
    this.socket?.emit("sendMessage", { content, tempId });
  }

  public emitVisitorIsTyping(isTyping: boolean): void {
    this.socket?.emit("visitorIsTyping", { isTyping });
  }

  public emitUpdateContext(currentUrl: string): void {
    if (this.socket?.connected) {
      this.socket.emit("updateContext", { currentUrl });
    }
  }

  public disconnect(): void {
    this.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
    this.isConnecting = false;
  }
}

// Export a single instance (singleton) for the entire widget to use
export const socketService = new SocketService();
