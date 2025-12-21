import { IsNotEmpty, MinLength, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SetPasswordDto {
  @ApiProperty({ example: "MyNewSecurePassword!", description: "New password for the user (min 8 characters)" })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: "Mật khẩu phải có ít nhất 8 ký tự." })
  readonly newPassword: string;
}
