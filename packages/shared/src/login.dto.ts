import { IsEmail, IsNotEmpty, MinLength } from "class-validator";
import { User } from "./user.entity";

export class LoginDto {
  @IsEmail({}, { message: "Email không hợp lệ." })
  @IsNotEmpty({ message: "Email không được để trống." })
  email: string;

  @IsNotEmpty({ message: "Mật khẩu không được để trống." })
  @MinLength(8, { message: "Mật khẩu phải có ít nhất 8 ký tự." })
  password: string;
}

export class AuthResponseDto {
  accessToken: string;
  user: User;
}
