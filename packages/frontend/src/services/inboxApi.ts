// src/services/inboxApi.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import api from "../lib/api";
import { v4 as uuidv4 } from "uuid";
import type {
  ListConversationsDto,
  UpdateConversationDto,
  AssignConversationDto,
  AgentTypingDto,
  SendReplyDto,
  ListMessagesDto,
  VisitorResponseDto,
} from "@live-chat/shared-dtos";
import type {
  Conversation,
  Message,
  Visitor,
  PaginationDto,
} from "@live-chat/shared-types";
import { MessageStatus } from "@live-chat/shared-types";

// --- Type Definitions ---
// All type definitions are now imported from @live-chat/shared

// --- API Functions ---

interface UpdateConversationStatusParams {
  projectId: number;
  conversationId: number;
  payload: UpdateConversationDto;
}

export const updateConversationStatus = async ({
  projectId,
  conversationId,
  payload,
}: UpdateConversationStatusParams) => {
  const response = await api.patch(
    `/projects/${projectId}/inbox/conversations/${conversationId}`,
    payload,
  );
  return response.data;
};

export const sendAgentTypingStatus = async ({
  projectId,
  conversationId,
  payload,
}: {
  projectId: number;
  conversationId: number;
  payload: AgentTypingDto;
}) => {
  // This API returns 204 No Content, so no need to process response.data
  await api.post(
    `/projects/${projectId}/inbox/conversations/${conversationId}/typing`,
    payload,
  );
};

const getConversationsByProjectId = async (
  projectId: number,
  params: ListConversationsDto,
): Promise<PaginationDto<Conversation>> => {
  const response = await api.get(`/projects/${projectId}/inbox/conversations`, {
    params,
  });

  console.log("📡 Frontend API response:", {
    totalReceived: response.data.data?.length,
    conversations: response.data.data,
  });

  return response.data;
};

/** Response shape from backend for paginated messages */
interface PaginatedMessages {
  data: Message[];
  hasNextPage: boolean;
  nextCursor: string | null;
}

const getMessages = async (
  projectId: number,
  conversationId: number,
  params?: ListMessagesDto,
): Promise<PaginatedMessages> => {
  const response = await api.get(
    `/projects/${projectId}/inbox/conversations/${conversationId}/messages`,
    {
      params,
    },
  );
  return response.data;
};

const getVisitorById = async (
  projectId: number,
  visitorId: number,
): Promise<VisitorResponseDto> => {
  const response = await api.get(
    `/projects/${projectId}/inbox/visitors/${visitorId}`,
  );
  return response.data;
};

const sendAgentReply = async ({
  projectId,
  conversationId,
  payload,
}: {
  projectId: number;
  conversationId: number;
  payload: SendReplyDto;
}): Promise<Message> => {
  const response = await api.post(
    `/projects/${projectId}/inbox/conversations/${conversationId}/messages`,
    payload,
  );
  return response.data;
};

// --- Custom Hooks ---

export const useGetConversations = (
  params: Partial<ListConversationsDto> & { projectId?: number },
) => {
  const { projectId, ...restParams } = params;
  return useInfiniteQuery({
    queryKey: ["conversations", projectId, restParams],
    queryFn: ({ pageParam = 1 }) => {
      if (!projectId) {
        return Promise.resolve({ data: [], total: 0, page: 1, limit: 10 });
      }
      return getConversationsByProjectId(projectId, {
        ...restParams,
        page: pageParam,
      });
    },
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.page * lastPage.limit < lastPage.total;
      return hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!projectId,
  });
};

export const useGetMessages = (
  projectId?: number,
  conversationId?: number,
  params?: Omit<ListMessagesDto, "cursor">,
) => {
  const queryKey = ["messages", projectId, conversationId, params];

  return useInfiniteQuery<
    PaginatedMessages,
    Error,
    InfiniteData<PaginatedMessages>,
    typeof queryKey,
    string | undefined
  >({
    queryKey,
    queryFn: ({ pageParam }) => {
      if (!projectId || !conversationId) {
        return Promise.resolve({
          data: [],
          hasNextPage: false,
          nextCursor: null,
        });
      }
      return getMessages(projectId, conversationId, {
        ...params,
        cursor: pageParam,
        limit: 20,
      });
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasNextPage) return undefined;
      return lastPage.nextCursor ?? undefined;
    },
    initialPageParam: undefined,
    enabled: !!projectId && !!conversationId,
  });
};

export const useGetVisitor = (projectId?: number, visitorId?: number) => {
  return useQuery({
    queryKey: ["visitor", projectId, visitorId],
    queryFn: () => getVisitorById(projectId!, visitorId!),
    enabled: !!projectId && !!visitorId,
  });
};

