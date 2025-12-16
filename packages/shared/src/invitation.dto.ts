// src/invitations/dto/invitation.dto.ts

import { IsEmail, IsInt, IsEnum, IsOptional, IsString } from "class-validator";
import { InvitationStatus } from "./invitation.entity";
import { Role } from "./roles.enum"; // Legacy - for backward compatibility
import { ProjectRole } from "./project-roles.enum";

export class CreateInvitationDto {
  @IsEmail()
  email: string;

  @IsInt()
  projectId: number;

  @IsEnum(ProjectRole)
  @IsOptional()
  role?: ProjectRole; // Defaults to AGENT if not specified
}

export class AcceptInvitationDto {
  @IsString()
  token: string;
}

export class InvitationResponseDto {
  id: string;
  email: string;
  projectId: number;
  inviterId: string;
  status: InvitationStatus;
  role: ProjectRole; // Include role in response
  expiresAt: Date;
  createdAt: Date;
  projectName?: string; // Optional: include project name for better UX
  inviterName?: string; // Optional: include inviter name
}
