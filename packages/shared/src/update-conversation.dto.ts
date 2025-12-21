import { IsBoolean, IsEnum, IsOptional } from "class-validator";
import { ConversationStatus } from "./conversation.entity";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateConversationDto {
  @ApiProperty({
    example: ConversationStatus.OPEN,
    enum: ConversationStatus,
    description: "New status for the conversation",
    required: false,
  })
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @ApiProperty({
    example: true,
    description: "Whether the conversation has been read",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  read?: boolean;
}
