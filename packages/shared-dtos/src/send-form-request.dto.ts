import { IsNumber, IsOptional, IsDateString } from 'class-validator';

/**
 * DTO for agent sending a form request to a visitor.
 */
export class SendFormRequestDto {
  /**
   * ID of the action template to send as a form.
   */
  @IsNumber()
  templateId: number;

  /**
   * Optional expiration time for the form request (ISO 8601).
   */
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
