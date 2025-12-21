import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger"; // <-- ADD THIS IMPORT

export class RegisterDto {
  @ApiProperty({ example: "john.doe@example.com", description: "User's email address" }) // <-- ADD THIS
  @IsEmail({}, { message: "Email không hợp lệ." })
  @IsNotEmpty({ message: "Email không được để trống." })
  email: string;

  @ApiProperty({ example: "StrongPassword123!", description: "User's password (min 8 characters)" }) // <-- ADD THIS
  @IsNotEmpty({ message: "Mật khẩu không được để trống." })
  @MinLength(8, { message: "Mật khẩu phải có ít nhất 8 ký tự." })
  password: string;

  @ApiProperty({ example: "John Doe", description: "User's full name" }) // <-- ADD THIS
  @IsNotEmpty({ message: "Tên không được để trống." })
  fullName: string;

  @ApiProperty({ example: "some-invitation-token", description: "Optional invitation token", required: false }) // <-- ADD THIS
  @IsOptional()
  @IsString()
  invitationToken?: string;
}

export class RegisterResponseDto {
  message: string;
}
