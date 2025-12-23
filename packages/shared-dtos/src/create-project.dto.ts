import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsFQDN,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from "@nestjs/swagger";

export class CreateProjectDto {
  @ApiProperty({ example: "My Awesome Project", description: "Name of the new project" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: ["example.com", "another.com"], description: "List of whitelisted domains (FQDNs only, no protocol)" })
  @IsArray()
  @ArrayMinSize(1)
  @IsFQDN({}, { each: true, message: "Domains must be valid hostnames (e.g., example.com) without protocols (http://)." })
  whitelistedDomains: string[];
}
