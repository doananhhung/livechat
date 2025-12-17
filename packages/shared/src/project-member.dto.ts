import { ProjectRole } from "./project-roles.enum";

export interface ProjectMemberDto {
  userId: string;
  role: ProjectRole;
  joinedAt: Date;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface UpdateMemberRoleDto {
  role: ProjectRole;
}
