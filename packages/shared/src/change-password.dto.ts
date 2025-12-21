import {
  IsNotEmpty,
  MinLength,
  Validate,
  ValidatorConstraint,
  IsString,
  IsOptional,
  type ValidatorConstraintInterface,
  type ValidationArguments,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

@ValidatorConstraint({ name: "IsNotSameAsCurrentPassword", async: false })
export class IsNotSameAsCurrentPassword
  implements ValidatorConstraintInterface
{
  validate(newPassword: string, args: ValidationArguments) {
    const object = args.object as any;
    // Only validate if currentPassword is provided
    if (!object.currentPassword) return true;
    return newPassword !== object.currentPassword;
  }
}
export class ChangePasswordDto {
  @ApiProperty({ example: "OldPassword123!", description: "Current password of the user" })
  @IsString()
  @IsOptional()
  @MinLength(8, { message: "Mật khẩu hiện tại phải có ít nhất 8 ký tự." })
  readonly currentPassword?: string;

  @ApiProperty({ example: "NewPassword456!", description: "New password for the user (min 8 characters)" })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: "Mật khẩu mới phải có ít nhất 8 ký tự." })
  @Validate(IsNotSameAsCurrentPassword, {
    message: "Mật khẩu mới không thể giống mật khẩu hiện tại.",
  })
  readonly newPassword: string;
}
