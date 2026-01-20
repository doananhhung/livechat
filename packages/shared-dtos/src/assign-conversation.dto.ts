import { IsNotEmpty, IsUUID } from "class-validator";

export class AssignConversationDto {
  @IsUUID()
  @IsNotEmpty()
  assigneeId: string;
}
