import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { VisitorNote } from "@live-chat/shared-types";
import type { CreateVisitorNoteDto, UpdateVisitorNoteDto } from "@live-chat/shared-dtos";

export const getVisitorNotes = async (projectId: number, visitorId: number): Promise<VisitorNote[]> => {
  const response = await api.get(`/projects/${projectId}/visitors/${visitorId}/notes`);
  return response.data;
};

export const createVisitorNote = async ({
  projectId,
  visitorId,
  data,
}: {
  projectId: number;
  visitorId: number;
  data: CreateVisitorNoteDto;
}): Promise<VisitorNote> => {
  const response = await api.post(`/projects/${projectId}/visitors/${visitorId}/notes`, data);
  return response.data;
};

export const updateVisitorNote = async ({
  projectId,
  visitorId,
  noteId,
  data,
}: {
  projectId: number;
  visitorId: number;
  noteId: string;
  data: UpdateVisitorNoteDto;
}): Promise<VisitorNote> => {
  const response = await api.patch(
    `/projects/${projectId}/visitors/${visitorId}/notes/${noteId}`,
    data
  );
  return response.data;
};

export const deleteVisitorNote = async ({
  projectId,
  visitorId,
  noteId,
}: {
  projectId: number;
  visitorId: number;
  noteId: string;
}) => {
  await api.delete(`/projects/${projectId}/visitors/${visitorId}/notes/${noteId}`);
};

// --- Hooks ---

export const useGetVisitorNotes = (projectId?: number, visitorId?: number) => {
  return useQuery({
    queryKey: ["visitor-notes", projectId, visitorId],
    queryFn: () => getVisitorNotes(projectId!, visitorId!),
    enabled: !!projectId && !!visitorId,
  });
};

export const useCreateVisitorNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVisitorNote,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["visitor-notes", variables.projectId, variables.visitorId],
      });
    },
  });
};

export const useUpdateVisitorNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVisitorNote,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["visitor-notes", variables.projectId, variables.visitorId],
      });
    },
  });
};

export const useDeleteVisitorNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVisitorNote,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["visitor-notes", variables.projectId, variables.visitorId],
      });
    },
  });
};
