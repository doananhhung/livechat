// src/widget/services/socketService.ts
import { io, Socket } from "socket.io-client";
import { useChatStore } from "../store/useChatStore";
import { type Message } from "../types";

// Socket.IO runs on the root domain, not /api/v1
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "");

class SocketService {
  private socket: Socket | null = null;

  // Method to connect and listen for events
  public connect(projectId: string, visitorUid: string): void {
    const socketUrlWithParams = `${SOCKET_URL}?projectId=${projectId}`;

    if (this.socket?.connected) {
      return;
    }

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

    // --- Listen for events from the Server ---

    this.socket.on("connect", () => {
      setConnectionStatus("connected");
      // Send identification event immediately after connecting
      this.socket?.emit("identify", { projectId, visitorUid });
    });

    this.socket.on("disconnect", () => {
      setConnectionStatus("disconnected");
    });

    this.socket.on("connect_error", () => {
      setConnectionStatus("disconnected");
    });

    this.socket.on("reconnect_failed", () => {
      setConnectionStatus("disconnected");
    });

    this.socket.onAny((eventName, ...args) => {
      console.log(`[Socket Event]: ${eventName}`, args);
    });

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
    this.socket?.disconnect();
    this.socket = null;
  }
}

// Export a single instance (singleton) for the entire widget to use
export const socketService = new SocketService();
