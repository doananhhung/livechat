import {
  IsString,
  IsOptional,
  ValidateNested,
  IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";
import { ActionDefinitionDto } from "./action-definition.dto";

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
export class UpdateActionTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => ActionDefinitionDto)
  definition?: ActionDefinitionDto;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
