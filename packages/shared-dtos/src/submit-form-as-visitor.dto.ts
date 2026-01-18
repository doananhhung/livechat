import { IsString, IsObject } from 'class-validator';

/**
 * DTO for visitor submitting a filled form.
 */
export class SubmitFormAsVisitorDto {
  /**
   * ID of the form request message being responded to.
   */
  @IsString()
  formRequestMessageId: string;

  /**
   * Form data filled by the visitor.
   */
  @IsObject()
  data: Record<string, unknown>;
}
