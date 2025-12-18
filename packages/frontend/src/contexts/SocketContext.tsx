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
import type { Message } from "@social-commerce/shared";
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

    const handleNewMessage = async (newMessage: Message) => {
      const conversationId = parseInt(String(newMessage.conversationId), 10);

      if (isNaN(conversationId)) return;

      // Optimistically update the messages list
      queryClient.setQueryData(
        ["messages", conversationId],
        (oldData?: Message[]) => {
          if (oldData && !oldData.some((msg) => msg.id === newMessage.id)) {
            return [...oldData, newMessage];
          }
          return oldData || [newMessage];
        }
      );

      // Check if the conversation is currently open
      const pathMatch = location.pathname.match(/\/conversations\/(\d+)/);
      const activeConversationId = pathMatch
        ? parseInt(pathMatch[1], 10)
        : null;

      // If the message is from the currently open conversation, mark it as read immediately
      if (activeConversationId === conversationId && newMessage.fromCustomer) {
        try {
          await updateConversationStatus({
            conversationId,
            payload: { read: true },
          });
        } catch (error) {
          console.error("Failed to mark conversation as read:", error);
        }
      }

      // Also invalidate conversations to update snippets/unread counts
      if (currentProjectId) {
        queryClient.invalidateQueries({
          queryKey: ["conversations", currentProjectId],
        });
      }
    };

    const handleVisitorTyping = (payload: {
      conversationId: number;
      isTyping: boolean;
    }) => {
      setTypingStatus(payload.conversationId, payload.isTyping);
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("agentReplied", handleNewMessage);
    socket.on("visitorIsTyping", handleVisitorTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("agentReplied", handleNewMessage);
      socket.off("visitorIsTyping", handleVisitorTyping);
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

      newSocket.on("connect", () => {
        setSocket(newSocket);
      });

      newSocket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [accessToken]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
