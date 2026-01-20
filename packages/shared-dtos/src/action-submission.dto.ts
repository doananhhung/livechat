import { IsNumber, IsObject } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for creating a new action submission (form filled by agent).
 */
export class CreateActionSubmissionDto {
  @ApiProperty({ description: "The ID of the action template" })
  @IsNumber()
  templateId: number;

  @ApiProperty({
    description: "The submitted form data",
    type: "object",
    additionalProperties: true,
  })
  @IsObject()
  data: Record<string, unknown>;
}
