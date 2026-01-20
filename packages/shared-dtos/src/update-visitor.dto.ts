import { IsString, Length } from "class-validator";

export class UpdateVisitorDto {
  @IsString()
  @Length(1, 50, {
    message: "Display name must be between 1 and 50 characters long.",
  })
  displayName: string;
}
