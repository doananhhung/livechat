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
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import {
  type Message,
  WebSocketEvent,
  type VisitorContextUpdatedPayload,
  type VisitorTypingBroadcastPayload,
  type ConversationUpdatedPayload,
  type VisitorNotePayload,
  type VisitorNoteDeletedPayload,
  type VisitorStatusChangedPayload,
  type VisitorUpdatedPayload,
  type FormSubmittedPayload,
  type AutomationTriggeredPayload,
} from "@live-chat/shared-types";
import { useTypingStore } from "../stores/typingStore";
import { useProjectStore } from "../stores/projectStore";
import { useLocation, useNavigate } from "react-router-dom";
import { updateConversationStatus } from "../services/inboxApi";
import { useToast } from "../components/ui/use-toast";
import { useTranslation } from "react-i18next";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "");

// --- Real-time cache update hook ---
const useRealtimeCacheUpdater = (socket: Socket | null) => {
  const queryClient = useQueryClient();
  const setTypingStatus = useTypingStore((state) => state.setTypingStatus);
  const currentProjectId = useProjectStore((state) => state.currentProjectId);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.onAny((event, ...args) => {
      console.log(`[Socket.IO] Event received: ${event}`, args);
    });

    // Define all handlers as stable references
    const handleNewMessage = async (newMessage: Message) => {
      console.log("[SocketContext] handleNewMessage called with:", newMessage);
      console.log("[SocketContext] currentProjectId:", currentProjectId);

      const conversationId = parseInt(String(newMessage.conversationId), 10);

      if (isNaN(conversationId)) {
        console.warn("[SocketContext] Invalid conversationId, skipping");
        return;
      }

      // Extract projectId from URL to match the cache key used in inboxApi.ts
      const projectPathMatch = location.pathname.match(/\/projects\/(\d+)/);
      const projectIdFromUrl = projectPathMatch
        ? parseInt(projectPathMatch[1], 10)
        : null;

      // Optimistically update the messages list
      // Use the same cache key structure as inboxApi.ts: ["messages", projectId, conversationId, undefined]
      // Cache structure is InfiniteData<PaginatedMessages> where PaginatedMessages = { data: Message[], hasNextPage, nextCursor }
      if (projectIdFromUrl) {
        type PaginatedMessages = { data: Message[]; hasNextPage: boolean; nextCursor: string | null };
        queryClient.setQueryData(
          ["messages", projectIdFromUrl, conversationId, undefined],
          (oldData?: InfiniteData<PaginatedMessages>) => {
            if (!oldData || !oldData.pages || oldData.pages.length === 0) {
              // No cache yet, create initial structure
              return {
                pages: [{ data: [newMessage], hasNextPage: false, nextCursor: null }],
                pageParams: [undefined],
              };
            }
            // Check if message already exists in first page
            const firstPageMessages = oldData.pages[0]?.data || [];
            if (firstPageMessages.some((msg) => msg.id === newMessage.id)) {
              return oldData;
            }
            // Append to first page (newest messages)
            return {
              ...oldData,
              pages: oldData.pages.map((page, index) =>
                index === 0
                  ? { ...page, data: [...page.data, newMessage] }
                  : page
              ),
            };
          },
        );
      }

      // Check if the conversation is currently open
      const pathMatch = location.pathname.match(/\/conversations\/(\d+)/);
      const activeConversationId = pathMatch
        ? parseInt(pathMatch[1], 10)
        : null;

      // If the message is from the currently open conversation, mark it as read immediately
      if (
        activeConversationId === conversationId &&
        newMessage.fromCustomer &&
        projectIdFromUrl
      ) {
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

      // Also invalidate conversations to update snippets/unread counts/timestamps
      if (currentProjectId) {
        console.log(
          "[SocketContext] Invalidating and refetching conversations cache for project:",
          currentProjectId,
        );
        queryClient.invalidateQueries({
          queryKey: ["conversations", currentProjectId],
          refetchType: "all", // Force immediate refetch, not just mark stale
        });
      }
    };

    const handleVisitorTyping = (payload: VisitorTypingBroadcastPayload) => {
      setTypingStatus(payload.conversationId, payload.isTyping);
    };

    const handleVisitorContextUpdated = (
      payload: VisitorContextUpdatedPayload,
    ) => {
      console.log("[SocketContext] Received visitorContextUpdated:", payload);

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
                  console.log(
                    "[SocketContext] Updating conversation visitor currentUrl:",
                    payload.currentUrl,
                  );
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
        },
      );

      // Also update the specific visitor cache if it exists
      // IMPORTANT: The cache key must match useGetVisitor: ["visitor", projectId, visitorId]
      const conversationIdNum = Number(payload.conversationId);
      const allConversations = queryClient
        .getQueriesData<any>({ queryKey: ["conversations"] })
        .flatMap(([, cacheData]) =>
          cacheData?.pages.flatMap((page: any) => page.data),
        );

      const conversation = allConversations.find(
        (c: any) => c && Number(c.id) === conversationIdNum,
      );

      if (conversation?.visitor?.id && currentProjectId) {
        console.log("[SocketContext] Updating visitor cache with key:", [
          "visitor",
          currentProjectId,
          conversation.visitor.id,
        ]);
        queryClient.setQueryData(
          ["visitor", currentProjectId, conversation.visitor.id],
          (oldVisitor: any) => {
            if (!oldVisitor) return oldVisitor;
            return {
              ...oldVisitor,
              currentUrl: payload.currentUrl,
            };
          },
        );
      }
    };

    // NEW: Handle Visitor Status Changed (Online/Offline)
    const handleVisitorStatusChanged = (
      payload: VisitorStatusChangedPayload,
    ) => {
      console.log("[SocketContext] Received visitorStatusChanged:", payload);

      // Update conversations cache (visitor.isOnline)
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
                  conversation.visitor &&
                  conversation.visitor.visitorUid === payload.visitorUid
                ) {
                  return {
                    ...conversation,
                    visitor: {
                      ...conversation.visitor,
                      isOnline: payload.isOnline,
                    },
                  };
                }
                return conversation;
              }),
            })),
          };
        },
      );

      // Find visitor ID to update specific visitor cache
      // Ideally payload should have visitorId, but it has visitorUid. We try to find match in conversations.
      const allConversations = queryClient
        .getQueriesData<any>({ queryKey: ["conversations"] })
        .flatMap(([, cacheData]) =>
          cacheData?.pages.flatMap((page: any) => page.data),
        );

      const visitorId = allConversations.find(
        (c: any) => c?.visitor?.visitorUid === payload.visitorUid,
      )?.visitor?.id;

      if (visitorId && currentProjectId) {
        queryClient.setQueryData(
          ["visitor", currentProjectId, visitorId],
          (oldVisitor: any) => {
            if (!oldVisitor) return oldVisitor;
            return { ...oldVisitor, isOnline: payload.isOnline };
          },
        );
      }
    };

    // NEW: Handle Visitor Updated (e.g. Name Change)
    const handleVisitorUpdated = (payload: VisitorUpdatedPayload) => {
      console.log("[SocketContext] Received visitorUpdated:", payload);

      // Update conversations cache
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
                  Number(conversation.visitorId) === Number(payload.visitorId)
                ) {
                  return {
                    ...conversation,
                    visitor: payload.visitor,
                  };
                }
                return conversation;
              }),
            })),
          };
        },
      );

      // Update specific visitor cache
      if (currentProjectId) {
        queryClient.setQueryData(
          ["visitor", currentProjectId, payload.visitorId],
          payload.visitor,
        );
      }
    };

    // NEW: Handle Form Submitted
    const handleFormSubmitted = (payload: FormSubmittedPayload) => {
      console.log("[SocketContext] Received formSubmitted:", payload);

      const conversationId = parseInt(payload.conversationId, 10);
      const projectIdFromUrl = currentProjectId; // Best effort to get project ID

      const submissionMessage = payload.message;

      // 1. Add the submission message to the cache
      // Cache structure is InfiniteData<PaginatedMessages>
      type PaginatedMessages = { data: Message[]; hasNextPage: boolean; nextCursor: string | null };
      if (projectIdFromUrl && conversationId && submissionMessage) {
        // Optimistically add the submission message if not already there
        queryClient.setQueryData(
          ["messages", projectIdFromUrl, conversationId, undefined],
          (oldData?: InfiniteData<PaginatedMessages>) => {
            if (!oldData || !oldData.pages || oldData.pages.length === 0) {
              return {
                pages: [{ data: [submissionMessage], hasNextPage: false, nextCursor: null }],
                pageParams: [undefined],
              };
            }
            // Check if message already exists
            const firstPageMessages = oldData.pages[0]?.data || [];
            if (firstPageMessages.some((msg) => msg.id === submissionMessage.id)) {
              return oldData;
            }
            // Add new message to first page
            return {
              ...oldData,
              pages: oldData.pages.map((page, index) =>
                index === 0
                  ? { ...page, data: [...page.data, submissionMessage] }
                  : page
              ),
            };
          },
        );

        // 2. Update the original Form Request message to mark it as submitted
        queryClient.setQueryData(
          ["messages", projectIdFromUrl, conversationId, undefined],
          (oldData?: InfiniteData<PaginatedMessages>) => {
            if (!oldData || !oldData.pages) return oldData;

            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                data: page.data.map((msg) => {
                  if (
                    submissionMessage?.metadata?.formRequestMessageId &&
                    (msg.id === submissionMessage.metadata.formRequestMessageId ||
                      msg.id === payload.data?.formRequestMessageId)
                  ) {
                    const currentMetadata = msg.metadata || {};
                    return {
                      ...msg,
                      metadata: {
                        ...currentMetadata,
                        submissionId: payload.submissionId,
                        submittedAt: new Date().toISOString(),
                      },
                    };
                  }
                  return msg;
                }),
              })),
            };
          },
        );
      }

      // Force refresh conversations to update snippets
      if (currentProjectId) {
        queryClient.invalidateQueries({
          queryKey: ["conversations", currentProjectId],
        });
      }
    };

    const handleConversationUpdated = (payload: ConversationUpdatedPayload) => {
      console.log("[SocketContext] Received conversationUpdated:", payload);

      // If this is the currently selected conversation and status changed,
      // update the URL status filter to keep the conversation visible
      const pathMatch = location.pathname.match(/\/conversations\/(\d+)/);
      const activeConversationId = pathMatch
        ? parseInt(pathMatch[1], 10)
        : null;

      if (
        activeConversationId &&
        Number(payload.conversationId) === activeConversationId &&
        payload.fields?.status
      ) {
        // Navigate to the new status filter to update tabs and keep conversation visible
        navigate(`${location.pathname}?status=${payload.fields.status}`, {
          replace: true,
        });
      }

      // Invalidate queries to fetch updated assignee details
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    const handleVisitorNoteAdded = (payload: VisitorNotePayload) => {
      if (!currentProjectId) return;
      queryClient.setQueryData(
        ["visitor-notes", currentProjectId, payload.visitorId],
        (oldData: any[]) => {
          if (!oldData) return [payload.note];
          if (oldData.some((n) => n.id === payload.note.id)) return oldData;
          return [payload.note, ...oldData]; // Prepend (desc order)
        },
      );
    };

    const handleVisitorNoteUpdated = (payload: VisitorNotePayload) => {
      if (!currentProjectId) return;
      queryClient.setQueryData(
        ["visitor-notes", currentProjectId, payload.visitorId],
        (oldData: any[]) => {
          if (!oldData) return oldData;
          return oldData.map((n) =>
            n.id === payload.note.id ? payload.note : n,
          );
        },
      );
    };

    const handleVisitorNoteDeleted = (payload: VisitorNoteDeletedPayload) => {
      if (!currentProjectId) return;
      queryClient.setQueryData(
        ["visitor-notes", currentProjectId, payload.visitorId],
        (oldData: any[]) => {
          if (!oldData) return oldData;
          return oldData.filter((n) => n.id !== payload.noteId);
        },
      );
    };

    const handleAutomationTriggered = (payload: AutomationTriggeredPayload) => {
      toast({
        title: t("common.automation"),
        description: payload.message,
      });
    };

    socket.on(WebSocketEvent.NEW_MESSAGE, handleNewMessage);
    socket.on(WebSocketEvent.AGENT_REPLIED, handleNewMessage);
    socket.on(WebSocketEvent.VISITOR_TYPING, handleVisitorTyping);
    socket.on(
      WebSocketEvent.VISITOR_CONTEXT_UPDATED,
      handleVisitorContextUpdated,
    );
    socket.on(WebSocketEvent.CONVERSATION_UPDATED, handleConversationUpdated);
    socket.on(WebSocketEvent.VISITOR_NOTE_ADDED, handleVisitorNoteAdded);
    socket.on(WebSocketEvent.VISITOR_NOTE_UPDATED, handleVisitorNoteUpdated);
    socket.on(WebSocketEvent.VISITOR_NOTE_DELETED, handleVisitorNoteDeleted);
    socket.on(
      WebSocketEvent.VISITOR_STATUS_CHANGED,
      handleVisitorStatusChanged,
    ); // ADDED
    socket.on(WebSocketEvent.VISITOR_UPDATED, handleVisitorUpdated); // ADDED
    socket.on(WebSocketEvent.FORM_SUBMITTED, handleFormSubmitted); // ADDED
    socket.on(WebSocketEvent.AUTOMATION_TRIGGERED, handleAutomationTriggered);

    // CRITICAL: Always cleanup listeners on unmount or when dependencies change
    return () => {
      socket.off(WebSocketEvent.NEW_MESSAGE, handleNewMessage);
      socket.off(WebSocketEvent.AGENT_REPLIED, handleNewMessage);
      socket.off(WebSocketEvent.VISITOR_TYPING, handleVisitorTyping);
      socket.off(
        WebSocketEvent.VISITOR_CONTEXT_UPDATED,
        handleVisitorContextUpdated,
      );
      socket.off(
        WebSocketEvent.CONVERSATION_UPDATED,
        handleConversationUpdated,
      );
      socket.off(WebSocketEvent.VISITOR_NOTE_ADDED, handleVisitorNoteAdded);
      socket.off(WebSocketEvent.VISITOR_NOTE_UPDATED, handleVisitorNoteUpdated);
      socket.off(WebSocketEvent.VISITOR_NOTE_DELETED, handleVisitorNoteDeleted);
      socket.off(
        WebSocketEvent.VISITOR_STATUS_CHANGED,
        handleVisitorStatusChanged,
      ); // ADDED
      socket.off(WebSocketEvent.VISITOR_UPDATED, handleVisitorUpdated); // ADDED
      socket.off(WebSocketEvent.FORM_SUBMITTED, handleFormSubmitted); // ADDED
      socket.off(
        WebSocketEvent.AUTOMATION_TRIGGERED,
        handleAutomationTriggered,
      );
    };
  }, [
    socket,
    queryClient,
    setTypingStatus,
    currentProjectId,
    location.pathname,
    navigate,
    toast,
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
