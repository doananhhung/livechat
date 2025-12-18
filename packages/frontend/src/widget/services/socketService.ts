// src/widget/services/socketService.ts
import { io, Socket } from "socket.io-client";
import { useChatStore } from "../store/useChatStore";
import { type Message } from "../types";
import { log } from "console";

// Socket.IO runs on the root domain, not /api/v1
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "");

// Utility function for timestamped logging
const logWithTime = (instanceId: string, message: string, ...args: any[]) => {
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
  console.log(
    `[${timestamp}] [SocketService ${instanceId}] ${message}`,
    ...args
  );
};

const errorWithTime = (instanceId: string, message: string, ...args: any[]) => {
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
  console.error(
    `[${timestamp}] [SocketService ${instanceId}] ${message}`,
    ...args
  );
};

class SocketService {
  private socket: Socket | null = null;
  private isConnecting = false; // Prevent race conditions
  private eventHandlers: Map<string, Function> = new Map(); // Track handlers for cleanup
  private lastContextUpdate = 0; // Timestamp of last context update
  private readonly CONTEXT_UPDATE_THROTTLE = 3000; // Throttle to max 1 update per 3 seconds
  private readonly instanceId: string;
  private connectionCount = 0; // Track number of connection attempts
  private disconnectionCount = 0; // Track number of disconnections

  constructor() {
    this.instanceId = crypto.randomUUID().slice(0, 8);
    logWithTime(
      this.instanceId,
      `✨ Instance created at ${new Date().toISOString()}`
    );
  }

