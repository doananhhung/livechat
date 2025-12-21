// src/inbox/dto/agent-typing.dto.ts
import { IsBoolean } from 'class-validator';
import { ApiProperty } from "@nestjs/swagger";

export class AgentTypingDto {
  @ApiProperty({ example: true, description: "Indicates if the agent is currently typing" })
  @IsBoolean()
  isTyping: boolean;
}
