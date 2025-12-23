import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for recovery code (backup code) authentication.
 * Recovery codes are typically 10+ characters, not 6-digit TOTP codes.
 */
export class RecoveryCodeDto {
  @ApiProperty({ example: "ABC123DEF456", description: "Recovery/backup code" })
  @IsString()
  @IsNotEmpty()
  @Length(6, 32) // Recovery codes can be 6-32 chars
  code: string;
}
