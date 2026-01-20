import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { VisitorSessionMetadata } from "@live-chat/shared-types";

export class JoinRoomDto {
  @ApiProperty({ description: "The project ID to join" })
  @IsNumber()
  @IsNotEmpty()
  projectId: number;
}

export class LeaveRoomDto {
  @ApiProperty({ description: "The project ID to leave" })
  @IsNumber()
  @IsNotEmpty()
  projectId: number;
}

export class SendMessageDto {
  @ApiProperty({ description: "The content of the message" })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: "A client-side temporary identifier" })
  @IsString()
  @IsNotEmpty()
  tempId: string;

  @ApiPropertyOptional({ description: "Optional session metadata" })
  @IsOptional()
  sessionMetadata?: VisitorSessionMetadata;
}

export class VisitorTypingDto {
  @ApiProperty({ description: "Indicates if the visitor is typing" })
  @IsBoolean()
  isTyping: boolean;
}

export class UpdateContextDto {
  @ApiProperty({ description: "The current URL of the visitor" })
  @IsString()
  @IsNotEmpty()
  currentUrl: string;
}

export class IdentifyVisitorDto {
  @ApiProperty({ description: "The project ID the visitor belongs to" })
  @IsNumber()
  @IsNotEmpty()
  projectId: number;

  @ApiProperty({ description: "The unique identifier (UID) of the visitor" })
  @IsString()
  @IsNotEmpty()
  visitorUid: string;
}

export class VisitorFillingFormDto {
  @ApiPropertyOptional({ description: "The conversation ID" })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({
    description: "Indicates if the visitor is actively filling a form",
  })
  @IsBoolean()
  isFilling: boolean;
}
