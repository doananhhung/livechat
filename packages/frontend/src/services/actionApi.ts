import api from "../lib/api";
import {
  type ActionTemplate,
  type ActionSubmission,
  type Message,
} from "@live-chat/shared-types";
import type {
  CreateActionTemplateDto,
  UpdateActionTemplateDto,
  SendFormRequestDto,
} from "@live-chat/shared-dtos";

export const actionsApi = {
  // ==================== TEMPLATE MANAGEMENT (Manager) ====================

  /**
   * Get all action templates for a project.
   */
  getTemplates: async (projectId: number): Promise<ActionTemplate[]> => {
    const response = await api.get<ActionTemplate[]>(
      `/projects/${projectId}/action-templates`
    );
    return response.data;
  },

  /**
   * Get a single action template by ID.
   */
  getTemplate: async (
    projectId: number,
    templateId: number
  ): Promise<ActionTemplate> => {
    const response = await api.get<ActionTemplate>(
      `/projects/${projectId}/action-templates/${templateId}`
    );
    return response.data;
  },

  /**
   * Create a new action template.
   */
  createTemplate: async (
    projectId: number,
    data: CreateActionTemplateDto
  ): Promise<ActionTemplate> => {
    const response = await api.post<ActionTemplate>(
      `/projects/${projectId}/action-templates`,
      data
    );
    return response.data;
  },

  /**
   * Update an existing action template.
   */
  updateTemplate: async (
    projectId: number,
    templateId: number,
    data: UpdateActionTemplateDto
  ): Promise<ActionTemplate> => {
    const response = await api.put<ActionTemplate>(
      `/projects/${projectId}/action-templates/${templateId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete an action template (soft delete).
   */
  deleteTemplate: async (
    projectId: number,
    templateId: number
  ): Promise<void> => {
    await api.delete(`/projects/${projectId}/action-templates/${templateId}`);
  },

  /**
   * Toggle a template's enabled status.
   */
  toggleTemplate: async (
    projectId: number,
    templateId: number
  ): Promise<ActionTemplate> => {
    const response = await api.patch<ActionTemplate>(
      `/projects/${projectId}/action-templates/${templateId}/toggle`
    );
    return response.data;
  },

  // ==================== ACTION SUBMISSIONS (Agent) ====================

  /**
   * Get all submissions for a conversation.
   */
  getSubmissions: async (
    conversationId: string
  ): Promise<ActionSubmission[]> => {
    const response = await api.get<ActionSubmission[]>(
      `/conversations/${conversationId}/actions`
    );
    return response.data;
  },

  /**
   * Create a new action submission.
   */
  createSubmission: async (
    conversationId: string,
    templateId: number,
    data: Record<string, unknown>
  ): Promise<ActionSubmission> => {
    const payload = { templateId, data };
    const response = await api.post<ActionSubmission>(
      `/conversations/${conversationId}/actions`,
      payload
    );
    return response.data;
  },

  // ==================== FORM REQUESTS (Agent → Visitor) ====================

  /**
   * Send a form request to a visitor in chat.
   */
  sendFormRequest: async (
    conversationId: string,
    data: SendFormRequestDto
  ): Promise<Message> => {
    const response = await api.post<Message>(
      `/conversations/${conversationId}/form-request`,
      data
    );
    return response.data;
  },

  /**
   * Update a submission's data.
   */
  updateSubmission: async (
    submissionId: string,
    data: Record<string, unknown>
  ): Promise<ActionSubmission> => {
    const response = await api.put<ActionSubmission>(
      `/submissions/${submissionId}`,
      { data }
    );
    return response.data;
  },

  /**
   * Delete a submission.
   */
  deleteSubmission: async (submissionId: string): Promise<void> => {
    await api.delete(`/submissions/${submissionId}`);
  },
};

