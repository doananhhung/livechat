import { IsObject } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for updating an action submission.
 */
export class UpdateSubmissionDto {
  /**
   * Updated form data.
   */
  @ApiProperty({
    description: "The updated form data",
    type: "object",
    additionalProperties: true,
  })
  @IsObject()
  data: Record<string, unknown>;
}
