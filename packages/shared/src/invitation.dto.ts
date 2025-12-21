// src/invitations/dto/invitation.dto.ts

import { IsEmail, IsInt, IsEnum, IsOptional, IsString } from "class-validator";
import { InvitationStatus } from "./invitation.entity";
import { Role } from "./roles.enum"; // Legacy - for backward compatibility
import { ProjectRole } from "./project-roles.enum";
import { ApiProperty } from "@nestjs/swagger";

export class CreateInvitationDto {
  @ApiProperty({ example: "invitee@example.com", description: "Email of the user to invite" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 1, description: "ID of the project to invite the user to" })
  @IsInt()
  projectId: number;

  @ApiProperty({ example: ProjectRole.AGENT, enum: ProjectRole, description: "Role to assign to the invited user (defaults to AGENT)", required: false })
  @IsEnum(ProjectRole)
  @IsOptional()
  role?: ProjectRole; // Defaults to AGENT if not specified
}

export class AcceptInvitationDto {
  @ApiProperty({ example: "some-invitation-token", description: "Token received in the invitation link" })
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
