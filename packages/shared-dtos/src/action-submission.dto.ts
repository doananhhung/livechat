import { IsNumber, IsObject } from 'class-validator';

/**
 * DTO for creating a new action submission (form filled by agent).
 */
export class CreateActionSubmissionDto {
  @IsNumber()
  templateId: number;

  @IsObject()
  data: Record<string, any>;
}
