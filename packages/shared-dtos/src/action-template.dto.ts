import {
  IsString,
  IsOptional,
  ValidateNested,
  IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";
import { PartialType } from "@nestjs/mapped-types";
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
export class UpdateActionTemplateDto extends PartialType(
  CreateActionTemplateDto,
) {
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
