
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class JoinProjectRoomDto {
  @IsNumber()
  @IsNotEmpty()
  projectId: number;
}

export class LeaveProjectRoomDto {
  @IsNumber()
  @IsNotEmpty()
  projectId: number;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  tempId: string;
}

export class VisitorTypingDto {
  @IsBoolean()
  isTyping: boolean;
}

export class UpdateContextDto {
  @IsString()
  @IsNotEmpty()
  currentUrl: string;
}

export class IdentifyVisitorDto {
  @IsNumber()
  @IsNotEmpty()
  projectId: number;

  @IsString()
  @IsNotEmpty()
  visitorUid: string;
}
