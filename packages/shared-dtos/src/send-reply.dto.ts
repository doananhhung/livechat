import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from "@nestjs/swagger";

export class SendReplyDto {
  @ApiProperty({ example: "This is a reply message.", description: "Content of the reply message" })
  @IsNotEmpty()
  @IsString()
  text: string;
}
