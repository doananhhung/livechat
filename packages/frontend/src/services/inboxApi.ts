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
  Conversation,
  ListConversationsDto,
  Message,
  PaginationDto,
  UpdateConversationDto,
  Visitor,
} from "@live-chat/shared";
import { MessageStatus } from "@live-chat/shared";
import type { rest } from "lodash";

// --- Type Definitions ---
// All type definitions are now imported from @live-chat/shared

// --- API Functions ---

interface UpdateConversationStatusParams {
  conversationId: number;
  payload: UpdateConversationDto;
}

export const updateConversationStatus = async ({
  conversationId,
  payload,
}: UpdateConversationStatusParams) => {
  const response = await api.patch(
    `/inbox/conversations/${conversationId}`,
    payload
  );
  return response.data;
};

export const sendAgentTypingStatus = async ({
  conversationId,
  isTyping,
}: {
  conversationId: number;
  isTyping: boolean;
}) => {
  // This API returns 204 No Content, so no need to process response.data
  await api.post(`/inbox/conversations/${conversationId}/typing`, {
    isTyping,
  });
};

const getConversationsByProjectId = async (
  params: ListConversationsDto
): Promise<PaginationDto<Conversation>> => {
  const response = await api.get(`/inbox/conversations`, {
    params,
  });

  console.log("📡 Frontend API response:", {
    totalReceived: response.data.data?.length,
    conversations: response.data.data,
  });

  return response.data;
};

const getMessages = async (conversationId: number): Promise<Message[]> => {
  const response = await api.get(
    `/inbox/conversations/${conversationId}/messages`,
    {
      params: { limit: 1000 }, // Set a high limit to fetch more messages
    }
  );
  return response.data.data; // Assuming paginated response
};

const getVisitorById = async (visitorId: number): Promise<Visitor> => {
  // ARCHITECTURAL FEEDBACK: The backend needs to provide this endpoint.
  // Example: GET /inbox/visitors/:visitorId
  // For now, we will assume it exists to complete the frontend.
  const response = await api.get(`/inbox/visitors/${visitorId}`);
  return response.data;
};

const sendAgentReply = async ({
  conversationId,
  text,
}: {
  conversationId: number;
  text: string;
}): Promise<Message> => {
  const response = await api.post(
    `/inbox/conversations/${conversationId}/messages`,
    {
      text,
    }
  );
  return response.data;
};

// --- Custom Hooks ---

export const useGetConversations = (params: Partial<ListConversationsDto>) => {
  const { projectId, ...restParams } = params;
  return useInfiniteQuery({
    queryKey: ["conversations", projectId, restParams],
    queryFn: ({ pageParam = 1 }) => {
      if (!params.projectId) {
        return Promise.resolve({ data: [], total: 0, page: 1, limit: 10 });
      }
      return getConversationsByProjectId({
        ...params,
        projectId: params.projectId,
        page: pageParam,
      });
    },
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.page * lastPage.limit < lastPage.total;
      return hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!params.projectId,
  });
};

export const useGetMessages = (conversationId?: number) => {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => getMessages(conversationId!),
    enabled: !!conversationId,
  });
};

export const useGetVisitor = (visitorId?: number) => {
  return useQuery({
    queryKey: ["visitor", visitorId],
    queryFn: () => getVisitorById(visitorId!),
    enabled: !!visitorId,
  });
};

export const useSendAgentReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendAgentReply,
    onMutate: async (newMessagePayload: {
      conversationId: number;
      text: string;
    }) => {
      const queryKey = ["messages", newMessagePayload.conversationId];
      await queryClient.cancelQueries({ queryKey });

      const optimisticMessage: Message = {
        id: uuidv4(),
        conversationId: newMessagePayload.conversationId,
        content: newMessagePayload.text,
        status: MessageStatus.SENDING,
        fromCustomer: false,
        createdAt: new Date(),
        attachments: [],
        conversation: {} as Conversation,
        recipientId: "",
        senderId: "",
      };

      queryClient.setQueryData<Message[]>(queryKey, (oldData = []) => [
        ...oldData,
        optimisticMessage,
      ]);

      return { optimisticMessageId: optimisticMessage.id };
    },
    onSuccess: (finalMessage, variables, context) => {
      const queryKey = ["messages", variables.conversationId];
      queryClient.setQueryData<Message[]>(queryKey, (oldData = []) =>
        oldData.map((msg) =>
          msg.id === context?.optimisticMessageId ? finalMessage : msg
        )
      );
      console.log("Message sent successfully:", finalMessage);
    },
    onError: (_err, variables, context) => {
      const queryKey = ["messages", variables.conversationId];
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
        queryKey: ["messages", variables.conversationId],
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
        queryKey: ["messages", variables.conversationId],
      });
      console.log("✅ Conversation status updated:", data);
    },
    onError: (error) => {
      console.error("❌ Failed to update conversation status:", error);
    },
  });
};
