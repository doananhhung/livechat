
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { MessageStatus } from './message.entity';

export class CreateMessageDto {
  @IsNumber()
  @IsNotEmpty()
  conversationId: number;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  attachments?: any;

  @IsString()
  @IsNotEmpty()
  senderId: string;

  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @IsBoolean()
  fromCustomer: boolean;

  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus;
}
