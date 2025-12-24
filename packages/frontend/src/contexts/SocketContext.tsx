
// src/contexts/SocketContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../stores/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { type Message, WebSocketEvent, type VisitorContextUpdatedPayload, type VisitorTypingBroadcastPayload } from "@live-chat/shared-types";
import { useTypingStore } from "../stores/typingStore";
import { useProjectStore } from "../stores/projectStore";
import { useLocation } from "react-router-dom";
import { updateConversationStatus } from "../services/inboxApi";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "");

// --- Real-time cache update hook ---
const useRealtimeCacheUpdater = (socket: Socket | null) => {
  const queryClient = useQueryClient();
  const setTypingStatus = useTypingStore((state) => state.setTypingStatus);
  const currentProjectId = useProjectStore((state) => state.currentProjectId);
  const location = useLocation();

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.onAny((event, ...args) => {
      console.log(`[Socket.IO] Event received: ${event}`, args);
    });

    // Define all handlers as stable references
    const handleNewMessage = async (newMessage: Message) => {
      const conversationId = parseInt(String(newMessage.conversationId), 10);

      if (isNaN(conversationId)) return;

      // Extract projectId from URL to match the cache key used in inboxApi.ts
      const projectPathMatch = location.pathname.match(/\/projects\/(\d+)/);
      const projectIdFromUrl = projectPathMatch
        ? parseInt(projectPathMatch[1], 10)
        : null;

      // Optimistically update the messages list
      // Use the same cache key structure as inboxApi.ts: ["messages", projectId, conversationId]
      if (projectIdFromUrl) {
        queryClient.setQueryData(
          ["messages", projectIdFromUrl, conversationId],
          (oldData?: Message[]) => {
            if (oldData && !oldData.some((msg) => msg.id === newMessage.id)) {
              return [...oldData, newMessage];
            }
            return oldData || [newMessage];
          }
        );
      }

      // Check if the conversation is currently open
      const pathMatch = location.pathname.match(/\/conversations\/(\d+)/);
      const activeConversationId = pathMatch
        ? parseInt(pathMatch[1], 10)
        : null;

      // If the message is from the currently open conversation, mark it as read immediately
      if (activeConversationId === conversationId && newMessage.fromCustomer && projectIdFromUrl) {
        try {
          await updateConversationStatus({
            projectId: projectIdFromUrl,
            conversationId,
            payload: { read: true },
          });
        } catch (error) {
          console.error("Failed to mark conversation as read:", error);
        }
      }

      // Also invalidate conversations to update snippets/unread counts
      if (currentProjectId) {
        console.log(
          "Invalidating conversations cache for project:",
          currentProjectId
        );
        queryClient.invalidateQueries({
          queryKey: ["conversations", currentProjectId],
        });
      }
    };

    const handleVisitorTyping = (payload: VisitorTypingBroadcastPayload) => {
      setTypingStatus(payload.conversationId, payload.isTyping);
    };

    const handleVisitorContextUpdated = (payload: VisitorContextUpdatedPayload) => {
      // Update the visitor's currentUrl in the conversations cache
      queryClient.setQueriesData<any>(
        { queryKey: ["conversations"] },
        (oldData: any) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data.map((conversation: any) => {
                if (
                  Number(conversation.id) === Number(payload.conversationId) &&
                  conversation.visitor
                ) {
                  return {
                    ...conversation,
                    visitor: {
                      ...conversation.visitor,
                      currentUrl: payload.currentUrl,
                    },
                  };
                }
                return conversation;
              }),
            })),
          };
        }
      );

      // Also update the specific visitor cache if it exists
      const conversationIdNum = Number(payload.conversationId);
      const allConversations = queryClient
        .getQueriesData<any>({ queryKey: ["conversations"] })
        .flatMap(([, cacheData]) =>
          cacheData?.pages.flatMap((page: any) => page.data)
        );

      const conversation = allConversations.find(
        (c: any) => c && Number(c.id) === conversationIdNum
      );

      if (conversation?.visitor?.id) {
        queryClient.setQueryData(
          ["visitor", conversation.visitor.id],
          (oldVisitor: any) => {
            if (!oldVisitor) return oldVisitor;
            return {
              ...oldVisitor,
              currentUrl: payload.currentUrl,
            };
          }
        );
      }
    };

    socket.on(WebSocketEvent.NEW_MESSAGE, handleNewMessage);
    socket.on(WebSocketEvent.AGENT_REPLIED, handleNewMessage);
    socket.on(WebSocketEvent.VISITOR_TYPING, handleVisitorTyping);
    socket.on(WebSocketEvent.VISITOR_CONTEXT_UPDATED, handleVisitorContextUpdated);

    // CRITICAL: Always cleanup listeners on unmount or when dependencies change
    return () => {
      socket.off(WebSocketEvent.NEW_MESSAGE, handleNewMessage);
      socket.off(WebSocketEvent.AGENT_REPLIED, handleNewMessage);
      socket.off(WebSocketEvent.VISITOR_TYPING, handleVisitorTyping);
      socket.off(WebSocketEvent.VISITOR_CONTEXT_UPDATED, handleVisitorContextUpdated);
    };
  }, [
    socket,
    queryClient,
    setTypingStatus,
    currentProjectId,
    location.pathname,
  ]);
};

// --- Context, Provider, and useSocket Hook ---
interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  useRealtimeCacheUpdater(socket);

  useEffect(() => {
    if (accessToken) {
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: accessToken,
        },
      });

      const handleConnect = () => {
        console.log("✅ Socket connected");
        setSocket(newSocket);
      };

      const handleDisconnect = () => {
        console.log("❌ Socket disconnected");
      };

      newSocket.on("connect", handleConnect);
      newSocket.on("disconnect", handleDisconnect);

      return () => {
        // Properly cleanup socket
        newSocket.off("connect", handleConnect);
        newSocket.off("disconnect", handleDisconnect);
        newSocket.disconnect();
        newSocket.close();
        setSocket(null);
      };
    } else {
      if (socket) {
        socket.disconnect();
        socket.close();
        setSocket(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
