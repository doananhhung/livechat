import { IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserDto {
  @ApiProperty({ example: "Jane Doe", description: "User's full name", required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ example: "https://example.com/avatar.jpg", description: "URL to the user's avatar image", required: false })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiProperty({ example: "Asia/Ho_Chi_Minh", description: "User's timezone (e.g., 'America/New_York')", required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ example: "en-US", description: "User's preferred language (e.g., 'en-US')", required: false })
  @IsOptional()
  @IsString()
  language?: string;
}
