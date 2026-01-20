import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export enum ActionFieldType {
  TEXT = "text",
  NUMBER = "number",
  DATE = "date",
  BOOLEAN = "boolean",
  SELECT = "select",
}

/**
 * DTO for a single field definition within an action template.
 */
export class ActionFieldDefinitionDto {
  @ApiProperty({ description: "The unique key of the field" })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: "The display label of the field" })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ enum: ActionFieldType, description: "The type of the field" })
  @IsEnum(ActionFieldType)
  type: ActionFieldType;

  @ApiProperty({ description: "Indicates if the field is required" })
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional({
    description: "Options for SELECT type fields",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}

/**
 * DTO for the definition (schema) of an action template.
 */
export class ActionDefinitionDto {
  @ApiProperty({
    description: "The fields included in the action",
    type: [ActionFieldDefinitionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionFieldDefinitionDto)
  fields: ActionFieldDefinitionDto[];
}
