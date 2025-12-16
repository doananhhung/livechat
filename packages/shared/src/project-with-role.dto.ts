import { Project } from "./project.entity";
import { ProjectRole } from "./project-roles.enum";

/**
 * Extended Project type that includes the current user's role in the project
 */
export interface ProjectWithRole extends Project {
  myRole: ProjectRole;
}
