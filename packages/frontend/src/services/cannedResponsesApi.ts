import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { CannedResponse } from "@live-chat/shared-types";
import type { CreateCannedResponseDto, UpdateCannedResponseDto } from "@live-chat/shared-dtos";

export const getCannedResponses = async (projectId: number): Promise<CannedResponse[]> => {
  const response = await api.get(`/projects/${projectId}/canned-responses`);
  return response.data;
};

export const createCannedResponse = async ({
  projectId,
  data,
}: {
  projectId: number;
  data: CreateCannedResponseDto;
}): Promise<CannedResponse> => {
  const response = await api.post(`/projects/${projectId}/canned-responses`, data);
  return response.data;
};

export const updateCannedResponse = async ({
  projectId,
  id,
  data,
}: {
  projectId: number;
  id: string;
  data: UpdateCannedResponseDto;
}): Promise<CannedResponse> => {
  const response = await api.patch(
    `/projects/${projectId}/canned-responses/${id}`,
    data
  );
  return response.data;
};

export const deleteCannedResponse = async ({
  projectId,
  id,
}: {
  projectId: number;
  id: string;
}) => {
  await api.delete(`/projects/${projectId}/canned-responses/${id}`);
};

// --- Hooks ---

export const useGetCannedResponses = (projectId?: number) => {
  return useQuery({
    queryKey: ["canned-responses", projectId],
    queryFn: () => getCannedResponses(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

export const useCreateCannedResponse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCannedResponse,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["canned-responses", variables.projectId],
      });
    },
  });
};

export const useUpdateCannedResponse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCannedResponse,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["canned-responses", variables.projectId],
      });
    },
  });
};

export const useDeleteCannedResponse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCannedResponse,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["canned-responses", variables.projectId],
      });
    },
  });
};
