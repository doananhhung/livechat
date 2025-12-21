import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from "@nestjs/swagger";

export class EmailChangeDto {
  @ApiProperty({ example: "new.email@example.com", description: "The new email address for the user" })
  @IsNotEmpty({ message: 'Email mới không được để trống.' })
  @IsEmail()
  newEmail: string;

  @ApiProperty({ example: "CurrentPassword123!", description: "The user's current password for verification" })
  @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống.' })
  password: string;
}
