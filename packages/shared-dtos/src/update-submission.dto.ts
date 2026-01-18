import { IsObject } from 'class-validator';

/**
 * DTO for updating an action submission.
 */
export class UpdateSubmissionDto {
  /**
   * Updated form data.
   */
  @IsObject()
  data: Record<string, unknown>;
}
