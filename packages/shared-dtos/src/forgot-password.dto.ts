import { IsEmail, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ForgotPasswordDto {
  @ApiProperty({ example: "user@example.com", description: "Email address of the user who forgot their password" })
  @IsEmail({}, { message: "Email không hợp lệ." })
  @IsNotEmpty({ message: "Email không được để trống." })
  email: string;
}
