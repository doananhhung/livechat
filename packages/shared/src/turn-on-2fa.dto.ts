import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from "@nestjs/swagger";

export class TurnOn2faDto {
  @ApiProperty({ example: "123456", description: "6-digit code from your authenticator app" })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
