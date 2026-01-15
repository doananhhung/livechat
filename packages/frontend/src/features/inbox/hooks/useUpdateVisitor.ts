import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import api from '../../../lib/api';
import type { Visitor, Conversation } from '@live-chat/shared-types';

interface ConversationsPage {
  data: Conversation[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export const useUpdateVisitor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      visitorId,
      displayName,
    }: {
      projectId: number;
      visitorId: number;
      displayName: string;
    }) => {
      const response = await api.patch<Visitor>(
        `/projects/${projectId}/visitors/${visitorId}`,
        { displayName }
      );
      return response.data;
    },
    onMutate: async (variables) => {
      // Cancel ALL conversation queries for this project (any filter params)
      await queryClient.cancelQueries({ queryKey: ['conversations', variables.projectId] });
      await queryClient.cancelQueries({ queryKey: ['visitor', variables.projectId, variables.visitorId] });

      // Snapshot the previous visitor for rollback on error
      const previousVisitor = queryClient.getQueryData<Visitor>([
        'visitor',
        variables.projectId,
        variables.visitorId,
      ]);

      // Optimistically update ALL conversation queries that match this project
      // This handles different filter params (status, etc.)
      queryClient.setQueriesData<InfiniteData<ConversationsPage>>(
        { queryKey: ['conversations', variables.projectId] },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.map((conversation) => {
                if (conversation.visitor?.id === variables.visitorId) {
                  return {
                    ...conversation,
                    visitor: {
                      ...conversation.visitor,
                      displayName: variables.displayName,
                    },
                  };
                }
                return conversation;
              }),
            })),
          };
        }
      );

      // Optimistically update visitor cache (for VisitorContextPanel)
      queryClient.setQueryData<Visitor>(
        ['visitor', variables.projectId, variables.visitorId],
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            displayName: variables.displayName,
          };
        }
      );

      // Return context with snapshot for rollback
      return { previousVisitor };
    },
    onError: (_error, variables, context) => {
      // Rollback visitor to previous state on error
      if (context?.previousVisitor) {
        queryClient.setQueryData(
          ['visitor', variables.projectId, variables.visitorId],
          context.previousVisitor
        );
      }
      // Invalidate conversations to refetch correct data
      queryClient.invalidateQueries({ queryKey: ['conversations', variables.projectId] });
    },
    onSettled: (_data, _error, variables) => {
      // Refetch after mutation to ensure server state is in sync
      queryClient.invalidateQueries({ queryKey: ['conversations', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['visitor', variables.projectId, variables.visitorId] });
    },
  });
};
