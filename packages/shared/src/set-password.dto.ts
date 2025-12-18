import { IsNotEmpty, MinLength, IsString } from "class-validator";

export class SetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: "Mật khẩu phải có ít nhất 8 ký tự." })
  readonly newPassword: string;
}
