import { IsString, IsNotEmpty, Matches, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types'; // Or custom partial? shared-dtos usually avoids nestjs/mapped-types if pure frontend?
// Usually shared-dtos uses class-validator.
// To use PartialType, we need '@nestjs/mapped-types' OR define it manually if we want to keep shared-dtos framework-agnostic.
// Checking other DTOs.
// 'update-user-dto.ts' uses 'PartialType' from '@nestjs/mapped-types'. So it is allowed.

import { PartialType as MappedPartialType } from '@nestjs/mapped-types';

export class CreateCannedResponseDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: "Shortcut can only contain letters, numbers, underscores, and dashes." })
  @MaxLength(50)
  shortcut: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}

export class UpdateCannedResponseDto extends MappedPartialType(CreateCannedResponseDto) {}
