import api from "../lib/api";
import type {
  CreateProjectDto,
  Project,
  WidgetSettingsDto,
  CreateInvitationDto,
  Invitation,
} from "@social-commerce/shared";

// --- Type Definitions ---
// All type definitions are now imported from @social-commerce/shared

// Extended invitation with project details
export interface InvitationWithProject extends Invitation {
  project?: Project;
}

// --- API Functions ---

/**
 * Fetches all projects for the current user.
 */
export const getProjects = async (): Promise<Project[]> => {
  const response = await api.get("/projects");
  return response.data;
};

/**
 * Creates a new project.
 * @param data - The data for the new project.
 */
export const createProject = async (
  data: CreateProjectDto
): Promise<Project> => {
  const response = await api.post("/projects", data);
  return response.data;
};

/**
 * Updates the widget settings for a specific project.
 * @param projectId - The ID of the project to update.
 * @param settings - The new widget settings.
 */
export const updateProjectSettings = async (
  projectId: number,
  settings: WidgetSettingsDto
): Promise<Project> => {
  const response = await api.patch(`/projects/${projectId}`, {
    widgetSettings: settings,
  });
  return response.data;
};

// --- Invitation API Functions ---

/**
 * Sends an invitation to a user to join a project.
 * @param data - The invitation data (email, projectId, role)
 */
export const inviteUserToProject = async (
  data: CreateInvitationDto
): Promise<Invitation> => {
  const response = await api.post("/projects/invitations", data);
  return response.data;
};

/**
 * Fetches all invitations for a specific project.
 * @param projectId - The ID of the project
 */
export const getProjectInvitations = async (
  projectId: number
): Promise<Invitation[]> => {
  const response = await api.get(`/projects/${projectId}/invitations`);
  return response.data;
};

/**
 * Cancels a pending invitation.
 * @param invitationId - The ID of the invitation to cancel
 */
export const cancelInvitation = async (invitationId: string): Promise<void> => {
  await api.delete(`/projects/invitations/${invitationId}`);
};

/**
 * Accepts an invitation to join a project.
 * @param token - The invitation token from the email link
 */
export const acceptInvitation = async (token: string): Promise<void> => {
  await api.post(`/projects/invitations/accept?token=${token}`);
};

/**
 * Gets invitation details by token (public endpoint - no auth required).
 * @param token - The invitation token from the email link
 */
export const getInvitationDetails = async (
  token: string
): Promise<InvitationWithProject> => {
  const response = await api.get(
    `/projects/invitations/details?token=${token}`
  );
  return response.data;
};
