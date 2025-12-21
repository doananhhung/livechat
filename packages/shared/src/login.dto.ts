import { IsEmail, IsNotEmpty, MinLength } from "class-validator";
import { User } from "./user.entity";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({ example: "user@example.com", description: "User's email address" })
  @IsEmail({}, { message: "Email không hợp lệ." })
  @IsNotEmpty({ message: "Email không được để trống." })
  email: string;

  @ApiProperty({ example: "StrongPassword123!", description: "User's password" })
  @IsNotEmpty({ message: "Mật khẩu không được để trống." })
  @MinLength(8, { message: "Mật khẩu phải có ít nhất 8 ký tự." })
  password: string;
}

export class AuthResponseDto {
  accessToken: string;
  user: User;
}
