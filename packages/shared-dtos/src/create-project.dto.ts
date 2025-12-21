import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsUrl,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from "@nestjs/swagger";

export class CreateProjectDto {
  @ApiProperty({ example: "My Awesome Project", description: "Name of the new project" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: ["https://example.com", "https://another.com"], description: "List of whitelisted domains for the project" })
  @IsArray()
  @ArrayMinSize(1)
  @IsUrl({}, { each: true })
  whitelistedDomains: string[];
}
