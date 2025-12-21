import type { GlobalRole } from './global-roles.enum';
import type { ProjectMemberDto } from './project-member.dto';

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

/**
 * User response type - excludes sensitive fields and adds computed properties
 * This is what the API returns to clients
 */
export interface UserResponse {
  id: string;
  email: string;
  isEmailVerified: boolean;
  fullName: string;
  avatarUrl: string;
  timezone: string;
  language: string;
  status: UserStatus;
  role: GlobalRole;
  lastLoginAt: Date;
  projectMemberships: ProjectMemberDto[];
  tokensValidFrom: Date;
  isTwoFactorAuthenticationEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  hasPassword: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: GlobalRole;
  status: UserStatus;
  isTwoFactorAuthenticationEnabled?: boolean;
  language?: string;
  timezone?: string;
  lastLoginAt?: Date;
  createdAt: Date;
}
