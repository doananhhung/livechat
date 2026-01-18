import {
  IsString,
  IsOptional,
  ValidateNested,
  IsBoolean,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { ActionFieldType } from '@live-chat/shared-types';

/**
 * DTO for a single field definition within an action template.
 */
export class ActionFieldDefinitionDto {
  @IsString()
  key: string;

  @IsString()
  label: string;

  @IsEnum(ActionFieldType)
  type: ActionFieldType;

  @IsBoolean()
  required: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}

/**
 * DTO for the definition (schema) of an action template.
 */
export class ActionDefinitionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionFieldDefinitionDto)
  fields: ActionFieldDefinitionDto[];
}

/**
 * DTO for creating a new action template.
 */
export class CreateActionTemplateDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @ValidateNested()
  @Type(() => ActionDefinitionDto)
  definition: ActionDefinitionDto;
}

/**
 * DTO for updating an existing action template.
 * All fields are optional. Can also update isEnabled status.
 */
export class UpdateActionTemplateDto extends PartialType(CreateActionTemplateDto) {
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
