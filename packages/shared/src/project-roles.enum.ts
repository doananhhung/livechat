/**
 * Project-level roles for project-specific permissions
 * These roles determine what a user can do within a specific project
 */
export enum ProjectRole {
  MANAGER = "manager", // Can manage project settings, invite members, and handle conversations
  AGENT = "agent", // Can handle customer conversations
}
