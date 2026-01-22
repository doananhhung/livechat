import {
  IsString,
  IsNotEmpty,
  Matches,
  MaxLength,
  IsOptional,
} from "class-validator";

export class CreateCannedResponseDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      "Shortcut can only contain letters, numbers, underscores, and dashes.",
  })
  @MaxLength(50)
  shortcut: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}

export class UpdateCannedResponseDto {
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      "Shortcut can only contain letters, numbers, underscores, and dashes.",
  })
  @MaxLength(50)
  shortcut?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  content?: string;
}
