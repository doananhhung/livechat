import { IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordDto {
  @ApiProperty({ example: "some-reset-token", description: "Token received via email for password reset" })
  @IsString({ message: "Token phải là chuỗi ký tự." })
  @IsNotEmpty({ message: "Token không được để trống." })
  token: string;

  @ApiProperty({ example: "NewSecurePassword123!", description: "New password for the user (min 8 characters)" })
  @IsString({ message: "Mật khẩu mới phải là chuỗi ký tự." })
  @MinLength(8, { message: "Mật khẩu phải có ít nhất 8 ký tự." })
  @IsNotEmpty({ message: "Mật khẩu mới không được để trống." })
  newPassword: string;
}
