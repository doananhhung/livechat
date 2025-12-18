import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
  @IsString({ message: "Token phải là chuỗi ký tự." })
  @IsNotEmpty({ message: "Token không được để trống." })
  token: string;

  @IsString({ message: "Mật khẩu mới phải là chuỗi ký tự." })
  @MinLength(8, { message: "Mật khẩu phải có ít nhất 8 ký tự." })
  @IsNotEmpty({ message: "Mật khẩu mới không được để trống." })
  newPassword: string;
}
