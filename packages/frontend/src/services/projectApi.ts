import api from "../lib/api";
import type {
  CreateProjectDto,
  CreateInvitationDto,
  UpdateProjectDto,
} from "@live-chat/shared-dtos";
import type {
  Project,
  ProjectWithRole,
  Invitation,
  ProjectRole,
  ProjectMemberDto,
  IWidgetSettingsDto,
} from "@live-chat/shared-types";

// --- Type Definitions ---
// All type definitions are now imported from @live-chat/shared

// Extended invitation with project details
export interface InvitationWithProject extends Invitation {
  project?: Project;
}

// --- API Functions ---

/**
 * Fetches all projects for the current user.
 * Returns projects with the user's role (myRole) in each project.
 */
export const getProjects = async (): Promise<ProjectWithRole[]> => {
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
 * Updates basic project information (name, whitelisted domains).
 * @param projectId - The ID of the project to update.
 * @param data - The data to update.
 */
export const updateProject = async (
  projectId: number,
  data: UpdateProjectDto
): Promise<Project> => {
  const response = await api.patch(`/projects/${projectId}`, data);
  return response.data;
};

/**
 * Updates the widget settings for a specific project.
 * @param projectId - The ID of the project to update.
 * @param settings - The new widget settings.
 */
export const updateProjectSettings = async (
  projectId: number,
  settings: IWidgetSettingsDto
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
  const { projectId, ...body } = data;
  const response = await api.post(`/projects/${projectId}/invitations`, body);
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
 * @param projectId - The ID of the project where the invitation exists.
 * @param invitationId - The ID of the invitation to cancel.
 */
export const cancelInvitation = async (
  projectId: number,
  invitationId: number
): Promise<void> => {
  await api.delete(`/projects/${projectId}/invitations/${invitationId}`);
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

// --- Project Members API Functions ---

/**
 * Fetches all members of a specific project.
 * @param projectId - The ID of the project
 */
export const getProjectMembers = async (
  projectId: number
): Promise<ProjectMemberDto[]> => {
  const response = await api.get(`/projects/${projectId}/members`);
  return response.data;
};

/**
 * Updates a member's role in a project.
 * @param projectId - The ID of the project
 * @param userId - The ID of the user whose role to update
 * @param role - The new role for the member
 */
export const updateMemberRole = async (
  projectId: number,
  userId: string,
  role: ProjectRole
): Promise<{ success: boolean; message: string }> => {
  const response = await api.patch(
    `/projects/${projectId}/members/${userId}/role`,
    { role }
  );
  return response.data;
};

/**
 * Removes a member from a project.
 * @param projectId - The ID of the project
 * @param userId - The ID of the user to remove
 */
export const removeMember = async (
  projectId: number,
  userId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/projects/${projectId}/members/${userId}`);
  return response.data;
};
