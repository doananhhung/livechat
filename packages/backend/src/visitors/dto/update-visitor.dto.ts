import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateVisitorDto {
  @IsString()
  @Length(1, 50, { message: 'Display name must be between 1 and 50 characters long.' })
  @ApiProperty({ description: 'The new display name for the visitor', minLength: 1, maxLength: 50 })
  displayName: string;
}