  // Method to connect and listen for events
  public connect(projectId: string, visitorUid: string): void {
    logWithTime(this.instanceId, `🔍 Entering connect() method.`);
    // logWithTime(this.instanceId, "🛑 SOCKET CONNECTION DISABLED FOR DEBUGGING. To re-enable, remove the return statement in `socketService.ts`.");
    // return;
    this.connectionCount++;
    logWithTime(
      this.instanceId,
      `🔌 connect() called for projectId: ${projectId} | Connection attempt #${this.connectionCount}`
    );
    const socketUrlWithParams = `${SOCKET_URL}?projectId=${projectId}`;

    // Prevent multiple simultaneous connection attempts
    if (this.socket?.connected || this.isConnecting) {
      errorWithTime(
        this.instanceId,
        `⚠️ Connect IGNORED: socket already ${
          this.socket?.connected ? "CONNECTED" : "CONNECTING"
        } | Current socket ID: ${this.socket?.id}`
      );
      return;
    }

    // Clean up old socket completely before creating new one
    if (this.socket) {
      errorWithTime(
        this.instanceId,
        `⚠️ STALE SOCKET FOUND! Disconnecting it before creating new one. Old socket ID: ${this.socket.id}`
      );
      this.disconnect();
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

    logWithTime(
      this.instanceId,
      `📡 Creating new socket instance... | Connection #${this.connectionCount}`
    );
    this.socket = io(socketUrlWithParams, {
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 10000, // Cap max delay at 10s
      timeout: 10000, // Connection timeout
      // Force new connection to avoid reusing old one
      forceNew: true,
      // Reduce transport options to prevent memory overhead
      transports: ["websocket", "polling"],
    });

    logWithTime(
      this.instanceId,
      `🔧 Socket.IO instance created with config: reconnectionAttempts=5, delay=5s, timeout=10s`
    );

    // Track reconnection attempts
    const reconnectAttemptHandler = (attempt: number) => {
      logWithTime(
        this.instanceId,
        `🔄 RECONNECT ATTEMPT #${attempt} started...`
      );
    };

    const reconnectHandler = (attempt: number) => {
      logWithTime(
        this.instanceId,
        `✅ RECONNECTED after ${attempt} attempt(s) | New socket ID: ${this.socket?.id}`
      );
    };

    const reconnectErrorHandler = (error: Error) => {
      errorWithTime(this.instanceId, `❌ RECONNECT ERROR:`, error);
    };

    // --- Listen for events from the Server ---
    logWithTime(this.instanceId, `👂 Registering socket event handlers...`);
    // Store handlers for proper cleanup
    const connectHandler = () => {
      this.isConnecting = false;
      setConnectionStatus("connected");
      logWithTime(
        this.instanceId,
        `✅ Socket CONNECTED with ID: ${this.socket?.id} | Total connections: ${this.connectionCount}`
      );
      // Send identification event immediately after connecting
      this.socket?.emit("identify", { projectId, visitorUid });
    };

    const disconnectHandler = () => {
      this.isConnecting = false;
      this.disconnectionCount++;
      setConnectionStatus("disconnected");
      logWithTime(
        this.instanceId,
        `🔌 Socket DISCONNECTED | Socket ID was: ${this.socket?.id} | Total disconnections: ${this.disconnectionCount}`
      );
    };

    const connectErrorHandler = (error: Error) => {
      this.isConnecting = false;
      setConnectionStatus("disconnected");
      errorWithTime(this.instanceId, `❌ Connection ERROR:`, error);
    };

    const reconnectFailedHandler = () => {
      this.isConnecting = false;
      setConnectionStatus("disconnected");
      errorWithTime(
        this.instanceId,
        `❌ Socket reconnection FAILED after all attempts`
      );
    };

    const conversationHistoryHandler = (data: { messages: Message[] }) => {
      logWithTime(this.instanceId, `📜 Conversation history received:`, data);
      loadConversationHistory(data.messages);
    };

    const messageSentHandler = (data: {
      tempId: string;
      finalMessage: any;
    }) => {
      logWithTime(this.instanceId, `📤 Message sent:`, data);
      const finalMessage = data.finalMessage;
      const correctedMessage: Message = {
        ...finalMessage,
        sender: {
          type: finalMessage.sender === "visitor" ? "visitor" : "agent",
        },
      };
      finalizeMessage(data.tempId, correctedMessage);
    };

    const agentRepliedHandler = (data: any) => {
      // Transform the data to match the Message type
      logWithTime(this.instanceId, `📥 Agent replied:`, data);
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
      logWithTime(
        this.instanceId,
        `💬 New message added from agent | Message ID: ${newMessage.id}`
      );
      if (!useChatStore.getState().isWindowOpen) {
        logWithTime(
          this.instanceId,
          `🔔 Chat window is closed, incrementing unread count`
        );
        incrementUnreadCount();
      }
    };

    const agentIsTypingHandler = (data: {
      agentName: string;
      isTyping: boolean;
    }) => {
      logWithTime(this.instanceId, `✍️ Agent isTyping event received:`, data);
      setAgentIsTyping(data.isTyping);
    };

    // Register handlers
    logWithTime(this.instanceId, `🎯 Registering listener: "connect"`);
    this.socket.on("connect", connectHandler);
    logWithTime(this.instanceId, `🎯 Registering listener: "disconnect"`);
    this.socket.on("disconnect", disconnectHandler);
    logWithTime(this.instanceId, `🎯 Registering listener: "connect_error"`);
    this.socket.on("connect_error", connectErrorHandler);
    logWithTime(this.instanceId, `🎯 Registering listener: "reconnect_failed"`);
    this.socket.on("reconnect_failed", reconnectFailedHandler);
    logWithTime(
      this.instanceId,
      `🎯 Registering listener: "reconnect_attempt"`
    );
    this.socket.on("reconnect_attempt", reconnectAttemptHandler);
    logWithTime(this.instanceId, `🎯 Registering listener: "reconnect"`);
    this.socket.on("reconnect", reconnectHandler);
    logWithTime(this.instanceId, `🎯 Registering listener: "reconnect_error"`);
    this.socket.on("reconnect_error", reconnectErrorHandler);
    logWithTime(
      this.instanceId,
      `🎯 Registering listener: "conversationHistory"`
    );
    this.socket.on("conversationHistory", conversationHistoryHandler);
    logWithTime(this.instanceId, `🎯 Registering listener: "messageSent"`);
    this.socket.on("messageSent", messageSentHandler);
    logWithTime(this.instanceId, `🎯 Registering listener: "agentReplied"`);
    this.socket.on("agentReplied", agentRepliedHandler);
    logWithTime(this.instanceId, `🎯 Registering listener: "agentIsTyping"`);
    this.socket.on("agentIsTyping", agentIsTypingHandler);

    // Store handlers for cleanup
    logWithTime(this.instanceId, `📥 Storing handler in Map: "connect"`);
    this.eventHandlers.set("connect", connectHandler);
    logWithTime(this.instanceId, `📥 Storing handler in Map: "disconnect"`);
    this.eventHandlers.set("disconnect", disconnectHandler);
    logWithTime(this.instanceId, `📥 Storing handler in Map: "connect_error"`);
    this.eventHandlers.set("connect_error", connectErrorHandler);
    logWithTime(
      this.instanceId,
      `📥 Storing handler in Map: "reconnect_failed"`
    );
    this.eventHandlers.set("reconnect_failed", reconnectFailedHandler);
    logWithTime(
      this.instanceId,
      `📥 Storing handler in Map: "reconnect_attempt"`
    );
    this.eventHandlers.set("reconnect_attempt", reconnectAttemptHandler);
    logWithTime(this.instanceId, `📥 Storing handler in Map: "reconnect"`);
    this.eventHandlers.set("reconnect", reconnectHandler);
    logWithTime(
      this.instanceId,
      `📥 Storing handler in Map: "reconnect_error"`
    );
    this.eventHandlers.set("reconnect_error", reconnectErrorHandler);
    logWithTime(
      this.instanceId,
      `📥 Storing handler in Map: "conversationHistory"`
    );
    this.eventHandlers.set("conversationHistory", conversationHistoryHandler);
    logWithTime(this.instanceId, `📥 Storing handler in Map: "messageSent"`);
    this.eventHandlers.set("messageSent", messageSentHandler);
    logWithTime(this.instanceId, `📥 Storing handler in Map: "agentReplied"`);
    this.eventHandlers.set("agentReplied", agentRepliedHandler);
    logWithTime(this.instanceId, `📥 Storing handler in Map: "agentIsTyping"`);
    this.eventHandlers.set("agentIsTyping", agentIsTypingHandler);

    logWithTime(
      this.instanceId,
      `📊 Current eventHandlers map size: ${this.eventHandlers.size}`
    );
    logWithTime(
      this.instanceId,
      `✅ Registered ${this.eventHandlers.size} event handlers (including reconnection handlers)`
    );

    // Only log in development - but make sure to cleanup
    if (import.meta.env.DEV) {
      const debugHandler = (eventName: string, ...args: any[]) => {
        logWithTime(this.instanceId, `📨 [Socket Event]: ${eventName}`, args);
      };
      this.socket.onAny(debugHandler);
      this.eventHandlers.set("__debug__", debugHandler);
      logWithTime(
        this.instanceId,
        `🐛 Debug handler registered | Total handlers: ${this.eventHandlers.size}`
      );
    }
  }

  // --- Helper to remove all listeners (prevent duplicates) ---
  private removeAllListeners(): void {
    logWithTime(this.instanceId, `🧹 Entering removeAllListeners() method.`);
    if (!this.socket) return;

    const handlersCount = this.eventHandlers.size;
    logWithTime(
      this.instanceId,
      `🧹 CLEANING UP ${handlersCount} event listeners for socket ID: ${this.socket.id}`
    );

    // Remove all registered event handlers properly
    this.eventHandlers.forEach((handler, eventName) => {
      if (eventName === "__debug__") {
        this.socket?.offAny(handler as any);
        logWithTime(this.instanceId, `🧹 Removed debug handler (onAny)`);
      } else {
        this.socket?.off(eventName, handler as any);
        logWithTime(this.instanceId, `🧹 Removed handler: ${eventName}`);
      }
    });

    // Clear the handlers map
    this.eventHandlers.clear();
    logWithTime(
      this.instanceId,
      `✅ All handlers cleared | Remaining: ${this.eventHandlers.size}`
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
    // MEMORY LEAK FIX: Throttle context updates to prevent excessive socket emissions
    const now = Date.now();
    if (now - this.lastContextUpdate < this.CONTEXT_UPDATE_THROTTLE) {
      return; // Skip this update, too soon after last one
    }

    if (this.socket?.connected) {
      this.socket.emit("updateContext", { currentUrl });
      this.lastContextUpdate = now;
    }
  }

  public disconnect(): void {
    logWithTime(this.instanceId, `🔌 Entering disconnect() method.`);
    if (!this.socket) {
      errorWithTime(
        this.instanceId,
        `⚠️ Disconnect IGNORED: no socket instance to disconnect | connectionCount: ${this.connectionCount}, disconnectionCount: ${this.disconnectionCount}`
      );
      return;
    }

    const socketId = this.socket.id;
    logWithTime(
      this.instanceId,
      `❌ disconnect() called for socket ID: ${socketId} | Stats: ${this.connectionCount} connections, ${this.disconnectionCount} disconnections`
    );

    this.removeAllListeners();

    logWithTime(
      this.instanceId,
      `🔌 Disconnecting and closing socket ID: ${socketId}...`
    );
    this.socket.disconnect();
    this.socket.close(); // Force close the socket

    this.socket = null;
    this.isConnecting = false;
    logWithTime(
      this.instanceId,
      `✅ Socket instance set to null | Final stats: ${this.connectionCount} total connections, ${this.disconnectionCount} total disconnections`
    );
  }
}

// Export a single instance (singleton) for the entire widget to use
export const socketService = new SocketService();
