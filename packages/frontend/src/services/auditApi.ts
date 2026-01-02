import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { ListAuditLogsDto } from '@live-chat/shared-dtos';
import type { AuditLogDto, PaginationDto } from '@live-chat/shared-types';

export const getAuditLogs = async (
  projectId: number,
  params: ListAuditLogsDto
): Promise<PaginationDto<AuditLogDto>> => {
  const response = await api.get(`/projects/${projectId}/audit-logs`, {
    params,
  });
  return response.data;
};

export const useGetAuditLogs = (
  projectId: number,
  params: ListAuditLogsDto
) => {
  return useQuery({
    queryKey: ['audit-logs', projectId, params],
    queryFn: () => getAuditLogs(projectId, params),
    enabled: !!projectId,
    staleTime: 0,
    refetchOnMount: 'always',
    placeholderData: (previousData) => previousData, // Keep showing old data while refetching (no blink)
  });
};
