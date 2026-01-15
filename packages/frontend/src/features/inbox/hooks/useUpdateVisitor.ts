import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api'; // Import api directly from lib/api
import type { Visitor } from '@live-chat/shared-types';

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
    onSuccess: (updatedVisitor, variables) => {
      // Invalidate conversations to reflect the new name in list
      queryClient.invalidateQueries({ queryKey: ['conversations', variables.projectId] });
      // Invalidate specific visitor query if it exists
      queryClient.invalidateQueries({ queryKey: ['visitor', variables.visitorId] });
      
      // Optimistically update could be added here, but invalidation is safer for now
    },
  });
};
