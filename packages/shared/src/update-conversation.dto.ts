import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ConversationStatus } from './conversation.entity';

export class UpdateConversationDto {
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @IsOptional()
  @IsBoolean()
  read?: boolean;
}
