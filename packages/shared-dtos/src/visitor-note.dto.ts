import { IsString, IsNotEmpty, MaxLength, IsOptional } from "class-validator";

export class CreateVisitorNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}

export class UpdateVisitorNoteDto {
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  content?: string;
}