export const useSendAgentReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendAgentReply,
    onMutate: async (newMessagePayload: {
      projectId: number;
      conversationId: number;
      payload: SendReplyDto;
    }) => {
      // Key must match useGetMessages: ["messages", projectId, conversationId, params]
      // MessagePane calls useGetMessages with params=undefined
      const queryKey = [
        "messages",
        newMessagePayload.projectId,
        newMessagePayload.conversationId,
        undefined,
      ];

      await queryClient.cancelQueries({ queryKey });

      const optimisticMessage: Message = {
        id: uuidv4(),
        conversationId: newMessagePayload.conversationId,
        content: newMessagePayload.payload.text,
        contentType: "text",
        status: MessageStatus.SENDING,
        fromCustomer: false,
        createdAt: new Date(),
        attachments: [],
      };

      // Optimistic update for Infinite Query
      // Pages are PaginatedMessages objects with { data, hasNextPage, nextCursor }
      queryClient.setQueryData<InfiniteData<PaginatedMessages>>(queryKey, (oldData) => {
        if (!oldData) {
          return {
            pages: [{ data: [optimisticMessage], hasNextPage: false, nextCursor: null }],
            pageParams: [undefined],
          };
        }

        // Append to the first page (newest messages)
        const newPages = oldData.pages.map((page, index) => {
          if (index === 0) {
            return { ...page, data: [...page.data, optimisticMessage] };
          }
          return page;
        });

        return {
          ...oldData,
          pages: newPages,
        };
      });

      return { optimisticMessageId: optimisticMessage.id };
    },
    onSuccess: (finalMessage, variables, context) => {
      const queryKey = [
        "messages",
        variables.projectId,
        variables.conversationId,
        undefined,
      ];

      queryClient.setQueryData<InfiniteData<PaginatedMessages>>(queryKey, (oldData) => {
        if (!oldData) return oldData;

        const newPages = oldData.pages.map((page) => {
          // Check if message exists in this page
          const exists = page.data.some((msg) => msg.id === finalMessage.id);
          if (exists) {
            // Remove optimistic message if real one exists
            return {
              ...page,
              data: page.data.filter((msg) => msg.id !== context?.optimisticMessageId),
            };
          }
          // Replace optimistic with real
          return {
            ...page,
            data: page.data.map((msg) =>
              msg.id === context?.optimisticMessageId ? finalMessage : msg,
            ),
          };
        });

        return {
          ...oldData,
          pages: newPages,
        };
      });
      console.log("Message sent successfully:", finalMessage);
    },
    onError: (_err, variables, context) => {
      const queryKey = [
        "messages",
        variables.projectId,
        variables.conversationId,
        undefined,
      ];
      queryClient.setQueryData<InfiniteData<PaginatedMessages>>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.map((msg) =>
              msg.id === context?.optimisticMessageId
                ? { ...msg, status: MessageStatus.FAILED }
                : msg,
            ),
          })),
        };
      });
    },
    onSettled: () => {
      // Cache is already updated by onSuccess. No need to invalidate/refetch.
    },
  });
};

export const useNotifyAgentTyping = () => {
  return useMutation({
    mutationFn: sendAgentTypingStatus,
  });
};

export const useUpdateConversationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateConversationStatus,
    onSuccess: (data, variables) => {
      // Invalidate conversations list to refresh the list
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      // Invalidate messages for this specific conversation
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.projectId, variables.conversationId],
      });
      console.log("✅ Conversation status updated:", data);
    },
    onError: (error) => {
      console.error("❌ Failed to update conversation status:", error);
    },
  });
};

// --- Assignment Hooks ---

export const assignConversation = async ({
  projectId,
  conversationId,
  dto,
}: {
  projectId: number;
  conversationId: number | string;
  dto: AssignConversationDto;
}) => {
  const response = await api.post(
    `/projects/${projectId}/inbox/conversations/${conversationId}/assignments`,
    dto,
  );
  return response.data;
};

export const unassignConversation = async ({
  projectId,
  conversationId,
}: {
  projectId: number;
  conversationId: number | string;
}) => {
  const response = await api.delete(
    `/projects/${projectId}/inbox/conversations/${conversationId}/assignments`,
  );
  return response.data;
};

export const useAssignConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignConversation,
    onMutate: async ({ projectId, conversationId, dto }) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: ["conversations"] });

      // Snapshot previous value
      const previousConversations = queryClient.getQueryData([
        "conversations",
        projectId,
      ]);

      // Optimistic update
      queryClient.setQueryData(["conversations", projectId], (old: any) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((conv: Conversation) =>
              conv.id === conversationId
                ? {
                    ...conv,
                    assigneeId: dto.assigneeId,
                    assignedAt: new Date().toISOString(),
                  } // Note: assignee object missing, list view handles null check
                : conv,
            ),
          })),
        };
      });

      return { previousConversations };
    },
    onError: (err, variables, context) => {
      if (context?.previousConversations) {
        queryClient.setQueryData(
          ["conversations", variables.projectId],
          context.previousConversations,
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useUnassignConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unassignConversation,
    onMutate: async ({ projectId, conversationId }) => {
      await queryClient.cancelQueries({ queryKey: ["conversations"] });

      const previousConversations = queryClient.getQueryData([
        "conversations",
        projectId,
      ]);

      queryClient.setQueryData(["conversations", projectId], (old: any) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((conv: Conversation) =>
              conv.id === conversationId
                ? {
                    ...conv,
                    assigneeId: null,
                    assignee: null,
                    assignedAt: null,
                  }
                : conv,
            ),
          })),
        };
      });

      return { previousConversations };
    },
    onError: (err, variables, context) => {
      if (context?.previousConversations) {
        queryClient.setQueryData(
          ["conversations", variables.projectId],
          context.previousConversations,
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

// --- Delete Conversation ---

export const deleteConversation = async ({
  projectId,
  conversationId,
}: {
  projectId: number;
  conversationId: number | string;
}) => {
  await api.delete(
    `/projects/${projectId}/inbox/conversations/${conversationId}`,
  );
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteConversation,
    onMutate: async ({ projectId, conversationId }) => {
      await queryClient.cancelQueries({ queryKey: ["conversations"] });

      const previousConversations = queryClient.getQueryData([
        "conversations",
        projectId,
      ]);

      // Optimistically remove the conversation from the list
      queryClient.setQueryData(["conversations", projectId], (old: any) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.filter(
              (conv: Conversation) => conv.id !== String(conversationId),
            ),
            total: page.total - 1,
          })),
        };
      });

      return { previousConversations };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousConversations) {
        queryClient.setQueryData(
          ["conversations", variables.projectId],
          context.previousConversations,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};
