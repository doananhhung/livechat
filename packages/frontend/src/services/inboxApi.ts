// src/services/inboxApi.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import api from "../lib/api";
import { v4 as uuidv4 } from "uuid";
import type {
  ListConversationsDto,
  UpdateConversationDto,
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
    payload
  );
  return response.data;
};

export const sendAgentTypingStatus = async ({
  projectId,
  conversationId,
  isTyping,
}: {
  projectId: number;
  conversationId: number;
  isTyping: boolean;
}) => {
  // This API returns 204 No Content, so no need to process response.data
  await api.post(`/projects/${projectId}/inbox/conversations/${conversationId}/typing`, {
    isTyping,
  });
};

const getConversationsByProjectId = async (
  projectId: number,
  params: ListConversationsDto
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

const getMessages = async (projectId: number, conversationId: number): Promise<Message[]> => {
  const response = await api.get(
    `/projects/${projectId}/inbox/conversations/${conversationId}/messages`,
    {
      params: { limit: 1000 }, // Set a high limit to fetch more messages
    }
  );
  return response.data.data; // Assuming paginated response
};

const getVisitorById = async (projectId: number, visitorId: number): Promise<Visitor> => {
  const response = await api.get(`/projects/${projectId}/inbox/visitors/${visitorId}`);
  return response.data;
};

const sendAgentReply = async ({
  projectId,
  conversationId,
  text,
}: {
  projectId: number;
  conversationId: number;
  text: string;
}): Promise<Message> => {
  const response = await api.post(
    `/projects/${projectId}/inbox/conversations/${conversationId}/messages`,
    {
      text,
    }
  );
  return response.data;
};

// --- Custom Hooks ---

export const useGetConversations = (params: Partial<ListConversationsDto> & { projectId?: number }) => {
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

export const useGetMessages = (projectId?: number, conversationId?: number) => {
  return useQuery({
    queryKey: ["messages", projectId, conversationId],
    queryFn: () => getMessages(projectId!, conversationId!),
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
      text: string;
    }) => {
      const queryKey = ["messages", newMessagePayload.projectId, newMessagePayload.conversationId];
      await queryClient.cancelQueries({ queryKey });

      const optimisticMessage: Message = {
        id: uuidv4(),
        conversationId: newMessagePayload.conversationId,
        content: newMessagePayload.text,
        contentType: 'text',
        status: MessageStatus.SENDING,
        fromCustomer: false,
        createdAt: new Date(),
        attachments: [],

      };

      queryClient.setQueryData<Message[]>(queryKey, (oldData = []) => [
        ...oldData,
        optimisticMessage,
      ]);

      return { optimisticMessageId: optimisticMessage.id };
    },
    onSuccess: (finalMessage, variables, context) => {
      const queryKey = ["messages", variables.projectId, variables.conversationId];
      queryClient.setQueryData<Message[]>(queryKey, (oldData = []) => {
        // Check if the final message already exists (e.g., received via socket)
        const exists = oldData.some(msg => msg.id === finalMessage.id);
        
        if (exists) {
           // If it exists, just remove the optimistic one to avoid duplicates
           return oldData.filter(msg => msg.id !== context?.optimisticMessageId);
        } else {
           // Otherwise, replace optimistic with final
           return oldData.map((msg) =>
             msg.id === context?.optimisticMessageId ? finalMessage : msg
           );
        }
      });
      console.log("Message sent successfully:", finalMessage);
    },
    onError: (_err, variables, context) => {
      const queryKey = ["messages", variables.projectId, variables.conversationId];
      queryClient.setQueryData<Message[]>(queryKey, (oldData = []) =>
        oldData.map((msg) =>
          msg.id === context?.optimisticMessageId
            ? { ...msg, status: MessageStatus.FAILED }
            : msg
        )
      );
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.projectId, variables.conversationId],
      });
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
  assigneeId,
}: {
  projectId: number;
  conversationId: number | string;
  assigneeId: string;
}) => {
  const response = await api.post(
    `/projects/${projectId}/inbox/conversations/${conversationId}/assignments`,
    { assigneeId }
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
    `/projects/${projectId}/inbox/conversations/${conversationId}/assignments`
  );
  return response.data;
};

export const useAssignConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignConversation,
    onMutate: async ({ projectId, conversationId, assigneeId }) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: ["conversations"] });
      
      // Snapshot previous value
      const previousConversations = queryClient.getQueryData(["conversations", projectId]);

      // Optimistic update
      queryClient.setQueryData(["conversations", projectId], (old: any) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((conv: Conversation) =>
              conv.id === conversationId
                ? { ...conv, assigneeId, assignedAt: new Date().toISOString() } // Note: assignee object missing, list view handles null check
                : conv
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
          context.previousConversations
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

      const previousConversations = queryClient.getQueryData(["conversations", projectId]);

      queryClient.setQueryData(["conversations", projectId], (old: any) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((conv: Conversation) =>
              conv.id === conversationId
                ? { ...conv, assigneeId: null, assignee: null, assignedAt: null }
                : conv
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
          context.previousConversations
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
  await api.delete(`/projects/${projectId}/inbox/conversations/${conversationId}`);
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteConversation,
    onMutate: async ({ projectId, conversationId }) => {
      await queryClient.cancelQueries({ queryKey: ["conversations"] });

      const previousConversations = queryClient.getQueryData(["conversations", projectId]);

      // Optimistically remove the conversation from the list
      queryClient.setQueryData(["conversations", projectId], (old: any) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.filter((conv: Conversation) => conv.id !== String(conversationId)),
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
          context.previousConversations
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

