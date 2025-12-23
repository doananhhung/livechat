import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
} from "class-validator";
import { MessageStatus, Attachment } from "@live-chat/shared-types";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreateMessageDto {
  @ApiProperty({
    example: 1,
    description: "ID of the conversation this message belongs to",
  })
  @IsNumber()
  @IsNotEmpty()
  conversationId: number;

  @ApiProperty({
    example: "Hello, how can I help you today?",
    description: "Content of the message",
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: "Optional file attachments",
    required: false,
    type: "array",
  })
  @IsOptional()
  @IsArray()
  attachments?: Attachment[];

  @ApiProperty({ example: "user-uuid-123", description: "ID of the sender" })
  @IsString()
  @IsNotEmpty()
  senderId: string;

  @ApiProperty({ example: "user-uuid-456", description: "ID of the recipient" })
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @ApiProperty({
    example: true,
    description: "Indicates if the message is from a customer",
  })
  @IsBoolean()
  fromCustomer: boolean;

  @ApiProperty({
    example: MessageStatus.SENT,
    enum: MessageStatus,
    description: "Status of the message",
  })
  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus;
}
